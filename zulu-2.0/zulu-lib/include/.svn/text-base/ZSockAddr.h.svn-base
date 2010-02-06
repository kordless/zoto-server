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
#if !defined(__ZSOCKADDR_H_INCLUDED__)
#define __ZSOCKADDR_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#if ZULU_PLATFORM == PLATFORM_WINDOWS
#include <winsock2.h>
#elif ZULU_PLATFORM == PLATFORM_MAC
#include <netinet/in.h>
#elif ZULU_PLATFORM == PLATFORM_LINUX
#include <netinet/in.h>
#else
#error "Platform undefined"
#endif

/* Local Headers */
#include "ZTypes.h"

/* Macros */

namespace ZOTO
{

/**
 *  @class      ZSockAddr
 *  @brief      Easy to use extension of the sockaddr_in structure.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class _ZuluExport ZSockAddr : public sockaddr_in
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZSockAddr();
	ZSockAddr(const sockaddr& pSa);
	ZSockAddr(const sockaddr_in& pSin);
	ZSockAddr(const char* pAddrIP, const ZUSHORT pPort = 0);
	ZSockAddr(const ZULONG pAddr, const ZUSHORT pPort = 0);

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	ZUSHORT				GetPort() const;
	const char*			GetAddrIP() const;
	ZULONG				GetAddr() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				SetPort(ZUSHORT pPort);
	void				SetAddrIP(const char *pAddr);
	void				SetAddr(ZULONG pIPAddr);

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/
	const ZSockAddr&	operator=(const sockaddr& pSa);
	const ZSockAddr&	operator=(const sockaddr_in& pSin);
						operator sockaddr*();

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
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
/**
 *	Empty constructor.
 */
inline
ZSockAddr::ZSockAddr()
{
	sin_family = AF_INET;
	sin_port = 0;
	sin_addr.s_addr = 0;
}

/**
 *	Copy constructor.
 */
inline
ZSockAddr::ZSockAddr(const sockaddr& pSa)
{
	memcpy (this, &pSa, sizeof(sockaddr));
}

/**
 *	@overload
 */
inline
ZSockAddr::ZSockAddr(const sockaddr_in& pSin)
{
	memcpy(this, &pSin, sizeof(sockaddr_in));
}

/**
 *	@param
 *		pAddr Network byte ordered address.
 *	@param
 *		pPort Port number to assign.
 */
inline
ZSockAddr::ZSockAddr(const ZULONG pAddr, const ZUSHORT pPort)
{
	sin_family = AF_INET;
	sin_port = htons(pPort);
	sin_addr.s_addr = htons(pAddr);
}

/**
 *	@param
 *		pAddrIP Dotted decimal IP address.
 *	@param
 *		pPort Port number to assign.
 */
inline
ZSockAddr::ZSockAddr(const char* pAddrIP, const ZUSHORT pPort)
{
	sin_family = AF_INET;
	sin_port = htons(pPort);
	sin_addr.s_addr = inet_addr(pAddrIP);
}

/**
 *	Retrieves the port for this address object.
 */
inline
ZUSHORT ZSockAddr::GetPort() const
{
	return ntohs(sin_port);
}

/**
 *	Retrieves the address for this structure in network byte order.
 */
inline
ZULONG ZSockAddr::GetAddr() const
{
	return ntohl(sin_addr.s_addr);
}

/**
 *	Retrieves the address for this structure in dotted decimal (string) form
 */
inline
const char* ZSockAddr::GetAddrIP() const
{
	return inet_ntoa(sin_addr);
}

inline
void ZSockAddr::SetPort(ZUSHORT pPort)
{
	sin_port = htons(pPort);
}

inline
void ZSockAddr::SetAddr(ZULONG pIPAddr)
{
	sin_addr.s_addr = pIPAddr;
}

inline
void ZSockAddr::SetAddrIP(const char *pAddr)
{
	sin_addr.s_addr = inet_addr(pAddr);
}

inline
const ZSockAddr& ZSockAddr::operator=(const sockaddr& pSa)
{
	memcpy (this, &pSa, sizeof(sockaddr));
	return *this;
}

inline
const ZSockAddr& ZSockAddr::operator=(const sockaddr_in& pSin)
{
	memcpy (this, &pSin, sizeof(sockaddr_in));
	return *this;
}

inline
ZSockAddr::operator sockaddr*()
{
	return reinterpret_cast<struct sockaddr *>(this);
}

} // End Namespace

#endif // __ZSOCKADDR_H_INCLUDED__

/* vi: set ts=4: */
