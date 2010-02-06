#!/usr/bin/python

from distutils.core import setup, Extension

module1 = Extension('zsp_packets',
	include_dirs = ['../common'],
	sources = [
			"zsp_packets.c",
			"zsp_header.c",
			"zsp_auth.c",
			"zsp_auth_resp.c",
			"zsp_version.c",
			"zsp_version_resp.c",
			"zsp_file.c",
			"zsp_file_resp.c",
			"zsp_flag.c",
			"zsp_flag_resp.c",
			"zsp_done.c",
			"zsp_done_resp.c",
			"zsp_error.c"
	],
	define_macros = [('PYTHON_MODULE', '1')])

setup (name = 'zsp_packets',
	version = '1.0',
	description = 'Zulu Protocol packet handling',
	author = 'Josh Williams',
	ext_modules = [module1])

#setup(name="zsp_packets", version="1.0",
#	ext_modules=[
#		Extension("zsp_packets", [
#			"zsp_packets.c",
#			"zsp_header.c",
#			"zsp_auth.c",
#			"zsp_auth_resp.c",
#			"zsp_version.c",
#			"zsp_version_resp.c",
#			"zsp_file.c",
#			"zsp_file_resp.c",
#			"zsp_flag.c",
#			"zsp_flag_resp.c",
#			"zsp_done.c",
#			"zsp_done_resp.c",
#			"zsp_error.c"]
#		)
#	])
