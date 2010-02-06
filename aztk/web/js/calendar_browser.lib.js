function zoto_calendar(options){
	this.options = options || {};
	this.el = DIV();

	this.class_table = this.options.class_table || 'calendar_page';
	this.class_row_head = this.options.class_row_head || '';
	this.class_row = this.options.class_row || '';
	this.days_arr = [];
	
	//default to todays date if nothing was passed.  We can always update these values later
	var d = new Date();
	this.date_month = this.options.date_month || d.getMonth() + 1;
	this.date_year = this.options.date_year || d.getFullYear();
	this.date_day = this.options.date_day || d.getDate();
	
}
zoto_calendar.prototype = {
	initialize: function() {
		var d = new Date()
		this.date_month = this.options.date_month || d.getMonth() + 1;
		this.date_year = this.options.date_day || d.getFullYear();
		this.date_day = this.options.date_day || d.getDate();
	},
	reset: function() {
		replaceChildNodes(this.el);
	},
	draw:function(){
		log('override me');
		this.draw_days();
	},
	//factory
	make_day:function(i){
		log('override me')
		return TD({}, i);
	},
	draw_days: function() {
		this.tbl = TABLE({'class':this.class_table, 'cellpadding': 0+"px"});
		 this.tbody = TBODY({},
			TR({'class':this.class_row_head},
				TH({}, _('S')),
				TH({}, _('M')),
				TH({}, _('T')),
				TH({}, _('W')),
				TH({}, _('T')),
				TH({}, _('F')),
				TH({}, _('S'))
			)
		)
		/* Get total days */
		var temp_date = new Date();
		var total_days = get_days_of_month(temp_date.getYear())[this.date_month-1];

		/* Get the dow of first day of the month */
		temp_date.setYear(this.date_year);
		temp_date.setMonth(this.date_month-1);
		temp_date.setDate(1);
		var first_dow = temp_date.getDay();//numeric value of s,m,t,w,th,f,s

		/* Insert empty holes until we hit an actual date */
		var day_counter = 0;
		var tr = TR({'class':this.class_row});
		for (var i = 0; i < 7; i++) {
			if (i < first_dow) {
				appendChildNodes(tr, TD({}));
			} else {
				break;
			}
		}

		/* Here we go.  Start adding days, jumping to a new week (TR) when we hit Sunday */
		var dow = first_dow;
		for (var i = 1; i <= total_days; i++) {
			
			//call the make_day() method and let it be our TD factory. override for custom TD behavior
			this.days_arr[i] = this.make_day(i);//go ahead... make my day
			appendChildNodes(tr, this.days_arr[i]);

			//if this is saturday, add the row and start a new one
			dow++;
			if (dow == 7) {
				appendChildNodes(this.tbody, tr);
				tr = TR({'class':this.class_row});
				dow = 0;
			}
		}
		
		// We have a leftover week.  add it 
		if (dow > 0) {
			appendChildNodes(this.tbody, tr);
		}
		appendChildNodes(this.tbl, this.tbody);
		appendChildNodes(this.el, this.tbl);
	}
}

