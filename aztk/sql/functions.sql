---[ FUNCTIONS ]--------------------------------------------------
BEGIN;

/*********************************************************************************
 * zoto_update_node_stats()
 *
 * Updates the stats (disk usage, load, uptime, etc) for a node in the cluster.
 *
 * PARAMS:
 * 	arg_hostname                    - host to update stats for
 *	arg_ip_address                  - IP of the host
 *	arg_apache_version              - version of the apache server, if applicable
 *	arg_php_version                 - version of php, if applicable
 *	arg_postgres_version            - version of the postgres database
 *	arg_python_version              - version of python installed
 *	arg_twisted_version             - version of twisted installed
 *	arg_uptime                      - uptime reported by the system
 *	arg_load_average                - current average load reported by the system
 *	arg_storage_bytes_total         - total amount of storage on the system, in bytes
 *	arg_storage_bytes_bytes_free    - free space available on the system, in bytes
 *	arg_storage_mb_total            - total amount of storage on the system, in MB
 *	arg_storage_bytes_mb_free       - free space available on the system, in MB
 *	arg_percent_storage_used        - percentage of hard disk space used on the system
 *	arg_percent_storage_free        - percentage of hard disk space free on the system
 */
\echo zoto_update_node_stats()
CREATE OR REPLACE FUNCTION zoto_update_node_stats(arg_hostname varchar, 
	arg_ip_address inet, arg_apache_version varchar,
	arg_php_version varchar, arg_postgres_version varchar,
	arg_python_version varchar, arg_twisted_version varchar, 
	arg_uptime varchar, arg_load_average numeric(2), 
	arg_storage_bytes_total int8, arg_storage_bytes_free int8,
	arg_storage_mb_total int4, arg_storage_mb_free int4,
	arg_percent_storage_used numeric(10),
	arg_percent_storage_free numeric(10))
	RETURNS void AS
	$body$
	BEGIN
		INSERT INTO media_storage_servers VALUES (
			arg_hostname,
			arg_ip_address,
			arg_apache_version,
			arg_php_version,
			arg_postgres_version,
			arg_python_version,
			arg_twisted_version,
			arg_uptime,
			arg_load_average,
			arg_storage_bytes_total,
			arg_storage_bytes_free,
			arg_storage_mb_total,
			arg_storage_mb_free,
			arg_percent_storage_used,
			arg_percent_storage_free,
			current_timestamp
		);
		EXCEPTION
			WHEN unique_violation THEN
				UPDATE media_storage_servers SET
					ip_address=arg_ip_address,
					apache_version=arg_apache_version,
					php_version=arg_php_version,
					postgres_version=arg_postgres_version,
					python_version=arg_python_version,
					twisted_version=arg_twisted_version,
					uptime=arg_uptime,
					load_average=arg_load_average,
					storage_bytes_total=arg_storage_bytes_total,
					storage_bytes_free=arg_storage_bytes_free,
					storage_mb_total=arg_storage_mb_total,
					storage_mb_free=arg_storage_mb_free,
					percent_storage_used=arg_percent_storage_used,
					percent_storage_free=arg_percent_storage_free,
					updated=current_timestamp
				WHERE
					hostname=arg_hostname;
		/* do something creative 
		IF arg_load_average > 0.0 THEN
			RAISE INFO 'lode\'s high dude';
		END IF;
		*/
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_update_node_stats(varchar, inet, varchar, varchar, varchar, varchar, varchar, varchar, numeric, int8, int8, int4, int4, numeric, numeric) OWNER TO aztk;


/*********************************************************************************
 * zoto_media_exists()
 *
 * Checks to see if we have an instance of a given media stored anywhere in the
 * cluster.
 *
 * PARAMS:
 *	media   - id of the media being checked
 */
\echo zoto_media_exists()
CREATE OR REPLACE FUNCTION zoto_media_exists(media varchar)
	RETURNS boolean AS
	$body$
	BEGIN
		PERFORM hostname from storage_assignments WHERE media_id=media;
		RETURN FOUND;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_media_exists(varchar) OWNER TO aztk;

/*********************************************************************************
 * zoto_user_owns_image()
 *
 * Determines whether an user has uploaded (owns) an instace of an image.
 *
 * PARAMS:
 *	username    - user to check for ownership
 *	media       - id of the media to check
 */
\echo zoto_user_owns_image()
CREATE OR REPLACE FUNCTION zoto_user_owns_image(owner int4, media varchar) 
	RETURNS boolean AS
	$body$
	BEGIN
		IF media IS NULL THEN
			return 1;
		END IF;
		IF media = '' THEN
			return 1;
		END IF;
		PERFORM owner_userid FROM user_images WHERE
			owner_userid = owner AND
			media_id = media;
		RETURN FOUND;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_owns_image(int4, varchar) OWNER TO aztk;

/*********************************************************************************
 * zoto_can_serve_media()
 *
 * Checks to see if we can serve media for a particular user.
 *
 * PARAMS:
 *	owner       - User to check for servability
 *	media       - id of the media to check
 */
\echo zoto_can_serve_media()
CREATE OR REPLACE FUNCTION zoto_can_serve_media(owner int4, media varchar)
	RETURNS boolean AS
	$body$
	DECLARE
		work_rec RECORD;
	BEGIN
		IF media IS NULL OR media = '' THEN
			RETURN false;
		END IF;
		SELECT INTO work_rec
			account_expires
		FROM
			user_images t1
			JOIN users t2 ON (userid = owner_userid)
		WHERE
			owner_userid = owner AND
			image_id = zoto_get_image_id(owner, media)
		LIMIT
			1;
		IF NOT FOUND THEN
			RETURN false;
		ELSE
			IF work_rec.account_expires < now() THEN
				RETURN false;
			ELSE
				RETURN true;
			END IF;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_can_serve_media(int4, varchar) OWNER TO aztk;

/*********************************************************************************
 * zoto_get_user_stats()
 *
 * Gets statistical information about a user.
 *
 * PARAMS:
 *  userid              - User to get stats for
 */
