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
#if !defined(__ZCLIENT_H_INCLUDED__)
#define __ZCLIENT_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <vector>
#include <map>
#include <qstring.h>
#include <qwaitcondition.h>
#ifdef ZULU_TAGGING
#include <xmlrpc-c/client.hpp>
#endif

/* Local Headers */
#include "ZObject.h"
#include "ZTypes.h"
#include "ZSocket.h"
#include "ZMutex.h"
#include "ZPacket.h"

/* Macros */


class QString;
class QFile;

namespace ZOTO
{

class ZErrorPacket;

enum ZXferStat
{
	XFER_ACTIVE = 1,
	XFER_COMPLETE = 2,
	XFER_FAILED = 3
};

/**
 *	@class		ZXferInfo
 *
 *	@brief		Provides information to callers about file upload progress.
 *	@author		Josh Williams
 *	@version	0.2.0
 *	@date		24-Dec-2004
 */
class _ZuluExport ZXferInfo
{
public:
	ZXferInfo()
	{
		mFile		= "";
		mName		= "";
		mTemp		= false;
		mTempName	= "";
		mSize		= 0L;
		mID			= 0;
		memset(mMD5, '\0', sizeof(mMD5));
		mStatus		= XFER_ACTIVE;
		mProgress	= 0.0f;
		mBytes		= 0L;
		mErrcode	= ZERR_SUCCESS;
	}
	ZXferInfo(const ZXferInfo& rhs)
	{
		mFile		= rhs.mFile;
		mName		= rhs.mName;
		mTemp		= rhs.mTemp;
		mTempName	= rhs.mTempName;
		mSize		= rhs.mSize;
		mID			= rhs.mID;
		memcpy(mMD5, rhs.mMD5, sizeof(mMD5));
		mStatus		= rhs.mStatus;
		mProgress	= rhs.mProgress;
		mBytes		= rhs.mBytes;
		mErrcode	= rhs.mErrcode;
	}
	~ZXferInfo() {}
public:
	QString		mFile;
	QString		mName;
	bool		mTemp;
	QString		mTempName;
	ZULONG		mSize;
	int			mID;
	char		mMD5[33];
	ZXferStat	mStatus;
	double		mProgress;
	long		mBytes;
	ZRESULT		mErrcode;
};

class ZCatInfo;

/**
 *	@class		ZCatInfo
 *
 *	@brief		Stores information about a tag obtained via XMLRPC.
 *	@author		Josh Williams
 *	@version	0.2.0
 *	@date		24-Dec-2004
 */
class _ZuluExport ZCatInfo
{
public:
	int			mType;
	int			mId;
	int			mParentId;
	int			mImgCount;
	int			mImgCountRecurs;
	int			mOrderIndex;
	int			mSubCatCnt;
	std::string	mDescription;
	std::string	mEmail;
	std::string	mName;
	std::string	mUpdated;
	std::string	mUsername;
	std::string	mVisible;
	std::map<int, ZCatInfo*>	mSubs;
};

typedef std::map<int, ZCatInfo*> ZCatList;

typedef void(*ZSTAT_CALLBACK)(ZXferInfo* info);

/**
 *	@class		ZClient
 *
 *	@brief		Heart of the Zulu library
 *	@author		Josh Williams
 *	@version	0.2.0
 *	@date		24-Dec-2004
 *
 *	@remarks	This is basically the core controller for all functionality
 *				common to all Zulu clients (cli/gui/etc).  It handles all
 *				packet based communication with the server, as well as the
 *				low level file transfers for uploading.
 */
typedef std::vector<std::string>    FileList;

class _ZuluExport ZClient : public ZObject
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZClient();
	virtual ~ZClient();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	ZUSHORT				GetVersMaj() const;
	ZUSHORT				GetVersMin() const;
	ZUSHORT				GetVersBuild() const;
	const QString&  	GetZspHost() const;
	ZUSHORT				GetZspPort() const;
#ifdef ZULU_TAGGING
	const QString&		GetZapiHost() const;
	ZUSHORT				GetZapiPort() const;
	const QString&		GetZapiPath() const;
#endif
	bool            	IsConnected() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				SetVersMaj(ZUSHORT pVersMaj);
	void				SetVersMin(ZUSHORT pVersMin);
	void				SetVersBuild(ZUSHORT pVersBuild);
	void            	SetZspHost(const char *pZspHost);
	void            	SetZspPort(ZUSHORT pZspPort);
#ifdef ZULU_TAGGING
	void				SetZapiHost(const char *pZapiHost);
	void				SetZapiPort(ZUSHORT pZapiPort);
	void				SetZapiPath(const char *pZapiPath);
#endif
	ZRESULT     		Initialize();
	ZRESULT				ConnectServer();
	ZRESULT				CheckVersion(QString& pLatestVersion);
	ZRESULT				Authenticate(const QString& pUserName, const QString& pPswdHash);
	ZRESULT         	Disconnect();
	ZRESULT     		SendFile(ZXferInfo& pInfo, ZSTAT_CALLBACK pCallback = NULL,
								bool pBackground = false);
	void                PauseTransfer();
	void                ResumeTransfer();
	void                CancelTransfer();
#ifdef ZULU_TAGGING
	ZRESULT				GetCategories(const QString& pUser, const QString& pPswdHash,
								ZCatList& pCats) const;
	ZRESULT				Categorize(const QString& pUser, const QString& pPswdHash,
								const char *pID, int pCat) const;
	ZRESULT				GetQuotas(const QString& pUser, const QString& pPswdHash,
								int &pQuota, int &pUsage) const;
#endif
	static bool			IsSupportedImage(const char *pPath);

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
	 *			  INTERNALS				*
	 *==================================*/
	ZRESULT				CreateSocket();
	static THREAD_FUNC	_TransferFile(void *pParam);
	ZRESULT				TransferFile();
	ZRESULT				ServerFlag(QFile& pFile, bool& pNeeded);
	ZRESULT				ServerFile(QFile& pFile);
	ZRESULT				ServerDone();
	ZRESULT         	SendAndReceive(ZPacket& pSend, ZPacket& pReceive,
										ZErrorPacket *pError);
	ZRESULT				ClientUpdate(ZXferStat pStat, double pProgress,
								long pBytes, ZRESULT pErrcode);
	ZRESULT				ComputeSum(QFile& pFile, char *pChecksum);
	ZRESULT				ThreadCleanup(ZRESULT pResult);
#ifdef ZULU_TAGGING
	ZRESULT				LoadCats(const xmlrpc_c::value& pResult, ZCatList& pCats) const;
#endif
	ZRESULT				GetFileDate(const QFile& pFile, char *pDate);
	ZRESULT				CreateTempFile(QFile& pFile);
	ZRESULT				DeleteTempFile();
	void				PauseWait();

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	bool        		mConnected;		/**< Whether or not a connection has
											 been established with the Zoto
											 server. */
	bool                mPaused;		/**< uploading temporarily suspended */
	bool                mCancel;		/**< upload cancelled */
	ZUSHORT				mVersMaj;		/**< Major version number */
	ZUSHORT				mVersMin;		/**< Minor version number */
	ZUSHORT				mVersBuild;		/**< Build version number */
	QString				mZspHost;		/**< Zoto host to connect to. */
	ZUSHORT         	mZspPort;		/**< Port number used for connecting */
#ifdef ZULU_TAGGING
	QString				mZapiHost;		/**< ZAPI host to connect to. */
	ZUSHORT				mZapiPort;		/**< Port number used for ZAPI communications */
	QString				mZapiPath;		/**< Path to use for ZAPI communications */
#endif
	ZSocket         	mSocket;		/**< Socket object to be used for
											 communicating with Zoto server */
	ZXferInfo			mCurrentInfo;	/**< Information about the current upload */
	ZSTAT_CALLBACK		mCallback;		/**< Optional function pointer to be
											 executed to provide status updates */
	THREAD_HANDLE		mXferThread;	/**< Upload thread handle. */
	QWaitCondition		mPauseWait;		/**< semaphore to signal resume */
	static ZMutex		mThreadLock;	/**< Mutex to be waited on for thread
											 cleanup. */
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/

/**
 *	Returns the major version number for this instance of the client.
 */
inline
ZUSHORT ZClient::GetVersMaj() const
{
	return mVersMaj;
}

/**
 *	Returns the minor version number for this instance of the client.
 */
inline
ZUSHORT ZClient::GetVersMin() const
{
	return mVersMin;
}

/**
 *	Returns the build number for this instance of the client.
 */
inline
ZUSHORT ZClient::GetVersBuild() const
{
	return mVersBuild;
}

/**
 *	Returns the host (IP address) currently used for ZSP connections.
 */
inline
const QString& ZClient::GetZspHost() const
{
	return mZspHost;
}

/**
 *	Returns the port currently defined for ZSP connections.
 */
inline
ZUSHORT ZClient::GetZspPort() const
{
	return mZspPort;
}

#ifdef ZULU_TAGGING
/**
 *	Returns the host (IP address) being used for ZAPI connections.
 */
inline
const QString& ZClient::GetZapiHost() const
{
	return mZapiHost;
}

/**
 *	Returns the port currently defined for ZAPI connections.
 */
inline
ZUSHORT ZClient::GetZapiPort() const
{
	return mZapiPort;
}

/**
 *	Returns the path currently defined for ZAPI connections.
 */
inline
const QString& ZClient::GetZapiPath() const
{
	return mZapiPath;
}
#endif

/**
 *	Returns whether or not a connection is currently established with
 *	the Zoto server.
 */
inline
bool ZClient::IsConnected() const
{
	return mConnected;
}

/**
 *	Sets the major version number used by this instance of the client.
 */
inline
void ZClient::SetVersMaj(ZUSHORT pVersMaj)
{
	mVersMaj = pVersMaj;
}

/**
 *	Sets the minor version number used by this instance of the client.
 */
inline
void ZClient::SetVersMin(ZUSHORT pVersMin)
{
	mVersMin = pVersMin;
}

/**
 *	Sets the build number used by this instance of the client.
 */
inline
void ZClient::SetVersBuild(ZUSHORT pVersBuild)
{
	mVersBuild = pVersBuild;
}

/**
 *	Sets the host used for ZSP connections.
 */
inline
void ZClient::SetZspHost(const char *pZspHost)
{
	mZspHost = pZspHost;
}

/**
 *	Sets the port number of the Zoto server to connect to.
 */
inline
void ZClient::SetZspPort(ZUSHORT pZspPort)
{
	mZspPort = pZspPort;
}

#ifdef ZULU_TAGGING
/**
 *	Sets the host used for ZAPI connections.
 */
inline
void ZClient::SetZapiHost(const char *pZapiHost)
{
	mZapiHost = pZapiHost;
}

/**
 *	Sets the port number of the ZAPI server to connect to.
 */
inline
void ZClient::SetZapiPort(ZUSHORT pZapiPort)
{
	mZapiPort = pZapiPort;
}

/**
 *	Sets the path used for ZAPI communications.
 */
inline
void ZClient::SetZapiPath(const char *pZapiPath)
{
	mZapiPath = pZapiPath;
}
#endif

/**
 *	Pauses the current file transfer without disconnecting
 */
inline
void ZClient::PauseTransfer()
{
	mPaused = true;
}

/**
 *	Resumes the current file transfer, if one is active.
 */
inline
void ZClient::ResumeTransfer()
{
	mPaused = false;
	mPauseWait.wakeAll();
}

} // End Namespace

#endif // __ZCLIENT_H_INCLUDED__

/* vi: set ts=4: */
