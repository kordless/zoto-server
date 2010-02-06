def make_url_from_lightbox(lightbox):
	params = lightbox.copy()
	params['cat_id'] = lightbox.get('category_id', 0)
	params['summary_year'] = lightbox.get('year', 0)
	params['summary_month'] = lightbox.get('month', 0)
	params['summary_day'] = lightbox.get('day', 0)
	params['type'] = lightbox.get('type', 'cat')
	if lightbox.has_key('recurse_category_id'):
		params['cat_id'] = lightbox['recurse_category_id']
		params['recurse'] = 1
	return make_url(params)

def make_url(params):
	"""
	Silliness copied from PHP
	"""
	
	cat_id = params.get('cat_id', 0)
	order_by = params.get('order_by', 'date')
	order_dir = params.get('order_dir', 'desc')
	offset = params.get('offset', 0)
	limit = params.get('limit', 30)
	date_start = params.get('date_start', 0)
	date_end = params.get('date_end', 0)
	recurse = params.get('recurse', 0)
	gallery_name = params.get('gallery_name', '')
	feed_type = params.get('feed_type', 'rss')

	if recurse:
		recurse_filter = '_REC.1'
	else:
		recurse_filter = ''
	feed_type = params.get('feed_type', '')
	if feed_type:
		syndication_filter = '_SYN.' + feed_type
	else:
		syndication_filter = ''
	
	summary_year = params.get('summary_year', 0)
	summary_month = params.get('summary_month', 0)
	summary_day = params.get('summary_day', 0)
	summary_date_filter = []
	if summary_year:
		summary_date_filter.append('_YER.%s' % summary_year)
	if summary_month:
		summary_date_filter.append('_MON.%s' % summary_month)
	if summary_day:
		summary_date_filter.append('_DAY.%s' % summary_day)
	summary_date_filter = ''.join(summary_date_filter)

	if date_start or date_end:
		date_filter = '_DAT.$s.$s' % (date_start, date_end)
	else:
		date_filter = ''
	
	image_offset = params.get('image_offset', 0)
	image_id = params.get('image_id')
	
	if params['type'] == 'cat':
		return '/user/lightbox/CAT.%s%s%s%s/%s-%s/%s-%s' % \
			(cat_id, date_filter, summary_date_filter, recurse_filter,
			 order_by, order_dir, offset, limit)
	elif params['type'] == 'image':
		return '/user/image_detail/IMG.%s.%s_CAT.%s%s%s%s/%s-%s/%s-%s' % \
		       (image_offset, image_id, cat_id, date_filter, summary_date_filter,
				recurse_filter, order_by, order_dir, offset, limit)
	elif params['type'] == 'gallery_feed':
		return '/user/galleries/feed/GAL.%s_SYN.%s/' % (gallery_name, feed_type)
