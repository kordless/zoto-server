#=============================================================================#
#                                                                             #
#  This file is part of the Zoto Software Suite.                              #
#                                                                             #
#  Copyright (C) 2004, 2005 Zoto, Inc.  123 South Hudson, OKC, OK  73102      #
#                                                                             #
#  This program is free software; you can redistribute it and/or modify       #
#  it under the terms of the GNU General Public License as published by       #
#  the Free Software Foundation; either version 2 of the License, or          #
#  (at your option) any later version.                                        #
#                                                                             #
#  This program is distributed in the hope that it will be useful,            #
#  but WITHOUT ANY WARRANTY; without even the implied warranty of             #
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the              #
#  GNU General Public License for more details.                               #
#                                                                             #
#  You should have received a copy of the GNU General Public License          #
#  along with this program; if not, write to the Free Software                #
#  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA  #
#                                                                             #
#=============================================================================#
#                                  CHANGELOG                                  #
#   Date       Description                                    Author          #
# -----------  ---------------------------------------------  --------------  #
#                                                                             #
#=============================================================================#

#===========================================================
# Template/target info
#===========================================================
win32:TEMPLATE	= vclib
unix:TEMPLATE	= lib
win32:TARGET	= zulu-lib
unix:TARGET		= zulu

#===========================================================
# Pull in global configuration
#===========================================================
include (../common/global_qmake_config)

#===========================================================
# Local defined
#===========================================================
CONFIG			+= staticlib

#============================================================
# Source/Headers
#============================================================
HEADERS	+= include/ZAuthPacket.h \
	include/ZAuthRespPacket.h \
	include/ZApp.h \
	include/ZClient.h \
	include/ZErrorPacket.h \
	include/ZFlagPacket.h \
	include/ZFlagRespPacket.h \
	include/ZHeader.h \
	include/ZLog.h \
	include/ZMD5Hasher.h \
	include/ZMutex.h \
	include/ZObject.h \
	include/ZPacket.h \
	include/ZSockAddr.h \
	include/ZSocket.h \
	include/ZVersPacket.h \
	include/ZVersRespPacket.h \
	include/ZFilePacket.h \
	include/ZFileRespPacket.h \
	include/ZDonePacket.h \
	include/ZDoneRespPacket.h \
	include/ZErrorBlock.h \
	include/ZEvents.h \
	include/ZUtils.h \
	include/timeval.h

SOURCES	+= src/ZAuthPacket.cpp \
	src/ZAuthRespPacket.cpp \
	src/ZApp.cpp \
	src/ZClient.cpp \
	src/ZErrorPacket.cpp \
	src/ZFlagPacket.cpp \
	src/ZFlagRespPacket.cpp \
	src/ZHeader.cpp \
	src/ZLog.cpp \
	src/ZMD5Hasher.cpp \
	src/ZObject.cpp \
	src/ZPacket.cpp \
	src/ZSocket.cpp \
	src/ZVersPacket.cpp \
	src/ZVersRespPacket.cpp \
	src/ZFilePacket.cpp \
	src/ZFileRespPacket.cpp \
	src/ZDonePacket.cpp \
	src/ZDoneRespPacket.cpp \
	src/ZUtils.cpp \
	src/ZErrorBlock.cpp

