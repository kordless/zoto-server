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
#if !defined(__ZPLATFORM_H_INCLUDED__)
#define __ZPLATFORM_H_INCLUDED__

/* System Headers */

/* Local Headers */

/* Macros */

#define PLATFORM_WINDOWS	1
#define PLATFORM_MAC		2
#define PLATFORM_LINUX		3

//==========================================//
//     SIMPLE PLATFORM-SPECIFIC STUFF		//
//==========================================//
#if defined(__WIN32__) || defined(_WIN32)

#define ZULU_PLATFORM	PLATFORM_WINDOWS
#if defined(ZULU_DLL)
#define _ZuluExport
#elif defined(ZULU_STATIC)
#define _ZuluExport
#else
#define _ZuluExport
#endif
#define vsnprintf	_vsnprintf

#elif defined(__APPLE_CC__)

#define ZULU_PLATFORM	PLATFORM_MAC
#define _ZuluExport

#else

#define ZULU_PLATFORM	PLATFORM_LINUX
#define _ZuluExport

#endif

#endif // __ZPLATFORM_H_INCLUDED__
