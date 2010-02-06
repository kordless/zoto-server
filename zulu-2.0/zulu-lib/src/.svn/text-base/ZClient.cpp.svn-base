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
#include "ZClient.h"

/* System Headers */
#include <cerrno>
#if ZULU_PLATFORM	== PLATFORM_WINDOWS
#include <windows.h>
#include <process.h>
#include <time.h>
#include <timeval.h>
#elif ZULU_PLATFORM == PLATFORM_MAC
#include <sys/time.h>
#elif ZULU_PLATFORM == PLATFORM_LINUX
#include <sys/time.h>
#else
#error Unsupported platform
#endif
#ifdef ZULU_TAGGING
#include <vector>
#include <map>
#include <string>
using std::vector;
using std::map;
using std::string;
#endif

#include <qfile.h>
#include <qfileinfo.h>
#include <qapplication.h>
#include <qimage.h>
#include <qdir.h>
#include <qsettings.h>

/* Local Headers */
#include "ZApp.h"
#include "ZMD5Hasher.h"
#include "ZLog.h"
#include "ZErrorPacket.h"
#include "ZHeader.h"
#include "ZVersPacket.h"
#include "ZVersRespPacket.h"
#include "ZAuthPacket.h"
#include "ZAuthRespPacket.h"
#include "ZFlagPacket.h"
#include "ZFlagRespPacket.h"
#include "ZFilePacket.h"
#include "ZFileRespPacket.h"
#include "ZDonePacket.h"
#include "ZDoneRespPacket.h"


static ZUSHORT CONNECT_TIMEOUT = 5;
static ZUSHORT RECEIVE_TIMEOUT = 20;

typedef map<string, xmlrpc_c::value> ValueMap;

#ifdef DEBUG
void PrintCat(FILE *oFile, int& pDepth, ZOTO::ZCatInfo *pCat)
{
	for (int i = 0; i < pDepth; i++)
		fprintf(oFile, "   ");
	fprintf(oFile, "%s:%d:%d\n", pCat->mName.c_str(), pCat->mId, pCat->mOrderIndex);
}


void DumpTree(FILE *oFile, int pDepth, ZOTO::ZCatList &pCats)
{
	ZOTO::ZCatList::iterator vIt;
	ZOTO::ZCatInfo *pCat;
	for (vIt = pCats.begin(); vIt != pCats.end(); vIt++)
	{
		pCat = vIt->second;
		PrintCat(oFile, pDepth, pCat);
		if (pCat->mSubCatCnt > 0)
			DumpTree(oFile, pDepth+1, pCat->mSubs);
	}
}
#endif

namespace ZOTO
{

ZMutex  ZClient::mThreadLock;

DECLARE_CLASS( "ZClient" )

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZClient::ZClient()
	: mConnected(false), mPaused(false), mCancel(false),
		mVersMaj(ZOTO_VERS_MAJ), mVersMin(ZOTO_VERS_MIN), mVersBuild(ZOTO_VERS_BUILD),
		mZspHost(""), mZspPort(0),
#ifdef ZULU_TAGGING
		mZapiHost(""), mZapiPort(0), mZapiPath(""),
#endif
		mXferThread(0)
{
	QSettings	vConfig;
	bool		vTracing;
	/*
	 * Set the path to the application configuration file/key.
	 */
	ZULU_APP()->SetConfigPath(vConfig);

	/*
	 * Grab the config values from the file/registry
	 */
	
	mZspHost	= vConfig.readEntry(ZULU_APP()->BuildConfigPath("/ZSP/ZspHost"), ZSP_HOST);
	mZspPort	= vConfig.readNumEntry(ZULU_APP()->BuildConfigPath("/ZSP/ZspPort"), ZSP_PORT);
#ifdef ZULU_TAGGING
	mZapiHost	= vConfig.readEntry(ZULU_APP()->BuildConfigPath("/ZAPI/ZapiHost"), ZAPI_HOST);
	mZapiPort	= vConfig.readNumEntry(ZULU_APP()->BuildConfigPath("/ZAPI/ZapiPort"), ZAPI_PORT);
	mZapiPath	= vConfig.readEntry(ZULU_APP()->BuildConfigPath("/ZAPI/ZapiPath"), ZAPI_PATH);
#endif
	vTracing	= vConfig.readBoolEntry(ZULU_APP()->BuildConfigPath("/Tracing"), false);

	mVersMaj	= vConfig.readNumEntry(ZULU_APP()->BuildConfigPath("/VersMaj"), ZOTO_VERS_MAJ);
	mVersMin	= vConfig.readNumEntry(ZULU_APP()->BuildConfigPath("/VersMin"), ZOTO_VERS_MIN);
	mVersBuild	= vConfig.readNumEntry(ZULU_APP()->BuildConfigPath("/VersBuild"), ZOTO_VERS_BUILD);

	if (vTracing)
	{
		ZLog::GetLog().InitTrace(qApp->applicationFilePath().latin1());
	}
}

ZClient::~ZClient()
{
	mSocket.Close();
#if ZULU_PLATFORM	== PLATFORM_WINDOWS
	WSACleanup();
#endif

}

/********************************************************************
 *																	*
 *                        A T T R I B U T E S                       *
 *																	*
 ********************************************************************/

/********************************************************************
 *																	*
 *                        O P E R A T I O N S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *							 Initialize()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Prepares this client instance for use.  Creates the
 *				underlying socket.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::Initialize()
{
	ZRESULT vZReturn;

	BEG_FUNC("Initialize")(NULL);

	ZTRACE("Zulu library initializing...\n");

#if ZULU_PLATFORM	== PLATFORM_WINDOWS
	/* with Win32, we have to additionally initialize the winsock	*/
	/* interface, since native berkeley sockets apparently don't	*/
	/* do it for M$.												*/
	WSADATA wsadata;
	WORD	wVer;
	wVer = MAKEWORD(2,0);
	if (WSAStartup(wVer, &wsadata) != 0)
    {
        ZERROR("Unable to initialize winsock!\n");
		return END_FUNC(ZERR_CREATE_SOCKET);
    }
#endif

