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
#if !defined(__ZCLIAPP_H_INCLUDED__)
#define __ZCLIAPP_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qstring.h>
#include <qfileinfo.h>
#include <vector>

/* Local Headers */
#include "ZApp.h"

/* Macros */

namespace ZOTO
{

/* file list defined as a type */
typedef std::vector<QFileInfo> UploadFiles;

enum ConsoleLevel
{
	CONS_DEBUG = -1,
	CONS_ALWAYS = 0,
	CONS_NORMAL,
	CONS_VERBOSE,
	CONS_VERBOSE2
};

/**
 *  @class      ZCliApp
 *  @brief      Command line version of our application.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class ZCliApp : public ZApp
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZCliApp(int& argc, char **argv);
	virtual ~ZCliApp();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	bool				Initialize(int& argc, char **argv);
	void				PrintSyntax();
	void				PrintConsole(ConsoleLevel pLevel, const char *pMessage, ...);
	void				Process();
	static void			Status(ZXferInfo *pInfo);

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/

protected:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/
	bool				ProcessArgs(int& argc, char **argv);
	void				LoadFiles(const char *pDir);
	void				DisplayError(ZRESULT pRetval);

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	bool				mRecurse;
	ConsoleLevel		mConsole;
	bool				mQuiet;
	UploadFiles			mFiles;
	QString				mDirectory;
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/

} // End Namespace

#endif // __ZCLIAPP_H_INCLUDED__

/* vi: set ts=4: */
