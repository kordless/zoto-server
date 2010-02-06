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
#include "ZFileRespPacket.h"

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

DECLARE_CLASS( "ZFileRespPacket" )

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZFileRespPacket::ZFileRespPacket()
	: ZPacket(ZSP_FILE_RESP), mImageId(""), mReturnCode(0), mReturnText("")
{

}

ZFileRespPacket::ZFileRespPacket(const char *pId, ZUSHORT pCode, const char *pText)
	: ZPacket(ZSP_FILE_RESP), mImageId(pId), mReturnCode(pCode), mReturnText(pText)
{

}

ZFileRespPacket::~ZFileRespPacket()
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
 *	@brief		Builds a properly formatted file response packet.
 *
 *	@author		Josh Williams
 *	@date		12-Apr-2005
 *
 *	@remarks	Function assumes that the image id, return code and
 *				string have already been Set().
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZFileRespPacket::Build()
{
	BEG_FUNC("Build")(NULL);

	ZSP_FILE_RESP_PACKET	*vFileResp;

	/*
	 * Build the outgoing FILE_RESPONSE packet
	 */
	mPacketLen  = FILE_RESP_SIZE + mReturnText.length();
	vFileResp = reinterpret_cast<ZSP_FILE_RESP_PACKET *>(BuildHeader());
	memcpy(vFileResp->image_id, mImageId.c_str(), ZMIN(mImageId.length(),
			sizeof(vFileResp->image_id)));
	vFileResp->return_code = htons(mReturnCode);	
	memcpy(&mRaw[FILE_RESP_SIZE], mReturnText.c_str(), mReturnText.length());

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *								Parse()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Attempts to convert a raw string received into a
 *				a properly formatted file response packet.
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
ZRESULT ZFileRespPacket::Parse(ZBYTE *pRaw, int pSize)
{
	BEG_FUNC("Parse")("%p, %d", pRaw, pSize);

	ZSP_FILE_RESP_PACKET	*vFileResp;
	ZUINT					vTextLen;
	char					vBuffer[256];

	vFileResp	= reinterpret_cast<ZSP_FILE_RESP_PACKET*>(pRaw);
	mPayloadLen	= ntohs(vFileResp->header.payload_length);
	mPacketLen	= mPayloadLen + HEADER_SIZE;
	vTextLen	= mPacketLen - FILE_RESP_SIZE;

	/*
	 * Populate the variables.
	 */
	memset(vBuffer, '\0', sizeof(vBuffer));
	memcpy(vBuffer, vFileResp->image_id, sizeof(vFileResp->image_id));
	mImageId = vBuffer;
	mReturnCode = ntohs(vFileResp->return_code);
	memcpy(vBuffer, &pRaw[FILE_RESP_SIZE], vTextLen);
	vBuffer[vTextLen] = '\0';
	mReturnText = vBuffer;

	ZTRACE(" *** Parsed File Response ***\n");
	ZTRACE("Image Id:    %s\n", mImageId.c_str());
	ZTRACE("Return code: %d\n", mReturnCode);
	ZTRACE("Return text: %s\n", mReturnText.c_str());

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
