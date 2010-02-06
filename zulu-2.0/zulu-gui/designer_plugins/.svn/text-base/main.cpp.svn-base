#include <qapplication.h>
#include "zimageview.h"

int main(int argc, char *argv[])
{
	QApplication a(argc, argv);

	ZImageView *v = new ZImageView(NULL, "Blah");

	v->show();
	a.connect( &a, SIGNAL( lastWindowClosed() ), &a, SLOT( quit() ) );
	return a.exec();
}
