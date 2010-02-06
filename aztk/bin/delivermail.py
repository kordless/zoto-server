#!/usr/bin/python
"""
bin/devlivermail.py

Author: Trey Stout
Date Added: Thu Jan 26 18:11:13 CST 2006

Utility script that gets called periodically to deliver all pending mail in AZTK's outbox

Use the -v flag for more verbose output
"""

import smtplib, email, email.Utils, email.Parser, os, time, sys, ConfigParser, sys, codecs, signal
sys.path.append('/zoto/aztk/lib')
import aztk_config

MAIL_SERVER = aztk_config.services.get('api.emailer', 'smtp_server')
OUTBOX_PATH = '/zoto/aztk/var/mail/outbox'
FAILURE_PATH = '/zoto/aztk/var/mail/failures'
PID_FILE = '/zoto/aztk/var/mailer.pid'

class EmailDelivery(object):
	def __init__(self, filename):
		self.filename = filename
		self.path = os.path.join(OUTBOX_PATH, filename)
		if '-v' in sys.argv:
			print "processing %s" % self.filename
		try:
			#self._process()
			self._send()
		except Exception, val:
			self.error(val)
		if os.path.exists(self.path):
			os.remove(self.path)

	def _send(self):
		f = codecs.open(self.path, 'r', 'latin-1')
		parsed = email.Parser.Parser().parse(f, True) # parse for the TOs and CCs
		f.seek(0)
		self.msg = f.read() # get the actual unicode message
		f.close()

		tos = parsed.get_all('to', [])
		ccs = parsed.get_all('cc', [])
		self.recipients = []
		for address in email.Utils.getaddresses(tos + ccs):
			try:
				user, addr = address
			except:
				addr = address
			self.recipients.append(addr)
		if not self.recipients:
			raise ValueError, 'No recipients'

		signal.alarm(10)
		server = smtplib.SMTP(MAIL_SERVER)
		chunks = self.filename.split("_")
		if '-v' in sys.argv:
			print 'Sending %s message to %s using %s. %s chars in message' % (chunks[1], chunks[0], MAIL_SERVER, len(self.msg.encode('latin-1')))
		server.sendmail('no-reply@zoto.com', self.recipients, self.msg.encode('latin-1'))
		server.quit()
			
		
	def error(self, err):
		errtxt = "%s: %s\n" % (time.strftime('%Y-%m-%d %H:%M:%S'), err)
		print errtxt

		open(os.path.join(FAILURE_PATH, '%s.error' % self.filename), 'w').write(errtxt)
		os.system('mv %s %s' % (os.path.join(OUTBOX_PATH, self.filename), os.path.join(FAILURE_PATH, self.filename)))

# Check for PID files
if os.path.exists(PID_FILE):
	old_pid = open(PID_FILE).read().strip()
	if os.path.exists('/proc/%s' % old_pid):
		print "PID file shows still active [%s]!" % old_pid
		sys.exit(1)
	else:
		os.remove(PID_FILE)
open(PID_FILE, 'w').write(str(os.getpid()))

# setup a sigalarm handler
def handle_alarm(signum, frame):
	print "Signal received: %s" % signum
	sys.exit(2)
signal.signal(signal.SIGALRM, handle_alarm)

# Send pending messages
for msg in os.listdir(OUTBOX_PATH):
	if msg.endswith('.msg'):
		e = EmailDelivery(msg)

