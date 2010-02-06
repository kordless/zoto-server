"""
The primary file for starting and running the AZTK application. You should use
aztk_nanny to start and stop processes, however. aztk_nanny calls main.py. Both
of these are in /zoto/aztk/bin.

aztk_main.py
Trey Stout and Ken Kinder
2003-11-20
"""
import sys, time, os, traceback
import aztk_config


###############################################
## setup the logfiles before the big imports ##
###############################################
from twisted.python import log
from twisted.python import logfile

class FailureFileLogObserver(log.FileLogObserver):
	"""Logs big stupid errors"""
	def emit(self, eventDict):
		if eventDict:
			if eventDict.get('isError', 0):
				log.FileLogObserver.emit(self, eventDict)
		

class InternalFileLogObserver(log.FileLogObserver):
	"""Logs only the important stuff"""
	def emit(self, eventDict):
		if eventDict:
			if eventDict.has_key('log'):
				if eventDict['log'] != 'general':
					log.FileLogObserver.emit(self, eventDict)
			else:
				log.FileLogObserver.emit(self, eventDict)

class GeneralObserver(log.FileLogObserver):
	""" Logs messages from the apis """
	def emit(self, eventDict):
		self.timeFormat = "%Y/%m/%d %H:%M:%S"
		if eventDict:
			if eventDict.get('log') == "general":
				log.FileLogObserver.emit(self, eventDict)

log.startLoggingWithObserver(GeneralObserver(logfile.DailyLogFile("general-%s.log" % sys.argv[1], aztk_config.setup.get('paths', 'logs'))).emit, 0)
log.startLoggingWithObserver(InternalFileLogObserver(logfile.DailyLogFile("twisted-%s.log" % sys.argv[1], aztk_config.setup.get('paths', 'logs'))).emit, 1)
log.startLoggingWithObserver(FailureFileLogObserver(logfile.DailyLogFile("failures-%s.log" % sys.argv[1], aztk_config.setup.get('paths', 'logs'))).emit, 0)

###############################
## Generic Logging Interface ##
###############################
class Logger:
	"""
	Simple logging interface for user-defined log events
	This log won't catch automatic twisted events. That's what
	the other logs are for. This is just so we can have a decent
	idea of what's going on in the server
	"""
	def __init__(self, subsystem):
		self.subsystem = subsystem.upper()
		self.debug_logging = False

	def get_trace(self):
		"""
		Simple wrapper for logging messages for human consumption
		"""
		frame = sys._getframe(1)
		frame = frame.f_back # step back in the stack
		# where were we called from?
		lineno = frame.f_lineno
		filename = frame.f_code.co_filename
		method = frame.f_code.co_name

		# the filename and line number will be automatically appended to
		# log messages of warning, or critical levels
		return " [%s:%s:%s]" % (filename, lineno, method)
	
	def log(self, msg):
		""" General info that need to be logged (no trace info) Please use sparingly """
		log.msg(u"[INFO] %s".encode('utf8') % msg, log="general", system=self.subsystem)
	info = log
	
	def debug(self, msg):
		""" General purpose debug logging, can be turned on/off for each API/server """
		if self.debug_logging: log.msg(u"[DEBUG] %s".encode('utf8') % msg, log="general", system=self.subsystem)

	def warning(self, msg):
		""" For non-show stopper errors, will show trace info """
		msg = "%s" % msg + self.get_trace()
		log.msg("[WARN] %s".encode('utf8') % msg, log="general", system=self.subsystem)

	def critical(self, msg):
		""" Log a bad error (usually a show-stopper) """
		msg = "%s" % msg + self.get_trace()
		log.msg("[CRIT] %s".encode('utf8') % msg, log="general", system=self.subsystem)


###################################################################
## Make a logger for the base-level server (not the api/servers) ##
###################################################################
base_log = Logger("main")

##############
## Pid File ##
##############
pidfile = '%s/var/%s.pid' % (aztk_config.aztk_root, sys.argv[1])
if os.path.exists(pidfile):
	process_id = open(pidfile).read().strip().split("-")[0]
	if os.path.exists('/proc/%s' % process_id):
		base_log.critical("AZTK seems to already be running as pid: %s" % process_id)
		sys.exit(30)
	else:
		base_log.info("Removing stale PID file")
		os.remove(pidfile)
open(pidfile, 'w').write("%d-%d" % (os.getpid(), 2))


#####################################################
## Check to make sure the local MySQL server is up ##
#####################################################
open(pidfile, 'w').write("%d-%d" % (os.getpid(), 4))

###################
## Other Imports ##
###################
from twisted.python import threadable
from twisted.internet import reactor
from twisted.names import client
from AZTKServer import AZTKServer
from AZTKAPI import AZTKAPI
from InstancePackage import ServerInstancePackage, APIInstancePackage
import psycopg2

##################
## Main Imports ##
##################
try:
	import xmlrpclib, datetime, types, time, gc, random, sha, socket, version 
	import twisted, aztk_config, SimplePBProxy
	import api
	import plugins
	import servers
