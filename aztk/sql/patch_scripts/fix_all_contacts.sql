CREATE OR REPLACE FUNCTION zoto_fix_all_contacts()
RETURNS void AS
	$body$
	DECLARE
		work_rec RECORD;
		id_rec RECORD;
	BEGIN
		FOR work_rec IN
			SELECT
				owner_username,
				owner_userid,
				member_username,
				member_userid
			FROM
				user_contact_groups t1
				JOIN user_contact_group_xref_users t2 USING (group_id)
			WHERE
				group_name = '*all_contacts*'
			LOOP
			INSERT INTO
				user_contact_groups (
					owner_username,
					owner_userid,
					group_name,
					group_type
				) VALUES (
					work_rec.owner_username,
					work_rec.owner_userid,
					work_rec.member_username,
					'U'
				);
			SELECT INTO id_rec currval('user_contact_groups_group_id_seq') AS new_id;
			INSERT INTO
				user_contact_group_xref_users (
					group_id,
					member_username,
					member_userid
				) VALUES (
					id_rec.new_id,
					work_rec.member_username,
					work_rec.member_userid
				);
		END LOOP;
	END;
	$body$
	LANGUAGE 'plpgsql';

SELECT zoto_fix_all_contacts();
DELETE FROM user_contact_groups WHERE group_name = '*all_contacts*';
DROP FUNCTION zoto_fix_all_contacts();
				
