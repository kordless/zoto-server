/*
js/common/googlemapsintegration.js

Author: Josh Williams
Date Added: Fri Apr 28 10:25:26 CDT 2006

Classes to allow a google map to be added to any zoto page.
*/


/*
 * Public map class.  If you want a map on a page, create an instance
 * of this class and pass a div (or other block element) to the constructor.
 */	
zoto.map = Class.create();
zoto.map.prototype = zoto.extend(new zoto.base(), {
	initialize: function(elem, lat, lng, zoom, add_point, min_height) {
		this.setup({});
		this.el = document.getElementById(elem);
		this.lat = lat;
		this.lng = lng;
		this.zoom = zoom;
		this.add_point = add_point;
		this.current_marker = null;
		if (min_height) {
			this.min_height = min_height;
		} else {
			this.min_height = 600;
		}

		/*
		 * Resize our container.
		 */
		var free_height = find_free_vert_space();
		if (free_height < min_height) {
			free_height = min_height;
		}
		this.el.style.height = free_height + "px";

		/*
		 * Create the Google Map object.
		 */
		this.google_map = new GMap2(this.el);
		this.google_map.setCenter(new GLatLng(this.lat, this.lng), this.zoom);
		this.google_map.addControl(new GLargeMapControl());
		this.google_map.addControl(new GMapTypeControl());
		this.google_map.setMapType(G_HYBRID_TYPE);
		GEvent.bind(this.google_map, "click", this, this.map_clicked);

		/* Red (default) icon */
		this.redicon = new GIcon();
		this.redicon.image = "http://labs.google.com/ridefinder/images/mm_20_red.png";
		this.redicon.shadow = "http://labs.google.com/ridefinder/images/mm_20_shadow.png";
		this.redicon.iconSize = new GSize(12, 20);
		this.redicon.shadowSize = new GSize(22, 20);
		this.redicon.iconAnchor = new GPoint(6, 20);
		this.redicon.infoWindowAnchor = new GPoint(5, 1);

		/* Yellow (primary) icon */
		this.yellowicon = new GIcon();
		this.yellowicon.image = "http://labs.google.com/ridefinder/images/mm_20_yellow.png";
		this.yellowicon.shadow = "http://labs.google.com/ridefinder/images/mm_20_shadow.png";
		this.yellowicon.iconSize = new GSize(12, 20);
		this.yellowicon.shadowSize = new GSize(22, 20);
		this.yellowicon.iconAnchor = new GPoint(6, 20);
		this.yellowicon.infoWindowAnchor = new GPoint(5, 1);
	},
	map_clicked: function(overlay, point) {
		if (overlay) {
			return;
		} else if (point) {
			this.fire_event("MAP_CLICKED", point.y, point.x);

			if (this.add_point) {
			
				if (this.current_marker) {
					this.google_map.removeOverlay(this.current_marker);
				}
				/*
				 * We have to offset the marker by a few pixels so the map can
				 * still receive double click events (otherwise, the second click
				 * would register on the marker).
				 */
				var offset = 0;
				var point_offset = point;
				var cur_zoom = this.google_map.getZoom();
				switch (cur_zoom) {
					case 19:
					case 18:
					case 17:
					case 16:
					case 15:
						offset = .00001;
						break;
					case 14:
					case 13:
					case 12:
					case 11:
					case 10:
						offset = .0001;
						break;
					case 9:
					case 8:
					case 7:
					case 6:
					case 5:
						offset = .001;
					case 4:
					case 3:
					case 2:
					case 1:
					case 0:
						offset = .01;
						break;
				}
				point_offset.y += offset;
				this.current_marker = this.add_marker(point_offset.y, point_offset.x);
			}
		}
	},
	/*
	 * Adds a basic marker (no info window) to the map at the specified coordinates.
	 */
	add_marker: function(lat, lng) {
		var point = new GPoint(lng, lat);
		var marker = new GMarker(point);
		this.google_map.addOverlay(marker);
		return marker;
	},
	/*
	 * Adds an image marker (complete with thumbnail preview and lat/long) to the
	 * at the specified coordinates.
	 * if primary == true:
	 *		marker is red
	 *		marker is opened automatically upon creation
	 * else:
	 *		marker is yellow
	 */
	add_image_marker: function(image_id, image_username, lat, lng, primary) {
		var point = new GPoint(lng, lat);
		var marker = "";
		if (primary) {
			marker = new GMarker(point, this.yellowicon);
		} else {
			marker = new GMarker(point, this.redicon);
		}
		var div = document.createElement('div');
		var href = "http://" + image_username + base_uri + "/user/image_detail/IMG.0." + image_id;
		href += "_CAT.0_REC.1/average_rating-desc/0-30";

		var image_link = document.createElement('a');
		image_link.setAttribute('target', "_top");
		image_link.setAttribute('href', href);

		var thumbnail_url = "http://" + image_username + base_uri + "/img/25/" + image_id +".jpg";
		var thumbnail = document.createElement('img');
		thumbnail.setAttribute('src', thumbnail_url);
		thumbnail.setAttribute('alt', 'ALT');
		thumbnail.style.border = 1 + "px solid black";

		image_link.appendChild(thumbnail);
		div.appendChild(image_link);
		div.appendChild(document.createElement('br'));
		if (image_username != browse_username) {
			var user_link = document.createElement('a');
			user_link.setAttribute('target', "_top");
			user_link.setAttribute('href', href);
			var text_name = document.createTextNode(image_username);
			user_link.appendChild(text_name);
			div.appendChild(user_link);
			div.appendChild(document.createElement('br'));
		}
		var coords = document.createElement('span');
		coords.setAttribute('style', "color: grey; font_size: small;");
		coords.appendChild(document.createTextNode(
			format_lat_lng(lat, 'N', 'S') + " " + format_lat_lng(lng, 'E', 'W')));
		div.appendChild(coords);

		marker.zoto_html = div;
		GEvent.addListener(marker, "click", function() {
			marker.openInfoWindow(marker.zoto_html);
		});
		this.google_map.addOverlay(marker);
		if (primary) {
			marker.openInfoWindow(marker.zoto_html);
		}
		return marker;
	},
	/*
	 * Recenters the map at the given coordinates.
	 */
	recenter: function(lat, lng) {
		this.google_map.setCenter(new GLatLng(lat, lng));
	},
	/*
	 * Gets the coordinates the map is centered on.
	 */
	get_center: function() {
		var center = this.google_map.getCenter();
		return new Array(center.lat(), center.lng());
	}
});

