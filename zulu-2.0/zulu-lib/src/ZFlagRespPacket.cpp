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
#include "ZFlagRespPacket.h"

/* System Headers */
#if ZULU_PLATFORM == PLATFORM_WINDOWS
#include <winsock2.h>
#elif ZULU_PLATFORM == PLATFORM_MAC
#include <netinet/in.h>
#elif ZULU_PLATFORM == PLATFORM_LINUX
#include <netinet/in.h>
#else
#error Unsupported platform.
#endif

/* Local Headers */

/* Macros */

namespace ZOTO
{

DECLARE_CLASS( "ZFlagRespPacket" )

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZFlagRespPacket::ZFlagRespPacket()
	: ZPacket(ZSP_FLAG_RESP), mNeeded(false), mImageId("")
{

}

ZFlagRespPacket::ZFlagRespPacket(bool pNeeded, const char *pId)
	: ZPacket(ZSP_FLAG_RESP), mNeeded(pNeeded), mImageId(pId)
{

}

ZFlagRespPacket::~ZFlagRespPacket()
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
 *	@brief		Builds a properly formatted flag response packet.
 *
 *	@author		Josh Williams
 *	@date		12-Apr-2005
 *
 *	@remarks	Function assumes that the needed and image id values
 *				have already been Set().
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZFlagRespPacket::Build()
{
	BEG_FUNC("Build")(NULL);

	ZSP_FLAG_RESP_PACKET	*vFlagResp;

	/*
	 * Build the outgoing FLAG_RESPONSE packet.
	 */
	mPacketLen  = FLAG_RESP_SIZE;
	vFlagResp = reinterpret_cast<ZSP_FLAG_RESP_PACKET *>(BuildHeader());
	vFlagResp->image_needed = htons(mNeeded ? 1 : 0);	
	memcpy(vFlagResp->image_id, mImageId.c_str(), ZMIN( sizeof(vFlagResp->image_id), 
			mImageId.length()) );

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *								Parse()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Attempts to convert a raw string received into a
 *				a properly formatted flag response packet.
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
ZRESULT ZFlagRespPacket::Parse(ZBYTE *pRaw, int pSize)
{
	BEG_FUNC("Parse")("%p, %d", pRaw, pSize);

	ZSP_FLAG_RESP_PACKET	*vFlagResp;

	vFlagResp	= reinterpret_cast<ZSP_FLAG_RESP_PACKET*>(pRaw);
	mPayloadLen	= ntohs(vFlagResp->header.payload_length);
	mPacketLen	= mPayloadLen + HEADER_SIZE;

	char *vBuffer = new char[sizeof(vFlagResp->image_id)+1];

	/*
	 * Populate the variables.
	 */
	mNeeded = (ntohs(vFlagResp->image_needed) == 1 ? true : false);
	memset(vBuffer, '\0', sizeof(vFlagResp->image_id)+1);
	memcpy(vBuffer, vFlagResp->image_id, sizeof(vFlagResp->image_id));
	mImageId = vBuffer;
	delete[] vBuffer;

	ZTRACE(" *** Parsed Flag Response ***\n");
	ZTRACE("Image needed: %s\n", mNeeded ? "true" : "false");
	ZTRACE("Image id:     %s\n", mImageId.c_str());

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
