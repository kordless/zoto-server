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
#if !defined(__ZVERSPACKET_H_INCLUDED__)
#define __ZVERSPACKET_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */

/* Local Headers */
#include "ZPacket.h"

/* Macros */

namespace ZOTO
{

/**
 *  @class		ZVersPacket
 *  @brief      Version request packet.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class _ZuluExport ZVersPacket : public ZPacket
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZVersPacket();
	ZVersPacket(ZUSHORT pVersMaj, ZUSHORT pVersMin, ZUSHORT pVersBuild);
	virtual ~ZVersPacket();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	ZUSHORT				GetVersMaj() const;
	ZUSHORT				GetVersMin() const;
	ZUSHORT				GetVersBuild() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				SetVersMaj(ZUSHORT pVersMaj);
	void				SetVersMin(ZUSHORT pVersMin);
	void				SetVersBuild(ZUSHORT pVersBuild);
	virtual ZRESULT		Build();
	virtual ZRESULT		Parse(ZBYTE *pRaw, int pSize);

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
	ZUSHORT				mVersMaj;
	ZUSHORT				mVersMin;
	ZUSHORT				mVersBuild;
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
/**
 *	Gets the latest ZSP major version number.
 */
inline
ZUSHORT ZVersPacket::GetVersMaj() const
{
	return mVersMaj;
}

/**
 *	Gets the latest ZSP minor version number.
 */
inline
ZUSHORT ZVersPacket::GetVersMin() const
{
	return mVersMin;
}

/**
 *	Gets the latest ZSP major version number.
 */
inline
ZUSHORT ZVersPacket::GetVersBuild() const
{
	return mVersBuild;
}

/**
 *	Sets the ZSP major version number.
 */
inline
void ZVersPacket::SetVersMaj(ZUSHORT pVersMaj)
{
	mVersMaj = pVersMaj;
}

/**
 *	Sets the ZSP minor version number.
 */
inline
void ZVersPacket::SetVersMin(ZUSHORT pVersMin)
{
	mVersMin = pVersMin;
}

/**
 *	Sets the ZSP build number.
 */
inline
void ZVersPacket::SetVersBuild(ZUSHORT pVersBuild)
{
	mVersBuild = pVersBuild;
}

} // End Namespace

#endif // __ZVERSPACKET_H_INCLUDED__

/* vi: set ts=4: */

