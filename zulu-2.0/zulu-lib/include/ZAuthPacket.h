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
#if !defined(__ZAUTHPACKET_H_INCLUDED__)
#define __ZAUTHPACET_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */

/* Local Headers */
#include "ZPacket.h"

/* Macros */

namespace ZOTO
{

/**
 *  @class      ZAuthPacket
 *  @brief      Packet sent to the Zoto server to request authentication.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class _ZuluExport ZAuthPacket : public ZPacket
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZAuthPacket();
	ZAuthPacket(const char *pUserName, const char *pUserHash,
				const char *pPswdHash);
	virtual ~ZAuthPacket();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	const char*			GetUserName() const;
	const char*			GetUserHash() const;
	const char*			GetPswdHash() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				SetUserName(const char *pUserName);
	void				SetUserHash(const char *pUserHash);
	void				SetPswdHash(const char *pPswdHash);
	ZRESULT				Build();
	ZRESULT				Parse(ZBYTE *pRaw, int pSize);

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
	std::string			mUserName;
	std::string			mUserHash;
	std::string			mPswdHash;
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
/**
 *	Returns the user associated with this authentication request.
 */
inline
const char* ZAuthPacket::GetUserName() const
{
	return mUserName.c_str();
}

/**
 *	Returns the MD5 hash of the user's name.
 */
inline
const char* ZAuthPacket::GetUserHash() const
{
	return mUserHash.c_str();
}

/**
 *	Returns the MD5 hash of the user's password.
 */
inline
const char* ZAuthPacket::GetPswdHash() const
{
	return mPswdHash.c_str();
}

/**
 *	Sets the user name contained in this authentication
 *	request.
 */
inline
void ZAuthPacket::SetUserName(const char *pUserName)
{
	if (pUserName)
		mUserName = pUserName;
}

/**
 *	Sets the user hash contained in this authentication	request.
 */
inline
void ZAuthPacket::SetUserHash(const char *pUserHash)
{
	if (pUserHash)
		mUserHash = pUserHash;
}

/**
 *	Sets the password hash contained in this authentication request.
 */
inline
void ZAuthPacket::SetPswdHash(const char *pPswdHash)
{
	if (pPswdHash)
		mPswdHash = pPswdHash;
}

} // End Namespace

#endif // __ZAUTHPACKET_H_INCLUDED__

/* vi: set ts=4: */
