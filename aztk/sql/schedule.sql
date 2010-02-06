CREATE TABLE schedule (
	schedule_id serial not null,
	api varchar(100) not null,
	method varchar(100) not null,
	remark text,
	frequency varchar(20) not null,
	frequency_timed int4,
	timeout int not null,
	on_startup boolean not null default 'F',
	on_shutdown boolean not null default 'F',
	last_execution datetime,
	last_execution_time int,
	status varchar(20)
	error_message text not null,
	profile varchar(255) not null,
	CONSTRAINT shedule_pkey PRIMARY KEY (schedule_id),
	CONSTRAINT unique_errors UNIQUE (profile, api, method),
	CONSTRAINT frequency_check check (frequency::text in ('timed','daily','weekly')),
	CONSTRAINT status_check check (status::text in ('normal','running','late','error'))
);
