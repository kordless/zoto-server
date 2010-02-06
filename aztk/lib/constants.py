"""
Provides various constants in use around the AZTK land.

constants.py
"""

# nanny codes
C_RUNNING_OK = 200
C_RUNNING_NOPB = 205
C_STARTING = 210
C_STOP_SUCCESS = 220
C_DOWN = 400
C_STOP_FAILURE = 405
C_START_FAILURE = 410
C_ALREADY_RUNNING = 415
C_ALREADY_DOWN = 420
C_WTF = 450

AZTK_EXIT_CODES = {
	20: 'POSTGRES UNAVAILABLE',
	25: 'BROKEN INSTANCE PACKAGE(S)',
	30: 'PID ALREADY RUNNING',
	35: 'FAILED IMPORTS',
	}

# Image size constants
# used for old links and some Binary calls
ORIGINAL = 'original'
CUSTOM = 'custom'
SIZES = [ORIGINAL, CUSTOM]

SAVE_OPTS = {'quality': 85}

# account feature keys (for check_feature in Account API)
ACCOUNT_BROWSE = "browse"
ACCOUNT_LOGIN = "login"
ACCOUNT_INDEX = "index"
ACCOUNT_AGGREGATE = "aggregate"
ACCOUNT_PERMISSIONS = "permissions"
ACCOUNT_CAN_UPLOAD_VIA_EMAIL = "feature_can_upload_via_email"
ACCOUNT_CAN_BLOG = "feature_can_blog"
ACCOUNT_PRIORITY_SUPPORT = "feature_priority_support"
ACCOUNT_HIDE_ADS = "feature_hide_ads"
ACCOUNT_MAX_GALLERIES = "feature_max_galleries"
ACCOUNT_GOLD_BADGE = "feature_gold_badge"

# user flags (must be bitwise values example, 1,2,4,8,16,etc...)
USER_RECEIVE_ZOTO_EMAIL = 1

# --- Gallery tags --- #

# Loops
GAL_LOOP_BEGIN_TAG		= "$beg_gallery_list$"
GAL_LOOP_END_TAG		= "$end_gallery_list$"
IMG_LOOP_BEGIN_TAG		= "$beg_image_list$"
IMG_LOOP_END_TAG		= "$end_image_list$"
COMMENT_LOOP_BEGIN_TAG	= "$beg_comment_list$"
COMMENT_LOOP_END_TAG	= "$end_comment_list$"
USER_LOOP_BEGIN_TAG		= "$beg_user_list$"
USER_LOOP_END_TAG		= "$end_user_list$"

# Gallery level
GAL_TAGS = {
	'id': "%gal_id%",
	'username': "%gal_username%",
	'username_possesive': "%gal_username_possesive%",
	'title': "%gal_name%",
	'desc': "%gal_desc%",
	'image': "%gal_image%",
	'link': "%gal_link%",
	'email_link': "%gal_email_link%",
	'count': "%gal_img_count%",
	'page_title': "%gal_page_title%",
	'feed_rss': "%gal_feed_rss%",
	'feed_atom': "%gal_feed_atom%"
}

# User tags
USER_TAGS = {
	'date_joined': "%user_date_joined%",
	'date_last_login': "%user_date_last_login%",
	'img_count': "%user_img_count%",
	'bio': "%user_bio%"
}

# Images
IMG_TAGS = {
	'name': "%img_name%",
	'desc': "%img_desc%",
	'date': "%img_date%",
	'prev': "%%img_prev%s%%",
	'next': "%%img_next%s%%",
	'id': "%img_id%",
	'hash': "%img_hash%",
	'offset': "%img_offset%",
	'size': "%img_size%",
	'owner': "%img_owner%",
	'detail_size': "%img_detail_size%",
	'comments_link': "%img_comments_link%",
	'comment_count': "%img_comment_count%",
	'detail_link': "%img_detail_link%",
	'camera_make': "%img_camera_make%",
	'camera_model': "%img_camera_model%",
	'exposure_time': "%img_exposure_time%",
	'focal_length': "%img_focal_length%",
	'fstop': "%img_fstop%",
	'iso_speed': "%img_iso_speed%",
	'rendered_width': "%img_rendered_width%",
	'rendered_height': "%img_rendered_height%"
}

# Comments
COMMENT_TAGS = {
	'author': "%comment_author%",
	'date': "%comment_date%",
	'body': "%comment_body%"
}

# Pagination
PAGE_PREV_TAG		= "%page_prev%"
PAGE_NEXT_TAG		= "%page_next%"
PAGE_FIRST_TAG		= "%page_first%"
PAGE_LAST_TAG		= "%page_last%"
PAGINATION_TAG		= "%pagination%"
GALLERY_URL		= "/galleries/%s/%s"
GALLERY_DETAIL_URL	= "/galleries/%s/detail/%s/"
GALLERY_COMMENT_URL	= "/galleries/%s/comments/%s"
GALLERY_EMAIL_URL	= "/galleries/%s/email/"
EMAIL_FORM_TAG		= "%email_form%"
COMMENT_FORM_TAG	= "%comment_form%"
LOGGED_IN_TAG		= "%logged_in%"

