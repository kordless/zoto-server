---[ INITIAL DATA ]------------------------------------------------------------
BEGIN;

INSERT INTO account_types values 
	(0, 'anonymous', 'anonymous', 0, 'F', 'T');
INSERT INTO account_types values 
	(1, 'old_free', 'the free users from zoto 2.x', CAST((2*1024*1024) as int8), 'F', 'T');
INSERT INTO account_types values 
	(2, 'old_paid', 'the paid users from zoto 2.x', CAST((10*1024*1024) as int8), 'F', 'T');
INSERT INTO account_types values 
	(10, 'user', 'The generic user account (paid)', CAST((10*1024*1024) as int8), 'T', 'T');
INSERT INTO account_types values
	(25, 'guest', 'Guest account type for albums', CAST(0 as int8), 'F', 'T');
INSERT INTO account_types values 
	(50, 'staff', 'zoto staff accounts', CAST((100*1024*1024) as int8), 'F', 'T');

INSERT INTO account_pricing values
	(0, 10, 365, 29.95, 'Zoto PRO Subscription (1 year)');
INSERT INTO account_pricing values
	(0, 10, 365*2, 49.95, 'Zoto PRO Subscription (2 year)');
INSERT INTO account_pricing values
	(1, 10, 365, 9.95, '[UPGRADE] Zoto PRO Subscription (1 year)');
INSERT INTO account_pricing values
	(1, 10, 365*2, 19.95, '[UPGRADE] Zoto PRO Subscription (2 year)');
INSERT INTO account_pricing values
	(2, 10, 365, 9.95, 'Zoto PRO Subscription (1 year)');
INSERT INTO account_pricing values
	(2, 10, 365*2, 19.95, 'Zoto PRO Subscription (2 year)');
INSERT INTO account_pricing values
	(10, 10, 365, 29.95, '[RENEWAL] Zoto PRO Subscription (1 year)');
INSERT INTO account_pricing values
	(10, 10, 365*2, 49.95, '[RENEWAL] Zoto PRO Subscription (2 year)');

INSERT INTO account_statuses values
	(100, 'Normal', DEFAULT, DEFAULT, DEFAULT, DEFAULT, '1');
INSERT INTO account_statuses values
	(200, 'Pending Payment', '0', '0', '0', '0', '0');
INSERT INTO account_statuses values
	(400, 'Under Review', '1', '1', '0', '0', '0');
INSERT INTO account_statuses values
	(405, 'Homepage Ban; confirmed user ban', '1', '1', '0', '0', '0');
INSERT INTO account_statuses values
	(410, 'Suspended (AUP)', '0', '0', '0', '0', '0');
INSERT INTO account_statuses values
	(420, 'Suspended (Billing)', '0', '1', '0', '0', '0');
INSERT INTO account_statuses values
	(450, 'Suspended (Other - with browsing)', '0', '1', '0', '0', '0');
INSERT INTO account_statuses values
	(455, 'Suspended (Other - no browsing)', '0', '0', '0', '0', '0');
INSERT INTO account_statuses values
	(500, 'Cancelled', '0', '0', '0', '0', '0');
INSERT INTO account_statuses values
	(600, 'Expired', '0', '0', '0', '0', '0');

INSERT INTO activity_types values (100, 'NEW_USER');
INSERT INTO activity_types values (200, 'NEW_COMMENT');
INSERT INTO activity_types values (300, 'NEW_TAG');
INSERT INTO activity_types values (400, 'NEW_MEDIA');

INSERT INTO api_keys values
	('5d4a65c46a072a4542a816f2f28bd01a', 'Fat Tony', 'Zoto AJAX access', 'nobody@nowhere.org', 'www.zoto.org', current_timestamp);
INSERT INTO api_keys values
	('68046733e4659165a4f59a1918cb1408', 'Fat Tony', 'Zoto Uploader', 'support@zoto.com', 'www.zoto.org', current_timestamp);

INSERT INTO export_services VALUES (1, 'Flickr');
INSERT INTO export_services VALUES (2, 'Blogger Beta');

INSERT INTO media_sources values (DEFAULT, 'Web Upload Form');
INSERT INTO media_sources values (DEFAULT, 'ZULU Client');
INSERT INTO media_sources values (DEFAULT, 'ZAPI');
INSERT INTO media_sources values (DEFAULT, 'Email Upload');

INSERT INTO media_types values(DEFAULT, 'image/jpeg');
INSERT INTO media_types values(DEFAULT, 'image/png');
INSERT INTO media_types values(DEFAULT, 'image/gif');

INSERT INTO partners values (DEFAULT, 'zoto.com');

INSERT INTO homepage_widget_types VALUES (1, 'zoto_widget_featured_photos', true, true);
INSERT INTO homepage_widget_types VALUES (2, 'zoto_widget_user_info', true, true);
INSERT INTO homepage_widget_types VALUES (3, 'zoto_widget_user_globber', true, true);
INSERT INTO homepage_widget_types VALUES (4, 'zoto_widget_tag_cloud', true, true);
INSERT INTO homepage_widget_types VALUES (5, 'zoto_widget_featured_albums', true, true);
INSERT INTO homepage_widget_types VALUES (6, 'zoto_widget_tips', true, false);
INSERT INTO homepage_widget_types VALUES (7, 'zoto_widget_user_album', true, true);
INSERT INTO homepage_widget_types VALUES (8, 'zoto_widget_comments', true, true);
INSERT INTO homepage_widget_types VALUES (9, 'zoto_widget_contacts', true, true);
INSERT INTO homepage_widget_types VALUES (10, 'zoto_widget_news', true, false);

END;
