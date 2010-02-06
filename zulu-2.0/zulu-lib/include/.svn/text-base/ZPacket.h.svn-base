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
#if !defined(__ZPACKET_H_INCLUDED__)
#define __ZPACKET_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */

/* Local Headers */
#include "ZTypes.h"
#include "ZObject.h"

/* Macros */

namespace ZOTO
{

/**
 *  @class      ZPacket
 *  @brief      Abstract base class for all ZSP packets.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class _ZuluExport ZPacket : public ZObject
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZPacket(eZSPType pType);
	virtual ~ZPacket();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	ZBYTE				GetPacketType() const;
	ZUSHORT				GetPayloadLen() const;
	ZUSHORT				GetPacketLen() const;
	const char*			GetRaw() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	virtual ZRESULT		Build() = 0;
	virtual ZRESULT		Parse(ZBYTE *pRaw, int pSize) = 0;

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/

protected:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/
	virtual ZBYTE*		BuildHeader();

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/

protected:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	ZUSHORT				mPayloadLen;
	ZUSHORT				mPacketLen;
	ZBYTE				*mRaw;
	eZSPType			mPacketType;
	
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
/**
 *	Returns the type of packet.
 */
inline
ZBYTE ZPacket::GetPacketType() const
{
	return mPacketType;
}

/**
 *	Returns the length of the payload for this packet.
 */
inline
ZUSHORT ZPacket::GetPayloadLen() const
{
	return mPayloadLen;
}

/**
 *	Returns the full length of this packet.
 */
inline
ZUSHORT ZPacket::GetPacketLen() const
{
	return mPacketLen;
}

/**
 *	Returns the raw form of this packet.
 */
inline
const char* ZPacket::GetRaw() const
{
	return reinterpret_cast<const char*>(mRaw);
}

} // End Namespace

#endif // __ZPACKET_H_INCLUDED__

/* vi: set ts=4: */
