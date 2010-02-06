/*============================================================================*
 *                                                                            *
 *	This file is part of the Zoto Software Suite.  							  *
 *																			  *
 *	Copyright (C) 2004, 2005 Zoto, Inc.  123 South Hudson, OKC, OK  73102	  *
 *																			  *
 *  This program is free software; you can redistribute it and/or modify      *
 *  it under the terms of the GNU General Public License as published by      *
 *  the Free Software Foundation; either version 2 of the License, or         *
 *  (at your option) any later version.                                       *
 *                                                                            *
 *  This program is distributed in the hope that it will be useful,           *
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of            *
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the             *
 *  GNU General Public License for more details.                              *
 *                                                                            *
 *  You should have received a copy of the GNU General Public License         *
 *  along with this program; if not, write to the Free Software               *
 *  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA *
 *                                                                            *
 *============================================================================*
 *                                  CHANGELOG                                 *
 *   Date       Description                                    Author         *
 * -----------  ---------------------------------------------  -------------- *
 *                                                                            *
 *============================================================================*/

/* System Headers */
#include <qapplication.h>

/* Local Headers */
#include "ZGuiApp.h"
#include "ZMainWin.h"

int main( int argc, char ** argv )
{
	/*
	 * Create the application object
	 */
	ZOTO::ZGuiApp vApp( argc, argv );

	/*
	 * Check for a currently running instance
	 */
	if (vApp.PreviousInstance(argc, argv))
		return 0;

	QWidget invis_window(NULL, INVIS_NAME);
	invis_window.setCaption(INVIS_NAME);

	/*
	 * If we're here, we were able to establish a connection to the
	 * Zoto server and the user has been authenticated.  Crank 'er up.
	 */
	long vFlags = Qt::WStyle_Customize | Qt::WStyle_SysMenu;
	bool vModal = false;
#if ZULU_PLATFORM != PLATFORM_MAC
	vModal = true;
	vFlags |= Qt::WStyle_Title | Qt::WStyle_Minimize;
#endif
	ZOTO::ZMainWin vMainWin(NULL, MAIN_NAME, vModal, vFlags);
	vMainWin.setCaption(vApp.GetWindowCaption());
	vMainWin.show();
	vApp.setMainWidget(&vMainWin);

	/*
	 * Load any files passed in on the command line.
	 */
	if (argc > 1)
	{
		for (int i = 1; i < argc; i++)
		{
			qDebug("%s::Adding autoload from command line: %s", __FILE__, argv[i]);
			vApp.AddFile(argv[i]);
		}
	}

	/*
	 * Try and initialize the application.  This
	 * will load all settings and fire up the ZSP
	 * client logic.  Also initializes all tracing logic.
	 */
	if (vApp.Initialize())
	{
		return vApp.exec();
	}
	else
	{
		return 0;
	}
}
