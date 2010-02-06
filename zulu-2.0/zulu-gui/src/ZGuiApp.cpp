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
#include "ZGuiApp.h"

/* System Headers */
#include <qmessagebox.h>
#include <qmutex.h>
#include <qfileinfo.h>
#include <fstream>
#include <time.h>
#if ZULU_PLATFORM == PLATFORM_WINDOWS
#include <windows.h>
#include <shellapi.h>
#include <process.h>
#endif

/* Local Headers */
#include "ZMD5Hasher.h"
#include "ZMainWin.h"
#include "ZPrefWin.h"
#include "ZTypes.h"
#include "ZEvents.h"
#include "ZLog.h"
#include "ZUpdater.h"
#include "ZUtils.h"
#include "ZImageView.h"
#include "ZCategoryView.h"
#include "ZUploadView.h"

namespace ZOTO
{

#if ZULU_PLATFORM == PLATFORM_WINDOWS

HWND gWnd = NULL;

BOOL CALLBACK FindZuluWin(HWND pWnd, LPARAM pParam)
{
	char	vTitle[256];
	int		vLength = 0;

	vLength = GetWindowTextA(pWnd, vTitle, 256);
	if (vLength > 0)
	{
		if (strncmp(vTitle, MAIN_NAME, ZMIN(vLength, (int)strlen(MAIN_NAME))) == 0)
		{
			gWnd = pWnd;
			return FALSE; // Stop search
		}
	}

	return TRUE;
}
#endif

void CallbackFunc(ZXferInfo *pInfo)
{
	ZSPEvent *vEvt = new ZSPEvent();
	vEvt->mFile		= pInfo->mFile;
	vEvt->mName		= pInfo->mName;
	vEvt->mTemp		= pInfo->mTemp;
	vEvt->mSize		= pInfo->mSize;
	vEvt->mID		= pInfo->mID;
	memcpy(vEvt->mMD5, pInfo->mMD5, sizeof(vEvt->mMD5));
	vEvt->mMD5[32] = '\0';
	vEvt->mStatus	= pInfo->mStatus;
	vEvt->mProgress	= pInfo->mProgress;
	vEvt->mBytes	= pInfo->mBytes;
	vEvt->mErrcode	= pInfo->mErrcode;
	QApplication::postEvent(ZULU_GUI_APP()->mainWidget(), vEvt);
}

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZGuiApp::ZGuiApp(int& argc, char **argv)
	: ZApp(argc, argv), mLastBrowse(""), mAppName(""), mVersionOk(false),
		mState(ZULU_INIT), mTotalBytes(0L), mUploadBytes(0L),
		mCurrentBytes(0L), mCurrentFile(0), mUploadPaused(false)
{
	/*
	 * Enable tracing, if applicable.
	 */
	if (mTracing)
		qInstallMsgHandler(ZApp::TraceHandler);

}

ZGuiApp::~ZGuiApp()
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
bool ZGuiApp::Initialize()
{
	bool vRetval = false;

	SwitchState(ZULU_IMAGES);

	if (ZApp::Initialize() == false)
	{
		qDebug("%s::Unable to initialize client", __FILE__);
		QMessageBox::critical(NULL, GetAppName(), tr("Unable to start the Zoto Uploader.\n"
							"Please re-install the application and try again."));
		return vRetval;
	}

	if (Authenticate())
	{
		processEvents(); // So the screen refreshes
#ifdef ZULU_TAGGING
		WAIT_CURSOR_ON();
		if (LoadCategoriesUsage() == true)
		{
			static_cast<ZMainWin*>(mainWidget())->UpdateUsage(mQuota, mUsage, mTotalBytes);
			static_cast<ZMainWin*>(mainWidget())->GetCategoryView()->LoadCategories(mCats);
			vRetval = true;
		}
		WAIT_CURSOR_OFF();
#else
		vRetval = true;
#endif
	}

	return vRetval;
}

/*------------------------------------------------------------------*
 *								Shutdown()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Saves all configuration information and shuts down
 *              the ZSP library if necessary.
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
void ZGuiApp::Shutdown()
{
	QSettings	vConfig;
	
	ZApp::Shutdown();

#if ZULU_PLATFORM == PLATFORM_WINDOWS
	vConfig.setPath("Zoto.com", "Zulu", QSettings::User);
#else
	vConfig.setPath("Zoto", "Zulu", QSettings::User);
#endif

	vConfig.writeEntry(BuildConfigPath("/LastBrowse"), mLastBrowse);
}

/*------------------------------------------------------------------*
 *							 Authenticate()							*
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
bool ZGuiApp::Authenticate()
{
	ZRESULT vZRetval;
	bool	vPrompt = false;
	bool	vAuthd = false;
	bool	vAuto = GetAuto();
#ifdef ZULU_TAGGING
	bool	vPrivate = GetPrivate();
	bool	vTagging = GetTagging();
#endif
	QString	vOrigUser, vOrigPswdHash;
	QString vNewUser, vNewPswdHash;
	QString	vPswd;
	char	vHash[33];
	
	vOrigUser = vNewUser = mUserName;
	vOrigPswdHash = vNewPswdHash = mPswdHash;

	if (mUserHash == "" || mPswdHash == ""|| GetAuto() == false)
		vPrompt = true;

	/*
	 * we can't move past this point until either:
	 * A. The user has been authenticated, or
	 * B. The user cancels the login prompt.
	 */
	while (!vAuthd)
	{
		/*
		 * If the user chose to save their login information, the prompt will
		 * not be displayed.  However, if during the course of authenticating
		 * an error is encountered (bad credentials, internal error, etc), the
		 * login prompt will be created and displayed.
		 */
        if (vPrompt)
		{
			/*
			 * Create the window and initialize it's values.
			 */
			ZPrefWin vPrefWin(mainWidget());

			vPrefWin.SetUser(vOrigUser);
			vPrefWin.SetPswd(vOrigPswdHash);
			vPrefWin.SetAuto(vAuto);
#ifdef ZULU_TAGGING
			vPrefWin.SetPrivate(vPrivate);
			vPrefWin.SetTagging(vTagging);
#endif
			bool vReturn = vPrefWin.exec();
			processEvents(); // So the screen refreshes

			/*
			 * Check the action performed by the user.
			 */
			if (vReturn == QDialog::Accepted)
			{

				vPrefWin.GetUser(vNewUser);
				vPrefWin.GetPswd(vPswd);
				vAuto		= vPrefWin.GetAuto();
#ifdef ZULU_TAGGING
				vPrivate	= vPrefWin.GetPrivate();
				vTagging	= vPrefWin.GetTagging();
#endif
				ZMD5Hasher::HashString(vPswd.latin1(), vPswd.length(), vHash, sizeof(vHash));
				vNewPswdHash = vHash;
			}
			else
			{
				break;
			}
		}

		vZRetval = ConnectAndAuth(vNewUser, vNewPswdHash);
		GetClient()->Disconnect();				

		if (vZRetval != ZERR_SUCCESS)
		{
			if (vZRetval == ZERR_INVALID_VERSION || vZRetval == ZERR_NEW_VERSION)
				break;
			
			vPrompt = true;
			continue;
		}

		/*
		 * If we're here, the client version is ok and the username/password
		 * have been verified.
		 */
		if (vPrompt == true)
		{
			SetUser(vNewUser);
			SetPswdHash(vNewPswdHash);
			SetAuto(vAuto);
#ifdef ZULU_TAGGING
			SetPrivate(vPrivate);
			SetTagging(vTagging);
#endif
			SaveSettings();
		}
		vAuthd = true;
	}

