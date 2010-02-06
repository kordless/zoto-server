"""
plugins/SimplePayement.py

Author: Trey Stout
Date Added: Mon Jul 24 16:40:57 CDT 2006

Really stupid payment plugin that just logs info, this
is the bare minimum a payment handler should do
"""

## STD LIBS
from pprint import pprint, pformat
import time

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack
from PaymentPlugin import PaymentPlugin
import errors, aztk_config, validation

class SimplePayment(AZTKAPI, PaymentPlugin):
	enable_node = True

	def authorize_payment(username, amount):
		def handle_userid(result):
			if result[0] != 0:
				return "INVALID USERNAME: %s" % username

			d2 = self.app.api.users.get_info(result[1], result[1], '')
			d2.addCallback(handle_info)
			return d2

		def handle_info(user_info):
			self.log.info("handling payment of $%s for user %s" % (amount, username))
		d = self.app.api.users.get_user_id(username)
		d.addCallback(handle_userid)
		return d
		
