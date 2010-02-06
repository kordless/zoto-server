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
#if !defined(__ZFLAGRESPPACKET_H_INCLUDED__)
#define __ZFLAGRESPPACKET_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */

/* Local Headers */
#include "ZPacket.h"

/* Macros */

namespace ZOTO
{

/**
 *  @class      ZFlagRespPacket
 *  @brief      Sent by the server in response to a file check.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class _ZuluExport ZFlagRespPacket : public ZPacket
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZFlagRespPacket();
	ZFlagRespPacket(bool pNeeded, const char *pId);
	virtual ~ZFlagRespPacket();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	bool				GetNeeded() const;
	const char*			GetImageId() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				SetNeeded(bool pNeeded);
	void				SetImageId(const char *pString);
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
	bool				mNeeded;
	std::string			mImageId;
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
/**
 *	Returns whether or not this image is needed for upload.
 */
inline
bool ZFlagRespPacket::GetNeeded() const
{
	return mNeeded;
}

/**
 *	Returns the image id associated with the flag response.
 */
inline
const char* ZFlagRespPacket::GetImageId() const
{
	return mImageId.c_str();
}

/**
 *	Sets whether or not the image was needed for upload.
 */
inline
void ZFlagRespPacket::SetNeeded(bool pNeeded)
{
	mNeeded = pNeeded;
}

/**
 *	Sets the image id associated with this flag response.
 */
inline
void ZFlagRespPacket::SetImageId(const char* pId)
{
	if (pId)
		mImageId = pId;
}

} // End Namespace

#endif // __ZFLAGRESPPACKET_H_INCLUDED__

/* vi: set ts=4: */
