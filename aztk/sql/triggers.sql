---[ TRIGGERS ]---------------------------------------------------
BEGIN;

/********************************************************************************
 *                                                                              *
 *                   U S E R _ I M A G E _ P E R M I S S I O N S                *
 *                                                                              *
 ********************************************************************************/
/*
 * INSERT
 */
\echo user_image_permissions_itf()
CREATE OR REPLACE FUNCTION user_image_permissions_itf()
	RETURNS TRIGGER AS
	$body$
	BEGIN
		PERFORM
			zoto_image_permissions_matview_refresh_by_image(NEW.image_id);
		PERFORM
			zoto_image_public_permissions_matview_refresh_by_image(NEW.image_id);
		RETURN NULL;
	END;
	$body$
	LANGUAGE 'plpgsql';

\echo user_image_permissions_it()
CREATE TRIGGER user_image_permissions_it
	AFTER INSERT ON user_image_permissions
	FOR EACH ROW EXECUTE PROCEDURE user_image_permissions_itf();
/*
 * DELETE
 */
\echo user_image_permissions_dtf()
CREATE OR REPLACE FUNCTION user_image_permissions_dtf()
	RETURNS TRIGGER AS
	$body$
	BEGIN
		PERFORM
			zoto_image_permissions_matview_refresh_by_image(OLD.image_id);
		PERFORM
			zoto_image_public_permissions_matview_refresh_by_image(OLD.image_id);
		RETURN NULL;
	END;
	$body$
	LANGUAGE 'plpgsql';

\echo user_image_permissions_dt()
CREATE TRIGGER user_image_permissions_dt
	AFTER DELETE ON user_image_permissions
	FOR EACH ROW EXECUTE PROCEDURE user_image_permissions_dtf();
/*
 * UPDATE
 */
\echo user_image_permissions_utf()
CREATE OR REPLACE FUNCTION user_image_permissions_utf()
	RETURNS TRIGGER AS
	$body$
	DECLARE
		work_rec RECORD;
	BEGIN
		PERFORM
			zoto_image_permissions_matview_refresh_by_image(NEW.image_id);
		PERFORM
			zoto_image_public_permissions_matview_refresh_by_image(NEW.image_id);

		/*
		 * Don't do anything to the tags view if the image viewability didn't change.
		 */
		IF NEW.view_flag = OLD.view_flag THEN
			RETURN NULL;
		END IF;
		SELECT INTO work_rec
			owner_userid
		FROM
			user_images
		WHERE
			image_id = NEW.image_id
		LIMIT
			1;
		IF FOUND THEN
			PERFORM
				zoto_user_public_tags_matview_refresh_by_user_image(work_rec.owner_userid, NEW.image_id);
		END IF;
		RETURN NULL;
	END;
	$body$
	LANGUAGE 'plpgsql';

\echo user_image_permissions_ut()
CREATE TRIGGER user_image_permissions_ut
	AFTER UPDATE ON user_image_permissions
	FOR EACH ROW EXECUTE PROCEDURE user_image_permissions_utf();

/********************************************************************************
 *                                                                              *
 *               A C C O U N T _ I M A G E _ P E R M I S S I O N S              *
 *                                                                              *
 ********************************************************************************/
/*
 * UPDATE
 */
\echo account_image_permissions_utf()
CREATE OR REPLACE FUNCTION account_image_permissions_utf()
	RETURNS TRIGGER AS
	$body$
	BEGIN
		PERFORM
			zoto_image_permissions_matview_refresh_by_owner(NEW.owner_userid);
		PERFORM
			zoto_image_public_permissions_matview_refresh_by_user(NEW.owner_userid);
		IF NEW.view_flag != OLD.view_flag THEN
			PERFORM
				zoto_user_public_tags_matview_refresh_by_user(NEW.owner_userid);
		END IF;
		RETURN NULL;
	END;
	$body$
	LANGUAGE 'plpgsql';

\echo account_image_permissions_ut
CREATE TRIGGER account_image_permissions_ut
	AFTER UPDATE ON account_image_permissions
	FOR EACH ROW EXECUTE PROCEDURE account_image_permissions_utf();

/********************************************************************************
 *                                                                              *
 *                    U S E R _ C O N T A C T _ G R O U P S                     *
 *                                                                              *
 ********************************************************************************/
/*
 * INSERT
 */
\echo user_contact_groups_itf()
CREATE OR REPLACE FUNCTION user_contact_groups_itf()
	RETURNS TRIGGER AS
	$body$
	BEGIN
		PERFORM
			zoto_user_contact_groups_array_matview_refresh_by_owner(NEW.owner_userid);
		PERFORM
			zoto_image_permissions_matview_add_group_by_owner(NEW.owner_userid, NEW.group_id);
		RETURN NULL;
	END;
	$body$
	LANGUAGE 'plpgsql';