	return vAuthd;	
}

/*------------------------------------------------------------------*
 *								AddFile()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Adds an image to the image view, as well as to this
 *				class's internal list of uploads.
 *
 *	@author		Josh Williams
 *	@date		13-Aug-2005
 *
 * 	@remarks	Checks to be sure the image isn't already in the list,
 * 				as well as the image's format.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZGuiApp::AddFile(const QString &pURI)
{
	QFileInfo		vFileInfo;
	QStringList		vInvalid;
	int				vCount = 0;
	ZULONG			vKey;
	ZFileInfo		vInfo;

	vFileInfo.setFile(pURI);
	if (ZClient::IsSupportedImage(vFileInfo.absFilePath().latin1()))
	{
		qDebug("%s::%s is a supported image", __FILE__, vFileInfo.absFilePath().latin1());
		/*
		 * This is an image.  Create it's key hash.
		 */
		vKey = CreateKey(vFileInfo.absFilePath());

		/*
		 * Make sure this file isn't already in the list.
		 */
		if (mUploads.contains(vKey))
			return;

		vInfo.mName = vFileInfo.absFilePath();
		vInfo.mSize = vFileInfo.size();
		vInfo.mKey	= vKey;
		mUploads[vKey] = vInfo;
		mTotalBytes += vFileInfo.size();
		qDebug("%s::Added %s to upload list.", __FILE__, vFileInfo.absFilePath().latin1());
		vCount++;
		if (mainWidget())
			static_cast<ZMainWin*>(mainWidget())->GetImageView()->AddFile(vInfo);
	}
	else
	{
		/*
		 * Not an image.  Add it to the "bad" list.
		 */
		vInvalid.append(vFileInfo.fileName());
	}


	/*
	 * Inform the user of all invalid files.
	 */
	if (vInvalid.count() > 0)
	{
		QString vMsg;
		vMsg.sprintf(tr("The following files were not valid:\n"));
		for (unsigned int i = 0; i < vInvalid.count(); i++)
		{
			vMsg.append(vInvalid[i]);
			vMsg.append('\n');
		}
		QMessageBox::warning(mainWidget(), GetAppName(), vMsg);
	}
	
	static_cast<ZMainWin*>(mainWidget())->UpdateButtons(mState);
}


