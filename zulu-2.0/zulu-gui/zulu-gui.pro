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
TARGET			= zulu
macx:QMAKE_INFO_PLIST	= resources/Info.plist

include (../common/global_qmake_config)

INCLUDEPATH		+= ../zulu-lib/include

HEADERS	+= include/ZGuiApp.h \
	include/ZMainWin.h \
	include/ZPushButton.h \
	include/ZImageViewItem.h \
	include/ZImageThread.h \
	include/ZImageRequest.h \
	include/ZImageView.h \
	include/ZUploadView.h \
	include/ZURLLabel.h \
	include/ZProgressBar.h \
	include/ZCategoryView.h \
	include/ZCategoryItem.h \	
	include/ZPrefWin.h

win32:HEADERS += include/ZUpdater.h

SOURCES	+= src/main.cpp \
	src/ZMainWin.cpp \
	src/ZGuiApp.cpp \
	src/ZPushButton.cpp \
	src/ZImageThread.cpp \
	src/ZImageView.cpp \
	src/ZImageViewItem.cpp \
	src/ZUploadView.cpp \
	src/ZURLLabel.cpp \
	src/ZProgressBar.cpp \
	src/ZCategoryView.cpp \
	src/ZCategoryItem.cpp \
	src/ZPrefWin.cpp

win32:SOURCES += src/ZUpdater.cpp

IMAGES	= resources/images/loading.png \
	resources/images/top_buttons/add_disabled.png \
	resources/images/top_buttons/add_down.png \
	resources/images/top_buttons/add_up.png \
	resources/images/top_buttons/help_down.png \
	resources/images/top_buttons/help_up.png \
	resources/images/top_buttons/help_disabled.png \
	resources/images/top_buttons/info_disabled.png \
	resources/images/top_buttons/info_down.png \
	resources/images/top_buttons/info_up.png \
	resources/images/top_buttons/remove_disabled.png \
	resources/images/top_buttons/remove_down.png \
	resources/images/top_buttons/remove_up.png \
	resources/images/top_buttons/login_help_down.png \
	resources/images/top_buttons/login_help_up.png \
	resources/images/top_buttons/login_help_disabled.png \
	resources/images/blue_buttons/blue_disabled.png \
	resources/images/blue_buttons/blue_down.png \
	resources/images/blue_buttons/blue_up.png \
	resources/images/green_buttons/green_disabled.png \
	resources/images/green_buttons/green_down.png \
	resources/images/green_buttons/green_up.png \
	resources/images/zotologo.png \
	resources/images/zotologin.png \
	resources/images/zotologo_blue.png \
	resources/images/tile_blue.png

win32:RC_FILE = resources/zulu.rc
macx:RC_FILE = resources/application.icns

unix {
  UI_DIR = .ui
  MOC_DIR = .moc
  OBJECTS_DIR = .obj
}

macx:QMAKE_POST_LINK=./post_build.sh
