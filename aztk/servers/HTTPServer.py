"""
servers/HTTPServer.py

Author: Trey Stout & Josh Williams
Date Added: Thu Jun 29 17:25:29 CDT 2006

HTTP/HTTPS Web servers
"""

## STD LIBS
import random

## OUR LIBS
from AZTKServer import AZTKServer
import web

## 3RD PARTY LIBS
from twisted.internet import ssl
from nevow import appserver 

class HTTPServer(AZTKServer):
	"""
	This one instance uses the same NevowSite on two different ports to save 
	having a whole other server for essentially the same thing.
	"""
	enable_node = True

	def start(self):
		ip = self.app.cfg_setup.get("interfaces", self.app.host)
		site = appserver.NevowSite(web.htaccess(self.app, self.log))

		# base web server - listen on primary interface and localhost
		self.app.reactor.listenTCP(int(self._cfg_http_port), site, interface=ip)
		self.app.reactor.listenTCP(int(self._cfg_http_port), site, interface="localhost")
