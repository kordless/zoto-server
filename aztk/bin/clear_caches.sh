#!/bin/bash
/etc/init.d/squid stop
echo "Zeroing swap state..."
echo " " > /var/cache/squid/swap.state
echo "Cleaning js cache..."
rm -rf /var/lib/lighttpd/cache/compress/js
echo "Cleaning css cache..."
rm -rf /var/lib/lighttpd/cache/compress/css
/etc/init.d/squid start
