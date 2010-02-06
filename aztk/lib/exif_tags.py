"""
Quick reference for aztk tags we actually care about.

exif_tags.py
Ken Kinder
"""

tags = {
	270: (True, 'description'),
	271: (True, 'camera_make'),
	272: (True, 'camera_model'),
	306: (True, 'datetime'),
	305: (False, 'camera firmware'),
	315: (True, 'photographer'),
	33432: (True, 'copyright'),	
	33434: (True, 'exposure_time'),
	33437: (True, 'fstop'),
	34855: (True, 'iso_speed'),
	36867: (True, 'datetime_taken'),
	36868: (True, 'datetime_digitized'),
	37386: (True, 'focal_length'),
	37510: (False, 'comment')
	}