function zoto_calendar_browser(options) {
	this.$uber(options);
	this.options.user = this.options.user || "";
	this.data = [];
	this.glob = this.options.glob || {};
}
extend(zoto_calendar_browser, zoto_calendar, {
	initialize: function() {
		this.$super();
	},
	reset: function() {
		this.data = [];
		this.$super();
	},
	update_glob: function(glob) {
		if (!this.glob.settings.date_changed && this.data.length > 0) {
			return;
		}
		
		if (browse_username != "*ALL*"){
			var d;
			if (!this.glob.settings.date_year) {
				d = zapi_call('globber.get_unique_years', [browse_username]);
				d.addCallback(method(this, 'handle_new_data'), 'years');
			} else if (!this.glob.settings.date_month) {
				d = zapi_call('globber.get_unique_months', [browse_username, this.glob.settings.date_year]);
				d.addCallback(method(this, 'handle_new_data'), 'months');
			} else {
				d = zapi_call('globber.get_unique_days', [browse_username, this.glob.settings.date_year, this.glob.settings.date_month]);
				d.addCallback(method(this, 'handle_new_data'), 'days');
			}
			d.addErrback(d_handle_error, 'calendar_browser fetch_data');
			return d;
		} else {
			var dt = new Date();
			if(!this.glob.settings.date_year){
				var y = dt.getFullYear();
				this.handle_new_data('years',[0, [{"year": y}, {"year": y-1}, {"year": y-2}, {"year": y-3}]]);
			} else if(!this.glob.settings.date_month){
				var maxMonth = 12;
				if(this.glob.settings.date_year == dt.getFullYear()){
					maxMonth = dt.getMonth()+1;
				};
				var month_arr = [];
				for(var i = 1; i <= maxMonth; i++){
					month_arr.push({"month":i});
				};
				this.handle_new_data('months',[0, month_arr]);
			} else {
				var maxDays = get_days_of_month(this.glob.settings.date_year)[this.glob.settings.date_month-1];
				if(this.glob.settings.date_year == dt.getFullYear()){
					if(this.glob.settings.date_month == dt.getMonth()+1){
						maxDays = dt.getDate();
					};
				}
				var days_arr = [];
				for(var i = 1; i <= maxDays; i++){
					days_arr.push({"day":i});
				};
				this.handle_new_data('days',[0, days_arr]);
			};
		}
	},
	
	handle_new_data: function(item_type, new_data) {
		if (!new_data || new_data[0] != 0) {
			return fail(new_data[1]);
		}
		this.data = new_data[1] || [];
		if (this.data.length > 0) {
			this.draw(item_type);
		} else {
			replaceChildNodes(this.el, _('no dates found'));
		}
	},
	
	draw: function(draw_type) {
		replaceChildNodes(this.el);
		var years_link = A({href: 'javascript: void(0);'}, _('view years'));
		connect(years_link, 'onclick', this, function(e) {
			signal(this, 'UPDATE_GLOB_YEAR', '');
		});
		
		//if our date values aren't set set them now
		this.date_month = this.glob.settings.date_month;
		this.date_year = this.glob.settings.date_year;
		this.date_day = this.glob.settings.date_day;
		
		switch(draw_type) {
			case "years":
				var datum = 'year';
				var signal_name = 'UPDATE_GLOB_YEAR';
			break;
			case "months":
				appendChildNodes(this.el, DIV({}, years_link, ' / ', this.glob.settings.date_year));
				var datum = 'month';
				var signal_name = 'UPDATE_GLOB_MONTH';
			break;
			case "days":
				var year_link = A({href: 'javascript: void(0);'}, this.glob.settings.date_year);
				connect(year_link, 'onclick', this, function(e) {
					signal(this, 'UPDATE_GLOB_YEAR', this.glob.settings.date_year);
				});
				var month_link = A({href: 'javascript: void(0);'}, get_month_abbrev(this.glob.settings.date_month).toLowerCase());
				connect(month_link, 'onclick', this, function(e) {
					signal(this, 'UPDATE_GLOB_MONTH', this.glob.settings.date_month);
				});
				appendChildNodes(this.el, DIV({}, years_link, ' / ', year_link, ' / ', month_link));
				return this.draw_days();
			break;
			default:
				throw "Invalid draw type!"
		}

		cnt = 1;
		forEach(this.data, method(this, function(item) {
			if (draw_type == 'months') {
				var item_link = A({href:'javascript:void(0);'}, get_month_abbrev(item[datum]).toLowerCase());
			} else {
				var item_link = A({href:'javascript:void(0);'}, item[datum]);
			}
			var val = item[datum];
			connect(item_link, 'onclick', this, function(e) {
				signal(this, signal_name, [val]);
			});
			appendChildNodes(this.el, item_link)
			if (cnt != this.data.length) appendChildNodes(this.el, ', ')
			cnt++;
		}));
	},
	
	make_day:function(i){
		var td = TD({}, i);
		forEach(this.data, method(this, function(day) {
			if (day.day == i) {
				var td_class = "active";
				if (this.date_day == i) {
					td = TD({'class': "current"}, i);
				} else {
					var photo_link = A({href: "javascript: void(0);"}, i);
					photo_link.day_id = i;
					connect(photo_link, 'onclick', this, function(e) {
						signal(this, 'UPDATE_GLOB_DAY', [e.src().day_id]);
					});
					td = TD({'class': "active"}, photo_link);
				}
			}
		}));
		return td;
	}
});


