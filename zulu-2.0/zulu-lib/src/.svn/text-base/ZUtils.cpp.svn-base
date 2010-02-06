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
#include "ZUtils.h"

/* System Headers */
#include <qwidget.h>
#include <qimage.h>
#include <qpixmap.h>
#include <qbitmap.h>
#if ZULU_PLATFORM == PLATFORM_WINDOWS
#include <windows.h>
#include <shellapi.h>
#endif

/* Local Headers */

/* Macros */

namespace ZOTO
{

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/

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
 *							 MaskWidget()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Attempts to create a bitmask for the supplied widget
 *              using the image specified.
 *
 *	@author		Josh Williams
 *	@date		22-Mar-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZUtils::MaskWidget(QWidget* pWidget, const QString& pImage)
{
	QPixmap vPix;
	QBitmap vBitmap;

	QImage vImg(QImage::fromMimeSource(pImage));
	vPix.convertFromImage(vImg);
	if (!vPix.mask())
	{
		if (vImg.hasAlphaBuffer())
		{
			vBitmap = vImg.createAlphaMask();
			vPix.setMask(vBitmap);
		}
		else
		{
			vBitmap = vImg.createHeuristicMask();
			vPix.setMask(vBitmap);
		}
	}
	if (vPix.mask())
		pWidget->setMask(*vPix.mask());
}

/*------------------------------------------------------------------*
 *							 OpenURL()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Requests that the operating system open the URL
 (				specified in the user's default browser.
 *
 *	@author		Josh Williams
 *	@date		23-Apr-2005
 *
 *	@param		pWidget
 *					Widget who's window ID is to own the browser.
 *	@param		pURL
 *					URL to be opened in the user's browser.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZUtils::OpenURL(QWidget *pWidget, const QString& pURL)
{
    WAIT_CURSOR_ON();

#if ZULU_PLATFORM == PLATFORM_WINDOWS
	ShellExecuteA(pWidget->winId(), "open", pURL.latin1(), NULL, NULL, SW_SHOW);
#elif ZULU_PLATFORM == PLATFORM_MAC
	Q_UNUSED(pWidget);
	std::string vString("open \"");
    vString += pURL.latin1();
    vString += "\"";
    system(vString.c_str());
#elif ZULU_PLATFORM == PLATFORM_LINUX
    // Assume we have KDE
	Q_UNUSED(pWidget);
	std::string vString("kfmclient exec \"");
    vString += pURL.latin1();
    vString += "\"";
    system(vString.c_str());
#else
#error Unsupported platform.
#endif

    WAIT_CURSOR_OFF();
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

