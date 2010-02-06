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
#if !defined(__ZPUSHBUTTON_H_INCLUDED__)
#define __ZPUSHBUTTON_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qpushbutton.h>
#include <qwidgetplugin.h>

/* Local Headers */

/* Macros */

#ifndef ZPUSHBUTTON_IS_PLUGIN
#undef QT_WIDGET_PLUGIN_EXPORT
#define QT_WIDGET_PLUGIN_EXPORT
#endif

namespace ZOTO
{
/**
 *	@class		ZPushButton
 *	@brief		Overridden to allow for both text and a pixmap.
 *	@author		Josh Williams
 *	@version	0.1.0
 */
class QT_WIDGET_PLUGIN_EXPORT ZPushButton : public QPushButton
{
	Q_OBJECT

	Q_PROPERTY( QString  text READ text WRITE setText)
	Q_PROPERTY( QPixmap* pixmap READ pixmap WRITE setPixmap )
	Q_PROPERTY( QPixmap* downPixmap READ downPixmap WRITE setDownPixmap )
	Q_PROPERTY( QPixmap* disabledPixmap READ disabledPixmap WRITE setDisabledPixmap )
	Q_PROPERTY( QColor	 textColor READ textColor WRITE setTextColor )

public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZPushButton(QWidget *pParent, const char *pName = 0);
	virtual ~ZPushButton();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	QString				text() const;
	const QColor&		textColor() const;
	const QPixmap*		pixmap() const;
	const QPixmap*		downPixmap() const;
	const QPixmap*		disabledPixmap() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	virtual void		setText(const QString& pString);
	virtual void		setTextColor(const QColor& pColor);
	virtual void		setPixmap(const QPixmap& pPix);
	void				setDownPixmap(const QPixmap& pPix);
	void				setDisabledPixmap(const QPixmap& pPix);

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/

public:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/
protected:
	void				drawButton(QPainter *p);
	void				drawButtonLabel(QPainter *p);	

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/
	void				MaskButton(const QPixmap* pPixix);

public:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	QPixmap				*mUpPix;		/**< Pixmap to be displayed normally */
	QPixmap				*mDownPix;		/**< Pixmap when the button is pressed */
	QPixmap				*mDisabledPix;	/**< Pixmap when the button is disabled */
	QString				mText;			/**< Text to be displayed. */
	QColor				mTextColor;

private:
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
inline
QString ZPushButton::text() const
{
	return mText;
}

inline
const QColor& ZPushButton::textColor() const
{
	return mTextColor;
}

inline
const QPixmap* ZPushButton::pixmap() const
{
	return mUpPix;
}

inline
const QPixmap* ZPushButton::downPixmap() const
{
	return mDownPix;
}

inline
const QPixmap* ZPushButton::disabledPixmap() const
{
	return mDisabledPix;
}

/**
 *	Sets the text to be displayed centered on top of the pixmap for this button.
 */
inline
void ZPushButton::setText(const QString& s)
{
	mText = s;
}

inline
void ZPushButton::setTextColor(const QColor& pColor)
{
	mTextColor = pColor;
}


} // End Namespace

#endif // __ZPUSHBUTTON_H_INCLUDED__

/* vi: set ts=4: */
