/**
	detect.lib.js
	Ver 1: Oct 31 2006
	E 
	zoto_detect provides methods for determining browser features and the user's *probable* OS (can't trust userAgents after all). 
	Use this as a static obj.  No need to instantiate multiple instances, so no need to prototype it.
*/
zoto_detect = {
	__os:null,
	__activeXEnabled:null,
	__axName:"ShockwaveFlash.ShockwaveFlash",
	__pluginName:"Shockwave Flash",
	__version:null,
	supportsDOM:function(){
		return ((typeof(document.getElementById) != "undefined") && typeof(document.createElement) != "undefined")?true:false;
	},
	supportsPlugins:function(){
		return ((typeof(navigator.plugins) != "undefined") && (navigator.plugins.length > 0))?true:false;

	},
	supportsActiveX:function(){
		return (typeof(window.ActiveXObject) != "undefined")?true:false;

	},
	isActiveXEnabled:function(){
		if(this.__activeXEnabled == null){
			this.__activeXEnabled = false;
			if(this.supportsActiveX() == true){
				try {
					var foo = new window.ActiveXObject("Microsoft.XMLHTTP");
					if(typeof(foo) != "undefined"){
						delete foo;
						this.__activeXEnabled = true;
					}
				}
				catch(e){}
			}
		}
		return this.__activeXEnabled;
	},
	supportsFlash:function(){
		if(this.supportsPlugins()==true){
			if(typeof(navigator.plugins[this.__pluginName]) != "undefined"){
				return true;
			}
		} else if (this.supportsActiveX()==true) {
			try{
				if(this.isActiveXEnabled() == true){
					var obj = new window.ActiveXObject(this.__axName);
					if(typeof(obj) != "undefined"){
						return true;
					}
				}
			}
			catch(e){}
		}
		return false;
	},
	getFlashVersion:function(){
		if(this.__version == null){
			var version = -1;
			if(this.supportsFlash() == true){
				try{
					if(this.supportsPlugins()==true){
						var des = navigator.plugins[this.__pluginName].description.toLowerCase();
						des= des.split(" ");
						version = des[2];
					} else if(this.supportsActiveX()==true) {
						var obj = new ActiveXObject(this.__axName);
						var ver = obj.GetVariable("$version").toLowerCase();
						ver = ver.split(" ");
						ver = ver[1].split(",");
						version = ver[0] + "." + ver[1];	
					}
				}
				catch(e){}
			}
			this.__version = version;
		}
		return parseFloat(this.__version);
	},
	isMac:function(){
		return (this.getOS() == "mac")?true:false;
	},
	isWin:function(){
		return (this.getOS() == "win")?true:false;
	},
	isLinux:function(){
		return (this.getOS() == "linux")?true:false;
	},
	getOS:function(){
		if(this.__os == null){
			var ua = navigator.userAgent.toLowerCase();
			if(this.supportsActiveX()) {
				this.__os =="win";
			} else	if(ua.indexOf("win") != -1){
				this.__os == "win";
			} else if(ua.indexOf("mac") != -1){
				this.__os="mac";			 
			} else if(ua.indexOf("linux") != -1){
				this.__os="linux";	
			} else if(ua.indexOf("x11") != -1){
				this.__os="linux";	
			} else if(ua.indexOf("freebsd") != -1){
				this.__os="linux";
			} else if(ua.indexOf("unix") != -1){
				this.__os="linux";
			} else if(ua.indexOf("msie") != -1){
				this.__os="win";	
			} else {
				this.__os = "unknown";	
			}
		}
		return  this.__os;
	}
};