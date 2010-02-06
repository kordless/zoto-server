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
#if !defined(__ZEVENTS_H_INCLUDED__)
#define __ZEVENTS_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qevent.h>
#include <qpixmap.h>

/* Local Headers */
#include "ZTypes.h"

/* Macros */
#define ZIMAGELOAD 	65432
#define ZSHELLDROP	ZIMAGELOAD+1
#define ZIMAGEDROP	ZIMAGELOAD+2
#define ZSP			ZIMAGELOAD+3
#define ZUPLOAD		ZIMAGELOAD+4

// Sent by the Image thread when it has loaded a pixmap
class ZImageThreadEvent : public QCustomEvent
{
public:
	ZImageThreadEvent(ZULONG pKey, QPixmap *pPix)
		: QCustomEvent(ZIMAGELOAD), mKey(pKey)
	{
		mPixmap = NULL;
		mPixmap = new QPixmap(*pPix);
	}
	virtual ~ZImageThreadEvent()
	{
		if (mPixmap != NULL)
			delete mPixmap;
	}

public:
	QPixmap*		Pixmap() const { return mPixmap; }
	ZULONG			Key() const { return mKey; }

private:
	ZULONG			mKey;
	QPixmap*		mPixmap;
};

//===================================================

// Sent by ZApp when it receives a shell notification
class ZShellDropEvent : public QCustomEvent
{
public:
	ZShellDropEvent() : QCustomEvent(ZSHELLDROP) {}
	virtual ~ZShellDropEvent() {}
};

//====================================================

// Sent by the Image view when items are added/removed
class ZImageDropEvent : public QCustomEvent
{
public:
	ZImageDropEvent(int pCount)
		: QCustomEvent(ZIMAGEDROP), mCount(pCount) {}
	virtual ~ZImageDropEvent() {}
public:
	int				mCount;
};

//====================================================

// Sent by the client library
class ZSPEvent : public QCustomEvent
{
public:
	ZSPEvent() : QCustomEvent(ZSP) {}
	virtual ~ZSPEvent() {}
public:
	QString			mFile;
	QString			mName;
	bool			mTemp;
	ZULONG			mSize;
	int				mID;
	char			mMD5[33];
	int				mStatus;
	double			mProgress;
	long			mBytes;
	ZRESULT			mErrcode;
};

// Sent by the upload view to notify file progress
class ZUploadEvent : public QCustomEvent
{
public:
	ZUploadEvent() : QCustomEvent(ZUPLOAD) {}
	virtual ~ZUploadEvent() {}
public:
	ZULONG	mKey;
	bool	bSuccess;
};

#endif // __ZEVENTS_H_INCLUDED__
