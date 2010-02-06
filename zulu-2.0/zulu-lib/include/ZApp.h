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
#if !defined(__ZAPP_H_INCLUDED__)
#define __ZAPP_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qapplication.h>
#include <qsettings.h>
#include <qstring.h>

/* Local Headers */
#include "ZClient.h"
#include "ZGlobals.h"

/* Macros */
#define ZULU_APP()  static_cast<ZApp *>(qApp)

namespace ZOTO
{
/**
 *	@class		ZApp
 *
 *	@brief		Wrapper class to hold global application settings.
 *	@author		Josh Williams
 *	@version	0.1.0
 *	@date		12-Mar-2005
 *
 *	@remarks	Handles initializing the client library, as well as loading and
 *				saving application-wide settings.  Also processes messages
 *				from other instances of the application, as well as checking
 *				for previous instances at startup.
 */
class ZApp : public QApplication
{
	Q_OBJECT
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZApp(int& argc, char **argv);
	virtual ~ZApp();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	const QString&		GetUserName() const;
	const QString&		GetUserHash() const;
	const QString&		GetPswdHash() const;
	virtual const QString&	GetAppName() const;
	virtual bool		GetAuto() const;
	virtual ZClient*	GetClient() const;
#ifdef ZULU_TAGGING
	virtual bool		GetPrivate() const;
	virtual bool		GetTagging() const;
	virtual const ZCatList&	GetCats() const;
	virtual void		GetQuotaInfo(ZULONG& pQuota, ZULONG& pUsage) const;
#endif
	virtual bool		TraceEnabled() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				SetUser(const char *pUser);
	void				SetPswd(const char *pPswd);
	void				SetPswdHash(const char *pPswdHash);
	virtual void		SetAuto(bool pAuto);
	virtual void   		SetAppName(const QString& pApp);
#ifdef ZULU_TAGGING
	virtual void		SetPrivate(bool pPrivate);
	virtual void		SetTagging(bool pTagging);
	virtual bool		LoadCategoriesUsage();
#endif
	virtual bool   		Initialize();
	virtual void   		Shutdown();
	const QString		BuildConfigPath(const char *pSetting) const;
	virtual void		SetConfigPath(QSettings& pSettings) const;
	virtual void		SaveSettings() const;

public:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/
	static void			TraceHandler(QtMsgType pType, const char *pMsg);

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/

protected:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	QString				mUserName;		/**< Username used for authentication */
	QString				mUserHash;		/**< Hash of the username */
	QString				mPswdHash;		/**< Hash of the user's password. */
	bool            	mAuto;			/**< Auto-login */
	QString         	mAppName;		/**< Name to be display for the
										  	 application */
	bool				mTracing;		/**< Output trace information? */
	ZClient				*mClient;		/**< ZSP connection object */
#ifdef ZULU_TAGGING
	bool				mPrivate;		/**< Auto-privatize */
	bool				mTagging;		/**< Should we even perform any tagging
										  	 operations */ 
	ZCatList			mCats;			/**< List of the current user's
											 categories */
	int					mQuota;			/**< User's space quota */
	int					mUsage;			/**< User's current usage on zoto.com */
#endif
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/

/**
 *	Returns the user currently defined for ZSP connections.
 */
inline
const QString& ZApp::GetUserName() const
{
	return mUserName;
}

/**
 *	Returns the hash of the current ZSP user name.
 */
inline
const QString& ZApp::GetUserHash() const
{
	return mUserHash;
}

/**
 *	Returns the hash of the current ZSP password.
 */
inline
const QString& ZApp::GetPswdHash() const
{
	return mPswdHash;
}

/**
 *	Returns whether or not the user has requested auto-login.
 */
inline
bool ZApp::GetAuto() const
{
	return mAuto;
}

/**
 *	Returns the name of the application (used for window titles).
 */
inline
const QString& ZApp::GetAppName() const
{
	return mAppName;
}

/**
 *	Returns the global instance of the ZSP client object.
 */
inline
ZClient* ZApp::GetClient() const
{
	return mClient;
}

#ifdef ZULU_TAGGING
/**
 * 	Returns whether or not photos should be marked as private by default.
 */
inline
bool ZApp::GetPrivate() const
{
	return mPrivate;
}

/**
 *	Returns whether or not any tag related operations should be performed.
 */
inline
bool ZApp::GetTagging() const
{
	return mTagging;
}

/**
 *	Returns the current user's list of categories retrieved from ZAPI.
 */
inline
const ZCatList& ZApp::GetCats() const
{
	return mCats;
}

/**
 *	Supplies the current user's quota/usage info retrieved from ZAPI.
 */
inline
void ZApp::GetQuotaInfo(ZULONG& pQuota, ZULONG &pUsage) const
{
	pQuota = mQuota;
	pUsage = mUsage;
}
#endif // ZULU_TAGGING

/**
 *	Returns whether or not tracing was enabled in the registry.
 */
inline
bool ZApp::TraceEnabled() const
{
	return mTracing;
}

/**
 *	Stores the password to be used when connecting to the Zoto server.
 */
inline
void ZApp::SetPswdHash(const char *pPswdHash)
{
	mPswdHash = pPswdHash;
}

/**
 *	Sets whether the user wants to be automatically signed in
 *	on application startup.
 */
inline
void ZApp::SetAuto(bool pAuto)
{
	QSettings vConfig;

	mAuto = pAuto;
	SetConfigPath(vConfig);
	vConfig.writeEntry(BuildConfigPath("/AutoLogin"), mAuto);
}

/**
 *	Sets the name of the application to be used in window titles.
 */
inline
void ZApp::SetAppName(const QString& pApp)
{
	QSettings vConfig;

	mAppName = pApp;
	SetConfigPath(vConfig);
	vConfig.writeEntry(BuildConfigPath("/AppTitle"), mAppName);
}

#ifdef ZULU_TAGGING
/**
 *	Sets whether or not photos should be marked as private by default.
 */
inline
void ZApp::SetPrivate(bool pPrivate)
{
	QSettings vConfig;

	mPrivate = pPrivate;
	SetConfigPath(vConfig);
	vConfig.writeEntry(BuildConfigPath("/AutoPrivate"), mPrivate);
}

/**
 *	Sets whether or not any tag related operations should be performed.
 */
inline
void ZApp::SetTagging(bool pTagging)
{
	QSettings vConfig;

	mTagging = pTagging;
	SetConfigPath(vConfig);
	vConfig.writeEntry(BuildConfigPath("/Tagging"), mTagging);
}
#endif

} // End Namespace


#endif // __ZAPP_H_INCLUDED__

/* vi: set ts=4: */
