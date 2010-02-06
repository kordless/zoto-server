function zoto_table_header(name, options) {
	this.options = options || {};
	this.name = name;
	this.options.desc_name = this.options.desc_name || "no desc name";
	this.options.asc_name = this.options.asc_name || "no asc name";
	this.options.static_name = this.options.static_name || "no static name";
	this.options.sortable = this.options.sortable || false;
	this.options.is_active_sort = this.options.is_active_sort || false;
	this.options.order_dir = this.options.order_dir || "asc";
	this.link = A({'href': "javascript: void(0)"});
	this.el = TH({});
	connect(this.link, 'onclick', this, this.handle_click);
	if (this.options.sortable) {
		appendChildNodes(this.el, this.link);
		appendChildNodes(this.link, this.options.asc_name);
	} else {
		appendChildNodes(this.el, this.options.static_name);
	}
}
zoto_table_header.prototype = {
	handle_click: function(e) {
		signal(this, 'HEADER_CLICKED', this);
	},
	update_sort: function(is_sort, order_dir) {
		this.is_active_sort = is_sort;
		this.options.order_dir = order_dir;
		if (this.is_active_sort) {
			if (this.options.order_dir == "asc") {
				replaceChildNodes(this.link, this.options.asc_name);
			} else {
				replaceChildNodes(this.link, this.options.desc_name);
			}
		} else {
			replaceChildNodes(this.link, this.options.asc_name);
		}
	}
};

function zoto_table(options) {
	this.options = options || {};
	this.signal_proxy = this.options.signal_proxy || this;
	this.draw_header = this.options.draw_header;
	if (!this.draw_header) this.draw_header = false;
	this.options.css_class = this.options.css_class || "";
	this.options.headers = this.options.headers || {};
	this.options.order_dir = this.options.order_dir || "asc";
	this.options.order_by = this.options.order_by || "";
	this.row_count = 0;
	this.col_count = 0;
	this.highlighted_column = 0;
	
	this.tbody = TBODY({});
	this.el = TABLE({'class': this.options.css_class}, this.tbody);
	this.headers = [];
	this.rows = [];
	
	if (!this.draw_header) {
		return;
	}
	this.top_row = TR({});

	for (var i in this.options.headers) {
		this.headers[i] = new zoto_table_header(i, this.options.headers[i]);
		connect(this.headers[i], 'HEADER_CLICKED', this, this.handle_column_clicked);
		if (this.options.order_by == i) {
			logDebug("setting hightlighted column to: " + this.col_count);
			this.highlighted_column = this.col_count;
			this.highlighted_column_name = i;
			this.headers[i].update_sort(true, this.options.order_dir);
		}
		setNodeAttribute(this.headers[i].el, 'id', 'column_'+i);
		addElementClass(this.headers[i].el, 'column_'+i);
		appendChildNodes(this.top_row, this.headers[i].el);
		this.col_count++;
	}
	appendChildNodes(this.tbody, this.top_row);
}

zoto_table.prototype = {
	handle_column_clicked: function(column) {
		var new_dir = "asc";
		if (column.options.order_dir == "asc" && column.name == this.highlighted_column_name) {
			new_dir = "desc";
		}
		signal(this.options.signal_proxy, 'UPDATE_GLOB_ORDER', column.name, new_dir);
		this.update_sorting(column.name, new_dir);
	},
	update_sorting: function(order_by, order_dir) {
		var old_column = this.highlighted_column;
		var i = 0;
		for (var header in this.headers) {
			if (this.headers[header].name == order_by) {
				this.highlighted_column = i;
				this.highlighted_column_name = header;
				this.headers[header].update_sort(true, order_dir);
			} else {
				this.headers[header].update_sort(false, 'asc');
			}
			i++;
		}
		forEach(this.rows, method(this, function(row) {
			removeElementClass(row.columns[old_column], "active_table_column");
			addElementClass(row.columns[this.highlighted_column], "active_table_column");
		}));
	},			
	add_row: function(row, row_class) {
		// row should be an array of the same length of the headers
		// each array element should be a complete DOM Element
		if ((row.length != this.col_count) && this.draw_header) {
			throw "trying to add row to table and there's not enough columns of data!";
			return;
		}
		var new_row = TR({});
		if (row_class) {
			addElementClass(new_row, row_class);
		}
		var columns = [];
		for (var i=0; i < row.length; i++) {
			var cell = TD({'class':'column_'+i}, row[i]);
			if (i == this.highlighted_column) {
				addElementClass(cell, "active_table_column");
			}
			columns.push(cell);
			appendChildNodes(new_row, cell);
		}
		this.row_count++;
		this.rows.push({'row_el': new_row, 'columns': columns});
		appendChildNodes(this.tbody, new_row);
		return new_row;
	}
};

function zoto_exif_table(info, options) {
	this.options = options;
	this.info = info;
	this.$uber({no_header:1});
//	this.zoto_table({no_header: 1});
	this.table_el.className = "exif";
}

extend(zoto_exif_table, zoto_table, {
	assign_element: function(element) {
		this.el = $(element);
	},
	make_exif_row: function(heading, value) {
		var text_node = document.createElement("strong");
		text_node.appendChild(document.createTextNode(heading));
		return [text_node, document.createTextNode(value)];
	},
	draw: function() {
		if (!this.el) {
			alert("No place to draw exif table");
			return;
		}
		var new_tbody = this.tbody.cloneNode(false);
		this.table_el.removeChild(this.table_el.getElementsByTagName('tbody')[0]);
		this.tbody = new_tbody
		this.table_el.appendChild(this.tbody);
		
		this.add_row(this.make_exif_row("Filename:", this.info.filename));
		this.add_row(this.make_exif_row("Uploaded Via:", this.info.source_name));
		this.add_row(this.make_exif_row("Make & Model:", this.info.camera_make + " - " + this.info.camera_model));
		var exposure_header = document.createElement("strong");
		exposure_header.appendChild(document.createTextNode("Exposure Time:"));
		var exposure_value = document.createElement("span");
		var exposure_sup = document.createElement("sup");
		exposure_sup.appendChild(document.createTextNode(this.info.exposure_time[0]));
		var exposure_sub = document.createElement("sub");
		exposure_sub.appendChild(document.createTextNode(this.info.exposure_time[1]));
		exposure_value.appendChild(exposure_sup);
		exposure_value.appendChild(document.createTextNode("/"));
		exposure_value.appendChild(exposure_sub);		
		this.add_row(new Array(exposure_header, exposure_value));
		this.add_row(this.make_exif_row("F-Stop:", "f"+this.info.fstop[0]/this.info.fstop[1]));
		this.add_row(this.make_exif_row("ISO Speed:", this.info.iso_speed));
		this.add_row(this.make_exif_row("Focal Length:", parseInt(this.info.focal_length[0]/this.info.focal_length[1])+"mm"));
		
		this.el.innerHTML = "";
		this.el.appendChild(this.table_el);
	}
});
