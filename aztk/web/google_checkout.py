"""
dyn_pages/google_checkout.py

Author: 
Date Added: 

Handles communication with Google Checkout, both handling user signup/upgrade
posts from zoto and postbacks from Google.

"""

## STD LIBS
from xmlrpclib import Fault, loads
import traceback, pprint

## OUR LIBS
from json_plus import JSONPlus
import errors

## 3RD PARTY LIBS
from twisted.web import xmlrpc, server
from twisted.internet.defer import maybeDeferred
import simplejson

class google_checkout(xmlrpc.XMLRPC):

	def setup(self, app, log):
		self.app = app
		self.log = log

	def xmlrpc_help(self):
		return self._listFunctions()
		

	def get_request_body(self, request):
		"""
			return the content of the HTTP request as a string
		"""
		request.content.seek(0,0)
		return request.content.read()



	def handle_google_postback(self, request):
		return ''
	

	def handle_zoto_signup(self, request):
		return ''
	

	def handle_zoto_upgrade(self, request):
		return ''


	def render(self, request):
		"""
			render
			Handles the actual HTTP request.
		"""
		xml_packet = self.get_request_body(request)
		self.log.debug(xml_packet)
	
		
		
		
		host = request.getRequestHostName()
		#we only want to handle posts
		if request.method is not 'POST':
			
			self.log.debug("User-Agent tried to access google_checkout via %s  from  %s" % (request.method, host))
			#request.redirect(self, self.app.servers.httpserver._cfg_site_domain)
			#request.finish()	

			#not sure if we need to return here.
		else: 
			if 'google' in host :
				self.log.debug(self.get_request_body(request))
				pass
				
			else:
				#who's this freak trying to talk to us... 
				self.log.debug("google_checkout received a POST from unknown source: %s" %host)
				request.redirect()
				request.finish()
		
		
		
