/**
 * html5 ppt查看
 */
var OfficeHtml = {
	classType: "OfficeHtml",
	presentation: null,
	historys: [],
	currentIndex: 0,
	rate: 1,
	next: 0,
	init: function(index, urls, content, historyRealy, action) {
		var loading = $("<div id = 'loading' class='loading'></div>");

		this.content = content;
		this.historys = [];
		this.currentIndex = 0;

		if(historyRealy) {
			this.historys = historyRealy;
		}

		if(!index) {
			index = 1;
		}
		content.css("background", "#fff");
		this.content.html(loading);

		if(index > 0) {
			this.currentIndex = --index;
		}
		this.previewNet(urls, action);
		//this.download(urls);
	},
	previewNet: function(urls, action) {
		var htmlUrl = urls;

		htmlUrl += "?gotopage=" + (this.currentIndex + 1);

		this.setIframe(htmlUrl, action);
	},
	download: function(urls) {
		var downloadUrl = urls.statusUrl,
			name = "";

		downloadUrl = downloadUrl.substr(0, downloadUrl.indexOf("/status"));

		name = downloadUrl.substr(0, downloadUrl.lastIndexOf("."));
		name = name.substr(downloadUrl.indexOf("/a@") + 3) + ".zip";

		this.name = name;

		downloadUrl = urls.status.replace("/status", "/html5.zip/download");

		cef.message.sendMessage("win32.download", [downloadUrl, name]);
	},
	begin: function(action) {
		var name = this.name;
		this.currentIndex = 0;
		if(action.page > 0) {
			this.currentIndex = action.page - 1;
		}

		name = name.replace(".", "_");
		var htmlUrl = "../../../data/" + name + "/html/html.html?gotopage=" + (this.currentIndex + 1);

		this.setIframe(htmlUrl, action);
	},
	setIframe: function(htmlUrl, action) {
		var scaleBox = $("<div class='scale-box'></div>");
		var rotate = $("<div class='rotate-box'></div>");
		var iframeBox = $("<div class='canvas-box'></div>");
		var iframe = $('<iframe src="' + htmlUrl + '" frameBorder="0"></iframe>');
		this.scaleBox = scaleBox;
		this.rotateBox = rotate;
		this.iframeBox = iframeBox;

		//设置宽高，不然缩放时不是从中心缩放
		scaleBox.css({
			width: window.screen.width,
			height: window.screen.height
		})

		//主div 用于是所有的缩放
		scaleBox.append(rotate);

		//旋转box 旋转时旋转此div
		rotate.append(iframeBox);

		iframeBox.append(iframe);

		iframe.css({
			width: window.screen.width,
			height: window.screen.height,
			position: "absolute",
			top: 0,
			left: 0
		});

		this.iframe = iframe;

		this.content.html(scaleBox);

		this.initEvent(iframe[0], action);
	},
	handleMessage: function(message) {
		//		console.log(message);
		switch(message.type) {
			case "loaded":
				this.htmlLoaded();
				break;
			case "pageChange":
				//重画
				this.imageReload(message.page);
				this.currentIndex = message.page;
				break;
			case "loadingEnd":

				break;
			case "loadingStart":

				break;
		}
	},
	//html加载完成
	htmlLoaded: function() {
		var _this = this;

		var contentHolder = _this.iframeContent.find("#contentHolder");

		//_this.contentHolder = contentHolder;
		var width = contentHolder.width(),
			height = contentHolder.height();

		_this.painting = new BoardCanvas("", _this.action.screen, function(board) {
			_this.scaleBox.after(board.painting);

			board.result = _this.iframeBox;
			board.rotateBox = _this.rotateBox;
			board.scaleBox = _this.scaleBox;

			board.rotateBox.css({
				top: -board.moreTop,
				left: -board.moreLeft
			})

			_this.iframe.css({
				width: width,
				height: height,
				position: "absolute",
				top: (board.canvasHeight - height) / 2,
				left: (board.canvasWidth - width) / 2,
			});

			board.setPosition(1, 0, 0);

		}, {
			width: width,
			height: height
		});
	},
	messageEvent: function(e) {
		var message = null;

		try {
			message = JSON.parse(e.data);
			if(message && message.type) {
				OfficeHtml.handleMessage(message);
			}
		} catch(ex) {
			console.log(ex);
		}

	},
	//初始化事件
	initEvent: function(iframe, action) {
		var _this = this;
		window.removeEventListener("message", _this.messageEvent);
		window.addEventListener("message", _this.messageEvent);
		//临时保存数据
		this.action = action;

		iframe.onload = function() {

			var $this = $(this);
			_this.iframeCW = this.contentWindow;
			_this.iframeContent = $this.contents();

			_this.presentation = _this.iframeCW.Presentation;
			iframe.onload = null;
		};
	},
	//跳转到某一页
	getImage: function(index, action) {
		var _this = this;

		if(_this.presentation.resetSlide) {
			_this.presentation.resetSlide(_this.currentIndex)
		} else {
			_this.iframeCW.finishAnima();
			_this.iframeCW.jump2Anima(_this.currentIndex, action.animateIndex);
		}
		_this.iframeCW.jump2Anima(index, action.animateIndex);
	},
	zoomImg: function(x, y, size) {},
	next: function(action) {
		this.iframeCW.jump2Anima(action.page, action.animateIndex, "next");
	},
	prev: function(action) {
		this.iframeCW.jump2Anima(action.page, action.animateIndex, "prev");
	},
	pause: function() {
		this.presentation.Pause();
	},
	play: function() {
		this.presentation.Play();
	},
	drawLine: function(data) {
		if(!this.painting) {
			return;
		}
		var paint = data.paint;
		//画线并保存笔迹
		this.painting.drawLine(paint);
		this.painting.savePaint(paint);
	},
	cancel: function() {
		if(!this.painting) {
			return;
		}
		this.painting.cancel();
	},
	empty: function(action) {
		if(!this.painting) {
			return;
		}
		this.painting.clear();
	},
	zoom: function(action) {
		if(!this.painting) {
			return;
		}
		this.painting.zoom(action.scale, action.left, action.top);
	},
	rotate: function(action) {
		if(!this.painting) {
			return;
		}
		this.painting.rotate(action.angle, action.scale, action.left, action.top);
	},
	//根据在历史重绘
	imageReload: function(position) {
		if(!this.painting) {
			return;
		}
		this.historys[this.currentIndex] = this.painting.historyPen;

		//		if (!this.historys[position]) {
		//			this.historys[position] = [];
		//		}
		this.painting.historyPen = this.historys[position] || [];
		this.painting.reload();
	}

}