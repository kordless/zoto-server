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
#include "ZFlagPacket.h"

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

DECLARE_CLASS( "ZFlagPacket" )

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZFlagPacket::ZFlagPacket()
	: ZPacket(ZSP_FLAG), mImageId(""), mImageFormat(0), mImageSize(0L),
		mImageDate(""), mImageName("")
{

}

ZFlagPacket::ZFlagPacket(const char *pId, int pFormat, ZULONG pSize,
	const char *pDate, const char *pName)
	: ZPacket(ZSP_FLAG), mImageId(pId), mImageFormat(pFormat), mImageSize(pSize),
		mImageDate(pDate), mImageName(pName)
{

}

ZFlagPacket::~ZFlagPacket()
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
 *	@brief		Builds a properly formatted flag packet.
 *
 *	@author		Josh Williams
 *	@date		12-Apr-2005
 *
 *	@remarks	Function assumes that the image id, image date, and
 *				image name values have already been Set().
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZFlagPacket::Build()
{
	BEG_FUNC("Build")(NULL);

	ZSP_FLAG_PACKET	*vFlag;

	if (mImageId == "" ||
		mImageDate == "" ||
		mImageName == "")
	{
		ZERROR("Necessary values have not been set (id/date/name)\n");
		return END_FUNC(ZERR_INVALID_STATUS);
	}

	/*
	 * Build the outgoing FLAG packet
	 */
	mPacketLen  = FLAG_SIZE + mImageName.length();
	vFlag = reinterpret_cast<ZSP_FLAG_PACKET *>(BuildHeader());	
	memcpy(vFlag->image_id, mImageId.c_str(), ZMIN(sizeof(vFlag->image_id),
			mImageId.length()));
	vFlag->image_format = htonl(mImageFormat);
	vFlag->image_size	= htonl(mImageSize);	
	memcpy(vFlag->image_date, mImageDate.c_str(), ZMIN(sizeof(vFlag->image_date),
			mImageDate.length()));
	memcpy(&mRaw[FLAG_SIZE], mImageName.c_str(), mImageName.length());\

	return END_FUNC(ZERR_SUCCESS);

}

/*------------------------------------------------------------------*
 *								Parse()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Attempts to convert a raw string received into a
 *				a properly formatted flag packet.
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
ZRESULT	ZFlagPacket::Parse(ZBYTE *pRaw, int pSize)
{
	BEG_FUNC("Parse")("%p, %d", pRaw, pSize);

	ZSP_FLAG_PACKET	*vFlag;
	ZUINT			vNameLen;
	char			vBuffer[256];

	vFlag		= reinterpret_cast<ZSP_FLAG_PACKET*>(pRaw);
	mPayloadLen	= ntohs(vFlag->header.payload_length);
	mPacketLen	= mPayloadLen + HEADER_SIZE;
	vNameLen	= mPacketLen - FLAG_SIZE;

	/*
	 * Populate the variables.
	 */
	memset(vBuffer, 0, sizeof(vBuffer));
	memcpy(vBuffer, vFlag->image_id, sizeof(vFlag->image_id));
	mImageId = vBuffer;

	mImageFormat	= ntohl(vFlag->image_format);
	mImageSize		= ntohl(vFlag->image_size);

	memset(vBuffer, 0, sizeof(vBuffer));
	memcpy(vBuffer, vFlag->image_date, sizeof(vFlag->image_date));
	mImageDate = vBuffer;

	memset(vBuffer, 0, sizeof(vBuffer));
	memcpy(vBuffer, &pRaw[FLAG_SIZE], vNameLen);
	mImageName = vBuffer;

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
