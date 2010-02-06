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
#include "ZLog.h"

/* System Headers */
#include <cstdio>
#include <cstdarg>
#include <time.h>

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
ZLog::ZLog()
{
	mTraceOn	= false;
	mLogHandle	= NULL;
	mLogName	= "";
	mIndentLvl	= 0;
	mLogOpen	= false;
	mTimestamps = true;
}

ZLog::~ZLog()
{
	if (mLogOpen)
		fclose(mLogHandle);
	mLogHandle = NULL;
}

/********************************************************************
 *																	*
 *                        A T T R I B U T E S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *								GetLog()							*
 *------------------------------------------------------------------*/
/** @brief Returns a reference to an active log file.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS:                                                   *
 *  Date        Description                         Author          *
 *============  ==================================  =============== *
 *                                                                  *
 *------------------------------------------------------------------*/
ZLog& ZLog::GetLog()
{
	static ZLog vLog;

	return vLog;
}

/********************************************************************
 *																	*
 *                        O P E R A T I O N S                       *
 *																	*
 ********************************************************************/

/*------------------------------------------------------------------*
 *							 InitTrace()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Initializes the tracing facilities, such as setting
 *				the name of the log file and opening the log.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 *
 *	@param		pPgmName
 *					Name of the program.  Log name will  be based
 *					off this name.
 *
 *	@remarks	If tracing has not been enabled at build time, this
 *				function does nothing.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZLog::InitTrace(const char *pPgmName)
{
#ifdef TRACE_ENABLE
	char	vBuffer[256];
	char	*vPtr = NULL;
	time_t	vNow = time(NULL);

	if (mTraceOn)
		return; // Trace already initialized

	strncpy(vBuffer, pPgmName, 256);

	if ((vPtr = strstr(vBuffer, ".exe")) != NULL)
	{	/* found the .exe extension.  replace it with .log */
		strftime(vPtr, sizeof(vBuffer) - strlen(vBuffer), "_%m%d%Y_%H%M%S.log", localtime(&vNow));
	}
	else
	{	/* probably linux/mac.  just add .log */
		strftime(&vBuffer[strlen(vBuffer)], sizeof(vBuffer) - strlen(vBuffer),
				"_%m%d%Y_%H%M%S.log", localtime(&vNow));
	}
	
	mLogName = vBuffer;

	if (mLogOpen == false)
	{
		mLogHandle = fopen(mLogName.c_str(), "w");
		if (mLogHandle == NULL)
			return;
		else
		{
			memset(vBuffer, '\0', sizeof(vBuffer));
			strftime(vBuffer, sizeof(vBuffer), "*** Log Opened - %m/%d/%Y %H::%M::%S ***\n", localtime(&vNow));
			fprintf(mLogHandle, vBuffer);
			fflush(mLogHandle);
		}
	}
	mTraceOn = true;
#endif // TRACE_ENABLE
}

/*------------------------------------------------------------------*
 *							 Trace()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Constructs a suitable set of trace output based on
 *				the information provided.
 *
 *	@author		Josh Williams
 *	@date		02-Dec-2004
 *
 *	@param		pMsg
 *					Actual message to be output
 *
 *	@remarks	If tracing has not been enabled at runtime, this
 *				function does nothing.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
#ifdef TRACE_ENABLE
void ZLog::Trace(const char *pMsg, ...)
{
	static char		vBuffer[1024];
	static va_list	vArgs;

	/* If tracing wasn't initialized, do nothing */
	if (!mTraceOn)
		return;

	mLogLock.Lock();

	/* Construct the trace message */
	memset(vBuffer, '\0', sizeof(vBuffer));
	va_start(vArgs, pMsg);
	vsnprintf(vBuffer, sizeof(vBuffer)-1, pMsg, vArgs);
	va_end(vArgs);

	WriteRaw(vBuffer); // Send it to the parser

	mLogLock.Unlock();
}
#endif

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
 *							 WriteRaw()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Handles breaking a message up at line breaks and
 *				outputting each individual line.
 *
 *	@author		Josh Williams
 *	@date		09-Apr-2005
 *
 *	@param		pText
 *					Raw message to process
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 * 06-Jun-2005	Added runtime check for tracing.	Josh Williams	*
 *																	*
 *------------------------------------------------------------------*/
void ZLog::WriteRaw(const char *pText) const
{
	static const char	*vBufBeg;
	static const char	*vBufEnd;
	static int			vBufLen;
	static char			vText[1024];

	/* If tracing wasn't initialized, do nothing */
	if (!mTraceOn)
		return;

	vBufBeg = &pText[0];
	vBufEnd = strchr(pText, '\n');
	while (vBufEnd != NULL)
	{
		vBufLen = vBufEnd - vBufBeg + 1;
		memset(vText, '\0', sizeof(vText));
		memcpy(vText, vBufBeg, vBufLen);
		Write(vText);
		vBufBeg = vBufEnd+1;
		vBufEnd = strchr(vBufBeg, '\n');
	}
	if (*vBufBeg != '\0')
		Write(vBufBeg);

}

/*------------------------------------------------------------------*
 *							 	Write()								*
 *------------------------------------------------------------------*/
/**
 *	@brief		Actually writes output to the trace file.
 *
 *	@author		Josh Williams
 *	@date		09-Apr-2005
 *
 *	@param		pText
 *					Text to be written.
 *
 *	@remarks	If timestamps are enabled, they will be written
 *				first.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 * 06-Jun-2005	Added runtime check for tracing.	Josh Williams	*
 *																	*
 *------------------------------------------------------------------*/
void ZLog::Write(const char *pText) const
{
	time_t	vNow = time(NULL);
	char	vTime[50];
	
	/* If tracing wasn't initialized, do nothing */
	if (!mTraceOn)
		return;

	strftime(vTime, 50, "%F %H:%M:%S :: ", localtime(&vNow));
	fprintf(mLogHandle, vTime);
	for (int i = 0; i < mIndentLvl; i++)
		fprintf(mLogHandle, "   ");
	fprintf(mLogHandle, pText);
	fflush(mLogHandle);
}

} // End Namespace

/* vi: set ts=4: */
