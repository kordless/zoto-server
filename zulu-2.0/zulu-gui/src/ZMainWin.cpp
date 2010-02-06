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
#include "ZMainWin.h"

/* System Headers */
#include <qgroupbox.h>
#include <qlabel.h>
#include <qfiledialog.h>
#include <qcursor.h>
#include <qlayout.h>
#include <qvbox.h>
#include <qmessagebox.h>
#include <qsettings.h>

/* Local Headers */
#include "ZGuiApp.h"
#include "ZImageView.h"
#ifdef ZULU_TAGGING
#include "ZCategoryView.h"
#include "ZCategoryItem.h"
#endif
#include "ZUploadView.h"
#include "ZPushButton.h"
#include "ZEvents.h"
#include "ZUtils.h"
#include "ZProgressBar.h"
#include "ZPrefWin.h"
#include "ZMD5Hasher.h"
/* Macros */

namespace ZOTO
{

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZMainWin::ZMainWin(QWidget *pParent /*=0*/, const char *pName /*=0*/,
		bool pModal /*=false*/,	WFlags pFlags /*=0*/)
	: QDialog(pParent, pName, pModal, pFlags)
{
	if (!pName)
		setName("ZMainWin");

    setPaletteForegroundColor(QColor(161, 161, 161));
    setPaletteBackgroundColor(QColor(236, 233, 216));
	setCaption(tr(ZULU_APP()->GetAppName()));

	mOuterLayout = new QHBoxLayout(this, 0, 0, "OuterLayout");
	mOuterLayout->addStrut(440);
	mMainLayout = new QVBoxLayout(mOuterLayout, 0, "MainLayout");
	mMainLayout->addStrut(370);

	/*
	 * Top button group.
	 */
    mTopGroup = new QGroupBox(this, "TopGroup");
	mTopGroup->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Fixed);
    mTopGroup->setPaletteForegroundColor(QColor(161, 161, 161));
    //mTopGroup->setPaletteBackgroundColor(QColor(70, 181, 232));
	mTopGroup->setPaletteBackgroundPixmap(QPixmap::fromMimeSource("tile_blue.png"));
	mTopGroup->setFrameShape(QFrame::NoFrame);
	mTopButtons = new QHBoxLayout(mTopGroup, 0, -1, "ButtonGroup");

	/*
	 * Zoto logo
	 */
	mTopButtons->addItem(new QSpacerItem(10, 50, QSizePolicy::Fixed, QSizePolicy::Fixed));
    mTopLogo = new QLabel(mTopGroup, "TopLogo");
    mTopLogo->setPixmap(QPixmap::fromMimeSource( "zotologo_blue.png"));
	mTopButtons->addWidget(mTopLogo);

	mTopButtons->addItem(new QSpacerItem(20, 50, QSizePolicy::Expanding, QSizePolicy::Minimum));
	mMainLayout->addWidget(mTopGroup);

