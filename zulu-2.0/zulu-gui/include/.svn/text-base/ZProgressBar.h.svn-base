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
#if !defined(__ZPROGRESSBAR_H_INCLUDED__)
#define __ZPROGRESSBAR_H_INCLUDED__

/* System Headers */
#include <qprogressbar.h>

/* Local Headers */

/* Macros */

class QPixmap;

namespace ZOTO
{

/**
 *  @class      ZProgressBar
 *  @brief      Gives us a really sleek looking aqua progress bar.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class ZProgressBar : public QProgressBar
{
	Q_OBJECT

public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZProgressBar(QWidget *pParent = 0, const char *pName = 0, WFlags pFlags = 0);
	~ZProgressBar();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/

protected:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/
	void				drawContents(QPainter *pPainter);
	void				resizeEvent(QResizeEvent *pEvt);

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/
	void				PaintGradient(const QSize& pSize, const QColor& pTopColor,
							const QColor& pBottomColor, QPixmap *pBuffer) const;

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	QPixmap				*mFramePix;	/**< Outer frame buffer */
	QPixmap				*mBarPix;	/**< Progress bar (gradient) buffer */
	int					mRoundX;	/**< Rectangle rounding X value. */
	int					mRoundY;	/**< Rectangle rounding Y value. */
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/

} // End Namespace

#endif // __ZPROGRESSBAR_H_INCLUDED__

/* vi: set ts=4: */