/*------------------------------------------------------------------*
 *							RemoveFile()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Removes a file from the image view and the internal
 *				upload list.
 *
 *	@author		Josh Williams
 *	@date		13-Aug-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZGuiApp::RemoveFile(ZULONG pID)
{
	if (mUploads.contains(pID))
	{
		mTotalBytes -= mUploads[pID].mSize;
		mUploads.erase(pID);
		static_cast<ZMainWin*>(mainWidget())->GetImageView()->RemoveFile(pID);
		static_cast<ZMainWin*>(mainWidget())->UpdateButtons(mState);
	}
}

#if ZULU_PLATFORM == PLATFORM_WINDOWS
/*------------------------------------------------------------------*
 *							 winEventFilter()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Used to intercept messages from additional instances
 *				when they are started up.
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
bool ZGuiApp::winEventFilter(MSG *msg)
{
	if (msg->message == WM_COPYDATA)
	{
		QStringList	vFiles;
		QString		vFile;
		COPYDATASTRUCT *cds = reinterpret_cast<COPYDATASTRUCT *>(msg->lParam);
		qDebug("%s::This is what the message was: [%s]", __FILE__, cds->lpData);

		int		nLength = cds->cbData;
		vFiles = QStringList::split(';', QString(reinterpret_cast<char *>(cds->lpData)));
		while (vFiles.count() > 0)
		{
			vFile = vFiles.front();
			vFiles.pop_front();
			if (vFile.length() > 0)
			{
				qDebug("%s::Adding autoload from message [%s]", __FILE__, vFile.latin1());
				AddFile(reinterpret_cast<const char*>(vFile.latin1()));
			}
		}
		
		ZShellDropEvent* evt = new ZShellDropEvent();
		QWidget *mWidget = mainWidget();
		if (mWidget != NULL)
			QApplication::postEvent(mWidget, evt);
		return true;
	}
	else
	{
		return false;
	}
}
#endif

/*------------------------------------------------------------------*
 *							 PreviousInstance()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Checks for an already running copy of the program.
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
bool ZGuiApp::PreviousInstance(int& argc, char **argv)
{
#if ZULU_PLATFORM == PLATFORM_WINDOWS

	HWND				vOther = NULL;
	HWND				vInvisWnd = NULL;
	HANDLE				vMutex;
	ZUSHORT				vCount = 0;

	/*
	 * First, try to open the mutex.  This will tell us if an existing
	 * instance is already running.
	 */
	vMutex = OpenMutexA(MUTEX_ALL_ACCESS, 0, MUTEX_NAME);
	if (!vMutex)
	{
		/*
		 * Mutex doesn't exist.  Create it and bail
		 */
		CreateMutexA(0, FALSE, MUTEX_NAME);
		return false;
	}
	else
	{
		/*
		 * Mutex exists.  An existing instance is already running.  Try
		 * to find our placeholder window.
		 */
		vInvisWnd = FindWindowA(0, INVIS_NAME);
		while (vCount++ < 5 && vInvisWnd == NULL)
			Sleep(50);

		if (vInvisWnd == NULL)
		{
			//QMessageBox::critical(NULL, "Oops", "Unable to find placeholder");
			return true;
		}

		/*
		 * Send the previous instance our stuff
		 */
		if (argc > 1)
		{
			QString strMsg;
			QString strFiles = "";
			for (int i = 1; i < argc; i++)
			{
				strFiles += ";";
				strFiles += argv[i];
			}
			COPYDATASTRUCT cds;
			cds.cbData = strFiles.length()+1;
			char *pcBuffer = new char[strFiles.length()+1];
			memset(pcBuffer, '\0', sizeof(pcBuffer));
			memcpy(pcBuffer, strFiles.latin1(), strFiles.length());
			cds.lpData = pcBuffer;
			SendMessage(vInvisWnd, WM_COPYDATA, 0, (LPARAM)&cds);
		}

		/*
		 * Now that we've notified the existing window of our new data,
		 * try to find one of it's windows and activate it.
		 */
		EnumWindows(FindZuluWin, (LPARAM)&vOther);
		if (gWnd == NULL)
			gWnd = FindWindowA(0, LOGIN_NAME);

		if (gWnd != NULL)
			SetForegroundWindow(gWnd);

		return true;
	}
