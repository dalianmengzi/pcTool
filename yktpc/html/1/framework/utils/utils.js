window.tips || (window.tips = function(msg, time, closefn) {
	if(typeof closefn === 'function') {
		$M().msg(msg).time(time || 3).close(closefn).position("5%", "50%");
	} else {
		$M().msg(msg).time(time || 3).position("5%", "50%");
	}
});

/**
 * 获取地址参数 
 * @param {Object} key
 */
function getQuery(key) {
	var arr = [],
		obj = {},
		location = window.location.href,
		has = location.indexOf('?') > -1,
		isHash = location.indexOf('#');

	if(!has) return null;
	arr = location.substring(location.indexOf('?') + 1, isHash > -1 ? isHash : location.length).split('&');

	for(var i = 0, len = arr.length; i < len; i++) {
		var temp = arr[i].split('=');
		if(temp.length) {
			if(obj[temp[0]]) {
				obj[temp[0]].push(temp[1]);
			} else {
				obj[temp[0]] = [temp[1]];
			}
		}
	}

	if(key) {
		return obj[key];
	} else {
		return obj;
	}
}

//升级检测
$(function() {
	var versionUrl = "http://localhost:" + config.localServerPort + "/version"
	var versionCode = 0;

	var update = function(data) {
		data.info = data.info.replace(/\n/g, "<br/>");
		var html = template("update-tips", data);

		var dlg = $M({
			title: '升级提示',
			content: html,
			lock: true,
			unclose: true,
			ok: false,
			drag: false,
			width: '400px'
		});
	}

	var getVersion = function() {
		$.post(config.mooc + "/portal/common/getDownloadUrl", {
				value: "iClassPc"
			},
			function(data) {
				if(data && data.code == 1) {
					if(data.versionCode && data.versionCode > versionCode) {
						update(data);
					}
				}
			}, 'json');
	}

	$.get(versionUrl, function(data) {
		if(data && data.code == 1) {
			versionCode = data.version;
			getVersion();
		}
	}, 'json');
})

/**
 * 选择主题 
 * @param {Object} theme
 */
function switchTheme(theme) {
	window.theme = theme;

	cef.message.sendMessage("win32.theme", [theme + "", '']);

	if(theme == 1) {
		$("body").addClass("allwhite");
	} else {
		$("body").removeClass("allwhite");
	}
}