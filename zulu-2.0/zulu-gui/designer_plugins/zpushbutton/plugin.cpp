#include "plugin.h"
#include "../../ZPushButton.h"

static const char *zpushbutton_pixmap[] = {
    "22 22 8 1",
    "  c Gray100",
    ". c Gray97",
    "X c #4f504f",
    "o c #00007f",
    "O c Gray0",
    "+ c none",
    "@ c Gray0",
    "# c Gray0",
    "++++++++++++++++++++++",
    "++++++++++++++++++++++",
    "++++++++++++++++++++++",
    "++++++++++++++++++++++",
    "+OOOOOOOOOOOOOOOOOOOO+",
    "OOXXXXXXXXXXXXXXXXXXOO",
    "OXX.          OO OO  O",
    "OX.      oo     O    O",
    "OX.      oo     O   .O",
    "OX  ooo  oooo   O    O",
    "OX    oo oo oo  O    O",
    "OX  oooo oo oo  O    O",
    "OX oo oo oo oo  O    O",
    "OX oo oo oo oo  O    O",
    "OX  oooo oooo   O    O",
    "OX            OO OO  O",
    "OO..................OO",
    "+OOOOOOOOOOOOOOOOOOOO+",
    "++++++++++++++++++++++",
    "++++++++++++++++++++++",
    "++++++++++++++++++++++",
    "++++++++++++++++++++++"
};

ZPushButtonPlugin::ZPushButtonPlugin()
{
}

QStringList ZPushButtonPlugin::keys() const
{
    QStringList list;
    list << "ZPushButton";
    return list;
}

QWidget* ZPushButtonPlugin::create( const QString &key, QWidget* parent, const char* name )
{
    if ( key == "ZPushButton" )
		return new ZPushButton( parent, name );
    return 0;
}

QString ZPushButtonPlugin::group( const QString& feature ) const
{
    if ( feature == "ZPushButton" )
		return "Buttons";
    return QString::null;
}

QIconSet ZPushButtonPlugin::iconSet( const QString& ) const
{
    return QIconSet( QPixmap( zpushbutton_pixmap ) );
}

QString ZPushButtonPlugin::includeFile( const QString& feature ) const
{
    if ( feature == "ZPushButton" )
		return "ZPushButton.h";
    return QString::null;
}

QString ZPushButtonPlugin::toolTip( const QString& feature ) const
{
    if ( feature == "ZPushButton" )
		return "Custom Zulu button";
    return QString::null;
}

QString ZPushButtonPlugin::whatsThis( const QString& feature ) const
{
    if ( feature == "ZPushButton" )
		return "A that can display an icon as well as text";
    return QString::null;
}

bool ZPushButtonPlugin::isContainer( const QString& ) const
{
    return FALSE;
}


Q_EXPORT_PLUGIN( ZPushButtonPlugin )
