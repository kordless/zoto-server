---[ INDICES ]-----------------------------------------------------------------
BEGIN;

-- ACCOUNT_ALBUM_PERMISSIONS
CREATE INDEX account_album_permissions_view_groups_idx
	ON account_album_permissions USING gist (view_groups gist__int_ops);
CREATE INDEX account_album_permissions_comment_groups_idx
	ON account_album_permissions USING gist (comment_groups gist__int_ops);

-- ACCOUNT_IMAGE_PERMISSIONS
CREATE INDEX account_image_permissions_view_groups_idx
	ON account_image_permissions USING gist (view_groups gist__int_ops);
CREATE INDEX account_image_permissions_tag_groups_idx
	ON account_image_permissions USING gist (tag_groups gist__int_ops);
CREATE INDEX account_image_permissions_comment_groups_idx
	ON account_image_permissions USING gist (comment_groups gist__int_ops);
CREATE INDEX account_image_permissions_print_groups_idx
	ON account_image_permissions USING gist (print_groups gist__int_ops);
CREATE INDEX account_image_permissions_download_groups_idx
	ON account_image_permissions USING gist (download_groups gist__int_ops);
CREATE INDEX account_image_permissions_geotag_groups_idx
	ON account_image_permissions USING gist (geotag_groups gist__int_ops);
CREATE INDEX account_image_permissions_vote_groups_idx
	ON account_image_permissions USING gist (vote_groups gist__int_ops);
CREATE INDEX account_image_permissions_blog_groups_idx
	ON account_image_permissions USING gist (blog_groups gist__int_ops);

-- ACTIVITY_LOG
CREATE INDEX activity_log_entry_date_idx ON activity_log (entry_date);

-- COMMENTS
CREATE INDEX comments_image_id_idx ON comments (image_id);
CREATE INDEX comments_commenting_userid_idx ON comments (commenting_userid);
CREATE INDEX comments_date_created_idx ON comments (date_created);

-- FEATURED_ALBUMS

-- FEATURED_MEDIA

-- STORAGE_ASSIGNMENTS
CREATE INDEX storage_assignments_media_id_idx ON storage_assignments (media_id);

-- USER_ALBUM_PERMISSIONS
CREATE INDEX user_album_permissions_view_groups_idx
	ON user_album_permissions USING gist (view_groups gist__int_ops);
CREATE INDEX user_album_permissions_comment_groups_idx
	ON user_album_permissions USING gist (comment_groups gist__int_ops);

-- USER_ALBUM_SET_XREF_ALBUMS
CREATE INDEX user_album_set_xref_albums_set_id_idx ON user_album_set_xref_albums (set_id);
CREATE INDEX user_album_set_xref_albums_album_id_idx ON user_album_set_xref_albums (album_id);

-- USER_ALBUM_SETS
CREATE INDEX user_album_sets_owner_userid_idx ON user_album_sets (owner_userid);

-- USER_ALBUM_XREF_USER_IMAGES
CREATE INDEX user_album_xref_user_images_album_id_idx ON user_album_xref_user_images (album_id);
CREATE INDEX user_album_xref_user_images_image_id_idx ON user_album_xref_user_images (image_id);

-- USER_ALBUMS
CREATE INDEX user_albums_title_idx ON user_albums (title);
CREATE INDEX user_albums_owner_userid_idx ON user_albums (owner_userid);
CREATE INDEX user_albums_album_id_idx ON user_albums (album_id);

-- USER_CONTACT_GROUP_XREF_USERS
CREATE INDEX user_contact_group_xref_users_member_userid_idx ON user_contact_group_xref_users (member_userid);
CREATE INDEX user_contact_group_xref_users_group_id_idx ON user_contact_group_xref_users (group_id);

-- USER_CONTACT_GROUPS
CREATE INDEX user_contact_groups_owner_userid_idx ON user_contact_groups (owner_userid);
CREATE INDEX user_contact_groups_group_name_idx ON user_contact_groups (group_name);
CREATE INDEX user_contact_groups_group_type_idx ON user_contact_groups (group_type);

