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
 * 17-Jun-2005	Added auto-private logic.						Josh Williams *
 *                                                                            *
 *============================================================================*/
#include "ZApp.h"

/* System Headers */
#include <qmutex.h>
#include <fstream>
#include <time.h>
#if ZULU_PLATFORM == PLATFORM_WINDOWS
#include <windows.h>
#include <shellapi.h>
#include <process.h>
#endif

/* Local Headers */
#include "ZMD5Hasher.h"
#include "ZTypes.h"
#include "ZEvents.h"
#include "ZLog.h"
#include "ZUtils.h"

namespace ZOTO
{

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZApp::ZApp(int& argc, char **argv)
	: QApplication(argc, argv), mUserName(""), mUserHash(""), mPswdHash(""),
		mAuto(false), mTracing(false), mClient(NULL)
#ifdef ZULU_TAGGING
		, mPrivate(false), mTagging(true), mQuota(0), mUsage(0)
#endif
{
	QSettings vConfig;
	SetConfigPath(vConfig);

	/*
	 * Grab the config values from the file/registry
	 */
	mUserName	= vConfig.readEntry(BuildConfigPath("/UserName"), "");
	mUserHash	= vConfig.readEntry(BuildConfigPath("/UserHash"), "");
	mPswdHash   = vConfig.readEntry(BuildConfigPath("/PswdHash"), "");
	mAppName    = vConfig.readEntry(BuildConfigPath("/AppTitle"), tr(MAIN_NAME));
	mAuto		= vConfig.readBoolEntry(BuildConfigPath("/AutoLogin"), false);
#ifdef ZULU_TAGGING
	mPrivate	= vConfig.readBoolEntry(BuildConfigPath("/AutoPrivate"), false);
	mTagging	= vConfig.readBoolEntry(BuildConfigPath("/Tagging"), true);
#endif
	mTracing	= vConfig.readBoolEntry(BuildConfigPath("/Tracing"), false);

	/*
	 * Create the global client object for ZSP/ZAPI comm.
	 */
    mClient = new ZClient();
}

ZApp::~ZApp()
{
	Shutdown();
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
 *							   SetUser()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Stores the username to be used when connecting to
 *				the Zoto server.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 *	@param		pUser
 *					Username to be used for ZSP authentication.
 *
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZApp::SetUser(const char *pUser)
{
	char vHash[33];
	if (pUser == NULL)
		mUserName = "";
	else
		mUserName = pUser;

	ZMD5Hasher::HashString(mUserName.latin1(),
			mUserName.length(), vHash, sizeof(vHash));
	mUserHash = vHash;
}

/*------------------------------------------------------------------*
 *							   SetPswd()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Stores the password to be used when connecting to
 *				the Zoto server.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 *	@param		pPswd
 *					Password to be used for ZSP authentication.
 *
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZApp::SetPswd(const char *pPswd)
{
	char vHash[33];
	ZMD5Hasher::HashString(pPswd, strlen(pPswd), vHash, sizeof(vHash));
	SetPswdHash(vHash);
}

#ifdef ZULU_TAGGING
/*------------------------------------------------------------------*
 *							 LoadCategories()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Connects to the Zoto server and requests ZSP
 *              authentication.
 *
 *	@author		Josh Williams
 *	@date		22-Mar-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
bool ZApp::LoadCategoriesUsage()
{
	mCats.clear();

	if (mClient->GetCategories(mUserName, mPswdHash, mCats) != ZERR_SUCCESS)
		return false;

	if (mClient->GetQuotas(mUserName, mPswdHash, mQuota, mUsage) != ZERR_SUCCESS)
		return false;
	
	return true;
}
#endif // ZULU_TAGGING

/*------------------------------------------------------------------*
 *							 Initialize()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Handles loading application configuration and
 *               initializing the ZSP client code.
 *
 *	@author		Josh Williams
 *	@date		22-Mar-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
bool ZApp::Initialize()
{
	ZRESULT retval;

	/*
	 * Now that the client is configured, try and initialize it.
	 */
    if ((retval = mClient->Initialize()) != ZERR_SUCCESS)
	{
		return false;
	}

	return true;
}

/*------------------------------------------------------------------*
 *								Shutdown()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Kills the client connection.
 *
 *	@author		Josh Williams
 *	@date		22-Mar-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZApp::Shutdown()
{
	if (mClient != NULL)
	{
		mClient->Disconnect();
		delete mClient;
		mClient = NULL;
	}
}

/*------------------------------------------------------------------*
 *								SaveSettings()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Saves the configuration information specific to this
 *				class.
 *
 *	@author		Josh Williams
 *	@date		05-Aug-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZApp::SaveSettings() const
{
	QSettings	vConfig;

	SetConfigPath(vConfig);
	vConfig.writeEntry(BuildConfigPath("/UserName"), "");
	vConfig.writeEntry(BuildConfigPath("/UserHash"), "");
	vConfig.writeEntry(BuildConfigPath("/PswdHash"), "");
	vConfig.writeEntry(BuildConfigPath("/AutoLogin"), mAuto);
#ifdef ZULU_TAGGING
	vConfig.writeEntry(BuildConfigPath("/AutoPrivate"), mPrivate);
	vConfig.writeEntry(BuildConfigPath("/Tagging"), mTagging);
#endif
}

/********************************************************************
 *																	*
 *                          C A L L B A C K S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *							TraceHandler()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Handles qDebug messages.
 *	@author		Josh Williams
 *	@date		05-May-2005
 *
 *	@param		pType
 *					Message type (debug, warning, etc)
 *	@param		pMsg
 *					Actual message to be output.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZApp::TraceHandler(QtMsgType pType, const char *pMsg)
{
#ifdef TRACE_ENABLE
	static bool				vFirstTime = true;
	static std::ofstream	vFile;
	static QMutex			vLogMutex;
	static char				vFileName[256];
	static char				*vPtr = NULL;
	static time_t			vNow = time(NULL);
	static bool				vFileOpen = false;
	
	vLogMutex.lock();

	if (vFirstTime)
	{
		strncpy(vFileName, qApp->applicationFilePath().latin1(), sizeof(vFileName));
		if ((vPtr = strstr(vFileName, ".exe")) != NULL)
		{	/* found the .exe extension.  replace it with .log */
			strftime(vPtr, sizeof(vFileName) - strlen(vFileName), "-gui_%m%d%Y_%H%M%S.log", localtime(&vNow));
		}
		else
		{	/* probably linux/mac.  just add .log */
			strftime(&vFileName[strlen(vFileName)], sizeof(vFileName) - strlen(vFileName),
					"-gui_%m%d%Y_%H%M%S.log", localtime(&vNow));
		}
		vFile.open(vFileName);
		if (vFile.good())
			vFileOpen = true;
		vFirstTime = false;
	}

	if (vFileOpen)
	{
		switch ( pType )
		{
		case QtDebugMsg:
			vFile << "Debug: " << pMsg << std::endl;
			break;
		case QtWarningMsg:
			vFile << "Warning: " << pMsg << std::endl;
			break;
		case QtFatalMsg:
			vFile << "Fatal: " << pMsg << std::endl;
			abort();                    // deliberately core dump
		}
	}

	vLogMutex.unlock();
