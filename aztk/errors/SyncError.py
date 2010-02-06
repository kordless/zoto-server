"""
SyncError.py -- raised when syncing things between servers fails
"""

from AZTKError import AZTKError

class SyncError(AZTKError):
	description = "Usually denotes a breakdown in server to server synchronization"

