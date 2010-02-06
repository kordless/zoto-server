__name__ = "plugins"

try:
	from SimplePayment import SimplePayment
	from Paypal import Paypal
	from Qoop import Qoop
except Exception, msg:
	import traceback
	traceback.print_exc()
	raise Exception, "something didn't make it into: %s" % msg
