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
#include "ZMD5Hasher.h"

/* System Headers */

/* Local Headers */

/* Macros */


/* MD5_F, MD5_G and MD5_H are basic MD5 functions: selection, majority, parity */
#define MD5_F(x, y, z) (((x) & (y)) | ((~x) & (z)))
#define MD5_G(x, y, z) (((x) & (z)) | ((y) & (~z)))
#define MD5_H(x, y, z) ((x) ^ (y) ^ (z))
#define MD5_I(x, y, z) ((y) ^ ((x) | (~z)))

/* ROTATE_LEFT rotates x left n bits */
#ifndef ROTATE_LEFT
#define ROTATE_LEFT(x, n) (((x) << (n)) | ((x) >> (32-(n))))
#endif

/* MD5_FF, MD5_GG, MD5_HH, and MD5_II transformations for rounds 1, 2, 3, and 4 */
/* Rotation is separate from addition to prevent recomputation */
#define MD5_FF(a, b, c, d, x, s, ac) {(a) += MD5_F ((b), (c), (d)) + (x) + (ZULONG)(ac); (a) = ROTATE_LEFT ((a), (s)); (a) += (b); }
#define MD5_GG(a, b, c, d, x, s, ac) {(a) += MD5_G ((b), (c), (d)) + (x) + (ZULONG)(ac); (a) = ROTATE_LEFT ((a), (s)); (a) += (b); }
#define MD5_HH(a, b, c, d, x, s, ac) {(a) += MD5_H ((b), (c), (d)) + (x) + (ZULONG)(ac); (a) = ROTATE_LEFT ((a), (s)); (a) += (b); }
#define MD5_II(a, b, c, d, x, s, ac) {(a) += MD5_I ((b), (c), (d)) + (x) + (ZULONG)(ac); (a) = ROTATE_LEFT ((a), (s)); (a) += (b); }

/* Constants for transformation */
#define MD5_S11 7  /* Round 1 */
#define MD5_S12 12
#define MD5_S13 17
#define MD5_S14 22
#define MD5_S21 5  /* Round 2 */
#define MD5_S22 9
#define MD5_S23 14
#define MD5_S24 20
#define MD5_S31 4  /* Round 3 */
#define MD5_S32 11
#define MD5_S33 16
#define MD5_S34 23
#define MD5_S41 6  /* Round 4 */
#define MD5_S42 10
#define MD5_S43 15
#define MD5_S44 21

