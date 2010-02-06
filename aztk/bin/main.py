#!/usr/bin/env python
"""
AZTK -- Asynchronus Zoto Tool Kit

This is the main script file that runs all of the zoto network backend.
"""

# make sure we have access to our libraries
import sys
import traceback
sys.path += ['/zoto/aztk', '/zoto/aztk/lib']

# set our umask so other members of the dev group get write acces to created files
import os
os.umask(10) 

# import all the goodies (aztk_main runs a lot of code on import)
import aztk_main

#---------------- WELCOME TO TWISTED DEFERRED MADNESS -----------------

# start the main server loop
aztk_main.base_log.debug("Starting Main Loop")
app = aztk_main.Application(sys.argv[1])
try:
	app.init_packages()
except Exception, ex:
	aztk_main.base_log.critical("Error Initializing Server [%s]" % str(ex))
	aztk_main.base_log.critical(traceback.format_exc())
	sys.exit(25)
app.main_loop()
