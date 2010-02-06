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
#if !defined(__ZMUTEX_H_INCLUDED__)
#define __ZMUTEX_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#if ZULU_PLATFORM == PLATFORM_WINDOWS
#include <windows.h>
#elif ZULU_PLATFORM == PLATFORM_MAC || ZULU_PLATFORM == PLATFORM_LINUX
#include <pthread.h>
#else
#error "Platform undefined"
#endif

/* Local Headers */

/* Macros */

namespace ZOTO
{

class _ZuluExport ZMutex
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
    ZMutex(void);
	virtual ~ZMutex() {}

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
    void				Lock(void);
    void				Unlock(void);

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

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
#if ZULU_PLATFORM == PLATFORM_WINDOWS
    CRITICAL_SECTION	m_lock;
#elif ZULU_PLATFORM == PLATFORM_MAC || ZULU_PLATFORM == PLATFORM_LINUX
    pthread_mutex_t		m_lock;
#endif
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
/**
 *	Default constructor.
 */
inline
ZMutex::ZMutex()
{
#if ZULU_PLATFORM == PLATFORM_WINDOWS
	InitializeCriticalSection(&m_lock);
#elif ZULU_PLATFORM == PLATFORM_MAC || ZULU_PLATFORM == PLATFORM_LINUX
	pthread_mutex_init(&m_lock, NULL);
#endif
}

/**
 *	Obtains a mutually exclusive system lock.  Function will block
 *	until the mutex becomes available.
 */
inline
void ZMutex::Lock()
{
#if ZULU_PLATFORM == PLATFORM_WINDOWS
	EnterCriticalSection(&m_lock);
#elif ZULU_PLATFORM == PLATFORM_MAC || ZULU_PLATFORM == PLATFORM_LINUX
	pthread_mutex_lock(&m_lock);
#endif
}

/**
 *	Releases the system lock.
 */
inline
void ZMutex::Unlock()
{
#if ZULU_PLATFORM == PLATFORM_WINDOWS
	LeaveCriticalSection(&m_lock);
#elif ZULU_PLATFORM == PLATFORM_MAC || ZULU_PLATFORM == PLATFORM_LINUX
	pthread_mutex_unlock(&m_lock);
#endif
}

} // End Namespace

#endif // __ZMUTEX_H_INCLUDED__

/* vi: set ts=4: */