namespace ZOTO
{

DECLARE_CLASS( "ZMD5Hasher" )

/* Static Variables */
ZBYTE ZMD5Hasher::sMD5_PADDING[64] = {
	0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
};

/********************************************************************
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 ********************************************************************/
ZMD5Hasher::ZMD5Hasher()
{
	mHashComplete = false;
}

ZMD5Hasher::~ZMD5Hasher()
{

}

/********************************************************************
 *                        A T T R I B U T E S                       *
 ********************************************************************/

/*------------------------------------------------------------------*
 *							  GetDigest()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Requests the computed digest in raw form.
 *
 *	@author		Josh Williams
 *	@date		12-Sep-2004
 *
 *	@param		pOutBuf
 *					Buffer to hold the generated digest.
 *	@param		pOutLen
 *					Size of pOutBuf
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZMD5Hasher::GetDigest(ZBYTE *pOutBuf, ZUINT pOutLen)
{
	BEG_FUNC("GetDigest")("%p, %d", pOutBuf, pOutLen);

	if (pOutBuf == NULL)
		return END_FUNC(ZERR_NULL_POINTER);

	if (mHashComplete)
	{
		memcpy(pOutBuf, mDigest, ZMIN( (ZUINT)sizeof(mDigest), pOutLen ));
		return END_FUNC(ZERR_SUCCESS);
	}
	else
	{
		ZTRACE("Hash not yet performed\n");
		return END_FUNC(ZERR_INVALID_STATUS);
	}
}

/*------------------------------------------------------------------*
 *							GetDigestString()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Requests the computed digest in formatted form.
 *
 *	@author		Josh Williams
 *	@date		12-Sep-2004
 *
 *	@param		pOutBuf
 *					Buffer to hold the generated digest.
 *	@param		pOutLen
 *					Size of pOutBuf.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZMD5Hasher::GetDigestString(char *pOutBuf, ZUINT pOutLen)
{
	BEG_FUNC("GetDigestString")("%p, %d", pOutBuf, pOutLen);

	if (pOutBuf == NULL)
		return END_FUNC(ZERR_NULL_POINTER);

	if (mHashComplete)
	{
		memcpy(pOutBuf, mDigestStr, ZMIN( (ZUINT)sizeof(mDigestStr), pOutLen ));
		return END_FUNC(ZERR_SUCCESS);
	}
	else
	{
		ZTRACE("Hash not yet performed\n");
		return END_FUNC(ZERR_INVALID_STATUS);
	}
}

/********************************************************************
 *                        O P E R A T I O N S                       *
 ********************************************************************/

/*------------------------------------------------------------------*
 *								Init()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Initializes all internal variables prior to generating
 *				a hash.
 *
 *	@author		Josh Williams
 *	@date		12-Oct-2004
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZMD5Hasher::Init()
{
	BEG_FUNC("Init")(NULL);

	mHashComplete = false;

	mBitCounts[0] = mBitCounts[1] = 0;

	mBufLong[0] = (ZULONG)0x67452301;
	mBufLong[1] = (ZULONG)0xefcdab89;
	mBufLong[2] = (ZULONG)0x98badcfe;
	mBufLong[3] = (ZULONG)0x10325476;

	END_FUNCV();
}

/*------------------------------------------------------------------*
 *							    Update()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		MD5 block update operation.
 *
 *	@author		Josh Williams
 *	@date		12-Oct-2004
 *
 *	@param		pInBuf
 *					Buffer containing data to be hashed
 *	@param		pInLen
 *					Number of ZBYTEs contained in pInBuf
 *
 *	@remarks	Continues an MD5 message-digest operation, processing
 *				another message block, and updating the context.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZMD5Hasher::Update(ZBYTE *pInBuf, ZUINT pInLen)
{
#ifdef DEBUG
	BEG_FUNC("Update")("%p, %d", pInBuf, pInLen);
#endif

	ZULONG	vIN[16];
	int		vMDI = 0;
	ZUINT	i = 0;
	ZUINT	ii = 0;

	if (pInBuf == NULL)
		return;

	// compute the number of ZBYTEs mod 64
	vMDI = (ZUINT)((mBitCounts[0] >> 3) & 0x3F);

	// update number of bits
	if ((mBitCounts[0] + ((ZULONG)pInLen << 3)) < mBitCounts[0])
		mBitCounts[1]++;
	mBitCounts[0] += ((ZULONG)pInLen << 3);
	mBitCounts[1] += ((ZULONG)pInLen >> 29);

	while (pInLen--)
	{
		// add new character to buffer, increment mdi
		mBufByte[vMDI++] = *pInBuf++;

		// transform if necessary
		if (vMDI == 0x40)
		{
			for (i = 0, ii = 0; i < 16; i++, ii += 4)
			{
				vIN[i] =	(((ZULONG)mBufByte[ii+3]) << 24) |
						(((ZULONG)mBufByte[ii+2]) << 16) |
						(((ZULONG)mBufByte[ii+1]) << 8) |
						((ZULONG)mBufByte[ii]);
			}

			Transform(vIN, mBufLong);
			vMDI = 0;
		}
	}

#ifdef DEBUG
	END_FUNCV();
#endif
}

/*------------------------------------------------------------------*
 *							  Transform()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Basic MD5 step.  Transforms state based on block.
 *
 *	@author		Josh Williams
 *	@date		12-Oct-2004
 *
 *	@param		pInBuf
 *					Input buffer
 *	@param		pOutBuf
 *					Output buffer
 *
 *	@returns	void
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZMD5Hasher::Transform(ZULONG *pInBuf, ZULONG *pOutBuf)
{
#ifdef DEBUG
	BEG_FUNC("Transform")("%p, %p", pInBuf, pOutBuf);
#endif

	ZULONG a, b, c, d;

	if (pInBuf == NULL || pOutBuf == NULL)
		return;

	a = pOutBuf[0], b = pOutBuf[1], c = pOutBuf[2], d = pOutBuf[3];

	// Round 1
	MD5_FF ( a, b, c, d, pInBuf[ 0], MD5_S11, (ZULONG) 3614090360u); //  1
	MD5_FF ( d, a, b, c, pInBuf[ 1], MD5_S12, (ZULONG) 3905402710u); //  2
	MD5_FF ( c, d, a, b, pInBuf[ 2], MD5_S13, (ZULONG)  606105819u); //  3
	MD5_FF ( b, c, d, a, pInBuf[ 3], MD5_S14, (ZULONG) 3250441966u); //  4
	MD5_FF ( a, b, c, d, pInBuf[ 4], MD5_S11, (ZULONG) 4118548399u); //  5
	MD5_FF ( d, a, b, c, pInBuf[ 5], MD5_S12, (ZULONG) 1200080426u); //  6
	MD5_FF ( c, d, a, b, pInBuf[ 6], MD5_S13, (ZULONG) 2821735955u); //  7
	MD5_FF ( b, c, d, a, pInBuf[ 7], MD5_S14, (ZULONG) 4249261313u); //  8
	MD5_FF ( a, b, c, d, pInBuf[ 8], MD5_S11, (ZULONG) 1770035416u); //  9
	MD5_FF ( d, a, b, c, pInBuf[ 9], MD5_S12, (ZULONG) 2336552879u); // 10
	MD5_FF ( c, d, a, b, pInBuf[10], MD5_S13, (ZULONG) 4294925233u); // 11
	MD5_FF ( b, c, d, a, pInBuf[11], MD5_S14, (ZULONG) 2304563134u); // 12
	MD5_FF ( a, b, c, d, pInBuf[12], MD5_S11, (ZULONG) 1804603682u); // 13
	MD5_FF ( d, a, b, c, pInBuf[13], MD5_S12, (ZULONG) 4254626195u); // 14
	MD5_FF ( c, d, a, b, pInBuf[14], MD5_S13, (ZULONG) 2792965006u); // 15
	MD5_FF ( b, c, d, a, pInBuf[15], MD5_S14, (ZULONG) 1236535329u); // 16

	// Round 2
	MD5_GG ( a, b, c, d, pInBuf[ 1], MD5_S21, (ZULONG) 4129170786u); // 17
	MD5_GG ( d, a, b, c, pInBuf[ 6], MD5_S22, (ZULONG) 3225465664u); // 18
	MD5_GG ( c, d, a, b, pInBuf[11], MD5_S23, (ZULONG)  643717713u); // 19
	MD5_GG ( b, c, d, a, pInBuf[ 0], MD5_S24, (ZULONG) 3921069994u); // 20
	MD5_GG ( a, b, c, d, pInBuf[ 5], MD5_S21, (ZULONG) 3593408605u); // 21
	MD5_GG ( d, a, b, c, pInBuf[10], MD5_S22, (ZULONG)   38016083u); // 22
	MD5_GG ( c, d, a, b, pInBuf[15], MD5_S23, (ZULONG) 3634488961u); // 23
	MD5_GG ( b, c, d, a, pInBuf[ 4], MD5_S24, (ZULONG) 3889429448u); // 24
	MD5_GG ( a, b, c, d, pInBuf[ 9], MD5_S21, (ZULONG)  568446438u); // 25
	MD5_GG ( d, a, b, c, pInBuf[14], MD5_S22, (ZULONG) 3275163606u); // 26
	MD5_GG ( c, d, a, b, pInBuf[ 3], MD5_S23, (ZULONG) 4107603335u); // 27
	MD5_GG ( b, c, d, a, pInBuf[ 8], MD5_S24, (ZULONG) 1163531501u); // 28
	MD5_GG ( a, b, c, d, pInBuf[13], MD5_S21, (ZULONG) 2850285829u); // 29
	MD5_GG ( d, a, b, c, pInBuf[ 2], MD5_S22, (ZULONG) 4243563512u); // 30
	MD5_GG ( c, d, a, b, pInBuf[ 7], MD5_S23, (ZULONG) 1735328473u); // 31
	MD5_GG ( b, c, d, a, pInBuf[12], MD5_S24, (ZULONG) 2368359562u); // 32

	// Round 3
	MD5_HH ( a, b, c, d, pInBuf[ 5], MD5_S31, (ZULONG) 4294588738u); // 33
	MD5_HH ( d, a, b, c, pInBuf[ 8], MD5_S32, (ZULONG) 2272392833u); // 34
	MD5_HH ( c, d, a, b, pInBuf[11], MD5_S33, (ZULONG) 1839030562u); // 35
	MD5_HH ( b, c, d, a, pInBuf[14], MD5_S34, (ZULONG) 4259657740u); // 36
	MD5_HH ( a, b, c, d, pInBuf[ 1], MD5_S31, (ZULONG) 2763975236u); // 37
	MD5_HH ( d, a, b, c, pInBuf[ 4], MD5_S32, (ZULONG) 1272893353u); // 38
	MD5_HH ( c, d, a, b, pInBuf[ 7], MD5_S33, (ZULONG) 4139469664u); // 39
	MD5_HH ( b, c, d, a, pInBuf[10], MD5_S34, (ZULONG) 3200236656u); // 40
	MD5_HH ( a, b, c, d, pInBuf[13], MD5_S31, (ZULONG)  681279174u); // 41
	MD5_HH ( d, a, b, c, pInBuf[ 0], MD5_S32, (ZULONG) 3936430074u); // 42
	MD5_HH ( c, d, a, b, pInBuf[ 3], MD5_S33, (ZULONG) 3572445317u); // 43
	MD5_HH ( b, c, d, a, pInBuf[ 6], MD5_S34, (ZULONG)   76029189u); // 44
	MD5_HH ( a, b, c, d, pInBuf[ 9], MD5_S31, (ZULONG) 3654602809u); // 45
	MD5_HH ( d, a, b, c, pInBuf[12], MD5_S32, (ZULONG) 3873151461u); // 46
	MD5_HH ( c, d, a, b, pInBuf[15], MD5_S33, (ZULONG)  530742520u); // 47
	MD5_HH ( b, c, d, a, pInBuf[ 2], MD5_S34, (ZULONG) 3299628645u); // 48

	// Round 4
	MD5_II ( a, b, c, d, pInBuf[ 0], MD5_S41, (ZULONG) 4096336452u); // 49
	MD5_II ( d, a, b, c, pInBuf[ 7], MD5_S42, (ZULONG) 1126891415u); // 50
	MD5_II ( c, d, a, b, pInBuf[14], MD5_S43, (ZULONG) 2878612391u); // 51
	MD5_II ( b, c, d, a, pInBuf[ 5], MD5_S44, (ZULONG) 4237533241u); // 52
	MD5_II ( a, b, c, d, pInBuf[12], MD5_S41, (ZULONG) 1700485571u); // 53
	MD5_II ( d, a, b, c, pInBuf[ 3], MD5_S42, (ZULONG) 2399980690u); // 54
	MD5_II ( c, d, a, b, pInBuf[10], MD5_S43, (ZULONG) 4293915773u); // 55
	MD5_II ( b, c, d, a, pInBuf[ 1], MD5_S44, (ZULONG) 2240044497u); // 56
	MD5_II ( a, b, c, d, pInBuf[ 8], MD5_S41, (ZULONG) 1873313359u); // 57
	MD5_II ( d, a, b, c, pInBuf[15], MD5_S42, (ZULONG) 4264355552u); // 58
	MD5_II ( c, d, a, b, pInBuf[ 6], MD5_S43, (ZULONG) 2734768916u); // 59
	MD5_II ( b, c, d, a, pInBuf[13], MD5_S44, (ZULONG) 1309151649u); // 60
	MD5_II ( a, b, c, d, pInBuf[ 4], MD5_S41, (ZULONG) 4149444226u); // 61
	MD5_II ( d, a, b, c, pInBuf[11], MD5_S42, (ZULONG) 3174756917u); // 62
	MD5_II ( c, d, a, b, pInBuf[ 2], MD5_S43, (ZULONG)  718787259u); // 63
	MD5_II ( b, c, d, a, pInBuf[ 9], MD5_S44, (ZULONG) 3951481745u); // 64

	pOutBuf[0] += a;
	pOutBuf[1] += b;
	pOutBuf[2] += c;
	pOutBuf[3] += d;

#ifdef DEBUG
	END_FUNCV();
#endif
}

/*------------------------------------------------------------------*
 *								  Final()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		MD5 finalization.
 *
 *	@author		Josh Williams
 *	@date		12-Oct-2004
 *
 *	@remarks	Ends an MD5 message-digest operation, writing the
 *				message digest and zeroizing the context.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZMD5Hasher::Final()
{
	ZULONG	vIN[16];
	int		vMDI = 0;
	ZUINT	i = 0;
	ZUINT	ii = 0;
	ZUINT	vPadLen = 0;

	BEG_FUNC("Final")(NULL);

	// save number of bits
	vIN[14] = mBitCounts[0];
	vIN[15] = mBitCounts[1];

	// compute number of ZBYTEs mod 64
	vMDI = (int)((mBitCounts[0] >> 3) & 0x3F);

	// pad out to 56 mod 64
	vPadLen = (vMDI < 56) ? (56 - vMDI) : (120 - vMDI);
	Update(sMD5_PADDING, vPadLen);

	// append length in bits and transform
	for (i = 0, ii = 0; i < 14; i++, ii += 4)
	{
		vIN[i] =	(((ZULONG)mBufByte[ii+3]) << 24) |
					(((ZULONG)mBufByte[ii+2]) << 16) |
					(((ZULONG)mBufByte[ii+1]) << 8) |
					((ZULONG)mBufByte[ii]);
	}

	Transform(vIN, mBufLong);

	// store buffer in digest
	for (i = 0, ii = 0; i < 4; i++, ii += 4)
	{
		mDigest[ii]   = (ZBYTE)( mBufLong[i]		  & 0xFF);
		mDigest[ii+1] = (ZBYTE)((mBufLong[i] >>  8) & 0xFF);
		mDigest[ii+2] = (ZBYTE)((mBufLong[i] >> 16) & 0xFF);
		mDigest[ii+3] = (ZBYTE)((mBufLong[i] >> 24) & 0xFF);
	}

	for (i = 0; i < 16; i++)
	{
		sprintf(&mDigestStr[i*2], "%02x", mDigest[i]);
	}

	mHashComplete = true;

	END_FUNCV();
}

/*------------------------------------------------------------------*
 *							  Transform()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Hashes the given string all in one step.
 *
 *	@author		Josh Williams
 *	@date		12-Oct-2004
 *
 *	@param		pInBuf
 *					String to be hashed.
 *	@param		pInLen
 *					Length of the string in pInBuf.
 *	@param		pOutBuf
 *					Output buffer.
 *	@param		pOutLen
 *					Size of pOutBuf.
 *
 *	@returns	void
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZMD5Hasher::HashString(const char *pInBuf, ZUINT pInLen, char *pOutBuf,
								ZUINT pOutLen)
{
	static ZMD5Hasher vHasher;

	BEG_FUNC("HashString")("%p, %d, %p, %d", pInBuf, pInLen, pOutBuf, pOutLen);

	if (pInBuf == NULL || pOutBuf == NULL)
		return END_FUNC(ZERR_NULL_POINTER);

	vHasher.Init();
	vHasher.Update((ZBYTE *)pInBuf, pInLen);
	vHasher.Final();

	vHasher.GetDigestString(pOutBuf, pOutLen);

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							HashStringRaw()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Hashes the given string all in one step.
 *
 *	@author		Josh Williams
 *	@date		12-Oct-2004
 *
 *	@param		pInBuf
 *					String to be hashed.
 *	@param		pInLen
 *					Length of the string in pInBuf.
 *	@param		pOutBuf
 *					Output buffer.
 *	@param		pOutLen
 *					Size of pOutBuf.
 *
 *	@returns	void
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZMD5Hasher::HashStringRaw(const char *pInBuf, ZUINT pInLen, ZBYTE *pOutBuf,
								ZUINT pOutLen)
{
	static ZMD5Hasher vHasher;

	BEG_FUNC("HashString")("%p, %d, %p, %d", pInBuf, pInLen, pOutBuf, pOutLen);

	if (pInBuf == NULL || pOutBuf == NULL)
		return END_FUNC(ZERR_NULL_POINTER);

	vHasher.Init();
	vHasher.Update((ZBYTE *)pInBuf, pInLen);
	vHasher.Final();

	vHasher.GetDigest(pOutBuf, pOutLen);

	return END_FUNC(ZERR_SUCCESS);
}

/********************************************************************
 *                         C A L L B A C K S                        *
 ********************************************************************/

/********************************************************************
 *                         I N T E R N A L S                        *
 ********************************************************************/

} // End Namespace

/* vi: set ts=4: */
