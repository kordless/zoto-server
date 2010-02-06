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
#if !defined(__ZLOGINWIN_H_INCLUDED__)
#define __ZLOGINWIN_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qdialog.h>
#include <qlineedit.h>

/* Local Headers */

/* Macros */

class QLabel;
class QGroupBox;
class QCheckBox;

namespace ZOTO
{

class ZPushButton;
class ZURLLabel;

/**
 *  @class      ZLoginWin
 *  @brief      Prompts for username/password.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class ZLoginWin : public QDialog
{

	Q_OBJECT

public:
	enum eModes
	{
		Login,
		Update
	};

public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZLoginWin(QWidget *pParent = 0, const char *pName = 0, bool pModal = false,
				WFlags pFlags = 0);
	virtual ~ZLoginWin();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	const QString&		GetUser() const;
	const QString&		GetPswd() const;
	bool				GetAuto() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				SetUser(const QString& pUser);
	void				SetPswd(const QString& pPswd);
	void				SetAuto(bool pAuto);
	void				SetMode(int pMode);

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/

protected slots:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/
	void				ValidateForm();
	void				ShowHelp();

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	QString				mUser;			/**< Text entered in the username field. */
	QString				mPswd;			/**< Text entered in the password field. */
	bool				mAuto;			/**< Whether or not auto-signin is checked */
    QGroupBox			*mTopGroup;		/**< Grouping of buttons at the top of the window */
    ZPushButton			*mButHelp;		/**< Button to open Zoto's help site. */
    QLabel				*mTopLogo;		/**< Zoto logo at the top of the window. */
    QLabel				*mLblUser;		/**< Label for the username field. */
    QLabel				*mLblPswd;		/**< Label for the password field. */
    QGroupBox			*mTextGroup;	/**< Grouping of username/password text boxes. */
    QLineEdit			*mLinUsername;	/**< Field for entering username */
    QLineEdit			*mLinPassword;	/**< Field for entering password */
    QCheckBox			*mChkAuto;		/**< Checkbox for auto-signin */
    ZPushButton			*mButSignIn;	/**< Button to sign-in/save settings */
    ZPushButton			*mButCancel;	/**< Button to cancel sign-in/settings change */
	ZURLLabel			*mLblForgot;	/**< URL label to open the Zoto "forgot password" page */
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
/**
 *	Gets the username entered in the form.
 */
inline
const QString& ZLoginWin::GetUser() const
{
	return mUser;
}

/**
 *	Gets the password entered in the form.
 */
inline
const QString& ZLoginWin::GetPswd() const
{
	return mPswd;
}

/**
 *	Returns whether or not the "Auto Signin" box is checked.
 */
inline
bool ZLoginWin::GetAuto() const
{
	return mAuto;
}

/**
 *	Sets the username to be displayed on the form.
 */
inline
void ZLoginWin::SetUser(const QString& pUser)
{
	mUser = pUser;
	mLinUsername->setText(mUser);
}

/**
 *	Sets the password to be displayed on the form.
 */
inline
void ZLoginWin::SetPswd(const QString& pPswd)
{
	mPswd = pPswd;
}

/**
 *	Sets whether or not the "Auto Signin" box should be checked.
 */
inline
void ZLoginWin::SetAuto(bool pAuto)
{
	mAuto = pAuto;
}

} // End Namespace

#endif // __ZLOGINWIN_H_INCLUDED__

/* vi: set ts=4: */
