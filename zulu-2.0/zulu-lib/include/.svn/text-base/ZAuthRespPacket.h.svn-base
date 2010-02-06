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
#if !defined(__ZAUTHRESPPACKET_H_INCLUDED__)
#define __ZAUTHRESPPACKET_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */

/* Local Headers */
#include "ZPacket.h"

/* Macros */

namespace ZOTO
{

/**
 *  @class      ZAuthRespPacket
 *  @brief      Sent by the server in response to authentication.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class _ZuluExport ZAuthRespPacket : public ZPacket
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZAuthRespPacket();
	ZAuthRespPacket(ZUSHORT pCode, const char *pText);
	virtual ~ZAuthRespPacket();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	ZUSHORT				GetReturnCode() const;
	const char*			GetReturnText() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				SetReturnCode(ZUSHORT pCode);
	void				SetReturnText(const char *pString);
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
	ZUSHORT				mReturnCode;
	std::string			mReturnText;
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
/**
 *	Returns the code to be sent in response to an authentication request.
 */
inline
ZUSHORT ZAuthRespPacket::GetReturnCode() const
{
	return mReturnCode;
}

/**
 *	Returns the explanation for the return code.
 */
inline
const char* ZAuthRespPacket::GetReturnText() const
{
	return mReturnText.c_str();
}

/**
 *	Sets the code to be returned to the client.
 */
inline
void ZAuthRespPacket::SetReturnCode(ZUSHORT pCode)
{
	mReturnCode = pCode;
}

/**
 *	Sets the explanation for the return code.
 */
inline
void ZAuthRespPacket::SetReturnText(const char *pText)
{
	if (pText)
		mReturnText = pText;
}

} // End Namespace

#endif // __ZAUTHRESPPACKET_H_INCLUDED__

/* vi: set ts=4: */
