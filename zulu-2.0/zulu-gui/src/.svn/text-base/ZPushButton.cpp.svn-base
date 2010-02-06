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
#include "ZPushButton.h"

/* System Headers */
#include <qpainter.h>
#include <qimage.h>
#include <qbitmap.h>

/* Local Headers */

namespace ZOTO
{

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZPushButton::ZPushButton(QWidget *parent, const char *name)
	: QPushButton(parent, name)
{
	mUpPix			= NULL;
	mDownPix		= NULL;
	mDisabledPix	= NULL;
	mText			= "";
	mTextColor		= Qt::black;
	setSizePolicy(QSizePolicy::Fixed, QSizePolicy::Fixed);
}

ZPushButton::~ZPushButton()
{
	if (mUpPix != NULL)
		delete mUpPix;
	if (mDownPix != NULL)
		delete mDownPix;
	if (mDisabledPix != NULL)
		delete mDisabledPix;
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
 *							setPixmap()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Sets the pixmap to be used by this button in it's
 *				normal state.
 *
 *	@author		Josh Williams
 *	@date		12-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZPushButton::setPixmap(const QPixmap& p)
{
	if (mUpPix != NULL)
		delete mUpPix;

	mUpPix = new QPixmap(p);
	setMinimumSize(mUpPix->size());
	setMaximumSize(mUpPix->size());
	MaskButton(mUpPix);
	update();
}

/*------------------------------------------------------------------*
 *							setDownPixmap()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Sets the pixmap to be used by this button in it's
 *				"pressed" state.
 *
 *	@author		Josh Williams
 *	@date		12-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZPushButton::setDownPixmap(const QPixmap& p)
{
	if (mDownPix != NULL)
		delete mDownPix;

	mDownPix = new QPixmap(p);
}

/*------------------------------------------------------------------*
 *							setDisabledPixmap()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Sets the pixmap to be used by this button in it's
 *				"disabled" state.
 *
 *	@author		Josh Williams
 *	@date		12-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZPushButton::setDisabledPixmap(const QPixmap& p)
{
	if (mDisabledPix != NULL)
		delete mDisabledPix;

	mDisabledPix = new QPixmap(p);
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
 *							drawButton()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Called when this button needs to be redrawn (ie. when
 *				becomes visible again or when it's state changes).
 *
 *	@author		Josh Williams
 *	@date		12-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZPushButton::drawButton(QPainter *p)
{
	QRect	vRect = rect();
	QPixmap *vPix;

	if (!isEnabled())
		vPix = mDisabledPix;
	else if (isDown())
		vPix = mDownPix;
	else
		vPix = mUpPix;
	
	if (pixmap() != NULL)
		p->drawPixmap(vRect.x() , vRect.y(), *vPix);
	drawButtonLabel(p);
}

/*------------------------------------------------------------------*
 *							drawButtonLabel()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Prints the text for this button centered on the pixmap.
 *
 *	@author		Josh Williams
 *	@date		12-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZPushButton::drawButtonLabel(QPainter *p)
{
	p->save();
	p->setPen(mTextColor);
	p->drawText(rect(), AlignCenter, mText);
	p->restore();

}

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *							   MaskButton()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Sets up the bitmask for the shape of this button.
 *
 *	@author		Josh Williams
 *	@date		12-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZPushButton::MaskButton(const QPixmap *pPix)
{
	QPixmap vPix;
	QBitmap vBitMask;

	QImage vImg(pPix->convertToImage());
	vPix = *pPix;
	if (!vPix.mask())
	{
		if (vImg.hasAlphaBuffer())
		{
			vBitMask = vImg.createAlphaMask();
			vPix.setMask(vBitMask);
		}
		else
		{
			vBitMask = vImg.createHeuristicMask();
			vPix.setMask(vBitMask);
		}
	}
	if (vPix.mask())
		setMask(*vPix.mask());
}

} // End Namespace

/* vi: set ts=4: */
