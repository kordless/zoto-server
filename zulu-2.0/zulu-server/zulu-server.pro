TEMPLATE	= app
LANGUAGE	= C++

CONFIG	+= qt warn_on release console

DEFINES += TRACE_ENABLE

unix:LIBS += -lzulu -L../zulu-lib
win32:LIBS += -lzulu -L..\zulu-lib

INCLUDEPATH	+= ../common ../zulu-lib/include

HEADERS	+= zsp_server.h

SOURCES	+= zsp_server.cpp

TARGET = zulu-server

unix {
  UI_DIR = .ui
  MOC_DIR = .moc
  OBJECTS_DIR = .obj
}
