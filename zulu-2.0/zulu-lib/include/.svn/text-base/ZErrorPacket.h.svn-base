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
#if !defined(__ZERRORPACKET_H_INCLUDED__)
#define __ZERRORPACKET_H_INCLUDED__

/* System Headers */

/* Local Headers */
#include "ZPacket.h"

/* Macros */

namespace ZOTO
{

/**
 *  @class      ZErrorPacket
 *  @brief      Holds details for an error returned by the server.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class _ZuluExport ZErrorPacket : public ZPacket
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZErrorPacket();
	ZErrorPacket(int pCode, const char *pText);
	virtual ~ZErrorPacket();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	ZUSHORT				GetErrorCode() const;
	const char*			GetErrorText() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				SetErrorCode(ZUSHORT pCode);
	void				SetErrorText(const char *pText);
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
	ZUSHORT				mErrorCode;
	std::string			mErrorText;
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
/**
 *	Returns the error code contained in this packet.
 */
inline
ZUSHORT ZErrorPacket::GetErrorCode() const
{
	return mErrorCode;
}

/**
 *	Returns the error string contained in this packet.
 */
inline
const char* ZErrorPacket::GetErrorText() const
{
	return mErrorText.c_str();
}

/**
 *	Sets the error code to be returned.
 */
inline
void ZErrorPacket::SetErrorCode(ZUSHORT pCode)
{
	mErrorCode = pCode;
}

/**
 *	Sets the string text associated with this error.
 */
inline
void ZErrorPacket::SetErrorText(const char *pText)
{
	mErrorText = pText;
}

} // End Namespace

#endif // __ZERRORPACKET_H_INCLUDED__

/* vi: set ts=4: */