	if ((vZReturn = CreateSocket()) != ZERR_SUCCESS)
		return END_FUNC(vZReturn);

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							 ConnectServer()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Attempts to establish a network connection to the
 *				Zoto server.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::ConnectServer()
{
	ZRESULT	vZReturn = ZERR_SUCCESS;

	BEG_FUNC("ConnectServer")(NULL);

	ZTRACE("Attempting connection to Zoto server\n");
	ZTRACE("Address: %s\n", GetZspHost().latin1());
	ZTRACE("Port:    %d\n", GetZspPort());

	if (mSocket.GetHandle() == INVALID_SOCKET)
		if (CreateSocket() != ZERR_SUCCESS)
			return END_FUNC(ZERR_CREATE_SOCKET);

	if ((vZReturn = mSocket.Connect(GetZspHost().latin1(), GetZspPort(), CONNECT_TIMEOUT)) != ZERR_SUCCESS)
	{
		ZTRACE("Failed to connect to the Zoto server\n");
		Disconnect(); // so the socket object gets reset
		return END_FUNC(vZReturn);
	}

	mConnected = true;

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							 CheckVersion()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Determines if the currently running version of the
 *				Zoto Uploader is up to date.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::CheckVersion(QString& vLatestVersion)
{
	BEG_FUNC("CheckVersion")(NULL);

	ZVersPacket		vVers;
	ZVersRespPacket	vVersResp;
	ZRESULT			vZReturn = ZERR_SUCCESS;
	ZErrorPacket	*vError = NULL;

	/*
	 * Build the outgoing packet.
	 */
	vVers.SetVersMaj(mVersMaj);
	vVers.SetVersMin(mVersMin);
	vVers.SetVersBuild(mVersBuild);
	ZTRACE("Current ZOTO version => [%d.%d.%d]\n",
	            vVers.GetVersMaj(), vVers.GetVersMin(), vVers.GetVersBuild());

	/*
	 * Send it and wait for response.
	 */
	vZReturn = SendAndReceive(vVers, vVersResp, vError);
	if (vZReturn != ZERR_SUCCESS)
	{
		ZTRACE("Error checking client version with server\n");
		Disconnect();
		return END_FUNC(ZERR_COMM);
	}

	/*
	 * Check the return code.
	 */
	switch (vVersResp.GetReturnCode())
	{
	case ZSP_VERS_GOOD:
		ZTRACE("Version check successful!\nComment[%s]\n", vVersResp.GetReturnText());
		return END_FUNC(ZERR_SUCCESS);
	case ZSP_VERS_OLD:
		vLatestVersion = vVersResp.GetReturnText();
		ZTRACE("New Zoto Uploader version [%s] available\n", vLatestVersion.latin1());
		return END_FUNC(ZERR_NEW_VERSION);
	case ZSP_VERS_BAD:
		vLatestVersion = vVersResp.GetReturnText();
		ZTRACE("Uploader out of date.  New version [%s] available\n", vLatestVersion.latin1());
		Disconnect();
		return END_FUNC(ZERR_INVALID_VERSION);
	default:
		ZERROR("Unknown version response => [%d]\n", vVersResp.GetReturnCode());
		Disconnect();
		return END_FUNC(ZERR_COMM);
	}
}

/*------------------------------------------------------------------*
 *							 Authenticate()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Validates the user's credentials with the Zoto server.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 *
 *	@param		pUser
 *					Username to authenticate.
 *	@param		pPswdHash
 *					Password hash to authenticate.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 * 31-Oct-2005	Added username and password as		Josh Williams	*
 * 				arguments.											*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::Authenticate(const QString& pUser, const QString& pPswdHash)
{
	ZRESULT					vZReturn;
	ZAuthPacket				vAuth;
	ZAuthRespPacket			vAuthResp;
	ZErrorPacket			*vError = NULL;
	char					vHash[33];

	BEG_FUNC("Authenticate")("%p, %p", &pUser, &pPswdHash);

	ZMD5Hasher::HashString(pUser.latin1(), pUser.length(), vHash, sizeof(vHash));

	/*
	 * Build the outgoing AUTH packet
	 */
	vAuth.SetUserName(pUser.latin1());
	vAuth.SetUserHash(vHash);
	vAuth.SetPswdHash(pPswdHash.latin1());

	ZTRACE("|---------------------------|\n");
	ZTRACE("|    * AUTHENTICATING *     |\n");
	ZTRACE("|---------------------------|\n");
	ZTRACE("User name: [%s]            \n", vAuth.GetUserName());
	ZTRACE("User hash: [%s]            \n", vAuth.GetUserHash());
	ZTRACE("Pswd hash: [%s]            \n", vAuth.GetPswdHash());

	/*
	 * Send it and wait for response.
	 */
	vZReturn = SendAndReceive(vAuth, vAuthResp, vError);
	if (vZReturn != ZERR_SUCCESS)
	{
		ZTRACE("Error authenticating with Zoto server\n");
		Disconnect();
		return END_FUNC(ZERR_COMM);
	}

	/*
	 * Check the return code.
	 */
	switch (vAuthResp.GetReturnCode())
	{
	case ZSP_AUTH_OK:
		ZTRACE("Authentication was successful.\n");
		return END_FUNC(ZERR_SUCCESS);
	case ZSP_AUTH_BAD:
		ZTRACE("Invalid username or password password\n");
		return END_FUNC(ZERR_BAD_AUTH);
	default:
		ZERROR("Unknown version response: [%d]\n", vAuthResp.GetReturnCode());
		return END_FUNC(ZERR_SERVER_ERROR);
	}
}

/*------------------------------------------------------------------*
 *							 Disconnect()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Severs the connection to the Zoto server.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::Disconnect()
{
	BEG_FUNC("Disconnect")(NULL);

	mSocket.Close();
	mConnected = false;

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							 	SendFile()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Calls the main transfer routine, either synchronously
 *				or asynchronously.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 *
 *	@param		pInfo
 *					Reference to a structure holding the transfer status
 *					information.
 *	@param		pCallback
 *					Optional function to be called to provide progress
 *					notifications.
 *	@param		pBackground
 *					Whether or not the file transfer logic should
 *					be run in a separate thread.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::SendFile(ZXferInfo& pInfo, ZSTAT_CALLBACK pCallback /*=NULL*/,
			bool pBackground /*=false*/)
{

	BEG_FUNC("SendFile")("%p, %p, %s", &pInfo, pCallback, pBackground ? "true" : "false");

	ZRESULT	vZReturn;

	/*
	 * Store the current file name so the thread function can access it.
	 */
	mCurrentInfo = pInfo;
	mCallback = pCallback;

	if (pBackground)
	{
#if ZULU_PLATFORM	== PLATFORM_WINDOWS
		mXferThread = _beginthread(_TransferFile, 0, this);
		if (mXferThread < 0)
#elif ZULU_PLATFORM == PLATFORM_MAC
		int vRetval = pthread_create(&mXferThread, NULL, _TransferFile, this);
		if (vRetval == 0)
#elif ZULU_PLATFORM == PLATFORM_LINUX
		int vRetval = pthread_create(&mXferThread, NULL, _TransferFile, this);
		if (vRetval == 0)
#else
#error Unsupported platform.
#endif
			vZReturn = ZERR_UNKNOWN;
		else
			vZReturn = ZERR_SUCCESS;
	}
	else
		vZReturn = TransferFile();

	return END_FUNC(vZReturn);
}

