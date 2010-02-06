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
#include "ZAuthPacket.h"

/* System Headers */
#include <cstring>
#if ZULU_PLATFORM == PLATFORM_WINDOWS
#include <winsock2.h>
#elif ZULU_PLATFORM == PLATFORM_MAC
#include <netinet/in.h>
#elif ZULU_PLATFORM == PLATFORM_LINUX
#include <netinet/in.h>
#else
#error "Unsupported platform"
#endif

/* Local Headers */

/* Macros */

namespace ZOTO
{

DECLARE_CLASS( "ZAuthPacket" )

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZAuthPacket::ZAuthPacket()
	: ZPacket(ZSP_AUTH), mUserName(""), mUserHash(""), mPswdHash("")
{

}

ZAuthPacket::ZAuthPacket(const char *pUserName, const char *pUserHash,
				const char *pPswdHash)
	: ZPacket(ZSP_AUTH), mUserName(pUserName), mUserHash(pUserHash),
		mPswdHash(pPswdHash)
{

}

ZAuthPacket::~ZAuthPacket()
{

}

/********************************************************************
 *																	*
 *                        A T T R I B U T E S                       *
 *																	*
 ********************************************************************/

/********************************************************************
 *																	*
 *                        O P E R A T I O N S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *								Build()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Builds a properly formatted authentication packet.
 *
 *	@author		Josh Williams
 *	@date		12-Apr-2005
 *
 *	@remarks	Function assumes that the username, user hash, and 
 *				password hash values have already been Set().
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZAuthPacket::Build()
{
	BEG_FUNC("Build")(NULL);

	ZSP_AUTH_PACKET	*vAuth;

	if (mUserName == "" ||
		mUserHash == "" ||
		mPswdHash == "")
	{
		ZERROR("Necessary values have not been set (user/uhash/phash)\n");
		return END_FUNC(ZERR_INVALID_STATUS);
	}

	/*
	 * Build the outgoing AUTH packet
	 */
	mPacketLen  = AUTH_SIZE + mUserName.length();
	vAuth = reinterpret_cast<ZSP_AUTH_PACKET *>(BuildHeader());	
	memcpy(vAuth->user_hash, mUserHash.c_str(), sizeof(vAuth->user_hash));
	memcpy(vAuth->pswd_hash, mPswdHash.c_str(), sizeof(vAuth->pswd_hash));
	memcpy(&mRaw[AUTH_SIZE], mUserName.c_str(), mUserName.length());

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *								Parse()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Attempts to convert a raw string received into a
 *				a properly formatted authentication packet.
 *
 *	@author		Josh Williams
 *	@date		12-Apr-2005
 *
 *	@param		pRaw
 *					The raw bytes received.
 *	@param		pSize
 *					Number of bytes received.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZAuthPacket::Parse(ZBYTE *pRaw, int pSize)
{
	BEG_FUNC("Parse")("%p, %d", pRaw, pSize);

	ZSP_AUTH_PACKET	*vAuth;
	ZUINT			vUserLen;
	char			vBuffer[33];

	vAuth		= reinterpret_cast<ZSP_AUTH_PACKET*>(pRaw);
	mPayloadLen	= ntohs(vAuth->header.payload_length);
	mPacketLen	= mPayloadLen + HEADER_SIZE;
	vUserLen	= mPacketLen - AUTH_SIZE;

	/*
	 * Populate the variables.
	 */
	memset(vBuffer, 0, sizeof(vBuffer));
	memcpy(vBuffer, vAuth->user_hash, sizeof(vAuth->user_hash));
	mUserHash = vBuffer;

	memset(vBuffer, 0, sizeof(vBuffer));
	memcpy(vBuffer, vAuth->pswd_hash, sizeof(vAuth->pswd_hash));
	mPswdHash = vBuffer;

	memset(vBuffer, 0, sizeof(vBuffer));
	memcpy(vBuffer, &pRaw[AUTH_SIZE], vUserLen);
	mUserName = vBuffer;

	return END_FUNC(ZERR_SUCCESS);
}

/********************************************************************
 *																	*
 *                          O P E R A T O R S                       *
 *																	*
 ********************************************************************/

/********************************************************************
 *																	*
 *                          C A L L B A C K S                       *
 *																	*
 ********************************************************************/

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

} // End Namespace

/* vi: set ts=4: */
