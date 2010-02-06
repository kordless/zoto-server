/**
 * zoto_timer
 * @classDescription A wrapper for the native setInterval and setTimeout 
 * javascript methods.
 * @constructor
 * @param {Object} options Optional. An object whos properties are used to 
 * initialize the timer. 
 * options.seconds determines the length of time for the timer to wait before calling its targets.
 * options.recurring is a boolean flag determining if the timer should fire once, or continuously.
 */
function zoto_timer(options){
	this.options = options || {};
	this.__timer_id = null;
	this.__seconds = Math.floor((this.options.seconds || 3) * 1000);
	this.__recurring = this.options.recurring || false;
	this.__targets = [];
};
zoto_timer.prototype = {
	/**
	 * start
	 * Starts the timer.
	 * @return {Integer} An id for the running timer.
	 */
	start:function(){
		this.stop();//just incase we were already running.
		
		//this is a hack to get our interval in the right scope
		var func = function(){
			var me = arguments.callee;
			me.func.apply(me.src);
		};
		func.src = this;
		func.func = this.__doActions;
		
		if(this.__recurring){
			this.__timer_id = setInterval(func, this.__seconds);
		} else {
			this.__timer_id = setTimeout(func, this.__seconds);
		};
		return this.__timer_id;
	},
	/**
	 * stop
	 * Stops the timer.
	 */
	stop:function(){
		if(this.__recurring){
			clearInterval(this.__timer_id);
		} else {
			clearTimeout(this.__timer_id);
		};
	},
	/**
	 * __doActions
	 * Loops through the targets and makes the calls.
	 * @private
	 */
	__doActions:function(){
		var ts = this.__targets;
		var len = ts.length;
		for(var i = 0; i<len; i++){
			var obj = ts[i].target;
			var func = ts[i].func;
			var args = ts[i].args;

			if(func.apply){
				//anonymous func
				func.apply(obj, args);
			} else {
				//func on obj
				obj[func].apply(obj, args);
			};
		};
	},
	/**
	 * addTarget
	 * Defines a function or object method to call at the timer's interval.
	 * The return value may be passed to the removeTarget method to prevent
	 * the function or object method from being called on subsequent intervals.
	 * @param {Object} target Required. An object reference.
	 * @param {Object} func	Required. A string key for a method on target, a reference to a 
	 * method on target, or an anonymous method to be called in the scope of target.
	 * @param {Object} args Optional. An array of arguments to be passed funct when it is called.
	 * @return {Object, undefined} An id reference to the newly created target, or undefined if the
	 * target was not created.
	 */
	addTarget:function(target, func, args){
		//check target
		if(!target) return;

		//resolve args
		if(!args){
			 args = new Array();
		} else if(!(args instanceof Array)){
			args = new Array(args);
		};

		//resolve func
		if(typeof(func) == 'string'){
			if(typeof(target[func]) != 'function') return;
		} else if(typeof(func) == 'function'){
			for(var i in target){
				//if func doesn't live in target
				//assume its anonymous
				if(target[i] == func){
					func = i;
					break;
				};
			};
		} else {
			return;
		};

		var obj = {'target':target, 'func':func, 'args':args};
		this.__targets.push(obj);

		return obj;
	},
	/**
	 * removeTarget
	 * @param {Object} id A reference to an object in the targets array.
	 * @return	{Boolean} True if the target referenced by the id 
	 * argument was found and removed. False otherwise
	 */
	removeTarget:function(id){
		var len = this.__targets.length;
		for(var i = 0; i < len; i++){
			if(this.__targets[i] == id){
				this.__targets.splice(i,1);
				return true;
			};
		};
		return false;
	}
};
