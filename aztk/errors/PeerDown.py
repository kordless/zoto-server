"""
PeerDown.py -- Peer Down Error

Ken Kinder
2004-05-07
"""

from AZTKError import AZTKError

class PeerDown(AZTKError):
	code = 4000
	description = "AZTK Peer Down"
