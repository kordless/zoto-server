TEMPLATE = lib
LANGUAGE = C++
TARGET   = zimageview

SOURCES  += plugin.cpp ../../zimageview.cpp ../../zimageviewitem.cpp
HEADERS  += plugin.h ../../zimageview.h ../../zimageviewitem.h
DESTDIR   = $(QTDIR)/plugins/designer

target.path=$(QTDIR)/plugins/designer

INSTALLS    += target
CONFIG      += qt warn_on release plugin
INCLUDEPATH += $(QTDIR)/plugins/designer
DBFILE       = plugin.db