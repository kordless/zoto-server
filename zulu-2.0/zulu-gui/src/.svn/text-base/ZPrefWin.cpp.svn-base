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
#include "ZPrefWin.h"

/* System Headers */
#include <qlabel.h>
#include <qpushbutton.h>
#include <qmessagebox.h>
#include <qlayout.h>
#include <qgroupbox.h>
#include <qgrid.h>
#include <qhbox.h>

/* Local Headers */
#include "ZGuiApp.h"
#include "ZUtils.h"

/* Macros */

namespace ZOTO
{

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZPrefWin::ZPrefWin(QWidget *pParent, const char *pName, bool pModal, WFlags pFlags)
	: QDialog(pParent, pName, pModal, pFlags)
{
	if (!pName)
		setName("ZPrefWin");

	setCaption(ZULU_GUI_APP()->GetAppName());

	setWFlags(Qt::WStyle_Customize | Qt::WStyle_DialogBorder);

	resize(QSize(300, 250).expandedTo(minimumSizeHint()));
	setSizeGripEnabled(false);
	setFixedSize(QSize(300, 250));

	/*
	 * Main Layout
	 */
	mMainLayout = new QVBoxLayout(this, 15, 0, "MainLayout");

	/*
	 * Main object group
	 */
	mMainGroup = new QGroupBox(1, Qt::Horizontal, this, "MainGroup");
	mMainGroup->setTitle("Preferences");
	mMainGroup->setInsideMargin(20);
	mMainGroup->setInsideSpacing(10);

	/*
	 * Text fields
	 */
	mTextGrid = new QGrid(2, mMainGroup, "Grid");
	mTextGrid->setSpacing(10);
	mLblUser = new QLabel(mTextGrid);
	mLblUser->setText(tr("Username:"));
	mLinUser = new QLineEdit(mTextGrid);
	mLinUser->setText("");

	mLblPswd = new QLabel(mTextGrid);
	mLblPswd->setText(tr("Password:"));
	mLinPswd = new QLineEdit(mTextGrid);
	mLinPswd->setEchoMode(QLineEdit::Password);
	mLinPswd->setText("");

	/*
	 * Checkboxes
	 */
	mChkAuto = new QCheckBox(mMainGroup);
	mChkAuto->setChecked(false);
	mChkAuto->setText(tr("Remember My Password"));
	mMainGroup->addSpace(0);

#ifdef ZULU_TAGGING
	mChkPrivate = new QCheckBox(mMainGroup);
	mChkPrivate->setChecked(false);
	mChkPrivate->setText(tr("Mark All Photos As Private"));

	mChkTagging = new QCheckBox(mMainGroup);
	mChkTagging->setChecked(false);
	mChkTagging->setText(tr("Assign Smart Tags To Photos"));
#endif

	/*
	 * Buttons
	 */
	QHBox *vButBox = new QHBox(this, "ButtonBox");
	mButOk = new QPushButton(vButBox, "OkButton");
	mButOk->setText(tr("OK"));
	mButOk->setMinimumSize(100, 25);
	mButOk->setMaximumSize(100, 25);
	mButCancel = new QPushButton(vButBox, "CancelButton");
	mButCancel->setText(tr("Cancel"));
	mButCancel->setMinimumSize(100, 25);
	mButCancel->setMaximumSize(100, 25);
	clearWState(WState_Polished);

	/*
	 * Organize window
	 */
	mMainLayout->addWidget(mMainGroup);
	mMainLayout->addItem(new QSpacerItem(1, 1, QSizePolicy::Expanding, QSizePolicy::Expanding));
	mMainLayout->addWidget(vButBox);
	
	/*
	 * Signals and slots
	 */
	connect(mButOk, SIGNAL(clicked()), this, SLOT(ValidateForm()));
	connect(mButCancel, SIGNAL(clicked()), this, SLOT(reject()));
}

ZPrefWin::~ZPrefWin()
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
void ZPrefWin::ValidateForm()
{
	if (mLinUser->text().length() < 4)
	{
		QMessageBox::warning(NULL, ZULU_GUI_APP()->GetAppName(), tr("User name must be at least 4 characters."));
		return;
	}

	if (mLinPswd->text().length() < 6)
	{
		QMessageBox::warning(NULL, ZULU_GUI_APP()->GetAppName(), tr("Password must be at least 6 characters."));
		return;
	}

	/*
	 * Fields are valid.
	 */
	accept();
}

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

} // End Namespace

/* vi: set ts=4: */
