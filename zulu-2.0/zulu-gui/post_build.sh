#!/bin/bash
VOL_NAME="Zoto Uploader"
APP_NAME=${VOL_NAME}.app
DMG_NAME=${VOL_NAME}\ 2.5.3.dmg
rm -rf "${APP_NAME}"
rm -rf "${DMG_NAME}"
echo "Creating Frameworks directory..."
mkdir zulu.app/Contents/Frameworks
echo "Processing dynamic libraries..."
LIBS=`otool -L zulu.app/Contents/MacOS/zulu | awk '{print $1}' | grep /sw/lib`
LIB_LIST=`for i in $LIBS; do eval basename $i; done`
for i in $LIB_LIST;
do
	echo "   Processing $i...";
	cp /sw/lib/$i zulu.app/Contents/Frameworks;
	install_name_tool -id @executable_path/../Frameworks/$i zulu.app/Contents/Frameworks/$i
	install_name_tool -change /sw/lib/$i @executable_path/../Frameworks/$i zulu.app/Contents/MacOS/zulu
done
mv zulu.app "${APP_NAME}"
echo -n "Creating disk image"
hdiutil create -fs HFS+ -volname "${VOL_NAME}" -srcfolder "${APP_NAME}" "${DMG_NAME}"