\echo zoto_get_user_stats()
CREATE OR REPLACE FUNCTION zoto_get_user_stats(userid int4)
        RETURNS zoto_account_stats_type AS
        $body$
        DECLARE
                return_rec zoto_account_stats_type;
                work_rec RECORD;
        BEGIN
                -- tag count
                SELECT INTO work_rec
                        count(*) AS tag_count
                FROM
                        user_image_tags t1
						JOIN user_images t2 USING (image_id)
                WHERE
                        t2.owner_userid = userid;
                IF FOUND THEN
                        return_rec.cnt_tags := work_rec.tag_count;
                END IF;

                -- image count
                SELECT INTO work_rec
                        count(*) AS image_count
                FROM
                        user_images
                WHERE
                        owner_userid = userid;
                IF FOUND THEN
                        return_rec.cnt_images := work_rec.image_count;
                END IF;

                -- album count
                SELECT INTO work_rec
                        count(*) AS album_count
                FROM
                        user_albums
                WHERE
                        owner_userid = userid;
                IF FOUND THEN
                        return_rec.cnt_albums := work_rec.album_count;
                END IF;

                -- comments on user's photos count
                SELECT INTO work_rec
                        count(*) AS comment_count
                FROM
                        comments t1
						JOIN user_images t2 USING (image_id)
                WHERE
                        t2.owner_userid = userid;
                IF FOUND THEN
                        return_rec.cnt_comments := work_rec.comment_count;
                END IF;

                -- comments made by user count
                SELECT INTO work_rec
                        count(*) AS user_comment_count
                FROM
                        comments
                WHERE
                        commenting_userid = userid;
                IF FOUND THEN
                        return_rec.cnt_user_comments := work_rec.user_comment_count;
                END IF;

                -- approved contacts count
                SELECT INTO work_rec
                        count(group_id) AS user_contact_count
                FROM
                        user_contact_groups
                WHERE
                        owner_userid = userid AND
                        group_type = 'U';
                IF FOUND THEN
                        return_rec.cnt_user_contacts := work_rec.user_contact_count;
                END IF;

                -- people calling user a contact count
                SELECT INTO work_rec
                        count(t1.owner_userid) AS user_as_contact_count
                FROM
                        user_contact_groups t1
                        JOIN user_contact_group_xref_users t2 USING (group_id)
                WHERE
                        t2.member_userid = userid AND
						t1.group_type = 'U';
                IF FOUND THEN
                        return_rec.cnt_user_as_contacts := work_rec.user_as_contact_count;
                END IF;

                -- mutual contact count
                SELECT INTO work_rec
                        count(distinct t5.mutual_contact) AS mutual_contact_count
                FROM
                        user_contact_groups t1
                        LEFT JOIN user_contact_group_xref_users t2 using (group_id)
                        LEFT JOIN (
                                SELECT
                                        t3.owner_userid AS mutual_contact
                                FROM
                                        user_contact_groups t3
                                        LEFT JOIN user_contact_group_xref_users t4 USING (group_id)
                                WHERE
                                        t4.member_userid = userid AND
										t3.group_type = 'U'
                        ) AS t5 ON (t2.member_userid = t5.mutual_contact) 
                WHERE
                        t1.owner_userid = userid AND
                        t2.member_userid IS NOT NULL AND
                        mutual_contact IS NOT NULL;
                IF FOUND THEN
                        return_rec.cnt_mutual_contacts := work_rec.mutual_contact_count;
                END IF;

                RETURN return_rec;
        END;
        $body$
        LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_get_user_stats(int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_username_is_valid()
 *
 * Checks to see if a username is properly formatted.
 *
 * PARAMS:
 *	username    - user to check for validity
 */
\echo zoto_username_is_valid()
CREATE OR REPLACE FUNCTION zoto_username_is_valid(username text) RETURNS boolean AS 
	$body$
	import re
	user_re = re.compile("^[a-z][_a-z0-9\.]+$")

        value = args[0].lower()
        if not(4 <= len(value) <= 20):
                return 0
        if not user_re.match(value):
		return 0
        return 1
	$body$
	LANGUAGE 'plpythonu';
ALTER FUNCTION zoto_username_is_valid(text) OWNER TO aztk;

/*********************************************************************************
 * zoto_email_is_valid()
 *
 * Checks to see if an email address is properly formatted.
 *
 * PARAMS:
 *	email       - email to check for validity
 */
\echo zoto_email_is_valid()
CREATE OR REPLACE FUNCTION zoto_email_is_valid(text) RETURNS boolean AS 
	$body$
	import re
	untrusted_string = args[0].lower()

	mail_atom = "[-a-z0-9!#$%&\'*+/=?^_`{|}~]"
	mail_domain = "([a-z0-9]([_-a-z0-9]*[a-z0-9]+)?)"
	mail_regex_string = "^%s+(\.%s+)*@(%s{1,63}\.)+%s{2,63}$" % \
		(mail_atom, mail_atom, mail_domain, mail_domain)
	mail_re = re.compile(mail_regex_string)

	if mail_re.match(untrusted_string):
		return 1
	else:
		return 0
	$body$
	LANGUAGE 'plpythonu';
ALTER FUNCTION zoto_email_is_valid(text) OWNER TO aztk;

/*********************************************************************************
 * zoto_delete_user_image()
 *
 * Deletes an image from a user's account.  Also cleans up any references in other tables.
 *
 * PARAMS:
 *	owner       - Owner of the image
 *	image       - ID of the image being deleted
 */
\echo zoto_delete_user_image()
CREATE OR REPLACE FUNCTION zoto_delete_user_image(owner int4, image int4)
	RETURNS void AS
	$body$
	BEGIN
		-- Delete the image
		DELETE FROM
			user_images
		WHERE
			image_id = image AND
			owner_userid = owner;

		-- Set the avatar to NULL if it's the deleted image
		UPDATE
			users
		SET
			avatar_id = NULL
		WHERE
			userid = owner AND
			zoto_get_image_id(owner, avatar_id) = image;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_delete_user_image(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_get_image_id()
 *
 * Gets the numeric image_id based on owner/media combination.
 *
 * PARAMS:
 *	owner       - Owner of the image
 *	media       - ID of the media being checked
 */
\echo zoto_get_image_id()
CREATE OR REPLACE FUNCTION zoto_get_image_id(owner int4, media varchar)
RETURNS int4 AS
	$body$
	DECLARE
		work_rec RECORD;
		media_formatted varchar;
	BEGIN
		-- Make sure we only deal with the ID, not the "filter" hash
		media_formatted = substring(media for 32);
		SELECT INTO work_rec
			image_id
		FROM
			user_images
		WHERE
			owner_userid = owner AND
			media_id = media_formatted
		LIMIT
			1;
		IF FOUND THEN
			RETURN work_rec.image_id;
		ELSE
			RETURN -1;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_get_image_id(int4, varchar) OWNER TO aztk;

/********************************************************************************
 *                                                                              *
 *                                T A G S                                       *
 *                                                                              *
 ********************************************************************************/
/*********************************************************************************
 * zoto_tags_are_equal()
 *
 * Checks for equality between tags, allowing for encoding differences.
 *
 * PARAMS:
 *	tag1        - First tag name
 *	tag2        - Second tag name
 */
\echo zoto_tags_are_equal()
CREATE OR REPLACE FUNCTION zoto_tags_are_equal(tag1 varchar, tag2 varchar)
	RETURNS boolean AS
	$body$
	BEGIN
		IF tag1 = tag2 THEN
			RETURN true;
		ELSIF convert(tag1 USING iso_8859_1_to_utf8) = tag2 THEN
			RETURN true;
		ELSIF tag1 = convert(tag2 USING iso_8859_1_to_utf8) THEN
			RETURN true;
		ELSE
			RETURN false;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_tags_are_equal(varchar, varchar) OWNER TO aztk;
 
 /*********************************************************************************
 * zoto_update_tag_for_all_user_images()
 *
 * Removes the specified tag from all the owners images
 *
 * PARAMS:
 *	owner           - user who owns the image
 *	tag             - tag being changed
 *	newname		- new name of the tag
 */
\echo zoto_update_tag_for_all_user_images()
CREATE OR REPLACE FUNCTION zoto_update_tag_for_all_user_images(owner int4, tag varchar, newname varchar) 
	RETURNS void AS
	$body$
	DECLARE 		
		image RECORD;
	BEGIN
		UPDATE
			user_image_tags
		SET	
			tag_name = newname
		FROM
			user_images
		WHERE
			user_image_tags.image_id = user_images.image_id AND
			zoto_tags_are_equal(tag_name, tag) AND
			user_images.owner_userid = owner;

		FOR image IN
			SELECT
				image_id 
			FROM
				user_image_tags
				JOIN user_images USING (image_id)
			WHERE
				zoto_tags_are_equal(tag_name, newname) AND
				owner_userid = owner
		LOOP
			PERFORM zoto_reindex_tags(image.image_id);
		END LOOP;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_update_tag_for_all_user_images(int4, varchar, varchar) OWNER TO aztk;
 
 /*********************************************************************************
 * zoto_remove_tag_from_all_user_images()
 *
 * Removes the specified tag from all the owners images
 *
 * PARAMS:
 *	owner       - user who owns the images
 *	tag         - tag being removed
 */
\echo zoto_remove_tag_from_all_user_images()
CREATE OR REPLACE FUNCTION zoto_remove_tag_from_all_user_images(owner int4, tag varchar) 
	RETURNS void AS
	$body$
	DECLARE 
		image RECORD;
	BEGIN
		FOR image IN
			SELECT
				image_id
			FROM
				user_image_tags t1
				JOIN user_images t2 USING (image_id)
			WHERE
				zoto_tags_are_equal(tag_name, tag) AND
				owner_userid = owner
		LOOP
			PERFORM zoto_remove_user_image_tag(owner, image.image_id, tag, owner);
		END LOOP;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_remove_tag_from_all_user_images(int4, varchar) OWNER TO aztk;
 
 /*********************************************************************************
 * zoto_remove_user_image_tag()
 *
 * Drop a tag on an image for a given user.
 *
 * PARAMS:
 *	owner       - user who owns the image
 *	image       - ID of the image
 *	tag         - tag being removed
 *	tagger      - user doing the tagging
 */
\echo zoto_remove_user_image_tag()
CREATE OR REPLACE FUNCTION zoto_remove_user_image_tag(owner int4, image int4, tag varchar, tagger int4) 
	RETURNS void AS
	$body$
	BEGIN
		IF owner <> tagger THEN
			PERFORM
				tag_name
			FROM
				user_image_tags t1
				JOIN user_images t2 USING (image_id)
			WHERE
				owner_userid = owner AND
				zoto_tags_are_equal(tag_name, tag) AND
				tag_userid = tagger AND
				image_id = image;
			IF NOT FOUND THEN
				RAISE EXCEPTION '% is not allowed to remove % from this image!', tagger,tag;
			END IF;
		END IF;

		DELETE FROM
			user_image_tags
		USING
			user_images
		WHERE
			user_image_tags.image_id = user_images.image_id AND
			user_images.owner_userid = owner AND
			zoto_tags_are_equal(tag_name, tag) AND
			user_image_tags.image_id = image;
		PERFORM zoto_reindex_tags(image);
		RETURN;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_remove_user_image_tag(int4, int4, varchar, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_insert_user_image_tag()
 *
 * Insert/update tag on an image for a given user
 *
 * PARAMS:
 *	owner       - user who owns the image
 *	image       - ID of the image
 *	tag         - tag being added
 *	tagger      - user doing the tagging
 */
\echo zoto_insert_user_image_tag()
CREATE OR REPLACE FUNCTION zoto_insert_user_image_tag(owner int4, image int4, tag varchar, tagger int4) 
	RETURNS void AS
	$body$
	BEGIN
		INSERT INTO
			user_image_tags (
				image_id,
				tag_name,
				tag_userid,
				date_added
			) VALUES (
				image,
				tag,
				tagger,
				now()
			);
		PERFORM zoto_log_activity(tagger, 300, owner, image, tag, NULL, NULL);
		PERFORM zoto_reindex_tags(image);
		EXCEPTION
			WHEN unique_violation THEN
				UPDATE
					user_image_tags
				SET
					date_added = now()
				WHERE
					image_id = image AND
					zoto_tags_are_equal(tag_name, tag);
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_insert_user_image_tag(int4, int4, varchar, int4) OWNER TO aztk;
 
/*********************************************************************************
 * zoto_reindex_tags()
 *
 * Updates the tsvector index for the tags on a given image
 *
 * PARAMS:
 *	image       - Image being indexed
 */
\echo zoto_reindex_tags()
CREATE OR REPLACE FUNCTION zoto_reindex_tags(image int4)
	RETURNS void
	AS $body$
	DECLARE
		cur_row RECORD;
		tag_list text;
	BEGIN
		tag_list := '';
		FOR cur_row IN
			SELECT
				tag_name
			FROM
				user_image_tags
			WHERE
				image_id = image
		LOOP
			tag_list := tag_list || ' ' || cur_row.tag_name;
		END LOOP;
		UPDATE
			user_images
		SET
			ft_tag_index = to_tsvector('default', tag_list)
		WHERE
			image_id = image;
	END;
	$body$
	LANGUAGE plpgsql;
ALTER FUNCTION zoto_reindex_tags(int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_image_set_attr()
 *
 * Updates an attribute on an image.  If the attribute is title or description,
 *	the fulltext index is also updated.
 *
 * PARAMS:
 *	owner       - user who owns the image
 *	id          - id of the image being updated
 *	attribute   - attribute key
 *	newval      - new attribute value
 */
\echo zoto_image_set_attr()
CREATE OR REPLACE FUNCTION zoto_image_set_attr(owner int4, id int4, attribute varchar, newval varchar)
	RETURNS void
	AS $body$
	BEGIN
		IF attribute = 'title' THEN
			UPDATE
				user_images
			SET
				title = newval
			WHERE
				image_id = id AND
				owner_userid = owner;
		ELSIF attribute = 'description' THEN
			UPDATE
				user_images
			SET
				description = newval
			WHERE
				image_id = id AND
				owner_userid = owner;
		ELSE
			EXECUTE 'UPDATE user_images SET ' || attribute || '=''' || newval ||
				''' WHERE image_id=' || id || ' AND owner_userid=' || owner;
		END IF;
		IF attribute IN ('title','description') THEN
			UPDATE
				user_images
			SET
				fulltext_index = to_tsvector('default', title || ' ' || description)
			WHERE
				image_id = id AND
				owner_userid = owner;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_image_set_attr(int4, int4, varchar, varchar) OWNER TO aztk;

/*********************************************************************************
 * zoto_log_activity()
 *
 * Updates the global activity log.
 *
 * PARAMS:
 *	active_user - User who performed the activity (tag, comment, etc)
 *	a_type      - type of activity that occurred
 *	owner_user  - User who owns whatever was acted upon
 *	image       - id of whatever was acted upon
 *	ex_text     - text of the activity (tag, comment, etc)
 *	ex_int      - numeric value of the activity
 *	ex_bool     - boolean value of the activity
 */
\echo zoto_log_activity()
CREATE OR REPLACE FUNCTION zoto_log_activity(active_user int4, a_type int4, owner_user int4, image int4, ex_text text, ex_int int4, ex_bool boolean)
	RETURNS void
	AS $body$
	DECLARE
		perm_record RECORD;
		max_id int4;
		can_view boolean;
	BEGIN
		PERFORM
			activity_userid,
			entry_date 
		FROM
			activity_log
		WHERE
			activity_userid = active_user AND
			activity_type = a_type AND
			entry_date > NOW() - interval '1 minute';
		IF NOT FOUND THEN
			can_view = true;
			IF image IS NOT NULL THEN
				SELECT INTO perm_record
					*
				FROM
					zoto_image_public_permissions_matview
				WHERE
					image_id = image
				LIMIT
					1;
				IF FOUND THEN
					can_view := perm_record.can_view;
				END IF;
			END IF;

			IF can_view THEN
				INSERT INTO activity_log (
					entry_id, entry_date, activity_userid, activity_type,
					image_id, owner_userid, extra_text, extra_int,
					extra_boolean
				) VALUES (
					DEFAULT,
					DEFAULT,
					active_user,
					a_type,
					image,
					owner_user,
					ex_text,
					ex_int,
					ex_bool
				);
			END IF;
		END IF;
		SELECT into max_id MAX(entry_id) from activity_log;
		DELETE FROM activity_log where entry_id <= (max_id-20);
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_log_activity(int4, int4, int4, int4, text, int4, boolean) OWNER TO aztk;


/********************************************************************************
 *                                                                              *
 *                               P E R M I S S I O N S                          *
 *                                                                              *
 ********************************************************************************/

/*********************************************************************************
 * zoto_update_image_permission()
 *
 * Update the view permission on a particular image in a user's account.
 *
 * PARAMS:
 *  media_owner     - User who owns the image
 *  id              - ID of the image being updated
 *	flag            - new view flag
 *  list of groups  - 
 */
\echo zoto_update_image_permission()
CREATE OR REPLACE FUNCTION zoto_update_image_permission(owner int4, id int4, perm_type varchar, flag int4, groups int4[])
	RETURNS void AS
	$body$
	DECLARE
		flag_field varchar;
		group_field varchar;
		rows_inserted int4;
	BEGIN
		IF perm_type = 'view' THEN
			IF flag > 0 THEN
				DELETE FROM
					activity_log 
				WHERE
					image_id = id;
			END IF;
			INSERT INTO user_image_permissions (
				image_id, view_flag, view_groups
			) VALUES (
				id, flag, groups
			);
		ELSIF perm_type = 'tag' THEN
			INSERT INTO user_image_permissions (
				image_id, tag_flag, tag_groups
			) VALUES (
				id, flag, groups
			);
		ELSIF perm_type = 'comment' THEN
			INSERT INTO user_image_permissions (
				image_id, comment_flag, comment_groups
			) VALUES (
				id, flag, groups
			);
		ELSIF perm_type = 'print' THEN
			INSERT INTO user_image_permissions (
				image_id, print_flag, print_groups
			) VALUES (
				id, flag, groups
			);
		ELSIF perm_type = 'download' THEN
			INSERT INTO user_image_permissions (
				image_id, download_flag, download_groups
			) VALUES (
				id, flag, groups
			);
		ELSIF perm_type = 'geotag' THEN
			INSERT INTO user_image_permissions (
				image_id, geotag_flag, geotag_groups
			) VALUES (
				id, flag, groups
			);
		ELSIF perm_type = 'vote' THEN
			INSERT INTO user_image_permissions (
				image_id, vote_flag, vote_groups
			) VALUES (
				id, flag, groups
			);
		ELSIF perm_type = 'blog' THEN
			INSERT INTO user_image_permissions (
				image_id, blog_flag, blog_groups
			) VALUES (
				id, flag, groups
			);
		END IF;
		EXCEPTION
			WHEN unique_violation THEN
				IF perm_type = 'view' THEN
					UPDATE user_image_permissions SET
						view_flag = flag,
						view_groups = groups
					WHERE
						image_id = id;
				ELSIF perm_type = 'tag' THEN
					UPDATE user_image_permissions SET
						tag_flag = flag,
						tag_groups = groups
					WHERE
						image_id = id;
				ELSIF perm_type = 'comment' THEN
					UPDATE user_image_permissions SET
						comment_flag = flag,
						comment_groups = groups
					WHERE
						image_id = id;
				ELSIF perm_type = 'print' THEN
					UPDATE user_image_permissions SET
						print_flag = flag,
						print_groups = groups
					WHERE
						image_id = id;
				ELSIF perm_type = 'download' THEN
					UPDATE user_image_permissions SET
						download_flag = flag,
						download_groups = groups
					WHERE
						image_id = id;
				ELSIF perm_type = 'geotag' THEN
					UPDATE user_image_permissions SET
						geotag_flag = flag,
						geotag_groups = groups
					WHERE
						image_id = id;
				ELSIF perm_type = 'vote' THEN
					UPDATE user_image_permissions SET
						vote_flag = flag,
						vote_groups = groups
					WHERE
						image_id = id;
				ELSIF perm_type = 'blog' THEN
					UPDATE user_image_permissions SET
						blog_flag = flag,
						blog_groups = groups
					WHERE
						image_id = id;
				END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_update_image_permission(int4, int4, varchar, int4, int4[]) OWNER TO aztk;

/*********************************************************************************
 * zoto_check_perm()
 *
 * Quick and dirty perm check.  Works for images or albums.
 *
 * PARAMS:
 *  flag            - Flag value (private, public, etc)
 *  perm_groups     - List of perm groups
 *  member_groups   - List of groups the user is a member of in the context of the 
 *                    owner.
 */
\echo zoto_check_perm()
CREATE OR REPLACE FUNCTION zoto_check_perm (flag int4, perm_groups int4[], member_groups int4[])
	RETURNS boolean AS
	$body$
	BEGIN
		IF flag = 0 THEN
			RETURN TRUE;
		ELSIF flag = 3 THEN
			RETURN FALSE;
		ELSE
			RETURN perm_groups && member_groups;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_check_perm(int4, int4[], int4[]) OWNER TO aztk;

/*********************************************************************************
 * zoto_user_can_view_media()
 *
 * Determines whether or not a particular user can view another user's image
 *
 * PARAMS:
 *  owner           - User who owns the image
 *  id              - ID of the image being viewed
 *  viewer          - user trying to view the image
 */
\echo zoto_user_can_view_media()
CREATE OR REPLACE FUNCTION zoto_user_can_view_media (owner int4, id int4, viewer int4)
	RETURNS boolean AS
	$body$
	DECLARE
		public_entry RECORD;
		account_entry RECORD;
	BEGIN
		-- If it's the owner, yes...they can
		IF owner = viewer THEN
			RETURN true;
		END IF;

		-- Are they logged in?
		IF viewer IS NULL THEN
			SELECT INTO public_entry
				can_view
			FROM
				zoto_image_public_permissions_matview
			WHERE
				image_id = id
			LIMIT
				1;
			IF FOUND THEN
				RETURN public_entry.can_view;
			ELSE
				RETURN false;
			END IF;
		ELSE
			SELECT INTO account_entry
				CASE
					WHEN t2.owner_userid = t3.member_userid THEN true
					WHEN t1.view_flag = 0 THEN true
					WHEN t1.view_flag = 3 THEN false
					ELSE t1.view_groups && t3.groups
				END AS can_view
			FROM
				zoto_image_permissions_matview t1
				JOIN user_images t2 USING (image_id)
				JOIN zoto_member_contact_groups_array_matview t3 ON (t3.member_userid = viewer)
			WHERE
				image_id = id
			LIMIT
				1;
			IF FOUND THEN
				RETURN account_entry.can_view;
			ELSE
				return false;
			END IF;
		END IF;

	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_can_view_media(int4, int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_user_can_tag_media()
 *
 * Determines whether or not a particular user can tag another user's image
 *
 * PARAMS:
 *  owner           - User who owns the image
 *  id              - ID of the image being tagged
 *  viewer          - user trying to tag the image
 */
\echo zoto_user_can_tag_media()
CREATE OR REPLACE FUNCTION zoto_user_can_tag_media (owner int4, id int4, viewer int4)
	RETURNS boolean AS
	$body$
	DECLARE
		public_entry RECORD;
		account_entry RECORD;
	BEGIN
		-- If it's the owner, yes...they can
		IF owner = viewer THEN
			RETURN true;
		END IF;

		-- Are they logged in?
		IF viewer IS NULL THEN
			SELECT INTO public_entry
				can_tag
			FROM
				zoto_image_public_permissions_matview
			WHERE
				image_id = id
			LIMIT
				1;
			IF FOUND THEN
				RETURN public_entry.can_tag;
			ELSE
				RETURN false;
			END IF;
		ELSE
			SELECT INTO account_entry
				CASE
					WHEN t2.owner_userid = t3.member_userid THEN true
					WHEN t1.tag_flag = 0 THEN true
					WHEN t1.tag_flag = 3 THEN false
					ELSE t1.tag_groups && t3.groups
				END AS can_tag
			FROM
				zoto_image_permissions_matview t1
				JOIN user_images t2 USING (image_id)
				JOIN zoto_member_contact_groups_array_matview t3 ON (t3.member_userid = viewer)
			WHERE
				image_id = id
			LIMIT
				1;
			IF FOUND THEN
				RETURN account_entry.can_tag;
			ELSE
				return false;
			END IF;
		END IF;

	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_can_tag_media(int4, int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_user_can_comment_media()
 *
 * Determines whether or not a particular user can comment on another user's image
 *
 * PARAMS:
 *  owner           - User who owns the image
 *  id              - ID of the image being commented on
 *  viewer          - user trying to comment on the image
 */
\echo zoto_user_can_comment_media()
CREATE OR REPLACE FUNCTION zoto_user_can_comment_media (owner int4, id int4, viewer int4)
	RETURNS boolean AS
	$body$
	DECLARE
		public_entry RECORD;
		account_entry RECORD;
	BEGIN
		-- If it's the owner, yes...they can
		IF owner = viewer THEN
			RETURN true;
		END IF;

		-- Are they logged in?
		IF viewer IS NULL THEN
			SELECT INTO public_entry
				can_comment
			FROM
				zoto_image_public_permissions_matview
			WHERE
				image_id = id
			LIMIT
				1;
			IF FOUND THEN
				RETURN public_entry.can_comment;
			ELSE
				RETURN false;
			END IF;
		ELSE
			SELECT INTO account_entry
				CASE
					WHEN t2.owner_userid = t3.member_userid THEN true
					WHEN t1.comment_flag = 0 THEN true
					WHEN t1.comment_flag = 3 THEN false
					ELSE t1.comment_groups && t3.groups
				END AS can_comment
			FROM
				zoto_image_permissions_matview t1
				JOIN user_images t2 USING (image_id)
				JOIN zoto_member_contact_groups_array_matview t3 ON (t3.member_userid = viewer)
			WHERE
				image_id = id
			LIMIT
				1;
			IF FOUND THEN
				RETURN account_entry.can_comment;
			ELSE
				return false;
			END IF;
		END IF;

	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_can_comment_media(int4, int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_user_can_print_media()
 *
 * Determines whether or not a particular user can print another user's image
 *
 * PARAMS:
 *  owner           - User who owns the image
 *  id              - ID of the image being printed
 *  viewer          - user trying to print the image
 */
\echo zoto_user_can_print_media()
CREATE OR REPLACE FUNCTION zoto_user_can_print_media (owner int4, id int4, viewer int4)
	RETURNS boolean AS
	$body$
	DECLARE
		public_entry RECORD;
		account_entry RECORD;
	BEGIN
		-- If it's the owner, yes...they can
		IF owner = viewer THEN
			RETURN true;
		END IF;

		-- Are they logged in?
		IF viewer IS NULL THEN
			SELECT INTO public_entry
				can_print
			FROM
				zoto_image_public_permissions_matview
			WHERE
				image_id = id
			LIMIT
				1;
			IF FOUND THEN
				RETURN public_entry.can_print;
			ELSE
				RETURN false;
			END IF;
		ELSE
			SELECT INTO account_entry
				CASE
					WHEN t2.owner_userid = t3.member_userid THEN true
					WHEN t1.print_flag = 0 THEN true
					WHEN t1.print_flag = 3 THEN false
					ELSE t1.print_groups && t3.groups
				END AS can_print
			FROM
				zoto_image_permissions_matview t1
				JOIN user_images t2 USING (image_id)
				JOIN zoto_member_contact_groups_array_matview t3 ON (t3.member_userid = viewer)
			WHERE
				image_id = id
			LIMIT
				1;
			IF FOUND THEN
				RETURN account_entry.can_print;
			ELSE
				return false;
			END IF;
		END IF;

	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_can_print_media(int4, int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_user_can_download_media()
 *
 * Determines whether or not a particular user can download another user's image
 *
 * PARAMS:
 *  owner           - User who owns the image
 *  id              - ID of the image being downloaded
 *  viewer          - user trying to download the image
 */
\echo zoto_user_can_download_media()
CREATE OR REPLACE FUNCTION zoto_user_can_download_media (owner int4, id int4, viewer int4)
	RETURNS boolean AS
	$body$
	DECLARE
		public_entry RECORD;
		account_entry RECORD;
	BEGIN
		-- If it's the owner, yes...they can
		IF owner = viewer THEN
			RETURN true;
		END IF;

		-- Are they logged in?
		IF viewer IS NULL THEN
			SELECT INTO public_entry
				can_download
			FROM
				zoto_image_public_permissions_matview
			WHERE
				image_id = id
			LIMIT
				1;
			IF FOUND THEN
				RETURN public_entry.can_download;
			ELSE
				RETURN false;
			END IF;
		ELSE
			SELECT INTO account_entry
				CASE
					WHEN t2.owner_userid = t3.member_userid THEN true
					WHEN t1.download_flag = 0 THEN true
					WHEN t1.download_flag = 3 THEN false
					ELSE t1.download_groups && t3.groups
				END AS can_download
			FROM
				zoto_image_permissions_matview t1
				JOIN user_images t2 USING (image_id)
				JOIN zoto_member_contact_groups_array_matview t3 ON (t3.member_userid = viewer)
			WHERE
				image_id = id
			LIMIT
				1;
			IF FOUND THEN
				RETURN account_entry.can_download;
			ELSE
				return false;
			END IF;
		END IF;

	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_can_download_media(int4, int4, int4) OWNER TO aztk;


/*********************************************************************************
 * zoto_get_latest_id()
 *
 * Gets the latest image_id/hash value for a particular image.  This doesn't work
 *  like the old "image hash" values...it's just to force browsers to request a new
 *  copy of images when they're modified.
 *
 * PARAMS:
 *  id      - ID of the image being viewed
 */
\echo zoto_get_latest_id()
CREATE OR REPLACE FUNCTION zoto_get_latest_id(id int4)
	RETURNS varchar AS
	$body$
	DECLARE
		user_rec RECORD;
	BEGIN
		SELECT INTO user_rec
			media_id,
			last_modified
		FROM
			user_images
		WHERE
			image_id = id
		LIMIT
			1;

		IF FOUND THEN
			if char_length(user_rec.last_modified) > 0 THEN
				RETURN user_rec.media_id || '-' || substring(md5(user_rec.last_modified) FROM 1 FOR 5);
			ELSE
				RETURN user_rec.media_id;
			END IF;
		ELSE
			RETURN '';
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_get_latest_id(int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_init_user()
 *
 * Initializes all the extra stuff that is needed by a new user.
 *
 * PARAMS:
 *  new_user    - New userid
 */
\echo zoto_init_user()
CREATE OR REPLACE FUNCTION zoto_init_user (new_user int4)
	RETURNS void AS
	$body$
		DECLARE
			user_rec RECORD;
	BEGIN
		SELECT INTO user_rec
			*
		FROM
			users
		WHERE
			userid = new_user
		LIMIT
			1;		
		IF FOUND THEN
			-- user_settings
			PERFORM
				owner_userid
			FROM
				user_settings
			WHERE
				owner_userid = new_user;
			IF NOT FOUND THEN
				INSERT INTO
					user_settings (
						owner_userid
					) values (
						new_user
					);
					IF user_rec.account_type_id = 25 THEN
						UPDATE
							user_settings
						SET
							public_email = 1
						WHERE
							owner_userid = new_user;
					END IF;
			END IF;

			-- account_image_permissions
			PERFORM
				owner_userid
			FROM
				account_image_permissions
			WHERE
				owner_userid = new_user;
			IF NOT FOUND THEN
				INSERT INTO
					account_image_permissions (
						owner_userid
					) values (
						new_user
					);
			END IF;

			-- account_album_permissions
			PERFORM
				owner_userid
			FROM
				account_album_permissions
			WHERE
				owner_userid = new_user;
			IF NOT FOUND THEN
				INSERT INTO
					account_album_permissions (
						owner_userid
					) VALUES (
						new_user
					);
			END IF;

			-- user_contact_groups
			PERFORM
				owner_userid
			FROM
				user_contact_groups
			WHERE
				owner_userid = new_user;
			IF NOT FOUND THEN
				INSERT INTO
					user_contact_groups (
						owner_userid,
						group_name
					) values (
						new_user,
						'friends'
					);
				INSERT INTO
					user_contact_groups (
						owner_userid,
						group_name
					) values (
						new_user,
						'family'
					);
				IF user_rec.account_type_id != 25 THEN
					EXECUTE zoto_log_activity(new_user, 100, new_user, NULL, user_rec.country, NULL, NULL);
				END IF;
			END IF;
			PERFORM zoto_member_contact_groups_array_matview_refresh_by_member(new_user);
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_init_user(int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_create_guest()
 *
 * Creates a guest account (type 25).
 *
 * PARAMS:
 *  email    - Email address
 */
\echo zoto_create_guest()
CREATE OR REPLACE FUNCTION zoto_create_guest (email_address varchar)
	RETURNS zoto_return_type AS
	$body$
		DECLARE
			work_rec RECORD;
			return_rec zoto_return_type;
	BEGIN
		INSERT INTO
			users (
				username,
				password,
				email,
				email_hash,
				partner_id,
				account_type_id,
				account_status_id,
				country,
				account_expires
			) VALUES (
				'guest',
				md5(''),
				email_address,
				md5(email_address),
				1,
				25,
				100,
				'',
				now() + interval '1 year'
			);
		SELECT INTO work_rec currval('users_userid_seq') AS userid;
		EXECUTE 'UPDATE users set username = ''guest' || work_rec.userid || ''' WHERE userid = ' || work_rec.userid;
		PERFORM zoto_init_user(work_rec.userid::int4);
		return_rec.code = 0;
		return_rec.message = 'guest'|| work_rec.userid;
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_create_guest(varchar) OWNER TO aztk;

/********************************************************************************
 *                                                                              *
 *                           C O N T A C T   G R O U P S                        *
 *                                                                              *
 ********************************************************************************/

/*********************************************************************************
 * zoto_create_contact()
 *
 * Adds a contact to a user's list of contacts.
 *
 * PARAMS:
 *  owner   - user adding the contact
 *  contact - new contact's userid
 */
\echo zoto_create_contact()
CREATE OR REPLACE FUNCTION zoto_create_contact(owner int4, contact int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		work_rec RECORD;
		return_rec zoto_return_type;
	BEGIN
		SELECT INTO work_rec
			group_id
		FROM
			user_contact_groups
		WHERE
			group_name = zoto_get_user_name(contact) AND
			owner_userid = owner;

		IF FOUND THEN
			return_rec.code := -1;
			return_rec.message := 'CONTACT ALREADY EXISTS';
			RETURN return_rec;
		END IF;

		INSERT INTO
			user_contact_groups (
				owner_userid,
				group_name,
				group_type
			) VALUES (
				owner,
				zoto_get_user_name(contact),
				'U'
			);

		SELECT INTO work_rec currval('user_contact_groups_group_id_seq') AS new_id;
		IF NOT FOUND THEN
			return_rec.code := -1;
			return_rec.message := 'ERROR GETTING GROUP ID';
			RETURN return_rec;
		END IF;

		INSERT INTO
			user_contact_group_xref_users (
				group_id,
				member_userid
			) VALUES (
				work_rec.new_id,
				contact
			);
		return_rec.code := 0;
		return_rec.message := contact;
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_create_contact(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_delete_contact()
 *
 * Removes a contact from a user's contact list.
 *
 * PARAMS:
 *  owner   - user deleting the contact
 *  contact - contact's userid
 */
\echo zoto_delete_contact()
CREATE OR REPLACE FUNCTION zoto_delete_contact(owner int4, contact int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
	BEGIN
		DELETE FROM
			user_contact_group_xref_users
		WHERE
			member_userid = contact AND
			group_id IN (
				SELECT
					group_id
				FROM
					user_contact_groups
				WHERE
					owner_userid = owner
			);

		DELETE FROM
			user_contact_groups
		WHERE
			owner_userid = owner AND
			group_name = zoto_get_user_name(contact);
		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_delete_contact(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_create_contact_list()
 *
 * Creates a user's contact list.
 *
 * PARAMS:
 *  owner       - user adding the contact list
 *  name        - New name for the contact list
 */
\echo zoto_create_contact_list()
CREATE OR REPLACE FUNCTION zoto_create_contact_list(owner int4, name varchar)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
		work_rec RECORD;
	BEGIN
		PERFORM
			group_id
		FROM
			user_contact_groups
		WHERE
			owner_userid = owner AND
			group_name = name;

		IF FOUND THEN
			return_rec.code := -1;
			return_rec.message := "GROUP ALREADY EXISTS";
			RETURN return_rec;
		END IF;

		INSERT INTO
			user_contact_groups (
				owner_userid,
				group_name
			) VALUES (
				owner,
				name
			);
		SELECT INTO work_rec currval('user_contact_groups_group_id_seq') AS new_id;
		IF FOUND THEN
			return_rec.code := 0;
			return_rec.message := work_rec.new_id::text;
			RETURN return_rec;
		ELSE
			return_rec.code := -1;
			return_rec.message := "ERROR GETTING NEW GROUP ID";
			RETURN return_rec;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_create_contact_list(int4, varchar) OWNER TO aztk;

/*********************************************************************************
 * zoto_delete_contact_list()
 *
 * Removes a user's contact group entirely.
 *
 * PARAMS:
 *  owner       - user removing the contact group
 *  id			- id of the group being deleted
 */
\echo zoto_delete_contact_list()
CREATE OR REPLACE FUNCTION zoto_delete_contact_list(owner int4, id int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
	BEGIN
		
		/* update permissions and remove the group that we are about to delete */
		UPDATE 
			account_image_permissions
		SET
			view_groups = view_groups - id,
			tag_groups = tag_groups - id,
			comment_groups = comment_groups - id,
			print_groups = print_groups - id,
			download_groups = download_groups - id,
			geotag_groups = geotag_groups - id,
			vote_groups = vote_groups - id,
			blog_groups = blog_groups - id
		WHERE
			owner_userid = owner AND (
			intset(id) && view_groups OR
			intset(id) && tag_groups OR
			intset(id) && comment_groups OR
			intset(id) && print_groups OR
			intset(id) && download_groups OR
			intset(id) && geotag_groups OR
			intset(id) && vote_groups OR
			intset(id) && blog_groups);
		
		UPDATE 
			user_image_permissions
		SET
			view_groups = view_groups - id,
			tag_groups = tag_groups - id,
			comment_groups = comment_groups - id,
			print_groups = print_groups - id,
			download_groups = download_groups - id,
			geotag_groups = geotag_groups - id,
			vote_groups = vote_groups - id,
			blog_groups = blog_groups - id
		FROM
			user_images
		WHERE
			user_images.image_id = user_image_permissions.image_id AND
			owner_userid = owner AND (
			intset(id) && view_groups OR
			intset(id) && tag_groups OR
			intset(id) && comment_groups OR
			intset(id) && print_groups OR
			intset(id) && download_groups OR
			intset(id) && geotag_groups OR
			intset(id) && vote_groups OR
			intset(id) && blog_groups);
		
		/* finally, delete the group */
		DELETE FROM
				user_contact_groups
		WHERE 
				owner_userid = owner AND
				group_id = id;

		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_delete_contact_list(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_add_to_contact_list()
 *
 * Adds a contact to one of a user's contact lists
 *
 * PARAMS:
 *  owner       - user adding the contact
 *  contact     - new contact's username
 *  list_name   - name of the contact list to which the user is being added
 */
\echo zoto_add_to_contact_list()
CREATE OR REPLACE FUNCTION zoto_add_to_contact_list (owner int4, contact int4, list_id int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		group_rec RECORD;
		all_id RECORD;
		return_rec zoto_return_type;
	BEGIN
		PERFORM
			group_id
		FROM
			user_contact_groups
		WHERE
			group_id = list_id AND
			owner_userid = owner;
	
		IF NOT FOUND THEN
			return_rec.code := -1;
			return_rec.message := "INVALID GROUP";
			RETURN return_rec;
		END IF;
		
		PERFORM
			date_added
		FROM
			user_contact_group_xref_users
		WHERE
			group_id = list_id AND
			member_userid = contact;
		
		IF FOUND THEN
			return_rec.code := -1;
			return_rec.message := "USER ALREADY IN GROUP";
			RETURN return_rec;
		ELSE
			INSERT INTO
				user_contact_group_xref_users(
					group_id,
					member_userid
				) values (
					list_id,
					contact
				);
			return_rec.code := 0;
			return_rec.message := 'success';
			RETURN return_rec;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_add_to_contact_list(int4, int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_get_is_contact()
 *
 * Checks to see whether a specified user is another user's contact.
 *
 * PARAMS:
 * 	member	- User to check for group membership
 *	owner	- Group owner
 */
\echo zoto_get_is_contact()
CREATE OR REPLACE FUNCTION zoto_get_is_contact(member int4, owner int4)
RETURNS boolean AS
	$body$
	BEGIN
		PERFORM
			group_id
		FROM
			user_contact_groups t1
			JOIN user_contact_group_xref_users t2 USING (group_id)
		WHERE
			owner_userid = owner AND
			member_userid = member;

		IF FOUND THEN
			RETURN true;
		ELSE
			RETURN false;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_get_is_contact(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_get_is_mutual_contact()
 *
 * Checks to see whether a specified user is another user's contact, and vice versa.
 *
 * PARAMS:
 * 	user1	- First user
 *	user2	- Second user
 */
\echo zoto_get_is_mutual_contact()
CREATE OR REPLACE FUNCTION zoto_get_is_mutual_contact(user1 int4, user2 int4)
RETURNS boolean AS
	$body$
	DECLARE
		work_rec RECORD;
	BEGIN
		SELECT INTO work_rec
			count(*) AS count
		FROM
			user_contact_groups t1
			JOIN user_contact_group_xref_users t2 USING (group_id)
		WHERE
			(
				owner_userid = user1 AND
				member_userid = user2 AND
				group_type = 'U'
			) OR (
				owner_userid = user2 AND
				member_userid = user1 AND
				group_type = 'U'
			);
		IF work_rec.count = 2 THEN
			RETURN true;
		ELSE
			RETURN false;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_get_is_mutual_contact(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_del_from_contact_list()
 *
 * Removes a user from one of a person's contact lists
 *
 * PARAMS:
 *  owner       - user removing the contact
 *  contact     - existing contact's username
 *  list_id		- ID of the list to remove the user from
 */
\echo zoto_del_from_contact_list()
CREATE OR REPLACE FUNCTION zoto_del_from_contact_group(owner int4, contact int4, list_id int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		g_id RECORD;
		return_rec zoto_return_type;
	BEGIN
		PERFORM
			group_id
		FROM
			user_contact_groups
		WHERE
			group_id = list_id AND
			owner_userid = owner;
	
		IF NOT FOUND THEN
			return_rec.code := -1;
			return_rec.message := "INVALID GROUP";
			RETURN return_rec;
		END IF;
		
		DELETE FROM 
			user_contact_group_xref_users 
		WHERE
			group_id = list_id AND
			member_userid = contact;

		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_del_from_contact_group(int4, int4, int4) OWNER TO aztk;


/*********************************************************************************
 * zoto_get_user_contact_group()
 *
 * Gets the singular contact group (type 'U') for the specified user.
 *
 * PARAMS:
 *  owner       - user the contact belongs to
 *  contact     - existing contact's username
 */
\echo zoto_get_user_contact_group()
CREATE OR REPLACE FUNCTION zoto_get_user_contact_group (owner int4, contact int4)
RETURNS int4 AS
	$body$
	DECLARE
		work_rec RECORD;
	BEGIN
		SELECT INTO work_rec
			t1.group_id
		FROM
			user_contact_groups t1
			JOIN user_contact_group_xref_users t2 USING (group_id)
		WHERE
			t1.group_type = 'U' AND
			t1.owner_userid = owner AND
			t2.member_userid = contact
		LIMIT
			1;

		IF FOUND THEN
			RETURN work_rec.group_id;
		ELSE
			RETURN -1;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_get_user_contact_group(int4, int4) OWNER TO aztk;

\echo zoto_get_contact_count()
CREATE OR REPLACE FUNCTION zoto_get_contact_count(owner int4, id int4)
RETURNS int4 AS
	$body$
	DECLARE
		work_rec RECORD;
	BEGIN
		SELECT INTO work_rec
			count(*) AS count
		FROM
			user_contact_groups t1
			JOIN user_contact_group_xref_users t2 USING (group_id)
		WHERE
			t1.owner_userid = owner AND
			t1.group_id = id;
		IF FOUND THEN
			RETURN work_rec.count;
		ELSE
			RETURN 0;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_get_contact_count(int4, int4) OWNER TO aztk;

/********************************************************************************
 *                                                                              *
 *                                U T I L I T Y                                 *
 *                                                                              *
 ********************************************************************************/

/*********************************************************************************
 * zoto_get_elapsed()
 *
 * Gets the elapsed time based on the current timestamp on the server.
 *
 * PARAMS:
 * 	timeval     - value to compute the elapsed time for.
 */
\echo zoto_get_elapsed()
CREATE OR REPLACE FUNCTION zoto_get_elapsed (timeval timestamp)
	RETURNS float AS
	$body$
	DECLARE
		elapsed_record RECORD;
	BEGIN
		SELECT INTO elapsed_record
			extract(epoch from age(current_timestamp, timeval)) as elapsed;
		RETURN elapsed_record.elapsed;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_get_elapsed(timestamp) OWNER TO aztk;

\echo zoto_get_user_image_count()
CREATE OR REPLACE FUNCTION zoto_get_user_image_count(owner int4, viewer int4)
RETURNS int4 AS
	$body$
	DECLARE
		work_rec RECORD;
	BEGIN
		SELECT INTO work_rec
			count(*) AS count
		FROM
			user_images
		WHERE
			owner_userid = owner AND
			zoto_user_can_view_media(owner, image_id, viewer);
		IF FOUND THEN
			RETURN work_rec.count;
		ELSE
			RETURN 0;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_get_user_image_count(int4, int4) OWNER TO aztk;

\echo zoto_get_last_upload_date()
CREATE OR REPLACE FUNCTION zoto_get_last_upload_date(owner int4)
RETURNS timestamp AS
	$body$
	DECLARE
		work_rec RECORD;
	BEGIN
		SELECT INTO work_rec
			date_uploaded AS last_upload
		FROM
			user_images
		WHERE
			owner_userid = owner
		ORDER BY
			date_uploaded desc
		LIMIT
			1;
		IF FOUND THEN
			RETURN work_rec.last_upload;
		ELSE
			RETURN NULL;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_get_last_upload_date(int4) OWNER TO aztk;

\echo zoto_get_user_email()
CREATE OR REPLACE FUNCTION zoto_get_user_email(owner int4, viewer int4)
RETURNS varchar AS
	$body$
	DECLARE
		work_rec RECORD;
	BEGIN
		IF viewer IS NULL THEN
			RETURN 'private';
		END IF;

		SELECT INTO work_rec
			t1.email,
			t2.public_email,
			EXISTS (
				SELECT
					*
				FROM
					user_contact_groups t3
					JOIN user_contact_group_xref_users t4 USING (group_id)
				WHERE
					owner_userid = owner AND
					member_userid = viewer
			) AS is_contact
		FROM
			users t1
			JOIN user_settings t2 ON (t1.userid = t2.owner_userid)
		WHERE
			userid = owner
		LIMIT
			1;

		IF owner = viewer THEN
			RETURN work_rec.email;
		ELSIF work_rec.public_email = 1 THEN
			RETURN work_rec.email;
		ELSIF work_rec.public_email = 2 THEN
			IF work_rec.is_contact THEN
				RETURN work_rec.email;
			ELSE
				RETURN 'contacts only';
			END IF;
		ELSIF work_rec.public_email = 3 THEN
			RETURN 'private';
		ELSE
			RETURN 'error';
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_get_user_email(int4, int4) OWNER TO aztk;

/********************************************************************************
 *                                                                              *
 *                               A L B U M S                                    *
 *                                                                              *
 ********************************************************************************/

/*********************************************************************************
 * zoto_user_owns_album()
 *
 * Determines whether a specific user owns an album.
 *
 * PARAMS:
 * 	owner	- Username to check
 *	album	- Album id to check for ownership
 */
\echo zoto_user_owns_album()
CREATE OR REPLACE FUNCTION zoto_user_owns_album (owner int4, album int4)
	RETURNS boolean AS
	$body$
	BEGIN
		PERFORM
			title
		FROM
			user_albums
		WHERE
			owner_userid = owner AND
			album_id=album;
		RETURN FOUND;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_owns_album(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_user_owns_album_title()
 *
 * Determines whether a specific user owns an album by title.
 *
 * PARAMS:
 * 	owner		- Userid to check
 *	album_title	- Album title to check for ownership
 */
\echo zoto_user_owns_album_title()
CREATE OR REPLACE FUNCTION zoto_user_owns_album_title (owner int4, album_title varchar)
	RETURNS int4 AS
	$body$
	DECLARE
		work_rec record;
	BEGIN
		SELECT INTO work_rec
			album_id
		FROM
			user_albums
		WHERE
			owner_userid = owner AND
			title = album_title;
		IF FOUND THEN
			RETURN work_rec.album_id;
		ELSE
			RETURN 0;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_owns_album_title(int4, varchar) OWNER TO aztk;

/*********************************************************************************
 * zoto_album_delete()
 *
 * Deletes a user album.
 *
 * PARAMS:
 * 	owner	- User who owns the album
 *	album	- Album ID being deleted
 */
\echo zoto_album_delete()
CREATE OR REPLACE FUNCTION zoto_album_delete (owner int4, album int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
	BEGIN
		DELETE FROM
			user_albums
		WHERE
			owner_userid = owner AND
			album_id = album;

		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_album_delete(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_album_add_image()
 *
 * Adds an image to an album.
 *
 * PARAMS:
 * 	owner	- User who owns the image
 *	album	- Album id image is being added to
 *	media	- Id of the media being added
 */
\echo zoto_album_add_image()
CREATE OR REPLACE FUNCTION zoto_album_add_image (owner int4, album int4, image int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		max_rec RECORD;
		new_idx int4;
		album_rec RECORD;
		return_rec zoto_return_type;
	BEGIN
		-- Make sure the user owns the album
		PERFORM
			title
		FROM
			user_albums
		WHERE
			owner_userid = owner AND
			album_id=album;
		IF NOT FOUND THEN
			return_rec.code := -1;
			return_rec.message := 'User doesn\'t own album';
			RETURN return_rec;
		END IF;

		-- Now make sure they own the image
		PERFORM
			media_id
		FROM
			user_images
		WHERE
			owner_userid = owner AND
			image_id=image;
		IF NOT FOUND THEN
			return_rec.code := -1;
			return_rec.message := 'User doesn\'t own image';
			RETURN return_rec;
		END IF;

		-- Everything checks out.  Get the current highest index for the album.
		SELECT INTO max_rec
			MAX(t1.media_idx) AS max_idx
		FROM
			user_album_xref_user_images t1
			JOIN user_images t2 USING (image_id)
		WHERE
			t1.album_id = album AND
			t2.owner_userid = owner;

		IF FOUND AND max_rec.max_idx IS NOT NULL THEN
			new_idx := max_rec.max_idx + 1;
		ELSE
			new_idx := 0;
		END IF;

		-- Add the record
		BEGIN
			INSERT INTO
				user_album_xref_user_images (
					album_id,
					image_id,
					media_idx
				) VALUES (
					album,
					image,
					new_idx
				);
		EXCEPTION WHEN unique_violation THEN
		   return_rec.code := -1;
		   return_rec.code := 'image already in album';
		   return return_rec;
		   -- Let this one silently "fail"
		END;

		SELECT INTO album_rec
			main_image_id
		FROM
			user_albums
		WHERE
			album_id = album;

		IF album_rec.main_image_id IS NULL THEN
			UPDATE
				user_albums
			SET
				main_image_id = image
			WHERE
				album_id = album;
		END IF;
		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_album_add_image(int4, int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_album_del_image()
 *
 * Removes an image from an album. Also adjusts the order indexes of the remaining
 * images.
 *
 * PARAMS:
 * 	owner	- User who owns the image
 *	album	- Album id image is being removed from
 *	media	- Id of the media being removed
 */
\echo zoto_album_del_image()
CREATE OR REPLACE FUNCTION zoto_album_del_image (owner int4, album int4, image int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		new_idx int4;
		image_rec RECORD;
		return_rec zoto_return_type;
	BEGIN
		-- Make sure the user owns the album
		PERFORM title from user_albums WHERE owner_userid=owner AND album_id=album;
		IF NOT FOUND THEN
			return_rec.code := -1;
			return_rec.message := 'User doesn\'t own album';
			RETURN return_rec;
		END IF;

		-- Now make sure they own the image
		PERFORM media_id FROM user_images WHERE owner_userid=owner AND image_id=image;
		IF NOT FOUND THEN
			return_rec.code := -1;
			return_rec.message := 'User doesn\'t own image';
			RETURN return_rec;
		END IF;

		-- Everything checks out.  Delete the image
		DELETE FROM
			user_album_xref_user_images
		WHERE
			album_id = album AND
			image_id = image;

		-- Now, update the indexes for the remaining images
		new_idx = 0;
		FOR image_rec in SELECT image_id FROM user_album_xref_user_images WHERE album_id = album ORDER BY media_idx LOOP
			UPDATE
				user_album_xref_user_images 
			SET
				media_idx = new_idx
			WHERE
				album_id = album AND
				image_id = image_rec.image_id;
			new_idx := new_idx + 1;
		END LOOP;
		-- TODO: If this was the main image, either find another, or make it NULL
		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_album_del_image(int4, int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_album_set_attr()
 *
 * Updates an attribute on an album.
 *
 * PARAMS:
 *	owner	- User who owns the album
 *	album	- Album id who's attribute is being updated
 *	key		- Attribute name
 *	value	- New attribute value
 */
\echo zoto_album_set_attr()
CREATE OR REPLACE FUNCTION zoto_album_set_attr (owner int4, album int4, key varchar, value varchar)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		max_rec RECORD;
		new_idx int4;
		return_rec zoto_return_type;
	BEGIN
		-- Make sure the user owns the album
		PERFORM title from user_albums WHERE owner_userid=owner AND album_id=album;
		IF NOT FOUND THEN
			return_rec.code := -1;
			return_rec.message := 'User doesn\'t own album';
			RETURN return_rec;
		END IF;

		EXECUTE 'UPDATE user_albums SET ' || key || '=' || value ||
			' WHERE album_id=' || album;

		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_album_set_attr(int4, int4, varchar, varchar) OWNER TO aztk;

/*********************************************************************************
 * zoto_add_featured_album()
 *
 * Adds a featured album.
 *
 * PARAMS:
 * 	owner		- Album owner
 *	album_id	- Album being added
 */
\echo zoto_add_featured_album()
CREATE OR REPLACE FUNCTION zoto_add_featured_album (owner int4, album int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
	BEGIN
		PERFORM
			*
		FROM
			user_albums
		WHERE
			owner_userid = owner AND
			album_id = album;

		IF NOT FOUND THEN
			return_rec.code := -1;
			return_rec.message := 'User ' || owner || ' doesn\'t own album ' || album;
			return return_rec;
		END IF;

		PERFORM
			*
		FROM
			featured_albums t1
			JOIN user_albums t2 USING (album_id)
		WHERE
			owner_userid = owner AND
			album_id = album;

		IF NOT FOUND THEN
			INSERT INTO
				featured_albums (
					album_id
				) VALUES (
					album
				);
		END IF;

		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_add_featured_album(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_del_featured_album()
 *
 * Deletes an album from the featured list.
 *
 * PARAMS:
 * 	owner		- Album owner
 *	album_id	- Album being removed.
 */
\echo zoto_del_featured_album()
CREATE OR REPLACE FUNCTION zoto_del_featured_album (owner int4, album int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
	BEGIN
		DELETE FROM
			featured_albums
		USING
			user_albums
		WHERE
			featured_albums.album_id = user_albums.album_id AND
			user_albums.owner_userid = owner AND
			featured_albums.album_id = album;

		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_del_featured_album(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_update_album_permission()
 *
 * Update the view permission on a particular album in a user's account.
 *
 * PARAMS:
 *  media_owner     - User who owns the album
 *  id              - ID of the album being updated
 *	flag            - new view flag
 *  list of groups  - 
 */
\echo zoto_update_album_permission()
CREATE OR REPLACE FUNCTION zoto_update_album_permission(album_owner int4, id int4, perm_type varchar, flag int4, groups int4[])
	RETURNS void AS
	$body$
	DECLARE
		flag_field varchar;
		group_field varchar;
		rows_inserted int4;
	BEGIN
		IF perm_type = 'view' THEN
			INSERT INTO user_album_permissions (
				album_id, view_flag, view_groups
			) VALUES (
				id, flag, groups
			);
		ELSIF perm_type = 'comment' THEN
			INSERT INTO user_album_permissions (
				album_id, comment_flag, comment_groups
			) VALUES (
				id, flag, groups
			);
		END IF;
		EXCEPTION
			WHEN unique_violation THEN
				IF perm_type = 'view' THEN
					UPDATE user_album_permissions SET
						view_flag = flag,
						view_groups = groups
					WHERE
						album_id = id;
				ELSIF perm_type = 'comment' THEN
					UPDATE user_album_permissions SET
						comment_flag = flag,
						comment_groups = groups
					WHERE
						album_id = id;
				END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_update_album_permission(int4, int4, varchar, int4, int4[]) OWNER TO aztk;

/*********************************************************************************
 * zoto_user_can_view_album()
 *
 * Determines whether or not a particular user can view another user's album.
 *
 * PARAMS:
 *  album_owner     - User who owns the album
 *  id              - ID of the album being viewed
 *  viewing_user    - user trying to view the album
 */
\echo zoto_user_can_view_album()
CREATE OR REPLACE FUNCTION zoto_user_can_view_album (owner int4, id int4, viewer int4)
	RETURNS boolean AS
	$body$
	DECLARE
		public_entry RECORD;
		account_entry RECORD;
	BEGIN
		-- If it's the owner, yes...they can
		IF owner = viewer THEN
			RETURN true;
		END IF;

		IF viewer IS NULL THEN
			SELECT INTO public_entry
				can_view
			FROM
				zoto_album_public_permissions_view
			WHERE
				album_id = id
			LIMIT
				1;
			IF FOUND THEN
				RETURN public_entry.can_view;
			ELSE
				RETURN false;
			END IF;
		ELSE
			SELECT INTO account_entry
				CASE
					WHEN t2.owner_userid = t3.member_userid THEN true
					WHEN t1.view_flag = 0 THEN true
					WHEN t1.view_flag = 3 THEN false
					ELSE t1.view_groups && t3.groups
				END AS can_view
			FROM
				zoto_album_permissions_view t1
				JOIN user_albums t2 USING (album_id)
				JOIN zoto_member_contact_groups_array_matview t3 ON (t3.member_userid = viewer)
			WHERE
				album_id = id
			LIMIT
				1;
			IF FOUND THEN
				RETURN account_entry.can_view;
			ELSE
				return false;
			END IF;
		END IF;

	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_can_view_album(int4, int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_user_can_comment_album()
 *
 * Determines whether or not a particular user can comment on another user's album
 *
 * PARAMS:
 *  owner           - User who owns the album
 *  id              - ID of the album being commented on
 *  viewer          - user trying to comment on the album
 */
\echo zoto_user_can_comment_album()
CREATE OR REPLACE FUNCTION zoto_user_can_comment_album (owner int4, id int4, viewer int4)
	RETURNS boolean AS
	$body$
	DECLARE
		public_entry RECORD;
		account_entry RECORD;
	BEGIN
		-- If it's the owner, yes...they can
		IF owner = viewer THEN
			RETURN true;
		END IF;

		IF viewer IS NULL THEN
			SELECT INTO public_entry
				t1.can_comment
			FROM
				zoto_album_public_permissions_view t1
				JOIN user_albums t2 USING (album_id)
			WHERE
				t2.owner_userid = owner AND
				album_id = id
			LIMIT
				1;
			IF FOUND THEN
				RETURN public_entry.can_comment;
			ELSE
				RETURN false;
			END IF;
		ELSE
			SELECT INTO account_entry
				CASE
					WHEN t2.owner_userid = t3.member_userid THEN true
					WHEN t1.comment_flag = 0 THEN true
					WHEN t1.comment_flag = 3 THEN false
					ELSE t1.comment_groups && t3.groups
				END AS can_comment
			FROM
				zoto_album_permissions_view t1
				JOIN user_albums t2 USING (album_id)
				JOIN zoto_member_contact_groups_array_matview t3 ON (t3.member_userid = viewer)
			WHERE
				album_id = id
			LIMIT
				1;
			IF FOUND THEN
				RETURN account_entry.can_comment;
			ELSE
				return false;
			END IF;
		END IF;

	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_can_comment_album(int4, int4, int4) OWNER TO aztk;

/********************************************************************************
 *                                                                              *
 *                                 S E T S                                      *
 *                                                                              *
 ********************************************************************************/

/*********************************************************************************
 * zoto_user_owns_set()
 *
 * Determines whether a specific user owns a set.
 *
 * PARAMS:
 * 	owner	- Userid to check
 *	set		- Set id to check for ownership
 */
\echo zoto_user_owns_set()
CREATE OR REPLACE FUNCTION zoto_user_owns_set (owner int4, set_id int4)
	RETURNS boolean AS
	$body$
	BEGIN
		PERFORM title from user_album_sets WHERE owner_userid=owner AND set_id=set_id;
		RETURN FOUND;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_owns_set(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_user_owns_set_title()
 *
 * Determines whether a specific user owns an set by title.
 *
 * PARAMS:
 * 	owner	- Userid to check
 *	set		- 
 */
\echo zoto_user_owns_set_title()
CREATE OR REPLACE FUNCTION zoto_user_owns_set_title (owner int4, set_title varchar)
	RETURNS boolean AS
	$body$
	BEGIN
		PERFORM title from user_album_sets WHERE owner_userid=owner AND title=set_title;
		RETURN FOUND;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_owns_set_title(int4, varchar) OWNER TO aztk;

/*********************************************************************************
 * zoto_set_delete()
 *
 * Deletes a user set.
 *
 * PARAMS:
 * 	owner	- User who owns the set.
 *	set		- Set ID being deleted
 */
\echo zoto_set_delete()
CREATE OR REPLACE FUNCTION zoto_set_delete (owner int4, set int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
	BEGIN
		DELETE FROM
			user_album_sets
		WHERE
			owner_userid = owner AND
			set_id = set;

		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_set_delete(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_set_add_album()
 *
 * Adds an album to a set.
 *
 * PARAMS:
 * 	owner		- Set owner
 *	set_id		- Set being added to
 *	album_id	- Album being added
 */
\echo zoto_set_add_album()
CREATE OR REPLACE FUNCTION zoto_set_add_album (owner int4, id int4, album int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
		work_rec RECORD;
	BEGIN
		-- Make sure the user owns the set
		PERFORM title from user_album_sets WHERE owner_userid=owner AND set_id=id;
		IF NOT FOUND THEN
			return_rec.code := -1;
			return_rec.message := 'User doesn\'t own set';
			RETURN return_rec;
		END IF;

		-- Now make sure they own the album
		PERFORM title FROM user_albums WHERE owner_userid=owner AND album_id=album;
		IF NOT FOUND THEN
			return_rec.code := -1;
			return_rec.message := 'User doesn\'t own album';
			RETURN return_rec;
		END IF;

		-- Everything checks out.  Insert the record.
		BEGIN
			INSERT INTO
				user_album_set_xref_albums (
					set_id,
					album_id,
					album_idx
				) VALUES (
					id,
					album,
					0
				);
		EXCEPTION WHEN unique_violation THEN
		   return_rec.code := -1;
		   return_rec.code := 'Album already in set';
		   return return_rec;
		END;

		PERFORM
			main_image_id
		FROM
			user_album_sets
		WHERE
			set_id = id AND
			main_image_id IS NOT NULL;

		IF NOT FOUND THEN
			SELECT INTO work_rec
				t2.image_id
			FROM
				user_album_set_xref_albums t1
				JOIN user_album_xref_user_images t2 USING (album_id)
			WHERE
				set_id = id;

			IF NOT FOUND THEN
				return_rec.code := -1;
				return_rec.message := 'Error setting main image';
				RETURN return_rec;
			ELSE
				UPDATE
					user_album_sets
				SET
					main_image_id = work_rec.image_id
				WHERE
					set_id = id;
			END IF;
		END IF;

		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_set_add_album(int4, int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_set_del_album()
 *
 * Deletes an album from a set.
 *
 * PARAMS:
 * 	owner		- Set owner
 *	set_id		- Set being deleted from
 *	album_id	- Album being deleted
 */
\echo zoto_set_del_album()
CREATE OR REPLACE FUNCTION zoto_set_del_album (owner int4, set int4, album int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
	BEGIN
		DELETE FROM
			user_album_set_xref_albums
		WHERE
			set_id = set AND
			album_id = album;

		-- If this album had the main image being used for this set, find another
		-- or set it to null
		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_set_del_album(int4, int4, int4) OWNER TO aztk;

/********************************************************************************
 *                                                                              *
 *                                 M E S S A G E S                              *
 *                                                                              *
 ********************************************************************************/

/*********************************************************************************
 * zoto_add_user_message()
 *
 * Adds an outgoing user message
 *
 * PARAMS:
 * 	from_user	- user the message is originating from
 *	to_user		- user the message is directed to
 *	subject		- subject of the message
 *	body		- body of the message
 *	reply_to	- ID of the message being replied to, or -1
 */
\echo zoto_add_user_message()
CREATE OR REPLACE FUNCTION zoto_add_user_message (from_user int4, to_user int4, subject_text varchar, body_text varchar, reply_to int4)
RETURNS  zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
	BEGIN
		BEGIN			
			INSERT INTO
				user_messages (
					from_userid,
					to_userid,
					subject,
					body
				) VALUES (
					from_user,
					to_user,
					subject_text,
					body_text
				);
				IF reply_to != -1 THEN
					UPDATE
						user_messages
					SET
						received_status = 2
					WHERE
						message_id = reply_to;
				END IF;
		EXCEPTION WHEN foreign_key_violation THEN
				return_rec.code := -1;
				return_rec.message := 'To user ' || to_user || 'does not exist.';
				RETURN return_rec;
		END;
		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_add_user_message(int4, int4, varchar, varchar, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_del_user_sent_message()
 *
 * Deletes a message a user has sent.  If the receiver has deleted it as well, it is
 * truly deleted from the system.
 *
 * PARAMS:
 * 	from_user	- user the message originated from
 *	id			- id of the message being deleted
 */
\echo zoto_del_user_sent_message()
CREATE OR REPLACE FUNCTION zoto_del_user_sent_message (from_user int4, id int4)
RETURNS  zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
	BEGIN
		PERFORM
			message_id
		FROM
			user_messages
		WHERE
			from_userid = from_user AND
			message_id = id AND
			received_status = -1
		LIMIT
			1;

		IF FOUND THEN
			-- Receiver has already deleted it.  Trash the record.
			DELETE FROM
				user_messages
			WHERE
				from_userid = from_user AND
				message_id = id;
		ELSE
			UPDATE
				user_messages
			SET
				sent_status = -1
			WHERE
				from_userid = from_user AND
				message_id = id;
		END IF;
		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_del_user_sent_message(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_del_user_received_message()
 *
 * Deletes a message a user has received.  If the sender has deleted it as well, it is
 * truly deleted from the system.
 *
 * PARAMS:
 * 	to_user		- user who received the message
 *	id			- id of the message being deleted
 */
\echo zoto_del_user_received_message()
CREATE OR REPLACE FUNCTION zoto_del_user_received_message (to_user int4, id int4)
RETURNS  zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
	BEGIN
		PERFORM
			message_id
		FROM
			user_messages
		WHERE
			to_userid = to_user AND
			message_id = id AND
			sent_status = -1
		LIMIT
			1;

		IF FOUND THEN
			-- Sender has already deleted it.  Trash the record.
			DELETE FROM
				user_messages
			WHERE
				to_userid = to_user AND
				message_id = id;
		ELSE
			UPDATE
				user_messages
			SET
				received_status = -1
			WHERE
				to_userid = to_user AND
				message_id = id;
		END IF;
		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_del_user_received_message(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_update_user_message_status()
 *
 * Updates the status of a user message.
 *
 * PARAMS:
 * 	from_user	- user the message is originating from
 *	to_user		- user the message is directed to
 *	subject		- subject of the message
 *	body		- body of the message
 *	reply_to	- ID of the message being replied to, or -1
 */
\echo zoto_update_user_message_status()
CREATE OR REPLACE FUNCTION zoto_update_user_message_status (to_user int4, id int4, status int4)
RETURNS  zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
	BEGIN
		UPDATE
			user_messages
		SET
			received_status = status
		WHERE
			to_userid = to_user AND
			message_id = id;
		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_update_user_message_status(int4, int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_get_user_message_stats()
 *
 * Gathers statistical information about a particular user's messages.
 *
 * PARAMS:
 * 	owner_username	- User to get stats for.
 */
\echo zoto_get_user_message_stats()
CREATE OR REPLACE FUNCTION zoto_get_user_message_stats (owner int4)
RETURNS zoto_user_message_stats_type AS
	$body$
	DECLARE
		return_rec zoto_user_message_stats_type;
		work_rec RECORD;
	BEGIN
		-- total inbox
		SELECT INTO work_rec
			count(*) AS count
		FROM
			user_messages
		WHERE
			to_userid = owner AND
			received_status != -1;

		IF FOUND THEN
			return_rec.total_received = work_rec.count;
		END IF;

		-- total unread
		SELECT INTO work_rec
			count(*) AS count
		FROM
			user_messages
		WHERE
			to_userid = owner AND
			received_status = 0;

		IF FOUND THEN
			return_rec.total_unread = work_rec.count;
		END IF;

		-- total sent
		SELECT INTO work_rec
			count(*) AS count
		FROM
			user_messages
		WHERE
			from_userid = owner AND
			sent_status = 0;

		IF FOUND THEN
			return_rec.total_sent = work_rec.count;
		END IF;

		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_get_user_message_stats(int4) OWNER TO aztk;

\echo zoto_get_user_id()
CREATE OR REPLACE FUNCTION zoto_get_user_id(user_name varchar)
RETURNS int4 AS
	$body$
	DECLARE
		work_rec RECORD;
	BEGIN
		IF user_name = '' OR user_name = 'anonymous' THEN
			RETURN NULL;
		END IF;

		SELECT INTO work_rec
			userid
		FROM
			users
		WHERE
			username = user_name
		LIMIT
			1;
		IF FOUND THEN
			RETURN work_rec.userid;
		ELSE
			RETURN NULL;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_get_user_id(varchar) OWNER TO aztk;

\echo zoto_get_user_name()
CREATE OR REPLACE FUNCTION zoto_get_user_name(id int4)
RETURNS varchar AS
	$body$
	DECLARE
		work_rec RECORD;
	BEGIN
		IF id IS NULL THEN
			RETURN '';
		END IF;

		SELECT INTO work_rec
			username
		FROM
			users
		WHERE
			userid = id
		LIMIT
			1;
		IF FOUND THEN
			RETURN work_rec.username;
		ELSE
			RETURN '';
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_get_user_name(int4) OWNER TO aztk;

/********************************************************************************
 *                                                                              *
 *                               P R I N T I N G                                *
 *                                                                              *
 ********************************************************************************/

/*********************************************************************************
 * zoto_add_to_print_queue()
 *
 * Adds an image to a user's print queue.
 *
 * PARAMS:
 * 	owner           - owner of the print queue
 *	image		- image being added to the queue
 */
\echo zoto_add_to_print_queue()
CREATE OR REPLACE FUNCTION zoto_add_to_print_queue(owner int4, image int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
	BEGIN
		PERFORM
			image_id
		FROM
			user_print_queue
		WHERE
			owner_userid = owner AND
			image_id = image;

		IF FOUND THEN
			return_rec.code := -1;
			return_rec.message := 'IMAGE ALREADY IN QUEUE';
			RETURN return_rec;
		ELSE
			INSERT INTO
				user_print_queue (
					owner_userid,
					image_id
				) VALUES (
					owner,
					image
				);
			return_rec.code := 0;
			return_rec.message := 'success';
			RETURN return_rec;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_add_to_print_queue(int4, int4) OWNER TO aztk;

/*********************************************************************************
 * zoto_remove_from_print_queue()
 *
 * Removes an image from a user's print queue.
 *
 * PARAMS:
 * 	owner           - owner of the print queue
 *	image		- image being removed from the queue
 */
\echo zoto_remove_from_print_queue()
CREATE OR REPLACE FUNCTION zoto_remove_from_print_queue(owner int4, image int4)
	RETURNS zoto_return_type AS
	$body$
	DECLARE
		return_rec zoto_return_type;
	BEGIN
		DELETE FROM
			user_print_queue
		WHERE
			owner_userid = owner AND
			image_id = image;
		return_rec.code := 0;
		return_rec.message := 'success';
		RETURN return_rec;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_remove_from_print_queue(int4, int4) OWNER TO aztk;

/********************************************************************************
 *                                                                              *
 *                        V I E W   F U N C T I O N S                           *
 *                                                                              *
 ********************************************************************************/
/*
 * Materialized view logic.
 */

/*********************************************************************************
 * zoto_create_matview()
 *
 * Creates a materialized view based on an existing view
 *
 * PARAMS:
 * 	matview		- the name for the materialized view
 *	view_name	- the view it is based on.
 */
\echo zoto_create_matview()
CREATE OR REPLACE FUNCTION zoto_create_matview(matview NAME, view_name NAME)
	RETURNS void AS
	$body$
	DECLARE
		entry matviews%ROWTYPE;
	BEGIN
		SELECT INTO entry
			*
		FROM
			matviews
		WHERE
			mv_name = matview
		LIMIT
			1;
		IF FOUND THEN
			RAISE EXCEPTION 'Materialized view % already exists.', matview;
		END IF;

		EXECUTE 'CREATE TABLE ' || matview || ' AS SELECT * FROM ' || view_name;
		EXECUTE 'ALTER TABLE ' || matview || ' OWNER TO aztk';
		INSERT INTO
			matviews (
				mv_name,
				v_name,
				last_refresh
			) VALUES (
				matview,
				view_name,
				CURRENT_TIMESTAMP
			);
		RETURN;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_create_matview(NAME, NAME) OWNER TO aztk;

\echo zoto_drop_matview()
CREATE OR REPLACE FUNCTION zoto_drop_matview (matview NAME)
	RETURNS VOID AS
	$body$
	DECLARE
		entry matviews%ROWTYPE;
	BEGIN
		SELECT INTO entry
			*
		FROM
			matviews
		WHERE
			mv_name = matview
		LIMIT
			1;

		IF NOT FOUND THEN
			RAISE EXCEPTION 'Materialized view % does not exist', matview;
		END IF;

		EXECUTE 'DROP TABLE ' || matview;
		DELETE FROM
			matviews
		WHERE
			mv_name = matview;
		RETURN;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_drop_matview(NAME) OWNER TO aztk;

\echo zoto_refresh_matview()
CREATE OR REPLACE FUNCTION zoto_refresh_matview (matview NAME)
	RETURNS VOID AS
	$body$
	DECLARE
		entry matviews%ROWTYPE;
	BEGIN
		SELECT INTO entry
			*
		FROM
			matviews
		WHERE
			mv_name = matview;

		IF NOT FOUND THEN
			RAISE EXCEPTION 'Materialized view % does not exist.', matview;
		END IF;

		EXECUTE 'DELETE FROM ' || matview;
		EXECUTE 'INSERT INTO ' || matview || ' SELECT * FROM ' || entry.v_name;

		UPDATE
			matviews
		SET
			last_refresh = current_timestamp
		WHERE
			mv_name = matview;
		RETURN;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_refresh_matview(NAME) OWNER TO aztk;

/*
 * zoto_user_contact_groups_array_matview_refresh - OWNER
 *
 * Triggerd by
 *		- Adding contact group
 *		- Deleting contact group
 */
\echo zoto_user_contact_groups_array_matview_refresh_by_owner()
CREATE OR REPLACE FUNCTION zoto_user_contact_groups_array_matview_refresh_by_owner(owner int4)
	RETURNS VOID AS
	$body$
	BEGIN
		DELETE FROM
			zoto_user_contact_groups_array_matview
		WHERE
			owner_userid = owner;
		INSERT INTO
			zoto_user_contact_groups_array_matview
				SELECT
					*
				FROM
					zoto_user_contact_groups_array_view
				WHERE
					owner_userid = owner;
		RETURN;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_contact_groups_array_matview_refresh_by_owner(int4) OWNER TO aztk;

/*
 * zoto_member_contact_groups_array_matview_refresh - MEMBER
 *
 * Triggered by
 *		- Adding a contact to a group
 *		- Removing a contact from a group
 */
\echo zoto_member_contact_groups_array_matview_refresh_by_member()
CREATE OR REPLACE FUNCTION zoto_member_contact_groups_array_matview_refresh_by_member(member int4)
	RETURNS VOID AS
	$body$
	BEGIN
		DELETE FROM
			zoto_member_contact_groups_array_matview
		WHERE
			member_userid = member;
		INSERT INTO
			zoto_member_contact_groups_array_matview
				SELECT
					*
				FROM
					zoto_member_contact_groups_array_view
				WHERE
					member_userid = member;
		RETURN;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_member_contact_groups_array_matview_refresh_by_member(int4) OWNER TO aztk;

/*
 * zoto_image_permissions_matview_refresh - OWNER
 *
 *	Triggered by:
 *		- Altering account permissions
 *		- Adding a contact group
 *		- Deleting a contact group
 */
\echo zoto_image_permissions_matview_refresh_by_owner()
CREATE OR REPLACE FUNCTION zoto_image_permissions_matview_refresh_by_owner(userid int4)
	RETURNS VOID AS
	$body$
	BEGIN
		DELETE FROM
			zoto_image_permissions_matview
		USING
			user_images
		WHERE
			zoto_image_permissions_matview.image_id = user_images.image_id AND
			owner_userid = userid;
		INSERT INTO
			zoto_image_permissions_matview
				SELECT
					t1.*
				FROM
					zoto_image_permissions_view t1
					JOIN user_images t2 USING (image_id)
				WHERE
					owner_userid = userid;
		RETURN;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_image_permissions_matview_refresh_by_owner(int4) OWNER TO aztk;


/*
 * zoto_image_permissions_matview_add_group - OWNER
 *
 *	Triggered by:
 *		- Altering account permissions
 *		- Adding a contact group
 *		- Deleting a contact group
 */
\echo zoto_image_permissions_matview_add_group_by_owner()
CREATE OR REPLACE FUNCTION zoto_image_permissions_matview_add_group_by_owner(userid int4, groupid int4)
	RETURNS VOID AS
	$body$
	BEGIN
		UPDATE
			zoto_image_permissions_matview
		SET
			view_groups = CASE
				WHEN view_flag = 1 THEN view_groups + groupid
				ELSE view_groups
			END,
			tag_groups = CASE
				WHEN tag_flag = 1 THEN tag_groups + groupid
				ELSE tag_groups
			END,
			comment_groups = CASE
				WHEN comment_flag = 1 THEN comment_groups + groupid
				ELSE comment_groups
			END,
			print_groups = CASE
				WHEN print_flag = 1 THEN print_groups + groupid
				ELSE print_groups
			END,
			download_groups = CASE
				WHEN download_flag = 1 THEN download_groups + groupid
				ELSE download_groups
			END,
			geotag_groups = CASE
				WHEN geotag_flag = 1 THEN geotag_groups + groupid
				ELSE geotag_groups
			END,
			vote_groups = CASE
				WHEN vote_flag = 1 THEN vote_groups + groupid
				ELSE vote_groups
			END,
			blog_groups = CASE
				WHEN blog_flag = 1 THEN blog_groups + groupid
				ELSE blog_groups
			END
		FROM
			user_images
		WHERE
			zoto_image_permissions_matview.image_id = user_images.image_id AND
			owner_userid = userid AND (
				view_flag = 1 OR
				tag_flag = 1 OR
				comment_flag = 1 OR
				print_flag = 1 OR
				download_flag = 1 OR
				geotag_flag = 1 OR
				vote_flag = 1 OR
				blog_flag = 1
			);
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_image_permissions_matview_add_group_by_owner(int4, int4) OWNER TO aztk;

/*
 * zoto_image_permissions_matview_del_group - OWNER
 *
 *	Triggered by:
 *		- Deleting a contact group
 */
\echo zoto_image_permissions_matview_del_group_by_owner()
CREATE OR REPLACE FUNCTION zoto_image_permissions_matview_del_group_by_owner(userid int4, groupid int4)
	RETURNS VOID AS
	$body$
	BEGIN
		UPDATE
			zoto_image_permissions_matview
		SET
			view_groups = view_groups - groupid,
			tag_groups = tag_groups - groupid,
			comment_groups = comment_groups - groupid,
			print_groups = print_groups - groupid,
			download_groups = download_groups - groupid,
			geotag_groups = geotag_groups - groupid,
			vote_groups = vote_groups - groupid,
			blog_groups = blog_groups - groupid
		FROM
			user_images
		WHERE
			zoto_image_permissions_matview.image_id = user_images.image_id AND
			owner_userid = userid AND (
			intset(groupid) && view_groups OR
			intset(groupid) && tag_groups OR
			intset(groupid) && comment_groups OR
			intset(groupid) && print_groups OR
			intset(groupid) && download_groups OR
			intset(groupid) && geotag_groups OR
			intset(groupid) && vote_groups OR
			intset(groupid) && blog_groups);
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_image_permissions_matview_del_group_by_owner(int4, int4) OWNER TO aztk;

/*
 * zoto_image_permissions_matview_refresh - IMAGE
 *
 *	Triggered by:
 *		- Adding an image permission (adding an image)
 *		- Deleting an image permission (deleting an image)
 *		- Altering an image's permissions
 */
\echo zoto_image_permissions_matview_refresh_by_image()
CREATE OR REPLACE FUNCTION zoto_image_permissions_matview_refresh_by_image(image int4)
	RETURNS VOID AS
	$body$
	BEGIN
		DELETE FROM
			zoto_image_permissions_matview
		WHERE
			image_id = image;
		INSERT INTO
			zoto_image_permissions_matview
				SELECT
					*
				FROM
					zoto_image_permissions_view
				WHERE
					image_id = image;
		RETURN;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_image_permissions_matview_refresh_by_image(int4) OWNER TO aztk;


/*
 * zoto_image_public_permissions_matview_refresh - USER
 *
 *	Triggered by:
 *		- Altering account permissions
 */
\echo zoto_image_public_permissions_matview_refresh_by_user()
CREATE OR REPLACE FUNCTION zoto_image_public_permissions_matview_refresh_by_user(owner int4)
	RETURNS VOID AS
	$body$
	BEGIN
		DELETE FROM
			zoto_image_public_permissions_matview
		USING
			user_images
		WHERE
			zoto_image_public_permissions_matview.image_id = user_images.image_id AND
			owner_userid = owner;
		INSERT INTO
			zoto_image_public_permissions_matview
				SELECT
					t1.*
				FROM
					zoto_image_public_permissions_view t1
					JOIN user_images t2 USING (image_id)
				WHERE
					owner_userid = owner;
		RETURN;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_image_public_permissions_matview_refresh_by_user(int4) OWNER TO aztk;

/*
 * zoto_image_public_permissions_matview_refresh - IMAGE
 *
 *	Triggered by:
 *		- Altering an image's permission
 */
\echo zoto_image_public_permissions_matview_refresh_by_image()
CREATE OR REPLACE FUNCTION zoto_image_public_permissions_matview_refresh_by_image(image int4)
	RETURNS VOID AS
	$body$
	BEGIN
		DELETE FROM
			zoto_image_public_permissions_matview
		WHERE
			image_id = image;
		INSERT INTO
			zoto_image_public_permissions_matview
				SELECT
					*
				FROM
					zoto_image_public_permissions_view
				WHERE
					image_id = image;
		RETURN;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_image_public_permissions_matview_refresh_by_image(int4) OWNER TO aztk;

/*
 * zoto_user_tags_matview_refresh - USER + TAG
 *
 *	Triggered by:
 *		- Adding a tag to an image
 *		- Removing a tag from an image
 */
\echo zoto_user_tags_matview_refresh_by_user_tag()
CREATE OR REPLACE FUNCTION zoto_user_tags_matview_refresh_by_user_tag(owner int4, tag varchar)
	RETURNS VOID AS
	$body$
	DECLARE
		work_rec RECORD;
	BEGIN
		SELECT INTO work_rec
			cnt_images
		FROM
			zoto_user_tags_view
		WHERE
			owner_userid = owner AND
			tag_name = tag;
		IF FOUND THEN
			PERFORM
				owner_userid
			FROM
				zoto_user_tags_matview
			WHERE
				owner_userid = owner AND
				tag_name = tag;
			IF FOUND THEN
				UPDATE
					zoto_user_tags_matview
				SET
					cnt_images = work_rec.cnt_images
				WHERE
					owner_userid = owner AND
					tag_name = tag;
			ELSE
				INSERT INTO
					zoto_user_tags_matview (
						owner_userid,
						tag_name,
						cnt_images
					) VALUES (
						owner,
						tag,
						work_rec.cnt_images
					);
			END IF;
		ELSE
			DELETE FROM
				zoto_user_tags_matview
			WHERE
				tag_name = tag;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_tags_matview_refresh_by_user_tag(int4, varchar) OWNER TO aztk;

/*
 * zoto_user_public_tags_matview_refresh - USER
 *
 *	Triggered by:
 *		- Adding a tag to an image
 *		- Deleting a tag from an image
 *		- Altering an image's permissions
 *		- Altering account permissions
 */
\echo zoto_user_public_tags_matview_refresh_by_user()
CREATE OR REPLACE FUNCTION zoto_user_public_tags_matview_refresh_by_user(userid int4)
	RETURNS VOID AS
	$body$
	BEGIN
		DELETE FROM
			zoto_user_public_tags_matview
		WHERE
			owner_userid = userid;
		INSERT INTO
			zoto_user_public_tags_matview
				SELECT
					*
				FROM
					zoto_user_public_tags_view
				WHERE
					owner_userid = userid;
		RETURN;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_public_tags_matview_refresh_by_user(int4) OWNER TO aztk;

\echo zoto_user_public_tags_matview_refresh_by_user_tag()
CREATE OR REPLACE FUNCTION zoto_user_public_tags_matview_refresh_by_user_tag(owner int4, tag varchar)
	RETURNS VOID AS
	$body$
	DECLARE
		work_rec RECORD;
	BEGIN
		SELECT INTO work_rec
			cnt_images
		FROM
			zoto_user_public_tags_view
		WHERE
			owner_userid = owner AND
			tag_name = tag;
		IF work_rec.cnt_images <= 0 THEN
			DELETE FROM
				zoto_user_public_tags_matview
			WHERE
				tag_name = tag;
		ELSE
			UPDATE
				zoto_user_public_tags_matview
			SET
				cnt_images = work_rec.cnt_images
			WHERE
				owner_userid = owner AND
				tag_name = tag;
		END IF;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_public_tags_matview_refresh_by_user_tag(int4, varchar) OWNER TO aztk;

\echo zoto_user_public_tags_matview_refresh_by_user_image()
CREATE OR REPLACE FUNCTION zoto_user_public_tags_matview_refresh_by_user_image(userid int4, imageid int4)
	RETURNS VOID AS
	$body$
	DECLARE
		tag_rec RECORD;
		work_rec RECORD;
	BEGIN
		FOR tag_rec IN
			SELECT
				tag_name 
			FROM
				user_image_tags 
			WHERE
				image_id = imageid
		LOOP
			SELECT INTO work_rec
				count(*) AS count
			FROM
				zoto_user_public_tags_view
			WHERE
				tag_name = tag_rec.tag_name AND
				owner_userid = userid;

			IF work_rec.count <= 0 THEN
				DELETE FROM
					zoto_user_public_tags_matview
				WHERE
					tag_name = tag_rec.tag_name;
			ELSE
				UPDATE
					zoto_user_public_tags_matview
				SET
					cnt_images = work_rec.count
				WHERE
					tag_name = tag_rec.tag_name AND
					owner_userid = userid;
			END IF;
		END LOOP;
	END;
	$body$
	LANGUAGE 'plpgsql';
ALTER FUNCTION zoto_user_public_tags_matview_refresh_by_user_image(int4, int4) OWNER TO aztk;

END;
