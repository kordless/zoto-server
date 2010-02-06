#include <cstdio>
#include <cstdlib>
#include <cstring>
#if defined(WIN32) || defined(_WINDOWS)		/* Windows platforms */
#include <winsock2.h>
#else
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#endif
#include <unistd.h>
#include <errno.h>
#include "ZTypes.h"
#include "zsp_server.h"
#include "ZLog.h"
#include <iostream>

using std::cout;
using std::cerr;
using std::endl;

#define MIN( a, b ) a < b ? a : b

/* VERSION DEFINES */
/*#define ZSP_VERS_MAJ	3
#define ZSP_VERS_MIN	2
#define ZSP_VERS_BUILD	1*/

#define ZSP_THUMBW		110
#define ZSP_THUMBH		220
#define ZSP_MEDIUMW		330
#define ZSP_MEDIUMH		440

namespace ZOTO
{

// ===========================================================
ZSPServer::~ZSPServer()
{
	SocketMap::iterator it;
	ZNode				*pNode;

	for (it = m_SockMap.begin(); it != m_SockMap.end(); it++)
	{
		pNode = it->second;
		pNode->Close();
		delete pNode;
	}

	m_ServSock.Close();
}
		


// ===========================================================
bool ZSPServer::Initialize(ZUSHORT shPort)
{
	//ZOTO::ZLog::InitTrace("zsp_server");

	if (m_ServSock.Create(shPort, SOCK_STREAM) != ZERR_SUCCESS)
		cerr << "Error initializing server socket" << endl;

	if (m_ServSock.Listen(5) != ZERR_SUCCESS)
	{
		cerr << "Error putting socket in listening mode" << endl;
		m_ServSock.Close();
	}

	return true;
}

// ===========================================================
bool ZSPServer::MessageLoop()
{
	struct timeval		seltime;
	int					ts;
	fd_set				readfds, writefds, excpfds;
	int					nRetval = -1;
	SocketMap::iterator	it;
	int					maxSocket = -1;
	ZNode				*pNewSock = NULL;

	while (m_bShutdown != true)
	{
		seltime.tv_sec = 5;
		seltime.tv_usec	= 0;
		FD_ZERO(&readfds);
		FD_ZERO(&writefds);
		FD_ZERO(&excpfds);

		FD_SET(m_ServSock.GetHandle(), &readfds);
		FD_SET(m_ServSock.GetHandle(), &writefds);
		FD_SET(m_ServSock.GetHandle(), &excpfds);

		maxSocket = m_ServSock.GetHandle();

		for (it = m_SockMap.begin(); it != m_SockMap.end(); it++)
		{
			ts = it->second->GetHandle();
			FD_SET(ts, &readfds);
			//FD_SET(ts, &writefds);
			FD_SET(ts, &excpfds);
			if (ts > maxSocket)
				maxSocket = ts;
		}

		nRetval = select(maxSocket+1, &readfds, 0, &excpfds, &seltime);

		if (nRetval < 0)
		{
			cerr << "select() failed" << endl;
			cerr << "error: " << errno << ":" << strerror(errno) << endl;
			Terminate();
			return false;
		}
		else if (nRetval == 0)
		{
			cout << "select() returned 0" << endl;
			continue;
		}
		else
		{
			//cout << "hit something on select()" << endl;
			if (FD_ISSET(m_ServSock.GetHandle(), &readfds))
			{
				cout << "Accepting new connection" << endl;
				pNewSock = new ZNode();
				if (m_ServSock.Accept(pNewSock) != ZERR_SUCCESS)
				{
					delete pNewSock;
					pNewSock = NULL;
					cerr << "Error accepting new connection" << endl;
				}
				else
				{
					cout << "Accepted new connection" << endl;
					pNewSock->GetPeerName(pNewSock->remote_ip, sizeof(pNewSock->remote_ip), &pNewSock->remote_port);
					cout << "======================================" << endl;
					cout << "Accepted new connection" << endl;
					cout << "Address: " << pNewSock->remote_ip << endl;
					cout << "Port:    " << pNewSock->remote_port << endl;
					m_SockMap[pNewSock->GetHandle()] = pNewSock;
					pNewSock = NULL;
				}
			}

			for (it = m_SockMap.begin(); it != m_SockMap.end(); it++)
			{
				ts = it->second->GetHandle();
				//cout << "GetHandle() -> [" << ts << "]" << endl;
				if (FD_ISSET(ts, &readfds))
				{
					//cout << "processing data for [" << ts << "]" << endl;
					if (ProcessData(it->second) != true)
					{
						ZNode *pNode = it->second;
     					m_SockMap.erase(pNode->GetHandle());
						pNode->Close();
						delete pNode;
						it = m_SockMap.begin();
						if (it == m_SockMap.end())
							break;
						//Terminate();
						//break;
					}
				}
			}
		}
	}

	return true;
}
				
// ===========================================================
bool ZSPServer::ProcessData(ZNode *pNode)
{
	ZRESULT		zRetval = ZERR_SUCCESS;
	char		acBuffer[1024];
	ZSP_HEADER	*header;
	int			nRecvBytes = 0;


	if (pNode->bReceivingFile)
	{
		nRecvBytes = MIN( 1024, pNode->m_lFileBytes );
		zRetval = pNode->Receive(acBuffer, nRecvBytes, 10);
		if (zRetval != ZERR_SUCCESS)
		{
			cerr << "Timed out or something.  Blah." << endl;
			return false;
		}

		if (nRecvBytes == 0)
		{
			cout << "xfer failed.  connection closed" << endl;
			return false;
		}

		pNode->m_File.writeBlock(acBuffer, nRecvBytes);
		pNode->m_lFileBytes -= nRecvBytes;
		//cout << "Bytes remaining => [" << pNode->m_lFileBytes << "]" << endl;
		if (pNode->m_lFileBytes <= 0)
		{
			cout << "Full file received.  Closing...." << endl;
			pNode->m_File.close();
			pNode->bReceivingFile = false;
			pNode->buf_len = 0;
			memset(pNode->buffer, 0, sizeof(pNode->buffer));
		}

		return true;
	}

	/* receive normal data */
	memset(acBuffer, '\0', sizeof(acBuffer));
	nRecvBytes = 1024;
	zRetval = pNode->Receive(acBuffer, nRecvBytes, 10);

	if (zRetval != ZERR_SUCCESS)
	{
		cerr << "WTF?  Over..." << endl;
		return false;
	}

	if (nRecvBytes == 0)
	{
		cout << "Socket closed" << endl;
		return false;
	}

	cout << "nRecvBytes = " << nRecvBytes << endl;
	memcpy(&pNode->buffer[pNode->buf_len], acBuffer, nRecvBytes);
	pNode->buf_len += nRecvBytes;
	while (pNode->buf_len > 0)
	{
		if (pNode->buf_len < (int)HEADER_SIZE)
			break;

		header = (ZSP_HEADER *)pNode->buffer;

		/*if (!pNode->bAuthenticated && (header->packet_type > ZSP_AUTH))
		{
			cerr << "Socket didn't send an AUTH packet first!" << endl;
			m_SockMap.erase(pNode->GetHandle());
			pNode->Close();
			delete pNode;
			return false;
		}*/

		if (pNode->buf_len < (ntohs(header->payload_length) + (int)HEADER_SIZE))
		{
			cout << "Incomplete packet.  only got " << pNode->buf_len << " bytes" << endl;
			cout << "expecting " << ntohs(header->payload_length) + HEADER_SIZE << " bytes" << endl;
			break;
		}
		else
		{
			cout << "Received " << pNode->buf_len << " bytes" << endl;
			/* complete packet */
			switch (header->packet_type)
			{
			case ZSP_AUTH:
				ProcessAuth(pNode);
				break;
			case ZSP_VERSION:
				ProcessVersion(pNode);
				break;
			case ZSP_FLAG:
				ProcessFlag(pNode);
				break;
			case ZSP_FILE:
				ProcessFile(pNode);
				break;
			case ZSP_DONE:
				ProcessDone(pNode);
				break;
			default:
				/* unknown packet type */
				cerr << "Socket sent unknown packet type" << endl;
				cerr << "Packet_type => [" << header->packet_type << "]" << endl;
				cerr << "buffer length => [" << pNode->buf_len << "]" << endl;
				return false;
			}
		}
	}

	return true;
}

// ===========================================================
bool ZSPServer::ProcessAuth(ZNode *pNode)
{
	ZSP_AUTH_PACKET			*auth;
	ZSP_AUTH_RESP_PACKET	*auth_resp;
	unsigned char			*temp;
	ZUSHORT					payload_length;
	char					user_hash[33];
	char					pswd_hash[33];
	char					*user_name;
	ZUSHORT					user_name_length;
	char					*return_string = "USER OK";

	auth = (ZSP_AUTH_PACKET *)pNode->buffer;

	/* extract information from the AUTH packet */
	payload_length = ntohs(auth->header.payload_length);
	user_name_length = (payload_length + HEADER_SIZE) - AUTH_SIZE;
	user_name = new char[user_name_length + 1];
	memset(user_hash, '\0', sizeof(user_hash));
	memset(pswd_hash, '\0', sizeof(pswd_hash));
	memset(user_name, '\0', user_name_length + 1);
	memcpy(user_hash, auth->user_hash, sizeof(auth->user_hash));
	memcpy(pswd_hash, auth->pswd_hash, sizeof(auth->pswd_hash));
	memcpy(user_name, &pNode->buffer[AUTH_SIZE], user_name_length);

	cout << "============================================" << endl;
	cout << "================== AUTH ====================" << endl;
	cout << "============================================" << endl;
	cout << "user_hash => [" << user_hash << "]" << endl;
	cout << "pswd_hash => [" << pswd_hash << "]" << endl;
	cout << "user_name => [" << user_name << "]" << endl;
	cout << endl;

	delete[] user_name;
	pNode->bAuthenticated = true;

	/* now that this packet has been processed, fix the buffer */
	temp = new unsigned char[pNode->buf_len];
	memcpy(temp, pNode->buffer, pNode->buf_len);
	memset(pNode->buffer, '\0', sizeof(pNode->buffer));
	pNode->buf_len -= (payload_length + HEADER_SIZE);
	memcpy(pNode->buffer, &temp[payload_length + HEADER_SIZE], pNode->buf_len);
	delete[] temp;

	/* create the buffer for the AUTH_RESPONSE */
	temp = new unsigned char[AUTH_RESP_SIZE + strlen(return_string)];
	auth_resp = (ZSP_AUTH_RESP_PACKET *)temp;

	/* build the AUTH_RESPONSE packet */
	payload_length = (AUTH_RESP_SIZE - HEADER_SIZE) + strlen(return_string);
	auth_resp->header.packet_type = ZSP_AUTH_RESP;
	auth_resp->header.payload_length = htons(payload_length);
	auth_resp->return_code = ntohs(110);
	memcpy(&temp[AUTH_RESP_SIZE], return_string, strlen(return_string));

	pNode->Send((const char *)temp, payload_length + HEADER_SIZE);

	delete[] temp;

	return true;
}

// ===========================================================
bool ZSPServer::ProcessVersion(ZNode *pNode)
{
	ZSP_VERSION_PACKET		*version;
	ZSP_VERSION_RESP_PACKET	*version_resp;
	unsigned char			*temp;
	unsigned short			payload_length;
	unsigned short			shMajVer;
	unsigned short			shMinVer;
	unsigned short			shBuildVer;
	const char				*comment = "Alpha dude";

	version = (ZSP_VERSION_PACKET *)pNode->buffer;

	/* extract the information from the VERSION packet */
	payload_length = ntohs(version->header.payload_length);
	shMajVer = ntohs(version->vers_maj);
	shMinVer = ntohs(version->vers_min);
	shBuildVer = ntohs(version->vers_build);

	cout << "============================================" << endl;
	cout << "================= VERSION ==================" << endl;
	cout << "============================================" << endl;
	cout << "Major => [" << shMajVer << "]" << endl;
	cout << "Minor => [" << shMinVer << "]" << endl;
	cout << "Build => [" << shBuildVer << "]" << endl;
	cout << endl;

	/* now that this packet has been processed, fix the buffer */
	temp = new unsigned char[pNode->buf_len];
	memcpy(temp, pNode->buffer, pNode->buf_len);
	memset(pNode->buffer, '\0', sizeof(pNode->buffer));
	pNode->buf_len -= (payload_length + HEADER_SIZE);
	memcpy(pNode->buffer, &temp[payload_length + HEADER_SIZE], pNode->buf_len);
	delete[] temp;

	/* create the buffer for the VERSION_RESPONSE */
	temp = new unsigned char[VERSION_RESP_SIZE + strlen(comment)];
	version_resp = (ZSP_VERSION_RESP_PACKET *)temp;

	/* build the VERSION_RESPONSE packet */
	payload_length = (VERSION_RESP_SIZE - HEADER_SIZE) + strlen(comment);
	version_resp->header.packet_type = ZSP_VERSION_RESP;
	version_resp->header.payload_length = htons(payload_length);
	version_resp->return_code = htons(410);
	memcpy(&temp[VERSION_RESP_SIZE], comment, strlen(comment));

	pNode->Send((const char *)temp, VERSION_RESP_SIZE + strlen(comment));

	delete[] temp;

	return true;
}

// ===========================================================
bool ZSPServer::ProcessFlag(ZNode *pNode)
{
	ZSP_FLAG_PACKET			*flag;
	ZSP_FLAG_RESP_PACKET	*flag_resp;
	unsigned char			*temp;
	unsigned short			payload_length;
	char					image_id[33];
	char					image_date[15];
	char					*image_name;
	ZUSHORT					image_name_length;
	char					*format;

	flag = (ZSP_FLAG_PACKET *)pNode->buffer;

	/* extract the information from the FLAG packet */
	payload_length = ntohs(flag->header.payload_length);
	memset(image_id, '\0', sizeof(image_id));
	memset(image_date, '\0', sizeof(image_date));
	memcpy(image_id, flag->image_id, sizeof(flag->image_id));
	memcpy(image_date, flag->image_date, sizeof(flag->image_date));
	image_name_length = payload_length - (FLAG_SIZE - HEADER_SIZE);
	image_name = new char[image_name_length+1];
	memset(image_name, '\0', image_name_length+1);
	memcpy(image_name, &pNode->buffer[FLAG_SIZE], image_name_length);
	switch (ntohl(flag->image_format))
	{
	case ZSP_JPEG:
		format = "JPEG";
		break;
	case ZSP_GIF:
		format = "GIF";
		break;
	case ZSP_BMP:
		format = "BMP";
		break;
	case ZSP_PNG:
		format = "PNG";
		break;
	case ZSP_TIFF:
		format = "TIFF";
		break;
	case ZSP_TARGA:
		format = "TARGA";
		break;
	default:
		format = "UNKNOWN";
		break;
	}

	cout << "============================================" << endl;
	cout << "=================== FLAG ===================" << endl;
	cout << "============================================" << endl;
	cout << "ID     => [" << image_id << "]" << endl;
	cout << "Format => [" << format << "]" << endl;
	cout << "Size   => [" << ntohl(flag->image_size) << "]" << endl;
	cout << "Date   => [" << image_date << "]" << endl;
	cout << "Name   => [" << image_name << "]" << endl;
	cout << endl;
	delete[] image_name;

	/* now that this packet has been processed, fix the buffer */
	temp = new unsigned char[pNode->buf_len];
	memcpy(temp, pNode->buffer, pNode->buf_len);
	memset(pNode->buffer, '\0', sizeof(pNode->buffer));
	pNode->buf_len -= (payload_length + HEADER_SIZE);
	memcpy(pNode->buffer, &temp[payload_length + HEADER_SIZE], pNode->buf_len);
	delete[] temp;

	/* create the buffer for the FLAG_RESPONSE */
	temp = new unsigned char[FLAG_RESP_SIZE];
	flag_resp = (ZSP_FLAG_RESP_PACKET *)temp;

	/* build the FLAG_RESPONSE packet */
	payload_length = FLAG_RESP_SIZE - HEADER_SIZE;
	flag_resp->header.packet_type = ZSP_FLAG_RESP;
	flag_resp->header.payload_length = htons(payload_length);
	flag_resp->image_needed = htons(1);
	memcpy(flag_resp->image_id, image_id, sizeof(flag_resp->image_id));

	pNode->Send((const char *)temp, FLAG_RESP_SIZE);

	delete[] temp;

	return true;
}

// ===========================================================
bool ZSPServer::ProcessFile(ZNode *pNode)
{
	ZSP_FILE_PACKET			*file;
	ZSP_FILE_RESP_PACKET	*file_resp;
	unsigned char			*temp;
	unsigned short			payload_length;
	char					image_id[33];
	char					image_date[15];
	char					*image_name;
	ZUSHORT					image_name_length;

	file = (ZSP_FILE_PACKET *)pNode->buffer;

	/* extract the information from the FILE packet */
	payload_length = ntohs(file->header.payload_length);
	memset(image_id, '\0', sizeof(image_id));
	memset(image_date, '\0', sizeof(image_date));

	memcpy(image_id, file->image_id, sizeof(file->image_id));
	memcpy(image_date, file->image_date, sizeof(file->image_date));
	image_name_length = payload_length - (FILE_SIZE - HEADER_SIZE);
	image_name = new char[image_name_length+1];
	memset(image_name, '\0', image_name_length+1);
	memcpy(image_name, &pNode->buffer[FILE_SIZE], image_name_length);

	cout << "============================================" << endl;
	cout << "=================== FILE ===================" << endl;
	cout << "============================================" << endl;
	cout << "ID     => [" << image_id << "]" << endl;
	//cout << "Format => [" << format << "]" << endl;
	cout << "Size   => [" << ntohl(file->image_size) << "]" << endl;
	cout << "Date   => [" << image_date << "]" << endl;
	cout << "Name   => [" << image_name << "]" << endl;
	cout << endl;

	pNode->m_lFileBytes = ntohl(file->image_size);
	/* now that this packet has been processed, fix the buffer */
	temp = new unsigned char[pNode->buf_len];
	memcpy(temp, pNode->buffer, pNode->buf_len);
	memset(pNode->buffer, '\0', sizeof(pNode->buffer));
	pNode->buf_len -= (payload_length + HEADER_SIZE);
	memcpy(pNode->buffer, &temp[payload_length + HEADER_SIZE], pNode->buf_len);
	delete[] temp;

	/* crank up the file receiving logic */
	//QString	strFile("./");
	QString strFile(image_name);
	cout << "Opening file [" << strFile << "]" << endl;
	pNode->m_File.setName(strFile);
	if (!pNode->m_File.open(IO_WriteOnly))
	{
		cout << "Error opening file" << endl;
		delete[] image_name;
		return false;
	}
	pNode->bReceivingFile = true;

	delete[] image_name;
	/* create the buffer for the FILE_RESPONSE */
	temp = new unsigned char[FILE_RESP_SIZE + strlen("FILE OK")];
	file_resp = (ZSP_FILE_RESP_PACKET *)temp;

	/* build the FILE_RESPONSE packet */
	payload_length = FILE_RESP_SIZE - HEADER_SIZE + strlen("FILE OK");
	file_resp->header.packet_type = ZSP_FILE_RESP;
	file_resp->header.payload_length = htons(payload_length);
	memcpy(file_resp->image_id, image_id, sizeof(file_resp->image_id));
	file_resp->return_code = htonl(300);
	memcpy(&temp[FILE_RESP_SIZE], "FILE OK", strlen("FILE OK"));

	pNode->Send((const char *)temp, FILE_RESP_SIZE + strlen("FILE OK"));

	delete[] temp;

	/* set the file flag */

	return true;
}

bool ZSPServer::ProcessDone(ZNode *pNode)
{
	ZSP_DONE_PACKET			*done;
	ZSP_DONE_RESP_PACKET	*done_resp;
	ZBYTE					*temp;
	ZUSHORT					payload_length;
	char					image_id[33];
	char					*return_string = "OK";

	done = (ZSP_DONE_PACKET *)pNode->buffer;

	/* extract the information from the DONE packet */
	payload_length = ntohs(done->header.payload_length);
	memset(image_id, '\0', sizeof(image_id));

	memcpy(image_id, done->image_id, sizeof(done->image_id));

	cout << "============================================" << endl;
	cout << "=================== DONE ===================" << endl;
	cout << "============================================" << endl;
	cout << "ID     => [" << image_id << "]" << endl;
	cout << endl;

	/* now that this packet has been processed, fix the buffer */
	temp = new unsigned char[pNode->buf_len];
	memcpy(temp, pNode->buffer, pNode->buf_len);
	memset(pNode->buffer, '\0', sizeof(pNode->buffer));
	pNode->buf_len -= (payload_length + HEADER_SIZE);
	memcpy(pNode->buffer, &temp[payload_length + HEADER_SIZE], pNode->buf_len);
	delete[] temp;

	/* create the buffer for the DONE RESPONSE */
	temp = new unsigned char[DONE_RESP_SIZE + strlen(return_string)];
	done_resp = (ZSP_DONE_RESP_PACKET *)temp;

	/* build the DONE_RESPONSE packet */
	payload_length = (DONE_RESP_SIZE - HEADER_SIZE) + strlen(return_string);
	done_resp->header.packet_type = ZSP_DONE_RESP;
	done_resp->header.payload_length = htons(payload_length);
	done_resp->return_code = htons(300);
	memcpy(&temp[DONE_RESP_SIZE], return_string, strlen(return_string));

	pNode->Send((const char *)temp, payload_length + HEADER_SIZE);

	delete[] temp;

	return true;
}

// ===========================================================
void ZSPServer::Terminate()
{
	SocketMap::iterator	it;
	ZNode				*pNode;

	m_bShutdown = true;

	for (it = m_SockMap.begin(); it != m_SockMap.end(); it++)
	{
		pNode = it->second;
		pNode->Close();
	}
}

} // End Namespace


// ===========================================================
int main(int argc, char *argv[])
{
	ZOTO::ZSPServer	server;

	if (argc < 2)
	{
		printf("Incorrect arguments\n");
		return -1;
	}

	int port = atoi(argv[1]);

#if defined(WIN32) || defined(_WINDOWS)		/* Windows platforms */
	WSADATA wsadata;
	WORD	wVer;
	wVer = MAKEWORD(2,0);
	if (WSAStartup(wVer, &wsadata) != 0)
    {
        printf("Unable to initialize winsock!\n");
        return -1;
    }
    else
        printf("Winsock initialized!\n");
#endif                                      /* End platform specific */

	if (server.Initialize(port) != true)
	{
		cerr << "Error initializing server" << endl;
#if defined(WIN32) || defined(_WINDOWS)		/* Windows platforms */
		WSACleanup();
#endif
		return -1;
	}

	server.MessageLoop();

#if defined(WIN32) || defined(_WINDOWS)		/* Windows platforms */
	WSACleanup();
#endif

	return 0;
}
