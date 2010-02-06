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
#if !defined(__ZOBJECT_H_INCLUDED__)
#define __ZOBJECT_H_INCLUDED__

#include "ZPlatform.h"

/* System Headers */
#include <cstdarg>
#include <typeinfo>
#include <sstream>

/* Local Headers */
#include "ZGlobals.h"
#include "ZTypes.h"
#include "ZLog.h"

#define DECLARE_CLASS( a ) \
		static const char __CLASS__[] = a;

/* Macros */
#define Z_TO_STRING( a ) ZObject::RetString( a )

/* Macros */
#ifdef TRACE_ENABLE

#if ZULU_PLATFORM == PLATFORM_WINDOWS
#define BEG_FUNC(func) \
	static char __FUNCTION__[] = func; \
	static std::string __CFUNC__; \
	ZObject::MakeFName(__CLASS__, __FUNCTION__, __CFUNC__); \
	ZFuncWrapper x(__CFUNC__.c_str()); \
	x 
#elif ZULU_PLATFORM == PLATFORM_MAC || ZULU_PLATFORM == PLATFORM_LINUX
#define BEG_FUNC(func) \
	static std::string __CFUNC__; \
	ZObject::MakeFName(__CLASS__, __FUNCTION__, __CFUNC__); \
	ZFuncWrapper x(__CFUNC__.c_str()); \
	x
#else
#error Unsupported platform
#endif


#define END_FUNC(x) \
		EndFunc( __CFUNC__.c_str(), x)

#define END_FUNCV() \
		EndFunc( __CFUNC__.c_str() )

#else // No Trace

#if ZULU_PLATFORM == PLATFORM_WINDOWS
#define BEG_FUNC( func ) \
	static char __FUNCTION__[] = func; \
	ZFuncWrapper x( func ); \
	x
#elif ZULU_PLATFORM == PLATFORM_LINUX || ZULU_PLATFORM == PLATFORM_MAC
#define BEG_FUNC( func ) \
	ZFuncWrapper x( func ); \
	x
#else
#error Unsupported platform
#endif

#define END_FUNC( x ) x
#define END_FUNCV()
#endif // TRACE_ENABLE


namespace ZOTO
{

void BegFunc(const char *pFunc, const char *pMsg, ...);
void EndFunc(const std::string& pFunc);
ZRESULT EndFunc(const std::string& pFunc, ZRESULT pResult);
bool EndFunc(const std::string& pFunc, bool pResult);
template <class T>
T EndFunc(const std::string& pFunc, const T& pResult);

/**
 *	@class		ZObject
 *
 *	@brief		Base class for all Zulu objects.
 *	@author		Josh Williams
 *	@version	0.1.0
 *	@date		12-Oct-2004
 */
class _ZuluExport ZObject
{
public:
	class ZFuncWrapper
	{
	public:
		ZFuncWrapper(const char *pFunc)
			: mFunc(pFunc) {}
		void operator() (const char *pFormat, ...) const
		{
			va_list		vArgs;
			static char	vBuffer[1024];
			if (pFormat == NULL)
				BegFunc(mFunc, NULL);
			else
			{
				va_start(vArgs, pFormat);
				vsnprintf(vBuffer, 1024-1, pFormat, vArgs);
				BegFunc(mFunc, vBuffer);
			}
		}
	private:
		const char	*mFunc;
	};

public:
	/*==================================*
	 *     CONSTRUCTION/DESTRUCTION     *
	 *==================================*/
	ZObject();
	virtual ~ZObject();

public:
	/*==================================*
	 *			  ATTRIBUTES			*
	 *==================================*/

public:
	/*==================================*
	 *			  OPERATIONS            *
	 *==================================*/
	static const int	MakeFName(const char *pClass, const char *pFunc, std::string& pCFname);
	static const char*	RetString(ZRESULT pResult);
	static const char*	FormatError(ZRESULT pErr);

public:
	/*==================================*
	 *			   OPERATORS			*
	 *==================================*/

protected:
	/*==================================*
	 *             CALLBACKS			*
	 *==================================*/

private:
	/*==================================*
	 *             INTERNALS            *
	 *==================================*/
	
private:
	/*==================================*
	 *             VARIABLES            *
	 *==================================*/
};



/********************************************************************
 *																	*
 *							I N L I N E S							*
 *																	*
 ********************************************************************/

/**
 *	Logs function entry and increases log indentation.
 */
inline
void BegFunc(const char *pFunc, const char *pMsg, ...)
{
	static char 	vBuffer[1024];
	static va_list	vArgs;

	if (pMsg == NULL)
		ZTRACE("%s() -> ENTRY\n", pFunc);
	else
	{
		va_start(vArgs, pMsg);
		vsnprintf(vBuffer, sizeof(vBuffer)-1, pMsg, vArgs);
		va_end(vArgs);
		ZTRACE("%s(%s) -> ENTRY\n", pFunc, vBuffer);
	}
	ZLog::GetLog().SetIndent(1);
}

/**
 *	Logs function exit and decreases log indentation.
 */
inline
void EndFunc(const std::string& pFunc)
{
	ZLog::GetLog().SetIndent(-1);
	ZTRACE("%s() <- EXIT\n", pFunc.c_str());
	return;
}

/**
 *	@overload
 */
inline
ZRESULT EndFunc(const std::string& pFunc, ZRESULT pResult)
{
	ZLog::GetLog().SetIndent(-1);
	ZTRACE("%s() <- EXIT with %s\n", pFunc.c_str(), Z_TO_STRING(pResult));
	return pResult;
}

/**
 *	@overload
 */
inline
bool EndFunc(const std::string& pFunc, bool pResult)
{
	ZLog::GetLog().SetIndent(-1);
	ZTRACE("%s() <- EXIT with %s\n", pFunc.c_str(), pResult ? "true" : "false");
	return pResult;
}

/**
 *	@overload
 */
template <class T>
T EndFunc(const std::string& pFunc, const T& pResult)
{
	std::ostringstream	output_stream;
	output_stream << pFunc << "() <- EXIT with " << pResult << "\n";
	ZLog::GetLog().SetIndent(-1);
	ZTRACE(output_stream.str().c_str());
	return pResult;
}

} // End Namespace

#endif // __ZOBJECT_H_INCLUDED__

/* vi: set ts=4: */
