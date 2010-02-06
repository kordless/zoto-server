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
#if !defined(__ZCATEGORYVIEW_H_INCLUDED__)
#define __ZCATEGORYVIEW_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qframe.h>
#include <qlistview.h>

/* Local Headers */
#include "ZClient.h"

/* Macros */

namespace ZOTO
{

class ZPushButton;

/**
 *  @class      ZCategoryView
 *  @brief      Displays a list of categories for categorizing images at upload.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class ZCategoryView : public QFrame
{
	Q_OBJECT
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZCategoryView(QWidget *pParent = 0, const char *pName = 0);
	virtual ~ZCategoryView();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/
	QListView*			GetListView() const;
	void				GetSelectedCats(QValueList<int>& pCats);

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				LoadCategories(const ZCatList& pCats);
	void				AddCategory(void *pParent, ZCatInfo *pCat, bool pTopLevel = false);

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/

protected slots:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/
	void				resizeEvent(QResizeEvent *pEvt);
	void				EditCategories();

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	QListView			*mListView;
	ZPushButton			*mCatButton;
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/

/**
 *	Returns the QListView widget pointer.
 */
inline
QListView* ZCategoryView::GetListView() const
{
	return mListView;
}

} // End Namespace

#endif // __ZCATEGORYVIEW_H_INCLUDED__

/* vi: set ts=4: */
