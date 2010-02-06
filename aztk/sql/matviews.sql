---[ MATERIALIZED VIEWS ]-----------------------------------------------------------------
BEGIN;

/********************************************************************************
 *                     zoto_user_contact_groups_array_matview                   *
 ********************************************************************************/
\echo Creating zoto_user_contact_groups_array...
CREATE OR REPLACE VIEW zoto_user_contact_groups_array_view AS
	SELECT
		owner_userid,
		zoto_array_accum(group_id) AS groups
	FROM
	        user_contact_groups
	GROUP BY
		owner_userid;

SELECT zoto_create_matview('zoto_user_contact_groups_array_matview', 'zoto_user_contact_groups_array_view');
ALTER TABLE zoto_user_contact_groups_array_matview ADD PRIMARY KEY (owner_userid);
CREATE INDEX zoto_user_contact_groups_array_matview_groups_idx
	ON zoto_user_contact_groups_array_matview USING gist (groups gist__int_ops);

/********************************************************************************
 *                   zoto_member_contact_groups_array_matview                   *
 ********************************************************************************/
\echo Creating zoto_member_contact_groups_array...
CREATE OR REPLACE VIEW zoto_member_contact_groups_array_view AS
	SELECT
		t1.userid AS member_userid,
		zoto_array_accum(t2.group_id) AS groups
	FROM
		users t1
		LEFT JOIN user_contact_group_xref_users t2 ON (t1.userid = t2.member_userid)
	GROUP BY
		t1.userid;

SELECT zoto_create_matview('zoto_member_contact_groups_array_matview', 'zoto_member_contact_groups_array_view');
ALTER TABLE zoto_member_contact_groups_array_matview ADD PRIMARY KEY (member_userid);
CREATE INDEX zoto_member_contact_groups_array_matview_groups_idx
	ON zoto_member_contact_groups_array_matview USING gist (groups gist__int_ops);

/********************************************************************************
 *                        zoto_image_permissions_matview                        *
 ********************************************************************************/
