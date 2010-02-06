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
#if !defined(__ZDONERESPPACKET_H_INCLUDED__)
#define __ZDONERESPPACKET_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <string>

/* Local Headers */
#include "ZPacket.h"
#include "ZTypes.h"

/* Macros */

namespace ZOTO
{

/**
 *  @class      ZDoneRespPacket
 *  @brief      Server verification of client file upload.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class _ZuluExport ZDoneRespPacket : public ZPacket
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZDoneRespPacket();
	ZDoneRespPacket(const char *pId, ZUSHORT pCode, const char *pText);
	virtual ~ZDoneRespPacket();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	const char*			GetImageId() const;
	ZUSHORT				GetReturnCode() const;
	const char*			GetReturnText() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				SetImageId(const char *pId);
	void				SetReturnCode(ZUSHORT pCode);
	void				SetReturnText(const char *pText);
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
	std::string			mImageId;
	ZUSHORT				mReturnCode;
	std::string			mReturnText;
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/

/**
 *	Returns the image id associated with the done response.
 */
inline
const char* ZDoneRespPacket::GetImageId() const
{
	return mImageId.c_str();
}
/**
 *	Returns the code to be sent in response to a done request.
 */
inline
ZUSHORT ZDoneRespPacket::GetReturnCode() const
{
	return mReturnCode;
}

/**
 *	Returns the explanation for the return code.
 */
inline
const char* ZDoneRespPacket::GetReturnText() const
{
	return mReturnText.c_str();
}

/**
 *	Sets the image id associated with this done response.
 */
inline
void ZDoneRespPacket::SetImageId(const char* pId)
{
	if (pId)
		mImageId = pId;
}

/**
 *	Sets the code to be returned to the client.
 */
inline
void ZDoneRespPacket::SetReturnCode(ZUSHORT pCode)
{
	mReturnCode = pCode;
}

/**
 *	Sets the explanation for the return code.
 */
inline
void ZDoneRespPacket::SetReturnText(const char *pText)
{
	if (pText)
		mReturnText = pText;
}

} // End Namespace

#endif // __ZDONERESPPACKET_H_INCLUDED__

/* vi: set ts=4: */
