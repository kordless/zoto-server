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
#include "ZErrorPacket.h"

/* System Headers */
#include <cstring>

/* Local Headers */

/* Macros */

namespace ZOTO
{

DECLARE_CLASS( "ZErrorPacket" )

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZErrorPacket::ZErrorPacket()
	: ZPacket(ZSP_ERROR), mErrorCode(0), mErrorText("")
{

}

ZErrorPacket::ZErrorPacket(int pCode, const char *pText)
	: ZPacket(ZSP_ERROR), mErrorCode(pCode), mErrorText(pText)
{

}

ZErrorPacket::~ZErrorPacket()
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
 *	@brief		Builds a properly formatted error packet.
 *
 *	@author		Josh Williams
 *	@date		12-Apr-2005
 *
 *	@remarks	Function assumes that the error code and text
 *				values have already been Set().
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT	ZErrorPacket::Build()
{
	BEG_FUNC("Build")(NULL);

	ZSP_ERROR_PACKET	*vError;

	//
	// Build the outgoing ERROR packet
	//
	mPacketLen  = ERROR_SIZE + mErrorText.length();
	vError = reinterpret_cast<ZSP_ERROR_PACKET *>(BuildHeader());
	vError->error_code = mErrorCode;
	memcpy(&mRaw[ERROR_SIZE], mErrorText.c_str(), mErrorText.length());

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *								Parse()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Attempts to convert a raw string received into a
 *				a properly formatted error packet.
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
ZRESULT ZErrorPacket::Parse(ZBYTE *pRaw, int pSize)
{
	BEG_FUNC("Parse")("%p, %d", pRaw, pSize);

	ZSP_ERROR_PACKET	*vError;
	ZUINT				vTextLen;

	vError = reinterpret_cast<ZSP_ERROR_PACKET*>(pRaw);
	mPayloadLen	= vError->header.payload_length;
	mPacketLen	= mPayloadLen + HEADER_SIZE;
	mErrorCode	= vError->error_code;
	vTextLen = mPacketLen - ERROR_SIZE;

	char *vBuffer = new char[vTextLen+1];
	memcpy(vBuffer, &pRaw[ERROR_SIZE], vTextLen);
	vBuffer[vTextLen] = 0;
	mErrorText = vBuffer;
	delete[] vBuffer;

	ZTRACE(" *** Parsed Error Packet ***\n");
	ZTRACE("Error code: %d\n", mErrorCode);
	ZTRACE("Error text: %s\n", mErrorText.c_str());

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
