/*============================================================================*
 *                                                                            *
 *	This file is part of the Zoto Software Suite.  							  *
 *																			  *
 *	Copyright (C) 2004, 2005 Zoto, Inc.  123 South Hudson, OKC, OK  73102	  *
 *																			  *
 *	Original algorithms taken from RFC 1321									  *
 *	Copyright (C) 1990-2, RSA Data Security, Inc.							  *
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
#if !defined(__ZMD5HASHER_H_INCLUDED__)
#define __ZMD5HASHER_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */

/* Local Headers */
#include "ZObject.h"

/* Macros */

namespace ZOTO
{

/**
 *	@class		ZMD5Hasher
 *
 *	@brief		Generates an MD5 hash of supplied data.
 *	@author		Josh Williams
 *	@version	0.1.0
 *	@date		12-Oct-2004
 */
class _ZuluExport ZMD5Hasher : public ZObject
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZMD5Hasher();
	virtual ~ZMD5Hasher();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	ZRESULT				GetDigest(ZBYTE *pOutBuf, ZUINT pOutLen);
	ZRESULT				GetDigestString(char *pOutBuf, ZUINT pOutLen);

	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				Init();
	void				Update(ZBYTE *pInBuf, ZUINT pInLen);
	void				Transform(ZULONG *pOutBuf, ZULONG *pInBuf);
	void				Final();
	static ZRESULT		HashString(const char *pInBuf, ZUINT pInLen,
									char *pOutBuf, ZUINT pOutLen);
	static ZRESULT		HashStringRaw(const char *pInBuf, ZUINT pInLen,
									ZBYTE *pOutBuf, ZUINT pOutLen);

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/

protected:
	/*==================================*
	 *             CALLBACKS			*
	 *==================================*/

private:
	/*==================================*
	 *             INTERNALS            *
	 *==================================*/

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	bool				mHashComplete;		/**< Has hashing been done?	*/
	ZULONG				mBitCounts[2];		/**< Number of bits handled mod2^64 */
	ZULONG				mBufLong[4];		/**< Scratch buffer	*/
	ZBYTE				mBufByte[64];		/**< Input buffer */
	ZBYTE				mDigest[16];		/**< Actual digest after MD5Final call */
	char				mDigestStr[33];		/**< Digest stored as a string */

	static ZBYTE		sMD5_PADDING[64];	/**< 64 byte block of null data to
												 be used for padding during
												 hashing */
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/

} // End Namespace

#endif // __ZMD5HASHER_H_INCLUDED__

/* vi: set ts=4: */
