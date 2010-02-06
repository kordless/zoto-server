"""
Universal AZTK Configuration Loader -- Useful for external scripts that need
access to configuration.

Ken Kinder
2004-12-7

Two objects are provided with this module:
	
	- setup, which contains parsed configuration values for install.cfg and
	  setup.cfg
	
	- services, which contains parsed configuration values for services.cfg

Example::
	
	# Figure out what port the nanny runs on.
	
	import aztk_config
	nanny_port = aztk_config.setup.getint('ports', 'nanny')

"""

import ConfigParser, os

setup = ConfigParser.ConfigParser()

setup.read('%s/../etc/install.cfg' % os.path.dirname(__file__))
setup.read('%s/../etc/setup.cfg' % os.path.dirname(__file__))
setup.read('%s/../etc/homepage_features.cfg' % os.path.dirname(__file__))

aztk_root = setup.get('paths', 'aztk')
		
services_defaults = {}
for section in setup.sections():
	for k,v in setup.items(section):
		services_defaults['%s.%s' % (section, k)] = v
		
services = ConfigParser.ConfigParser(services_defaults)
services.read('%s/../etc/services.cfg' % os.path.dirname(__file__))

def is_production():
	return setup.get('site', 'environment') not in ['sandbox', 'development']


__all__ = ['setup', 'services', 'aztk_root']
