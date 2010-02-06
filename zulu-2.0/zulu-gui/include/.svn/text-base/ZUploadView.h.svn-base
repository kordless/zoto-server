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
#if !defined(__ZUPLOADVIEW_H_INCLUDED__)
#define __ZUPLOADVIEW_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qframe.h>
#include <qvaluelist.h>

/* Local Headers */
#include "ZImageViewItem.h"
#include "ZGuiApp.h"

/* Macros */

class QLabel;
class QBoxLayout;
class QVBoxLayout;

namespace ZOTO
{

class ZProgressBar;

class ZUploadReq
{
public:
	int				mId;
	ZImageViewItem *mIvi;
};

//typedef QValueList<ZUploadReq> ZUploadList;
typedef QValueList<int> ZCatIDList;

/**
 *  @class      ZUploadView
 *  @brief      Displays upload progress information.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class ZUploadView : public QFrame
{
	Q_OBJECT

public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZUploadView(QWidget* pParent = 0, const char *pName = 0);
	virtual ~ZUploadView();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	void				Reset(int pFiles);
	void				SwitchFile(const ZFileInfo& pFile, int pIdx);
	void				SetProgress(ZUINT pFile, ZUINT pTotal);

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/

protected slots:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/
	void				AddItemCentered(QBoxLayout *pLayout, QWidget* pWidget);
	void				UpdateProgressText();

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	int					mTotalFiles;	/**< Total number of files queued for upload */
	int					mCurrentFile;	/**< Index of the file currently being uploaded */
	QVBoxLayout			*mMainLayout;
	QLabel				*mPixThumb;
	ZProgressBar		*mPrgCurrent;
	QLabel				*mLblOverall;
	QLabel				*mLblFileCount;
	ZProgressBar		*mPrgTotal;
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/


} // End Namespace

#endif // __ZUPLOADVIEW_H_INCLUDED__

/* vi: set ts=4: */
