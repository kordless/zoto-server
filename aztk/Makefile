#
# ZOTO AZTK Makefile
#

#
# Dist cleans out everything
distclean:
	clean
	cleanlogs
	cleanvar
	cleanmail

#
# Clean removes the backup files and python object files
clean: 	cleanlogs
	@find -name "*.pyc" -exec rm -f {} \;
	@find -name "*.pyo" -exec rm -f {} \;
	@find -name "*~*" -exec rm -f {} \;
	@find -name "*.bak" -exec rm -f {} \;
	@find -name "#*" -exec rm -f {} \;
	@find -name ".#*" -exec rm -f {} \;
	@find -name "*.log.*" -exec rm -f {} \;
	@find -name "\.*swp" -exec rm -f {} \;
	@find -name "Thumbs.d*" -exec rm -f {} \;

# Removes logs
cleanlogs:
	@bin/clean_logs.sh

# Removes temporary var entries
cleanvar:
	if [ -f var/hosts_map ]; then
		cp var/hosts_map var/hosts_map.backup
	fi
	rm var/hosts_map
	rm var/*.pid

# Cleans out pending email
cleanmail:
	rm var/failures/*
	rm var/outbox/*

lang:
	@servers/site_root/translate.py
