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
#include "ZImageViewItem.h"

/* System Headers */
#include <qfileinfo.h>
#include <qpainter.h>

/* Local Headers */
#include "ZImageView.h"
#include "ZMD5Hasher.h"

#define PARENT() static_cast<ZImageView *>(iconView())

namespace ZOTO
{

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZImageViewItem::ZImageViewItem(QIconView *pParent, const QString& pURI, int pKey)
	: QIconViewItem(pParent, ""), mThumb(NULL), mKey(pKey)
{
	this->setDragEnabled(false);
	/*
	 * Store the original image information
	 */
    mFileInfo.setFile(pURI);

	/*
	 * Set empty pixmap
	 */
	setPixmap(QPixmap());

	setText(pURI);
}

ZImageViewItem::~ZImageViewItem()
{
	if (mThumb != NULL)
		delete mThumb;
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
 *								setPixmap()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Sets the pixmap to be used for this image item.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZImageViewItem::setPixmap(const QPixmap& pIcon)
{
	if (mThumb != NULL)
		delete mThumb;
	mThumb = new QPixmap(pIcon);
	setPixmapRect(QRect(0, 0, PARENT()->GetThumbWidth(), PARENT()->GetThumbHeight()));
	calcRect(QString::null);
}

/*------------------------------------------------------------------*
 *								setText()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Overridden to allow proper calculation of the item
 *				rect.
 *
 *	@author		Josh Williams
 *	@date		03-May-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZImageViewItem::setText(const QString& pText)
{
	mText = pText;
	calcRect(QString::null);
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
 *							 paintItem()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Called when an icon needs to be repainted.
 *	@author		Josh Williams
 *	@date		01-Apr-2005
 *
 *	@param		p	- painter object
 *	@param		cg	- Color group to be used by default
 *
 *	@remarks	Paints the pixmap and associated border.  Border
 *				color will reflect this item's state (selected, focused,
 *				etc).
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZImageViewItem::paintItem(QPainter *pPainter, const QColorGroup& pCg)
{
	static QPixmap vBuffer;
	int vPixW, vPixH, vPixX, vPixY;
	int vBorW, vBorH, vBorX, vBorY;
	QRect vPixR, vBorR, vIcnR;
	Q_UNUSED(pCg);

	QColor vBorderColor = iconView()->paletteBackgroundColor();
	QPixmap *vPix = pixmap();
	pPainter->save();

	/*
	 * Get the coordinates of the bounding rectangle.
	 */
	vIcnR = rect();

	/*
	 * First thing we need to do is figure out where the pixmap should fall
	 */
	if (vPix == NULL)
	{
		vPixW = vPixH = 20;
		vPixX = vPixY = ((PARENT()->GetThumbWidth() - vPixW) / 2) + vIcnR.x();
	}
	else
	{
		vPixW = pixmap()->width();
		vPixH = pixmap()->height();
		vPixX = ((PARENT()->GetThumbWidth() - vPixW) / 2) + vIcnR.x();
		vPixY = ((PARENT()->GetThumbHeight() - vPixH) / 2) + vIcnR.y();
	}
	vPixR.setRect(vPixX, vPixY, vPixW, vPixH);

	/*
	 * Now we know how big to make the pixmap.  adjust for the border.
	 */
	vBorW = vPixW + (PARENT()->GetBorderWidth() * 2);
	vBorH = vPixH + (PARENT()->GetBorderWidth() * 2);
	vBorX = vPixX - PARENT()->GetBorderWidth();
	vBorY = vPixY - PARENT()->GetBorderWidth();
	vBorR.setRect(vBorX, vBorY, vBorW, vBorH);

	/*
	 * Size our offscreen buffer accordingly
	 */
  	QSize vNewSize = vIcnR.size().expandedTo(vBuffer.size());
	vBuffer.resize(vNewSize);
	vBuffer.fill(vBorderColor);

	/*
	 * Construct a painter for our buffer
	 */
	QPainter vBufferPainter(&vBuffer, this);
	vBufferPainter.translate(-vIcnR.x(), -vIcnR.y());

	/*
	 * Turn off clipping for faster repaint
	 */
	vBufferPainter.setClipping(false);

	/*
	 * Paint the border accordingly
	 */
	if(isSelected())
		vBufferPainter.fillRect(vBorR, PARENT()->GetSelectedColor());
	else
		vBufferPainter.fillRect(vBorR, PARENT()->GetBorderColor());

	/*
	 * Finally, draw the pixmap
	 */
	if (vPix != NULL)
		vBufferPainter.drawPixmap(vPixR.x() , vPixR.y(), *pixmap());
	else
		vBufferPainter.fillRect(vPixR, Qt::white);

	/*
	 * Now that our offscreen image is complete, draw it
	 */
	pPainter->drawPixmap(x(), y(), vBuffer);
	pPainter->restore();
}

/*------------------------------------------------------------------*
 *								dropped()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Handles drag and drop when an actual item is the drop
 *				location.
 *	
 *	@author		Josh Williams
 *	@date		01-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZImageViewItem::dropped(QDropEvent *pEvt, const QValueList<QIconDragItem>& pList)
{
	PARENT()->dropEvent(pEvt, pList);
}

/*------------------------------------------------------------------*
 *								calcRect()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Overridden to force icon size.
 *	@author		Josh Williams
 *	@date		01-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZImageViewItem::calcRect(const QString & pText)
{
	/*
	 * Calculate default dimensions
	 */
	QIconViewItem::calcRect(pText);  

	/*
	 * Override.  BWAHAAHAAHAAHAA!!!
	 */
	UpdateItemRect();
}

/*------------------------------------------------------------------*
 *							UpdateItemRect()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Overridden the size/position of the icon.
 *	@author		Josh Williams
 *	@date		01-Apr-2005
 *
 *	@remarks	Forces the icon to be exactly the size specified
*				by gridX() and gridY() in the view.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZImageViewItem::UpdateItemRect()
{
	/*
	 * Fix all dimensions to the full size of the icon
	 */
	QRect vRect = rect();
	setPixmapRect(QRect(0, 0, PARENT()->GetThumbWidth(), PARENT()->GetThumbHeight()));
	setItemRect(QRect(vRect.x(), vRect.y(), PARENT()->GetThumbWidth(), PARENT()->GetThumbHeight()));
}

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

} // End Namespace

/* vi: set ts=4: */
