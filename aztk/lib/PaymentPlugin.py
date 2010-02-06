import errors

class PaymentPlugin:
	"""
	Simple interface for plugins that handle payments. Your payment plugins 
	should extend this class, overriding these simple methods
	"""
	payment_plugin = True

	def authorize_payment(self, username, ammount):
		"""
		username should be looked up to get all pertinent payment info
		"""
		return 1

	def test_payment(self, ammount):
		"""
		This method should try to pay against a sandbox environment. It
		should perform all normal verification and processing but not
		really commit the payment
		"""
		return 1

	def check_data(self, user_info):
		keys = ['username', 'email', 'first_name', 'last_name',
			'card_number', 'card_type', 'card_expire_month', 
			'card_expire_year', 'cvv2_code', 'address1', 'address2', 
			'city', 'state', 'country', 'zip']
		for key in keys:
			if key not in user_info.keys():
				self.log.warning("user_info does not contain required key %s" % key)
				raise errors.APIError, "user_info missing [%s]" % key
