---[ VIEWS ]-----------------------------------------------------------------
BEGIN;

/*
	zoto_album_permissions_view

	Derived permissions for every album on the system.  Will either be the permissions specifically
	applied to the album, or those derived from the owner's account level permissions.
*/
\echo zoto_album_permissions_view
CREATE OR REPLACE VIEW zoto_album_permissions_view AS
	SELECT
		t1.album_id,
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
		END AS view_album_specific,
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
		END AS comment_album_specific
	FROM
		user_albums t1
		JOIN account_album_permissions t2 USING (owner_userid)
		JOIN user_album_permissions t3 USING (album_id)
		JOIN zoto_user_contact_groups_array_matview t4 USING (owner_userid);

/*
	zoto_album_public_permissions_view

	Access the public at large has to a particular user's album.
*/
\echo zoto_album_public_permissions_view
CREATE OR REPLACE VIEW zoto_album_public_permissions_view AS
	SELECT
		album_id,
		view_flag = 0 AS can_view,
		comment_flag = 0 AS can_comment
	FROM
		zoto_album_permissions_view;

END;
