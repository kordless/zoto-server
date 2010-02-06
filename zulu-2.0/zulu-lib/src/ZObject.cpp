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
#include "ZObject.h"

/* System Headers */

/* Local Headers */

/* Macros */
#define CASE_ZRESULT( result ) \
	case result: \
		return #result

namespace ZOTO
{

DECLARE_CLASS( "ZObject" )

/* Static Variables */

static const char* ErrStrings[] = {
	"An unknown error occurred",				// 100
	"The specified resource is already in use",	// 101
	"Open file",								// 102
	"Invalid status",							// 103
	"Error reading file",						// 104
	"Invalid username/password",				// 105
	"Invalid client version",					// 106
	"New client version available",				// 107
	"Error creating system socket",				// 108
	"Error connecting to Zoto server",			// 109
	"Error communicating with Zoto server", 	// 110
	"Server returned an error code",			// 111
	"NULL pointer passed",						// 112
	"Duplicate file specified",					// 113
	"Invalid value supplied",					// 114
	"Operation timed out",						// 115
	"Name resolution error",					// 116
	"General network error",					// 117
	"Error binding socket",						// 118
	"Connection was refused by the ZoTo server",// 119
	"User cancelled operation",					// 120	
	"Zulu version is really, really old"
};

/********************************************************************
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 ********************************************************************/
ZObject::ZObject()
{

}

ZObject::~ZObject()
{

}

/*------------------------------------------------------------------*
 *							   FormatError()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Returns a string representation of the error code
 *				supplied.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 *	@param		pErr
 *					Error code to be formatted.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
const char* ZObject::FormatError(ZRESULT pErr)
{
	static std::string	vError;

	if (pErr == 0)
		vError = "Success";
	else if (pErr == 100 || pErr >= ZERR_MAX)
		vError = "Unknown";
	else 
		vError = ErrStrings[pErr-100];

	return vError.c_str();
}

/*------------------------------------------------------------------*
 *							   MakeFName()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Concatenates the class and function name into a single
 *				string.
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 *	@param		pClass
 *					Name of the calling class.
 *	@param		pFunc
 *					Name of the calling function.
 *	@param		pCFname
 *					String buffer to hold the result.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
const int ZObject::MakeFName(const char *pClass, const char *pFunc, std::string& pCFname)
{
	pCFname = pClass;
	pCFname += "::";
	pCFname += pFunc;
	return pCFname.length();
}

/*------------------------------------------------------------------*
 *							   RetString()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Converts the ZRESULT value into it's string
 *				representation
 *
 *	@author		Josh Williams
 *	@date		07-Apr-2004
 *
 *	@param		pResult
 *					Return code to be converted.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
const char* ZObject::RetString(ZRESULT pResult)
{
	switch (pResult)
	{
	CASE_ZRESULT(ZERR_SUCCESS);
	CASE_ZRESULT(ZERR_UNKNOWN);
	CASE_ZRESULT(ZERR_ALREADY_IN_USE);
	CASE_ZRESULT(ZERR_OPEN_FILE);
	CASE_ZRESULT(ZERR_INVALID_STATUS);
	CASE_ZRESULT(ZERR_READ_FILE);
	CASE_ZRESULT(ZERR_BAD_AUTH);
	CASE_ZRESULT(ZERR_INVALID_VERSION);
	CASE_ZRESULT(ZERR_NEW_VERSION);
	CASE_ZRESULT(ZERR_CREATE_SOCKET);
	CASE_ZRESULT(ZERR_CONNECT);
	CASE_ZRESULT(ZERR_COMM);
	CASE_ZRESULT(ZERR_SERVER_ERROR);
	CASE_ZRESULT(ZERR_NULL_POINTER);
	CASE_ZRESULT(ZERR_DUPLICATE_FILE);
	CASE_ZRESULT(ZERR_INVALID_VALUE);
	CASE_ZRESULT(ZERR_TIMEOUT);
	CASE_ZRESULT(ZERR_RESOLVE_ERROR);
	CASE_ZRESULT(ZERR_NET);
	CASE_ZRESULT(ZERR_BIND);
	CASE_ZRESULT(ZERR_CONN_REFUSED);
	CASE_ZRESULT(ZERR_CANCELLED);
	default:
		return "ZERR_UNKNOWN";
	}
}

} // End Namespace

/* vi: set ts=4: */