#elif ZULU_PLATFORM == PLATFORM_MAC
	Q_UNUSED(argc);
	Q_UNUSED(argv);
	return false;
#elif ZULU_PLATFORM == PLATFORM_LINUX
	Q_UNUSED(argc);
	Q_UNUSED(argv);
	return false;
#endif
}

/*------------------------------------------------------------------*
 *							 ConnectAndAuth()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Attempts to connect to the Zoto server and validate
 *				credentials.
 *
 *	@author		Josh Williams
 *	@date		10-Jun-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZGuiApp::ConnectAndAuth(QString& pUser, QString& pPswdHash)
{
	ZRESULT	vZRetval;
	QString vLatestVersion;
	
	/*
	 * Establish a connection to the Zoto server
	 */
	if ((vZRetval = GetClient()->ConnectServer()) != ZERR_SUCCESS)
	{
		WAIT_CURSOR_OFF();
		QMessageBox::critical(mainWidget(), GetAppName(), tr("Unable to connect to the Zoto "
					"server.\n\nPlease check your internet connection and try again."));
		return vZRetval;
	}

	/*
	 * Check client version
	 */
	if (!mVersionOk)
	{
		vZRetval = ValidateVersion();
		if (vZRetval == ZERR_NEW_VERSION ||
			vZRetval == ZERR_SUCCESS)
			mVersionOk = true; // Don't ask for version next time.
		else				
			return vZRetval;
	}

	qDebug("%s::calling mClient->Authenticate()", __FILE__);

	/*
	 * Check credentials
	 */
	if ((vZRetval = GetClient()->Authenticate(pUser, pPswdHash)) != ZERR_SUCCESS)
	{
		WAIT_CURSOR_OFF();
		GetClient()->Disconnect();
		if (vZRetval == ZERR_BAD_AUTH)
			QMessageBox::critical(mainWidget(), GetAppName(), tr("The username and/or password you entered is invalid.\n"
									"Please enter the correct information and try again."));
		else
			QMessageBox::critical(mainWidget(), GetAppName(), tr("Error validating your username/password.\n"
									"Please check your internet connection and try again."));
		return vZRetval;
	}
	return ZERR_SUCCESS;
}

