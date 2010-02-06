---[ TABLES ]-----------------------------------------------------------------
BEGIN;

CREATE TABLE account_album_permissions (
	owner_userid int4,
	view_flag int4 default 0,
	view_groups int4[],
	comment_flag int4 default 0,
	comment_groups int4[],
	updated timestamp DEFAULT current_timestamp,
	PRIMARY KEY (owner_userid)
);

CREATE TABLE account_image_permissions (
	owner_userid int4,
	date_updated timestamp NOT NULL default current_timestamp,
	view_flag int4 default 0,
	view_groups int4[],
	tag_flag int4 default 0,
	tag_groups int4[],
	comment_flag int4 default 0,
	comment_groups int4[],
	print_flag int4 default 0,
	print_groups int4[],
	download_flag int4 default 0,
	download_groups int4[],
	geotag_flag int4 default 0,
	geotag_groups int4[],
	vote_flag int4 default 0,
	vote_groups int4[],
	blog_flag int4 default 0,
	blog_groups int4[],
	PRIMARY KEY (owner_userid)
);

CREATE TABLE account_pricing (
	upgrade_from int4 NOT NULL,
	upgrade_to int4 NOT NULL,
	days_til_expire int NOT NULL,
	price numeric(7,2) NOT NULL,
	description text NOT NULL,
	PRIMARY KEY (upgrade_from, upgrade_to, days_til_expire)
);

CREATE TABLE account_statuses (
	account_status_id int4 NOT NULL,
	name varchar(255),
	login boolean NOT NULL default 'T',
	browse boolean NOT NULL default 'T',
	"index" boolean NOT NULL default 'T',
	aggregate boolean NOT NULL default 'T',
	"default" boolean NOT NULL default 'F',
	PRIMARY KEY (account_status_id)
);

CREATE TABLE account_types (
	account_type_id int4 NOT NULL,
	name varchar(32) NOT NULL,
	remark text,
	quota_KB int8 NOT NULL,
	is_default boolean NOT NULL default 'F',
	available boolean NOT NULL default 'T',
	PRIMARY KEY (account_type_id)
);

CREATE TABLE activity_log (
	entry_id serial NOT NULL,
	entry_date timestamp NOT NULL default current_timestamp,
	activity_userid int4,
	activity_type int4 NOT NULL,
	image_id int4,
	owner_userid int4,
	extra_text text,
	extra_int int4,
	extra_boolean boolean,
	PRIMARY KEY (entry_id)
);

CREATE TABLE activity_types (
	activity_id serial NOT NULL,
	activity_name varchar(255) NOT NULL,
	PRIMARY KEY (activity_id)
);

CREATE TABLE api_keys (
	api_key varchar(32) NOT NULL,
	owner varchar(255) NOT NULL,
	app_name varchar(255) NOT NULL,
	email varchar(255) NOT NULL,
	url varchar(255) NOT NULL,
	created timestamp NOT NULL default current_timestamp,
	PRIMARY KEY (api_key)
);

CREATE TABLE comments (
	comment_id serial NOT NULL,
	image_id int4,
	commenting_userid int4,
	ip_address inet NOT NULL,
	subject text,
	body text NOT NULL,
	date_created timestamp NOT NULL default current_timestamp,
	visible boolean NOT NULL default 'T',
	PRIMARY KEY (comment_id)
);

CREATE TABLE export_services (
	service_id int4 NOT NULL,
	service_name varchar (50) NOT NULL DEFAULT '',
	PRIMARY KEY (service_id)
);

CREATE TABLE featured_albums (
	album_id int4 NOT NULL,
	date_added timestamp NOT NULL default current_timestamp,
	PRIMARY KEY (album_id)
);

CREATE TABLE featured_media (
	image_id int4,
	date_added timestamp NOT NULL default current_timestamp,
	PRIMARY KEY (image_id)
);

CREATE TABLE homepage_widget_types (
	widget_type_id int4,
	widget_name varchar(50) NOT NULL,
	user_controllable boolean DEFAULT true,
	public boolean DEFAULT true,
	PRIMARY KEY (widget_type_id)
);

CREATE TABLE matviews (
	mv_name NAME NOT NULL,
	v_name NAME NOT NULL,
	last_refresh TIMESTAMP WITH TIME ZONE,
	PRIMARY KEY (mv_name)
);

CREATE TABLE media_sources (
	source_id serial NOT NULL,
	source_name varchar(255) NOT NULL,
	PRIMARY KEY (source_id)
);

