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
#if !defined(__ZCATEGORYITEM_H_INCLUDED__)
#define __ZCATEGORYITEM_H_INCLUDED__

/* System Headers */

/* Local Headers */
#include "ZCategoryView.h"

/* Macros */

namespace ZOTO
{

/**
 *  @class      ZCategoryItem
 *  @brief      Item in the list of categories.
 *  @author     Josh williams
 *  @version    0.1.0
 */
class ZCategoryItem : public QCheckListItem
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZCategoryItem(QListViewItem *pParent, const QString& pText, int pID);
	~ZCategoryItem();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	int					GetID() const;

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/
	void				paintFocus(QPainter *pPainter, const QColorGroup& pColorGroup,
								const QRect &pRect);

protected:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	int					mID;
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/
/**
 *	Gets the category ID associated with this item.
 */
inline
int ZCategoryItem::GetID() const
{
	return mID;
}

/**
 *	Overridden so no decoration is applied to items on focus.
 */
inline
void ZCategoryItem::paintFocus(QPainter *pPainter, const QColorGroup& pColorGroup,
									const QRect& pRect)
{
	Q_UNUSED(pPainter);
	Q_UNUSED(pColorGroup);
	Q_UNUSED(pRect);
}

} // End Namespace

#endif // __ZCATEGORYITEM_H_INCLUDED__

/* vi: set ts=4: */
