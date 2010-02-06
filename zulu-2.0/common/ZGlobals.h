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
 * 06-Jul-2005	Bumped version number to 2.5.2.				   Josh Williams  *
 *                                                                            *
 *============================================================================*/
#if !defined(__ZGLOBALS_H_INCLUDED__)
#define __ZGLOBALS_H_INCLUDED__

#include "ZPlatform.h"

#ifndef PYTHON_MODULE
#include <typeinfo>

template <class T>
T ZMAX(T a, T b)
{
	return (a > b ? a : b);
}

template <class T>
T ZMIN(T a, T b)
{
	return (a < b ? a : b);
}
#endif

#define ZOTO_VERS_MAJ		2
#define ZOTO_VERS_MIN		5
#define ZOTO_VERS_BUILD		4
#define ZSP_HOST			"zoto.com"
#define ZSP_PORT			35001
#define ZAPI_HOST			"zoto.com"
#define ZAPI_PORT			80
#define ZAPI_PATH			"/RPC2/"
#define ZOTO_HELP_URL		"http://www.zoto.com/general/help/"
#define ZOTO_CAT_URL		"http://%s.zoto.com/user/force_edit_tags"
#define ZOTO_PSWD_URL		"http://www.zoto.com/general/login/forgot"
#define ZOTO_DOWNLOAD_URL	"http://www.zoto.com/general/downloads"

/* Return codes */
/** AUTH **/
#define ZSP_AUTH_OK			110
#define ZSP_AUTH_BAD		111

/** VERSION **/
#define	ZSP_VERS_GOOD		410
#define ZSP_VERS_OLD		415
#define ZSP_VERS_BAD		420
#define ZSP_VERS_FUBAR		425

/** FILE **/
#define ZSP_FILE_OK			300
#define ZSP_FILE_NO_FLAG	301
#define ZSP_FILE_BAD		304

/** DONE **/
#define ZSP_DONE_OK			350
#define ZSP_DONE_BAD_SUM	351
#define ZSP_DONE_BAD_SYNC	352
#define ZSP_DONE_BAD_SYNC2	353
#define ZSP_DONE_CORRUPT	354
#define ZSP_DONE_BAD_WRITE	355


#define MUTEX_NAME			"ZULU_MUTEX"
#define INVIS_NAME			"ZULU_INVIS_WIN"
#define LOGIN_NAME			"Zoto Sign In"
#define MAIN_NAME			"Zoto Uploader"

#endif // __ZGLOBALS_H_INCLUDED__

/* vi: set ts=4: */