CREATE TABLE media_storage_servers (
	hostname varchar(255) NOT NULL,
	ip_address inet NOT NULL,
	apache_version varchar(32),
	php_version varchar(32),
	postgres_version varchar(32),
	python_version varchar(32),
	twisted_version varchar(32),
	uptime varchar(64),
	load_average numeric(5,2),
	storage_bytes_total int8,
	storage_bytes_free int8,
	storage_mb_total int4,
	storage_mb_free int4,
	percent_storage_used numeric(15,12),
	percent_storage_free numeric(15,12),
	updated timestamp NOT NULL default current_timestamp,
	PRIMARY KEY (hostname)
);

CREATE TABLE media_types (
	media_type_id serial NOT NULL,
	media_name varchar(255) NOT NULL,
	PRIMARY KEY (media_type_id)
);

CREATE TABLE partners (
	partner_id serial NOT NULL,
	name varchar(255),
	PRIMARY KEY (partner_id)
);

CREATE TABLE payment_transactions (
        transaction_id varchar(50) NOT NULL,
        datetime timestamp NOT NULL default current_timestamp,
        username varchar(20) NOT NULL,
	userid int4,
        amount_paid numeric(7,2) NOT NULL,
        avs_code varchar(5) NOT NULL, 
        cvv2_code varchar(5) NOT NULL,
        processing_node varchar(50) NOT NULL,
	PRIMARY KEY (transaction_id)
);

CREATE TABLE storage_assignments (
	hostname varchar(255) NOT NULL,
	media_id varchar(32) NOT NULL,
	PRIMARY KEY (hostname, media_id)
);

CREATE TABLE user_album_permissions (
	album_id int4,
	view_flag int4 default 4,
	view_groups int4[],
	comment_flag int4 default 4,
	comment_groups int4[],
	updated timestamp DEFAULT current_timestamp,
	PRIMARY KEY (album_id)
);

CREATE TABLE user_album_set_xref_albums (
	set_id int4,
	album_id int4,
	album_idx int4 NOT NULL,
	PRIMARY KEY (set_id, album_id)
);

CREATE TABLE user_album_sets (
	set_id serial NOT NULL,
	owner_userid int4,
	title text,
	description text,
	main_image_id int4,
	updated timestamp DEFAULT current_timestamp,
	PRIMARY KEY (set_id)
);

CREATE TABLE user_album_templates (
	template_id serial NOT NULL,
	title text,
	description text,
	sample_image bytea,
	data bytea,
	stylesheet bytea,
	updated timestamp DEFAULT current_timestamp,
	PRIMARY KEY (template_id)
);

CREATE TABLE user_album_xref_user_images (
	album_id int4,
	image_id int4,
	media_idx int4 NOT NULL,
	updated timestamp DEFAULT current_timestamp,
	PRIMARY KEY (album_id, image_id)
);

CREATE TABLE user_albums (
	album_id serial NOT NULL,
	owner_userid int4,
	title text,
	description text,
	main_image_id int4,
	main_image_size int4 NOT NULL default 45,
	per_page int4 NOT NULL default 15,
	order_by varchar(20) NOT NULL default 'date_uploaded',
	order_dir varchar(4) NOT NULL default 'desc',
	thumb_size int4 NOT NULL default 28,
	template_id int4 NOT NULL default 1,
	serialized_template_options text,
	updated timestamp DEFAULT current_timestamp,
	PRIMARY KEY (album_id)
);

CREATE TABLE user_contact_group_xref_users (
	group_id int4,
	member_userid int4,
	date_added timestamp NOT NULL DEFAULT current_timestamp,
	PRIMARY KEY (group_id, member_userid)
);

CREATE TABLE user_contact_groups (
	group_id serial NOT NULL,
	owner_userid int4,
	group_name varchar(32) NOT NULL,
	group_type char(1) NOT NULL DEFAULT 'G',
	date_added timestamp NOT NULL default current_timestamp,
	date_modified timestamp NOT NULL default current_timestamp,
	PRIMARY KEY (group_id)
);	

CREATE TABLE user_exports (
	owner_userid int4,
	export_id serial NOT NULL, -- system generated id
	export_name varchar(50) DEFAULT '', -- user defined name for this export
	service_id int4,
	username varchar(50) DEFAULT '',
	password varchar(50) DEFAULT '',
	service_url varchar(255) DEFAULT '',
	service_extra varchar(255) DEFAULT '',
	updated timestamp default current_timestamp,
	PRIMARY KEY (owner_userid, export_id)
);

CREATE TABLE user_gallery_xref_user_album (
	album_id int4 REFERENCES user_albums (album_id) ON DELETE CASCADE,
	gallery_name varchar(255) NOT NULL,
	date_updated timestamp NOT NULL DEFAULT current_timestamp,
	PRIMARY KEY (gallery_name, album_id)
);

CREATE TABLE user_homepage_widgets (
	owner_userid int4 NOT NULL,
	widget_id serial NOT NULL,
	widget_type_id int4 NOT NULL,
	options text DEFAULT '(dp1\n.',
	col int4 NOT NULL,
	idx int4 NOT NULL,
	PRIMARY KEY (owner_userid, widget_id)
);

