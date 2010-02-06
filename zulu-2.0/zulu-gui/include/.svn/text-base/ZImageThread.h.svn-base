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
#if !defined(__ZIMAGETHREAD_H_INCLUDED__)
#define __ZIMAGETHREAD_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qvariant.h>
#include <qthread.h>
#include <qvaluelist.h>

/* Local Headers */
#include "ZImageRequest.h"

class QString;
class QWidget;

namespace ZOTO
{

typedef QValueList<ZImageRequest> ZRequestList;

/**
 *	@class		ZImageThread
 *
 *	@brief		Pixmap load processor
 *	@author		Josh Williams
 *	@version	0.1.0
 *	@date		01-Apr-2005
 *
 *	@remarks	Generates thumbnail sized pixmaps based on URI
 */
class ZImageThread : public QThread
{
public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZImageThread(QWidget *pParent);

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				LockQueue();
	void				UnlockQueue();
	void				AddRequest(ZULONG pID, const QString& pURI, int pWidth, int pHeight);
	void 				DataAvailable();
	virtual void		run();
	virtual void		Shutdown();

protected:
	/*==================================*
	 *             CALLBACKS			*
	 *==================================*/

private:
	/*==================================*
	 *			  INTERNALS				*
	 *==================================*/

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	ZRequestList		mRequests;		/**< list of currently pending requests */
	QWaitCondition		mThreadWait;	/**< semaphore to signal thread processing */
	QMutex				mListLock;		/**< thread protection for the request list */
	QWidget				*mParent;		/**< owner of this thread */
	bool				mShutdown;		/**< flag to signal thread termination */
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/

} // End Namespace

#endif // __ZIMAGETHREAD_H_INCLUDED__

/* vi: set ts=4: */
