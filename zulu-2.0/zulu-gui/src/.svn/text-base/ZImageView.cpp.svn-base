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
#include "ZImageView.h"

/* System Headers */
#include <qmessagebox.h>
#include <qimage.h>
#include <qpopupmenu.h>
#include <qpainter.h>
#include <qapplication.h>

/* Local Headers */
#include "ZGuiApp.h"
#include "ZClient.h"
#include "ZImageViewItem.h"
#include "ZImageThread.h"
#include "ZEvents.h"
#include "ZMD5Hasher.h"
#include "ZUtils.h"

namespace ZOTO
{

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZImageView::ZImageView( QWidget *pParent, const char *pName, WFlags pFlags )
	: QIconView( pParent, pName, pFlags ), mThread(NULL)
{
	mDefaultPix = new QPixmap(QPixmap::fromMimeSource("loading.png"));

	connect(this, SIGNAL( dropped(QDropEvent *, const QValueList<QIconDragItem>&) ),
			this, SLOT( dropEvent(QDropEvent *, const QValueList<QIconDragItem>&) ) );
    connect(this, SIGNAL( contextMenuRequested(QIconViewItem*,const QPoint&) ),
			this, SLOT( drawPopupMenu(QIconViewItem*,const QPoint&) ));
	this->setResizeMode(Adjust);
	this->setBackgroundMode(Qt::NoBackground);
	mThread = new ZImageThread(this);
	mThread->start();
}

ZImageView::~ZImageView()
{
	mThread->Shutdown();
	mThread->wait();
	delete mThread;
	delete mDefaultPix;
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
 *								FindByID()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Attempts to locate the item based on the supplied
 *				unique identifier.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2005
 *
 *	@param		pID
 *					Unique identifier to search for
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZImageViewItem*	ZImageView::FindByKey(ZULONG pKey)
{
	ZImageViewItem *vIvi, *vRet = NULL;
	vIvi = static_cast<ZImageViewItem *>(firstItem());
	while (vIvi)
	{
		if (vIvi->GetKey() == pKey)
		{
			vRet = vIvi;
			break;
		}
		vIvi = static_cast<ZImageViewItem*>(vIvi->nextItem());
	}
	return vRet;
}

/*------------------------------------------------------------------*
 *								AddFiles()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Populates the image view with the supplied list of
 *				images.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2005
 *
 *	@param		pFiles
 *					List of URI's to be used
 *
 *	@remarks	Filters out any non-images and informs the user
 *				upon completion.  All icons are initially drawn with
 *				a standard pixmap until the image thread can create
 *				an appropriate thumbnail.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZImageView::AddFile(const ZFileInfo& pFile)
{
	QFileInfo		vFileInfo;
	ZImageViewItem	*vIvi;
	QStringList		vInvalid;

	/*
	 * Lock the thread's queue
	 */
	mThread->LockQueue();
	qDebug("%s::queue locked", __FILE__);
	vIvi = new ZImageViewItem(this, pFile.mName, pFile.mKey);
	vIvi->setPixmap(*mDefaultPix); // stock "Loading..." pixmap
	int vPixW = GetThumbWidth() - (GetBorderWidth() * 2);
	int vPixH = GetThumbHeight() - (GetBorderWidth() * 2);
	vIvi->SetKey(pFile.mKey);
	repaintItem(vIvi);
	//repaintContents(true);
	ZULU_GUI_APP()->processEvents();
	/*
	 * Ask the worker thread to load this pixmap
	 */
	mThread->AddRequest(pFile.mKey, pFile.mName, vPixW, vPixH);

	/*
	 * Unlock the queue
	 */
	mThread->UnlockQueue();

	mThread->DataAvailable();
}

void ZImageView::RemoveFile(ZULONG pFile)
{
	ZImageViewItem *vIvi = FindByKey(pFile);
	if (vIvi != NULL)
	{
		delete vIvi;
	}
	arrangeItemsInGrid();
	updateContents();
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
 *								dropEvent()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Called when the user drags a file and drops it onto
 *				the view.
 *
 *	@author		Josh Williams
 *	@date		02-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZImageView::dropEvent(QDropEvent *pEvt, const QValueList<QIconDragItem>& pList)
{
    QStringList vFileNames;
	QStringList::iterator vIt;
	Q_UNUSED(pList);

	WAIT_CURSOR_ON();
	if (QUriDrag::decodeLocalFiles(pEvt, vFileNames))
	{
		for (vIt = vFileNames.begin(); vIt != vFileNames.end(); vIt++)
		{
			qDebug("%s::Dropped file %s", __FILE__, (*vIt).latin1());
			ZULU_GUI_APP()->AddFile((*vIt));
		}
	}
	WAIT_CURSOR_OFF();
}

/*------------------------------------------------------------------*
 *							keyPressEvent()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Overridden to intercept delete key presses for removing
 *				images from the view.
 *
 *	@author		Josh Williams
 *	@date		26-Apr-2005
 *
 *	@param		pEvt
 *					The actual event.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZImageView::keyPressEvent(QKeyEvent *pEvt)
{
	if (pEvt->key() == Qt::Key_Delete)
	{
		DeleteSelectedItems();
	}
	else
		pEvt->ignore();
}

/*------------------------------------------------------------------*
 *						contentsMouseReleaseEvent()					*
 *------------------------------------------------------------------*/
/**
 *	@brief		Overridden so right-mouse button clicks do not alter
 *				image selection.
 *
 *	@author		Josh Williams
 *	@date		26-Apr-2005
 *
 *	@param		pEvt
 *					The actual event.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZImageView::contentsMouseReleaseEvent(QMouseEvent *pEvt)
{
	if (pEvt->button() == LeftButton)
		QIconView::contentsMouseReleaseEvent(pEvt);
}


/*------------------------------------------------------------------*
 *							drawPopupMenu()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Signaled when the user right-clicks on an image.
 *
 *	@author		Josh Williams
 *	@date		02-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZImageView::drawPopupMenu(QIconViewItem *pItem, const QPoint& pPos)
{
	ZImageViewItem *vIvi;
	if (pItem != NULL)
	{		
		if ((vIvi = static_cast<ZImageViewItem *>(pItem)) != NULL)
		{
			QPopupMenu vPopup(this);
			vPopup.insertItem(tr("Remove"), this, SLOT(DeleteSelectedItems()) );
			vPopup.exec(pPos);
		}
	}
}

/*------------------------------------------------------------------*
 *						deleteSelectedItems()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Removes all selected items from the view.
 *
 *	@author		Josh Williams
 *	@date		02-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZImageView::DeleteSelectedItems()
{
	ZImageViewItem *vIvi;
	ZImageViewItem *vDel;

	vIvi = static_cast<ZImageViewItem *>(this->firstItem());

	while (vIvi)
	{
		if (vIvi->isSelected())
		{
			vDel = vIvi;
			vIvi = static_cast<ZImageViewItem *>(vIvi->nextItem());
			ZULU_GUI_APP()->RemoveFile(vDel->GetKey());
		}
		else
			vIvi = static_cast<ZImageViewItem *>(vIvi->nextItem());
	}
}

/*------------------------------------------------------------------*
 *							drawContents()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Overridden to allow drawing of the hint text:
 *				"Drop Images Here".
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
void ZImageView::drawContents(QPainter *pPainter, int pClipX, int pClipY, int pClipW, int pClipH)
{
	/*
	 * Call the base class's paint
	 */
	QIconView::drawContents(pPainter, pClipX, pClipY, pClipW, pClipH);

	/*
	 * If there are no items in the view, draw the hint text
	 */
	if (count() <= 0)
	{
		QPainter vPaint(this->viewport());
		vPaint.setFont(mHintFont);
		vPaint.setPen(mHintColor);
		vPaint.drawText(rect(), AlignCenter, mHintText);
	}
}

/*------------------------------------------------------------------*
 *							resizeEvent()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Overridden to force redrawing of hint text on window
 *				resize so the text is centered.
 *
 *	@author		Josh Williams
 *	@date		26-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZImageView::resizeEvent(QResizeEvent *pEvt)
{
	QIconView::resizeEvent(pEvt);
	if (count() <= 0)
		viewport()->update();
}

/*------------------------------------------------------------------*
 *							customEvent()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Handles Zoto defined window events.
 *
 *	@author		Josh Williams
 *	@date		02-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZImageView::customEvent(QCustomEvent *pEvt)
{
	if (pEvt->type() == ZIMAGELOAD)
	{
		/*
		 * This is a notification from the image thread
		 */
		ZImageThreadEvent *pImgEvt = static_cast<ZImageThreadEvent *>(pEvt);
		ZULONG vKey = pImgEvt->Key();
		QPixmap *vPix = pImgEvt->Pixmap();

		/*
		 * Try and find this item in the view
		 */
		ZImageViewItem *vIvi = FindByKey(vKey);
		if (vIvi != NULL)
		{
			qDebug("%s::Received pix update for icon %ld", __FILE__, vKey);
			if (vPix == NULL)
				qDebug("%s::pixmap is null!", __FILE__);
			vIvi->setPixmap(*vPix);
			repaintItem(vIvi);
			ZULU_GUI_APP()->processEvents();
			//repaintContents(true);
		}
	}
}

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

} // End Namespace

/* vi: set ts=4: */
