#include "plugin.h"
#include "../../zimageview.h"

static const char *zimageview_pixmap[] = {
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

ZImageViewPlugin::ZImageViewPlugin()
{
}

QStringList ZImageViewPlugin::keys() const
{
    QStringList list;
    list << "ZImageView";
    return list;
}

QWidget* ZImageViewPlugin::create( const QString &key, QWidget* parent, const char* name )
{
    if ( key == "ZImageView" )
		return new ZImageView( parent, name );
    return 0;
}

QString ZImageViewPlugin::group( const QString& feature ) const
{
    if ( feature == "ZImageView" )
		return "Views";
    return QString::null;
}

QIconSet ZImageViewPlugin::iconSet( const QString& ) const
{
    return QIconSet( QPixmap( zimageview_pixmap ) );
}

QString ZImageViewPlugin::includeFile( const QString& feature ) const
{
    if ( feature == "ZImageView" )
		return "zimageview.h";
    return QString::null;
}

QString ZImageViewPlugin::toolTip( const QString& feature ) const
{
    if ( feature == "ZImageView" )
		return "Image display widget";
    return QString::null;
}

QString ZImageViewPlugin::whatsThis( const QString& feature ) const
{
    if ( feature == "ZImageView" )
		return "A widget to display a list of images as thumbnails";
    return QString::null;
}

bool ZImageViewPlugin::isContainer( const QString& ) const
{
    return TRUE;
}


Q_EXPORT_PLUGIN( ZImageViewPlugin )
