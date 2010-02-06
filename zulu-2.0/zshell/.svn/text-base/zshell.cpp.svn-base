// zshell.cpp : Defines the entry point for the application.
//

#include "stdafx.h"
#include "ZGlobals.h"
#include "ZTypes.h"
#include <cstring>
#include <cstdio>
#include <cstdlib>
#include <process.h>

HWND gWnd = NULL;

BOOL CALLBACK FindZuluWin(HWND pWnd, LPARAM vParam)
{
	TCHAR	vTitle[256];
	int		vLength = 0;

	vLength = GetWindowText(pWnd, vTitle, 256);
	if (vLength > 0)
	{
		if (strncmp(vTitle, MAIN_NAME, ZMIN(vLength, (int)strlen(MAIN_NAME))) == 0)
		{
			gWnd = pWnd;
			return FALSE; // Stop search
		}
		else
		{
			return TRUE;
		}
	}
	else
		return TRUE;
}

int APIENTRY WinMain(HINSTANCE hInstance,
                     HINSTANCE hPrevInstance,
                     LPSTR     lpCmdLine,
                     int       nCmdShow)
{
	char				vCmdString[1024];
	char				vExecPath[1024];
	bool				vPrevShell = false;
	ZUSHORT				vCount = 0;
	HANDLE				vShlMutex;
	HANDLE				vAppMutex;
	DWORD				vWaitResult;
	BOOL				vSuccess;
	LPTSTR				vMessage;
	HWND				vAppWnd = NULL;
	HWND				vOther = NULL;
	COPYDATASTRUCT		vCds;
	STARTUPINFO			vSi;
	PROCESS_INFORMATION	vPi;

	/*
	 * Alright, first we need to check our own mutex.  This will cause other
	 * instances of this shell wrapper to hang while we crank up the application
	 */
	vShlMutex = OpenMutex(MUTEX_ALL_ACCESS, 0, "ZSHELL_MUTEX");
	if (vShlMutex == NULL)
	{
		vShlMutex = CreateMutex(0, FALSE, "ZSHELL_MUTEX");
	}
	else
	{
		vPrevShell = true;
		vWaitResult = WaitForSingleObject(vShlMutex, 5000L);

		switch(vWaitResult)
		{
		case WAIT_OBJECT_0:
			break;
		case WAIT_TIMEOUT:
			return 2;
		case WAIT_ABANDONED:
			return 3;
		}
	}

	/*
	 * Alright, if we're here, then either our instance is the first instance,
	 * or another instance of this program SHOULD have started a running copy
	 * of the main executable.
	 */
	vAppMutex = OpenMutex(MUTEX_ALL_ACCESS, 0, MUTEX_NAME);
	if (!vAppMutex && vPrevShell)
	{
		/*
		 * An existing instance of this program is known to have been running.
		 * give a little more time for the app to crank up.
		 */
		while (vCount++ < 10 && !vAppMutex)
		{
			Sleep(500);
			vAppMutex = OpenMutex(MUTEX_ALL_ACCESS, 0, MUTEX_NAME);
		}
	}

	if (!vAppMutex)
	{
		/*
		 * Get the path of this executable, and replace the file name with the Zulu client.
		 */
		GetModuleFileName(NULL, vExecPath, 1024);
		PathRemoveFileSpec(vExecPath);
		sprintf(vCmdString, """%s\\Zulu.exe"" %s", vExecPath, lpCmdLine);

		/*
		 * Now, try to start the uploader.
		 */

		memset(&vSi, 0, sizeof(STARTUPINFO));
		vSi.cb			= sizeof(STARTUPINFO);
		vSi.wShowWindow	= SW_SHOW;
		vSuccess = CreateProcess(NULL, vCmdString, NULL, NULL, FALSE, 0, NULL,
									vExecPath, &vSi, &vPi);

		if (vSuccess == FALSE)
		{
			/*
			 * Well, something went wrong. Couldn't start the Uploader.
			 */
			FormatMessage(FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_FROM_SYSTEM,
								NULL,GetLastError(), 0, (LPTSTR)&vMessage, 0, NULL);
			MessageBox(NULL, vMessage, "Error", MB_OK);
		}
	}
	else
	{
		/*
		 * Mutex exists.  An existing instance is already running.  Try
		 * to find our placeholder window.
		 */
		vAppWnd = FindWindowA(0, INVIS_NAME);
		vCount = 0;
		while (vCount++ < 10 && vAppWnd == NULL)
		{
			Sleep(50);
			vAppWnd = FindWindowA(0, INVIS_NAME);
		}

		if (vAppWnd == NULL)
		{
			MessageBox(NULL, "Unable to find placeholder", "Oops", MB_ICONWARNING);
			return true;
		}

		/*
		 * Send the previous instance our stuff
		 */
		if (strlen(lpCmdLine) > 0)
		{
			char *vPc;
			char *vBuffer = new char[strlen(lpCmdLine)+1];
			memset(vBuffer, '\0', strlen(lpCmdLine));
			/* strip the "'s */
			vPc = strchr(lpCmdLine, '"');
			if (vPc)
			{
				memcpy(vBuffer, vPc+1, strlen(lpCmdLine) - (vPc+1 - lpCmdLine));
				vPc = strchr(vBuffer, '"');
				if (vPc)
				{
					*vPc = '\0';
					memset(lpCmdLine, '\0', strlen(lpCmdLine));
					memcpy(lpCmdLine, vBuffer, strlen(vBuffer));
					lpCmdLine[strlen(lpCmdLine)] = ';';
					vCds.dwData = 0;
					vCds.cbData = strlen(lpCmdLine) + 1;
					char vMessage[1024];
					sprintf(vMessage, "[%s]", lpCmdLine);
					vCds.lpData = lpCmdLine;
					SendMessage(vAppWnd, WM_COPYDATA, 0, (LPARAM)&vCds);
				}
			}
			delete[] vBuffer;
		}

		/*
		 * Now that we've notified the existing window of our new data,
		 * try to find one of it's windows and activate it.
		 */
		EnumWindows(FindZuluWin, (LPARAM)&vOther);
		if (gWnd == NULL)
			gWnd = FindWindowA(0, LOGIN_NAME);

		if (gWnd != NULL)
			SetForegroundWindow(gWnd);
		else
			MessageBox(NULL, "Couldn't find an existing window", "Well", MB_ICONWARNING);
	}

	ReleaseMutex(vShlMutex);

	return 0;
}



