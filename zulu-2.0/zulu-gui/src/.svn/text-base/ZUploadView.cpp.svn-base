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
#include "ZUploadView.h"

/* System Headers */
#include <qlabel.h>
#include <qpixmap.h>
#include <qmessagebox.h>
#include <qlayout.h>
#include <qpainter.h>

/* Local Headers */
#include "ZGuiApp.h"
#include "ZTypes.h"
#include "ZProgressBar.h"

/* Macros */

namespace ZOTO
{

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZUploadView::ZUploadView(QWidget *pParent, const char *pName)
	: QFrame(pParent, pName)
{
	if (!pName)
		setName("ZUploadView");
	setFrameShape(QFrame::Panel);
	setFrameShadow(QFrame::Plain);

	mMainLayout = new QVBoxLayout(this);

	mPixThumb = new QLabel(this, "PixThumb");
	mPixThumb->setMinimumSize(200, 200);
	mPixThumb->setMaximumSize(200, 200);
	mPixThumb->setFrameShape(QLabel::NoFrame);
	mPixThumb->setLineWidth(2);
	mPixThumb->setPixmap(QPixmap::fromMimeSource("loading.png"));
	mPixThumb->setScaledContents(FALSE);
	mPixThumb->setAlignment(int(QLabel::AlignCenter));

	mPrgCurrent = new ZProgressBar(this, "PrgCurrent");
	mPrgCurrent->setMinimumSize(280, 17);
	mPrgCurrent->setMaximumSize(280, 17);
	mPrgCurrent->setTotalSteps(100);

	mPrgTotal = new ZProgressBar(this, "PrgTotal");
	mPrgTotal->setMinimumSize(280, 17);
	mPrgTotal->setMaximumSize(280, 17);
	mPrgCurrent->setTotalSteps(100);

	mLblOverall = new QLabel(this, "LblOverall");
	mLblOverall->setPaletteBackgroundColor(Qt::white);
	mLblOverall->setPaletteForegroundColor(Qt::black);

	QFont vLblFont(mLblOverall->font());
	vLblFont.setFamily("Arial");
	vLblFont.setPointSize(10);
	vLblFont.setBold(TRUE);
	mLblOverall->setFont(vLblFont);
	mLblOverall->setAlignment(int(QLabel::AlignRight));
	mLblOverall->setText(tr("Overall Progress:"));

	mLblFileCount = new QLabel(this, "LblFileCount");
	mLblFileCount->setPaletteBackgroundColor(Qt::white);
	mLblFileCount->setPaletteForegroundColor(Qt::darkRed);
	QFont vLblFileFont(mLblFileCount->font());
	vLblFileFont.setFamily("Arial");
	vLblFileFont.setPointSize(12);
	vLblFileFont.setBold(TRUE);
	mLblFileCount->setFont(vLblFont);
	mLblFileCount->setAlignment(int(QLabel::AlignLeft));

	mMainLayout->addItem(new QSpacerItem(1, 10, QSizePolicy::Expanding, QSizePolicy::Minimum));
	AddItemCentered(mMainLayout, mPixThumb);
	mMainLayout->addItem(new QSpacerItem(1, 5, QSizePolicy::Expanding, QSizePolicy::Minimum));
	AddItemCentered(mMainLayout, mPrgCurrent);
	mMainLayout->addItem(new QSpacerItem(1, 5, QSizePolicy::Expanding, QSizePolicy::Minimum));
	AddItemCentered(mMainLayout, mPrgTotal);
	mMainLayout->addItem(new QSpacerItem(1, 10, QSizePolicy::Expanding, QSizePolicy::Minimum));

	QHBoxLayout *vLayout = new QHBoxLayout(mMainLayout);
	vLayout->addItem(new QSpacerItem(1, 1, QSizePolicy::Fixed, QSizePolicy::Minimum));
	vLayout->addWidget(mLblOverall);
	vLayout->addWidget(mLblFileCount);
	vLayout->addItem(new QSpacerItem(1, 1, QSizePolicy::Fixed, QSizePolicy::Minimum));
	mMainLayout->addItem(new QSpacerItem(1, 5, QSizePolicy::Expanding, QSizePolicy::Minimum));

	clearWState(WState_Polished);
}

ZUploadView::~ZUploadView()
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
 *								Reset()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Initializes the view to the default state.
 *	@author		Josh Williams
 *	@date		13-Aug-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZUploadView::Reset(int pFiles)
{
	mPixThumb->setPixmap(NULL);
	mPrgTotal->setProgress(0);
	mPrgCurrent->setProgress(0);
	mTotalFiles = pFiles;
	UpdateProgressText();
}

/*------------------------------------------------------------------*
 *							SwitchFile()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Causes the view to display a new thumbnail.  Also 
 *				resets the file progress bar and updates the file number.
 *	@author		Josh Williams
 *	@date		14-Aug-2005
 *
 * @param		pFile
 * 					Info about the file currently being uploaded.
 * @param		pIdx
 * 					Index of the current file (x of 10)
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZUploadView::SwitchFile(const ZFileInfo& pFile, int pIdx)
{
	mCurrentFile = pIdx;
	mPrgCurrent->setProgress(0);

	/*
	 * Create the thumbnail
	 */
	QPixmap vPix(QImage(pFile.mName).smoothScale(mPixThumb->width() - 14,
						mPixThumb->height() - 14, QImage::ScaleMin));
	QPixmap vBuffer(vPix.width() + 14, vPix.height() + 14);
	QPainter vPainter(&vBuffer, mPixThumb);
	// Draw the border
	vPainter.setPen(Qt::darkGray);
	vPainter.setBrush(Qt::lightGray);
	vPainter.drawRect(0, 0, vBuffer.width(), vBuffer.height());
	// Draw the thumbnail
	vPainter.drawPixmap(7, 7, vPix);
	mPixThumb->setPixmap(vBuffer);
	update();
}