\echo Creating zoto_image_permissions...
CREATE OR REPLACE VIEW zoto_image_permissions_view AS
	SELECT
		t1.image_id,
		CASE
			WHEN (COALESCE(t3.view_flag, -1) = -1 OR COALESCE(t3.view_flag, -1) = 4) THEN t2.view_flag
			ELSE t3.view_flag
		END AS view_flag,
		CASE
			WHEN COALESCE(t3.view_flag, 4) = 4 THEN
				CASE
					WHEN t2.view_flag = 1 THEN COALESCE(t4.groups, '{}')
					WHEN t2.view_flag = 2 THEN COALESCE(t3.view_groups, '{}')
					ELSE '{}'
				END
			WHEN COALESCE(t3.view_flag, 4) = 1 THEN COALESCE(t4.groups, '{}')
			WHEN COALESCE(t3.view_flag, 4) = 2 THEN COALESCE(t3.view_groups, '{}')
			ELSE '{}'
		END AS view_groups,
		CASE
			WHEN COALESCE(t3.view_flag, 4) = 4 THEN false
			ELSE true
		END AS view_image_specific,
		CASE
			WHEN (COALESCE(t3.tag_flag, -1) = -1 OR COALESCE(t3.tag_flag, -1) = 4) THEN t2.tag_flag
			ELSE t3.tag_flag
		END AS tag_flag,
		CASE
			WHEN COALESCE(t3.tag_flag, 4) = 4 THEN
				CASE
					WHEN t2.tag_flag = 1 THEN COALESCE(t4.groups, '{}')
					WHEN t2.tag_flag = 2 THEN COALESCE(t3.tag_groups, '{}')
					ELSE '{}'
				END
			WHEN COALESCE(t3.tag_flag, 4) = 1 THEN COALESCE(t4.groups, '{}')
			WHEN COALESCE(t3.tag_flag, 4) = 2 THEN COALESCE(t3.tag_groups, '{}')
			ELSE '{}'
		END AS tag_groups,
		CASE
			WHEN COALESCE(t3.tag_flag, 4) = 4 THEN false
			ELSE true
		END AS tag_image_specific,
		CASE
			WHEN (COALESCE(t3.comment_flag, -1) = -1 OR COALESCE(t3.comment_flag, -1) = 4) THEN t2.comment_flag
			ELSE t3.comment_flag
		END AS comment_flag,
		CASE
			WHEN COALESCE(t3.comment_flag, 4) = 4 THEN
				CASE
					WHEN t2.comment_flag = 1 THEN COALESCE(t4.groups, '{}')
					WHEN t2.comment_flag = 2 THEN COALESCE(t3.comment_groups, '{}')
					ELSE '{}'
				END
			WHEN COALESCE(t3.comment_flag, 4) = 1 THEN COALESCE(t4.groups, '{}')
			WHEN COALESCE(t3.comment_flag, 4) = 2 THEN COALESCE(t3.comment_groups, '{}')
			ELSE '{}'
		END AS comment_groups,
		CASE
			WHEN COALESCE(t3.comment_flag, 4) = 4 THEN false
			ELSE true
		END AS comment_image_specific,
		CASE
			WHEN (COALESCE(t3.print_flag, -1) = -1 OR COALESCE(t3.print_flag, -1) = 4) THEN t2.print_flag
			ELSE t3.print_flag
		END AS print_flag,
		CASE
			WHEN COALESCE(t3.print_flag, 4) = 4 THEN
				CASE
					WHEN t2.print_flag = 1 THEN COALESCE(t4.groups, '{}')
					WHEN t2.print_flag = 2 THEN COALESCE(t3.print_groups, '{}')
					ELSE '{}'
				END
			WHEN COALESCE(t3.print_flag, 4) = 1 THEN COALESCE(t4.groups, '{}')
			WHEN COALESCE(t3.print_flag, 4) = 2 THEN COALESCE(t3.print_groups, '{}')
			ELSE '{}'
		END AS print_groups,
		CASE
			WHEN COALESCE(t3.print_flag, 4) = 4 THEN false
			ELSE true
		END AS print_image_specific,
		CASE
			WHEN (COALESCE(t3.download_flag, -1) = -1 OR COALESCE(t3.download_flag, -1) = 4) THEN t2.download_flag
			ELSE t3.download_flag
		END AS download_flag,
		CASE
			WHEN COALESCE(t3.download_flag, 4) = 4 THEN
				CASE
					WHEN t2.download_flag = 1 THEN COALESCE(t4.groups, '{}')
					WHEN t2.download_flag = 2 THEN COALESCE(t3.download_groups, '{}')
					ELSE '{}'
				END
			WHEN COALESCE(t3.download_flag, 4) = 1 THEN COALESCE(t4.groups, '{}')
			WHEN COALESCE(t3.download_flag, 4) = 2 THEN COALESCE(t3.download_groups, '{}')
			ELSE '{}'
		END AS download_groups,
		CASE
			WHEN COALESCE(t3.download_flag, 4) = 4 THEN false
			ELSE true
		END AS download_image_specific,
		CASE
			WHEN (COALESCE(t3.geotag_flag, -1) = -1 OR COALESCE(t3.geotag_flag, -1) = 4) THEN t2.geotag_flag
			ELSE t3.geotag_flag
		END AS geotag_flag,
		CASE
			WHEN COALESCE(t3.geotag_flag, 4) = 4 THEN
				CASE
					WHEN t2.geotag_flag = 1 THEN COALESCE(t4.groups, '{}')
					WHEN t2.geotag_flag = 2 THEN COALESCE(t3.geotag_groups, '{}')
					ELSE '{}'
				END
			WHEN COALESCE(t3.geotag_flag, 4) = 1 THEN COALESCE(t4.groups, '{}')
			WHEN COALESCE(t3.geotag_flag, 4) = 2 THEN COALESCE(t3.geotag_groups, '{}')
			ELSE '{}'
		END AS geotag_groups,
		CASE
			WHEN COALESCE(t3.geotag_flag, 4) = 4 THEN false
			ELSE true
		END AS geotag_image_specific,
		CASE
			WHEN (COALESCE(t3.vote_flag, -1) = -1 OR COALESCE(t3.vote_flag, -1) = 4) THEN t2.vote_flag
			ELSE t3.vote_flag
		END AS vote_flag,
		CASE
			WHEN COALESCE(t3.vote_flag, 4) = 4 THEN
				CASE
					WHEN t2.vote_flag = 1 THEN COALESCE(t4.groups, '{}')
					WHEN t2.vote_flag = 2 THEN COALESCE(t3.vote_groups, '{}')
					ELSE '{}'
				END
			WHEN COALESCE(t3.vote_flag, 4) = 1 THEN COALESCE(t4.groups, '{}')
			WHEN COALESCE(t3.vote_flag, 4) = 2 THEN COALESCE(t3.vote_groups, '{}')
			ELSE '{}'
		END AS vote_groups,
		CASE
			WHEN COALESCE(t3.vote_flag, 4) = 4 THEN false
			ELSE true
		END AS vote_image_specific,
		CASE
			WHEN (COALESCE(t3.blog_flag, -1) = -1 OR COALESCE(t3.blog_flag, -1) = 4) THEN t2.blog_flag
			ELSE t3.blog_flag
		END AS blog_flag,
		CASE
			WHEN COALESCE(t3.blog_flag, 4) = 4 THEN
				CASE
					WHEN t2.blog_flag = 1 THEN COALESCE(t4.groups, '{}')
					WHEN t2.blog_flag = 2 THEN COALESCE(t3.blog_groups, '{}')
					ELSE '{}'
				END
			WHEN COALESCE(t3.blog_flag, 4) = 1 THEN COALESCE(t4.groups, '{}')
			WHEN COALESCE(t3.blog_flag, 4) = 2 THEN COALESCE(t3.blog_groups, '{}')
			ELSE '{}'
		END AS blog_groups,
		CASE
			WHEN COALESCE(t3.blog_flag, 4) = 4 THEN false
			ELSE true
		END AS blog_image_specific
	FROM
		user_images t1
		JOIN account_image_permissions t2 USING (owner_userid)
		JOIN user_image_permissions t3 USING (image_id)
		JOIN zoto_user_contact_groups_array_matview t4 USING (owner_userid);

