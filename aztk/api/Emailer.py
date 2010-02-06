"""
api/Emailer.py

Author: Trey Stout
Date Overhauled: Mon Jan 23 15:25:52 CST 2006

An encoding aware replacement for the old emailer api.
"""
## STD LIBS
from copy import copy
from email.Utils import parseaddr, formataddr, formatdate
from datetime import datetime
import os, time, re, codecs, random, smtplib

## OUR LIBS
from decorators import stack, zapi 
from AZTKAPI import AZTKAPI
from twisted.web import xmlrpc
import errors, aztk_config

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred
# none

class Emailer(AZTKAPI, xmlrpc.XMLRPC):
	"""
	Email api
	"""
	enable_node = True
	enable_image_server = True
	enable_web = True
	enable_zapi = True
	
	_depends = ['network']

	TEMPLATES_DIR = '%s/mail_templates' % aztk_config.aztk_root
	OUTBOX_DIR = '%s/var/mail/outbox' % aztk_config.aztk_root

	def start(self):
		"""
		@return: Nothing
		@rtype: Nothing
		"""
		self.app.emailer = self
		self.admin_reload_templates()

	@stack
	def admin_reload_templates(self):
		"""
		Reloads the system templates.
		
		@return: Nothing
		@rtype: Nothing
		"""
		self.templates = {}
		for lang in os.listdir(self.TEMPLATES_DIR):
			if os.path.isdir(os.path.join(self.TEMPLATES_DIR, lang)):
				self.templates[lang] = {}
				for fn in os.listdir(os.path.join(self.TEMPLATES_DIR, lang)):
					if fn.endswith('.tpl'):
						#f = open(os.path.join(self.TEMPLATES_DIR, lang, fn))
						f = codecs.open(os.path.join(self.TEMPLATES_DIR, lang, fn), 'r', 'utf-8')
						data = f.read()
						self.log.debug("template read in as type %s" % type(data))
						f.close()
						self.templates[lang][fn.split('.')[0]] = data

	@stack
	def send_support_mail(self, reporting_user, problem, description, reason, user_email):
		"""
		Sends an email to us, the zoto admins from the web-based support page.

		@param reporting_user: username of reporting user
		@type reporting_user: String

		@param problem: subject line of mail form
		@type problem: String

		@param description: body of mail form
		@type description: String
		
		@param reason: one of 4 radio buttons on form - love_us, bugs, support, feature
		@type reason: String
		
		@param user_email: email of reporting user
		@type user_email: String

		@return: nothing
		@rtype: nothing
		"""
		body = u"""
Username: %s
Email Address: %s

Reason: %s
Subject: %s

%s
   		""" % (reporting_user, user_email, reason, problem, description)

		msg = u'Mime-version: 1.0\n'
		msg += u'Date: %s\n' % formatdate(localtime=True)
		msg += u'To: %s\n' % formataddr((u'Zoto Website Support', u'website-support@zoto.com'))
		msg += u'From: %s\n' % formataddr((u'Website Support', 'website-support@zoto.com'))
		msg += u'Reply-To: %s\n' % formataddr((reporting_user, user_email))
		msg += u'Subject: SUPPORT MESSAGE FROM %s\n' % reporting_user
		msg += u'X-Mailer: Zoto AZTK\n'
		msg += u'Content-Type: text/plain; charset="utf-8"\n'
		msg += u'Content-Transfer-Encoding: 7bit\n'
		msg += u'\n'
		msg += body
			
		# strap a nice date format on the outgoing filename (it used to a timestamp)
		d = datetime(1,1,1)
		now = d.now().strftime("%d%b%y-%I%M%S%p")
		rand = random.randrange(1000, 9999)
		f = codecs.open(os.path.join(self.OUTBOX_DIR, "ADMIN_SUPPORT_MSG_%s_%s.msg" % (now, rand)), 'w', 'latin-1')
		f.write(msg)
		f.close()
		
		os.system('/usr/bin/python %s/bin/delivermail.py >> %s/delivermail.run.out 2>&1 &' % (aztk_config.aztk_root, aztk_config.setup.get('paths', 'logs')))

        @zapi("Sends support email to zoto admins.",
                [ ('problem', "Subject of message", basestring),
                        ('description', "Body of message.", basestring),
                        ('reason', "Reason for msg (radio btn)", basestring),
			('user_email', "Email of reporting user", basestring)],
                needs_auth=False)
	def xmlrpc_send_support_mail(self, info,  problem, description, reason, user_email):
		#for k in info:
		#	self.log.debug("%s : %s" % (k, info[k]))
		return self.send_support_mail(info['username'], problem, description, reason, user_email)

	@stack
	def find_block(self, block_name, text): 
		""" 
		find all text between start and end of block_name
		and return it

		@param block_name: name of block
		@type type: String

		@param text: text between blocks
		@type: List

		@return: L{text}
		@rtype: List
		"""
		regex = '{ %s }(.*?){ END%s }' % (block_name.upper(), block_name.upper())
		re_block = re.compile(regex, re.S | re.M)
		m = re_block.search(text)
		if m:
			text = m.group(1)
			if text[0] == "\n":
				text = text[1:]
			if text[-1] == "\n":
				text = text[0:-1]
			return unicode(text)
		else:
			raise ValueError, "can't find section %s" % block_name

	@stack
	def send(self, language, template, userid, to_address=None, **kwargs):
		"""
		Sends an email from the email templates on the system. Each language has its
		own set of email templates, located in
		/zoto/aztk/mail_templates/<language>/. This function will return before the
		message is actually delivered.
		
		@param language: What language to send outbound email in.
		@type language: String
		
		@param template: What template to send email for.
		@type template: String
		
		@param username: What username to lookup information to be sent to template
		@type username: String
	
		@param to_address: (optional) address email is going to, if nothing is provided address is acquired from username
		@type to_address: String
		
		@param kwargs: (optional) Any additional keyword arguments are passed to the template as variables.
		@type kwargs: String

		@return: nothing
		@rtype: nothing
		"""
		if not self.templates.has_key(language):
			self.log.warning("Tried to send mail with invalid language: '%s'" % language)
			raise ValueError, 'Invalid langauge: %s' % language
		if not self.templates[language].has_key(template):
			self.log.warning("Tried to send mail with invalid template: '%s'" % template)
			raise ValueError, 'Invalid template: %s' % template

		kwargs = copy(kwargs)
			
		def act(result):
			if result[0] != 0:
				raise errors.APIError, "Error resolving userid: %s" % userid
			userinfo = result[1]
			# setup all the info we need for this user and template
			if userinfo.get('first_name'):
				userinfo['first_name_cap'] = userinfo.get('first_name', '').title()
			else:
				userinfo['first_name_cap'] = userinfo['username']
			for k, v in userinfo.items():
				kwargs['user.%s' % k] = v
			kwargs['domain'] = unicode(self.app.cfg_setup.get('site', 'domain'))
			
			# get the message body
			message = self.templates[language][template] 

			try:
				mail_from = self.find_block("from", message)
				subject = self.find_block("subject", message)
				text_body = self.find_block("textbody", message)
				html_body = self.find_block("htmlbody", message)
			except ValueError, ex:
				self.log.warning("bad template %s: %s" % (template, ex))
				raise errors.APIError, "Can't send %s to user %s: %s" % (template, userinfo['username'], ex)
			
			if kwargs.has_key('from_email'):
				from_name = "%s %s" % (kwargs.get('from_first_name',''), kwargs.get('from_last_name',''))
				mail_from = formataddr((from_name, kwargs['from_email']))
				
			for body_charset in 'US-ASCII', 'UTF-8':
				self.log.debug("attempting to encode via %s" % body_charset)
				try:
					mail_from = mail_from % kwargs
					subject = subject % kwargs
					t_pre = text_body % kwargs
					h_pre = html_body % kwargs
					t_pre.encode(body_charset)
					h_pre.encode(body_charset)
					break
				except KeyError, ex:
					self.log.warning("keyword '%s' doesn't exist in template '%s'" % (ex, template))
					raise errors.APIError, "Can't send %s to user %s: %s" % (template, userinfo['username'], ex)
				except UnicodeError, ex:
					self.log.debug("failed to encode via %s: %s" % (body_charset, ex))
				except Exception, ex:
					raise errors.APIError, "WTF: %s" % ex

			self.log.debug("Yay we're going to send a mail via %s" % body_charset)

			if to_address:
				recipient_name = unicode("")
				if kwargs.has_key('to_first_name'):
					recipient_name += kwargs['to_first_name']
				if kwargs.has_key('to_last_name'):
					recipient_name += " "
					recipient_name += kwargs['to_last_name']
				recipient_addr = to_address
			else:
				recipient_name = unicode(userinfo['first_name_cap'])
				recipient_addr = unicode(userinfo['email'])

			## I tried and tried to get python's email module to make a valid multipart utf8 email, but it just
			## didn't ever work for all clients. So here you go. I built this from readin RFCs 2045 & 2046. 
			## Love, Trey (1/26/06)

			boundary = u'friedchickenhorsepigmanisefto_ibetthatnevershowsupinregularemail'

			msg = u'Mime-version: 1.0\n'
			msg += u'Date: %s\n' % formatdate(localtime=True)
			msg += u'To: %s\n' % formataddr((recipient_name, recipient_addr))
			msg += u'From: %s\n' % mail_from
			msg += u'Subject: %s\n' % subject
			msg += u'X-Mailer: Zoto AZTK\n'
			msg += u'Content-Type: Multipart/alternative; boundary="%s"\n' % boundary
			msg += u'Content-Transfer-Encoding: 7bit\n'
			
			msg += u'\n--%s\n' % boundary
			msg += u'Content-Type: text/plain; charset="utf-8"\n'
			msg += u'Content-Transfer-Encoding: 7bit\n'
			msg += u'\n'
			msg += t_pre
			
			msg += u'\n--%s\n' % boundary
			msg += u'Content-Type: text/html; charset="utf-8"\n'
			msg += u'Content-Transfer-Encoding: 7bit\n'
			msg += u'\n'
			msg += h_pre
			msg += u'\n--%s--\n\n' % boundary

			# strap a nice date format on the outgoing filename (it used to a timestamp)
			d = datetime(1,1,1)
			now = d.now().strftime("%d%b%y-%I%M%S%p")
			rand = random.randrange(1000, 9999)
			f = codecs.open(os.path.join(self.OUTBOX_DIR, "%s_%s_%s_%s.msg" % (userinfo['username'], template, now, rand)), 'w', 'latin-1')
			f.write(msg)
			f.close()

			os.system('/usr/bin/python %s/bin/delivermail.py >> %s/delivermail-%s.run.out 2>&1 &' % (aztk_config.aztk_root, aztk_config.setup.get('paths', 'logs'), self.app.host))

		d = self.app.api.users.get_info(userid, userid)
		d.addCallback(act)
		return d

	@stack
	def create_bulk(self, subject, message_plain, message_html, criteria):
		"""
		Sends out a bulk email to the recipients specified by criteria.

                @param subject: Subject line of the email.
                @type subject: String

                @param message_plain: Text of the email.
                @type message: String

                @param message_html: HTML of the email.
                @type message: String
                
		@param criteria: Limiting critera used to determine the subset of users who are to receive the email.  
		    Can contain the following elements:
			- username
			- email
			- first_name
			- last_name
			- account_type
			- account_status
			- activated
                @type criteria: Dictionary

		@return: nothing
		@rtype: nothing
		"""
		return self.app.api.network.call_broker('bulkemailer.create', subject, message_plain, message_html, criteria)

	@stack
	def start_bulk(self, batch_id):
		"""
		@param batch_id: id of bulkemailer batch
		@type batch_id: Integer

		@returns: result of start_batch()
		@rtype: (deferred) mixed
		"""
		self.log.debug("start_bulk called")
		d = self.app.api.network.call_broker('bulkemailer.start_batch', batch_id)

		def act(result):
			self.log.debug("resulg of start_batch() was %s" % result)
			return result

		d.addCallback(act)
		return d

	@stack
	def stop_bulk(self, batch_id):
		"""
		@param batch_id: id of bulkemailer batch
		@type batch_id: Integer

		@returns: result of stop_batch()
		@rtype: (deferred) mixed
		"""
		self.log.debug("stop_bulk(%s) called" % batch_id)
		return self.app.api.network.call_broker('bulkemailer.stop_batch', batch_id)
	
	@stack
	def cancel_bulk(self, batch_id):
		"""
		@param batch_id: id of bulkemailer batch
		@type batch_id: Integer

		@returns: result of cancel_batch()
		@rtype: (deferred) mixed
		"""
		self.log.debug("cancel_bulk() called.")
		return self.app.api.network.call_broker('bulkemailer.cancel_batch', batch_id)

	@stack
	def get_bulk_list(self):
		"""
		Calls L{Network.call_broker}
		Gets a bulkemail list

		@return: bulk e-mail ist
		@rtype: Unknown
		"""
		return self.app.api.network.call_broker('bulkemailer.get_list')

	@stack
	def get_bulk_info(self, batch_id, inc_users=True):
		"""
		Calls L{Network.call_broker}

		@param batch_id: Batch Identifier
		@type batch_id: Integer

		@return: Unknown
		@rtype: Unknown
		"""
		return self.app.api.network.call_broker('bulkemailer.get_info', batch_id, inc_users)

	def admin_notice(self, subject, notice, mobile_update=False, force_send=False):
		"""
		Unknown

		@param
		@type

		@return: Nothing
		@rtype: Nothing
		"""
		#return (0, "sent")
		admin_emails = ['kord@zoto.com', 'josh@zoto.com', 'kara@zoto.com']
		#if mobile_update:
			#admin_emails.append('4055359871@cingularME.com')
		fromaddr = "aztk@%s" % aztk_config.setup.get('site', 'domain')
		msg = "From: %s\r\nTo: %s\r\n" % (fromaddr, ", ".join(admin_emails))
		msg += "Subject: %s\r\n\r\n" % subject
		msg += notice
		server = smtplib.SMTP(aztk_config.setup.get('servers', "mail_server"))
		server.sendmail(fromaddr, admin_emails, msg)
		server.quit()
		return (0, "sent")

	