/*------------------------------------------------------------------*
 *							 SwitchState()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Swaps the views in response to button presses or upload
 *				completion.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 *	@param		pDir
 *					Direction to switch (forward or back).
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZGuiApp::SwitchState(int pDir)
{
	/*
	 * Check quota
	 */
	if (mState == ZULU_IMAGES && pDir == ZULU_NEXT)
	{
#ifdef ZULU_TAGGING
		ZULONG vQuota, vUsage;
		GetQuotaInfo(vQuota, vUsage);
		qDebug("%s::mTotalBytes => [%ld]", __FILE__, mTotalBytes);
		qDebug("%s::vUsage       => [%ld]", __FILE__, vUsage);
		qDebug("%s::vQuota       => [%ld]", __FILE__, vQuota);
		if ((mTotalBytes + vUsage) > vQuota && vQuota != 0)
		{
			QMessageBox::warning(mainWidget(), GetAppName(), tr("You have exceeded your space "
							"limit on Zoto.  Please visit http://www.zoto.com to upgrade your account or remove some images."));
			return;
		}
#endif
	}

	if (mState == ZULU_UPLOAD)
	{
		if (pDir == ZULU_NEXT)
		{
			/*
			 * User hit pause/resume.
			 */
			if (mUploadPaused)
			{
				mUploadPaused = false;
				GetClient()->ResumeTransfer();
				static_cast<ZMainWin*>(mainWidget())->UpdateButtons(ZULU_UPLOAD);
				return;
			}
			else
			{
				mUploadPaused = true;
				GetClient()->PauseTransfer();
				static_cast<ZMainWin*>(mainWidget())->UpdateButtons(ZULU_UPLOAD);
				return;
			}
		}
		else if (pDir == ZULU_BACK)
		{
			/*
			 * User hit cancel.
			 */
			GetClient()->CancelTransfer();
			GetClient()->Disconnect();
			pDir = ZULU_NEXT;
		}
	}

	mState += pDir;
	if (mState < ZULU_IMAGES || mState > ZULU_UPLOAD)
		mState = ZULU_IMAGES;

	switch (mState)
	{
	case ZULU_IMAGES:
		static_cast<ZMainWin*>(mainWidget())->SwitchState(ZULU_IMAGES);
		break;
#ifdef ZULU_TAGGING
	case ZULU_CATS:
		static_cast<ZMainWin*>(mainWidget())->SwitchState(ZULU_CATS);
		break;
#endif
	case ZULU_UPLOAD:
		static_cast<ZMainWin*>(mainWidget())->SwitchState(ZULU_UPLOAD);
		StartUpload();
		break;
	default:
		mState = ZULU_IMAGES;
	}
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

/*------------------------------------------------------------------*
 *							  GainedFocus()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Called when the application's window regains focus.
 *	@author		Josh Williams
 *	@date		29-Jun-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZGuiApp::GainedFocus()
{
	processEvents();
#ifdef ZULU_TAGGING
	if (mState == ZULU_CATS)
	{
		WAIT_CURSOR_ON();
		GetClient()->GetCategories(mUserName, mPswdHash, mCats);
		static_cast<ZMainWin*>(mainWidget())->GetCategoryView()->LoadCategories(mCats);
		WAIT_CURSOR_OFF();
	}
#endif
}

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *							ValidateVersion()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Checks for updates to the uploader.
 *	@author		Josh Williams
 *	@date		29-Jun-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
ZRESULT ZGuiApp::ValidateVersion()
{
	ZRESULT	vZRetval;
	QString vLatestVersion;
	QString vUpdateFile;

	if ((vZRetval = GetClient()->CheckVersion(vLatestVersion)) != ZERR_SUCCESS)
	{
		QString vMessage;
		if (vZRetval == ZERR_FUBAR_VERSION)
		{
			GetClient()->Disconnect();
			WAIT_CURSOR_OFF();
			vMessage.sprintf(tr("You must upgrade to version %s to continue.", vLatestVersion.latin1()));
			
			if (QMessageBox::question(mainWidget(), GetAppName() + tr(" Update"), vMessage, QMessageBox::Yes, QMessageBox::No) == QMessageBox::Yes)
			{
				ZUtils::OpenURL(mainWidget(), ZOTO_DOWNLOAD_URL);
			}
			else
			{
				QMessageBox::critical(mainWidget(), GetAppName(), "The Zoto Uploader cannot continue.  It will now close.");
			}
		}
		else if (vZRetval == ZERR_INVALID_VERSION)
		{
			GetClient()->Disconnect();
			/*
			 * Version is so out of date, the uploader must upgrade or exit.
			 */
			WAIT_CURSOR_OFF();
