#include "ZSocket.h"
#include "qfile.h"
#include <map>

namespace ZOTO
{

class ZNode : public ZSocket
{
public:
	ZNode()
	{
		memset(buffer, '\0', sizeof(buffer));
		buf_len = 0;
		memset(remote_ip, '\0', sizeof(remote_ip));
		bAuthenticated = false;
		bReceivingFile = false;
	}

public:
	char		buffer[1024];
	int			buf_len;
	bool		bAuthenticated;
	char		remote_ip[256];
	ZUSHORT		remote_port;
	bool		bReceivingFile;
	QFile		m_File;
	long		m_lFileBytes;
};

typedef std::map<int, ZNode*> SocketMap;

class ZSPServer
{
public:
	ZSPServer() {m_bShutdown = false;}
	virtual ~ZSPServer();

public:
	bool	Initialize(ZUSHORT shPort);
	bool	MessageLoop();
	bool	ProcessData(ZNode *pNode);
	bool	ProcessAuth(ZNode *pNode);
	bool	ProcessVersion(ZNode *pNode);
	bool	ProcessFlag(ZNode *pNode);
	bool	ProcessFile(ZNode *pNode);
	bool	ProcessDone(ZNode *pNode);
	

private:
	void	Terminate();

private:
	ZSocket			m_ServSock;
	SocketMap		m_SockMap;
	bool			m_bShutdown;
};

} // End Namespace
