/*
 * sql/types.sql
 *
 * Author: Josh Williams
 * Date Added: Fri Feb 16 12:16:26 CST 2007
 *
 * Custom Zoto data types.
 */
DROP TYPE zoto_return_type CASCADE;
CREATE TYPE zoto_return_type AS (code int4, message varchar);

DROP TYPE zoto_account_stats_type CASCADE;
CREATE TYPE zoto_account_stats_type AS (cnt_tags int4, cnt_images int4, cnt_albums int4, cnt_comments int4, cnt_user_comments int4, cnt_user_contacts int4, cnt_user_as_contacts int4, cnt_mutual_contacts int4);

DROP TYPE zoto_user_message_stats_type CASCADE;
CREATE TYPE zoto_user_message_stats_type AS (total_received int4, total_unread int4, total_sent int4);

