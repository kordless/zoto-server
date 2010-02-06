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
#include "ZSocket.h"

/* System Headers */
#include <cerrno>
#if ZULU_PLATFORM == PLATFORM_WINDOWS
#include "timeval.h"
#elif ZULU_PLATFORM == PLATFORM_MAC
#include <unistd.h>
#include <fcntl.h>
#include <sys/time.h>
#elif ZULU_PLATFORM == PLATFORM_LINUX
#include <unistd.h>
#include <fcntl.h>
#include <sys/time.h>
#else
#error Unsupported platform
#endif


/* Local Headers */
#include "ZLog.h"

/* Scope Resolution */

/*------------------------------*
 *      Internal constants      *
 *------------------------------*/
#define IP_ADDR_LEN         15
#define MAX_SEND			1024
#define TIMING_ITER			8
#define NORMAL_ITER			20

#if ZULU_PLATFORM == PLATFORM_WINDOWS
#pragma warning ( disable : 4786 )
#define SETERRNO()      errno = WSAGetLastError()
typedef int             socklen_t;
#define ioctl           ioctlsocket
#define EWOULDBLOCK     WSAEWOULDBLOCK
#define ENOTSOCK        WSAENOTSOCK
#define EISCONN         WSAEISCONN
#define ENOTCONN        WSAENOTCONN
#define EINPROGRESS     WSAEINPROGRESS
#define ETIMEDOUT       WSAETIMEDOUT
#define ECONNREFUSED    WSAECONNREFUSED
#define strcasecmp      strnicmp
#define strncasecmp     strnicmp
#define SEND_FLAGS		0
#elif ZULU_PLATFORM == PLATFORM_MAC
#define closesocket     close
#define SETERRNO()		
#define SEND_FLAGS		0
#elif ZULU_PLATFORM == PLATFORM_LINUX
#define closesocket     close
#define SETERRNO()		
#define SEND_FLAGS		MSG_NOSIGNAL
#else
#error Unsupported platform
#endif

