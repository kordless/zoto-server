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
#if !defined(__ZGUIAPP_H__INCLUDED__)
#define __ZGUIAPP_H__INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qsettings.h>
#include <qstring.h>
#include <qstringlist.h>
#include <qwidget.h>
#include <qmap.h>
#include <qcursor.h>

/* Local Headers */
#include "ZApp.h"
#include "ZEvents.h"

/* Macros */
#define ZULU_GUI_APP() static_cast<ZGuiApp*>(qApp)

namespace ZOTO
{

enum ZStates
{
	ZULU_INIT = 0,
	ZULU_IMAGES,
#ifdef ZULU_TAGGING
	ZULU_CATS,
#endif
	ZULU_UPLOAD
};

enum ZStateDir
{
	ZULU_BACK = -1,
	ZULU_NEXT = 1
};
class ZFileInfo
{
public:
	QString		mName;
	ZULONG		mKey;
	ZULONG		mSize;
};

typedef QMap<ZULONG, ZFileInfo> ZUploadList;

/**
 *	@class		ZGuiApp
 *
 *	@brief		Gui version of the application wrapper.
 *	@author		Josh Williams
 *	@version	0.1.0
 *	@date		08-Jul-2005
 */
class ZGuiApp : public ZApp
{
	Q_OBJECT
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZGuiApp(int& argc, char **argv);
	virtual ~ZGuiApp();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	const QString&		GetLastBrowse() const;
	const QString		GetWindowCaption() const;
	bool				UploadPaused() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	bool    			Initialize();
	void    			Shutdown();
	bool    			Authenticate();
	void				AddFile(const QString& pURI);
	void				RemoveFile(ZULONG pID);
	void    			SetLastBrowse(const QString& pDir);
#if ZULU_PLATFORM == PLATFORM_WINDOWS
	bool				winEventFilter(MSG *);
#endif
	bool				PreviousInstance(int& argc, char **argv);
	ZRESULT				ConnectAndAuth(QString& pUser, QString& pPswdHash);
	void				SwitchState(int pDir);

public:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/
	static void			TraceHandler(QtMsgType pType, const char *pMsg);
	void				GainedFocus();
	void				UploadStatus(ZSPEvent *pEvt);

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/
	ZRESULT				ValidateVersion();
	ZULONG				CreateKey(const QString& pFileName);
	void				StartUpload();
	void				StartNextUpload();

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	QString         	mLastBrowse;	/**< Last folder browsed in the main window */
	QString         	mAppName;		/**< Name to be display for the application */
	bool				mVersionOk;		/**< Whether or not the version has
											 successfully been verified
											 with the server. */
	ZUploadList			mUploads;		/**< Dictionary of files to be uploaded */
	int					mState;			/**< Current stage of processing */
	ZULONG				mTotalBytes;	/**< Total size of files to be uploaded */
	ZULONG				mUploadBytes;	/**< Total bytes already uploaded */
	ZULONG				mUploadTotal;	/**< Total number of bytes to upload. */
	long				mCurrentBytes;	/**< Number of image bytes transferred for current image */
	int					mCurrentFile;	/**< Index of the file currently being uploaded */
	QValueList<int>		mUserCats;		/**< List of categories selected by the user */
	bool				mUploadPaused;	/**< Whether or not the current upload operation
											 was paused by the user. */
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/

/**
 *	Returns the last directory browsed for images in the main window.
 */
inline
const QString& ZGuiApp::GetLastBrowse() const
{
	return mLastBrowse;
}

/**
 *	Returns the title to be used for the main window.
 */
inline
const QString ZGuiApp::GetWindowCaption() const
{
	QString vCaption;
	QString	vVersion;
	if (GetClient()->GetVersBuild() == 0)
		vVersion.sprintf("%d.%d", GetClient()->GetVersMaj(), GetClient()->GetVersMin());
	else
		vVersion.sprintf("%d.%d.%d", GetClient()->GetVersMaj(), GetClient()->GetVersMin(),
						 	GetClient()->GetVersBuild());

	if (GetUserName() != "")
		vCaption.sprintf("%s %s - %s", MAIN_NAME, vVersion.latin1(),
						 GetUserName().latin1());
	else
		vCaption.sprintf("%s %s", MAIN_NAME, vVersion.latin1());
	return vCaption;
}

/**
 *	Stores the last directory the user browsed for images in the
 *	main window.
 */
inline
void ZGuiApp::SetLastBrowse(const QString& pDir)
{
	mLastBrowse = pDir;
}

/**
 *	Returns whether or not the current upload operation is paused.
 */
inline
bool ZGuiApp::UploadPaused() const
{
	return mUploadPaused;
}

} // End Namespace


#endif // __ZGUIAPP_H__INCLUDED__

/* vi: set ts=4: */
