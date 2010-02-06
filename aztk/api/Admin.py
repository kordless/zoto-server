"""
api/Admin.py

Author: Ken Kinder
Date Added: Who knows

Administrative API
"""
## STD LIBS
from crypt import crypt
from subprocess import Popen
import sys, gc, time, os, datetime, unittest

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack
import errors, validation, unittest

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList
from twisted.internet import threads, reactor
from twisted.web.xmlrpc import Proxy

class Admin(AZTKAPI):
	"""
	This handles administrative functions for maintenance (scheduling, node status, log purging, etc)
	"""
	enable_node = True
	enable_web = True
	enable_image_server = True
	
	_depends = ['network']
	
	@stack
	def stop_server(self):
		"""
		Stop AZTK. This should only be called by AZTKNanny.

		@return: Nothing
		@rtype: Nothing
		"""
		reactor.callLater(.5, self.app.reactor.stop)
		#self.app.reactor.stop()
	
	@stack
	def status(self):
		"""
		Returns "up" if the system is up. This is mostly for testing to see
		if the xmlrpc service is running.

		@return: up
		@rtype: String
		"""
		return 'Up'

	@stack
	def start_time(self):
		"""
		Returns the time the server was started in seconds.

		@return: Seconds since server was started.
		@rtype: Time
		"""
		return self.app.start_time

	@stack
	def uptime(self):
		"""
		Returns a string formatted uptime of the server.

		@return: uptime
		@rtype: String
		"""
		return str(datetime.timedelta(seconds = int(time.time() - self.app.start_time)))

	@stack
	def servertime(self):
		"""
		Gets the current Unix time on the server.

		@return: Current time
		@rtype: Time
		"""
		return (self.app.host, time.time())

	@stack
	def version(self):
		"""
		Not much right now -- mostly unused

		@return: Version
		@rtype: String
		"""
		return self.app.version

	@stack
	def rotate_logs(self):
		"""
		Rotates the log files. Runs once daily on schedule.

		@return: Nothing
		@rtype: Nothing
		"""
		os.system('find /zoto/aztk/log -not -mtime 48 -name "*.log.*" -exec rm -f {} \; &')

	@stack
	def build(self):
		"""
		Not much right now -- mostly unused

		@return: Unknown
		@rtype: Unknown
		"""
		return self.app.build
	
	@stack
	def get_schedules(self):
		"""
		Gets scheduled tasks

		@return: scheduled tasks
		@rtype: Dictionary
		"""
		def reformat(values):
			all_tasks = {}
			for server, tasks in values.items():
				for task in tasks:
					task_name = '%s.%s' % (task['api'], task['method'])
					if not all_tasks.has_key(task_name):
						all_tasks[task_name] = []
					all_tasks[task_name].append(task)
			all_tasks_sorted = []
			keys = all_tasks.keys()
			keys.sort()
			for key in keys:
				task_list = all_tasks[key]
				task_list.sort(lambda a, b: cmp(a['profile'], b['profile']))
				all_tasks_sorted.append({'task': key, 'instances': task_list})
			return all_tasks_sorted
		return self.app.api.network.call_remotes(self.app.api.network.interfaces.keys(), 'schedule.admin_get_schedule').addCallback(reformat)
	
	@stack
	def get_image_caches(self, audit_cache_size=False):
		"""
		See L{network.image_interfaces.keys()} and L{network.call_remotes()}
		
		@return: Unknown
		@rtype: Unknown
		"""
		return self.app.api.network.call_remotes(self.app.api.network.image_interfaces.keys(), 'cache.admin_info', audit_cache_size)

	@stack
	def get_uptimes(self):
		"""
		Gets node uptime

		@return: Unknown
		@rtype: Unknown
		"""
		return self.app.api.network.call_remotes(self.app.api.network.interfaces.keys(), 'admin.get_server_uptime')
	
	@stack
	def get_server_uptime(self):
		"""
		Gets server uptime

		@return: uptime
		@rtype: Unknown Integer
		"""
		def threadcrap():
			return os.popen('uptime').read().strip()
		return threads.deferToThread(threadcrap)
	
	@stack
	def set_gc_threshold(self, iter1, iter2, iter3):
		"""
		Unknown

		@param
		@type

		@return: Unknown
		@rtype: Unknown
		"""
		gc.set_threshold(iter1, iter2, iter3)
	
	@stack
	def get_gc_threshold(self):
		"""
		Unknown

		@return: Unknown
		@rtype: Unknwon
		"""
		return gc.get_threshold()
	
	@stack
	def gc_collect(self):
		"""
		Unknown

		@return: Unknown
		@rtype: Unknown
		"""
		gc.collect()