/*------------------------------------------------------------------*
 *							 CancelTransfer()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Terminates the transfer thread gracefully.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZClient::CancelTransfer()
{

	mCancel = true;
	this->ResumeTransfer(); // Just in case we're paused
	mThreadLock.Lock(); // Wait for the thread to finish processing.
	mCancel = false;
	mThreadLock.Unlock();
}

#ifdef ZULU_TAGGING
/*------------------------------------------------------------------*
 *							 GetCategories()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Retrieves the list of categories for this user from
 *				the ZAPI server.
 *
 *	@author		Josh Williams
 *	@date		23-Apr-2005
 *
 *	@param		pUserName
 *					Username for authentication.
 *	@param		pPswdHash
 *					Password hash for authentication.

 *	@param		pCats
 *					Storage point for the list of categories.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 * 31-Oct-2005	Added username and password as		Josh Williams	*
 * 				arguments.											*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::GetCategories(const QString& pUserName, const QString& pPswdHash,
							   		ZCatList& pCats) const
{
	BEG_FUNC("GetCategories")("%p, %p, %p", &pUserName, &pPswdHash, &pCats);

	std::ostringstream		vURL;
	xmlrpc_c::clientXmlTransport_libwww	vTransport;
	xmlrpc_c::client_xml	vRpcClient(&vTransport);
	vector<xmlrpc_c::value>	vCreds;
	xmlrpc_c::paramList		vParms;

	vURL << "http://" << mZapiHost.latin1() << ":" << mZapiPort << mZapiPath.latin1();

	vCreds.push_back(xmlrpc_c::value_string(pUserName.latin1()));
	vCreds.push_back(xmlrpc_c::value_string(pPswdHash.latin1()));
	vParms.add(xmlrpc_c::value_array(vCreds));
	xmlrpc_c::rpcPtr	vRpcP("category.get_tree", vParms);

	xmlrpc_c::carriageParm_libwww0	vCarriageParm(vURL.str());

	vRpcP->call(&vRpcClient, &vCarriageParm);

	if (vRpcP->isSuccessful())
	{
		LoadCats(vRpcP->getResult(), pCats);
	}
	else
	{
		return END_FUNC(ZERR_UNKNOWN);
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							 Categorize()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Requests that the ZAPI server add this image to the
 *				specified category.
 *
 *	@author		Josh Williams
 *	@date		23-Apr-2005
 *
 *	@param		pUserName
 *					Username for authentication.
 *	@param		pPswdHash
 *					Password hash for authentication.
 *	@param		pId
 *					ID (MD5 hash) of the image being categorized.
 *	@param		pCat
 *					Numeric identifier of the desired category.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 * 31-Oct-2005	Added username and password as		Josh Williams	*
 * 				arguments.											*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::Categorize(const QString& pUserName, const QString& pPswdHash,
								const char *pId, int pCat) const
{
	BEG_FUNC("Categorize")("%p, %p, %s, %d", &pUserName, &pPswdHash, pId, pCat);

	std::ostringstream		vURL;
	xmlrpc_c::clientXmlTransport_libwww	vTransport;
	xmlrpc_c::client_xml	vRpcClient(&vTransport);
	vector<xmlrpc_c::value>	vCreds;
	xmlrpc_c::paramList		vParms;

	vURL << "http://" << mZapiHost.latin1() << ":" << mZapiPort << mZapiPath.latin1();

	vCreds.push_back(xmlrpc_c::value_string(pUserName.latin1()));
	vCreds.push_back(xmlrpc_c::value_string(pPswdHash.latin1()));
	vParms.add(xmlrpc_c::value_array(vCreds));
	vParms.add(xmlrpc_c::value_string(pId));
	vParms.add(xmlrpc_c::value_int(pCat));

	xmlrpc_c::rpcPtr	vRpcP("category.add_to_category", vParms);

	xmlrpc_c::carriageParm_libwww0	vCarriageParm(vURL.str());

	vRpcP->call(&vRpcClient, &vCarriageParm);

	if (!vRpcP->isSuccessful())
	{
		return END_FUNC(ZERR_UNKNOWN);
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *								GetQuotas()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Requests the quota/usage information from the ZAPI
 *				server for the current user.
 *
 *	@author		Josh Williams
 *	@date		23-Apr-2005
 *
 *	@param		pUserName
 *					Username for authentication.
 *	@param		pPswdHash
 *					Password hash for authentication.
 *	@param		pQuota
 *					On success, Will hold the quota (max usage) for
 *					the current user.
 *	@param		pUsage
 *					Current usage (in bytes) for the current user.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 * 31-Oct-2005	Added username and password as		Josh Williams	*
 * 				arguments.											*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::GetQuotas(const QString& pUserName, const QString& pPswdHash,
						   		int &pQuota, int &pUsage) const
{
	BEG_FUNC("GetQuotas")("%p, %p, %p, %p", &pUserName, &pPswdHash, &pQuota, &pUsage);

	std::ostringstream		vURL;
	xmlrpc_c::clientXmlTransport_libwww	vTransport;
	xmlrpc_c::client_xml	vRpcClient(&vTransport);
	vector<xmlrpc_c::value>	vCreds;
	xmlrpc_c::paramList		vParms;

	vURL << "http://" << mZapiHost.latin1() << ":" << mZapiPort << mZapiPath.latin1();

	vCreds.push_back(xmlrpc_c::value_string(pUserName.latin1()));
	vCreds.push_back(xmlrpc_c::value_string(pPswdHash.latin1()));
	vParms.add(xmlrpc_c::value_array(vCreds));

	xmlrpc_c::rpcPtr	vRpcP("users.get_quota_info", vParms);

	xmlrpc_c::carriageParm_libwww0	vCarriageParm(vURL.str());

	vRpcP->call(&vRpcClient, &vCarriageParm);

	if (vRpcP->isSuccessful())
	{
		ValueMap	vResult(xmlrpc_c::value_struct(vRpcP->getResult()));
		if (vResult.find("quota") != vResult.end())
			pQuota = xmlrpc_c::value_int(vResult["quota"]);
		if (vResult.find("usage") != vResult.end())
			pUsage = xmlrpc_c::value_int(vResult["usage"]);
	}
	else
	{
		return END_FUNC(ZERR_UNKNOWN);
	}

	return END_FUNC(ZERR_SUCCESS);
}
#endif // ZULU_TAGGING


/*------------------------------------------------------------------*
 *							IsSupportedImage()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Quick and dirty function to determine if a given URI
 *				points to a supported image or not.
 *
 *	@author		Josh Williams
 *	@date		02-Apr-2005
 *
 * 	@param		pPath
 * 					URI of the file in question.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
bool ZClient::IsSupportedImage(const char *pPath)
{
	const char *vFormat = QImage::imageFormat(pPath);
	QStringList vFormats;

	if (vFormat == NULL)
		return false;

	/*
	 * Get the list of Qt supported formats.
	 */
	vFormats = QImage::inputFormatList();

	QStringList::Iterator vIt = vFormats.begin();
    while (vIt != vFormats.end())
	{
		if ((*vIt).compare(vFormat) == 0)
			return true;
		vIt++;
    }

	return false;
}


