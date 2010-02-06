from twisted.python import usage
from ConfigParser import ConfigParser
from AZTKServer import AZTKServer
import Image, ImageFile, sys, errors, validation, pprint, md5, time, socket, zsp_packets
from twisted.internet.protocol import Factory
from twisted.internet.app import Application
from twisted.internet import defer, reactor
from twisted.protocols import basic
from twisted.protocols import policies
from cStringIO import StringIO
from display_sizes import display_sizes
import traceback

class ZSP(basic.LineReceiver, policies.TimeoutMixin):
	"""
	Connection Protocol
	"""
	TIMEOUT = 60 #seconds

	def connectionMade(self):
		"""
		This is called once per instance when a client has connected to us.
		It sets up the timeout for this connection, and defines the available commands

		@return: Nothing
		@rtype: Nothing
		"""
		# get current version information for Zulu client
		self.major = int(self.factory.app.servers.zspserver._cfg_version_major)
		self.minor = int(self.factory.app.servers.zspserver._cfg_version_minor)
		self.build = int(self.factory.app.servers.zspserver._cfg_version_build)
		self.tag   = str(self.factory.app.servers.zspserver._cfg_version_tag)
		self.storing = False

		# get a local reference to the ZSP server's log instance
		self.log = self.factory.log
		
		self.bin = {
			"buffer": StringIO(),
			"bytes_in_buffer": 0,
			"bytes_wanted": 3,
			}
		self.action_list = []
		self.setTimeout(self.TIMEOUT)
		self.header = zsp_packets.zsp_header()

		remote = self.transport.getPeer()
		self.log.debug("got a connection from %s:%s [%s]" % (remote.host, remote.port, remote.type))
		self.setRawMode()

		##remote_server = self.transport.getPeer()
		## self.factory.app.servers.zspserver.log.info("Received a connection from %s. Authenticating..." % remote_server[1])

		self.die = False # they are in good standing so far, if we determine not to talk to them (True) kill connection
		self.sync_list = [] # a list of approved files (from FLAG requests)
		self.file = {} # a dict with info for the file ready to be received or currently receiving (from FILE requests)
		
	def connectionLost(self, reason="not sure"):
		"""
		This is called once per connection, when the socket has closed (for any reason)

		@param reason: reason for disconnection
		@type reason: String

		@return: Nothing
		@rtype: Nothing
		"""
		self.setTimeout(None)
		## self.factory.app.servers.zspserver.log.info("Lost Connection: %s" % reason.getErrorMessage())
		try:
			self.log.debug("Lost Connection: %s" % reason.getErrorMessage())
		except:
			self.log.debug("Lost Connection: %s" % reason)


	def timeoutConnection(self):
		"""
		Called when the client times out for some reason

		@return: Nothing
		@rtype: Nothing
		"""
		self.setTimeout(None)
		self.factory.app.servers.zspserver.log.info("Client Timed out. Later, sucker.")

	def send(self, string):
		"""
		Simple method for sending a string to the client.
		It tacks on the line terminator for you.

		@param string: the message to send to the client
		@type string: string

		@return: Nothing
		@rtype: Nothing
		"""
		self.transport.write(str(string))
		
	def rawDataReceived(self, data):
		"""
		This is used after the protocol mode has been switched from Line to Raw. 
		L{do_FILE()} switches the mode to raw. This mode does not trim
		line terminators from the incoming data

		Data is stacked up here, until the buffer reaches the size limit defined for
		this file in the ITEM and FILE requests. Once the buffer hits its limit, this
		method will call L{do_DONE()} and reset the protocol to line mode

		@param data: raw data
		@type: String

		@return: Nothing
		@rtype: Nothing
		"""
		self.resetTimeout()

		if self.die:
			self.transport.loseConnection("TEST")
			return

		if len(self.file.keys()) > 0:
			# we have a file to receive...
			if self.file["bytes_received"] >= self.file["filesize"]:
				# we have the whole file, let the normal buffer get the next request
				# should be a DONE packet...
				pass
			else:
				if len(data) + self.file["bytes_received"] > self.file["filesize"]:
					# we got too much data, roll the buffer back a bit
					remainder = self.file["filesize"] - self.file["bytes_received"]
					assert remainder > 0
					
					partial_packet = data[0:remainder]
					data = data[remainder:]
					self.file["bytes_received"] += len(partial_packet)
					self.file["buffer"].write(partial_packet)
				else:
					self.file["bytes_received"] += len(data)
					self.file["buffer"].write(data)
					return

		self.bin["buffer"].write(data)
		self.bin["bytes_in_buffer"] = len(self.bin["buffer"].getvalue())
		
		if self.bin["bytes_in_buffer"] >= self.bin["bytes_wanted"]:
			try:
				self.header.parse(self.bin["buffer"].getvalue())
			except Exception, ex:
				# if for any reason this doesn't work the client is sending crap
				# cut them off and close connection
				self.transport.loseConnection('OUT OF SYNC')
				return

			self.bin["bytes_wanted"] = self.header.length
			if self.bin["bytes_in_buffer"] >= self.header.length:
				d = False
				if self.header.type == zsp_packets.ZSP_AUTH:
					d = self.do_AUTH()
				elif self.header.type == zsp_packets.ZSP_VERSION:
					d = self.do_VERSION()
				elif self.header.type == zsp_packets.ZSP_FLAG:
					d = self.do_FLAG()
				elif self.header.type == zsp_packets.ZSP_FILE:
					d = self.do_FILE()
				elif self.header.type == zsp_packets.ZSP_DONE:
					d = self.do_DONE()
				else:
					error = zsp_packets.zsp_error()
					error.error_code = 500
					error.error_string = "Unknown Packet Request"
					self.send(error.build())
					self.transport.loseConnection()
				# send the response
				if d: d.addCallback(self.send)

	def do_HEARTBEAT(self):
		"""
		Sends a heartbeat packet to the client, maintaining the connection.
		"""
		if self.storing:
			self.log.debug("sending a heartbeat packet to the client")
			packet = zsp_packets.zsp_heartbeat()
			self.send(packet.build())
			self.factory.app.reactor.callLater(2, self.do_HEARTBEAT)
			
	def do_AUTH(self):
		"""
		Checks to see if a user is authorized

		@return: response object
		@rtype: response object
		"""
		packet = zsp_packets.zsp_auth()
		resp = zsp_packets.zsp_auth_resp()
		error = zsp_packets.zsp_error()

		# buffer now contains any leftover data
		buffer = packet.parse(self.bin["buffer"].getvalue())
		self.bin["buffer"] = StringIO()
		self.bin["buffer"].write(buffer)
		self.bin["bytes_wanted"] = 3

		# really auth the user here...
		def handle_user_id(result):
			if result[0] != 0:
				resp.return_code = zsp_packets.ZSP_AUTH_BAD
				resp.response = "USERNAME OR PASSWORD INVALID"
				self.die = True

			self.userid = result[1]
			d_user = self.factory.app.api.users.get_info(self.userid, self.userid)
			d_user.addCallback(print_user)
			return d_user
		
		def print_user(result):
			if result[0] != 0:
				resp.return_code = zsp_packets.ZSP_AUTH_BAD
				resp.response = "USERNAME OR PASSWORD INVALID"
				self.die = True

			if not result[1]:
				resp.return_code = zsp_packets.ZSP_AUTH_BAD
				resp.response = "USERNAME OR PASSWORD INVALID"
				self.die = True

			self.user_info = result[1]

			if self.user_info['password'] == packet.pswd_hash:
				self.log.debug("user authed as %s" % packet.user_name)
				self.username = packet.user_name
				resp.return_code = zsp_packets.ZSP_AUTH_OK
				resp.response = "USER OK"
			else:
				self.log.debug("couldn't auth %s" % (packet.username))
				resp.return_code = zsp_packets.ZSP_AUTH_BAD
				resp.response = "USERNAME OR PASSWORD INVALID"
				self.die = True

		def bad_auth(reason):
			self.log.debug("bad auth maybe a not found? %s" % reason)
			error.error_code = 500
			error.error_string = "INTERNAL SERVER ERROR"
			self.die = True
			return error.build()

		db_d = self.factory.app.api.users.get_user_id(packet.user_name)
		db_d.addCallback(handle_user_id)
		db_d.addErrback(bad_auth)
		db_d.addCallback(lambda _: resp.build())
		
		return db_d

	def do_VERSION(self):
		"""
		Checks the version of the client

		@return: response
		@rtype: (deferred) response object
		"""
		packet = zsp_packets.zsp_version()
		resp = zsp_packets.zsp_version_resp()
		# buffer now contains any leftover data
		buffer = packet.parse(self.bin["buffer"].getvalue())
		self.bin["buffer"] = StringIO()
		self.bin["buffer"].write(buffer)
		self.bin["bytes_wanted"] = 3
		
		client_version = "%s.%s.%s" % (packet.vers_maj, packet.vers_min, packet.vers_build)

		if self.factory.app.servers.zspserver.cfg.has_option("versions", client_version):
			response = self.factory.app.servers.zspserver.cfg.getint("versions", client_version)
		else:
			response = 0

		if response == 410:
			# they're ok
			resp.return_code = zsp_packets.ZSP_VERS_GOOD
			resp.comment = "VERSION OK [%s]" % socket.gethostname()
		elif response == 415:
			# newer version is available, but still ok
			resp.return_code = zsp_packets.ZSP_VERS_OLD
			resp.comment = "%s.%s.%s %s" % (self.major, self.minor, self.build, self.tag)
		elif response == 420:
			# obsolete, forced update
			resp.return_code = zsp_packets.ZSP_VERS_BAD
			resp.comment = "%s.%s.%s %s" % (self.major, self.minor, self.build, self.tag)
			self.die = True
		elif response == 425:
			# obsolete, show error dialog (no auto-update)
			resp.return_code = zsp_packets.ZSP_VERS_FUBAR
			resp.comment = "%s.%s.%s %s" % (self.major, self.minor, self.build, self.tag)
			self.die = True
		elif response == -1:
			# drop connection
			self.log.debug("unknown version")
			self.transport.loseConnection("")
			self.die = True
			return None
		else:
			self.factory.app.log.warning("client version %s tried to connect, but isn't in the config file" % client_version)
			self.log.warning("someone connected with version %s which isn't in the config file" % client_version)
			# drop connection
			self.transport.loseConnection("")
			self.die = True
			return None

		d = defer.Deferred()
		d.addCallback(lambda _: resp.build())
		d.callback(0)
		return d


	def do_FLAG(self):
		"""
		foo
		"""
		packet = zsp_packets.zsp_flag()
		resp = zsp_packets.zsp_flag_resp()
		error = zsp_packets.zsp_error()
		# buffer now contains any leftover data
		buffer = packet.parse(self.bin["buffer"].getvalue())
		self.bin["buffer"] = StringIO()
		self.bin["buffer"].write(buffer)
		self.bin["bytes_wanted"] = 3

		try:
			checksum = packet.image_id
			filesize = packet.image_size
			filetype = packet.image_format
			filename = packet.image_name
			filedate = packet.image_date
		except:
			# we couldn't get the right info from the packet...
			error.error_code = 314
			error.error_string = "Malformed FLAG request"
		
		if error.error_code:
			d = defer.Deferred()
			d.addCallback(lambda _: error.build())
			d.callback(0)
			return d
		else:
			resp.image_id = checksum
			self.sync_list.append(checksum)

			d_flags = self.factory.app.api.images.image_exists(checksum)
			def check_exists(exists):
				if exists:
					self.log.debug("Image [%s] already uploaded" % checksum)
					resp.image_needed = 0
					self.storing = True
					self.do_HEARTBEAT()
					d_set = self.factory.app.api.images.set_user_image(self.userid, checksum, filename, 'ZULU Client', '', '')
					d_set.addCallback(check_set_success)
					return d_set
				else:
					resp.image_needed = 1

			def check_set_success(result):
				self.storing = False
				if result[0] != 0:
					raise Exception(result[1])
					
			d_flags.addCallback(check_exists)
			d_flags.addCallback(lambda _: resp.build())
			return d_flags

	def do_FILE(self):
		"""
		foo
		"""
		packet = zsp_packets.zsp_file()
		resp = zsp_packets.zsp_file_resp()
		# buffer now contains any leftover data
		buffer = packet.parse(self.bin["buffer"].getvalue())
		self.bin["buffer"] = StringIO()
		self.bin["buffer"].write(buffer)
		self.bin["bytes_wanted"] = 3
		error = zsp_packets.zsp_error()

		try:
			image_id = packet.image_id
			filetype = packet.image_format
			filesize = packet.image_size
			filedate = packet.image_date
			filename = packet.image_name
		except:
			# we couldn't get the right info from the packet...
			error.error_code = zsp_packets.ZSP_FILE_BAD
			error.error_string = "Malformed FILE request"

		if image_id not in self.sync_list:
			error.error_code = zsp_packets.ZSP_FILE_NO_FLAG
			error.error_string = "image %s was not approved via FLAG request" % image_id
			
		# setup a struct for the incoming file
		self.file = {
						"image_id": image_id,
						"buffer": StringIO(),
						"filename": filename,
						"filedate": filedate,
						"filesize": filesize,
						"bytes_received": 0,
					}
		#pprint.pprint(self.file)
		d = defer.Deferred()
		if error.error_code:
			d.addCallback(lambda _: error.build())
		else:
			resp.return_code = zsp_packets.ZSP_FILE_OK
			resp.image_id = image_id
			resp.return_string = "FILE OK" 
			d.addCallback(lambda _: resp.build())
		d.callback(0)
		return d
			

	def do_DONE(self):
		"""
		DONT FORGET TO CLEAR self.sync_list and self.files!

		@return: Unknown
		@rtype: Unknown
		"""
		packet = zsp_packets.zsp_done()
		resp = zsp_packets.zsp_done_resp()
		# buffer now contains any leftover data
		buffer = packet.parse(self.bin["buffer"].getvalue())
		binary = self.file['buffer']
		binary.seek(0)
		self.bin["buffer"] = StringIO()
		self.bin["buffer"].write(buffer)
		self.bin["bytes_wanted"] = 3
		error = zsp_packets.zsp_error()

		checksum = md5.md5(binary.getvalue()).hexdigest()
		if checksum != self.file["image_id"]:
			error.error_code = zsp_packets.ZSP_DONE_BAD_SUM
			error.error_string = "CHECKSUM MISMATCH"
			
		try:
			parser = ImageFile.Parser()
			parser.feed(binary.getvalue())
			img = parser.close()
		except IOError, e: 
			self.factory.app.servers.zspserver.log.critical("Image couldn't be parsed %s" % e)
			error.error_code = zsp_packets.ZSP_DONE_BAD_SYNC
			error.error_string = "FILE OUT OF SYNC"
		try:
			img.verify()
		except: 
			self.factory.app.servers.zspserver.log.critical("Decoded Image is corrupted")
			error.error_code = zsp_packets.ZSP_DONE_BAD_SYNC2
			error.error_string = "FILE OUT OF SYNC"

		try:
			image = Image.open(binary)
		except (TypeError, IOError, ValueError):
			self.log.warning("Image can't be loaded: %s [%d bytes]" % (checksum, len(binary.getvalue())))
			error.error_code = zsp_packets.ZSP_DONE_CORRUPT
			error.error_string = "UNSUPPORTED/CORRUPT FILE"
		try:
			exif = validation.exifdata(image._getexif())
		except:
			exif = {}
		if not exif: 
			exif = {}
		if exif: 
			has_exif = 1
		else: 
			has_exif = 0

		if error.error_code:
			d = defer.Deferred()
			d.callback(error.build())
			return d
		
		def worked(result):
			if result[0] == 0:
				self.log.debug("Successfully stored image")
				resp.return_code = zsp_packets.ZSP_DONE_OK
				resp.return_string = "FILE SYNCHRONIZED OK"
				self.sync_list.remove(self.file["image_id"])
				self.file = {}
				self.storing = False
				return resp.build()
			else:
				raise Exception(result[1])

		def failed(failure):
			stack = failure.value
			self.log.warning("file not inserted: %s %s\n%s" % (stack.exception, stack.message, stack.trace()))
			resp.return_code = zsp_packets.ZSP_DONE_BAD_WRITE
			#resp.return_string = "FILE ALREADY EXISTS ON SERVER"
			resp.return_string = failure.getErrorMessage()
			# dont remove from the sync list incase they want to retry
			self.file = {}
			return error.build()

		self.storing = True
		self.do_HEARTBEAT()
		d_insert = self.factory.app.api.images.add(
			self.userid, self.file["filename"], binary.getvalue(), \
			'ZULU Client', '', '')
		d_insert.addCallback(worked)
		d_insert.addErrback(failed)
		return d_insert

	def do_QUIT(self):
		"""
		The client calls this command when they are exiting. As a courtesy,
		tell the client goodbye.
		
		@return: Nothing
		@rtype: Nothing
		"""
		d.callback("190 GOODBYE")
		self.transport.loseConnection()


class ZSPFactory(Factory):

	protocol = ZSP

	def __init__(self, application, log):
		"""
		Start the factory with out given protocol

		@param application: our reference to the running app (so we can use the DB and API)
		@type application: L{Application}

		@param log: a reference to the ZSP server's log instance
		@type log: L{Logger} instance (see lib/aztk_main.py)

		@return: Nothing
		@rtype: Nothing
		"""
		self.app = application
		self.log = log

class ZSPServer(AZTKServer):
	enable_broker = False
	enable_node = True
	
	def start(self):
		"""
		Starts L{ZSPFactory}, reactor and configuration
		"""
		self.cfg = ConfigParser()
		#TODO: NO HARDCODED PATHS!
		self.cfg.read("/zoto/aztk/etc/uploader_versions.cfg")
		factory = ZSPFactory(self.app, self.log)
		ip = self.app.cfg_setup.get("interfaces", self.app.host)
		self.app.reactor.listenTCP(int(self._cfg_port), factory, interface=ip)
