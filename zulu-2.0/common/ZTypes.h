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
#if !defined(__ZTYPES_H_INCLUDED__)
#define __ZTYPES_H_INCLUDED__

#include "ZPlatform.h"

typedef unsigned int	ZUINT;
typedef unsigned char	ZBYTE;
typedef unsigned long	ZULONG;
typedef unsigned short	ZUSHORT;

#if ZULU_PLATFORM	== PLATFORM_WINDOWS

typedef int             socklen_t;
typedef unsigned int	THREAD_HANDLE;
#define THREAD_FUNC		void
#define THREAD_RET		return

#elif ZULU_PLATFORM	== PLATFORM_MAC

typedef int				SOCKET;
#include <pthread.h>
typedef pthread_t		THREAD_HANDLE;
#define THREAD_FUNC		void*
#define THREAD_RET		return NULL

#elif ZULU_PLATFORM == PLATFORM_LINUX

typedef int				SOCKET;
#include <pthread.h>
typedef pthread_t		THREAD_HANDLE;
#define THREAD_FUNC		void*
#define THREAD_RET		return NULL
#else

#error "Platform undefined"

#endif

//==================================//
//           PACKET TYPES			//
//==================================//
enum eZSPType
{
	ZSP_NONE			= 0x00, //  0
	/* Client Commands */
	ZSP_QUIT			= 0x01, //  1
	ZSP_AUTH			= 0x02, //  2
	ZSP_VERSION			= 0x03, //  3
	ZSP_FLAG			= 0x04, //  4
	ZSP_FILE			= 0x05, //  5
	ZSP_DONE			= 0x06, //  6
	/* Server Responses */
	ZSP_QUIT_RESP		= 0x15, // 21
	ZSP_AUTH_RESP		= 0x16, // 22
	ZSP_VERSION_RESP	= 0x17, // 23
	ZSP_FLAG_RESP		= 0x18, // 24
	ZSP_FILE_RESP		= 0x19, // 25
	ZSP_DONE_RESP		= 0x1A, // 26
	/* Error Packet */
	ZSP_ERROR			= 0x32  // 50
};

//==================================//
//           IMAGE TYPES			//
//==================================//
enum ZSPImgTypes
{
	ZSP_JPEG			= 1,
	ZSP_PNG,
	ZSP_GIF,
	ZSP_BMP,
	ZSP_TIFF,
	ZSP_TARGA
};

//==================================//
//		  PACKET DEFINITIONS		//
//==================================//
#pragma pack(1)

typedef struct
{
	ZBYTE	packet_type;
	ZUSHORT	payload_length;
} ZSP_HEADER;

typedef struct
{
	ZSP_HEADER	header;
	char		user_hash[32];
	char		pswd_hash[32];
	/* char[]	user_name */
} ZSP_AUTH_PACKET;

typedef struct
{
	ZSP_HEADER	header;
	ZUSHORT		return_code;
	/* char[]	return_string */
} ZSP_AUTH_RESP_PACKET;

typedef struct
{
	ZSP_HEADER	header;
	ZUSHORT		vers_maj;
	ZUSHORT		vers_min;
	ZUSHORT		vers_build;
} ZSP_VERSION_PACKET;

typedef struct
{
	ZSP_HEADER	header;
	ZUSHORT		return_code;
	/* char[]	comment (ex. [beta]) */
} ZSP_VERSION_RESP_PACKET;

typedef struct
{
	ZSP_HEADER	header;
	char		image_id[32];
	int			image_format;
	ZULONG		image_size;
	char		image_date[19];
	/* char[]	image_name */
} ZSP_FLAG_PACKET;

typedef struct
{
	ZSP_HEADER	header;
	ZUSHORT		image_needed;
	char		image_id[32];
} ZSP_FLAG_RESP_PACKET;

typedef struct
{
	ZSP_HEADER	header;
	char		image_id[32];
	int			image_format;
	long		image_size;
	char		image_date[19];
	/* char[]	image_name */
} ZSP_FILE_PACKET;

typedef struct
{
	ZSP_HEADER	header;
	char		image_id[32];
	ZUSHORT		return_code;
	/* char[]	return_string */
} ZSP_FILE_RESP_PACKET;

typedef struct
{
	ZSP_HEADER	header;
	char		image_id[32];
} ZSP_DONE_PACKET;

typedef struct
{
	ZSP_HEADER	header;
	char		image_id[32];
	ZUSHORT		return_code;
	/* char[]	return_string */
} ZSP_DONE_RESP_PACKET;

typedef struct
{
	ZSP_HEADER	header;
	ZUSHORT		error_code;
	/* char[]	error_string */
} ZSP_ERROR_PACKET;

#pragma pack()

//==================================//
//      PACKET SIZE MACROS			//
//==================================//
#define HEADER_SIZE			sizeof(ZSP_HEADER)
#define QUIT_SIZE			sizeof(ZSP_QUIT)
#define AUTH_SIZE			sizeof(ZSP_AUTH_PACKET)
#define VERSION_SIZE		sizeof(ZSP_VERSION_PACKET)
#define FLAG_SIZE			sizeof(ZSP_FLAG_PACKET)
#define FILE_SIZE			sizeof(ZSP_FILE_PACKET)
#define DONE_SIZE			sizeof(ZSP_DONE_PACKET)
#define QUIT_RESP_SIZE		sizeof(ZSP_QUIT_RESP_PACKET)
#define AUTH_RESP_SIZE		sizeof(ZSP_AUTH_RESP_PACKET)
#define VERSION_RESP_SIZE	sizeof(ZSP_VERSION_RESP_PACKET)
#define FLAG_RESP_SIZE		sizeof(ZSP_FLAG_RESP_PACKET)
#define FILE_RESP_SIZE		sizeof(ZSP_FILE_RESP_PACKET)
#define DONE_RESP_SIZE		sizeof(ZSP_DONE_RESP_PACKET)
#define ERROR_SIZE			sizeof(ZSP_ERROR_PACKET)

#ifndef PYTHON_MODULE

enum eZErrorCode
{
	ZERR_SUCCESS = 0,
	ZERR_UNKNOWN = 100,		// 100
	ZERR_ALREADY_IN_USE,	// 101
	ZERR_OPEN_FILE,			// 102
	ZERR_INVALID_STATUS,	// 103
	ZERR_READ_FILE,			// 104
	ZERR_BAD_AUTH,          // 105
	ZERR_INVALID_VERSION,   // 106
	ZERR_NEW_VERSION,		// 107
	ZERR_CREATE_SOCKET,     // 108
	ZERR_CONNECT,           // 109
	ZERR_COMM,              // 110
	ZERR_SERVER_ERROR,		// 111
	ZERR_NULL_POINTER,		// 112
	ZERR_DUPLICATE_FILE,	// 113
	ZERR_INVALID_VALUE,		// 114
	ZERR_TIMEOUT,			// 115
	ZERR_RESOLVE_ERROR,		// 116
	ZERR_NET,				// 117
	ZERR_BIND,				// 118
	ZERR_CONN_REFUSED,		// 119
	ZERR_CANCELLED,         // 120
	ZERR_FUBAR_VERSION,		// 121
	ZERR_MAX				// 122
};

typedef eZErrorCode ZRESULT;

#endif


#endif // __ZTYPES_H_INCLUDED__

/* vi: set ts=4: */
