---[ CONSTRAINTS ]------------------------------------------------
BEGIN;

-- ACCOUNT_ALBUM_PERMISSIONS
\echo account_album_permissions
ALTER TABLE account_album_permissions ADD CONSTRAINT owner_userid_fkey
	FOREIGN KEY (owner_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- ACCOUNT_IMAGE_PERMISSIONS
\echo account_image_permissions
ALTER TABLE account_image_permissions ADD CONSTRAINT owner_userid_fkey
	FOREIGN KEY (owner_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- ACCOUNT_PRICING
\echo account_pricing
ALTER TABLE account_pricing ADD CONSTRAINT upgrade_to_fkey
	FOREIGN KEY(upgrade_to) REFERENCES account_types(account_type_id)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE account_pricing ADD CONSTRAINT upgrade_from_fkey
	FOREIGN KEY(upgrade_from) REFERENCES account_types(account_type_id)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- ACTIVITY_LOG
\echo activity_log
ALTER TABLE activity_log ADD CONSTRAINT activity_type_fkey
	FOREIGN KEY (activity_type) REFERENCES activity_types(activity_id)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE activity_log ADD CONSTRAINT activity_userid_fkey
	FOREIGN KEY (activity_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE activity_log ADD CONSTRAINT owner_userid_fkey
	FOREIGN KEY (owner_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE activity_log ADD CONSTRAINT image_id_fkey
	FOREIGN KEY (image_id) REFERENCES user_images(image_id)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- COMMENTS
\echo comments
ALTER TABLE comments ADD CONSTRAINT image_id_fkey
	FOREIGN KEY (image_id) REFERENCES user_images(image_id)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE comments ADD CONSTRAINT commenting_userid_fkey
	FOREIGN KEY (commenting_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- FEATURED_ALBUMS
\echo featured_albums
ALTER TABLE featured_albums ADD CONSTRAINT album_id_fkey
	FOREIGN KEY (album_id) REFERENCES user_albums(album_id)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- FEATURED_MEDIA
\echo featured_media
ALTER TABLE featured_media ADD CONSTRAINT image_id_fkey
	FOREIGN KEY (image_id) REFERENCES user_images(image_id)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- STORAGE_ASSIGNMENTS
\echo storage_assignments
ALTER TABLE storage_assignments ADD CONSTRAINT hostname_fkey 
	FOREIGN KEY (hostname) REFERENCES media_storage_servers(hostname)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- USER_ALBUM_PERMISSIONS
\echo user_album_permissions
ALTER TABLE user_album_permissions ADD CONSTRAINT album_id_fkey
	FOREIGN KEY(album_id) REFERENCES user_albums(album_id)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- USER_ALBUM_SET_XREF_ALBUMS
\echo user_album_set_xref_albums
ALTER TABLE user_album_set_xref_albums ADD CONSTRAINT set_id_fkey
	FOREIGN KEY(set_id) REFERENCES user_album_sets(set_id)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE user_album_set_xref_albums ADD CONSTRAINT album_id_fkey
	FOREIGN KEY(album_id) REFERENCES user_albums(album_id)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- USER_ALBUM_SETS
\echo user_album_sets
ALTER TABLE user_album_sets ADD CONSTRAINT owner_userid_fkey
	FOREIGN KEY (owner_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE user_album_sets ADD CONSTRAINT main_image_id_fkey
	FOREIGN KEY (main_image_id) REFERENCES user_images (image_id)
	ON UPDATE CASCADE ON DELETE SET NULL;

-- USER_ALBUM_XREF_USER_IMAGES
\echo user_album_xref_user_images
ALTER TABLE user_album_xref_user_images ADD CONSTRAINT album_id_fkey
	FOREIGN KEY(album_id) REFERENCES user_albums(album_id)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE user_album_xref_user_images ADD CONSTRAINT image_id_fkey
	FOREIGN KEY(image_id) REFERENCES user_images(image_id)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- USER_ALBUMS
\echo user_albums
ALTER TABLE user_albums ADD CONSTRAINT owner_userid_fkey
	FOREIGN KEY(owner_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE user_albums ADD CONSTRAINT main_image_id_fkey
	FOREIGN KEY (main_image_id) REFERENCES user_images (image_id)
	ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE user_albums ADD CONSTRAINT unique_title_user
	UNIQUE (title, owner_userid);

-- USER_CONTACT_GROUP_XREF_USERS
\echo user_contact_group_xref_users
ALTER TABLE user_contact_group_xref_users ADD CONSTRAINT group_id_fkey
	FOREIGN KEY(group_id) REFERENCES user_contact_groups
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE user_contact_group_xref_users ADD CONSTRAINT member_userid_fkey
	FOREIGN KEY(member_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- USER_CONTACT_GROUPS
\echo user_contact_groups
ALTER TABLE user_contact_groups ADD CONSTRAINT owner_userid_fkey
	FOREIGN KEY(owner_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE user_contact_groups ADD CONSTRAINT unique_userid_name
	UNIQUE (owner_userid, group_name);
ALTER TABLE user_contact_groups ADD CONSTRAINT group_type
	CHECK (group_type::text IN ('G', 'U'));

-- USER_EXPORTS
\echo user_exports
ALTER TABLE user_exports ADD CONSTRAINT owner_userid_fkey
	FOREIGN KEY(owner_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE user_exports ADD CONSTRAINT service_id_fkey
	FOREIGN KEY(service_id) REFERENCES export_services(service_id)
	ON UPDATE CASCADE ON DELETE SET NULL;

-- USER_GALLERY_XREF_USER_ALBUM

-- USER_HOMEPAGE_WIDGETS
\echo user_homepage_widgets
ALTER TABLE user_homepage_widgets ADD CONSTRAINT owner_userid_fkey
	FOREIGN KEY (owner_userid) REFERENCES users (userid)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE user_homepage_widgets ADD CONSTRAINT widget_type_id_fkey
	FOREIGN KEY (widget_type_id) REFERENCES homepage_widget_types (widget_type_id)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- USER_IMAGE_PERMISSIONS
\echo user_image_permissions
ALTER TABLE user_image_permissions ADD CONSTRAINT image_id_fkey
	FOREIGN KEY(image_id) REFERENCES user_images(image_id)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- USER_IMAGE_TAGS
\echo user_image_tags
ALTER TABLE user_image_tags ADD CONSTRAINT tag_userid_fkey
	FOREIGN KEY(tag_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE user_image_tags ADD CONSTRAINT image_id_fkey
	FOREIGN KEY(image_id) REFERENCES user_images(image_id)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- USER_IMAGES
\echo user_images
ALTER TABLE user_images ADD CONSTRAINT image_id_unique
	UNIQUE (image_id);
ALTER TABLE user_images ADD CONSTRAINT owner_userid_fkey 
	FOREIGN KEY(owner_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE user_images ADD CONSTRAINT media_source_fkey 
	FOREIGN KEY(img_source) REFERENCES media_sources(source_id)
	ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE user_images ADD CONSTRAINT media_exists_validation
	CHECK (zoto_media_exists(media_id::text));

-- USER_MESSAGES
\echo user_messages
ALTER TABLE user_messages ADD CONSTRAINT from_userid_fkey
	FOREIGN KEY(from_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE user_messages ADD CONSTRAINT to_userid_fkey
	FOREIGN KEY(to_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- USER_PRINT_QUEUE
\echo user_print_queue
ALTER TABLE user_print_queue ADD CONSTRAINT owner_userid_fkey
	FOREIGN KEY(owner_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE user_print_queue ADD CONSTRAINT image_id_fkey
	FOREIGN KEY(image_id) REFERENCES user_images(image_id)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- USER_SETTINGS
\echo user_settings
ALTER TABLE user_settings ADD CONSTRAINT owner_userid_fkey
	FOREIGN KEY(owner_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- USER_TOKENS
\echo user_tokens
ALTER TABLE user_tokens ADD CONSTRAINT owner_userid_fkey
	FOREIGN KEY(owner_userid) REFERENCES users(userid)
	ON UPDATE CASCADE ON DELETE CASCADE;

-- USERS
\echo users
ALTER TABLE users ADD CONSTRAINT partner_id_fkey 
	FOREIGN KEY(partner_id) REFERENCES partners(partner_id)
	ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT account_type_fkey
	FOREIGN KEY(account_type_id) REFERENCES account_types(account_type_id)
	ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT account_statuse_fkey
	FOREIGN KEY(account_status_id) REFERENCES 
	account_statuses(account_status_id)
	ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT username_validation 
	CHECK (zoto_username_is_valid(username::text));
ALTER TABLE users ADD CONSTRAINT email_validation 
	CHECK (zoto_email_is_valid(email::text));
ALTER TABLE users ADD CONSTRAINT email_unique UNIQUE (email);
ALTER TABLE users ADD CONSTRAINT gender check (gender::text in ('M','F','U'));
ALTER TABLE users ADD CONSTRAINT preferred_notification check 
	(preferred_notification::text in ('D','I'));

END;