	QLabel *mPadLabel = new QLabel(this, "PadLabel");
	mPadLabel->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Fixed);
	mPadLabel->setPaletteBackgroundColor(QColor(34, 140, 210));
	mPadLabel->setMinimumHeight(8);
	mPadLabel->setMaximumHeight(8);
	mMainLayout->addWidget(mPadLabel);

	QPixmap vButPix(QPixmap::fromMimeSource("add_up.png"));

    mButAdd = new ZPushButton(mTopGroup, "ButAdd");
    mButAdd->setPixmap(QPixmap::fromMimeSource("add_up.png"));
    mButAdd->setDownPixmap(QPixmap::fromMimeSource("add_down.png"));
    mButAdd->setDisabledPixmap(QPixmap::fromMimeSource("add_disabled.png"));

    mButDelete = new ZPushButton(mTopGroup, "ButDelete");
    mButDelete->setPixmap(QPixmap::fromMimeSource("remove_up.png"));
    mButDelete->setDownPixmap(QPixmap::fromMimeSource("remove_down.png"));
    mButDelete->setDisabledPixmap(QPixmap::fromMimeSource("remove_disabled.png"));

    mButSettings = new ZPushButton(mTopGroup, "ButSettings");
    mButSettings->setPixmap(QPixmap::fromMimeSource("info_up.png"));
    mButSettings->setDownPixmap(QPixmap::fromMimeSource("info_down.png"));
    mButSettings->setDisabledPixmap(QPixmap::fromMimeSource("info_disabled.png"));

    mButHelp = new ZPushButton(mTopGroup, "ButHelp");
    mButHelp->setPixmap(QPixmap::fromMimeSource("help_up.png"));
    mButHelp->setDownPixmap(QPixmap::fromMimeSource("help_down.png"));
    mButHelp->setDisabledPixmap(QPixmap::fromMimeSource("help_disabled.png"));
	mTopButtons->addWidget(mButAdd);
	mTopButtons->addWidget(mButDelete);
	mTopButtons->addWidget(mButSettings);
	mTopButtons->addWidget(mButHelp);
	mTopButtons->addItem(new QSpacerItem(15, 50, QSizePolicy::Fixed, QSizePolicy::Minimum));

	setMinimumSize(500, 450);
    clearWState(WState_Polished);
	setSizeGripEnabled(true);

	InitViews();
	
	mBottomGroup = new QGroupBox(this, "BottomGroup");
	mBottomGroup->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Fixed);
    mBottomGroup->setPaletteBackgroundColor(QColor(70, 181, 232));
	mBottomGroup->setPaletteBackgroundPixmap(QPixmap::fromMimeSource("tile_blue.png"));
	mBottomGroup->setFrameShape(QFrame::NoFrame);
	mBottomLayout = new QHBoxLayout(mBottomGroup, 5, -1, "BottomLayout");
	mMainLayout->addWidget(mBottomGroup);

#ifdef ZULU_TAGGING
	mQuotaGroup = new QVBox(mBottomGroup);
	mQuotaGroup->setMaximumSize(95, 30);
	mUsage = new QLabel(mQuotaGroup, "Usage");
	mUsage->setPaletteForegroundColor(QColor(255, 255, 255));
	mUsage->setAlignment(Qt::AlignCenter);
	mUsgCur = new ZProgressBar(mQuotaGroup);
	mUsgCur->setMinimumSize(95, 12);
	mUsgCur->setMaximumSize(95, 12);
	mUsgCur->setTotalSteps(100);
	QFont	vUsageFont;
	vUsageFont.setFamily("Verdana");
	vUsageFont.setPointSize(7);
	vUsageFont.setBold(false);
	mUsage->setFont(vUsageFont);

	//UpdateUsage();
#endif

	/*
	 * Bottom buttons
	 */
	QFont vButFont;
	vButFont.setFamily("Arial");
	vButFont.setPointSize(10);
	vButFont.setBold(true);


    mButBack = new ZPushButton(mBottomGroup, "ButBack");
    mButBack->setEnabled(TRUE);
    mButBack->setFont(vButFont);
    mButBack->setPixmap(QPixmap::fromMimeSource("green_up.png"));
    mButBack->setDownPixmap( QPixmap::fromMimeSource("green_down.png"));
    mButBack->setDisabledPixmap( QPixmap::fromMimeSource("green_disabled.png"));
    mButBack->setText(tr("BACK"));
	mButBack->setTextColor(Qt::white);

    mButNext = new ZPushButton(mBottomGroup, "ButNext");
    mButNext->setFont(vButFont); 
    mButNext->setPixmap(QPixmap::fromMimeSource("green_up.png"));
    mButNext->setDownPixmap(QPixmap::fromMimeSource("green_down.png"));
    mButNext->setDisabledPixmap(QPixmap::fromMimeSource("green_disabled.png"));
    mButNext->setText(tr("NEXT"));
	mButNext->setTextColor(Qt::white);

	mBottomLayout->addWidget(mButBack);
#ifdef ZULU_TAGGING
	mBottomLayout->addWidget(mQuotaGroup);
#endif
	mBottomLayout->addItem(new QSpacerItem(20, 10, QSizePolicy::Expanding, QSizePolicy::Fixed));
	mBottomLayout->addWidget(mButNext);

	/*
	 * Signals and slots
	 */
    connect(mButNext, SIGNAL(clicked()), this, SLOT(StateNext()));
    connect(mButBack, SIGNAL(clicked()), this, SLOT(StateBack()));
    connect(mButAdd, SIGNAL(clicked()), this, SLOT(AddImages()));
    connect(mButDelete, SIGNAL(clicked()), this, SLOT(DeleteImages()));
	connect(mButSettings, SIGNAL(clicked()), this, SLOT(ChangeSettings()));
	connect(mButHelp, SIGNAL(clicked()), this, SLOT(ShowHelp()));

	SwitchState(ZULU_IMAGES);
}