#if ZULU_PLATFORM == PLATFORM_WINDOWS
			vMessage.sprintf(tr("You must upgrade to version %s to continue."), vLatestVersion.latin1());
			if (QMessageBox::critical(mainWidget(), GetAppName() + tr(" Update"), vMessage, QMessageBox::Ok | QMessageBox::Default,
					QMessageBox::Cancel | QMessageBox::Escape, QMessageBox::NoButton) == QMessageBox::Ok)
			{
				mainWidget()->hide();
				ZUpdater vUpdater(mainWidget());
				vUpdater.show();
				if (vUpdater.Download(GetClient()->GetZspHost(), vUpdateFile))
					_spawnl( _P_DETACH, vUpdateFile, vUpdateFile, "/SILENT", NULL);
				else
					QMessageBox::critical(mainWidget(), GetAppName() + tr(" Update"), tr("Unable to download new client version.  Please visit www.zoto.com to download."));

			}
#elif ZULU_PLATFORM == PLATFORM_MAC || ZULU_PLATFORM == PLATFORM_LINUX
			vMessage.sprintf(tr("You must upgrade to version %s to continue."), vLatestVersion.latin1());
			if (QMessageBox::question(mainWidget(), GetAppName() + tr(" Update"), vMessage, QMessageBox::Yes, QMessageBox::No) == QMessageBox::Yes)
			{
				ZUtils::OpenURL(mainWidget(), ZOTO_DOWNLOAD_URL);
			}
#else
#error Unsupported platform
#endif
			else
			{
				QMessageBox::critical(mainWidget(), GetAppName(), "The Zoto Uploader cannot continue.  It will now close.");
			}
		}
		else if (vZRetval == ZERR_NEW_VERSION)
		{
			WAIT_CURSOR_OFF();
			/*
			 * Newer version is available, but upgrade is not mandatory
			 */
#if ZULU_PLATFORM == PLATFORM_WINDOWS
			vMessage.sprintf(tr("A newer version is available.\n\nUpgrade to %s?"), vLatestVersion.latin1());
			if (QMessageBox::question(mainWidget(), GetAppName() + tr(" Update"), vMessage, QMessageBox::Yes, QMessageBox::No) == QMessageBox::Yes)
			{
				GetClient()->Disconnect();
				mainWidget()->hide();
				ZUpdater vUpdater(mainWidget());
				vUpdater.show();
				if (vUpdater.Download(GetClient()->GetZspHost(), vUpdateFile))
					_spawnl( _P_DETACH, vUpdateFile, vUpdateFile, "/SILENT", NULL);
				else
					QMessageBox::critical(mainWidget(), GetAppName() + tr(" Update"), tr("Unable to download new client version.  Please visit www.zoto.com to download."));
			}
#elif ZULU_PLATFORM == PLATFORM_MAC || ZULU_PLATFORM == PLATFORM_LINUX
			vMessage.sprintf(tr("A newer version of is available.\nUpgrade to %s?"), vLatestVersion.latin1());
			if (QMessageBox::question(mainWidget(), GetAppName() + tr(" Update"), vMessage, QMessageBox::Yes, QMessageBox::No) == QMessageBox::Yes)
			{
				GetClient()->Disconnect();
				ZUtils::OpenURL(mainWidget(), ZOTO_DOWNLOAD_URL);
			}
#else
#error Unsupported platform
#endif
			else
			{
				/*
				 * User hit cancel.  Continue.
				 */
				vZRetval = ZERR_NEW_VERSION;
			}
		}
		else
		{
			vMessage.sprintf(tr("Error communicating with the Zoto server.\n"
								"Please check your internet connection and try again."));
			QMessageBox::critical(mainWidget(), GetAppName(), vMessage);
		}
	}
	return vZRetval;
}

