/*============================================================================*
 *                                                                            *
 *	This file is part of the Zoto Software Suite.  							  *
 *																			  *
 *	Copyright (C) 2004 Zoto, Inc.  123 South Hudson, OKC, OK  73102			  *
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
#include "ZCliApp.h"

/* System Headers */
#include <dirent.h>
#include <iostream>

/* Local Headers */

/* Macros */

namespace ZOTO
{

const char *options[][2] = {
	{"-r", "Process directories recursively (used with -D)"},
	{"-q", "Quiet (suppress informational messages)"},
	{"-v", "Print extra informational messages"},
	{"-V", "Be EXTRA verbose"},
	{"-D", "Specify a directory to scan for photos"},
	{"-u", "Username"},
	{"-p", "Password"},
	{"-d", "Dump trace information to file (internal use)"},
	{"-H", "Override the host name (internal use)"},
	{"-P", "Override the host port (internal use)"},
	NULL
};

/* Static Variables */

/********************************************************************
 *																	*
 *          C O N S T R U C T I O N / D E S T R U C T I O N         *
 *																	*
 ********************************************************************/
ZCliApp::ZCliApp(int& argc, char **argv)
	: ZApp(argc, argv), mRecurse(false), mConsole(CONS_NORMAL),
		mQuiet(false), mDirectory("")
{
	qInstallMsgHandler(ZApp::TraceHandler);
}

ZCliApp::~ZCliApp()
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

/*------------------------------------------------------------------*
 *							Initialize()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Evaluates the arguments passed on the command line.
 *
 *	@author		Josh Williams
 *	@date		16-Sep-2005
 *
 *	@param		argc
 *					Number of command line arguments.
 *	@param		argv
 *					Array of arguments.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
bool ZCliApp::Initialize(int& argc, char **argv)
{
	PrintSyntax();
	if (ProcessArgs(argc, argv) == false)
	{
		return false;
	}

	if (mClient->Initialize() != ZERR_SUCCESS)
	{
		return false;
	}

	return true;
}

/*------------------------------------------------------------------*
 *							  PrintSyntax()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Displays the program syntax.
 *
 *	@author		Josh Williams
 *	@date		19-Sep-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZCliApp::PrintSyntax()
{
	PrintConsole(CONS_ALWAYS, "\nUsage: %s [-qvVr [-u username] ", "zulu");
	PrintConsole(CONS_ALWAYS, "[-p password] [-D directory] [file1] [file2], [...]\n\n");
	PrintConsole(CONS_ALWAYS, "Options:\n");
	const char **pc;
	pc = options[0];
	
	while (pc[0] != NULL)
	{
		PrintConsole(CONS_ALWAYS, "  %-15.15s%s\n", pc[0], pc[1]);
		pc += 2;
	}
}
/*------------------------------------------------------------------*
 *							  PrintConsole()						*
 *------------------------------------------------------------------*/
/**
 *	@brief		Prints a block of text to the console, depending on
 *				the level.
 *
 *	@author		Josh Williams
 *	@date		16-Sep-2005
 *
 *	@param		pLevel
 *					Level of the message.
 *	@param		pMessage
 *					Text to be printed (can contain macro substitution).
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZCliApp::PrintConsole(ConsoleLevel pLevel, const char *pMessage, ...)
{
	static char		vBuffer[1024];
	va_list			vArgs;

	if (mQuiet == true && pLevel > CONS_ALWAYS)
		return;

	if (mConsole < pLevel)
		return;

#ifndef DEBUG  // Don't print in release build
	if (pLevel == CONS_DEBUG)
		return;
#endif

	va_start(vArgs, pMessage);
	vsnprintf(vBuffer, sizeof(vBuffer)-1, pMessage, vArgs);
	va_end(vArgs);

	std::cout << vBuffer << std::flush;
}

/*------------------------------------------------------------------*
 *								Process()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Performs the actual uploading of files.
 *
 *	@author		Josh Williams
 *	@date		16-Sep-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZCliApp::Process()
{
	ZRESULT	vRetval;
	QString vLatestVersion;

	PrintConsole(CONS_VERBOSE, "Connecting ........");
	if ((vRetval = mClient->ConnectServer()) != ZERR_SUCCESS)
	{
     	PrintConsole(CONS_VERBOSE, " Error!\n");
     	DisplayError(vRetval);
        return;
	}
	PrintConsole(CONS_VERBOSE, " Success!\n");

	PrintConsole(CONS_VERBOSE, "Checking version ..");
	if ((vRetval = mClient->CheckVersion(vLatestVersion)) != ZERR_SUCCESS)
	{
		if (vRetval != ZERR_NEW_VERSION)
		{
	     	PrintConsole(CONS_VERBOSE, " Error!\n");
    	  	DisplayError(vRetval);
			return;
		}
	}
	PrintConsole(CONS_VERBOSE, " Success!\n");

	PrintConsole(CONS_VERBOSE, "Authenticating ....");
	if ((vRetval = mClient->Authenticate(GetUserName(), GetPswdHash())) != ZERR_SUCCESS)
	{
     	PrintConsole(CONS_VERBOSE, " Error!\n");
        DisplayError(vRetval);
		return;
	}
	PrintConsole(CONS_VERBOSE, " Success!\n");

	if (mFiles.size() == 0)
		PrintConsole(CONS_VERBOSE, "No files to process\n");
	else
	{
		ZXferInfo	vInfo;	
		for (UploadFiles::iterator vIt = mFiles.begin(); vIt != mFiles.end(); vIt++)
		{
			vInfo.mFile = (*vIt).absFilePath();
			vInfo.mName = (*vIt).fileName();
			vInfo.mTemp = false;
			if ((vRetval = mClient->SendFile(vInfo, Status, false)) != ZERR_SUCCESS)
			{
      			if (vRetval == ZERR_DUPLICATE_FILE)
      			{
	            	continue;
				}
				std::cout << "Unable to send file to zoto server" << std::endl;
				std::cout << mClient->FormatError(vRetval) << std::endl;
				mClient->Disconnect();
				return;
			}
		}
	}

	mClient->Disconnect();
}

/*------------------------------------------------------------------*
 *								Status()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Callback function for upload processing.
 *
 *	@author		Josh Williams
 *	@date		16-Sep-2005
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZCliApp::Status(ZXferInfo *pInfo)
{
	QFileInfo	vInfo(pInfo->mFile);

	if (pInfo->mStatus == XFER_ACTIVE)
	{
		std::cout << "\rUploading " << vInfo.fileName() << " ... ";
		int blocks = (int)(20.0f * pInfo->mProgress);
		std::cout << "[";
		for (int i = 0; i < blocks; i++)
			std::cout << "#";
		for (int i = 0; i < 20 - blocks; i++)
			std::cout << " ";
		std::cout << "] ";
		std::cout.width(3);
		std::cout.precision(3);
		std::cout.fill(' ');
		std::cout << (int)(pInfo->mProgress * 100);
		std::cout << "%" << std::flush;
	}
	else if (pInfo->mStatus == XFER_COMPLETE)
	{
		std::cout << "\r[COMPLETE] " << vInfo.fileName() << "                                  " << std::endl;
	}
	else if (pInfo->mStatus == XFER_FAILED)
	{
		if (pInfo->mErrcode == ZERR_DUPLICATE_FILE)
		    std::cout << "\r[SKIPPED]  " << vInfo.fileName() << std::endl;
		else
		    std::cout << "Error!" << std::endl;
	}
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
 *							ProcessArgs()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Evaluates the arguments passed on the command line.
 *
 *	@author		Josh Williams
 *	@date		16-Sep-2005
 *
 *	@param		argc
 *					Number of command line arguments.
 *	@param		argv
 *					Array of arguments.
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
bool ZCliApp::ProcessArgs(int& argc, char *argv[])
{
	int c;

	opterr = 0; // disable error messages from getopt()

	while ((c = getopt(argc, argv, "rqvVdD:u:p:H:P:")) != -1)
	{
		switch (c)
		{
		case 'r':
			mRecurse = true;
			break;
		case 'q':
			mQuiet = true;
			break;
		case 'v':
			if (mConsole == CONS_NORMAL)
				mConsole = CONS_VERBOSE;
			break;
		case 'V':
			mConsole = CONS_VERBOSE2;
			break;
		case 'D':
			mDirectory = optarg;
			break;
		case 'u':
			SetUser(optarg);
			break;
		case 'p':
			SetPswd(optarg);
			break;
		case 'd':
			ZLog::GetLog().InitTrace(argv[0]);
			break;
		case 'H':
			mClient->SetZspHost(optarg);
			break;
		case 'P':
			mClient->SetZspPort(atoi(optarg));
			break;
		case '?':
			switch (optopt)
			{
			case 'u': // username not entered
				PrintConsole(CONS_ALWAYS, "must supply username with -u flag ");
				PrintConsole(CONS_ALWAYS, "(ex. -u foo)\n");
				return false;
			case 'p': // password not entered
			    PrintConsole(CONS_ALWAYS, "must supply password with -p flag ");
				PrintConsole(CONS_ALWAYS, "(ex. -u bar)\n");
			    return false;
			case 'D': // directory not entered
			    PrintConsole(CONS_ALWAYS, "must supply directory with -D flag ");
			    PrintConsole(CONS_ALWAYS, "(ex. -D /home/foo/mypics)\n");
			    return false;
			default:
				if (isprint(optopt))
					PrintConsole(CONS_ALWAYS, "Unknown option '-%c'\n", optopt);
				else
					PrintConsole(CONS_ALWAYS, "Unknown option '\\x%x'\n", optopt);
				return false;
			}
		default:
			return false;
		}
	}

	// Make sure all the required arguments were passed
	if (GetUserName() == "")
	{
		PrintConsole(CONS_ALWAYS, "must supply a username\n");
		return false;
	}
	if (GetPswdHash() == "")
	{
		PrintConsole(CONS_ALWAYS, "must supply a password\n");
		return false;
	}

	// now, get the leftovers (should be files)
	for (int i = optind; i < argc; i++)
	{
		// This must be a file name
		if (ZClient::IsSupportedImage(argv[i]))
		{
			QFileInfo vInfo(argv[i]);
			mFiles.push_back(vInfo);
		}
	}

	// if a directory was specified, load it
	if (mDirectory != "")
	{
	    LoadFiles(mDirectory);
	}

	return true;
}

/*------------------------------------------------------------------*
 *							  LoadFiles()							*
 *------------------------------------------------------------------*/
/**
 *	@brief		Prints a block of text to the console, depending on
 *				the level.
 *
 *	@author		Josh Williams
 *	@date		16-Sep-2005
 *
 *	@param		pLevel
 *					Level of the message.
 *	@param		pMessage
 *					Text to be printed (can contain macro substitution).
 */
/*------------------------------------------------------------------*
 * MODIFICATIONS													*
 *	Date		Description							Author			*
 * ===========	==================================	===============	*
 *																	*
 *------------------------------------------------------------------*/
void ZCliApp::LoadFiles(const char *pDir)
{
	DIR				*vDirectory;
	struct dirent	*vDirEntry;
	QString         vDirSlash;
	QString			vFull;

	/* make sure the directory isn't NULL or blank */
	if (pDir == NULL)
		return;

	else if (strlen(pDir) == 0)
		return;

	/* try to obtain a directory handle */
	if ((vDirectory = opendir(pDir)) == NULL)
		return;


	/* append a file separator to the directory name if not present */
	vDirSlash = pDir;
	if (pDir[strlen(pDir) - 1] != '/')
	    vDirSlash += '/';

	PrintConsole(CONS_DEBUG, "Loading files in dir => [%s]\n", pDir);

	/* iterate over every object in the directory */
	while ((vDirEntry = readdir(vDirectory)))
	{
		/* current directory or parent directory pointer	*/
		/* (hidden files under Linux)						*/
		if (vDirEntry->d_name[0] == '.')
			continue;

		/* put the full file name (path + file) in full */
		vFull = vDirSlash;
		vFull += vDirEntry->d_name;

		QFileInfo vInfo(vFull);
		/* if this is a directory, recurse into it */
		if (vInfo.isDir())
		{
			if (mRecurse)
			    LoadFiles(vFull);
			continue;
		}

		/* if it's an image file, process it */
		if (ZClient::IsSupportedImage(vFull.latin1()))
		{
			PrintConsole(CONS_DEBUG, "Adding image => [%s]\n", vFull.latin1());
		    mFiles.push_back(vInfo);
		}
		else
		    PrintConsole(CONS_DEBUG, "Skipping file => [%s]\n", vFull.latin1());
	}
}

void ZCliApp::DisplayError(ZRESULT pRetval)
{
	switch (pRetval)
	{
	case ZERR_CREATE_SOCKET:
		PrintConsole(CONS_ALWAYS, "\n\nUnable to initialize Zulu library\n");
		PrintConsole(CONS_ALWAYS, "Error description => %s\n",
						ZObject::FormatError(pRetval));
		break;
	case ZERR_CONN_REFUSED:
		PrintConsole(CONS_ALWAYS, "\n\nUnable to connect to the ZoTo server\n");
		PrintConsole(CONS_ALWAYS, "Error description => %s\n",
						ZObject::FormatError(pRetval));
		break;
	case ZERR_BAD_AUTH:
        PrintConsole(CONS_ALWAYS, "\n\nThe username or password supplied is invalid.\n");
        break;
	default:
		break;
	}
}

} // End Namespace

/* vi: set ts=4: */