"""
GOOGLE POST CONTENT
<?xml version="1.0" encoding="UTF-8"?>
        <new-order-notification xmlns="http://checkout.google.com/schema/2" serial-number="6b725f52-c45c-4cae-b867-5e2faf247edc">
          <timestamp>2007-03-20T15:50:57.695Z</timestamp>
          <shopping-cart>
            <items>
              <item>
                <quantity>1</quantity>
                <unit-price currency="USD">49.95</unit-price>
                <item-name>$49.95 : Zoto PRO Subscription (2 year) </item-name>
                <item-description>5e0604ec3db16163fb7e5b43abaaa9b1</item-description>
              </item>
            </items>
          </shopping-cart>
          <order-adjustment>
            <merchant-codes />
            <total-tax currency="USD">0.0</total-tax>
            <adjustment-total currency="USD">0.0</adjustment-total>
          </order-adjustment>
          <google-order-number>832629577001727</google-order-number>
          <buyer-shipping-address>
            <email>kordless@gmail.com</email>
            <address1>12</address1>
            <address2></address2>
            <contact-name>Kord</contact-name>
            <company-name></company-name>
            <phone></phone>
            <fax></fax>
            <country-code>US</country-code>
            <city>Oklahoma City</city>
            <region>OK</region>
            <postal-code>73102</postal-code>
          </buyer-shipping-address>
          <buyer-billing-address>
            <email>kordless@gmail.com</email>
            <address1>12</address1>
            <address2></address2>
            <contact-name>Kord</contact-name>
            <company-name></company-name>
            <phone></phone>
            <fax></fax>
            <country-code>US</country-code>
            <city>Oklahoma City</city>
            <region>OK</region>
            <postal-code>73102</postal-code>
          </buyer-billing-address>
          <buyer-marketing-preferences>
            <email-allowed>true</email-allowed>
          </buyer-marketing-preferences>
          <order-total currency="USD">49.95</order-total>
          <fulfillment-order-state>NEW</fulfillment-order-state>
          <financial-order-state>REVIEWING</financial-order-state>
          <buyer-id>549303414902786</buyer-id>
        </new-order-notification>
		
		
<?xml version="1.0" encoding="UTF-8"?>
        <order-state-change-notification xmlns="http://checkout.google.com/schema/2" serial-number="ece47b9c-9207-4877-83d9-e8f5b518c799">
          <timestamp>2007-03-20T15:50:59.000Z</timestamp>
          <google-order-number>832629577001727</google-order-number>
          <new-fulfillment-order-state>NEW</new-fulfillment-order-state>
          <new-financial-order-state>CHARGEABLE</new-financial-order-state>
          <previous-fulfillment-order-state>NEW</previous-fulfillment-order-state>
          <previous-financial-order-state>REVIEWING</previous-financial-order-state>
        </order-state-change-notification>		
		
		
<?xml version="1.0" encoding="UTF-8"?>
        <risk-information-notification xmlns="http://checkout.google.com/schema/2" serial-number="e839f27e-dc9e-44ee-b0d5-22b72b05af58">
          <timestamp>2007-03-20T15:50:59.000Z</timestamp>
          <google-order-number>832629577001727</google-order-number>
          <risk-information>
            <billing-address>
              <contact-name>Kord</contact-name>
              <company-name></company-name>
              <email>kordless@gmail.com</email>
              <phone></phone>
              <fax></fax>
              <address1>12</address1>
              <address2></address2>
              <country-code>US</country-code>
              <city>Oklahoma City</city>
              <region>OK</region>
              <postal-code>73102</postal-code>
            </billing-address>
            <ip-address>68.15.112.125</ip-address>
            <eligible-for-protection>true</eligible-for-protection>
            <avs-response>Y</avs-response>
            <cvn-response>M</cvn-response>
            <partial-cc-number>1008</partial-cc-number>
            <buyer-account-age>3</buyer-account-age>
          </risk-information>
        </risk-information-notification>
		
		
<?xml version="1.0" encoding="UTF-8"?>
        <order-state-change-notification xmlns="http://checkout.google.com/schema/2" serial-number="609b9c87-c36d-4d66-8a8e-61a6cbb4e5ca">
          <timestamp>2007-03-20T15:51:01.000Z</timestamp>
          <google-order-number>832629577001727</google-order-number>
          <new-fulfillment-order-state>PROCESSING</new-fulfillment-order-state>
          <new-financial-order-state>CHARGED</new-financial-order-state>
          <previous-fulfillment-order-state>PROCESSING</previous-fulfillment-order-state>
          <previous-financial-order-state>CHARGING</previous-financial-order-state>
        </order-state-change-notification>
		
		
		


<?xml version="1.0" encoding="UTF-8"?>
        <charge-amount-notification xmlns="http://checkout.google.com/schema/2" serial-number="168ab0ea-5bab-4f66-aea6-bfc4b8c341e5">
          <timestamp>2007-03-20T15:51:01.000Z</timestamp>
          <google-order-number>832629577001727</google-order-number>
          <latest-charge-amount currency="USD">49.95</latest-charge-amount>
          <total-charge-amount currency="USD">49.95</total-charge-amount>
        </charge-amount-notification>

GOOGLE POST CONTENT

_type=new-order-notification&timestamp=2007-03-16T21%3A32%3A37.539Z&shopping-cart.items.item-1.quantity=1&shopping-cart.items.item-1.unit-price.currency=USD&shopping-cart.items.item-1.unit-price=29.95&shopping-cart.items.item-1.item-name=Some+Money&shopping-cart.items.item-1.item-description=First+account.&shopping-cart.items=shopping-cart.items.item-1&order-adjustment.total-tax.currency=USD&order-adjustment.total-tax=0.0&order-adjustment.adjustment-total=0.0&order-adjustment.adjustment-total.currency=USD&google-order-number=144526896677303&buyer-shipping-address.email=eric%40zoto.com&buyer-shipping-address.address1=fsadfasfd&buyer-shipping-address.address2=&buyer-shipping-address.contact-name=foo+bar&buyer-shipping-address.company-name=&buyer-shipping-address.phone=&buyer-shipping-address.fax=&buyer-shipping-address.country-code=US&buyer-shipping-address.city=safasdasf&buyer-shipping-address.region=OK&buyer-shipping-address.postal-code=73120&buyer-billing-address.email=eric%40zoto.com&buyer-billing-address.address1=fsadfasfd&buyer-billing-address.address2=&buyer-billing-address.contact-name=foo+bar&buyer-billing-address.company-name=&buyer-billing-address.phone=&buyer-billing-address.fax=&buyer-billing-address.country-code=US&buyer-billing-address.city=safasdasf&buyer-billing-address.region=OK&buyer-billing-address.postal-code=73120&buyer-marketing-preferences.email-allowed=true&order-total=29.95&order-total.currency=USD&fulfillment-order-state=NEW&financial-order-state=REVIEWING&buyer-id=470053085931019&serial-number=819b231c-9ca4-4aa6-8bbd-1ea95dfa3555

	_type=new-order-notification
	timestamp=2007-03-16T21%3A32%3A37.539Z
	shopping-cart.items.item-1.quantity=1
	shopping-cart.items.item-1.unit-price.currency=USD
	shopping-cart.items.item-1.unit-price=29.95
	shopping-cart.items.item-1.item-name=Some+Money
	shopping-cart.items.item-1.item-description=First+account.
	shopping-cart.items=shopping-cart.items.item-1
	order-adjustment.total-tax.currency=USD
	order-adjustment.total-tax=0.0
	order-adjustment.adjustment-total=0.0
	order-adjustment.adjustment-total.currency=USD
	google-order-number=144526896677303
	buyer-shipping-address.email=eric%40zoto.com
	buyer-shipping-address.address1=fsadfasfd
	buyer-shipping-address.address2=
	buyer-shipping-address.contact-name=foo+bar
	buyer-shipping-address.company-name=
	buyer-shipping-address.phone=
	buyer-shipping-address.fax=
	buyer-shipping-address.country-code=US
	buyer-shipping-address.city=safasdasf
	buyer-shipping-address.region=OK
	buyer-shipping-address.postal-code=73120
	buyer-billing-address.email=eric%40zoto.com
	buyer-billing-address.address1=fsadfasfd
	buyer-billing-address.address2=
	buyer-billing-address.contact-name=foo+bar
	buyer-billing-address.company-name=
	buyer-billing-address.phone=
	buyer-billing-address.fax=
	buyer-billing-address.country-code=US
	buyer-billing-address.city=safasdasf
	buyer-billing-address.region=OK
	buyer-billing-address.postal-code=73120
	buyer-marketing-preferences.email-allowed=true
	order-total=29.95
	order-total.currency=USD
	fulfillment-order-state=NEW
	financial-order-state=REVIEWING
	buyer-id=470053085931019
	serial-number=819b231c-9ca4-4aa6-8bbd-1ea95dfa3555






_type=order-state-change-notification&timestamp=2007-03-16T21%3A32%3A40.000Z&google-order-number=144526896677303&new-fulfillment-order-state=NEW&new-financial-order-state=CHARGEABLE&previous-fulfillment-order-state=NEW&previous-financial-order-state=REVIEWING&serial-number=63568046-bb3b-43b6-b0eb-44af58fb7d8b


_type=risk-information-notification&timestamp=2007-03-16T21%3A32%3A40.000Z&google-order-number=144526896677303&risk-information.billing-address.contact-name=foo+bar&risk-information.billing-address.company-name=&risk-information.billing-address.email=eric%40zoto.com&risk-information.billing-address.phone=&risk-information.billing-address.fax=&risk-information.billing-address.address1=fsadfasfd&risk-information.billing-address.address2=&risk-information.billing-address.country-code=US&risk-information.billing-address.city=safasdasf&risk-information.billing-address.region=OK&risk-information.billing-address.postal-code=73120&risk-information.ip-address=68.15.112.125&risk-information.eligible-for-protection=true&risk-information.avs-response=Y&risk-information.cvn-response=M&risk-information.partial-cc-number=1111&risk-information.buyer-account-age=1&serial-number=e04e5ca6-5a98-4937-80ef-d335677e298d


_type=order-state-change-notification&timestamp=2007-03-16T21%3A33%3A00.000Z&google-order-number=144526896677303&new-fulfillment-order-state=PROCESSING&new-financial-order-state=CHARGED&previous-fulfillment-order-state=PROCESSING&previous-financial-order-state=CHARGING&serial-number=277aa730-5663-4cee-aa40-ea53b90d219a


_type=charge-amount-notification&timestamp=2007-03-16T21%3A33%3A00.000Z&google-order-number=144526896677303&latest-charge-amount.currency=USD&latest-charge-amount=29.95&total-charge-amount.currency=USD&total-charge-amount=29.95&serial-number=be358e64-a926-4025-a23e-e0058be8136b


"""

