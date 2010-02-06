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
win32:TEMPLATE	= vcapp
unix:TEMPLATE	= app
macx:TEMPLATE	= app
LANGUAGE		= C++
TARGET			= zulu-cli

include (../common/global_qmake_config)

INCLUDEPATH		+= ../zulu-lib/include

CONFIG	+= console

SOURCES	+= ZCliApp.cpp \
			main.cpp

unix {
  UI_DIR = .ui
  MOC_DIR = .moc
  OBJECTS_DIR = .obj
}
