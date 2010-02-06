#!/bin/bash

for file in /zoto/aztk/log/*log; do
	cat /dev/null > $file;
done
