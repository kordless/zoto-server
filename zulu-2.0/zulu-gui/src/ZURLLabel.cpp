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
#include "ZURLLabel.h"

/* System Headers */
#include <qapplication.h>
#include <qcursor.h>

/* Local Headers */
#include "ZUtils.h"
#include "ZGlobals.h"

/* Macros */

namespace ZOTO
{

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZURLLabel::ZURLLabel(QWidget *pParent /*=0*/, const char *pName /*=0*/, WFlags pFlags /*=0*/)
	: QLabel(pParent, pName, pFlags)
{
	SetMouseOut();
}

ZURLLabel::~ZURLLabel()
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
 *								setText()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Overridden so we can recalculate the hitbot.
 *
 *	@author		Josh Williams
 *	@date		24-Apr-2005
 *
 *	@param		pText
 *					Text to be displayed on the label.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZURLLabel::setText(const QString& pText)
{
	QLabel::setText(pText);
	QSize vSize = sizeHint();
	CalculateHitBox(vSize);
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
 *							  enterEvent()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Called when the mouse enters the label.
 *
 *	@author		Josh Williams
 *	@date		24-Apr-2005
 *
 *	@param		pEvt
 *					Pointer that holds information about the event.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZURLLabel::enterEvent(QEvent *pEvt)
{
	Q_UNUSED(pEvt);
	setMouseTracking(true);
}

/*------------------------------------------------------------------*
 *							   leaveEvent()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Called when the mouse leaves the label.
 *
 *	@author		Josh Williams
 *	@date		24-Apr-2005
 *
 *	@param		pEvt
 *					Pointer that holds information about the event.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZURLLabel::leaveEvent(QEvent *pEvt)
{
	Q_UNUSED(pEvt);
	setMouseTracking(false);

	/*
	 * Just to be safe.
	 */
	SetMouseOut();
}

/*------------------------------------------------------------------*
 *							mouseMoveEvent()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Called when the mouse moves within the bounds of
 *				the label.
 *
 *	@author		Josh Williams
 *	@date		24-Apr-2005
 *
 *	@param		pEvt
 *					Pointer that holds information about the event,
 *					such as position and keys pressed.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZURLLabel::mouseMoveEvent(QMouseEvent *pEvt)
{
	static bool bInside = false;

	/*
	 * Check to see if the mouse is inside the hitbox.  The hitbox
	 * is a rectangle calculated to be roughly the size of the text.
	 */
	if (mHitBox.contains(pEvt->pos()))
	{
		if (bInside == false)
		{
			bInside = true;
			SetMouseOver();
		}
	}
	else
	{
		if (bInside == true)
		{
			bInside = false;
			SetMouseOut();
		}
	}
}

/*------------------------------------------------------------------*
 *							mouseReleaseEvent()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Received when the user releases the mouse after clicking
 *				it inside the label.
 *
 *	@author		Josh Williams
 *	@date		24-Apr-2005
 *
 *	@param		pEvt
 *					Pointer that holds information about the event,
 *					such as position and buttons pressed.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZURLLabel::mouseReleaseEvent(QMouseEvent *pEvt)
{
	if (mHitBox.contains(pEvt->pos()))
	{
		if (pEvt->button() == LeftButton)
		{
			ZUtils::OpenURL(parentWidget(), ZOTO_PSWD_URL);
		}
	}
}

/*------------------------------------------------------------------*
 *							  resizeEvent()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Overridden so we can recalculate hitbox.
 *
 *	@author		Josh Williams
 *	@date		24-Apr-2005
 *
 *	@param		pEvt
 *					Pointer that holds information about the event.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZURLLabel::resizeEvent(QResizeEvent *pEvt)
{
	Q_UNUSED(pEvt);
	CalculateHitBox(sizeHint());
}

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *							CalculateHitBox()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Calculates a rectangle within the label that should
 *				roughly be the same size and position of the text.
 *
 *	@author		Josh Williams
 *	@date		24-Apr-2005
 *
 *	@param		pSize
 *					Size of the text rectangle.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZURLLabel::CalculateHitBox(const QSize &pSize)
{
	mHitBox.setX((rect().width() - pSize.width()) / 2);
	mHitBox.setY((rect().height() - pSize.height()) / 2);
	mHitBox.setWidth(pSize.width());
	mHitBox.setHeight(pSize.height());
}

/*------------------------------------------------------------------*
 *							SetMouseOver()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Changes the color of the text, and changes the pointer
 *				to a hand to indicate a URL.
 *
 *	@author		Josh Williams
 *	@date		24-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZURLLabel::SetMouseOver()
{
	setPaletteForegroundColor(Qt::blue);
	QApplication::setOverrideCursor(QCursor(Qt::PointingHandCursor));
}

/*------------------------------------------------------------------*
 *							SetMouseOut()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Changes the color of the text and the pointer back to
 *				defaults when the user leaves the hitbox.
 *
 *	@author		Josh Williams
 *	@date		24-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZURLLabel::SetMouseOut()
{
	setPaletteForegroundColor(Qt::darkBlue);
	QApplication::restoreOverrideCursor();
}

} // End Namespace

/* vi: set ts=4: */
