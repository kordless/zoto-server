try:
	from beta_blogger import beta_blogger
	from flickr import flickr
except Exception, ex:
	import traceback
	traceback.print_exc()
	raise Exception, "Unable to import publish target: %s" % ex
