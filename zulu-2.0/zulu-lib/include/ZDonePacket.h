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
#if !defined(__ZDONEPACKET_H_INCLUDED__)
#define __ZDONEPACET_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <string>

/* Local Headers */
#include "ZPacket.h"

/* Macros */

namespace ZOTO
{

/**
 *  @class      ZDonePacket
 *  @brief      Sent to the Zoto server to verify file upload integrity.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class _ZuluExport ZDonePacket : public ZPacket
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZDonePacket();
	ZDonePacket(const char *pId);
	virtual ~ZDonePacket();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	const char*			GetImageId() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				SetImageId(const char *pImageId);
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
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
/**
 *	Returns the id for the image that was uploaded.
 */
inline
const char* ZDonePacket::GetImageId() const
{
	return mImageId.c_str();
}

/**
 *	Sets the user name contained in this authentication
 *	request.
 */
inline
void ZDonePacket::SetImageId(const char *pImageId)
{
	if (pImageId)
		mImageId = pImageId;
}

} // End Namespace

#endif // __ZDONEPACKET_H_INCLUDED__

/* vi: set ts=4: */
