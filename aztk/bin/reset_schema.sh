#!/bin/bash

CORE_DB=aztk_core
FUNCTIONS_INIT=/zoto/aztk/sql/functions.sql
SQL_INIT=/zoto/aztk/sql/aztk.sql

echo "Dropping tiberius"
dropdb -h tiberius $CORE_DB
createdb -E UTF8 -O aztk -h tiberius $CORE_DB

echo "Dropping cato"
dropdb -h cato $CORE_DB
createdb -E UTF8 -O aztk -h cato $CORE_DB

#echo "Dropping invictus"
#dropdb -h invictus $CORE_DB
#createdb -E UTF8 -h invictus $CORE_DB

cat $FUNCTIONS_INIT | psql -U root -h tiberius $CORE_DB
cat $FUNCTIONS_INIT | psql -U root -h cato $CORE_DB
cat $SQL_INIT | psql -U aztk -h tiberius $CORE_DB
cat $SQL_INIT | psql -U aztk -h cato $CORE_DB
