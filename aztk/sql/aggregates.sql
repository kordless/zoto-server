---[ AGGREGATES ]-------------------------------------------------
BEGIN;

CREATE AGGREGATE zoto_array_accum (
	sfunc = array_append,
	basetype = anyelement,
	stype = anyarray,
	initcond = '{}'
);

END;
