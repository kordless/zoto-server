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
#include "ZLoginWin.h"

/* System Headers */
#include <qlabel.h>
#include <qgroupbox.h>
#include <qlineedit.h>
#include <qcheckbox.h>
#include <qpixmap.h>
#include <qmessagebox.h>

/* Local Headers */
#include "ZApp.h"
#include "ZUtils.h"
#include "ZPushButton.h"
#include "ZURLLabel.h"

/* Macros */

namespace ZOTO
{

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZLoginWin::ZLoginWin( QWidget* pParent, const char* pName, bool pModal, WFlags pFlags )
    : QDialog(pParent, pName, pModal, pFlags)
{
	QFont vMainFont, vLblFont;

    if (!pName)
		setName("ZLoginWin");

    resize(QSize(400, 283).expandedTo(minimumSizeHint()));

    setPaletteBackgroundColor(QColor(255, 255, 255));

	vMainFont.setFamily("Arial");
	vMainFont.setBold(true);
#if ZULU_PLATFORM == PLATFORM_MAC
	vMainFont.setPointSize(12);
#else
	vMainFont.setPointSize(10);
#endif

	vLblFont.setFamily("Arial");
	vLblFont.setBold(true);
#if ZULU_PLATFORM == PLATFORM_MAC
	vLblFont.setPointSize(10);
#else
	vLblFont.setPointSize(8);
#endif

	/*
	 * Top button group
	 */
    mTopGroup = new QGroupBox(this, "TopGroup");
    mTopGroup->setGeometry( QRect(10, 30, 375, 35));
    mTopGroup->setPaletteBackgroundColor(QColor(222, 222, 222));
	mTopGroup->setTitle(QString::null);

    mButHelp = new ZPushButton(mTopGroup, "ButHelp");
    mButHelp->setGeometry( QRect(310, 5, 48, 25 ));
    mButHelp->setPixmap( QPixmap::fromMimeSource("login_help_up.png"));
    mButHelp->setDownPixmap( QPixmap::fromMimeSource("login_help_down.png"));
    mButHelp->setDisabledPixmap( QPixmap::fromMimeSource("login_help_disabled.png"));

	/*
	 * Zoto logo
	 */
    mTopLogo = new QLabel(this, "TopLogo");
    mTopLogo->setGeometry(QRect(25, 10, 175, 67));
    mTopLogo->setPixmap(QPixmap::fromMimeSource("zotologin.png" ));
	ZUtils::MaskWidget(mTopLogo, "zotologin.png");

	/*
	 * Text labels
	 */
    mLblUser = new QLabel(this, "LblUser");
    mLblUser->setGeometry(QRect(40, 120, 140, 20));
    mLblUser->setFont(vLblFont); 
    mLblUser->setAlignment(int(QLabel::AlignVCenter | QLabel::AlignRight));
	mLblUser->setText(tr("Username:"));

    mLblPswd = new QLabel(this, "LblPswd");
    mLblPswd->setGeometry(QRect(40, 150, 140, 20));
    mLblPswd->setFont(vLblFont); 
    mLblPswd->setAlignment(int(QLabel::AlignVCenter | QLabel::AlignRight));
	mLblPswd->setText(tr("Password:"));

	/*
	 * Input group
	 */
    mTextGroup = new QGroupBox(this, "TextGroup");
    mTextGroup->setGeometry(QRect(190, 110, 161, 71));
    mTextGroup->setPaletteBackgroundColor(QColor(222, 222, 222));
	mTextGroup->setTitle(QString::null);

    mLinUsername = new QLineEdit(mTextGroup, "LinUsername");
    mLinUsername->setGeometry(QRect(10, 10, 140, 20));
    mLinUsername->setFrameShape(QLineEdit::LineEditPanel);
    mLinUsername->setFrameShadow( QLineEdit::Sunken );

    mLinPassword = new QLineEdit(mTextGroup, "LinPassword");
    mLinPassword->setGeometry(QRect(10, 40, 140, 20));
    mLinPassword->setFrameShape(QLineEdit::LineEditPanel);
    mLinPassword->setFrameShadow(QLineEdit::Sunken);
    mLinPassword->setFrame(TRUE);
    mLinPassword->setEchoMode(QLineEdit::Password);

	/*
	 * Auto-login checkbox
	 */
    mChkAuto = new QCheckBox(this, "ChkAuto");
    mChkAuto->setGeometry( QRect(160, 190, 190, 20));
    mChkAuto->setFont(vMainFont);
	mChkAuto->setText(tr("Don't ask me again"));
	mChkAuto->setChecked(ZULU_APP()->GetAuto());

	/*
	 * Main form buttons
	 */
    mButCancel = new ZPushButton(this, "ButCancel");
    mButCancel->setGeometry(QRect(225, 220, 122, 29));
    mButCancel->setFont(vMainFont); 
    mButCancel->setPixmap(QPixmap::fromMimeSource("blue_up.png"));
    mButCancel->setDownPixmap(QPixmap::fromMimeSource("blue_down.png"));
    mButCancel->setDisabledPixmap(QPixmap::fromMimeSource("blue_disabled.png"));
	mButCancel->setText(tr("CANCEL"));

    mButSignIn = new ZPushButton(this, "ButSignIn");
    mButSignIn->setGeometry(QRect(50, 220, 122, 29));
    mButSignIn->setFont(vMainFont); 
    mButSignIn->setPixmap(QPixmap::fromMimeSource("blue_up.png"));
    mButSignIn->setDownPixmap(QPixmap::fromMimeSource("blue_down.png"));
    mButSignIn->setDisabledPixmap(QPixmap::fromMimeSource("blue_disabled.png"));
	mButSignIn->setText(tr("SIGN IN"));
    clearWState( WState_Polished );

	mLblForgot = new ZURLLabel(this, "LblURL");
	mLblForgot->setGeometry(QRect(0, 260, this->width(), 20));
	mLblForgot->setText("Forgot Password?");
	mLblForgot->setAlignment(Qt::AlignCenter);
	mLblForgot->setFont(vMainFont);

	/*
	 * Signals and slots
	 */
    connect(mButSignIn, SIGNAL( clicked() ), this, SLOT( ValidateForm() ) );
    connect(mButCancel, SIGNAL( clicked() ), this, SLOT( reject() ) );
	connect(mButHelp, SIGNAL(clicked()), this, SLOT(ShowHelp()));

    // tab order
    setTabOrder(mLinUsername, mLinPassword);
    setTabOrder(mLinPassword, mChkAuto);
    setTabOrder(mChkAuto, mButSignIn);
    setTabOrder(mButSignIn, mButCancel);
    setTabOrder(mButCancel, mButHelp);

	SetMode(Login);
}

ZLoginWin::~ZLoginWin()
{

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
 *							   SetMode()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Configures the window for sign-in or settings mode.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 *	@param		pMode
 *					Mode the window is to operate in.
 *
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZLoginWin::SetMode(int pMode)
{
	if (pMode == Login)
	{
		setCaption(tr(LOGIN_NAME));
		mButSignIn->setText(tr("SIGN IN"));
		mButSignIn->update();
	}
	else if (pMode == Update)
	{
		setCaption(tr("Update Login Information"));
		mButSignIn->setText(tr("OK"));
		mButSignIn->update();
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
 *							 ValidateForm()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Ensures that the username and password are the correct
 *				length when the user clicks SIGN-IN/OK.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZLoginWin::ValidateForm()
{
	if (mLinUsername->text().length() < 4)
	{
		QMessageBox::warning(NULL, ZULU_APP()->GetAppName(), tr("User name must be at least 4 characters."));
		return;
	}

	if (mLinPassword->text().length() < 6)
	{
		QMessageBox::warning(NULL, ZULU_APP()->GetAppName(), tr("Password must be at least 6 characters."));
		return;
	}

	/*
	 * Fields are valid.  Store the values.
	 */
	mUser = mLinUsername->text();
	mPswd = mLinPassword->text();
	mAuto = mChkAuto->isChecked();

	accept();
}

/*------------------------------------------------------------------*
 *								ShowHelp()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Opens the user's browser and points it to the Zoto
 *				help page.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZLoginWin::ShowHelp()
{
	ZUtils::OpenURL(this, ZULU_HELP_URL);

    WAIT_CURSOR_OFF();
}

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

} // End Namespace
