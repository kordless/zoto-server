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
#if !defined(__ZIMAGEVIEWITEM_H_INCLUDED__)
#define __ZIMAGEVIEWITEM_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qiconview.h>
#include <qfileinfo.h>

/* Local Headers */
#include "ZTypes.h"

namespace ZOTO
{

/**
 *  @class      ZImageViewItem
 *  @brief      Handles drawing of an image selected for upload in the view.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class ZImageViewItem : public QIconViewItem
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZImageViewItem(QIconView *pParent, const QString& pURI, int pID);
	virtual ~ZImageViewItem();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	int					GetWidth() const;
	int					GetHeight() const;
	long				GetSize() const;
	const QString		GetPath() const;
	const QString&		GetText() const;
	QPixmap*			pixmap() const;
	int					GetID() const;
	ZULONG				GetKey() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				setPixmap(const QPixmap& pIcon);
	void				setText(const QString& pText);
	void				SetKey(ZULONG pKey);

protected:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/
	virtual void		paintItem(QPainter *pPainter, const QColorGroup& pCg);
	virtual void		paintFocus(QPainter *pPainter, const QColorGroup& pCg);
	virtual void		calcRect(const QString& pText);
	void				dropped(QDropEvent *pEvt, const QValueList<QIconDragItem>& pList);

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/
	void				UpdateItemRect();

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	int     			mImageWidth;	/**< width of the actual image */
	int     			mImageHeight;	/**< height of the actual image */
	int					mThumbWidth;	/**< image thumbnail width */
	int					mThumbHeight;	/**< image thumbnail height */
	static int			mBorderWidth;	/**< full width of the border */
	QFileInfo   		mFileInfo;		/**< information about the current file */
	QPixmap				*mThumb;		/**< current thumbnail */
	int					mID;			/**< unique identifier of this icon */
	QString				mText;			/**< Text for this icon */
	ZULONG				mKey;			/**< Hashed/XOR'd key for this file */
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
inline
int ZImageViewItem::GetWidth() const
{
	return mImageWidth;
}

inline
int ZImageViewItem::GetHeight() const
{
	return mImageHeight;
}

inline
long ZImageViewItem::GetSize() const
{
	return mFileInfo.size();
}

inline
const QString ZImageViewItem::GetPath() const
{
	return QString(mFileInfo.absFilePath());
}

inline
const QString& ZImageViewItem::GetText() const
{
	return mText;
}

inline
QPixmap* ZImageViewItem::pixmap() const
{
	return mThumb;
}

inline
int ZImageViewItem::GetID() const
{
	return mID;
}

inline
ZULONG ZImageViewItem::GetKey() const
{
	return mKey;
}

inline
void ZImageViewItem::SetKey(ZULONG pKey)
{
	mKey = pKey;
}

inline
void ZImageViewItem::paintFocus(QPainter *pPainter, const QColorGroup& pCg)
{
	Q_UNUSED(pPainter);
	Q_UNUSED(pCg);
}

} // End Namespace

#endif // __ZIMAGEVIEWITEM_H_INCLUDED__

/* vi: set ts=4: */