ZMainWin::~ZMainWin()
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

#ifdef ZULU_TAGGING
/*------------------------------------------------------------------*
 *							UpdateUsage()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Causes the window to update it's usage statistics.
 *
 *	@author		Josh Williams
 *	@date		22-Jun-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZMainWin::UpdateUsage(int vQuota, int vUsage, ZULONG vTotalCurrent)
{
	ZULONG	vTotalUsage = 0L;
	ZUINT	vUsagePerc;
	QString	vUsageMsg;

	vTotalUsage = vUsage + vTotalCurrent;
	vUsagePerc = (ZUINT)((float)vTotalUsage / (float)vQuota * 100.0f);

	vUsageMsg.sprintf("Space Used: %d%%", vUsagePerc);
	mUsgCur->setProgress(vUsagePerc);
	mUsage->setText(vUsageMsg);
}
#endif

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
 * 17-Jun-2005	Added auto-private logic.			Josh Williams	*
 *																	*
 *------------------------------------------------------------------*/
void ZMainWin::SwitchState(int pState)
{
	switch (pState)
	{
	case ZULU_IMAGES:
#ifdef ZULU_TAGGING
		mCategoryView->hide();
		mQuotaGroup->show();
#endif
		mUploadView->hide();
		mImageView->show();
		break;
#ifdef ZULU_TAGGING
	case ZULU_CATS:
		if (ZULU_APP()->GetTagging() == true)
		{
			mImageView->hide();
			mUploadView->hide();
			mQuotaGroup->hide();
			mCategoryView->show();
			break;
		}
#endif
	case ZULU_UPLOAD:
		mImageView->hide();
#ifdef ZULU_TAGGING
		mCategoryView->hide();
		mQuotaGroup->hide();
#endif
		mUploadView->show();
		break;
	}
	UpdateButtons(pState);
}

/*------------------------------------------------------------------*
 *							 UpdateButtons()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Redraws the buttons based on the current application
 *				state.
 *
 *	@author		Josh Williams
 *	@date		13-Aug-2004
 *
 *	@param		pState
 *					Current state of the application.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 * 17-Jun-2005	Added auto-private logic.			Josh Williams	*
 *																	*
 *------------------------------------------------------------------*/