\echo user_contact_groups_it
CREATE TRIGGER user_contact_groups_it
	AFTER INSERT ON user_contact_groups
	FOR EACH ROW EXECUTE PROCEDURE user_contact_groups_itf();

/*
 * DELETE
 */
\echo user_contact_groups_dtf()
CREATE OR REPLACE FUNCTION user_contact_groups_dtf()
	RETURNS TRIGGER AS
	$body$
	BEGIN
		PERFORM
			zoto_user_contact_groups_array_matview_refresh_by_owner(OLD.owner_userid);
		PERFORM
			zoto_image_permissions_matview_del_group_by_owner(OLD.owner_userid, OLD.group_id);
		RETURN NULL;
	END;
	$body$
	LANGUAGE 'plpgsql';

\echo user_contact_groups_dt
CREATE TRIGGER user_contact_groups_dt
	AFTER DELETE ON user_contact_groups
	FOR EACH ROW EXECUTE PROCEDURE user_contact_groups_dtf();

/********************************************************************************
 *                                                                              *
 *         U S E R _ C O N T A C T _ G R O U P _ X R E F _ U S E R S            *
 *                                                                              *
 ********************************************************************************/
/*
 * INSERT
 */
\echo user_contact_group_xref_users_itf()
CREATE OR REPLACE FUNCTION user_contact_group_xref_users_itf()
	RETURNS TRIGGER AS
	$body$
	BEGIN
		PERFORM
			zoto_member_contact_groups_array_matview_refresh_by_member(NEW.member_userid);
		RETURN NULL;
	END;
	$body$
	LANGUAGE 'plpgsql';

\echo user_contact_group_xref_users_it
CREATE TRIGGER user_contact_group_xref_users_it
	AFTER INSERT ON user_contact_group_xref_users
	FOR EACH ROW EXECUTE PROCEDURE user_contact_group_xref_users_itf();

/*
 * DELETE
 */
\echo user_contact_group_xref_users_dtf()
CREATE OR REPLACE FUNCTION user_contact_group_xref_users_dtf()
	RETURNS TRIGGER AS
	$body$
	BEGIN
		PERFORM
			zoto_member_contact_groups_array_matview_refresh_by_member(OLD.member_userid);
		RETURN NULL;
	END;
	$body$
	LANGUAGE 'plpgsql';

\echo user_contact_group_xref_users_dt
CREATE TRIGGER user_contact_group_xref_users_dt
	AFTER DELETE ON user_contact_group_xref_users
	FOR EACH ROW EXECUTE PROCEDURE user_contact_group_xref_users_dtf();

/********************************************************************************
 *                                                                              *
 *                         U S E R _ I M A G E _ T A G S                        *
 *                                                                              *
 ********************************************************************************/
/*
 * INSERT
 */
\echo user_image_tags_itf()
CREATE OR REPLACE FUNCTION user_image_tags_itf()
	RETURNS TRIGGER AS
	$body$
	DECLARE
		work_rec RECORD;
	BEGIN
		SELECT INTO work_rec
			owner_userid
		FROM
			user_images
		WHERE
			image_id = NEW.image_id
		LIMIT
			1;
		IF FOUND THEN
			PERFORM
				zoto_user_tags_matview_refresh_by_user_tag(work_rec.owner_userid, NEW.tag_name);
			PERFORM
				zoto_user_public_tags_matview_refresh_by_user_tag(work_rec.owner_userid, NEW.tag_name);
		END IF;
		RETURN NULL;
	END;
	$body$
	LANGUAGE 'plpgsql';

\echo user_image_tags_it
CREATE TRIGGER user_image_tags_it
	AFTER INSERT ON user_image_tags
	FOR EACH ROW EXECUTE PROCEDURE user_image_tags_itf();

/*
 * DELETE
 */
\echo user_image_tags_dtf()
CREATE OR REPLACE FUNCTION user_image_tags_dtf()
	RETURNS TRIGGER AS
	$body$
	DECLARE
		work_rec RECORD;
	BEGIN
		SELECT INTO work_rec
			owner_userid
		FROM
			user_images
		WHERE
			image_id = OLD.image_id
		LIMIT
			1;
		IF FOUND THEN
			PERFORM
				zoto_user_tags_matview_refresh_by_user_tag(work_rec.owner_userid, OLD.tag_name);
			PERFORM
				zoto_user_public_tags_matview_refresh_by_user_tag(work_rec.owner_userid, OLD.tag_name);
		END IF;
		RETURN NULL;
	END;
	$body$
	LANGUAGE 'plpgsql';

\echo user_image_tags_dt
CREATE TRIGGER user_image_tags_dt
	AFTER DELETE ON user_image_tags
	FOR EACH ROW EXECUTE PROCEDURE user_image_tags_dtf();

END;
