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
#if !defined(__ZPREFWIN_H_INCLUDED__)
#define __ZPREFWIN_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qdialog.h>
#include <qcheckbox.h>
#include <qlineedit.h>

/* Local Headers */

/* Macros */

class QGroupBox;
class QLabel;
class QPushButton;
class QGrid;
class QVBoxLayout;
class QSpacerItem;

namespace ZOTO
{

/**
 *  @class      ZPrefWin
 *  @brief      Interface for modifying applications settings (username, password, etc).
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class ZPrefWin : public QDialog
{
	Q_OBJECT
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZPrefWin(QWidget *pParent = 0, const char *pName = 0, bool pModal = false,
			 		WFlags pFlags = 0);
	virtual ~ZPrefWin();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	bool				GetUser(QString& pUser) const;
	bool				GetPswd(QString& pPswd) const;
	bool				GetAuto() const;
#ifdef ZULU_TAGGING
	bool				GetPrivate() const;
	bool				GetTagging() const;
#endif

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				SetUser(const QString& pUser);
	void				SetPswd(const QString& pPswd);
	void				SetAuto(bool pAuto);
#ifdef ZULU_TAGGING
	void				SetPrivate(bool pPrivate);
	void				SetTagging(bool pTagging);
#endif

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/

protected slots:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/
	void				ValidateForm();

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	QVBoxLayout			*mMainLayout;
	QGroupBox			*mMainGroup;
	QGrid				*mTextGrid;
	QLabel				*mLblUser;
	QLabel				*mLblPswd;
	QLineEdit			*mLinUser;
	QLineEdit			*mLinPswd;
	QLabel				*mLblAuto;
	QCheckBox			*mChkAuto;
#ifdef ZULU_TAGGING
	QLabel				*mLblPrivate;
	QCheckBox			*mChkPrivate;
	QLabel				*mLblTagging;
	QCheckBox			*mChkTagging;
#endif
	QPushButton			*mButOk;
	QPushButton			*mButCancel;
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
/**
 *	Allows access to the username field.  Return value is whether or not
 *	the field has been modified.
 */
inline
bool ZPrefWin::GetUser(QString& pUser) const
{
	pUser = mLinUser->text();
	return mLinUser->isModified();
}

/**
 *	Allows access to the password field.  Return value is whether or not
 *	the field has been modified.
 */
inline
bool ZPrefWin::GetPswd(QString& pPswd) const
{
	pPswd = mLinPswd->text();
	return mLinPswd->isModified();
}

/**
 *	Returns whether or not the "Auto Sign-In" field is checked.
 */
inline
bool ZPrefWin::GetAuto() const
{
	return mChkAuto->isChecked();
}

#ifdef ZULU_TAGGING
/**
 *	Returns whether or not the "Auto-private" field is checked.
 */
inline
bool ZPrefWin::GetPrivate() const
{
	return mChkPrivate->isChecked();
}

/**
 *	Returns whether or not the "Tagging" field is checked.
 */
inline
bool ZPrefWin::GetTagging() const
{
	return mChkTagging->isChecked();
}
#endif

/**
 *	Sets the value to be displayed in the username field.
 */
inline
void ZPrefWin::SetUser(const QString& pUser)
{
	mLinUser->setText(pUser);
}

/**
 *	Sets the value to be displayed in the password field.
 */
inline
void ZPrefWin::SetPswd(const QString& pPswd)
{
	mLinPswd->setText(pPswd);
}

/**
 *	Sets whether or not the "Auto Sign-In" field is checked.
 */
inline
void ZPrefWin::SetAuto(bool pAuto)
{
	mChkAuto->setChecked(pAuto);

}

#ifdef ZULU_TAGGING
/**
 *	Sets whether or not the "Auto-private" field is checked.
 */
inline
void ZPrefWin::SetPrivate(bool pPrivate)
{
	mChkPrivate->setChecked(pPrivate);
}

/**
 *	Sets whether or not the "Tagging" field is checked.
 */
inline
void ZPrefWin::SetTagging(bool pTagging)
{
	mChkTagging->setChecked(pTagging);
}
#endif

} // End Namespace

#endif // __ZPREFWIN_H_INCLUDED__