except Exception, msg:
	base_log.critical("Failed import(s) in aztk_main: %s" % msg)
	base_log.critical(traceback.format_exc())
	sys.exit(35)
base_log.debug("All libraries imported OK")
open(pidfile, 'w').write("%d-%d" % (os.getpid(), 5))

###################################
## Setup Special xmlrpc mappings ##
###################################
def dump_none(self, value, write):
	write("<value><string>")
	write(xmlrpclib.escape(''))
	write("</string></value>\n")

def dump_datetime(self, value, write):
	write("<value><string>")
	write(xmlrpclib.escape(str(value)))
	write("</string></value>\n")

def dump_number(self, value, write):
	# PHP can't handle values over 1073741824
	if int(value) > 1073741824:
		write("<value><string>")
		write(xmlrpclib.escape(str(value)))
		write("</string></value>\n")
	else:
		if type(value) is float:
			write('<value><double>%s</dobule></value>' % str(value))
		else:
			write('<value><int>%s</int></value>' % str(value))

xmlrpclib.Marshaller.dispatch[long] = dump_number
xmlrpclib.Marshaller.dispatch[int] = dump_number
xmlrpclib.Marshaller.dispatch[type(None)] = dump_none
xmlrpclib.Marshaller.dispatch[datetime.datetime] = dump_datetime
xmlrpclib.Marshaller.dispatch[datetime.date] = dump_datetime

##############################
## Setup Garbage Collection ##
##############################
gc.enable()

############################
## Random Seed Generation ##
############################
random.seed(sha.sha(str(time.time())).hexdigest())

#############################
## Setup Twisted Threading ##
#############################
threadable.init()
if aztk_config.setup.get("site", "environment") == "sandbox":
	reactor.suggestThreadPoolSize(3)
else:
	try:
		reactor.suggestThreadPoolSize(25)
	except Exception, ex:
		print Exception
		print ex
		sys.exit(1)

##################################
## Setup Threaded Name Resolver ##
##################################
reactor.installResolver(client.ThreadedResolver(reactor))

	

__version__ = "$Revision: 1.18 $"