CREATE TABLE user_image_permissions (
	image_id int4,
	date_updated timestamp NOT NULL default current_timestamp,
	view_flag int4 default 4,
	view_groups int4[],
	tag_flag int4 default 4,
	tag_groups int4[],
	comment_flag int4 default 4,
	comment_groups int4[],
	print_flag int4 default 4,
	print_groups int4[],
	download_flag int4 default 4,
	download_groups int4[],
	geotag_flag int4 default 4,
	geotag_groups int4[],
	vote_flag int4 default 4,
	vote_groups int4[],
	blog_flag int4 default 4,
	blog_groups int4[],
	PRIMARY KEY (image_id)
);

CREATE TABLE user_image_tags (
	image_id int4,
	tag_name text NOT NULL,
	tag_userid int4,
	date_added timestamp NOT NULL default current_timestamp,
	PRIMARY KEY (image_id, tag_userid, tag_name)
);

CREATE TABLE user_images (
	media_id varchar(32) NOT NULL,
	image_id serial NOT NULL,
	owner_userid int4,
	title varchar(255),
	filename text,
	description text,
	date_uploaded timestamp NOT NULL default current_timestamp,
	date timestamp,
	last_modified timestamp,
	status int4 NOT NULL default 0, -- 0 = inactive, 1 = active, more to be added later
	camera_make varchar(100),
	camera_model varchar(100),
	fstop int4[],
	exposure_time int4[],
	focal_length int4[],
	iso_speed int4,
	rotate_bit boolean,
	flash_fired boolean,
	original_width int2,
	original_height int2,
	current_width int2,
	current_height int2,
	size_B int8 NOT NULL, -- original file size in bytes
	img_source int4 NOT NULL, -- reference to data_sources table
	license int4,
	gps_location point,
	gps_altitude_m int4, -- altitude in meters
	total_views int4,
	last_viewed timestamp,
	fulltext_index tsvector,
	ft_tag_index tsvector,
	PRIMARY KEY (image_id)
);

CREATE TABLE user_messages (
	message_id serial NOT NULL,
	from_userid int4,
	to_userid int4,
	subject varchar (255) DEFAULT '',
	body text,
	sent_status int4,
	received_status int4,
	date_updated timestamp NOT NULL default current_timestamp,
	PRIMARY KEY (message_id)
);

CREATE TABLE user_print_queue (
	owner_userid int4 NOT NULL,
	image_id int4 NOT NULL,
	date_added timestamp NOT NULL default current_timestamp,
	PRIMARY KEY (owner_userid, image_id)
);

CREATE TABLE user_settings (
	owner_userid int4,
	date_updated timestamp NOT NULL DEFAULT current_timestamp,
	email_upload_key varchar(32),
	timezone int2 DEFAULT -99,
	location varchar(64),
	favorite_camera varchar(32),
	public_email int2 DEFAULT 3,
	link1 varchar(64),
	link2 varchar(64),
	link3 varchar(64),
	auto_allow int2 DEFAULT 2,
	is_tag_limited boolean DEFAULT 'T',
	tag_limit int2 DEFAULT 100,
	tag_sort int2 DEFAULT 0,
	PRIMARY KEY (owner_userid)
);

CREATE TABLE user_tokens (
	owner_userid int4 NOT NULL,
	user_token char(32) NOT NULL,
	password_token char(32) NOT NULL,
	expires timestamp NOT NULL,
	PRIMARY KEY (owner_userid)
);

CREATE TABLE users (
	userid serial NOT NULL,
	username varchar(20) NOT NULL,
	password varchar(32) NOT NULL,
	email varchar(255) NOT NULL,
	email_hash varchar(32) DEFAULT '',
	partner_id int4 NOT NULL,
	account_type_id int4 NOT NULL,
	account_status_id int4 NOT NULL,
	first_name varchar(64),
	last_name varchar(64),
	gender char(1) default 'U',
	birthday date,
	email_upload_key varchar(32),
	last_login timestamp,
	account_expires date,
	date_created timestamp NOT NULL default current_timestamp,
	avatar_id varchar(32),
	bio text,
	flags int4,
	successful_invites int2 NOT NULL default 0,
	extra_storage_MB int4 NOT NULL default 0,
	preferred_notification char(1) default 'I',
	preferred_language char(2) NOT NULL default 'en',
	preferred_date_format char(6) NOT NULL default 'SQLDMY',
	address1 varchar(100),
	address2 varchar(100),
	city varchar(50),
	state varchar(2),
	province varchar(50),
	country varchar(2),
	zip varchar(10),
	PRIMARY KEY (userid)
);

END;