/*
 * Location controller.  Displays the current lat/lng selected in the map.
 * Can also be used to manually enter coordinates to recenter the map.
 */
zoto.lat_lng_control = Class.create();
zoto.lat_lng_control.prototype = zoto.extend(new zoto.base(), {
	initialize: function(elem, lat_lbl, lng_lbl, options) {
		this.setup(options);
		this.el = document.getElementById(elem);
		this.lat_lbl = lat_lbl;
		this.lng_lbl = lng_lbl;
		this.draw();
	},
	draw: function () {
		this.el.innerHTML = "";
		this.loc_form = document.createElement('form');
		this.loc_form.setAttribute('action', '/');
		this.loc_form.setAttribute('method', 'GET');
		this.loc_form.setAttribute('accept-charset', 'utf8');
		this.loc_form.className = 'lat_lng_form';
		this.loc_form.onsubmit = function(e) {
			this.loc_updated();
			return false;
		}.bind(this);
		
		loc_table = document.createElement('table');
		loc_table_body = document.createElement('tbody');

		lat_row = document.createElement('tr');

		lat_head = document.createElement('td');
		lat_head.appendChild(document.createTextNode(this.lat_lbl));
		lat_row.appendChild(lat_head);

		lat_deg_td = document.createElement('td');
		this.lat_deg = document.createElement('input');
		this.lat_deg.setAttribute('type', 'text');
		this.lat_deg.setAttribute('name', 'lat_deg');
		this.lat_deg.setAttribute('size', 4);
		this.lat_deg.onchange = this.loc_updated.bind(this);
		lat_deg_td.appendChild(this.lat_deg);
		lat_deg_td.appendChild(document.createTextNode("\u00b0"));

		lat_row.appendChild(lat_deg_td);

		loc_table_body.appendChild(lat_row);
		
		lat_min_td = document.createElement('td');
		this.lat_min = document.createElement('input');
		this.lat_min.setAttribute('type', 'text');
		this.lat_min.setAttribute('name', 'lat_min');
		this.lat_min.setAttribute('size', 4);
		this.lat_min.onchange = this.loc_updated.bind(this);
		lat_min_td.appendChild(this.lat_min);
		lat_min_td.appendChild(document.createTextNode('\''));
		lat_row.appendChild(lat_min_td);

		lat_sec_td = document.createElement('td');
		this.lat_sec = document.createElement('input');
		this.lat_sec.setAttribute('type', 'text');
		this.lat_sec.setAttribute('name', 'lat_sec');
		this.lat_sec.setAttribute('size', 20);
		this.lat_sec.onchange = this.loc_updated.bind(this);
		lat_sec_td.appendChild(this.lat_sec);
		lat_sec_td.appendChild(document.createTextNode('"'));
		lat_row.appendChild(lat_sec_td);

		loc_table_body.appendChild(lat_row);

		lng_row = document.createElement('tr');

		lng_head = document.createElement('td');
		lng_head.appendChild(document.createTextNode(this.lng_lbl));
		lng_row.appendChild(lng_head);

		lng_deg_td = document.createElement('td');
		this.lng_deg = document.createElement('input');
		this.lng_deg.setAttribute('type', 'text');
		this.lng_deg.setAttribute('name', 'lng_deg');
		this.lng_deg.setAttribute('size', 4);
		this.lng_deg.onchange = this.loc_updated.bind(this);
		lng_deg_td.appendChild(this.lng_deg);
		lng_deg_td.appendChild(document.createTextNode("\u00b0"));
		lng_row.appendChild(lng_deg_td);
		
		lng_min_td = document.createElement('td');
		this.lng_min = document.createElement('input');
		this.lng_min.setAttribute('type', 'text');
		this.lng_min.setAttribute('name', 'lng_min');
		this.lng_min.setAttribute('size', 4);
		this.lng_min.onchange = this.loc_updated.bind(this);
		lng_min_td.appendChild(this.lng_min);
		lng_min_td.appendChild(document.createTextNode('\''));
		lng_row.appendChild(lng_min_td);

		lng_sec_td = document.createElement('td');
		this.lng_sec = document.createElement('input');
		this.lng_sec.setAttribute('type', 'text');
		this.lng_sec.setAttribute('name', 'lng_sec');
		this.lng_sec.setAttribute('size', 20);
		this.lng_sec.onchange = this.loc_updated.bind(this);
		lng_sec_td.appendChild(this.lng_sec);
		lng_sec_td.appendChild(document.createTextNode('"'));
		lng_row.appendChild(lng_sec_td);

		loc_table_body.appendChild(lng_row);

		loc_table.appendChild(loc_table_body);

		this.loc_form.appendChild(loc_table);
		this.el.appendChild(this.loc_form);
	},
	set_loc: function(lat, lng) {
		this.lat = lat;
		this.lng = lng;
		var lat_dms = dectodms(this.lat, false);
		var lng_dms = dectodms(this.lng, false);
		this.lat_deg.value = lat_dms[0];
		this.lat_min.value = lat_dms[1];
		this.lat_sec.value = lat_dms[2];
		this.lng_deg.value = lng_dms[0];
		this.lng_min.value = lng_dms[1];
		this.lng_sec.value = lng_dms[2];
	},
	loc_updated: function(args) {
		this.lat = dmstodec(this.lat_deg.value,
							this.lat_min.value,
							this.lat_sec.value);
		this.lng = dmstodec(this.lng_deg.value,
							this.lng_min.value,
							this.lng_sec.value);
		this.fire_event("LOC_UPDATED", this.lat, this.lng);
	}
});