class Application(object):
	"""
	This is the main application definition. All instances of an AZKT
	server will be started with this class.
	"""
	def __init__(self, profile):
		"""
		@param profile: Server profile as mentioned in install.cfg
		"""
		self.profile = profile
		
		self.start_time = time.time()
		self.version = version.version
		self.build = time.time()
		self.reactor = reactor
		
		self.init_load_config()
		self.log = Logger("app")
		self.init_discover()


	def init_packages(self):
		# give the app instance 1 local connection to the database for synchronous calls (mainly startup config)
		self.log.info("Creating Blocking DB Connection")
		#self.blocking_db_con = psycopg2.connect("host=localhost user=aztk dbname=aztk_core")
		db_host = aztk_config.setup.options('db_hosts')[0]
		self.blocking_db_con = psycopg2.connect("host=%s user=aztk dbname=aztk_core" % db_host)
		
		enabled_plugins = self._get_enabled_modules(plugins, AZTKAPI)
		self.plugins = APIInstancePackage(plugins, enabled_plugins, AZTKAPI, self)
		self._configure_package(self.plugins, enabled_plugins, 'plugins')

		enabled_apis = self._get_enabled_modules(api, AZTKAPI)
		self.api = APIInstancePackage(api, enabled_apis, AZTKAPI, self)
		self._configure_package(self.api, enabled_apis, 'api')

		enabled_servers = self._get_enabled_modules(servers, AZTKServer)
		self.servers = ServerInstancePackage(servers, enabled_servers, AZTKServer, self)
		self._configure_package(self.servers, enabled_servers, 'servers')

		self.log.info('Initializing API')
		self._start_instance_package(self.api, enabled_apis)
		self.log.info('Initializing Plugins')
		self._start_instance_package(self.plugins, enabled_plugins)
		self.log.info('Initializing Servers')
		self._start_instance_package(self.servers, enabled_servers)
		self._post_start_instance_packages([(self.api, enabled_apis), (self.plugins, enabled_plugins), (self.servers, enabled_servers)])
		self.log.info('Done')

	def init_load_config(self):
		"""
		Sets configuration stuff
		"""
		self.cfg_setup = aztk_config.setup
		self.cfg_services = aztk_config.services
	
	def init_discover(self):
		"""
		Figures out some basic stuff about the network.
		"""
		hostname = socket.gethostname()
		config_section = 'cluster.%s' % self.profile
		if not self.cfg_setup.has_section(config_section):
			raise RuntimeError, 'Server profile not configured: %s' % self.profile
		
		# only run the hostname check on non-sandbox installs
		if not self.cfg_setup.get("site", "environment") == "sandbox":
			if self.cfg_setup.get(config_section, 'host') != socket.gethostname():
				raise RuntimeError, 'Server profile does not match hostname: %s (hostname is %s)' % \
					(self.cfg_setup.get(config_section, 'host'), socket.gethostname())
	
		self.host = self.cfg_setup.get(config_section, 'host')
		self.role = self.cfg_setup.get(config_section, 'role')
		if self.role not in ('broker', 'node'):
			raise RuntimeError, 'Invalid role configured: %s' % self.role
		
		# Quick mailchecker test
		if self.profile == 'broker' and not os.path.exists('%s/inbox' % aztk_config.aztk_root):
			self.log.critical('You should link %s/inbox to the inbox. Broker aztk will not start until you create that link.\n\n' % aztk_config.aztk_root)
			sys.exit(0)

	def _get_enabled_modules(self, package, classObject):
		enabled = []
		for module in dir(package):
			object = getattr(package, module)
			if type(object) in (types.ClassType, types.TypeType) and \
			   issubclass(object, classObject):
				if hasattr(object, 'enable_%s' % self.role) and getattr(object, 'enable_%s' % self.role):
					enabled.append(module)
		return enabled
	
	def _configure_package(self, package, enabled_mods, prefix):
		for mod_name in enabled_mods:
			mod_name = mod_name.lower()
			mod = getattr(package, mod_name)
			mod.is_enabled = True
			for section in self.cfg_services.sections():
				if section == '%s.%s' % (prefix, mod_name):
					for key, value in self.cfg_services.items(section):
						if key.startswith("b_"):
							setattr(mod, '_cfg_%s' % key[2:], self.cfg_services.getboolean(section, key))
						if key.startswith("i_"):
							setattr(mod, '_cfg_%s' % key[2:], self.cfg_services.getint(section, key))
						if key.startswith("f_"):
							setattr(mod, '_cfg_%s' % key[2:], self.cfg_services.getfloat(section, key))
						else:
							setattr(mod, '_cfg_%s' % key, value)
	
	def _start_instance_package(self, package, enabled_mods):
		enabled_mods_copy = sorted(enabled_mods[:])
		started_mods = []

		#
		# Detect any circular dependencies
		def scan_deps(mod, parents):
			parents.append(mod)
			deps = getattr(package, mod.lower())._depends
			for d in deps:
				d = d.lower()
				if d in parents:
					self.log.critical("Circular dependency: [%s] depends on [%s] which ultimately depends on (%s)" % (mod, d, ', '.join(parents)))
					raise RuntimeError, "Circular dependency: [%s] depends on [%s] which ultimately depends on (%s)" % (mod, d, ', '.join(parents))
				scan_deps(d, parents)

		try:
			for mod in enabled_mods_copy:
				scan_deps(mod, [])
				reactor.addSystemEventTrigger('before', 'shutdown', getattr(package, mod.lower()).shutdown)
	
			while len(enabled_mods_copy) > 0:
				for mod in enabled_mods_copy:
					deps = getattr(package, mod.lower())._depends
					start = True
					for d in deps:
						if d.lower() not in started_mods: start = False
	
					if start:
						started_mods.append(mod.lower())
						enabled_mods_copy.remove(mod)
						start = time.time()
						try:
							mod_ref = getattr(package, mod.lower())
							mod_ref.log = Logger(mod)
							try:
								if mod_ref._cfg_debug_logging:
									mod_ref.debug_logging_enable()
							except:
								# no debug logging specified, defaults to false
								pass
							del(mod_ref)
						except:
							self.log.critical("Can't set a logger for %s" % mod.lower())
						getattr(package, mod.lower()).start()
						end = time.time()
						self.log.info('\t%-20s [OK: %0.2f]' % (mod, (end - start)))

		except Exception, ex:
			self.log.critical("INSTANCE-PACKAGE %s FAILED TO START: [%s]" % (package.__name__, str(ex)))
			self.log.critical(traceback.format_exc())
			raise RuntimeError, 'instance package [%s] failed to start: [%s]' % (package.__name__, str(ex))



	def _post_start_instance_packages(self, instances):
		self.log.info('Post-Starup Procedures')
		for p, mods in instances:
			try:
				for mod in mods:
					if hasattr(getattr(p, mod.lower()), 'post_start'):
						getattr(p, mod.lower()).post_start()
						self.log.info('\t%-20s [OK]' % (mod))
			except Exception, ex:
				self.log.critical("INSTANCE-PACKAGE %s FAILED TO POST-START: [%s]" % (p.__name__, str(ex)))
				raise RuntimeError, 'instance package [%s] failed to start: [%s]' % (p.__name__, str(ex))


	def main_loop(self):
		"""
		Starts the reactor.
		"""
		self.log.info('Entering Main Loop...')
		self.stats_time = 0
		pidfile = '%s/var/%s.pid' % (aztk_config.aztk_root, self.profile)
		open(pidfile, 'w').write("%d-%d" % (os.getpid(), 6))

		reactor.run()
		if hasattr(self, 'exit_code'):
			self.log.info("Exiting via signal: %s" % self.exit_code)
			sys.exit(self.exit_code)

