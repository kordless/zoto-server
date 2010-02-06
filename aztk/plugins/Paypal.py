"""
plugins/Paypal.py

Author: Trey Stout
Date Added: Mon Jul 24 15:29:48 CDT 2006

New interface to the same old shit...
"""

## STD LIBS
from md5 import md5
from datetime import date, datetime
from xml.dom import minidom
from pprint import pprint, pformat
from math import floor
import time

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack
from PaymentPlugin import PaymentPlugin
import errors, aztk_config, validation

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList
from twisted.internet import ssl
from twisted.web import client
import SOAPpy

class Paypal(AZTKAPI, PaymentPlugin):
	enable_node = True

	def start(self):
		self.log.info("start called on paypal plugin")
		if aztk_config.setup.get('site', 'environment') in ['sandbox', 'development', 'staging']:
			self.log.info("using sandbox info for paypal")
			self.host = self._cfg_sandbox_host
			self.port = self._cfg_sandbox_port
			self.url = self._cfg_sandbox_url
			self.api_username = self._cfg_sandbox_username
			self.api_password = self._cfg_sandbox_password
			self.private_ssl_key = self._cfg_sandbox_private_key_file
			self.public_ssl_key = self._cfg_sandbox_public_key_file
		else:
			self.log.info("using production info for paypal")
			self.host = self._cfg_production_host
			self.port = self._cfg_production_port
			self.url = self._cfg_production_url
			self.api_username = self._cfg_production_username
			self.api_password = self._cfg_production_password
			self.private_ssl_key = self._cfg_production_private_key_file
			self.public_ssl_key = self._cfg_production_public_key_file

	@stack
	def random_txn_id(self):
		from random import shuffle
		import string
		chunks = list(string.ascii_uppercase+string.digits)
		shuffle(chunks)
		return "FAKE_%s" % ''.join(chunks[0:12])

	@stack
	def _encode_for_shock_and_awe(self, user_info):
		new_dict = {}
		for key, value in user_info.items():
			if isinstance(value, (str, unicode)):
				new_dict[key] = value.encode('utf-8')
			else:
				new_dict[key] = value
		return new_dict

	@stack
	def authorize_payment(self, user_info):
		"""
		run a payment across to paypal's SOAP API
		"""
		self.check_data(user_info)
		user_info = self._encode_for_shock_and_awe(user_info)
		self.log.info("running payment with this data: %s" % pformat(user_info))


		if aztk_config.setup.get('site', 'environment') in ['sandbox', 'development', 'staging']:
			## we can't use the sandbox unless someone actually logs into the sandbox website on paypal
			## so just return a bunch of bogus crap
			self.log.info("Returning dummy data")
			return (0, {
					'transaction_id': self.random_txn_id(),
					'username': user_info['username'],
					'amount': '29.95',
					'avs_code': 'X',
					'cvv2_code': 'M',
					'processing_node': self.app.host,
				})

		def handle_result(result):
			r = SOAPpy.parseSOAP(result)
			if r.DoDirectPaymentResponse.Ack == "Success":
				self.log.info(" - ")
				self.log.info("Received success from PayPal for %s" % (user_info['username']) )
				self.log.info("%s" % result)
				
				payment_info = {
					'transaction_id': r.DoDirectPaymentResponse.TransactionID,
					'username': user_info['username'],
					'amount': r.DoDirectPaymentResponse.Amount,
					'avs_code': r.DoDirectPaymentResponse.AVSCode,
					'cvv2_code': r.DoDirectPaymentResponse.CVV2Code,
					'processing_node': self.app.host,
					}
				return (0, payment_info)
			else:
				self.log.info(" - ")
				if isinstance(r.DoDirectPaymentResponse.Errors, (list, tuple)):
					error_code = r.DoDirectPaymentResponse.Errors[0].ErrorCode
					long_message = r.DoDirectPaymentResponse.Errors[0].LongMessage
				else:
					error_code = r.DoDirectPaymentResponse.Errors.ErrorCode
					long_message = r.DoDirectPaymentResponse.Errors.LongMessage
				self.log.info("Did NOT receive success from PayPal: %s" % long_message)
				self.log.info("INFO: %s, %s" % (user_info['username'], self.app.host))
				self.log.info("%s" % result)
				
				return (1, "%s: %s" % (error_code, long_message))

		def handle_fail(fail):
			self.log.warning("Failed processing with PayPal: %s" % fail.getErrorMessage())
			return (1, fail.getErrorMessage())

		user_info['api_username'] = self.api_username
		user_info['api_password'] = self.api_password
		user_info['client_ip'] = '127.0.0.69'

		body = self.direct_payment_body % user_info
		self.log.info("BODY\n\n%s\n\n" % body)

		try:
			context  = ssl.DefaultOpenSSLContextFactory(self.private_ssl_key, self.public_ssl_key)
			factory = client.HTTPClientFactory('https://%s%s' % (self.host, self.url), "POST", str(body), timeout=self._cfg_timeout, agent='Zoto AZTK2')
		except Exception, ex:
			self.log.warning("Failed to build SSL connection [%s]" % ex)
			d = Deferred()
			d.callback((1, 'Failed to build SSL connection [%s]' % ex))
			return d

		d = factory.deferred
		d.addCallback(handle_result)
		d.addErrback(handle_fail)
		self.app.reactor.connectSSL(self.host, self.port, factory, context)
		return d



	direct_payment_body = """
		<?xml version="1.0" encoding="UTF-8"?>
		
		<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
		 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
		 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
		 xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"
		 xmlns:ns4="urn:ebay:apis:eBLBaseComponents"
		 SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
		<SOAP-ENV:Header>
		
		<RequesterCredentials xmlns="urn:ebay:api:PayPalAPI" SOAP-ENV:actor="http://schemas.xmlsoap.org/soap/actor/next" SOAP-ENV:mustUnderstand="1">
			<ns4:Credentials xmlns:ebl="urn:ebay:apis:eBLBaseComponents">
				<ns4:Username xsi:type="xsd:string">%(api_username)s</ns4:Username>
				<ns4:Password xsi:type="xsd:string">%(api_password)s</ns4:Password>
				<ns4:Subject xsi:type="xsd:string"></ns4:Subject>
			</ns4:Credentials>
		</RequesterCredentials>
		</SOAP-ENV:Header>
		<SOAP-ENV:Body>
		
		<DoDirectPaymentReq xmlns="urn:ebay:api:PayPalAPI">
		<DoDirectPaymentRequest>
		
		<ns4:Version xsi:type="xsd:string">2.1</ns4:Version>
		<ns4:DoDirectPaymentRequestDetails xmlns="urn:ebay:apis:eBLBaseComponents">
		<PaymentAction>Sale</PaymentAction>
		<PaymentDetails>
			<OrderTotal xsi:type="xsd:string" currencyID="USD">%(cost)s</OrderTotal>
			<OrderDescription xsi:type="xsd:string">%(product_title)s</OrderDescription>
			<Custom xsi:type="xsd:string">%(username)s</Custom>
		</PaymentDetails>
		<CreditCard>
			<CreditCardType>%(card_type)s</CreditCardType>
			<CreditCardNumber xsi:type="xsd:string">%(card_number)s</CreditCardNumber>
			<ExpMonth xsi:type="xsd:int">%(card_expire_month)s</ExpMonth>
			<ExpYear xsi:type="xsd:int">%(card_expire_year)s</ExpYear>
			<CVV2 xsi:type="xsd:string">%(cvv2_code)s</CVV2>
			<CardOwner>
				<Payer>%(email)s</Payer>
				<PayerName>
					<FirstName>%(first_name)s</FirstName>
					<LastName>%(last_name)s</LastName>
				</PayerName>
				<Address>
					<Name xsi:type="xsd:string">Primary</Name>
					<Street1 xsi:type="xsd:string">%(address1)s</Street1>
					<Street2 xsi:type="xsd:string">%(address2)s</Street2>
					<CityName xsi:type="xsd:string">%(city)s</CityName>
					<StateOrProvince xsi:type="xsd:string">%(state)s</StateOrProvince>
					<Country xsi:type="xsd:string">%(country)s</Country>
					<PostalCode xsi:type="xsd:string">%(zip)s</PostalCode>
				</Address>
			</CardOwner>
		</CreditCard>
		<IPAddress xsi:type="xsd:string">%(client_ip)s</IPAddress>
		</ns4:DoDirectPaymentRequestDetails>
		</DoDirectPaymentRequest>
		</DoDirectPaymentReq>
		</SOAP-ENV:Body>
		</SOAP-ENV:Envelope>
	"""
