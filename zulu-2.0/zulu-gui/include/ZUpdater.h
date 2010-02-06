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
#if !defined(__ZUPDATER_H_INCLUDED__)
#define __ZUPDATER_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <qprogressdialog.h>

/* Local Headers */
#include "ZGlobals.h"
#include "ZSocket.h"

/* Macros */

namespace ZOTO
{

/**
 *  @class      ZUpdater
 *  @brief      Downloads in initiates the install of a new Zulu version.
 *  @author     Josh Williams
 *  @version    0.1.0
 */
class ZUpdater : public QProgressDialog
{
	Q_OBJECT

public:
	/*==================================*
	 *	   CONSTRUCTION/DESTRUCTION		*
	 *==================================*/
	ZUpdater(QWidget *pParent = 0, const char *pName = 0, bool pModal = FALSE, WFlags pFlags = 0);
	virtual ~ZUpdater();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/

public:
	/*==================================*
	 *			  OPERATIONS			*
	 *==================================*/
	//bool				DownloadAndInstall(const char *pHost, bool pForced = true);
	bool				Download(const char *pHost, QString& pFile, bool pShowProgress = true);

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/

protected:
	/*==================================*
	 *			   CALLBACKS			*
	 *==================================*/

private:
	/*==================================*
	 *			   INTERNALS			*
	 *==================================*/
	bool				InitializeAndConnect(const char *pHost);
	bool				ReceiveHeader(char *pData, int& pLength);
	bool				ReceiveFile(const char *pData, int& pLength);
	bool				IsCompleteHeader(const char *pData, int& pSize);
	bool				GetResponseCode(int& pCode);
	int					GetHeaderField(const char *pField, char pValue[]);

private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
	long				mContentLength;
	long				mBytesReceived;
	ZSocket				mSock;
	char				mHeader[1024];
	char				mFileName[256];
	char				mOutFileName[256];
	QProgressDialog		*mProgress;
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/

} // End Namespace

#endif // __FILE_H_INCLUDED__

