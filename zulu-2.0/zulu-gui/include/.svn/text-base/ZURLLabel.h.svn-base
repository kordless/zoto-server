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
#if !defined(__ZURLLABEL_H_INCLUDED__)
#define __ZURLLABEL_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qlabel.h>

/* Local Headers */

/* Macros */

namespace ZOTO
{

/**
 *  @class      ZURLLabel
 *  @brief      Label to allow a URL to be included in a dialog.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class ZURLLabel : public QLabel
{
	Q_OBJECT
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZURLLabel(QWidget *pParent, const char *pName, WFlags pFlags = 0);
	~ZURLLabel();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				setText(const QString& pText);

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/

protected:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/
	void				enterEvent(QEvent *pEvt);
	void				leaveEvent(QEvent *pEvt);
	void				mouseMoveEvent(QMouseEvent *pEvt);
	void				mouseReleaseEvent(QMouseEvent *pEvt);
	void				resizeEvent(QResizeEvent *pEvent);

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/
	void				CalculateHitBox(const QSize& vSize);
	void				SetMouseOver();
	void				SetMouseOut();

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	QRect				mHitBox;	/**< Rectangle that will recieve mouse events */
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/

} // End Namespace

#endif // __ZURLLABEL_H_INCLUDED__

/* vi: set ts=4: */
