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
#include "ZProgressBar.h"

/* System Headers */
#include <qpixmap.h>
#include <qbitmap.h>
#include <qpainter.h>
#include <qimage.h>

/* Local Headers */

/* Macros */

namespace ZOTO
{

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZProgressBar::ZProgressBar(QWidget *pParent /*=0*/, const char *pText /*=0*/,
			WFlags pFlags /*=0*/)
	: QProgressBar(pParent, pText, pFlags)
{
	mFramePix = new QPixmap(1, 1);
	mBarPix = new QPixmap(1, 1);
	mRoundX = 5;
	mRoundY = 90;
}

ZProgressBar::~ZProgressBar()
{
	if (mFramePix)
		delete mFramePix;
	if (mBarPix)
		delete mBarPix;
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

/*------------------------------------------------------------------*
 *							 drawContents()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Handles drawing the progress bar to the screen.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 *	@param		pPainter
 *					Painter instance to use for screen drawing.
 *
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZProgressBar::drawContents (QPainter *pPainter)
{
	QPixmap		vBuffer(rect().size());			/* the main buffer */
	QPixmap		vBarBuffer(*mBarPix);			/* buffer for painting the masked bar */
	QPixmap		vPixMask(mBarPix->size());		/* buffer to hold the bar's mask */
	QPainter	vBufferPainter(&vBuffer, this);	/* main buffer painter */
	QPainter	vMaskPainter(&vPixMask, this);	/* painter for the bar mask */

	pPainter->save();

	/*
	 * Draw the frame
	 */
	vBufferPainter.drawPixmap(0, 0, *mFramePix);

	/*
	 * Put the gradient bar in a buffer for masking
	 */


	/*
	 * Calculate the size of the progress bar
	 */
	int vProgress = (int)(((float)progress() / (float)totalSteps()) * (float)rect().width());
	qDebug("%s::progress()  (%15.15s) = %d", __FILE__, name(), progress());
	qDebug("%s::totalSteps()(%15.15s) = %d", __FILE__, name(), totalSteps());
	qDebug("%s::vProgress(%s) = %d", __FILE__, name(), vProgress);
	qDebug("%s::vPixMask.size()(%s) = [%d, %d]", __FILE__, name(), vPixMask.width(), vPixMask.height());

	/*
	 * Now, mask it
	 */
	vPixMask.fill(Qt::white);
	vMaskPainter.setPen(NoPen);
	vMaskPainter.setBrush(Qt::black);
	vMaskPainter.drawRoundRect(0, 0, vPixMask.width(), vPixMask.height(), mRoundX, mRoundY);
	vMaskPainter.setBrush(Qt::white);
	vMaskPainter.drawRect(vProgress, 0, vPixMask.width() - vProgress, vPixMask.height());
	vBarBuffer.setMask(vPixMask.createHeuristicMask());
	vBufferPainter.drawPixmap(1, 1, vBarBuffer);

	/*
	 * Now, draw the finished product to the screen
	 */
	pPainter->drawPixmap(0, 0, vBuffer);
	pPainter->restore();
}

/*------------------------------------------------------------------*
 *							resizeEvent()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Rebuilds the frame and gradient buffers in the event
 *				of progress bar resizing.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 *	@param		pEvt
 *					Information about the new size.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZProgressBar::resizeEvent(QResizeEvent *pEvt)
{
	Q_UNUSED(pEvt);
	QRect		vBarRect;
	QPainter	vFramePainter;

	vBarRect.setTop(rect().top() + 1);
	vBarRect.setBottom(rect().bottom() - 1);
	vBarRect.setLeft(rect().left() + 1);
	vBarRect.setRight(rect().right() - 1);


	/*
	 * resize the buffers
	 */
	mFramePix->resize(rect().size());
	mFramePix->fill(parentWidget()->paletteBackgroundColor());
	mBarPix->resize(QSize(rect().width() - 4, rect().height() - 4));

	vFramePainter.begin(mFramePix, this);
	vFramePainter.setPen(Qt::NoPen);
	vFramePainter.setClipping(false);

	/* draw the outer rect */
	vFramePainter.setBrush(Qt::darkGray);
	vFramePainter.drawRoundRect(0, 0, rect().width(), rect().height(), mRoundX, mRoundY);

	/* draw the inner rect */
	vFramePainter.setBrush(Qt::white);
	vFramePainter.drawRoundRect(1, 1, vBarRect.width(), vBarRect.height(), mRoundX, mRoundY);

	/*
	 * Now, draw the bar gradient
	 */
	PaintGradient(vBarRect.size(), QColor(90, 196, 239), QColor(194, 233, 249), mBarPix);

}

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *							PaintGradient()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Draws the gradient rectangle that is the progress bar.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 *	@param		pSize
 *					Dimensions to be used for the rectangle.
 *	@param		pTopColor
 *					Color for the start(top) of the gradient.
 *	@param		pBottomColor
 *					Color for the end(bottom) of the gradient.
 *	@param		pBuffer
 *					Pixmap buffer the bar is to be drawn to.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZProgressBar::PaintGradient(const QSize& pSize, const QColor& pTopColor,
				const QColor& pBottomColor, QPixmap *pBuffer) const
{
	float vRedStep, vGreenStep, vBlueStep;

	pBuffer->resize(pSize);

	QPainter vPainter(pBuffer, this);

	vRedStep	= (pTopColor.red() - pBottomColor.red()) / pSize.height();
	vGreenStep	= (pTopColor.green() - pBottomColor.green()) / pSize.height();
	vBlueStep	= (pTopColor.blue() - pBottomColor.blue()) / pSize.height();

	for (int i = 0; i < pSize.height(); i++)
	{
		QColor	vColor((int)(pTopColor.red() - (vRedStep * i)),
						(int)(pTopColor.green() - (vGreenStep * i)),
						(int)(pTopColor.blue() - (vBlueStep * i)));

		vPainter.setPen(QPen(vColor, 0));
		vPainter.drawLine(0, i, pSize.width(), i);
	}
}

} // End Namespace

/* vi: set ts=4: */
