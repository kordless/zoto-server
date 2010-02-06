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
#include "ZFilePacket.h"

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

DECLARE_CLASS( "ZFilePacket" )

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZFilePacket::ZFilePacket()
	: ZPacket(ZSP_FILE), mImageId(""), mImageFormat(0), mImageSize(0L),
		mImageDate(""), mImageName("")
{

}

ZFilePacket::ZFilePacket(const char *pId, int pFormat, ZULONG pSize,
	const char *pDate, const char *pName)
	: ZPacket(ZSP_FILE), mImageId(pId), mImageFormat(pFormat), mImageSize(pSize),
		mImageDate(pDate), mImageName(pName)
{

}

ZFilePacket::~ZFilePacket()
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
 *	@brief		Builds a properly formatted file packet.
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
ZRESULT ZFilePacket::Build()
{
	BEG_FUNC("Build")(NULL);

	ZSP_FILE_PACKET	*vFile;

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
	mPacketLen  = FILE_SIZE + mImageName.length();
	vFile = reinterpret_cast<ZSP_FILE_PACKET *>(BuildHeader());	
	memcpy(vFile->image_id, mImageId.c_str(), ZMIN(sizeof(vFile->image_id),
			mImageId.length()));
	vFile->image_format = htonl(mImageFormat);
	vFile->image_size	= htonl(mImageSize);	
	memcpy(vFile->image_date, mImageDate.c_str(), ZMIN(sizeof(vFile->image_date),
			mImageDate.length()));
	memcpy(&mRaw[FILE_SIZE], mImageName.c_str(), mImageName.length());\

	return END_FUNC(ZERR_SUCCESS);

}

/*------------------------------------------------------------------*
 *								Parse()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Attempts to convert a raw string received into a
 *				a properly formatted file packet.
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
ZRESULT	ZFilePacket::Parse(ZBYTE *pRaw, int pSize)
{
	BEG_FUNC("Parse")("%p, %d", pRaw, pSize);

	ZSP_FILE_PACKET	*vFile;
	ZUINT			vNameLen;
	char			vBuffer[256];

	vFile		= reinterpret_cast<ZSP_FILE_PACKET*>(pRaw);
	mPayloadLen	= ntohs(vFile->header.payload_length);
	mPacketLen	= mPayloadLen + HEADER_SIZE;
	vNameLen	= mPacketLen - FILE_SIZE;

	/*
	 * Populate the variables.
	 */
	memset(vBuffer, 0, sizeof(vBuffer));
	memcpy(vBuffer, vFile->image_id, sizeof(vFile->image_id));
	mImageId = vBuffer;

	mImageFormat	= ntohl(vFile->image_format);
	mImageSize		= ntohl(vFile->image_size);

	memset(vBuffer, 0, sizeof(vBuffer));
	memcpy(vBuffer, vFile->image_date, sizeof(vFile->image_date));
	mImageDate = vBuffer;

	memset(vBuffer, 0, sizeof(vBuffer));
	memcpy(vBuffer, &pRaw[FILE_SIZE], vNameLen);
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