#endif
}

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *							BuildConfigPath()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Builds the application specific config path (registry,
 *				.ini, etc)
 *	@author		Josh Williams
 *	@date		16-May-2005
 *
 *	@param		pSetting
 *					Setting we're trying to query.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
const QString ZApp::BuildConfigPath(const char *pSetting) const
{
	QString vPath;
#if ZULU_PLATFORM == PLATFORM_WINDOWS
	vPath = pSetting;
#elif ZULU_PLATFORM == PLATFORM_MAC || ZULU_PLATFORM == PLATFORM_LINUX
	vPath = "/Zoto/Zulu";
	vPath += pSetting;
#else
#error Unsupported Platform
#endif
	return vPath;
}

/*------------------------------------------------------------------*
 *							 SetConfigPath()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Sets the path for reading values from within the
 *				registry, file.
 *	@author		Josh Williams
 *	@date		05-Aug-2005
 *
 *	@param		pSettings
 *					QSettings object.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZApp::SetConfigPath(QSettings& pSettings) const
{
	/*
	 * Set the path to the application configuration file/key.
	 */
#if ZULU_PLATFORM == PLATFORM_WINDOWS
	pSettings.setPath("Zoto.com", "Zulu", QSettings::User);
#elif ZULU_PLATFORM == PLATFORM_MAC
	pSettings.setPath("Zoto", "Zulu", QSettings::User);
#elif ZULU_PLATFORM == PLATFORM_LINUX
	pSettings.insertSearchPath(QSettings::Unix, qApp->applicationDirPath().latin1());
#else
#error Unsupported platform!
#endif
}

} // End Namespace