-- USER_EXPORTS
CREATE INDEX user_exports_owner_userid_idx ON user_exports (owner_userid);

-- USER_GALLERY_XREF_USER_ALBUM
CREATE INDEX user_gallery_xref_user_album_album_id_idx ON user_gallery_xref_user_album (album_id);
CREATE INDEX user_gallery_xref_user_album_name_idx ON user_gallery_xref_user_album (gallery_name);

-- USER_IMAGE_PERMISSIONS
CREATE INDEX user_image_permissions_image_id_idx ON user_image_permissions (image_id);
CREATE INDEX user_image_permissions_view_groups_idx ON user_image_permissions USING gist (view_groups gist__int_ops);
CREATE INDEX user_image_permissions_tag_groups_idx ON user_image_permissions USING gist (tag_groups gist__int_ops);
CREATE INDEX user_image_permissions_comment_groups_idx ON user_image_permissions USING gist (comment_groups gist__int_ops);
CREATE INDEX user_image_permissions_print_groups_idx ON user_image_permissions USING gist (print_groups gist__int_ops);
CREATE INDEX user_image_permissions_download_groups_idx ON user_image_permissions USING gist (download_groups gist__int_ops);
CREATE INDEX user_image_permissions_geotag_groups_idx ON user_image_permissions USING gist (geotag_groups gist__int_ops);
CREATE INDEX user_image_permissions_vote_groups_idx ON user_image_permissions USING gist (vote_groups gist__int_ops);
CREATE INDEX user_image_permissions_blog_groups_idx ON user_image_permissions USING gist (blog_groups gist__int_ops);

-- USER_IMAGE_TAGS
CREATE INDEX user_image_tags_tag_name_idx ON user_image_tags (tag_name);
CREATE INDEX user_image_tags_date_added_idx ON user_image_tags (date_added);
CREATE INDEX user_image_tags_image_id_idx ON user_image_tags (image_id);
CREATE INDEX user_image_tags_tag_userid_idx ON user_image_tags (tag_userid);

-- USER_IMAGES
CREATE INDEX user_images_title_description_ftidx ON user_images USING gist (fulltext_index);
CREATE INDEX user_images_tag_ftidx ON user_images USING gist (ft_tag_index);
CREATE INDEX user_images_title_idx ON user_images (title);
CREATE INDEX user_images_date_uploaded_idx ON user_images (date_uploaded);
CREATE INDEX user_images_date_uploaded_year_idx ON user_images (date_part('year'::text, date_uploaded));
CREATE INDEX user_images_date_uploaded_month_idx ON user_images (date_part('month'::text, date_uploaded));
CREATE INDEX user_images_date_uploaded_day_idx ON user_images (date_part('day'::text, date_uploaded));
CREATE INDEX user_images_date_taken_idx ON user_images (date);
CREATE INDEX user_images_date_taken_year_idx ON user_images (date_part('year'::text, date));
CREATE INDEX user_images_date_taken_month_idx ON user_images (date_part('month'::text, date));
CREATE INDEX user_images_date_taken_day_idx ON user_images (date_part('day'::text, date));
CREATE INDEX user_images_user_images_media_id_idx ON user_images (media_id);
CREATE INDEX user_images_owner_userid_idx ON user_images(owner_userid);
CREATE INDEX user_images_status_idx ON user_images (owner_userid, status);

-- USER_MESSAGES
CREATE INDEX user_messages_from_userid_idx ON user_messages (from_userid);
CREATE INDEX user_messages_to_userid_idx ON user_messages (to_userid);
CREATE INDEX user_messages_sent_status_idx ON user_messages (sent_status);
CREATE INDEX user_messages_received_status_idx ON user_messages (received_status);

-- USER_PRINT_QUEUE
CREATE INDEX user_print_queue_owner_userid_idx ON user_print_queue (owner_userid);
CREATE INDEX user_print_queue_image_id_idx ON user_print_queue (image_id);

-- USER_SETTINGS
CREATE INDEX user_settings_owner_userid_idx ON user_settings (owner_userid);

-- USERS
CREATE INDEX users_username_idx ON users (username);
CREATE INDEX users_email_idx ON users (email);

END;