/*------------------------------------------------------------------*
 *							  CreateKey()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Creates a new hash value from the given file name.
 *	@author		Josh Williams
 *	@date		29-Jun-2005
 *
 *	@param		pFileName
 *					File name to be hashed.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZULONG ZGuiApp::CreateKey(const QString& pFileName)
{
	ZBYTE	vHash[17];
	ZULONG	vKey = 0;
	memset(vHash, '\0', sizeof(vHash));

	ZMD5Hasher::HashStringRaw(pFileName.latin1(), pFileName.length(), vHash, sizeof(vHash));

    /* XOR every 4 bytes together */
    vKey	= (vHash[0] ^ vHash[4] ^ vHash[8] ^ vHash[12]) +
				256 * (vHash[1] ^ vHash[5] ^ vHash[9] ^ vHash[13]) +
                256 * 256 * (vHash[2] ^ vHash[6] ^ vHash[10] ^ vHash[14]) +
                256 * 256 * 256 * (vHash[3] ^ vHash[7] ^ vHash[11] ^ vHash[15]);

    return vKey;
}

/*------------------------------------------------------------------*
 *							StartUpload()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Begins the upload process.  Establishes the connection
 *				with the ZSP server.
 *	@author		Josh Williams
 *	@date		14-Aug-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZGuiApp::StartUpload()
{
	static_cast<ZMainWin*>(mainWidget())->GetUploadView()->Reset(mUploads.count());
	mCurrentFile = 0;
	mUploadBytes = 0L;
	mUploadTotal = mTotalBytes;
	mUploadPaused = false;

	/*
	 * Connect and authenticate
	 */
	if (ConnectAndAuth(mUserName, mPswdHash) != ZERR_SUCCESS)
	{
		SwitchState(ZULU_NEXT);
		return;
	}
#ifdef ZULU_TAGGING
	if (ZULU_APP()->GetTagging() == true)
		static_cast<ZMainWin*>(mainWidget())->GetCategoryView()->GetSelectedCats(mUserCats);

	if (ZULU_APP()->GetPrivate() == true)
		mUserCats.append(-125);
#endif
	StartNextUpload();
}

/*------------------------------------------------------------------*
 *							StartNextUpload()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Starts the transfer of the next file to be uploaded.
 *	@author		Josh Williams
 *	@date		14-Aug-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZGuiApp::StartNextUpload()
{
	static int vCurFile = 0;
	ZXferInfo	vXInfo;
	ZUploadList::iterator vIt;

	if (mUploads.isEmpty() != true)
    {
		QString vStrText;
		mCurrentFile++;
		vCurFile++;
		mCurrentBytes = 0L;
		if (vCurFile >= 20)
		{
			vCurFile = 1;
			GetClient()->Disconnect();

			/*
			 * Connect and authenticate
			 */
			if (ConnectAndAuth(mUserName, mPswdHash) != ZERR_SUCCESS)
			{
				//UpdateMainWin(NULL, false);
				return;
			}
		}

		vIt = mUploads.begin();
		static_cast<ZMainWin*>(mainWidget())->GetUploadView()->SwitchFile((*vIt), mCurrentFile);

		/*
		 * Start the upload
		 */
		QFileInfo vInfo((*vIt).mName);
		vXInfo.mFile = vInfo.absFilePath();
		vXInfo.mName = vInfo.fileName();
		GetClient()->SendFile(vXInfo, CallbackFunc, true);
	}
}