/********************************************************************
 *																	*
 *                          O P E R A T O R S                       *
 *																	*
 ********************************************************************/

/********************************************************************
 *																	*
 *                          C A L L B A C K S                       *
 *																	*
 ********************************************************************/

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *							 CreateSocket()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Creates and initializes the network socket.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::CreateSocket()
{
	ZRESULT	vZReturn = ZERR_SUCCESS;

	BEG_FUNC("CreateSocket")(NULL);

	/*
	 * If the socket's already been used, reinitialize it before use.
	 */
	if (mSocket.GetStatus() != SS_UNALLOCATED)
		Disconnect();

	if ((vZReturn = mSocket.Create(0, SOCK_STREAM)) != ZERR_SUCCESS)
	{
		ZTRACE("Unable to create ZSocket.  Error: %d\n", mSocket.GetError());
		Disconnect();
		return END_FUNC(vZReturn);
	}

	return END_FUNC(ZERR_SUCCESS);
}

THREAD_FUNC ZClient::_TransferFile(void *pParam)
{
	static_cast<ZClient*>(pParam)->TransferFile();
	THREAD_RET;
}

/*------------------------------------------------------------------*
 *							 TransferFile()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Magic time.  This is the jewel that performs all the
 *				logic necessary for uploading a file to the Zoto server.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 *
 *	@remarks	For every file to be transfered, the server is first
 *				queried	as to whether or not this particular file is
 *				needed.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::TransferFile()
{
	BEG_FUNC("TransferFile")(NULL);

	QFile			vFile;
	QFileInfo		vFileInfo;
	ZRESULT			vZReturn;
	bool			vNeeded = false;
	int				vBytes = 2048;
	char			vBuffer[2048];
	float			vProgress = 0.0f;
	struct timeval	vLastUpdate, vCurrent;
	double			vElapsed;
	ZULONG			vUpdateBytes = 0L;
	char			vFileDate[20];

	ZTRACE("Attempting to upload file [%s]\n", mCurrentInfo.mFile.latin1());

	mCurrentInfo.mTemp		= false;
	mCurrentInfo.mTempName	= "";
	mCurrentInfo.mStatus	= XFER_ACTIVE;
	mCurrentInfo.mProgress	= 0.0f;
	mCurrentInfo.mBytes		= 0L;

	mThreadLock.Lock();

	gettimeofday(&vLastUpdate, NULL);
	
	/*
	 * First off, let's make sure we can even open the file.
	 */
	vFile.setName(mCurrentInfo.mFile);
	if (vFile.open(IO_ReadOnly) != true)
	{
		ZTRACE("Error opening file [%s]\n", mCurrentInfo.mFile.latin1());
		ClientUpdate(XFER_FAILED, 0.0f, 0L, ZERR_OPEN_FILE);
		return END_FUNC(ThreadCleanup(ZERR_OPEN_FILE));
	}
	vFile.close();
	PauseWait();
	if (mCancel)
	{
		ZTRACE("Cancelled\n");
		return END_FUNC(ThreadCleanup(ZERR_CANCELLED));
	}

	/*
	 * Now, let's see if it's the right format.
	 */
	QString vFormat = QImage::imageFormat(mCurrentInfo.mFile);
	if (vFormat.compare("JPEG") == 0)
	{
		/*
		 * Right format.  Reopen it.
		 */
		vFile.open(IO_ReadOnly);
	}
	else
	{
		/*
		 * Need to convert.
		 */
		ZTRACE("Converting image [%s] to JPEG\n", mCurrentInfo.mFile.latin1());
		if ((vZReturn = CreateTempFile(vFile)) != ZERR_SUCCESS)
		{
			ZTRACE("Error opening file [%s]\n", mCurrentInfo.mTempName.latin1());
			ClientUpdate(XFER_FAILED, 0.0f, 0L, vZReturn);
			return END_FUNC(ThreadCleanup(vZReturn));
		}
	}

	mCurrentInfo.mSize = vFile.size();

	/*
	 * Ok, it's open.  Checksum it.
	 */
	if ((vZReturn = ComputeSum(vFile, mCurrentInfo.mMD5)) != ZERR_SUCCESS)
	{
		ZTRACE("Error summing file [%s]\n", vFile.name().latin1());
		ClientUpdate(XFER_FAILED, 0.0f, 0L, vZReturn);
		return END_FUNC(ThreadCleanup(vZReturn));
	}
	PauseWait();
	if (mCancel)
	{
		ZTRACE("Cancelled\n");
		vFile.close();
		return END_FUNC(ThreadCleanup(ZERR_CANCELLED));
	}

	/*
	 * Get the date, either from the exif or from the modified date.
	 */
	memset(vFileDate, 0, sizeof(vFileDate));
	if ((vZReturn = GetFileDate(vFile, vFileDate)) != ZERR_SUCCESS)
	{
		ZTRACE("Error getting file date for file [%s]\n", vFile.name().latin1());
		ClientUpdate(XFER_FAILED, 0.0f, 0L, vZReturn);
		return END_FUNC(ThreadCleanup(vZReturn));
	}
	PauseWait();
	if (mCancel)
	{
		ZTRACE("Cancelled\n");
		vFile.close();
		return END_FUNC(ThreadCleanup(ZERR_CANCELLED));
	}

	/*
	 * Cool.  File is open and MD5'd.  Does the server want it?
	 */
	if ((vZReturn = ServerFlag(vFile, vNeeded)) != ZERR_SUCCESS)
	{
		ZTRACE("Error processing FLAG for file [%s]\n", vFile.name().latin1());
		ClientUpdate(XFER_FAILED, 0.0f, 0L, vZReturn);
		return END_FUNC(ThreadCleanup(vZReturn));
	}
	PauseWait();
	if (mCancel)
	{
		ZTRACE("Cancelled\n");
		vFile.close();
		return END_FUNC(ThreadCleanup(ZERR_CANCELLED));
	}

	if (vNeeded == false)
	{
		/*
		 * Server doesn't want this file (already uploaded)
		 */
		ZTRACE("Skipping file %s.  Not needed...\n", vFile.name().latin1());
		vFile.close();
		if (mCurrentInfo.mTemp == true)
			DeleteTempFile();
		ClientUpdate(XFER_FAILED, mCurrentInfo.mProgress, vFile.size(), ZERR_DUPLICATE_FILE);
		mThreadLock.Unlock();
		return END_FUNC(ZERR_DUPLICATE_FILE);
	}
	else
	{
		/*
		 * Yay.  Server wants this file.  Send a file packet prior to uploading
		 */
		if ((vZReturn = ServerFile(vFile)) != ZERR_SUCCESS)
		{
			ZTRACE("Unable to process FILE handshaking for file [%s]\n", vFile.name().latin1());
			ClientUpdate(XFER_FAILED, 0.0f, 0L, vZReturn);
			return END_FUNC(ThreadCleanup(vZReturn));
		}
		PauseWait();
		if (mCancel)
		{
			ZTRACE("Cancelled\n");
			vFile.close();
			return END_FUNC(ThreadCleanup(ZERR_CANCELLED));
		}

		/*
		 * Ok, let's do it.  Continue reading the file and sending until either
		 * complete, or an error is encountered.
		 */
		mSocket.EnableThrottling(true);
		while (!vFile.atEnd())
		{
			if ((vBytes = vFile.readBlock(vBuffer, vBytes)) == -1)
			{
				ZTRACE("Error reading from file [%s].\n", vFile.name().latin1());
				ClientUpdate(XFER_FAILED, mCurrentInfo.mProgress, vFile.at(), ZERR_READ_FILE);
				return END_FUNC(ThreadCleanup(vZReturn));
			}
			if (vBytes == 0)
				break;

			/*
			 * At this point, we've read a block of data from the file.
			 * Try and send it to the server.
			 */
			if ((vZReturn = mSocket.Send(vBuffer, vBytes)) != ZERR_SUCCESS)
			{
				if (vZReturn == ZERR_TIMEOUT)
				{
					ZTRACE("Timed out sending data to the server\n");
					ClientUpdate(XFER_FAILED, 0.0f, 0L, vZReturn);
					return END_FUNC(ThreadCleanup(ZERR_TIMEOUT));
				}
				else
				{
					ZTRACE("Unknown error occurred in Send()\n");
					ClientUpdate(XFER_FAILED, 0.0f, 0L, vZReturn);
					return END_FUNC(ThreadCleanup(vZReturn));
				}
			}

			/*
			 * Alright, we've sent the chunk to the server.  Regroup.
			 */
			vUpdateBytes += vBytes;
			gettimeofday(&vCurrent, NULL);
			vElapsed = (vCurrent.tv_sec + vCurrent.tv_usec*1e-6) -
							(vLastUpdate.tv_sec + vLastUpdate.tv_usec*1e-6);

			long vOffset = vFile.at();
			if (vElapsed >= .25f || vOffset == -1)
			{
				vLastUpdate = vCurrent;
				if (vOffset == -1)
					vProgress = 1.0f;
				else
					vProgress = (double)vFile.at() / (double)vFile.size();
               	ClientUpdate(XFER_ACTIVE, vProgress, vUpdateBytes, ZERR_SUCCESS);
				vUpdateBytes = 0L;
			}

			/*
			 * See if the user hit the pause/cancel buttons.
			 */
			PauseWait();
			if (mCancel)
			{
				ZTRACE("Cancelled\n");
				vFile.close();
				return END_FUNC(ThreadCleanup(ZERR_CANCELLED));
			}

			vBytes = 2048;
		} /* while() */

		/*
		 * We're done.  Close the file.
		 */
		vFile.close();

		/*
		 * Phew.  Finished.  Now, make sure all went well in the transfer.
		 */
		ZTRACE("Sending done packet\n");
		if ((vZReturn = ServerDone()) != ZERR_SUCCESS)
		{
			ZTRACE("Error processing DONE logic with server\n");
			ClientUpdate(XFER_FAILED, mCurrentInfo.mProgress, vFile.at(), vZReturn);
			return END_FUNC(ThreadCleanup(vZReturn));
		}

		/*
		 * woot.
		 */
		ZTRACE("ServerDone() complete!\n");
		mThreadLock.Unlock();
		ClientUpdate(XFER_COMPLETE, 1.0f, vUpdateBytes, ZERR_SUCCESS);

		/*
		 * If this was a temp file, delete it.
		 */
		if (mCurrentInfo.mTemp == true)
			DeleteTempFile();

	}

	ZTRACE("******************************\n");
	ZTRACE("******* THREAD EXITING *******\n");
	ZTRACE("******************************\n");

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							 ServerFlag()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Queries the server to determine if the specified
 *				file is needed for upload.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 *
 *	@param		pFile
 *					File object being transferred.
 *	@param		pNeeded
 *					Reference to let the calling function know whether
 *					or not the server deemed an upload of this
 *					image necessary.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::ServerFlag(QFile& pFile, bool& pNeeded)
{
	ZRESULT			vZReturn;
	ZFlagPacket		vFlag;
	ZFlagRespPacket	vFlagResp;
	ZErrorPacket	*vError = NULL;
	char			vFileDate[20];

	BEG_FUNC("ServerFlag")("%p, %p", &pFile, &pNeeded);

	/*
	 * Get the date, either from the exif or from the modified date.
	 */
	memset(vFileDate, 0, sizeof(vFileDate));
	if ((vZReturn = GetFileDate(pFile, vFileDate)) != ZERR_SUCCESS)
	{
		ZTRACE("Error getting file date\n");
		Disconnect();
		return END_FUNC(vZReturn);
	}

	/*
	 * Build the outbound packet.
	 */
	QFileInfo vInfo(pFile.name());
	vFlag.SetImageId(mCurrentInfo.mMD5);
	vFlag.SetImageFormat(ZSP_JPEG);
	vFlag.SetImageSize(pFile.size());
	vFlag.SetImageDate(vFileDate);
	vFlag.SetImageName(mCurrentInfo.mName.latin1());

	/*
	 * Send it and wait for response.
	 */
	vZReturn = SendAndReceive(vFlag, vFlagResp, vError);
	if (vZReturn != ZERR_SUCCESS)
	{
		ZTRACE("Error checking flag with server.\n");
		Disconnect();
		return END_FUNC(ZERR_COMM);
	}

	/*
	 * Is it needed?
	 */
	pNeeded = vFlagResp.GetNeeded();

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							 ServerFile()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Notifies the server that we are ready to upload an
 *				image.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 *
 *	@param		pFile
 *					File object being transferred.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::ServerFile(QFile& pFile)
{
	ZRESULT			vZReturn = ZERR_SUCCESS;
	ZFilePacket		vFile;
	ZFileRespPacket	vFileResp;
	ZErrorPacket	*vError = NULL;
	QFileInfo		vInfo;
	char			vFileDate[20];

	BEG_FUNC("ServerFile")("%p", &pFile);

	/*
	 * Get the date, either from the exif or from the modified date.
	 */
	memset(vFileDate, 0, sizeof(vFileDate));
	if ((vZReturn = GetFileDate(pFile, vFileDate)) != ZERR_SUCCESS)
	{
		ZTRACE("Error getting file date\n");
		Disconnect();
		return END_FUNC(vZReturn);
	}

	/*
	 * Build the outbound packet.
	 */
	vInfo.setFile(pFile);
	vFile.SetImageId(mCurrentInfo.mMD5);
	vFile.SetImageFormat(ZSP_JPEG);
	vFile.SetImageSize(pFile.size());
	vFile.SetImageDate(vFileDate);
	vFile.SetImageName(mCurrentInfo.mName.latin1());

	/*
	 * Send it and wait for response.
	 */
	vZReturn = SendAndReceive(vFile, vFileResp, vError);
	if (vZReturn != ZERR_SUCCESS)
	{
		ZTRACE("Error checking flag with server.\n");
		Disconnect();
		return END_FUNC(ZERR_COMM);
	}

	/*
	 * Check the return code.
	 */
	if (vFileResp.GetReturnCode() != ZSP_FILE_OK)
	{
		ZTRACE("Server rejected our file request.\n");
		ZTRACE("Error - [%d:%s]\n", vFileResp.GetReturnCode(),
			vFileResp.GetReturnText());
		Disconnect();
		return END_FUNC(ZERR_SERVER_ERROR);
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							 ServerDone()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Verifies with the server that an image upload
 *				completed successfully.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::ServerDone()
{
	ZRESULT			vZReturn;
	ZDonePacket		vDone;
	ZDoneRespPacket	vDoneResp;
	ZErrorPacket	*vError = NULL;

	BEG_FUNC("ServerDone")("");

	vDone.SetImageId(mCurrentInfo.mMD5);

	/*
	 * Send it and wait for response.
	 */
	vZReturn = SendAndReceive(vDone, vDoneResp, vError);
	if (vZReturn != ZERR_SUCCESS)
	{
		ZTRACE("Error verifying upload with server.\n");
		Disconnect();
		return(vZReturn);
	}

	/*
	 * Check the return code.
	 */
	if (vDoneResp.GetReturnCode() != ZSP_DONE_OK)
	{
		ZTRACE("Server rejected our done packet.\n");
		ZTRACE("Error - [%d:%s]\n", vDoneResp.GetReturnCode(),
			vDoneResp.GetReturnText());
		Disconnect();
		return END_FUNC(ZERR_SERVER_ERROR);
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							SendAndReceive()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Sends a ZSP packet to the Zoto server and waits for
 *				a response.
 *
 *	@author		Josh Williams
 *	@date		05-Apr-2005
 *
 *	@param		pSend
 *					Packet to be transmitted.
 *	@param		pReceive
 *					Reference to packet to be populated on receive.
 *	@param		pError
 *					Pointer to hold address of error packet in case
 *					of failure.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::SendAndReceive(ZPacket& pSend, ZPacket& pReceive,
									ZErrorPacket *pError)
{
	BEG_FUNC("SendAndReceive")("%p, %p", &pSend, &pReceive);

	ZRESULT     		vZReturn;
	ZUSHORT         	vRemLen;
	ZUSHORT        		vBytes = 0;
	int					vRecvBytes = 0;
	static ZBYTE    	vBuffer[1024];
 	ZUSHORT				vCount = 0;
	static ZHeader		vHeader;
	static ZErrorPacket	vError;

	/*
	 * First, we need to build and send the packet.
	 */
	if ((vZReturn = pSend.Build()) != ZERR_SUCCESS)
		return END_FUNC(vZReturn);

	vZReturn = mSocket.Send(pSend.GetRaw(), pSend.GetPacketLen());
	if (vZReturn != ZERR_SUCCESS)
	{
		ZTRACE("Error sending packet\n");
		Disconnect();
		return END_FUNC(ZERR_COMM);
	}

	/*
	 * Main receive loop.  This loop will continue until either:
	 * a.  A full packet is received, or
	 * b.  The socket is closed
	 */
	while (vCount < 5)
	{
     	vCount++;
		vRecvBytes = 1024 - vBytes;

		/*
		 *	Let's, like, try and receive something.
		 */
	    vZReturn = mSocket.Receive((char *)&vBuffer[vBytes], vRecvBytes, RECEIVE_TIMEOUT);
		switch (vZReturn)
		{
		case ZERR_SUCCESS:
			break;
		case ZERR_INVALID_STATUS:
			ZTRACE("Not connected?\n");
			Disconnect();
			return END_FUNC(ZERR_COMM);
		case ZERR_TIMEOUT:
			ZTRACE("Timed out.\n");
			Disconnect();
			return END_FUNC(ZERR_TIMEOUT);
		default:
			ZTRACE("Bad things happened in Receive()\n");
			ZTRACE("Goet [%s]\n", Z_TO_STRING(vZReturn));
			Disconnect();
			return END_FUNC(ZERR_COMM);
		}

		/*
		 * We received something.  Check the length.
		 */
		vBytes += vRecvBytes;
		if (vRecvBytes <= 0)
		{
			ZTRACE("Socket closed\n");
			Disconnect();
			return END_FUNC(ZERR_COMM);
		}
		else if (vRecvBytes < static_cast<int>(HEADER_SIZE))
		{
			ZTRACE("Incomplete header received\n");
			continue;
		}

		/*
		 * Ok.  We've successfully received AT LEAST a good header.
		 * Let's see if we've got a full packet.
		 */
		vHeader.Parse(vBuffer, vBytes);
		ZTRACE("===================================\n");
		ZTRACE("Received a complete header\n");
		ZTRACE("Type    => [%d]\n", vHeader.GetPacketType());
		ZTRACE("Payload => [%d]\n", vHeader.GetPayloadLen());
		ZTRACE("vBytes  => [%d]\n", vBytes);

		if (vBytes < vHeader.GetPacketLen())
		{
			ZTRACE("haven't received complete packet yet.  continuing...\n");
		    continue; // Not a complete packet yet
		}

		/*
		 * Full packet.  Is it an error packet?
		 */
		if (vHeader.GetPacketType() == ZSP_ERROR)
		{
			ZTRACE("Received error packet from the server\n");
			vError.Parse(vBuffer, vHeader.GetPacketLen());
			pError = &vError; // Store it so the calling function can process
			return END_FUNC(ZERR_SERVER_ERROR);
		}

		/*
		 * Ok.  It's a full packet, and it's not an error.  Is it the right type?
		 */
		if (vHeader.GetPacketType() != pReceive.GetPacketType())
		{
			ZERROR("Packet type mismatch\nExpecting [%d], received [%d]\n",
						pReceive.GetPacketType(), vHeader.GetPacketType());
			return END_FUNC(ZERR_COMM);
		}

		/*
		 * OMGLOLwtF!!!!!1  Sweet jesus, it worked.
		 */
		ZTRACE("complete packet received\n");
		pReceive.Parse(vBuffer, vBytes);
		ZTRACE("packet length: %d\n", pReceive.GetPacketLen());
		vRemLen = vBytes - pReceive.GetPacketLen();
		if (vRemLen > 0)
		{
			// copy the remaining bytes to the front of the buffer
            memcpy(vBuffer, &vBuffer[pReceive.GetPacketLen()], vRemLen);
   	        // clear the rest of the buffer
       	    memset(&vBuffer[vRemLen], '\0', 1024 - vRemLen);
           	vBytes = vRemLen;
		}
		else
		{
			memset(vBuffer, '\0', 1024);
			vBytes = 0;
		}

		break;
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							 ClientUpdate()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Called to notify the calling process of upload progress.
 *
 *	@author		Josh Williams
 *	@date		10-Mar-2005
 *
 *	@param		pStat
 *					Current status of the upload process.
 *	@param		pProgress
 *					Percentage of upload complete.
 *	@param		pBytes
 *					Number of bytes uploaded since the last update.
 *	@param		pErrCode
 *					Error encountered during upload, or ZERR_SUCCESS.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::ClientUpdate(ZXferStat pStat, double pProgress,
										long pBytes, ZRESULT pErrCode)
{
	BEG_FUNC("ClientUpdate")("%d, %f, %d, %d", pStat, pProgress,
							pBytes, pErrCode);

	if (mCallback != NULL)
	{
		mCurrentInfo.mStatus	= pStat;
		mCurrentInfo.mProgress	= pProgress;
		mCurrentInfo.mBytes		= pBytes;
		mCurrentInfo.mErrcode	= pErrCode;
		mCallback(&mCurrentInfo);
	}

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							 ComputeSum()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Calculates the MD5 sum of the specified file.
 *
 *	@author		Josh Williams
 *	@date		10-Mar-2005
 *
 *	@param		pFile
 *					File object to be checksum'd.
 *	@param		pChecksum
 *					Buffer to hold the MD5 sum.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::ComputeSum(QFile& pFile, char *pChecksum)
{
	static char			vBuffer[1024];
	static char			vDigest[33];
	static int			vBytes = 0;
	static ZMD5Hasher	vHasher;
	ZRESULT				vZReturn = ZERR_SUCCESS;

	BEG_FUNC("ComputeSum")("%p, %p", &pFile, pChecksum);

	ZTRACE("Trying to hash [%s]\n", pFile.name().latin1());
	pFile.reset();

	if (pFile.atEnd())
	{
		ZERROR("Error at end of file!");
		return END_FUNC(ZERR_READ_FILE);
	}

	if (pFile.status() != IO_Ok)
	{
		ZERROR("Unable to open file\n");
		return END_FUNC(ZERR_OPEN_FILE);
	}

	vHasher.Init();
	vBytes = pFile.readBlock(vBuffer, 1024);
	if (vBytes == 0)
	{
		ZERROR("Unable to read file.\n");
		return END_FUNC(ZERR_READ_FILE);
	}

	while (vBytes > 0)
	{
		vHasher.Update((ZBYTE *)vBuffer, vBytes);
		vBytes = pFile.readBlock(vBuffer, 1024);
	}

	pFile.reset();

	vHasher.Final();

	vZReturn = vHasher.GetDigestString(vDigest, sizeof(vDigest));
	if (vZReturn != ZERR_SUCCESS)
	{
		return END_FUNC(vZReturn);
	}

	vDigest[32] = '\0';

	memcpy(pChecksum, vDigest, 32);

	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							 ThreadCleanup()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Closes down the socket and releases the thread lock.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 *
 *	@param		pResult
 *					Value to be returned on completion.
 *
 *	@remarks	Only call this function if the thread is shutting down
 *				abnormally, as the socket will be closed, preventing
 *				further processing.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::ThreadCleanup(ZRESULT pResult)
{
	Disconnect();
	mThreadLock.Unlock();
	mSocket.EnableThrottling(false);

	/*
	 * Remove the temporary file, if it exists.
	 */
	if (mCurrentInfo.mTemp == true)
		DeleteTempFile();

	return pResult;
}

#ifdef ZULU_TAGGING
/*------------------------------------------------------------------*
 *								LoadCats()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Iterates over the list of categories received from the
 *				ZAPI server and loads them into the list.
 *
 *	@author		Josh Williams
 *	@date		22-Apr-2005
 *
 *	@param		pResult
 *					Value received from the ZAPI server.
 *	@param		pCats
 *					List to hold the categories.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::LoadCats(const xmlrpc_c::value& pResult, ZCatList& pCats) const
{
	BEG_FUNC("LoadCats")("%p, %p", &pResult, &pCats);

	ZCatInfo				*vCat;
	int						vCatId;

	/* sanity checking */
	if (pResult.type() != xmlrpc_c::value::TYPE_ARRAY)
		return END_FUNC(ZERR_UNKNOWN);

	xmlrpc_c::value_array const vArr(pResult);
	vector<xmlrpc_c::value> const vResultArr(
			static_cast<vector<xmlrpc_c::value> >(vArr.vectorValueValue()));

	for (unsigned int i = 0; i < vResultArr.size(); i++)
	{		
		if (vResultArr.at(i).type() != xmlrpc_c::value::TYPE_STRUCT)
			return END_FUNC(ZERR_UNKNOWN);

		ValueMap	vCurrent(xmlrpc_c::value_struct(vResultArr.at(i)));

		vCatId = xmlrpc_c::value_int(vCurrent["category_id"]);

		if (vCatId < 0) // Non-display cat-id
			continue;

		vCat = new ZCatInfo();
		if (vCurrent.find("name") != vCurrent.end())
			vCat->mName	= xmlrpc_c::value_string(vCurrent["name"]);
		if (vCurrent.find("cat_type") != vCurrent.end())
			vCat->mType = xmlrpc_c::value_int(vCurrent["cat_type"]);
		if (vCurrent.find("category_id") != vCurrent.end())
			vCat->mId = xmlrpc_c::value_int(vCurrent["category_id"]);
		if (vCurrent.find("parent_id") != vCurrent.end())
			vCat->mParentId = xmlrpc_c::value_int(vCurrent["parent_id"]);
		if (vCurrent.find("visible") != vCurrent.end())
			vCat->mVisible = xmlrpc_c::value_string(vCurrent["visible"]);
		if (vCurrent.find("cnt_images") != vCurrent.end())
			vCat->mImgCount = xmlrpc_c::value_int(vCurrent["cnt_images"]);
		if (vCurrent.find("cnt_images_recursive") != vCurrent.end())
			vCat->mImgCountRecurs = xmlrpc_c::value_int(vCurrent["cnt_images_recursive"]);
		if (vCurrent.find("order_index") != vCurrent.end())
			vCat->mOrderIndex = xmlrpc_c::value_int(vCurrent["order_index"]);
		if (vCurrent.find("description") != vCurrent.end())
			vCat->mDescription = xmlrpc_c::value_string(vCurrent["description"]);
		if (vCurrent.find("email") != vCurrent.end())
			vCat->mEmail = xmlrpc_c::value_string(vCurrent["email"]);
		if (vCurrent.find("updated") != vCurrent.end())
			vCat->mUpdated = xmlrpc_c::value_string(vCurrent["updated"]);
		if (vCurrent.find("username") != vCurrent.end())
			vCat->mUsername = xmlrpc_c::value_string(vCurrent["username"]);

		xmlrpc_c::value_array	vSubs(vCurrent["subcategories"]);
		vCat->mSubCatCnt = vSubs.size();
		if (vCat->mSubCatCnt > 0)
			LoadCats(vCurrent["subcategories"], vCat->mSubs);

		ZTRACE("Adding category [%s]\n", vCat->mName.c_str());
		if (vCat->mOrderIndex < 0)
			pCats[vCat->mOrderIndex * -1] = vCat;
		else
			pCats[i] = vCat;
	}

	return END_FUNC(ZERR_SUCCESS);
}
#endif // ZULU_TAGGING

/*------------------------------------------------------------------*
 *								GetFileDate()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Retrieves the creation date of the file.
 *
 *	@author		Josh Williams
 *	@date		05-May-2005
 *
 *	@param		pFile
 *					URI of the file being processed.
 *	@param		pDate
 *					Buffer to hold the formatted date.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::GetFileDate(const QFile& pFile, char *pDate)
{
	QString		vDateTime;
	QFileInfo	vInfo(pFile);

	BEG_FUNC("GetFileDate")("%p, %p", &pFile, pDate);

	/*
	 * coded on the blessed day of Cinco dey Mayo.  Viva la Tequila!
	 */
	vDateTime = vInfo.created().toString("yyyy-MM-dd hh:mm:ss");

	memcpy(pDate, vDateTime.latin1(), 19);

	ZTRACE("File creation date => [%s]\n", pDate);
	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							CreateTempFile()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Creates a temporary file in JPEG format.
 *
 *	@author		Josh Williams
 *	@date		07-Jul-2005
 *
 *	@param		pFile
 *					Reference to the file object to hold the temp file.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::CreateTempFile(QFile& pFile)
{
	QString		vTempPath;
	QDir		vDir;
	char		vTempMD5[33];
	QFile		vFile;
	ZRESULT		vZReturn;

	BEG_FUNC("CreateTempFile")(NULL);

	/*
	 * If we don't already have a temp directory, create one.
	 */
	vTempPath = qApp->applicationDirPath();
	vTempPath += "/temp/";
	vDir.setPath(vTempPath);
	ZTRACE("Checking temp path [%s]\n", vTempPath.latin1());
	if (vDir.exists() == false)
	{
		ZTRACE("Creating temp directory\n");
		if (vDir.mkdir(vTempPath))
			ZTRACE("Temp directory created\n");
		else
		{
			ZTRACE("Unable to create temp directory\n");
			return END_FUNC(ZERR_OPEN_FILE);
		}
	}
		

	/*
	 * Get a temporary MD5
	 */
	vFile.setName(mCurrentInfo.mFile);
	if (vFile.open(IO_ReadOnly) != true)
	{
		ZTRACE("Error opening file [%s]\n", mCurrentInfo.mFile.latin1());
		return END_FUNC(ZERR_OPEN_FILE);
	}

	memset(vTempMD5, '\0', sizeof(vTempMD5));
	if ((vZReturn = ComputeSum(vFile, vTempMD5)) != ZERR_SUCCESS)
	{
		ZTRACE("Error summing file\n");
		return END_FUNC(vZReturn);
	}
	vFile.close();

	/*
	 * Convert the file.
	 */
	ZTRACE("Converting the file\n");
	mCurrentInfo.mTemp = true;
	mCurrentInfo.mTempName = vTempPath;
	mCurrentInfo.mTempName += "ZOTO_";
	mCurrentInfo.mTempName += vTempMD5;
	mCurrentInfo.mTempName += ".jpg";
	ZTRACE("Temp name built as [%s]\n", mCurrentInfo.mTempName.latin1());
	QImage vImg(mCurrentInfo.mFile);
	ZTRACE("Temp pix opened\n");
	if (vImg.isNull())
	{
		ZTRACE("NULL Image!\n");
		return END_FUNC(ZERR_OPEN_FILE);
	}
	vImg.save(mCurrentInfo.mTempName, "JPEG", 100);
	ZTRACE("Temp pix saved\n");
	pFile.setName(mCurrentInfo.mTempName);
	ZTRACE("File converted\n");

	/*
	 * Try to open it.
	 */
	if (pFile.open(IO_ReadOnly) != true)
	{
		ZTRACE("Error opening file [%s]\n", mCurrentInfo.mTempName.latin1());
		return END_FUNC(ZERR_OPEN_FILE);
	}
	
	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *							DeleteTempFile()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Removes the temporary jpeg file created when uploading
 *				an image from an alternate format (.gif, .bmp, etc)
 *
 *	@author		Josh Williams
 *	@date		07-Jul-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZClient::DeleteTempFile()
{
	BEG_FUNC("DeleteTempFile")(NULL);

	/*
	 * For sanity's sake, triple check that this was a temp file.
	 */
	if (mCurrentInfo.mTemp == true)
	{
		ZTRACE("Deleting temporary file [%s]\n", mCurrentInfo.mTempName.latin1());
		QFile::remove(mCurrentInfo.mTempName);
	}

	mCurrentInfo.mTemp = false;
	
	return END_FUNC(ZERR_SUCCESS);
}

/*------------------------------------------------------------------*
 *								PauseWait()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Checks to see if we're paused and if so, waits for
 *				resume signal.
 *
 *	@author		Josh Williams
 *	@date		14-Sep-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZClient::PauseWait()
{
	BEG_FUNC("PauseWait")(NULL);

	if (mPaused)
	{
		ZTRACE("We are paused\n");
		mPauseWait.wait();
	}
	else
		ZTRACE("We are NOT paused\n");
	END_FUNCV();
}

} // End Namespace

/* vi: set ts=4: */