zoto.geotagger = Class.create();
zoto.geotagger.prototype = zoto.extend(new zoto.base(), {
	initialize: function(elem, username, image_id, lbl, options) {
		this.setup(options);
		this.el = document.getElementById(elem);
		this.username = username;
		this.image_id = image_id;
		this.lbl = lbl;
		this.lat = 0;
		this.lng = 0;
		this.draw();
	},
	draw: function(args) {
		this.button = document.createElement("button");
		this.button.setAttribute("disabled", true);
		this.button.onclick = function(e) {
			zapi_call("images.set_lat", new Array(this.image_id, this.lat));
			zapi_call("images.set_lng", new Array(this.image_id, this.lng));
			this.fire_event("IMAGE_GEOTAGGED", this.image_id, this.lat, this.lng);
		}.bind(this);
		this.button.appendChild(document.createTextNode(this.lbl));
		this.el.appendChild(this.button);
	},
	update: function(lat, lng) {
		this.lat = lat;
		this.lng = lng;
		this.button.disabled = false;
	}
});

/************************************************
 *       U T I L I T Y   F U N C T I O N S		*
 ************************************************/
function dectodms(dec, round) {
	var degrees = 0;
	var minutes = 0;
	var seconds = 0;
	var abs_dec = 0;
	if (dec)
	{
		abs_dec = Math.abs(dec);
		degrees = Math.floor(abs_dec);
		minutes = Math.floor((abs_dec - degrees) * 60);
		if (round) {
			seconds = (Math.round((((abs_dec - degrees) - (minutes / 60)) * 60 * 60) * 100) / 100);
		} else {
			seconds = ((((abs_dec - degrees) - (minutes / 60)) * 60 * 60) * 100) / 100;
		}
		if (dec < 0) {
			degrees *= -1;
		}
		return new Array(degrees, minutes, seconds);
	} else {
		return new Array(0, 0, 0);
	}
}

function dmstodec(degrees, minutes, seconds) {
	var dec = parseFloat(Math.abs(degrees));
	dec += parseFloat(minutes)/60;
	dec += parseFloat(seconds)/3600;
	if (degrees < 0) {
		dec = eval('-' + dec);
	}
	return dec;
}

function format_lat_lng(dec, pos_char, neg_char) {
	var dms = dectodms(dec, true);
	var retval = Math.abs(dms[0]) + "\u00b0" + dms[1] + "\"" + dms[2] + "'";
	if (dms > 0) {
		retval += pos_char;
	} else {
		retval += neg_char;
	}
	return retval;
}

/*** Functions for searching an area for its photos ***/

function recenter() {
	var center = map.get_center();
	// If we are only searching the user...
	if (document.getElementById('center_map_context') && document.getElementById('center_map_context').value == "user") {
		parent.location = "http://" + browse_username + base_uri + "/user/photos/map/CAT.0_REC.1_LAT." + center[0] + "_LNG." + center[1] + "/distance-asc/0-30";
	} else {
		if (confluence) {
			parent.location = "http://www" + base_uri + "/confluence/map/find/" + center[0] + "x" + center[1];
		} else {
			parent.location = "http://www" + base_uri + "/users/geotags/find/" + center[0] + "x" + center[1];
		}
	}
}