/*------------------------------------------------------------------*
 *							SetProgress()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Increments the progress meters.
 *	@author		Josh Williams
 *	@date		14-Aug-2005
 *
 *	@param		pFile
 *					Percentage for the file progress meter.
 *	@param		pTotal
 *					Percentage for the overall progress meter.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZUploadView::SetProgress(ZUINT pFile, ZUINT pTotal)
{
	qDebug("%s::Setting progresses to [%d, %d]", __FILE__, pFile, pTotal);
	mPrgCurrent->setProgress(pFile);
	mPrgTotal->setProgress(pTotal);
	UpdateProgressText();
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

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *							AddItemCentered()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Handles centering all widgets within the window.
 *
 *	@author		Josh Williams
 *	@date		29-Apr-2005
 *
 *	@param		pLayout
 *					Layout that is to contain the widget.
 *	@param		pWidget
 *					Widget to be added.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZUploadView::AddItemCentered(QBoxLayout *pLayout, QWidget *pWidget)
{
	QHBoxLayout *vHLayout = new QHBoxLayout(pLayout);
	vHLayout->addItem(new QSpacerItem(1, 1, QSizePolicy::Expanding, QSizePolicy::Minimum));
	vHLayout->addWidget(pWidget);
	vHLayout->addItem(new QSpacerItem(1, 1, QSizePolicy::Expanding, QSizePolicy::Minimum));
}

/*------------------------------------------------------------------*
 *							UpdateProgressText()					*
 *------------------------------------------------------------------*/
/**
 *	@brief		Sets the text displaying upload progress.
 *
 *	@author		Josh Williams
 *	@date		11-May-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZUploadView::UpdateProgressText()
{
	QString vStrText;
	
	vStrText.sprintf("%d%% (%d of %d)", mPrgTotal->progress(), mCurrentFile, mTotalFiles);
	mLblFileCount->setText(vStrText);
}

} // End Namespace

/* vi: set ts=4: */
