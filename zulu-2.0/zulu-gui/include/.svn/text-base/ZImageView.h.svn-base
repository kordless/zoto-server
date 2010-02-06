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
#if !defined(__ZIMAGEVIEW_H_INCLUDED__)
#define __ZIMAGEVIEW_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qiconview.h>
#include <qvaluelist.h>
#include <qwidgetplugin.h>

/* Local Headers */
#include "ZTypes.h"
#include "ZGuiApp.h"

#ifndef ZIMAGEVIEW_IS_PLUGIN
#undef QT_WIDGET_PLUGIN_EXPORT
#define QT_WIDGET_PLUGIN_EXPORT
#endif

namespace ZOTO
{

class ZImageViewItem;
class ZImageThread;

/**
 *  @class      ZImageView
 *  @brief      Widget to allow the user to select images for upload
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class QT_WIDGET_PLUGIN_EXPORT ZImageView : public QIconView
{
	Q_OBJECT

	Q_PROPERTY( int borderWidth READ GetBorderWidth WRITE SetBorderWidth )
	Q_PROPERTY( QColor hintColor READ GetHintColor WRITE SetHintColor )
	Q_PROPERTY( QColor borderColor READ GetBorderColor WRITE SetBorderColor )
	Q_PROPERTY( QColor selectedColor READ GetSelectedColor WRITE SetSelectedColor )
	Q_PROPERTY( QString hintText READ GetHintText WRITE SetHintText )
	Q_PROPERTY( QFont hintFont READ GetHintFont WRITE SetHintFont )

public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZImageView(QWidget *pParent = 0, const char *pName = 0, WFlags pFlags = 0);
	virtual ~ZImageView();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	int					GetThumbWidth() const;
	int					GetThumbHeight() const;
	int					GetBorderWidth() const;
	const QColor&		GetHintColor() const;
	const QColor&		GetBorderColor() const;
	const QColor&		GetSelectedColor() const;
	const QString&		GetHintText() const;
	const QFont&		GetHintFont() const;


public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void 				SetBorderWidth(int b);
	void				SetHintColor(const QColor& c);
	void				SetBorderColor(const QColor& c);
	void				SetSelectedColor(const QColor& c);
	void				SetHintText(const QString& t);
	void				SetHintFont(const QFont& f);
	ZImageViewItem*		FindByKey(ZULONG pKey);
	void				AddFile(const ZFileInfo& pFile);
	void				RemoveFile(ZULONG pFile);


public slots:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/
	void				resizeEvent(QResizeEvent *pEvt);
	void				dropEvent(QDropEvent * e, const QValueList<QIconDragItem> & lst);
	void				keyPressEvent(QKeyEvent * e);
	void				contentsMouseReleaseEvent(QMouseEvent *pEvt);
	void				drawPopupMenu(QIconViewItem *item, const QPoint& pos);
	void				DeleteSelectedItems();

protected:
	virtual void		drawContents(QPainter * p, int clipx, int clipy, int clipw, int cliph);
	virtual void		customEvent(QCustomEvent *evt);

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	int					mBorderWidth;	/**< width of the thumbnail border */
	QColor				mHintColor;		/**< color for "Drag Images Here" */
	QColor				mBorderColor;	/**< normal color for the thumbnail border */
	QColor				mSelColor;		/**< color for the thumbnail border when selected */
	QString				mHintText;		/**< Text for the help ("Drag Images Here") */
	QFont				mHintFont;		/**< Font for the help text */
	ZImageThread		*mThread;		/**< thread for handling image loading */
	QPixmap				*mDefaultPix;	/**< default pixmap to use for icons */
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
inline
int ZImageView::GetThumbWidth() const
{
	return gridX() - (spacing() * 2);
}

inline
int ZImageView::GetThumbHeight() const
{
	return gridY() - (spacing() * 2);
}

inline
int ZImageView::GetBorderWidth() const
{
	return mBorderWidth;
}

inline
const QColor& ZImageView::GetHintColor() const
{
	return mHintColor;
}

inline
const QColor& ZImageView::GetBorderColor() const
{
	return mBorderColor;
}

inline
const QColor& ZImageView::GetSelectedColor() const
{
	return mSelColor;
}

inline
const QString& ZImageView::GetHintText() const
{
	return mHintText;
}

inline
const QFont& ZImageView::GetHintFont() const
{
	return mHintFont;
}

inline
void ZImageView::SetBorderWidth(int b)
{
	mBorderWidth = b;
}

inline
void ZImageView::SetHintColor(const QColor& c)
{
	mHintColor = c;
}

inline
void ZImageView::SetBorderColor(const QColor& c)
{
	mBorderColor = c;
}

inline
void ZImageView::SetSelectedColor(const QColor& c)
{
	mSelColor = c;
}

inline
void ZImageView::SetHintText(const QString& t)
{
	mHintText = t;
}

inline
void ZImageView::SetHintFont(const QFont& f)
{
	mHintFont = f;
}

} // End Namespace

#endif // __ZIMAGEVIEW_H_INCLUDED__

/* vi: set ts=4: */
