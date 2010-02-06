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
#if !defined(__ZSOCKET_H_INCLUDED__)
#define __ZSOCKET_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#if ZULU_PLATFORM == PLATFORM_WINDOWS
#include <winsock2.h>
#elif ZULU_PLATFORM == PLATFORM_MAC
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/ioctl.h>
#include <arpa/inet.h>
#include <netdb.h>
#elif ZULU_PLATFORM == PLATFORM_LINUX
#include <sys/socket.h>
#include <sys/ioctl.h>
#include <arpa/inet.h>
#include <netdb.h>
#else
#error "Platform undefined"
#endif                                      /* End platform specific */

/* Local Headers */
#include "ZGlobals.h"
#include "ZObject.h"
#include "ZTypes.h"
#include "ZSockAddr.h"

/* Macros */
#if ZULU_PLATFORM == PLATFORM_WINDOWS

#define SHUT_RD         0x00
#define SHUT_WR         0x01
#define SHUT_RDWR       0x02

#elif ZULU_PLATFORM == PLATFORM_MAC || ZULU_PLATFORM == PLATFORM_LINUX

#define FD_READ_BIT      0
#define FD_READ          (1 << FD_READ_BIT)

#define FD_WRITE_BIT     1
#define FD_WRITE         (1 << FD_WRITE_BIT)

#define FD_OOB_BIT       2
#define FD_OOB           (1 << FD_OOB_BIT)

#define FD_ACCEPT_BIT    3
#define FD_ACCEPT        (1 << FD_ACCEPT_BIT)

#define FD_CONNECT_BIT   4
#define FD_CONNECT       (1 << FD_CONNECT_BIT)

#define FD_CLOSE_BIT     5
#define FD_CLOSE         (1 << FD_CLOSE_BIT)
#define SOCKET_ERROR	-1
#define INVALID_SOCKET	-1

#else

#error "Platform undefined"

#endif                                      /* End platform specific */

#define DEFAULT_TIMEOUT	30		// default to 30 second timeout on all functions


/** List of available socket states. */
enum eSS_STATE {
	SS_UNALLOCATED,
	SS_ALLOCATED,
	SS_BOUND,
	SS_LISTENING,
	SS_CONNECTING,
	SS_CONNECTED
};

enum eTIMING_STATE {
	TIMING_INIT,
	TIMING_ON,
	TIMING_OFF
};

namespace ZOTO
{

/**
 *  @class      ZSocket
 *  @brief      Synchronous socket class.
 *  @author     Josh Williams (volzman19@yahoo.com)
 *  @version    0.1.0
 */
class _ZuluExport ZSocket : public ZObject
{
public:
	/*==================================*
	 *     CONSTRUCTION/DESTRUCTION     *
	 *==================================*/
	ZSocket();
	virtual ~ZSocket();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	SOCKET				GetHandle() const;
	eSS_STATE			GetStatus() const;
	int					GetError() const;
	ZRESULT				GetPeerName(char *pAddress, int pAddrLen,
							ZUSHORT *pPort = NULL);
	ZRESULT				GetPeerName(ZSockAddr& pSockAddr);
	ZRESULT				GetSockName(char *pAddress, int& pAddrLen,
							ZUSHORT *pPort = NULL);
	ZRESULT				GetSockName(ZSockAddr& pSockAddr);
	ZRESULT				GetSockOpt(int pOptionName, void *pOptionValue,
							int *pOptionLen, int pLevel = SOL_SOCKET);
	ZRESULT				SetSockOpt(int pOptionName, const void *pOptionValue,
							int pOptionLen, int pLevel = SOL_SOCKET);

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	ZRESULT				Create(ZUSHORT pPort = 0, int pSocketType = SOCK_STREAM,
							const char* pSockAddr = NULL);
	ZRESULT				Attach(int pSocket);
	SOCKET				Detach();
	ZRESULT				Accept(ZSocket* pSocket, ZSockAddr *pSockAddr = NULL);
	ZRESULT				Bind(ZUSHORT pPort, const char *pAddress = NULL);
	void				Close();
	ZRESULT				Connect(const char *pAddress, ZUSHORT pPort,
							ZUSHORT pTimeout = DEFAULT_TIMEOUT);
	ZRESULT				Listen(int pConnBacklog = 5);
	ZRESULT				Receive(char *pBuffer, int& pBytes,
							ZUSHORT pTimeout = DEFAULT_TIMEOUT,	int pFlags = 0);
	ZRESULT				Send(const char *pBuffer, int pBytes);
	ZRESULT				Shutdown(int pHow = SHUT_WR);
	ZRESULT				Select(long *pFlags, ZUSHORT pTimeout = DEFAULT_TIMEOUT);
	void				EnableThrottling(bool pThrottle = true);

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
	ZRESULT				GetIPbyName(const char *pHost, char *pAddrIP, int pSize);
	ZRESULT				SendChunk(const char *pChunk, int pChunkSize);
	ZRESULT				LimitBandwidth(int pBytes);
	void				InitTimingVars();
	double				GetTimeOfDay(struct timeval *pTime);
	void				GetSomeSleep(const struct timeval& pWaitTime) const;
	
private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
    ZUSHORT			  	mPort;			/**< Local port for this socket */
    short           	mTimeout;		/**< Number of seconds for connect, select, etc */
    ZSockAddr       	mLocal;			/**< Connection info for the local socket */
    ZSockAddr       	mEndPoint;		/**< Connection info for the remote socket */
	int					mError;			/**< Buffer to hold the last error encountered. */
	SOCKET				mHandle;		/**< Actual Socket ID */
    eSS_STATE			mStatus;		/**< Current connection status */
	/* Throttling vars */
	struct timeval		mDelay;
	struct timeval		mTimingStart;
	struct timeval		mTimingEnd;
	int					mByteCount;
	eTIMING_STATE		mTimingState;
	bool				mThrottle;
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/

/**
 *	Returns the underlying operating system handle for this socket.
 */
inline
SOCKET ZSocket::GetHandle() const
{
	return mHandle;
}
/**
 *	Returns the current status of this socket.
 */
inline
eSS_STATE ZSocket::GetStatus() const
{
	return mStatus;
}

/**
 *	Returns the last error encountered during socket operations.
 */
inline
int ZSocket::GetError() const
{
	return mError;
}

/**
 *	Sets whether or not bandwidth throttling should be implemented.
 */
inline
void ZSocket::EnableThrottling(bool pThrottle /*=true*/)
{
	mThrottle = pThrottle;
}

} // End Namespace

#endif // __ZSOCKET_H_INCLUDED__

/* vi: set ts=4: */