SELECT zoto_create_matview('zoto_image_permissions_matview', 'zoto_image_permissions_view');
ALTER TABLE zoto_image_permissions_matview ADD PRIMARY KEY (image_id);
CREATE INDEX zoto_image_permissions_matview_view_flag_idx
	ON zoto_image_permissions_matview (view_flag);
CREATE INDEX zoto_image_permissions_matview_view_groups_idx
	ON zoto_image_permissions_matview USING gist (view_groups gist__int_ops);
CREATE INDEX zoto_image_permissions_matview_tag_flag_idx
	ON zoto_image_permissions_matview (tag_flag);
CREATE INDEX zoto_image_permissions_matview_tag_groups_idx
	ON zoto_image_permissions_matview USING gist (tag_groups gist__int_ops);
CREATE INDEX zoto_image_permissions_matview_comment_flag_idx
	ON zoto_image_permissions_matview (comment_flag);
CREATE INDEX zoto_image_permissions_matview_comment_groups_idx
	ON zoto_image_permissions_matview USING gist (comment_groups gist__int_ops);
CREATE INDEX zoto_image_permissions_matview_print_flag_idx
	ON zoto_image_permissions_matview (print_flag);
CREATE INDEX zoto_image_permissions_matview_print_groups_idx
	ON zoto_image_permissions_matview USING gist (print_groups gist__int_ops);
CREATE INDEX zoto_image_permissions_matview_download_flag_idx
	ON zoto_image_permissions_matview (download_flag);
CREATE INDEX zoto_image_permissions_matview_download_groups_idx
	ON zoto_image_permissions_matview USING gist (download_groups gist__int_ops);
CREATE INDEX zoto_image_permissions_matview_geotag_flag_idx
	ON zoto_image_permissions_matview (geotag_flag);
