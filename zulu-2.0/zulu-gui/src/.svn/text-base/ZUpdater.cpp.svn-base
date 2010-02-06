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
#include "ZUpdater.h"

/* System Headers */
#include <qfile.h>

/* Local Headers */
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
ZUpdater::ZUpdater(QWidget *pParent /*=0*/, const char *pName /*=0*/, bool pModal /*=FALSE*/,
				   	WFlags pFlags /*=0*/)
	: QProgressDialog(pParent, pName, pModal, pFlags), mContentLength(0), mBytesReceived(0)
{
	memset(mHeader, 0, sizeof(mHeader));
	hide();
	setCaption(ZULU_GUI_APP()->GetAppName());
	setMinimumDuration(0);
}

ZUpdater::~ZUpdater()
{
	mSock.Close();
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
 *						  DownloadAndInstall()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Downloads a new installer from the Zoto web site and
 *				launches it.
 *
 *	@author		Josh Williams
 *	@date		27-Jun-2005
 *
 *	@param		pHost
 *					Host name to connect to.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
bool ZUpdater::Download(const char *pHost, QString& pFile, bool pShowProgress /*=true*/)
{
	char	vCommand[1024];
	char	vData[1024];
	int		vSize = sizeof(vData);
	
	sprintf(vCommand, "GET /downloads/current.php?platform=windows HTTP/1.0\r\n"
						"User-Agent: Zoto Uploader\r\n\r\n");

	if (pShowProgress)
		show();

	qDebug(vCommand);
	setLabelText("Connecting...");
		qApp->processEvents();
	if (InitializeAndConnect(pHost) != true)
		return false;

	setLabelText("Handshaking...");
		qApp->processEvents();
	if (mSock.Send(vCommand, strlen(vCommand)) != ZERR_SUCCESS)
	{
		qDebug("Unable to send stuff.\n");
		mSock.Close();
		return false;
	}

	if (ReceiveHeader(vData, vSize) != true)
	{
		qDebug("Unable to receive header.\n");
		mSock.Close();
		return false;
	}

	QString vText;
	vText.sprintf("Downloading %s", mFileName);
	setLabelText(vText);
		qApp->processEvents();
	if (ReceiveFile(vData, vSize) != true)
	{
		qDebug("Unable to receive file.\n");
		mSock.Close();
		return false;
	}

	if (wasCancelled() == true)
	{
		return false;
	}

	pFile = mOutFileName;

	mSock.Close();
	return true;
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

/*------------------------------------------------------------------*
 *						   InitializeAndConnect()					*
 *------------------------------------------------------------------*/
/**
 *	@brief		Creates the socket object and attempts to connect to
 *				the Zoto web site.
 *
 *	@author		Josh Williams
 *	@date		27-Jun-2005
 *
 *	@param		pHost
 *					Name/IP of the zoto web host to connect to.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
bool ZUpdater::InitializeAndConnect(const char *pHost)
{
	if (mSock.Create(0, SOCK_STREAM) != ZERR_SUCCESS)
	{
		qDebug("Unable to create socket\n");
		return false;
	}

	if (mSock.Connect(pHost, 80, 10) != ZERR_SUCCESS)
	{
		qDebug("Unable to connect to host.\n");
		return false;
	}

	return true;
}

/*------------------------------------------------------------------*
 *							 ReceiveHeader()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Attempts to receive the HTTP header from the Zoto web
 *				server.
 *
 *	@author		Josh Williams
 *	@date		27-Jun-2005
 *
 *	@param		pData
 *					Raw data buffer that, once the full header has been
 *					received, should contain the first few bytes of raw
 *					file data.
 *	@param		pLength
 *					Size of the pData buffer.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
bool ZUpdater::ReceiveHeader(char *pData, int& pLength)
{
	bool	vReceivingHeader = true;
	int		vSize = pLength;
	int		vHeaderLength;
	char	vField[256];
	int		vCode = 0;

	while (vReceivingHeader)
	{
		if (mSock.Receive(pData, vSize, 10) != ZERR_SUCCESS)
		{
			qDebug("Unable to receive header.\n");
			mSock.Close();
			return false;
		}

		if (IsCompleteHeader(pData, vHeaderLength))
		{
			memset(vField, '\0', sizeof(vField));
			strncpy(mHeader, pData, vHeaderLength);
			qDebug("--- HEADER ---\n");
			qDebug(mHeader);
			qDebug("--------------\n");
			if (GetResponseCode(vCode) == true)
			{
				qDebug("Response code => [%d]\n", vCode);
				if (vCode != 200)
				{
					qDebug("Received invalid response from server\n");
					return false;
				}
			}
			else
			{
				qDebug("Unable to find response code in HTTP header\n");
				return false;
			}

			if (GetHeaderField("Content-Length", vField) != -1)
			{
				qDebug("Conent-Length => [%s]\n", vField);
				mContentLength = atol(vField);
			}
			else
				return false;

			memset(mFileName, '\0', sizeof(mFileName));
			if (GetHeaderField("Content-Location", mFileName) != -1)
			{
				qDebug("File name => [%s]\n", mFileName);
			}
			else
			{
				qDebug("Unable to retrieve file name.\n");
				strcpy(mFileName, "foo.exe");
			}
			qDebug("--- HEADER ---\n");
			qDebug(mHeader);
			qDebug("--------------\n");
			memcpy(pData, pData+vHeaderLength, vSize - vHeaderLength);
			pLength = vSize - vHeaderLength;
			vReceivingHeader = false;
		}
	}
	return true;
}

/*------------------------------------------------------------------*
 *							 ReceiveFile()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Receives the raw file data from the Zoto web server.
 *
 *	@author		Josh Williams
 *	@date		27-Jun-2005
 *
 *	@param		pData
 *					Buffer that contains the first few bytes received
 *					with the HTTP header.
 *	@param		pLength
 *					Number of bytes contained in pData.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
bool ZUpdater::ReceiveFile(const char *pData, int& pLength)
{
	QFile	vOutputFile;
	char	vBuffer[1024];
	int		vSize = 0;
	char	*vTempPath;

	vTempPath = getenv("TEMP");
	if (vTempPath != NULL)
		sprintf(mOutFileName, "%s\\%s", vTempPath, mFileName);
	else
		sprintf(mOutFileName, "C:\\", mFileName);

	vOutputFile.setName(mOutFileName);

	if (vOutputFile.open(IO_WriteOnly) != true)
	{
		qDebug("Unable to open file");
		return false;
	}

	mBytesReceived = pLength;
	setTotalSteps(mContentLength);
	setProgress(mBytesReceived);

	vOutputFile.writeBlock(pData, pLength);

	while (mBytesReceived < mContentLength && wasCancelled() == false)
	{
		vSize = sizeof(vBuffer);
		memset(vBuffer, '\0', vSize);
		
		if (mSock.Receive(vBuffer, vSize, 10) != ZERR_SUCCESS)
		{
			qDebug("Unable to receive data\n");
			mSock.Close();
			return false;
		}
		qDebug("Writing %d bytes to file", vSize);
		vOutputFile.writeBlock(vBuffer, vSize);
		mBytesReceived += vSize;
		setProgress(mBytesReceived);
		qApp->processEvents();
	}

	vOutputFile.close();

	return true;
}

/*------------------------------------------------------------------*
 *							 IsCompleteHeader()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Determines if the full HTTP header has been received
 *				from the server.
 *
 *	@author		Josh Williams
 *	@date		27-Jun-2005
 *
 *	@param		pData
 *					Data buffer received from the socket.
 *	@param		pSize
 *					Number of bytes in pData.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
bool ZUpdater::IsCompleteHeader(const char *pData, int& pSize)
{
	char *vPc;
	if ((vPc = strstr(pData, "\r\n\r\n")) == NULL)
		return false;
	else
	{
		pSize = vPc - pData + 4;
		qDebug("pSize => [%d]\n", pSize);
		return true;
	}
}

/*------------------------------------------------------------------*
 *							GetResponseCode()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Attempts to extract the HTTP response code from the
 *				HTTP header received from the server.
 *
 *	@author		Josh Williams
 *	@date		27-Jun-2005
 *
 *	@param		pCode
 *					Reference to hold the response code.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
bool ZUpdater::GetResponseCode(int& pCode)
{
	char	vFirstLine[256];
	char	vCode[30];
	char	*vPc = NULL;

	vPc = strchr(mHeader, '\r');
	if (vPc != NULL)
	{
		memset(vFirstLine, '\0', sizeof(vFirstLine));
		strncpy(vFirstLine, mHeader, vPc - mHeader);
		qDebug("First line => [%s]\n", vFirstLine);
		vPc = strchr(vFirstLine, ' ');
		if (vPc != NULL)
		{
			while (*vPc == ' ')
				vPc++;
			strcpy(vCode, vPc);
			vPc = strchr(vCode, ' ');
			if (vPc != NULL)
				*vPc = '\0';

			pCode = atoi(vCode);
			return true;
		}
	}

	return false;
}

/*------------------------------------------------------------------*
 *							GetHeaderField()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Attempts to extract of a field from the HTTP header.
 *
 *	@author		Josh Williams
 *	@date		27-Jun-2005
 *
 *	@param		pField
 *					Name of the field to retrieve the value for.
 *	@param		pValue
 *					Value returned, if available.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
int ZUpdater::GetHeaderField(const char *pField, char pValue[])
{
	char vBuffer[1024];

	memset(vBuffer, '\0', sizeof(vBuffer));

	char *vPc = strstr(mHeader, pField);
	if (vPc != NULL)
	{
		strcpy(vBuffer, vPc);
		vPc = strstr(vBuffer, "\r\n");
		if (vPc != NULL)
			*vPc = '\0';
		else
			return -1;

		vPc = strchr(vBuffer, ':');
		if (vPc != NULL)
		{
			vPc++;
			while (*vPc == ' ')
				vPc++;
			memcpy(pValue, vPc, strlen(vPc));
			return strlen(pValue);
		}
		else
			return -1;
	}
	else
		return -1;
}

} // End Namespace

/* vi: set ts=4: */
