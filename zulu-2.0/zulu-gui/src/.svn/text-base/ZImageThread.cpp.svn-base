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
#include "ZImageThread.h"

/* System Headers */
#include <qimage.h>
#include <qapplication.h>
#ifdef ZULU_EXIF
#include <libexif/exif-data.h>
#include <libexif/exif-loader.h>
#endif

/* Local Headers */
#include "ZEvents.h"

namespace ZOTO
{

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZImageThread::ZImageThread(QWidget *parent)
{
	mParent = parent;
	mShutdown = false;
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
 *							LockQueue()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Obtains a mutually exclusive lock on the request
 *				queue.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2005
 *
 *	@remarks	Should be called prior to calling addRequest() or
 *				deleting items from the queue.  If unlockQueue() 
 *				is not called, the requests will never	will never
 *				be processed.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZImageThread::LockQueue()
{
	mListLock.lock();
}

/*------------------------------------------------------------------*
 *							UnlockQueue()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Releases the lock on the request queue.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZImageThread::UnlockQueue()
{
	mListLock.unlock();
}

/*------------------------------------------------------------------*
 *							AddRequest()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Adds a request to the list of images to be loaded.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2005
 *
 *  @param		pKey
 *  				Unique identifier for this request
 *  @param		pURI
 *  				Path to the image to be loaded
 *	@param		pWidth
 *					With of the finished thumbnail
 *	@param		pHeight
 *					Height of the finished thumbnail
 *
 *  @remarks	Prior to calling this function, lockQueue() should
 *				be called to obtain exclusive rights to the queue.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZImageThread::AddRequest(ZULONG pKey, const QString& pURI, int pWidth, int pHeight)
{
	ZImageRequest req(pKey, pURI, pWidth, pHeight);
	mRequests.append(req);
}

/*------------------------------------------------------------------*
 *							DataAvailable()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Notifies the processing thread that there is work
 *				to be done.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2005
 *
 *	@remarks	Should be called after addRequest().
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
void ZImageThread::DataAvailable()
{
	mThreadWait.wakeAll();
}

/*------------------------------------------------------------------*
 *								run()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Main processing loop.
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
void ZImageThread::run()
{
	ZRequestList::iterator	vIt;
	ZImageThreadEvent		*vEvt;
#ifdef ZULU_EXIF
	ExifData				*vEd;
#endif
	bool					vExifHasThumb;
	qDebug("%s::Thread started", __FILE__);
	for(;;)
	{
		qDebug("%s::Loop entered", __FILE__);
		/*
		 * Wait until we are notified to begin processing
		 */
		mThreadWait.wait();
		if (mShutdown)
			break;

		/*
		 * We've got data
		 */
		qDebug("%s::Data to process", __FILE__);
		vIt = mRequests.begin();
		QPixmap *vPix;
		while (vIt != mRequests.end())
		{
			vExifHasThumb = false;
			vPix = NULL;

#ifdef ZULU_EXIF
			/*
			 * try to obtain thumbnail from exif
			 */
			ExifLoader *vLoader = exif_loader_new();
			exif_loader_write_file(vLoader, (*vIt).GetURI().latin1());
			vEd = exif_loader_get_data(vLoader);
			exif_loader_unref(vLoader);
			if (vEd == NULL)
			{
				qDebug("%s::%s does not contain EXIF data!", __FILE__, (*vIt).GetURI().latin1());
			}
			else
			{
				qDebug("%s::%s has EXIF data!", __FILE__, (*vIt).GetURI().latin1());
				if (vEd->data != NULL)
				{
					QImage vTemp;
					if (vTemp.loadFromData(vEd->data, vEd->size) == false)
						qDebug("%s::Unable to load pixmap", __FILE__);
					else
					{
						vPix = new QPixmap(vTemp.smoothScale((*vIt).GetWidth(), (*vIt).GetHeight(), QImage::ScaleMin));
						if (vPix == NULL)
							qDebug("%s::Unable to create pixmap", __FILE__);
						else
							vExifHasThumb = true;
					}
				}
			}
#endif
			/*
			 * Create the thumbnail
			 */
			if (vExifHasThumb == false)
			{
				QString vURI = (*vIt).GetURI();
				qDebug("%s::Image format => [%s]", __FILE__, QImage::imageFormat(vURI));
				qDebug("%s::Loading image %s", __FILE__, (*vIt).GetURI().latin1());
				QImageIO vImgIO;
				vImgIO.setFileName(vURI);
				if (vImgIO.read() == false)
				{
					qDebug("%s::Unable to read image", __FILE__);
					continue;
				}

				vPix = new QPixmap(vImgIO.image().scale((*vIt).GetWidth() , (*vIt).GetHeight(), QImage::ScaleMin));
				if (vPix == NULL)
					qDebug("%s::Unable to create pixmap from image", __FILE__);
			}

			/*
			 * Create and send the notification event
			 */
			vEvt = new ZImageThreadEvent((*vIt).GetKey(), vPix);
			delete vPix;
			vPix = NULL;
			QApplication::postEvent(mParent, vEvt);

			/*
			 * Now remove this request from the queue
			 */
			mListLock.lock();
			vIt = mRequests.erase(vIt);
			mListLock.unlock();
		}
	}
	qDebug("%s::Thread exiting", __FILE__);
}

/*------------------------------------------------------------------*
 *								Shutdown()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Notifies the processing loop that it it time to 
 *				terminate.
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
void ZImageThread::Shutdown()
{
	mShutdown = true;
	mThreadWait.wakeAll();
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

/********************************************************************
 *																	*
 *                          I N T E R N A L S                       *
 *																	*
 ********************************************************************/

} // End Namespace

/* vi: set ts=4: */
