#!/usr/bin/python

import select
import socket
import string
import sys

import zsp_packets

#=======================================
# zsp_conn - Connection class
#=======================================
class zsp_conn:
	def __init__(self, sock):
		self.sock = sock
		self.ip = ""
		self.port = 0
		self.buffer = ""
		self.authenticated = False

	def fileno(self):
		return self.sock.fileno()

#========================================
# zsp_server
#
# Main processing class
#
#=========================================
class zsp_server:

	#======================================
	# __init__
	#
	# Class initialization
	#======================================
	def __init__(self, ip, port):
		self.listen_port = port
		self.listen_ip = ip
		self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		self.conn_list = {}
		self.listen = True

	#======================================
	# start
	#
	# Begin listening on the socket
	#======================================
	def start(self):
		bound = False
		while bound != True:
			try:
				self.sock.bind((self.listen_ip, self.listen_port))
				bound = True
			except socket.error, why:
				if why[0] == 98: # 98 = EINUSE
					self.listen_port = self.listen_port + 1
				else:
					raise socket.error, why

		self.sock.listen(5)

		try:
			self.message_loop()
		except KeyboardInterrupt:
			self.listen = False
			self.sock.close()
			for s in self.conn_list:
				s.sock.close()
		return

	#======================================
	# message_loop()
	#
	# Main processing logic
	#======================================
	def message_loop(self):

		print "waiting for incoming connections on port %d" % self.listen_port

		while self.listen == True:
			read_list = []
			read_list.append(self.sock.fileno())
			print "conn_list length => [%d]" % len(self.conn_list)
			if len(self.conn_list) > 0:
				for index in self.conn_list:
					conn = self.conn_list[index]
					read_list.append(conn.sock.fileno())

			(read_ready, write_ready, exc_ready) = select.select(read_list,
									[], [])

			for sock in read_ready:
				if sock == self.sock.fileno():
					try:
						self.new_connection()
					except IOError, why:
						print why
				else:
					#==========================================
					# An existing socket has some data waiting
					#==========================================
					conn = self.conn_list[sock]
					conn.buffer = conn.buffer + conn.sock.recv(1024)

					print "buffer length => [%d]" % len(conn.buffer)
					if len(conn.buffer) == 0:
						conn.sock.close();
						del self.conn_list[sock]
						continue
					elif len(conn.buffer) < 3:
						continue

					#=====================================
					# 
					header = zsp_packets.zsp_header()
					if header.parse(conn.buffer) < 0:
						print "Error parsing buffer"
						conn.sock.close()

					if conn.authenticated == False:
						if header.type != zsp_packets.ZSP_AUTH:
							print "Socket didn't send an AUTH packet first!"
							print "length      => [%d]" % header.length
							print "packet_type => [%c]" % header.type
							print "ZSP_AUTH       [%d]" % zsp_packets.ZSP_AUTH
							conn.sock.close()
							del self.conn_list[sock]

					if len(conn.buffer) < header.length:
						print "Not a full packet yet..."
						continue

					print "We've got a full packet!"

					print "packet type => [%d]" % header.type
					print "switch"
					if header.type == zsp_packets.ZSP_AUTH:
						self.process_auth(conn)
					elif header.type == zsp_packets.ZSP_VERSION:
						print "Calling process_version()"
						self.process_version(conn)
					elif header.type == zsp_packets.ZSP_DIMENSION:
						self.process_dimension(conn)
					elif header.type == zsp_packets.ZSP_FLAG:
						self.process_flag(conn)
					elif header.type == zsp_packets.ZSP_FILE:
						self.process_file(conn)
					elif header.type == zsp_packets.ZSP_QUIT:
						self.process_quit(conn)
						conn.sock.close()
						del self.conn_list[conn.sock.fileno()]

					print "Remaining buffer [%s]" % conn.buffer

	#======================================
	# new_connection()
	#
	# Accepts a new incoming connection
	#======================================
	def new_connection(self):
		(incoming, (ip, port)) = self.sock.accept()
		sock = zsp_conn(incoming)
		sock.ip = ip
		sock.port = port
		print "==============================="
		print "Accepted new connection"
		print "socket => [%d]" % sock.sock.fileno()
		print "ip     => [%s]" % sock.ip
		print "port   => [%d]" % sock.port
		self.conn_list[sock.sock.fileno()] = sock

	#======================================
	# process_auth()
	#
	# Incoming auth request
	#======================================
	def process_auth(self, conn):
		print "Processing auth"
		auth_packet		= zsp_packets.zsp_auth()
		auth_resp		= zsp_packets.zsp_auth_resp()

		error_code		= 0
		error_string	= ""

		buffer = auth_packet.parse(conn.buffer) # buffer now contains any leftover data

		# Validate the user
		#valid = validate_user(auth_packet.user_hash, auth_packet.pswd_hash)
		valid = True
		conn.authenticated = True

		if valid == True:
			print "Valid user"
			auth_resp.return_code = 110
			auth_resp.response = "USER OK"
		else:
			print "Invalid user"
			auth_resp.return_code = 111
			auth_resp.response = "USER OR PASSWORD INVALID"

		conn.sock.send(auth_resp.build())

		if auth_resp.return_code != 110:
			conn.sock.close()
			del self.conn_list[conn.sock.fileno()]

		conn.buffer = buffer

	def process_version(self, conn):
		print "Constructing version packet"
		version_packet	= zsp_packets.zsp_version()
		print "Constructing version response"
		version_resp	= zsp_packets.zsp_version_resp()

		print "parsing version packet"
		buffer = version_packet.parse(conn.buffer)

		conn.buffer = buffer
		print "Version length => [%d]" % version_packet.length
		
		version_resp.vers_maj = 0
		version_resp.vers_min = 1
		version_resp.vers_build = 4
		version_resp.comment = "Alpha test"

		print "Building outbound packet"
		conn.sock.send(version_resp.build())

	def process_dimension(self, conn):
		dimension_packet	= zsp_packets.zsp_dimension()
		dimension_resp		= zsp_packets.zsp_dimension_resp()

		buffer = dimension_packet.parse(conn.buffer)
		conn.buffer = buffer

		dimension_resp.thumb_width = 110
		dimension_resp.thumb_height = 220
		dimension_resp.medium_width = 330
		dimension_resp.medium_height = 440

		conn.sock.send(dimension_resp.build())

server = zsp_server("127.0.0.1", 8000)
server.start()