namespace ZOTO
{

DECLARE_CLASS( "ZSocket" )

/********************************************************************
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 ********************************************************************/
ZSocket::ZSocket()
	: mPort(0), mTimeout(0), mError(0), mHandle(INVALID_SOCKET), mStatus(SS_UNALLOCATED),
		mByteCount(0), mTimingState(TIMING_INIT), mThrottle(false)
{
	mDelay.tv_sec = 0;
	mDelay.tv_usec = 0;
}

ZSocket::~ZSocket()
{
	if (mStatus != SS_UNALLOCATED)
		Close();
}

/********************************************************************
 *                        A T T R I B U T E S                       *
 ********************************************************************/

/*------------------------------------------------------------------*
 *                          GetPeerName()                           *
 *------------------------------------------------------------------*/
/**
 *	@brief		Retrieves address/port info for the remote socket.
 *
 *  @param		pAddress
 *					Buffer to hold the address.
 *  @param		pAddrLen
 *					Maximum size of pAddress.
 *  @param		pPort
 *					Port number opened remotely.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::GetPeerName(char *pAddress, int pAddrLen,
								ZUSHORT *pPort /*=NULL*/)
{
	BEG_FUNC("GetPeerName")("%p, %d, %p", pAddress, pAddrLen, pPort);

	ZSockAddr	vAddr;
	socklen_t	vSAlen = sizeof(ZSockAddr);

	/* Obtail remote connection info */
	if (getpeername(mHandle, vAddr, &vSAlen) == SOCKET_ERROR)
	{
		SETERRNO();
		mError = errno;
		ZERROR("Failed to get remote information.\n"
				"Error - %d:%s\n", errno, strerror(errno));
		return END_FUNC(ZERR_NET);
	}

	/* Fill in the values */
	if (pPort != NULL)
		*pPort = vAddr.GetPort();
	if (pAddress != NULL)
	{
		memset(pAddress, 0, pAddrLen);
		const char *vAddrString = vAddr.GetAddrIP();
		if (vAddrString != NULL)
			strncpy(pAddress, vAddrString, pAddrLen-1);
		else
			strncpy(pAddress, "No address", pAddrLen-1);
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *                          GetPeerName()                           *
 *------------------------------------------------------------------*/
/**
 *	@brief		Retrieves address/port info for the remote socket.
 *
 *  @param		pSockAddr
 *					Structure pointer to hold the socket info.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::GetPeerName(ZSockAddr& pSockAddr)
{
	BEG_FUNC("GetPeerName")("%p", &pSockAddr);

	socklen_t	vAddrLen = sizeof(ZSockAddr);

	/* Obtail remote connection info */
	if (getpeername(mHandle, pSockAddr,	&vAddrLen) == SOCKET_ERROR)
	{
		SETERRNO();
		mError = errno;
		ZERROR("Failed to get remote information.\nError - %d:%s\n", errno,
				strerror(errno));
		return END_FUNC(ZERR_NET);
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *                          GetSockName()                           *
 *------------------------------------------------------------------*/
/**
 *	@brief		Retrieves address/port info for the local socket.
 *
 *  @param		pAddress
 *					Buffer to hold the address.
 *  @param		pAddrLen
 *					Maximum size of pAddress.
 *  @param		pPort
 *					Port number opened locally.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::GetSockName(char *pAddress, int& pAddrLen,
							ZUSHORT *pPort /*=NULL*/)
{
	BEG_FUNC("GetSockName")("%p, %d, %p", pAddress, pAddrLen, pPort);

	ZSockAddr	vAddr;
	socklen_t	vSAlen = sizeof(ZSockAddr);

	/* Obtail local connection info */
	if (getsockname(mHandle, vAddr, &vSAlen) == SOCKET_ERROR)
	{
		SETERRNO();
		mError = errno;
		ZERROR("Failed to get local information.\nError - %d:%s\n", errno,
				strerror(errno));
		return END_FUNC(ZERR_NET);
	}

	/* Fill in the values */
	if (pPort != NULL)
		*pPort = vAddr.GetPort();
	if (pAddress != NULL)
	{
		memset(pAddress, 0, pAddrLen);
		const char *vAddrString = vAddr.GetAddrIP();
		if (vAddrString != NULL)
			strncpy(pAddress, vAddrString, pAddrLen-1);
		else
			strncpy(pAddress, "No address", pAddrLen-1);
		pAddrLen = strlen(pAddress);
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *                          GetSockName()                           *
 *------------------------------------------------------------------*/
/**
 *	@brief		Retrieves address/port info for the remote socket.
 *
 *  @param		pSockAddr
 *					Structure pointer to hold the socket info.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::GetSockName(ZSockAddr& pSockAddr)
{
	BEG_FUNC("GetSockName")("%p", &pSockAddr);

	socklen_t	vAddrLen = sizeof(ZSockAddr);

	/* Obtail local connection info */
	if (getpeername(mHandle, pSockAddr, &vAddrLen) == SOCKET_ERROR)
	{
		SETERRNO();
		mError = errno;
		ZERROR("Failed to get local information.\nError - %d:%s\n", errno,
				strerror(errno));
		return END_FUNC(ZERR_NET);
	}

	return END_FUNC(ZERR_SUCCESS);
}


/*------------------------------------------------------------------*
 *                          GetSockOpt()                            *
 *------------------------------------------------------------------*/
/**
 *	@brief		Retrieves an option associated with this socket.
 *
 *  @param		pOptName
 *					Option whose value is to be retrieved.
 *  @param		pOptValue
 *					Buffer to hold the retrieved value.
 *  @param		pOptLen
 *					Pointer to the size of the pOptValue buffer.
 *  @param		pLevel
 *					Level at which the option is defined.  The only
 *					supported levels are SOL_SOCKET (default)
 *					and IPPROTO_TCP.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::GetSockOpt(int pOptName, void *pOptValue,
						int *pOptLen, int pLevel /*=SOL_SOCKET*/)
{
	BEG_FUNC("GetSockOpt")("%d, %p, %p, %d", pOptName, pOptValue,
						pOptLen, pLevel);

	if (getsockopt(mHandle, pLevel, pOptName, (char*)pOptValue,
					(socklen_t*)pOptLen) == SOCKET_ERROR)
	{
		SETERRNO();
		mError = errno;
		ZERROR("Failed to get socket options.\nError - %d:%s\n", errno,
				strerror(errno));
		return END_FUNC(ZERR_NET);
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *                          SetSockOpt()                            *
 *------------------------------------------------------------------*/
/**
 *	@brief		Modifies one of the options associated with this socket.
 *
 *  @param		pOptName
 *					Option whose value is to be modified.
 *  @param		pOptValue
 *					Buffer that holds the new value.
 *  @param		pOptLen
 *					Size of the pOptValue buffer.
 *  @param		pLevel
 *					Level at which the option is defined.  The only
 *					supported levels are SOL_SOCKET (default)
 *					and IPPROTO_TCP.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::SetSockOpt(int pOptName, const void *pOptValue,
						int pOptLen, int pLevel /*=SOL_SOCKET*/)
{

	BEG_FUNC("SetSockOpt")("%d, %p, %d, %d", pOptName, pOptValue, pOptLen, pLevel);

	if (setsockopt(mHandle, pLevel, pOptName, (const char*)pOptValue,
					pOptLen) == SOCKET_ERROR)
	{
		SETERRNO();
		mError = errno;
		ZERROR("Failed to set socket options.\nError - %d:%s\n", errno,
					strerror(errno));
		return END_FUNC(ZERR_NET);
	}

	return END_FUNC(ZERR_SUCCESS);
}

/********************************************************************
 *                        O P E R A T I O N S                       *
 ********************************************************************/

/*------------------------------------------------------------------*
 *                              Create()                            *
 *------------------------------------------------------------------*/
 /**
 *	@brief		Initialize this socket and prepare for use.
 *
 *  @param		pPort
 *					Optional port number to bind to.
 *  @param		pSocketType
 *					Type of socket.
 *  @param		pSockAddr
 *					Optional address to bind to.
 *
 *  @remarks	Creates the underlying socket handle and sets the socket
 *				to non-blocking mode.  If an address/port are specified, the
 *				socket is bound automatically.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::Create(ZUSHORT pPort /*=0*/, int pSocketType /*=SOCK_STREAM*/,
							const char* pSockAddr/*=NULL*/)
{
	BEG_FUNC("Create")("%d, %d, %p", pPort, pSocketType, pSockAddr);

	SOCKET	vSocketID	= INVALID_SOCKET; // Default to an invalid state
	int		vRetval		= 0;	
	ZRESULT	vZReturn	= ZERR_SUCCESS;

	/*
	 * Make sure we aren't already created or bound.
	 */
	if (mStatus != SS_UNALLOCATED)
	{
		ZERROR("Socket already in use\n");
		mError = EISCONN;
		return END_FUNC(ZERR_ALREADY_IN_USE);
	}

	/*
	 * Create the actual socket.
	 */
	vSocketID = socket(AF_INET, pSocketType, 0);
	if (vSocketID == INVALID_SOCKET)
	{
		SETERRNO();
		mError = errno;
		ZERROR("Error calling socket().\nError reported - %d%s\n",
				errno, strerror(errno));
		return END_FUNC(ZERR_NET);
	}

	ZTRACE("Socket %d created successfully.\n", vSocketID);
	mStatus = SS_ALLOCATED;
	mHandle = vSocketID;

#ifdef ZULU_NON_BLOCKING
	/*==================================================*
	 * Try and switch the socket to non-blocking mode.	*
	 *==================================================*/
#if defined(WIN32) || defined(_WINDOWS)     /* Windows platforms */
	u_long vNonblock = 1;
	vRetval = ioctl(vSocketID, FIONBIO, &vNonblock);
#else                                       /* Unix/linux */
	long vLongblock = fcntl(vSocketID, F_GETFL);
	if (vLongblock == SOCKET_ERROR)
		vRetval = SOCKET_ERROR;
	else
	{
		vLongblock |= O_NONBLOCK;
		vRetval = fcntl (vSocketID, F_SETFL, vLongblock);
	}
#endif
#endif // ZULU_NON_BLOCKING
	if (vRetval == SOCKET_ERROR)
	{
		SETERRNO();
		mError = errno;
		ZERROR("Unable to set socket to non-blocking.  Error-%d:%s\n",
					errno, strerror(errno));
		return END_FUNC(ZERR_NET);
	}
	else
	{
		/*
		 * If a port/address were supplied, try and bind to them.
		 */
		if (pPort != 0)
		{
			ZTRACE("attempting to bind socket\n");
			if ((vZReturn = Bind(pPort, pSockAddr)) != ZERR_SUCCESS)
			{
				ZTRACE("Unable to bind socket\n");
				return END_FUNC(vZReturn);
			}
			else
				return END_FUNC(ZERR_SUCCESS);
		}
		else
		{
			ZTRACE("Successfully created and initialized socket.\n");
			return END_FUNC(ZERR_SUCCESS);
		}
	}
}

/*------------------------------------------------------------------*
 *                              Attach()                            *
 *------------------------------------------------------------------*/
/**
 *	@brief		Attach this ZSocket to a pre-existing socket handle.
 *
 *  @param		pSocket
 *					Handle to the socket to attach to.
 *
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::Attach(int pSocket)
{
	BEG_FUNC("Attach")("%d", pSocket);

	if (mStatus == SS_CONNECTED)
	{
		ZERROR("Socket already connected\nCurrent address [%s:%d]\n",
					mEndPoint.GetAddrIP(), mEndPoint.GetPort());
		mError = EISCONN;
		return END_FUNC(ZERR_ALREADY_IN_USE);
	}

	if (mStatus == SS_BOUND)
	{
		ZERROR("Socket already bound to %s:%d\n",
					mLocal.GetAddrIP(), mLocal.GetPort());
		mError = EISCONN;
		return END_FUNC(ZERR_ALREADY_IN_USE);
	}

	mStatus = SS_ALLOCATED;
	mHandle = pSocket;

	GetPeerName(mEndPoint);
	GetSockName(mLocal);

	mStatus = SS_CONNECTED;

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *                              Detach()                            *
 *------------------------------------------------------------------*/
/**
 *	@brief		Disassociates this ZSocket object with the underlying
 *				socket handle, and returns said handle.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
SOCKET ZSocket::Detach()
{
	BEG_FUNC("Detach")(NULL);

	SOCKET vSocket = mHandle;

	if (mHandle != INVALID_SOCKET)
	{
		mStatus = SS_UNALLOCATED;
		mHandle = INVALID_SOCKET;
	}
	else
	{
		ZERROR("Invalid socket handle!\n");
	}

	return END_FUNC(static_cast<int>(vSocket));
}

/*------------------------------------------------------------------*
 *                              Accept()                            *
 *------------------------------------------------------------------*/
/**
 *	@brief		Accept a pending connection from the incoming queue.
 *
 *  @param		pNewSocket
 *					Pointer to hold the newly accepted socket.
 *  @param		pSockAddr
 *					Optional pointer to hold the address info for
 *					the remote socket.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::Accept(ZSocket* pNewSocket, ZSockAddr *pSockAddr/*=NULL*/)
{
	BEG_FUNC("Accept")("%p, %p", pNewSocket, pSockAddr);

	SOCKET		vTempSock	= INVALID_SOCKET; /* temp Socket ID */
	SOCKET		vNewSock	= INVALID_SOCKET; /* new Socket ID  */
	socklen_t	vPeersize	= sizeof(ZSockAddr);

	if (mStatus != SS_LISTENING) /* Socket not in listening mode! */
	{
		ZERROR("Socket not in listening mode. Cannot accept "
					"incoming connection\n");
		mError = EINVAL;
		return END_FUNC(ZERR_INVALID_STATUS);
	}

	/* We are in a proper state to accept connections.  Try it! */
	ZSockAddr	vTempAddr;
	vPeersize = sizeof(ZSockAddr);
	vTempSock = mHandle;

	/* Attempt to accept the connection */
	vNewSock = accept(vTempSock, vTempAddr, &vPeersize);

	if (vNewSock == INVALID_SOCKET)
	{
		SETERRNO();
		mError = errno;
		ZERROR("accept() failed with error %d:%s", errno, strerror(errno));
		return END_FUNC(ZERR_NET);
	}

	/* Accepted an incoming connection */
	ZTRACE("Connection accepted!\n");
	pNewSocket->Attach(vNewSock);

	if (pSockAddr != NULL)
		*pSockAddr = vTempAddr;

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *                              Bind()                              *
 *------------------------------------------------------------------*/
/**
 *	@brief		Binds this socket object to a specific port and
 *				(optional) address.
 *
 *  @param		pPort
 *					Port number to bind to.
 *  @param		pAddress
 *					(Optional) Address to bind to.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::Bind(ZUSHORT pPort, const char *pAddress/*=NULL*/)
{
	BEG_FUNC("Bind")("%d, %p", pPort, pAddress);

	char	vDestAddr[IP_ADDR_LEN+1];
	int		vReturn = 0;
	ZULONG	vAddr;

	/*
	 * Socket initialized?
	 */
	if (mStatus != SS_ALLOCATED)
	{
		ZERROR("Socket not initialized!\n");
		mError = ENOTSOCK;
		return END_FUNC(ZERR_INVALID_STATUS);
	}

	/*
	 * Are we already bound?
	 */
	if (mStatus == SS_BOUND)
	{
		ZERROR("Socket already bound to %s:%d\n", mLocal.GetAddrIP(),
					 mLocal.GetPort());
		mError = EINVAL;
		return END_FUNC(ZERR_ALREADY_IN_USE);
	}

	if (pAddress == NULL)
	{
		mPort = pPort;
		mLocal.SetPort(pPort);
		mLocal.SetAddr(INADDR_ANY);
	}
	else
	{
		// Resolve the destination: Name or Address?
		if (GetIPbyName(pAddress, vDestAddr, sizeof(vDestAddr)) != ZERR_SUCCESS)
			strncpy(vDestAddr, pAddress, IP_ADDR_LEN); // Copy in the address passed

		// Convert the address to network byte order
		vAddr = inet_addr(vDestAddr);
		if (vAddr == INADDR_NONE) // Invalid address format
		{
			ZERROR("Unable to resolve address %s\n", vDestAddr);
			mError = EINVAL;
			return END_FUNC(ZERR_RESOLVE_ERROR);
		}

		mPort = pPort;
		mLocal.SetPort(pPort);
		mLocal.SetAddr(vAddr);
		ZTRACE("Address resolved to %s\n", vDestAddr);
	}
	/*
	 * Try to bind to the specified port/address.
	 */
	vReturn = bind(mHandle, mLocal, sizeof(ZSockAddr));
	if (vReturn != 0)
	{
		//--------------------------------------//
		// Determine the cause of the failure.	//
		// Normally a failed call to bind		//
		// indicates the local port is in use.	//
		//--------------------------------------//
		SETERRNO();
		mError = errno;
		ZERROR("bind failed.  Errno %d:%s\n", errno, strerror(errno));
		return END_FUNC(ZERR_BIND);
	}

	// Socket successfully bound.
	mStatus = SS_BOUND;
	ZTRACE("socket successfully bound to port %d\n", mPort);
	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *                              Close()                             *
 *------------------------------------------------------------------*/
/**
 *	@brief		Clean up this socket object and reset it to an
 *				unused state.
 *
 *  @remarks	Called when all processing on this socket has
 *				finished.  Once Close() is called, this socket
 *				cannot be used again until Create() is called.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZSocket::Close()
{
	BEG_FUNC("Close")(NULL);

	if (mHandle != INVALID_SOCKET)
	{
		SOCKET vSocket = Detach();
		closesocket(vSocket);
	}
	else
		ZTRACE("Socket already closed\n");

	mStatus = SS_UNALLOCATED;

	END_FUNCV();
}

/*------------------------------------------------------------------*
 *                              Connect()                           *
 *------------------------------------------------------------------*/
/**
 *	@brief		Establish a connection with a remote machine.
 *
 *  @param		pAddress
 *					Address to connect to.
 *  @param		pPort
 *					Port number to connect to.
 *	@param		pTimeout
 *					(optional) Amount of time to wait before giving
 *					up.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 * 1-Jun-2003	Added EINPROGRESS to the list of	Josh Williams	*
 *				errors to be "ignored" on connect.					*
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::Connect(const char *pAddress, ZUSHORT pPort,
							ZUSHORT pTimeout /*=DEFAULT_TIMEOUT*/)
{
	BEG_FUNC("Connect")("%p, %d, %d", pAddress, pPort, pTimeout);

	int		vRetval		= 0;
	ZRESULT	vZReturn	= ZERR_SUCCESS;
	char	vDestAddr[IP_ADDR_LEN+1];
	ZULONG	vAddr;

	/*
	 * Already connected?
	 */
	if (mStatus == SS_CONNECTED)
	{
		ZERROR("Socket already connected to %s:%d\n", mEndPoint.GetAddrIP(),
				mEndPoint.GetPort());
		mError = EISCONN;
		return END_FUNC(ZERR_ALREADY_IN_USE);
	}

	/*
	 * Socket initialized?
	 */
	if (mStatus != SS_ALLOCATED && mStatus != SS_BOUND)
	{
		ZERROR("Socket not initialized!\n");
		mError = ENOTSOCK;
		return END_FUNC(ZERR_INVALID_STATUS);
	}

	/*
	 * Resolve the destination: Name or Address?
	 */
	if (GetIPbyName(pAddress, vDestAddr, sizeof(vDestAddr)) != ZERR_SUCCESS)
		strncpy(vDestAddr, pAddress, ZMIN(sizeof(vDestAddr), strlen(pAddress)));

	/*
	 * Convert the address to network byte order.
	 */
	vAddr = inet_addr(vDestAddr);
	if (vAddr == INADDR_NONE) // Invalid address format
	{
		ZERROR("Unable to resolve address %s\n", vDestAddr);
		mError = EINVAL;
		return END_FUNC(ZERR_RESOLVE_ERROR);
	}
	else
	{
		mEndPoint.SetPort(pPort);
		mEndPoint.SetAddr(vAddr);
		ZTRACE("Address %s:%d resolved to %s:%d\n", pAddress, pPort, mEndPoint.GetAddrIP(), mEndPoint.GetPort());

		mStatus = SS_CONNECTING;

		struct sockaddr_in vStructAddr;
		memset(&vStructAddr, 0, sizeof(vStructAddr));
		vStructAddr.sin_family = AF_INET;
		vStructAddr.sin_addr.s_addr = inet_addr(mEndPoint.GetAddrIP());
		vStructAddr.sin_port = htons(mEndPoint.GetPort());
		/*
		 * Try and establish the connection.
		 */
		vRetval = connect(mHandle, (struct sockaddr*)&vStructAddr, sizeof(vStructAddr));
		if (vRetval != 0)
		{
			SETERRNO();
			if (errno != EWOULDBLOCK && errno != EINPROGRESS)
			{
				mError = errno;
				ZERROR("connect() returned error %d:%s", errno, strerror(errno));
				return END_FUNC(ZERR_CONNECT);
			}

			ZTRACE("connect() returned EWOULDBLOCK or EINPROGRESS\n");
			/* not quite connected yet.  Let's poll */
			long vFlags = FD_WRITE;
			if ((vZReturn = Select(&vFlags, pTimeout)) != ZERR_SUCCESS)
			{
				mError = errno;
				ZTRACE("Error polling for connection\n");
				return END_FUNC(vZReturn);
			}
			else if (!(vFlags & FD_WRITE))
			{
				mError = ETIMEDOUT;
				ZTRACE("Connection timed out\n");
				return END_FUNC(ZERR_TIMEOUT);
			}
			else
			{
				/* Select() says we're writable.  Let's see for sure */
				int vSol_Error;
				int vSol_Size = sizeof(int);
				GetSockOpt(SO_ERROR, (void *)&vSol_Error, &vSol_Size);
				if (vSol_Error != 0)
				{
					if (vSol_Error == ECONNREFUSED)
					{
						ZTRACE("connect() failed.  Connection Refused\n");
						return END_FUNC(ZERR_CONN_REFUSED);
					}
					else
					{
						ZERROR("SO_ERROR was set.%d:%s\n", vSol_Error,
								strerror(vSol_Error));
						return END_FUNC(ZERR_NET);
					}
				}

				ZTRACE("Connection completed!\n");
				mStatus = SS_CONNECTED;
				mError = 0;
			}
		}
		else
		{
			ZTRACE("Connection completed!\n");
			mStatus = SS_CONNECTED; // Connection established.  EUREKA!
			mError = 0;
		}

		if (vRetval != SOCKET_ERROR)
			GetSockName(mLocal);
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *                              Listen()                            *
 *------------------------------------------------------------------*/
/**
 *	@brief		Begin listening for incoming client connections.
 *
 *  @param		pBacklog
 *					Number of connections to allow in the queue
 *					before rejecting.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::Listen(int pBacklog)
{
	BEG_FUNC("Listen")("%d", pBacklog);

	/*
	 * Already connected?
	 */
	if (mStatus == SS_CONNECTED)
	{
		ZERROR("Socket already connected to %s:%d\n", mEndPoint.GetAddrIP(),
				mEndPoint.GetPort());
		mError = EISCONN;
		return END_FUNC(ZERR_ALREADY_IN_USE);
	}

	/*
	 * Socket initialized and bound?
	 */
	if (mStatus != SS_ALLOCATED && mStatus != SS_BOUND)
	{
		ZERROR("Socket not initialized or bound\n");
		mError = ENOTCONN;
		return END_FUNC(ZERR_INVALID_STATUS);
	}

	/*
	 * Try to put the socket into listening mode.
	 */
	if (listen(mHandle, pBacklog) != 0)
	{
		SETERRNO();
		mError = errno;
		ZERROR("Error entering listening mode.  Error-%d:%s\n",
					mError, strerror(mError));
	}

	/* Right on */
	mStatus = SS_LISTENING;

	ZTRACE("Socket successfully placed in listen mode.\n");

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *                              Receive()                           *
 *------------------------------------------------------------------*/
/**
 *	@brief		Retrieve data pending on this socket.
 *
 *  @param		pBuffer
 *					Buffer to hold the retrieved data.
 *  @param		pBytes
 *					Maximum length of pBuffer.
 *	@param		pTimeout
 *					Time to wait for data before giving up.
 *  @param		pFlags
 *					Options to be passed to recv().
 *
 *  @remarks	Should be called by OnReceive(), when data is
 *				known to be available.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::Receive(char *pBuffer, int& pBytes, 
					ZUSHORT pTimeout /*=DEFAULT_TIMEOUT*/, int pFlags /*=0*/)
{
	int		vRetval		= -1;
	ZRESULT	vZReturn	= ZERR_SUCCESS;

	BEG_FUNC("Receive")("%p, %d, %d, %d", pBuffer, pBytes, pTimeout, pFlags);

	/*
	 * Are we connected?
	 */
	if (mStatus != SS_CONNECTED)
	{
		mError = ENOTCONN;
		ZERROR("Not connected!\n");
		return END_FUNC(ZERR_INVALID_STATUS);
	}

	if (pBuffer == NULL)
	{
		mError = EINVAL;
		ZERROR("Null buffer passed\n");
		return END_FUNC(ZERR_NULL_POINTER);
	}
	else
	{
		if (pBytes <= 0)
		{
			mError = EINVAL;
			ZERROR("Invalid buffer length specified\n");
			return END_FUNC(ZERR_INVALID_VALUE);
		}
		else
		{
			/* let's poll for data */
			long vFlags = FD_READ;
			if ((vZReturn = Select(&vFlags, pTimeout)) != ZERR_SUCCESS)
			{
				ZTRACE("Error polling for data\n");
				return END_FUNC(vZReturn);
			}

			if (!(vFlags & FD_READ))
			{
				ZTRACE("No data available within time specified\n");
				return END_FUNC(ZERR_TIMEOUT);
			}

			ZTRACE("Data available!\n");

			vRetval = recv(mHandle, pBuffer, pBytes, pFlags);
			if (vRetval == SOCKET_ERROR)
			{
				SETERRNO();
				mError = errno;
				ZERROR("Unable to receive data.  Error - %d:%s\n",
						errno, strerror(errno));
				return END_FUNC(ZERR_COMM);
			}
			else if (vRetval == 0)
			{
				ZTRACE("Socket closed\n");
				pBytes = 0;
			}
			else
			{
				pBuffer[vRetval] = 0;
				pBytes = vRetval;
				ZTRACE("Received %d bytes\n", vRetval);
			}
		}
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *                              Send()                              *
 *------------------------------------------------------------------*/
/**
 *	@brief		Transmit data on this socket.
 *
 *  @param		pBuffer
 *					Buffer containing the data to be sent.
 *  @param		pBytes
 *					Number of bytes to be transmitted.
 *
 *  @remarks	This function will attempt to send until either:
 *				a. All the data has been transmitted, or
 *				b. polling for writability times out.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::Send(const char *pBuffer, int pBytes)
{
	BEG_FUNC("Send")("%p, %d", pBuffer, pBytes);

	int			vBufBytesRem = 0;	/* number of bytes remaining in the send buffer */
	static char	vWork[MAX_SEND];	/* buffer to hold chunk we are transmitting */
	int			vOffset = 0;		/* array position within the send buffer we're at */
	int			vChunkSize = 0;		/* size of the data buffer we are actively sending */
	int			vBytesSent = 0;
	ZRESULT		vZReturn;

	/*
	 * Are we connected?
	 */
	if (mStatus != SS_CONNECTED)
	{
		mError = ENOTCONN;
		ZERROR("Not connected!\n");
		return END_FUNC(ZERR_INVALID_STATUS);
	}

	/*
	 * Valid buffer?
	 */
	if (pBuffer == NULL)
	{
		mError = EINVAL;
		ZERROR("Null buffer passed\n");
		return END_FUNC(ZERR_NULL_POINTER);
	}

	/*
	 * Data in buffer?
	 */
	if (pBytes <= 0)
	{
		mError = EINVAL;
		ZERROR("Invalid buffer length specified\n");
		return END_FUNC(ZERR_INVALID_VALUE);
	}

	vBufBytesRem = pBytes;

	while (vBufBytesRem > 0)
	{
		/* let's make sure we only send up to MAX_SEND bytes at a time */
		vChunkSize = ZMIN( vBufBytesRem, MAX_SEND );
		vOffset = pBytes - vBufBytesRem;
		memcpy(vWork, &pBuffer[vOffset], vChunkSize);
		if ((vZReturn = SendChunk(vWork, vChunkSize)) != ZERR_SUCCESS)
		{
			if (vZReturn == ZERR_TIMEOUT)
			{
				ZTRACE("Timed out trying to send chunk\n");
				return END_FUNC(ZERR_TIMEOUT);
			}
			else
			{
				ZTRACE("Unable to send chunk\n");
				return END_FUNC(vZReturn);
			}
		}
		vBufBytesRem -= vChunkSize;
		vBytesSent += vChunkSize;
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *                              Shutdown()                          *
 *------------------------------------------------------------------*/
/**
 *	@brief		Shutdown communications on this socket.
 *
 *  @param		pHow
 *					Designates whether the socket should allow
 *					sends or receives to finish.
 *
 *  @remarks	Called when the local node wishes to disconnect
 *				communications.  Optional parameter specifies which
 *				communications should be closed (send, recv, or both).
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::Shutdown(int pHow /*=SHUT_WR*/)
{
	BEG_FUNC("Shutdown")("%d", pHow);

	if (mHandle != INVALID_SOCKET)
	{
		if (shutdown(mHandle, pHow) == SOCKET_ERROR)
		{
			SETERRNO();
			mError = errno;
			ZERROR("Error calling shutdown().\nError - %d:%s\n", errno,
					strerror(errno));
			return END_FUNC(ZERR_NET);
		}
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *                              Select()                          	*
 *------------------------------------------------------------------*/
/**
 *	@brief		Polls the socket for read/writability.
 *
 *  @param		pFlags
 *					FD_READ, FD_WRITE, or both.
 *	@param		pTimeout
 *					Length of time to poll.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::Select(long *pFlags, ZUSHORT pTimeout)
{
	SOCKET			vTempSock = INVALID_SOCKET;
	struct timeval	vSeltime;
	fd_set			vReadfds, vWritefds, vExcpfds;
	int				vRetval = -1;
	long			vTempFlags;

	BEG_FUNC("Select")("%p, %ld, %d", pFlags, *pFlags, pTimeout);
	vTempSock = mHandle;

	if (*pFlags == 0L)
	{
		ZTRACE("Nothing to do.  0 passed for flags\n");
		return END_FUNC(ZERR_SUCCESS);
	}

	vSeltime.tv_sec = pTimeout;
	vSeltime.tv_usec = 0;
	vTempFlags = *pFlags;

	while (1)
	{
		FD_ZERO(&vReadfds);
		FD_ZERO(&vWritefds);
		FD_ZERO(&vExcpfds);

		ZTRACE(" * Flags passed *\n");
		if (vTempFlags & FD_READ)
		{
			ZTRACE("READ\n");
			FD_SET(vTempSock, &vReadfds);
		}
		if (vTempFlags & FD_WRITE)
		{
			ZTRACE("WRITE\n");
			FD_SET(vTempSock, &vWritefds);
		}
		FD_SET(vTempSock, &vExcpfds);
		
		ZTRACE("Socket ID: %d\n", vTempSock);

		*pFlags = 0L;

		vRetval = select(vTempSock+1, &vReadfds, &vWritefds, &vExcpfds, &vSeltime);
		SETERRNO();
		mError = errno;

		if (vRetval < 0)
		{
			ZERROR("Error calling select().\nError => [%d:%s]\n", errno, strerror(errno));
			return END_FUNC(ZERR_NET);
		}
		else if (vRetval == 0)
		{
			ZTRACE("select() returned 0\n");
			return END_FUNC(ZERR_SUCCESS);
		}
		else
		{
            ZTRACE("select returned %d\n", vRetval);
			if (FD_ISSET(vTempSock, &vReadfds))
			{
				ZTRACE("Socket readable\n");
				*pFlags |= FD_READ;
			}
			if (FD_ISSET(vTempSock, &vWritefds))
			{
				ZTRACE("Socket writable\n");
				*pFlags |= FD_WRITE;
			}

			if (FD_ISSET(vTempSock, &vExcpfds))
			{
				ZTRACE("Socket has exception set\n");
				ZTRACE("errno => %d:%s\n", errno, strerror(errno));
				*pFlags |= FD_READ; // so the client picks up on the error
			}
			break;
		}
	}

	return END_FUNC(ZERR_SUCCESS);
}


/********************************************************************
 *                          I N T E R N A L S                       *
 ********************************************************************/

/*------------------------------------------------------------------*
 *                          GetIPbyName()                           *
 *------------------------------------------------------------------*/
/**
 *	@brief		DNS lookup function.  Converts host to IP address.
 *
 *  @param		pHost
 *					Host name to be converted.
 *  @param		pAddrIP
 *					Buffer to hold the converted addr.
 *  @param		pSize
 *					Size of pIPaddr.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::GetIPbyName(const char *pHost, char *pAddrIP, int pSize)
{
	struct	hostent *vHostInfo;

	BEG_FUNC("GetIPbyName")("%p[%s], %p, %d", pHost, pHost, pAddrIP, pSize);

	vHostInfo = gethostbyname(pHost);

	if (vHostInfo)
	{
		struct in_addr vAddr;
		memcpy(&vAddr, vHostInfo->h_addr_list[0], sizeof(struct in_addr));		
		const char* vIP = inet_ntoa(vAddr);
		if (vIP)
		{
			strncpy(pAddrIP, vIP, ZMIN(pSize, static_cast<int>(strlen(vIP)+1)));
			ZTRACE("Address (%s) resolved to (%s)\n", pHost, pAddrIP);
			return END_FUNC(ZERR_SUCCESS);
		}
		else
		{
			ZTRACE("Unable to convert IP address\n");
			return END_FUNC(ZERR_NET);
		}
	}
	else
	{
		SETERRNO();
		mError = errno;
		return END_FUNC(ZERR_NET);
	}
}

/*------------------------------------------------------------------*
 *                          SendChunk()                           	*
 *------------------------------------------------------------------*/
/**
 *	@brief		Attempts to send a finite chunk of data across the
 *				socket.
 *
 *  @param		pChunk
 *					Data to be sent.
 *  @param		pChunkSize
 *					Number of bytes to be sent.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::SendChunk(const char *pChunk, int pChunkSize)
{
	int 	vBytesToSend = pChunkSize;
	int		vOffset = 0;
	int		vRetval = 0;
	ZRESULT	vZReturn = ZERR_SUCCESS;
	long	vFlags = FD_WRITE;

	BEG_FUNC("SendChunk")("%p, %d", pChunk, pChunkSize);
	while (vBytesToSend > 0)
	{
		vOffset = pChunkSize - vBytesToSend;

		/* let's check for writability */
		if ((vZReturn = Select(&vFlags)) != ZERR_SUCCESS)
		{
			SETERRNO();
			ZTRACE("Unable to poll for writability.\n");
			return END_FUNC(vZReturn);
		}

		if (!(vFlags & FD_WRITE))
		{
			ZTRACE("Socket not writable within time specified\n");
			return END_FUNC(ZERR_TIMEOUT);
		}
		
		ZTRACE("Socket writable!\n");
		mError = 0;

		vRetval = send(mHandle, &pChunk[vOffset], vBytesToSend, SEND_FLAGS);
		if (vRetval == SOCKET_ERROR)
		{
			SETERRNO();
			mError = errno;
			ZERROR("Unable to send data.  Error - %d:%s\n",
					errno, strerror(errno));
			return END_FUNC(ZERR_COMM);
		}
		else if (vRetval == 0)
		{
			ZTRACE("send() returned 0?\n");
			return END_FUNC(ZERR_COMM);
		}
		else
		{
			/*
			 * sent some data
			 */
			ZTRACE("Sent %d of %d bytes\n", vRetval, vBytesToSend);
			LimitBandwidth(vRetval);
			vBytesToSend -= vRetval;
			if (vBytesToSend == 0)
			{
				ZTRACE("Full chunk sent\n");
				break;
			}
			else if (vBytesToSend < 0)
			{
				ZERROR("Weird.  Sent too many bytes somehow :\\\n");
				return END_FUNC(ZERR_UNKNOWN);
			}
			else
			{
				continue;
			}
		}
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							LimitBandwidth()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Tries to perform bandwidth throttling on this socket
 *				connection.
 *
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZRESULT ZSocket::LimitBandwidth(int pBytes)
{
	BEG_FUNC("LimitBandwidth")(NULL);

	double	vTimingDiff = 0.0f;

	if (mThrottle == false)
		return END_FUNC(ZERR_SUCCESS);

	mByteCount += pBytes;

	switch (mTimingState)
	{
	case TIMING_INIT:
		InitTimingVars();
		mTimingState = TIMING_ON;
	case TIMING_ON:
		/*
		 * See if we've sent at least 3k bytes
		 */
		if (mByteCount >= TIMING_ITER * MAX_SEND)
		{
			/*
			 * Calculate the speed.
			 */
			gettimeofday(&mTimingEnd, NULL);
			vTimingDiff = (mTimingEnd.tv_sec + mTimingEnd.tv_usec*1e-6) -
							(mTimingStart.tv_sec + mTimingStart.tv_usec*1e-6);

			double vSpeed = ((double)mByteCount / vTimingDiff);
			double vLimitSpeed = vSpeed * .8;
			ZTRACE("mTimingStart = [%d.%d]\n", mTimingStart.tv_sec, mTimingStart.tv_usec);
			ZTRACE("mtimingEnd   = [%d.%d]\n", mTimingEnd.tv_sec, mTimingEnd.tv_usec);
			ZTRACE("vTimingDiff  = [%f]\n", vTimingDiff);
			ZTRACE("vSpeed       = [%f]\n", vSpeed);
			ZTRACE("vLimitSpeed  = [%f]\n", vLimitSpeed);
			double vDelay = ((double)MAX_SEND / vLimitSpeed) - ((double)MAX_SEND / vSpeed);
			ZTRACE("vDelay       = [%f]\n", vDelay);
			mDelay.tv_sec = (int)vDelay;
			mDelay.tv_usec = (int)((vDelay - (int)vDelay) * 1000000.0f);
			ZTRACE("mDelay       = [%d.%d]\n", mDelay.tv_sec, mDelay.tv_usec);
			mTimingState = TIMING_OFF;
			InitTimingVars();
		}
		break;
	case TIMING_OFF:
		if (mByteCount > NORMAL_ITER * MAX_SEND)
		{
			InitTimingVars();
			mTimingState = TIMING_ON;
			gettimeofday(&mTimingStart, NULL);
		}
		break;
	default:
		break;
	}
		
	if (mDelay.tv_sec >= 0 && mDelay.tv_usec >= 0)
		GetSomeSleep(mDelay);
			
	return END_FUNC(ZERR_SUCCESS);
}

void ZSocket::InitTimingVars()
{
	gettimeofday(&mTimingStart, NULL);
	mTimingEnd.tv_sec = 0;
	mTimingEnd.tv_usec = 0;
	mByteCount = 0;
}

void ZSocket::GetSomeSleep(const struct timeval& pWaitTime) const
{
#if ZULU_PLATFORM == PLATFORM_WINDOWS
	unsigned long vWaitTime = pWaitTime.tv_sec * 1000;
	vWaitTime += pWaitTime.tv_usec / 1000;
	ZTRACE("Sleeping for %d milliseconds\n", vWaitTime);
	Sleep(vWaitTime);
#elif ZULU_PLATFORM == PLATFORM_MAC || ZULU_PLATFORM == PLATFORM_LINUX
	struct timespec vWaitTime;
	vWaitTime.tv_sec = pWaitTime.tv_sec;
	vWaitTime.tv_nsec = pWaitTime.tv_usec * 1000;
	nanosleep(&vWaitTime, NULL);	
#else
#error Unsupported platform
#endif
}

} // End Namespace

/* vi: set ts=4: */