/*------------------------------------------------------------------*
 *								UploadStatus()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Processes status information received from the client
 *				concerning the status of an upload.
 *	@author		Josh Williams
 *	@date		14-Aug-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZGuiApp::UploadStatus(ZSPEvent *pEvt)
{
	static ZUSHORT	vRetries = 0;

	ZCatIDList::iterator	vIt;
	int						vID;
	ZULONG					vKey;
	ZUINT					vPerc;

	vKey = (*(mUploads.begin())).mKey;
	vPerc = (ZUINT)((float)mUploadBytes / (float)mUploadTotal * 100.0f);

	switch (pEvt->mStatus)
	{
	case XFER_COMPLETE:
		qDebug("%s::Upload completed", __FILE__);
		if (pEvt->mTemp)
		{
			ZULONG vConvertedBytes = (ZULONG)(((float)pEvt->mBytes / (float)pEvt->mSize) * (float)mUploads[vKey].mSize);
			mUploadBytes += vConvertedBytes;
		}
		else
			mUploadBytes += pEvt->mBytes;
		static_cast<ZMainWin*>(mainWidget())->GetUploadView()->SetProgress(100, vPerc);

#ifdef ZULU_TAGGING
		/*
		 * Categorize the image.
		 */
		for (vIt = mUserCats.begin(); vIt != mUserCats.end(); vIt++)
		{
			vID = *vIt;
			GetClient()->Categorize(mUserName, mPswdHash, pEvt->mMD5, vID);
		}
#endif
		/*
		 * Remove this file from the list.
		 */
		RemoveFile(vKey);
		break;
	case XFER_FAILED:
		if (pEvt->mErrcode == ZERR_DUPLICATE_FILE)
		{
			mUploadBytes += mUploads[vKey].mSize;
			qDebug("%s::Duplicate mUploadBytes: %ld:%ld", __FILE__, mUploadBytes, mUploadTotal);
			static_cast<ZMainWin*>(mainWidget())->GetUploadView()->SetProgress(100, vPerc);

#ifdef ZULU_TAGGING
			/*
			 * Categorize the image.
			 */
			for (vIt = mUserCats.begin(); vIt != mUserCats.end(); vIt++)
			{
				int vID = *vIt;
				GetClient()->Categorize(mUserName, mPswdHash, pEvt->mMD5, vID);
			}
#endif
			/*
			 * Remove this file from the list.
			 */
			RemoveFile(vKey);
		}
		else if (pEvt->mErrcode == ZERR_TIMEOUT)
		{
			GetClient()->Disconnect();
			if (++vRetries > 3)
			{
				SwitchState(2);
				return;
			}
			else
			{
				ZULU_APP()->GetClient()->Disconnect();

				/*
				 * Roll back the progress bars
				 */
				mCurrentFile--;
				mUploadBytes -= mCurrentBytes;
				static_cast<ZMainWin*>(mainWidget())->GetUploadView()->SetProgress(100, vPerc);
				
				/*
				 * Connect and authenticate
				 */
				if (ConnectAndAuth(mUserName, mPswdHash) != ZERR_SUCCESS)
				{
					SwitchState(2);
					return;
				}
			}
		}
		else
		{
			/*
			 * Do something really erroneous
			 */
			SwitchState(2);
			return;
		}
		break;
	default:
		/*
		 * update the progress bars
		 */
		int i = static_cast<int>(pEvt->mProgress * 100.0f);
		if (pEvt->mTemp)
		{
			ZULONG vConvertedBytes = (ZULONG)(((float)pEvt->mBytes / (float)pEvt->mSize) * (float)mUploads[vKey].mSize);
			mUploadBytes += vConvertedBytes;
			mCurrentBytes += vConvertedBytes;
		}
		else
		{
			mUploadBytes += pEvt->mBytes;
			mCurrentBytes += pEvt->mBytes;
		}
		static_cast<ZMainWin*>(mainWidget())->GetUploadView()->SetProgress(i, vPerc);
		return;
	}
	
	/*
	 * See if there are more files to be uploaded.
	 */
	if (mUploads.count() > 0)
		StartNextUpload();
	else
	{
		SwitchState(2);
		GetClient()->Disconnect();
	}
    return;
}

} // End Namespace

/* vi: set ts=4: */