CREATE INDEX zoto_image_permissions_matview_geotag_groups_idx
	ON zoto_image_permissions_matview USING gist (geotag_groups gist__int_ops);
CREATE INDEX zoto_image_permissions_matview_vote_flag_idx
	ON zoto_image_permissions_matview (vote_flag);
CREATE INDEX zoto_image_permissions_matview_vote_groups_idx
	ON zoto_image_permissions_matview USING gist (vote_groups gist__int_ops);
CREATE INDEX zoto_image_permissions_matview_blog_flag_idx
	ON zoto_image_permissions_matview (blog_flag);
CREATE INDEX zoto_image_permissions_matview_blog_groups_idx
	ON zoto_image_permissions_matview USING gist (blog_groups gist__int_ops);

/********************************************************************************
 *                      zoto_image_public_permissions_matview                   *
 ********************************************************************************/
\echo Creating zoto_image_public_permissions...
CREATE OR REPLACE VIEW zoto_image_public_permissions_view AS
	SELECT
		image_id,
		view_flag = 0 AS can_view,
		tag_flag = 0 AS can_tag,
		comment_flag = 0 AS can_comment,
		print_flag = 0 AS can_print,
		download_flag = 0 AS can_download,
		geotag_flag = 0 AS can_geotag,
		vote_flag = 0 AS can_vote,
		blog_flag = 0 AS can_blog
	FROM
		zoto_image_permissions_matview;

SELECT zoto_create_matview('zoto_image_public_permissions_matview', 'zoto_image_public_permissions_view');
ALTER TABLE zoto_image_public_permissions_matview ADD PRIMARY KEY (image_id);
CREATE INDEX zoto_image_public_permissions_matview_can_view_idx
	ON zoto_image_public_permissions_matview (can_view);

/********************************************************************************
 *                     	      zoto_user_tags                                    *
 ********************************************************************************/
\echo Creating zoto_user_tags...
CREATE OR REPLACE VIEW zoto_user_tags_view AS
	SELECT
		t2.owner_userid,
		t1.tag_name,
		count(t1.image_id) AS cnt_images
	FROM
		user_image_tags t1
		JOIN user_images t2 USING (image_id)
	GROUP BY
		t2.owner_userid,
		t1.tag_name
	ORDER BY
		t2.owner_userid,
		t1.tag_name ASC;

SELECT zoto_create_matview('zoto_user_tags_matview', 'zoto_user_tags_view');
ALTER TABLE zoto_user_tags_matview ADD PRIMARY KEY (owner_userid, tag_name);
CREATE INDEX zoto_user_tags_matview_owner_userid_idx
	ON zoto_user_tags_matview (owner_userid);
CREATE INDEX zoto_user_tags_matview_tag_name_idx
	ON zoto_user_tags_matview (tag_name);

/********************************************************************************
 *                     	      zoto_user_public_tags                             *
 ********************************************************************************/
\echo Creating zoto_user_public_tags...
CREATE OR REPLACE VIEW zoto_user_public_tags_view AS
	SELECT
		t2.owner_userid,
		t1.tag_name,
		count(t1.image_id) AS cnt_images
	FROM
		user_image_tags t1
		JOIN user_images t2 USING (image_id)
		JOIN zoto_image_public_permissions_matview t3 USING (image_id)
	WHERE
		t3.can_view = true
	GROUP BY
		t2.owner_userid,
		t1.tag_name
	ORDER BY
		t2.owner_userid,
		t1.tag_name ASC;

SELECT zoto_create_matview('zoto_user_public_tags_matview', 'zoto_user_public_tags_view');
ALTER TABLE zoto_user_public_tags_matview ADD PRIMARY KEY (owner_userid, tag_name);
CREATE INDEX zoto_user_public_tags_matview_owner_userid_idx
	ON zoto_user_public_tags_matview (owner_userid);
CREATE INDEX zoto_user_public_tags_matview_tag_name_idx
	ON zoto_user_public_tags_matview (tag_name);

END;