void ZMainWin::UpdateButtons(int pState)
{
	switch (pState)
	{
	case ZULU_IMAGES:
		mButBack->setText(tr("BACK"));
		mButBack->update();
		mButNext->setText(tr("UPLOAD"));
		mButNext->update();
		mButBack->setEnabled(false);
		mButBack->hide();
		mButAdd->setEnabled(true);
		if (mImageView->count() > 0)
		{
			mButDelete->setEnabled(true);
			mButNext->setEnabled(true);
		}
		else
		{
			mButDelete->setEnabled(false);
			mButNext->setEnabled(false);
		}
		break;
#ifdef ZULU_TAGGING
	case ZULU_CATS:
		if (ZULU_APP()->GetTagging() == true)
		{
			mButBack->setText(tr("BACK"));
			mButBack->update();
			mButNext->setText(tr("FINISH"));
			mButNext->update();
			mButBack->setEnabled(true);
			mButBack->show();
			mButNext->setEnabled(true);
			mButNext->show();
			mButAdd->setEnabled(false);
			mButDelete->setEnabled(false);
			break;
		}
#endif
	case ZULU_UPLOAD:
		mButBack->setText(tr("CANCEL"));
		mButBack->update();
		if (ZULU_GUI_APP()->UploadPaused())
			mButNext->setText(tr("RESUME"));
		else
			mButNext->setText(tr("PAUSE"));
		mButNext->update();
		mButBack->setEnabled(true);
		mButNext->setEnabled(true);
		mButBack->show();
		mButAdd->setEnabled(false);
		mButDelete->setEnabled(false);
		break;
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
 *							   StateBack()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Called when the user presses the BACK/CANCEL button.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZMainWin::StateBack()
{
	ZULU_GUI_APP()->SwitchState(ZULU_BACK);
}

/*------------------------------------------------------------------*
 *							   StateNext()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Called when the user presses the NEXT/PAUSE button.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZMainWin::StateNext()
{
	ZULU_GUI_APP()->SwitchState(ZULU_NEXT);
}

/*------------------------------------------------------------------*
 *								AddImages()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Called when the user hits the add (+) button.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 *	@remarks	Opens a file dialog to allow for selecting additional
 *				files.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZMainWin::AddImages()
{
	QStringList::iterator vIt;
	QString vStrDir = ZULU_GUI_APP()->GetLastBrowse();

	QStringList vFiles = QFileDialog::getOpenFileNames("JPEG (*.jpg *.jpeg *.JPG *.JPEG);;GIF (*.gif *.GIF);;Bitmap (*.bmp *.BMP);;PNG (*.png *.PNG)",
			vStrDir,
			this,
			"open files dialog",
			"Select one or more images to upload");
	if (vFiles.size() > 0)
	{
		QFileInfo vInfo(vFiles[0]);
		ZULU_GUI_APP()->SetLastBrowse(vInfo.absFilePath());
		for (vIt = vFiles.begin(); vIt != vFiles.end(); vIt++)
			ZULU_GUI_APP()->AddFile((*vIt));
	}
}

/*------------------------------------------------------------------*
 *							 DeleteImages()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Called when the user hits the delete (-) button.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZMainWin::DeleteImages()
{
	mImageView->DeleteSelectedItems();
}

/*------------------------------------------------------------------*
 *							 customEvent()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Overridden to allow for communication with the upload
 *				view.  Also processes recalculation of quotas on image
 *				drop.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 *	@param		pEvt
 *					The actual even object.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZMainWin::customEvent(QCustomEvent *pEvt)
{
	if (pEvt->type() == ZUPLOAD)
	{
		ZUploadEvent *vUevt = static_cast<ZUploadEvent *>(pEvt);
		if (vUevt->mKey == 0)
			ZULU_GUI_APP()->SwitchState(ZULU_NEXT); // We're done uploading
		else
		{
			ZImageViewItem *vIvi = mImageView->FindByKey(vUevt->mKey);
			if (vIvi != NULL)
				delete vIvi;
			mImageView->arrangeItemsInGrid();
		}
	}
	else if (pEvt->type() == ZSP)
		ZULU_GUI_APP()->UploadStatus(static_cast<ZSPEvent *>(pEvt));
}

/*------------------------------------------------------------------*
 *							 ChangeSettings()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Brings up the login/settings window.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZMainWin::ChangeSettings(bool pAuthd /*=true*/)
{
	bool		vMustValidate = false;
	bool		vAuthd = false;
	bool		vUserChanged = false;
	bool		vPswdChanged = false;
	char		vHash[33];
	ZPrefWin	vPrefWin(this);
	ZRESULT		vZRetval;
	QString		vOrigUser, vOrigPswdHash;
	QString		vNewUser, vNewPswdHash;
	QString		vNewPswd;

	/*
	 * Store the current user/pswd values in case of failure
	 */
	vOrigUser = ZULU_APP()->GetUserName();
	vOrigPswdHash = ZULU_APP()->GetPswdHash();

	vNewUser = vOrigUser;
	vOrigPswdHash = vOrigPswdHash;

	/*
	 * Set the values in the preferences window.
	 */
	vPrefWin.SetUser(vOrigUser);
	vPrefWin.SetPswd(vOrigPswdHash);
	vPrefWin.SetAuto(ZULU_APP()->GetAuto());
#ifdef ZULU_TAGGING
	vPrefWin.SetPrivate(ZULU_APP()->GetPrivate());
	vPrefWin.SetTagging(ZULU_APP()->GetTagging());
#endif

	/*
	 * If we haven't validated the user/pswd, we have to do it now.
	 */
	if (pAuthd == false)
		vMustValidate = true;

	while (!vAuthd)
	{
		if (vPrefWin.exec() == QDialog::Accepted)
		{
			/*
			 * Grab the user/pswd values from the window.  If either value
			 * changed, we must validate.
			 */
			vUserChanged = vPrefWin.GetUser(vNewUser);
			vPswdChanged = vPrefWin.GetPswd(vNewPswd);
			if (vUserChanged || vPswdChanged)
			{
				vMustValidate = true;
				if (vPswdChanged)
				{
					ZMD5Hasher::HashString(vNewPswd.latin1(), vNewPswd.length(), vHash, sizeof(vHash));
					vNewPswdHash = vHash;
				}
			}

			if (vMustValidate)
			{
				/*
				 * Configure the client to use the new user/pswd values and 
				 * try and validate them.
				 */
				vZRetval = ZULU_GUI_APP()->ConnectAndAuth(vNewUser, vNewPswdHash);
				ZULU_APP()->GetClient()->Disconnect();

				if (vZRetval == ZERR_INVALID_VERSION)
					reject(); // so the application ends.
				else if (vZRetval != ZERR_SUCCESS)
					continue;
				else
				{
					ZULU_APP()->SetUser(vNewUser);
					ZULU_APP()->SetPswdHash(vNewPswdHash);
				}
			}

			/*
			 * All the values check out.
			 * Store 'em.
			 */
			ZULU_APP()->SetAuto(vPrefWin.GetAuto());
#ifdef ZULU_TAGGING
			ZULU_APP()->SetPrivate(vPrefWin.GetPrivate());
			ZULU_APP()->SetTagging(vPrefWin.GetTagging());
#endif
			ZULU_APP()->SaveSettings();
			vAuthd = true;
		}
		else
		{
			break;
		}
	}
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
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZMainWin::ShowHelp()
{
	ZUtils::OpenURL(this, ZOTO_HELP_URL);

    WAIT_CURSOR_OFF();
}

/*------------------------------------------------------------------*
 *						windowActivationChange()					*
 *------------------------------------------------------------------*/
/**
 *	@brief		Overridden to allow the category window to be invalidated
 *				when the "Edit Tags" button is pressed.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 *	@param		pOldActive
 *					The previous state of the window.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZMainWin::windowActivationChange(bool pOldActive)
{
	qDebug("%s::Activation changed.  We are now %s", __FILE__, pOldActive ? "inactive" : "active");
	if (!pOldActive)
	{
		ZULU_GUI_APP()->GainedFocus();
	}
}

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *							   InitViews()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Initializes all the different views and sets the size.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZMainWin::InitViews()
{
	/*
	 * Create the Image View.
	 */
    mImageView = new ZImageView(this, "ImageView");
	mImageView->setFrameShape(ZImageView::Panel);
    mImageView->setFrameShadow(ZImageView::Plain);
	mImageView->setPaletteBackgroundColor(QColor(255, 255, 255));
	mImageView->setLineWidth(1);
    mImageView->setSelectionMode(ZImageView::Extended);
    mImageView->setGridX(110);
    mImageView->setGridY(110);
    mImageView->SetBorderWidth(3);
    mImageView->setItemsMovable(FALSE);
    mImageView->SetHintColor(QColor(161, 161, 161));
    mImageView->SetBorderColor(QColor(161, 161, 161));
    mImageView->SetSelectedColor(Qt::red);
    mImageView->SetHintText(tr("Drag Photos Here"));	
	connect(mButDelete, SIGNAL( clicked() ),
			mImageView, SLOT( DeleteSelectedItems() ));
	mImageView->hide();
	mMainLayout->addWidget(mImageView);


#ifdef ZULU_TAGGING
	/*
	 * Create the Category View
	 */
	mCategoryView = new ZCategoryView(this, "CategoryView");
	mCategoryView->setFrameShape(QFrame::NoFrame);
	mCategoryView->setPaletteBackgroundColor(QColor(34, 140, 210));
	mCategoryView->hide();
	mMainLayout->addWidget(mCategoryView);
#endif

	/*
	 * Create the Upload View
	 */
    mUploadView = new ZUploadView(this, "UploadView");
	mUploadView->setFrameShape(QFrame::Panel);
    mUploadView->setFrameShadow(QFrame::Plain);
	mUploadView->setPaletteBackgroundColor(QColor(255, 255, 255));
	mUploadView->hide();
	mMainLayout->addWidget(mUploadView);
}

} // End Namespace

/* vi: set ts=4: */