/**

	SIGNALS:
		CALENDAR_DAY_CLICKED
		CALENDAR_DATE_CHANGED
*/
function zoto_calendar_date_picker(options){
	this.$uber(options);
//	this.zoto_calendar(options);
	
	this.starting_date = this.options.starting_date || new Date();

	var d =  new Date();
	this.max_year = d.getFullYear();
	this.date_year =  this.current_year = this.starting_date.getFullYear();
	this.date_day = this.current_day = this.starting_date.getDate();
	this.date_month = this.current_month = this.starting_date.getMonth()+1

}
extend(zoto_calendar_date_picker, zoto_calendar, {
	handle_click:function(evt){
		this.current_year = this.date_year;
		this.current_day = evt.target().day;
		this.current_month = this.date_month;
		signal(this, 'CALENDAR_DAY_CLICKED', {month:this.date_month, day:evt.target().day, year:this.date_year});
	},
	
	set_day:function(d){
		this.current_day = d;
		this.date_day = d;
		this.draw();
	},
	
	set_month:function(m){
		this.current_month = m;
		this.date_month = m;
		this.draw();
	},
	
	set_year:function(y){
		this.current_year = y;
		this.date_year = y;
		this.draw()
	},

	make_day:function(i){
		var a = A({href:'javascript:void(0);'}, i);
		a.day = i;
		connect(a, 'onclick', this, 'handle_click');
		var td;
		if(i == this.current_day && this.date_year == this.current_year && this.date_month == this.current_month){
			td = TD({'class':'today'}, a);
		} else {
			td = TD({'class':'otherday'}, a);
		}
		return td;
	},
	
	draw_header:function(){
		var span_current_month, span_current_year, span_prev_year, span_next_year
		
		span_current_month = SPAN({}, get_month_abbrev(this.date_month));
		span_current_year = SPAN({},this.date_year);
		span_prev_year = SPAN({},this.date_year-1);
		span_next_year = SPAN({},Number(this.date_year)+1);

		var a_prev_year = A({href:'javascript:void(0);'}, SPAN({}, ' <<'), span_prev_year);
		connect(a_prev_year, 'onclick' , this, 'prev_year');
		
		var a_prev_month = A({href:'javascript:void(0);'}, ' << ');
		connect(a_prev_month, 'onclick' , this, 'prev_month');
		
		var a_next_year = A({href:'javascript:void(0);'}, span_next_year, SPAN({}, '>> '));
		connect(a_next_year, 'onclick' , this, 'next_year');
		
		var a_next_month = A({href:'javascript:void(0);'}, ' >> ');
		connect(a_next_month, 'onclick' , this, 'next_month');

		//yah... this is lame
		if(this.date_year == this.max_year){
			addElementClass(a_next_year, 'invisible');
			if(this.date_month == 12){
				addElementClass(a_next_month, 'invisible');
			}
		}
		appendChildNodes(this.el, 
			DIV({'style':'margin:14px 0px 6px 0px'},
				a_prev_year,
				SPAN({'style':'margin: 0px 15px;'}, 
					a_prev_month, 
					span_current_month, 
					' ' , 
					span_current_year, 
					a_next_month
				),
				a_next_year
			)
		);
	},
	
	draw:function(){
		replaceChildNodes(this.el);
		this.draw_header();
		this.draw_days();
	},
	
	next_year:function(){
		this.date_year++;
		this.draw();
		signal(this, 'CALENDAR_DATE_CHANGED', {month:this.date_month, day:this.date_day, year:this.date_year});
	},
	
	prev_year:function(){
		this.date_year--;
		signal(this, 'CALENDAR_DATE_CHANGED', {month:this.date_month, day:this.date_day, year:this.date_year});
		this.draw();
	},
	
	next_month:function(){
		if(this.date_month == 12){
			this.date_month = 1;
			this.next_year();
		} else {
			this.date_month++;
			signal(this, 'CALENDAR_DATE_CHANGED', {month:this.date_month, day:this.date_day, year:this.date_year});
			this.draw();
		}
	},
	
	prev_month:function(){
		if(this.date_month == 1){
			this.date_month = 12;
			this.prev_year();
		} else {
			this.date_month--;
			signal(this, 'CALENDAR_DATE_CHANGED', {month:this.date_month, day:this.date_day, year:this.date_year});
			this.draw();
		}
	}
});
