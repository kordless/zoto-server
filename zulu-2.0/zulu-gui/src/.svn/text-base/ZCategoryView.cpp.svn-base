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
#include "ZCategoryView.h"

/* System Headers */
#include <qheader.h>
#include <qmessagebox.h>

/* Local Headers */
#include "ZClient.h"
#include "ZCategoryItem.h"
#include "ZUtils.h"
#include "ZPushButton.h"
#include "ZGuiApp.h"

/* Macros */

namespace ZOTO
{

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZCategoryView::ZCategoryView(QWidget *pParent /*=0*/, const char *pName /*=0*/)
	: QFrame(pParent, pName)
{
	QFont vFont(font());
	vFont.setFamily("Arial");
	vFont.setPointSize(10);
	vFont.setBold(TRUE);

	mListView = new QListView(this, "ListView");
	mListView->setFrameShape(QFrame::Panel);
	mListView->setFrameShadow(QFrame::Plain);
	mListView->setRootIsDecorated(true);
	mListView->setFont(vFont);
	mListView->addColumn(tr("Select The Categories For The Images To Be Uploaded"));
	mListView->setSelectionMode(QListView::NoSelection);
	mListView->header()->hide();

	mCatButton = new ZPushButton(this, "ButCats");
	mCatButton->move(5, 0);
    mCatButton->setEnabled(TRUE);
	mCatButton->setFont(vFont);
    mCatButton->setPixmap(QPixmap::fromMimeSource("green_up.png"));
    mCatButton->setDownPixmap( QPixmap::fromMimeSource("green_down.png"));
    mCatButton->setDisabledPixmap( QPixmap::fromMimeSource("green_disabled.png"));
    mCatButton->setText(tr("EDIT TAGS"));
	mCatButton->setTextColor(Qt::white);

	mListView->setSorting(-1);

	connect(mCatButton, SIGNAL(clicked()), this, SLOT(EditCategories()));
}

ZCategoryView::~ZCategoryView()
{

}

/********************************************************************
 *																	*
 *                        A T T R I B U T E S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *							GetSelectedCats()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Gets the list of category id's currently selected by
 *				the user.
 *	@author		Josh Williams
 *	@date		14-Aug-2005
 *
 *	@param		pCats
 *					List to be populated.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZCategoryView::GetSelectedCats(QValueList<int>& pCats)
{
	QListViewItemIterator vIt(mListView);

	ZCategoryItem *vItem;
	while (vIt.current())
	{
		vItem = static_cast<ZCategoryItem *>(vIt.current());
		if (vItem->parent() != 0)
		{
			if (vItem->isOn())
				pCats.append(vItem->GetID());
		}
		++vIt;
	}
}

/********************************************************************
 *																	*
 *                        O P E R A T I O N S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *							LoadCategories()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Loads the list of categories received from the ZAPI
 *				server into the view.
 *	@author		Josh Williams
 *	@date		23-Apr-2005
 *
 *	@param		pCats
 *					List of categories received.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZCategoryView::LoadCategories(const ZCatList& pCats)
{
	ZCatList::const_iterator vIt;
	ZCatInfo *vCat;
	mListView->clear();
	qDebug("%s::Loading categories.  Top level cats: %d", __FILE__, (int)pCats.size());
	for (vIt = pCats.begin(); vIt != pCats.end(); vIt++)
	{
		vCat = vIt->second;
		AddCategory(mListView, vCat, true);
	}

}

/*------------------------------------------------------------------*
 *							  AddCategory()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Actually adds an individual category to the correct
 *				location in the view.
 *	@author		Josh Williams
 *	@date		23-Apr-2005
 *
 *	@param		pParent
 *					View/item that is to be the parent of this tag.
 *	@param		pCat
 *					Category/tag to be added.
 *	@param		pTopLevel
 *					Whether this is one of the main cats (who, what, etc).
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZCategoryView::AddCategory(void *pParent, ZCatInfo *pCat, bool pTopLevel /*=false*/)
{
	QListViewItem *vItem;
	if (pTopLevel)
	{
		qDebug("%s::Adding new top-level category: %s", __FILE__, pCat->mName.c_str());
		vItem = new QListViewItem(static_cast<QListView *>(pParent), pCat->mName.c_str());
	}
	else
	{
		qDebug("%s::Adding child level category: %s", __FILE__, pCat->mName.c_str());
		vItem = new ZCategoryItem(static_cast<QListViewItem *>(pParent),
								pCat->mName.c_str(), pCat->mId);
		static_cast<QListViewItem *>(pParent)->sortChildItems(0, TRUE);
	}

	if (pCat->mSubCatCnt > 0)
	{
		qDebug("%s::Category %s has %d children", __FILE__, pCat->mName.c_str(), pCat->mSubCatCnt);
		ZCatList::iterator vIt;
		ZCatInfo *vCat;
		for (vIt = pCat->mSubs.begin(); vIt != pCat->mSubs.end(); vIt++)
		{
			vCat = vIt->second;
			AddCategory(vItem, vCat);
		}
	}
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
 *							 resizeEvent()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Overridden to allow the view to be resized when the
 *				main window is resized.
 *	@author		Josh Williams
 *	@date		23-Apr-2005
 *
 *	@param		pEvt
 *					Object that contains the new size information.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZCategoryView::resizeEvent(QResizeEvent *pEvt)
{
	int vTop = 30;
	int vHeight = pEvt->size().height() - vTop;
    mListView->setGeometry(QRect(0, vTop, pEvt->size().width(), vHeight));
}

/*------------------------------------------------------------------*
 *							EditCategories()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Launches the user's browser when the "Edit Tags" button
 *				is pressed.
 *	@author		Josh Williams
 *	@date		23-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZCategoryView::EditCategories()
{
	QString vStrURL;
	vStrURL.sprintf(ZOTO_CAT_URL, ZULU_GUI_APP()->GetUserName().latin1());
	qDebug("ZULU CAT URL => [%s]", vStrURL.latin1());
	ZUtils::OpenURL(this, vStrURL);
}

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

} // End Namespace

/* vi: set ts=4: */
