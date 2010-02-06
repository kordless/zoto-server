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
#include "ZErrorBlock.h"

/* System Headers */
#include <cstdarg>

/* Local Headers */
#include "ZLog.h"

/* Macros */

namespace ZOTO
{

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZErrorBlock::ZErrorBlock(const char *pFile, const char *pFunc, const int pLine)
	: mFile(pFile), mFunc(pFunc), mLine(pLine)
{

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
void ZErrorBlock::operator() (const char *pFormat, ...) const
{
#ifdef TRACE_ENABLE
	char	vBuffer[1024];
	char	vText[1024];
	va_list	vArgs;
	/* Construct the trace message */
	memset(vBuffer, '\0', sizeof(vBuffer));
	va_start(vArgs, pFormat);
	vsnprintf(vBuffer, sizeof(vBuffer)-1, pFormat, vArgs);
	va_end(vArgs);
	ZLog::GetLog().Write("\n");
	ZLog::GetLog().Write("===================================================\n");
	ZLog::GetLog().Write("=         An internal error has occurred          =\n");
	ZLog::GetLog().Write("===================================================\n");
	sprintf(vText, "File: %s\n", mFile);
	ZLog::GetLog().Write(vText);
	sprintf(vText, "Func: %s\n", mFunc);
	ZLog::GetLog().Write(vText);
	sprintf(vText, "Line: %d\n", mLine);
	ZLog::GetLog().Write(vText);
	ZLog::GetLog().Write("*Error text*\n");
	ZLog::GetLog().WriteRaw(vBuffer); // Send it to the parser
	ZLog::GetLog().Write("\n");
	ZLog::GetLog().Write("===================================================\n\n");
#endif
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
