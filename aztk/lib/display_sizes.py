import ConfigParser, Image, aztk_config

display_sizes_cfg = ConfigParser.ConfigParser()
display_sizes_cfg.read('%s/etc/display_sizes.cfg' % aztk_config.aztk_root)
display_sizes = {}
for size in display_sizes_cfg.sections():
	display_sizes[size] = {
		'width': display_sizes_cfg.getint(size, 'width'),
		'height': display_sizes_cfg.getint(size, 'height'),
		'fit_size': display_sizes_cfg.getboolean(size, 'fit_size'),
		'in_use': display_sizes_cfg.getboolean(size, 'in_use'),
		'quality': display_sizes_cfg.getint(size, 'quality'),
		}
	## if display_sizes_cfg.get(size, 'method') == "NEAREST": display_sizes[size]['method'] = Image.NEAREST
	## elif display_sizes_cfg.get(size, 'method') == "ANTIALIAS": display_sizes[size]['method'] = Image.ANTIALIAS
	## else: raise ValueError, 'Invalid value for method in display_sizes.cfg: %s' % display_sizes_cfg.get(size, 'method')

def get_size(width, height, fit_size):
	for size, info in display_sizes.items():
		if int(info['width']) == int(width) and \
		   int(info['height']) == int(height) and \
		   bool(info['fit_size']) == bool(fit_size):
			return size

