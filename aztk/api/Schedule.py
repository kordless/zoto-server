"""
API for managing a global cron-ish type schedule

Schedule.py
Trey Stout
2004-05-14
"""
## STD LIBS
from cStringIO import StringIO
import time, datetime, ConfigParser

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack
import errors

## 3RD PARTY LIBS
from twisted.internet.defer import maybeDeferred, Deferred, DeferredList

class Schedule(AZTKAPI):
	enable_node = True
	enable_image_server = True
	_depends = []

	def _start(self):
		pass

	start = _start

	@stack
	def post_start(self):
		"""
		Does nothing

		@return: Nothing
		@rtype: Nothing
		"""
		#self.load_config()
		pass
		
	@stack
	def load_config(self):
		"""
		Loads the initial schedule configuration.

		@return: Schedule
		@rtype: (deferred) list
		"""
		cfg = ConfigParser.ConfigParser()
		cfg.read('/zoto/aztk/etc/schedule.cfg')
		
		def act():
			valid_schedules = []
			deflist = []
			for section in cfg.sections():
				api_name, method = section.split('.')
				
				remark = cfg.get(section, 'remark')
				frequency = cfg.get(section, 'frequency')
				timeout = cfg.get(section, 'timeout')
				startup = cfg.getboolean(section, 'startup')
				shutdown = cfg.getboolean(section, 'shutdown')
				
				if cfg.has_option(section, 'enable_%s' % self.app.role) and cfg.getboolean(section, 'enable_%s' % self.app.role):
					if not hasattr(self.app.api, api_name):
						self.app.api.emailer.admin_notice(
							'Invalid Schedule',
							"The following scheduled task for %s is invalid (no such API enabled): %s" % \
							(self.app.profile, section))
						continue
					
					if not hasattr(getattr(self.app.api, api_name), method):
						self.app.api.emailer.admin_notice(
							'Invalid Schedule',
							"The following scheduled task for %s is invalid (no such method): %s" % \
							(self.app.profile, section))
						continue
		
					if frequency not in ('weekly', 'daily'):
						if ':' in frequency:
							minutes, seconds = frequency.split(':')
							frequency_seconds = (int(minutes)*60) + int(seconds)
						else:
							frequency_seconds = int(frequency)
						frequency = 'timed'
					else:
						frequency_seconds = 0
					
					if ':' in timeout:
						minutes, seconds = timeout.split(':')
						timeout = (int(minutes)*60) + int(seconds)
					else:
						timeout = int(timeout)
						
					if frequency_seconds > 0 and timeout > frequency_seconds:
						self.app.api.emailer.admin_notice(
							'Invalid Schedule',
							"The following scheduled task for %s is invalid (timeout is greater than frequency): %s" % \
							(self.app.profile, section))
						continue

					#
					# Work around nasty mysql bug
					if startup: startup_sql = 1
					else: startup_sql = 0
					
					if shutdown: shutdown_sql = 1
					else: shutdown_sql = 0
					
					valid_schedules.append('%s.%s' % (api_name, method))
					deflist.append(self.app.db.insert_update(
						"schedule",
						{'api': api_name,
						 'method': method,
						 'remark': remark,
						 'frequency': frequency,
						 'frequency_timed': frequency_seconds,
						 'timeout': timeout,
						 'on_startup': startup_sql,
						 'on_shutdown': shutdown_sql,
						 'status': 'normal',
						 'profile': self.app.profile},
						{'api': api_name,
						 'method': method,
						 'profile': self.app.profile},
						'zoto_schedule'))
			return DeferredList(deflist).addCallback(lambda _: delete_old(valid_schedules))
		def delete_old(valid_schedules):
			return self.app.db.query(
				"""
				delete from schedule where
				concat(api, '.', method) not in %s
				and profile = %%s
				""" % str(tuple(valid_schedules)), (self.app.profile,), database='zoto_schedule')
		d = act()
		d.addCallback(lambda _: self.app.reactor.callLater(5, self.cycle, True))
		return d
	
	@stack
	def shutdown(self):
		"""
		Calls L{cycle} to shut down

		@return: schedule ID
		@rtype: Integer
		"""
		return self.cycle(shutdown=True)
	
	@stack
	def cycle(self, startup=False, shutdown=False):
		"""
		Cycles the schedule and runs the queued tasks.

		@return: Schedule ID
		@rtype: Integer
		"""
		if startup:
			d = self.app.db.query(
				"""
				select
					schedule_id
				from
					schedule
				where
					profile = %s
					and on_startup = 1
				""", (self.app.profile,), database='zoto_schedule')
		elif shutdown:
			d = self.app.db.query(
				"""
				select
					schedule_id
				from
					schedule
				where
					profile = %s
					and on_shutdown = 1
				""", (self.app.profile,), database='zoto_schedule')
		else:
			now = datetime.datetime.now()
			if now.hour == 1:
				# Run daily tasks at 2:00 AM
				frequency = 'daily'
				length = 82800 # 23 hours
			elif now.weekday() == 1 and now.hour == 2:
				# Run weekly tasks early monday morning
				frequency = 'weekly'
				length = 511200 # 1 week minus two hours
			else:
				# Just do normal tasks
				frequency = 'timed'
			
			if frequency == 'timed':
				d = self.app.db.query(
					"""
					select
						schedule_id
					from
						schedule
					where
						profile = %s
						and frequency = %s
						and status != 'running'
						and ((not last_execution) or
							 (unix_timestamp(now()) - unix_timestamp(last_execution)) > frequency_timed)
					""", (self.app.profile, frequency), database='zoto_schedule')
			else:
				d = self.app.db.query(
					"""
					select
						schedule_id
					from
						schedule
					where
						profile = %s
						and frequency = %s
						and status != 'running'
						and ((not last_execution) or
							 (unix_timestamp(now()) - unix_timestamp(last_execution)) > %s)
					""", (self.app.profile, frequency, length), database='zoto_schedule')
		d.addCallback(result_mods.return_single_cells)
		
		def schedule_next(void, schedule_id):
			return self.execute_scheduled_task(schedule_id)
		
		def act(schedule_ids):
			d = Deferred()
			d.callback(0)
			for schedule_id in schedule_ids:
				d.addCallback(schedule_next, schedule_id)
			return d
		
		def recycle(void):
			self.app.reactor.callLater(30, self.cycle)
		d.addCallback(act)
		d.addCallback(recycle)
		return d
	
	@stack
	def admin_get_schedule(self):
		"""
		Gets schedule information
		
		@return: schedule information
		@rtype: Dictionary of Lists
		"""
		d = self.app.db.query(
			"""
			select
				schedule_id,
				api,
				method,
				remark,
				frequency,
				frequency_timed,
				timeout,
				on_startup,
				on_shutdown,
				last_execution,
				last_execution_time,
				status,
				error_message,
				profile
			from
				schedule
			where
				profile = %s
			order by api, method
			""", (self.app.profile,), database='zoto_schedule')
		d.addCallback(result_mods.map2dictlist, (
			'schedule_id',
			'api',
			'method',
			'remark',
			'frequency',
			'frequency_timed',
			'timeout',
			'on_startup',
			'on_shutdown',
			'last_execution',
			'last_execution_time',
			'status',
			'error_message',
			'profile'))
		return d
	
	@stack
	def execute_scheduled_task(self, schedule_id):
		"""
		Runs a scheduled task
		
		@param schedule_id: shedule id
		@type schedule_id: Integer
		
		@returns: execution state
		@rtype: Unknown
		"""
		state = {}
		d = self.app.db.query(
			"""
			select
				api,
				method,
				timeout
			from
				schedule
			where
				schedule_id = %s
			""", (schedule_id,), database='zoto_schedule')
		d.addCallback(result_mods.map2dict, ('api', 'method', 'timeout'))
		def prepare(task):
			d1 = self.app.db.query(
				"""
				update schedule set
					last_execution = now(),
					status = 'running'
				where schedule_id = %s
				""", (schedule_id,), database='zoto_schedule')
			state['task'] = task
			state['start_time'] = time.time()
			return d1
		
		def run_task(void):
			return maybeDeferred(getattr(getattr(self.app.api, state['task']['api']), state['task']['method']))
			
		def finish_success(results):
			state['finish_time'] = time.time()
			state['exec_time'] = state['finish_time'] - state['start_time']
			if state['exec_time'] > state['task']['timeout']:
				state['status'] = 'late'
			else:
				state['status'] = 'normal'
			state['errormsg'] = ''
			return record_state()

		def handle_async_error(astack, call):
                        # something else happened, and we caught it with @stack but we didn't plan on it here
                        traceback = astack.trace()
                        message = astack.message[0:4096] # trim it up to avoid slamming the logs with gobs of data

                        begin_box = '--------- SCHEDULE ERROR ----------'
                        end_box =   '-----------------------------------'
                        error_message = "\n%s\nCall:   %s\nError:  (%s) %s\n\n%s\n%s" % ( \
                                        begin_box,
                                        call,
                                        astack.exception,
                                        message,
                                        traceback,
                                        end_box)
			self.log.warning(error_message)
			return error_message

		def finish_failure(failure):
			call = "%s.%s" % (state['task']['api'], state['task']['method'])

			state['finish_time'] = time.time()
			state['exec_time'] = state['finish_time'] - state['start_time']
			state['status'] = 'error'

			self.log.debug("got an error while running %s" % call)

			if failure.check(errors.AsyncStack):
				state['errormsg'] = handle_async_error(failure.value, call)
			else:
				exception = failure.value
		                ex = errors.AsyncStack()
		                ex.push(self.handle_wtf)
		                if isinstance(exception, Failure):
		                        ex.message = exception.getErrorMessage()
		                        ex.value = exception.value
		                else:
		                        ex.message = str(exception)
		                        ex.value = exception
		              	state['errormsg'] = handle_async_error(ex, call)
			return record_state()

		def record_state():
			return self.app.db.query(
				"""
				update schedule set
					last_execution_time = %s,
					status = %s,
					error_message = %s
				where
					schedule_id = %s
				""", (state['exec_time'], state['status'], state['errormsg'], schedule_id),
				database='zoto_schedule')
		d.addCallback(prepare)
		d.addCallback(run_task)
		d.addCallback(finish_success)
		d.addErrback(finish_failure)
		return d
