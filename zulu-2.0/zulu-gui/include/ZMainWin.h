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
#if !defined(__ZMAINWIN_H_INCLUDED__)
#define __ZMAINWIN_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qdialog.h>

/* Local Headers */
#include "ZTypes.h"

/* Macros */

class QGroupBox;
class QLabel;
class QHBoxLayout;
class QVBoxLayout;
class QSpacerItem;
class QVBox;

namespace ZOTO
{

class ZPushButton;
class ZImageView;
class ZCategoryView;
class ZUploadView;
class ZProgressBar;

/**
 *  @class      ZMainWin
 *  @brief      Main user interface of the Zulu application.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class ZMainWin : public QDialog
{
	Q_OBJECT

public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZMainWin(QWidget *pParent = 0, const char *pName = 0, bool pModal = false,
				WFlags pFlags = 0);
	virtual ~ZMainWin();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	ZImageView*			GetImageView() const;
	ZCategoryView*		GetCategoryView() const;
	ZUploadView*		GetUploadView() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
#ifdef ZULU_TAGGING
	void				UpdateUsage(int vQuota, int vUsage, ZULONG vTotalCurrent);
#endif
	void				SwitchState(int pState);
	void				UpdateButtons(int pState);

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/

protected slots:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/
	void				StateBack();
	void				StateNext();
	void				AddImages();
	void				DeleteImages();
	void				customEvent(QCustomEvent *pEvt);
	void				ChangeSettings(bool pAuthd = true);
	void				ShowHelp();
	void				windowActivationChange(bool pOldActive);

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/
	void				InitViews();

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	ZImageView			*mImageView;	/**< Image selection view */
	ZCategoryView		*mCategoryView;	/**< Category selection view */
	ZUploadView			*mUploadView;	/**< Upload progress view */
	QHBoxLayout			*mOuterLayout;	/**< Outer window layout */
	QVBoxLayout			*mMainLayout;	/**< Main layout manager */
	QGroupBox			*mTopGroup;		/**< Group box to hold layout */
	QHBoxLayout			*mTopButtons;	/**< Layout box to hold top buttons */
	QHBoxLayout			*mBottomLayout;	/**< Layout box to hold bottom buttons */
	QGroupBox			*mBottomGroup;	/**< Grouping of bottom widgets */
	QHBoxLayout			*mQuota;		/**< Layout box for quota information */
	ZPushButton			*mButAdd;		/**< Add image button */
	ZPushButton			*mButDelete;	/**< Delete image button */
	ZPushButton			*mButSettings;	/**< Preferences button */
	ZPushButton			*mButHelp;		/**< Help button */
	QLabel				*mTopLogo;		/**< Zoto logo */
	ZPushButton			*mButBack;		/**< Prev state button */
	ZPushButton			*mButNext;		/**< Next state button */
	QLabel				*mUsage;		/**< Usage information */
	QVBox				*mQuotaGroup;	/**< Grouping of quota information */
	ZProgressBar		*mUsgCur;		/**< Progress bar representing current Zoto usage */
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/

inline
ZImageView* ZMainWin::GetImageView() const
{
	return mImageView;
}

inline
ZCategoryView* ZMainWin::GetCategoryView() const
{
	return mCategoryView;
}

inline
ZUploadView* ZMainWin::GetUploadView() const
{
	return mUploadView;
}

} // End Namespace

#endif // __ZMAINWIN_H_INCLUDED__

/* vi: set ts=4: */
