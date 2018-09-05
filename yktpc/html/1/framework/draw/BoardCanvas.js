function BoardCanvas(imgUrl, mobileScreen, callback, contentScreen) {
	var _this = this,
		img = new Image();

	_this.left = 0;
	_this.top = 0;
	_this.scale = 1;
	_this.rotateScale = 1;
	_this.mobileScreen = mobileScreen;
	_this.canvasImg = null;
	_this.painting = null;
	_this.loaded = false;
	_this.historyPen = [];
	_this.callback = callback;
	_this.closed = false;
	_this.dx = 0;
	_this.dy = 0;
	_this.rotateAngle = 0;
	_this.mScale = 1;

	if(contentScreen) {
		_this.width = contentScreen.width;
		_this.height = contentScreen.height;
	} else {
		_this.width = window.screen.width;
		_this.height = window.screen.height;
	}

	if(imgUrl) {
		_this.imgUrl = imgUrl;
		var canvasImg = $('<img class="canvasImage" src = "' + imgUrl + '" />'),
			img = canvasImg[0];
		img.onload = function() {
			if(!_this.closed) {
				var self = this;
				_this.canvasImg = canvasImg;
				setTimeout(function(){
				    _this.initCanvas(self)
				}, 1000);
			}
		};
		img.onerror = function() {
			if(!_this.closed) {
				_this.initCanvas();
			}
		}
		img.src = imgUrl;
	} else {
		if(!_this.closed) {
			_this.initCanvas();
		}
	}

}

/**
 * 获取显示
 */
BoardCanvas.prototype.getShowCanvas = function() {
	var scaleBox = $("<div class='scale-box'></div>");
	var rotate = $("<div class='rotate-box'></div>");
	var result = $("<div class='canvas-box'></div>");

	this.scaleBox = scaleBox;
	this.rotateBox = rotate;
	this.result = result;

	//设置宽高，不然缩放时不是从中心缩放
	scaleBox.css({
		width: window.screen.width,
		height: window.screen.height
	})

	//主div 用于是所有的缩放
	scaleBox.append(rotate);

	//旋转box 旋转时旋转此div
	rotate.append(result);
	rotate.css({
		top: -this.moreTop,
		left: -this.moreLeft
	})

	//加入图片
	if(this.canvasImg) {
		result.append(this.canvasImg[0]);
	}

	this.rotate(0, 1, 0, 0);
	this.zoom(this.scale, this.left, this.top);

	return scaleBox;
}

/**
 * 重画
 */
BoardCanvas.prototype.reload = function() {
	this.paintingCtx.setTransform(1, 0, 0, 1, 0, 0);
	this.paintingCtx.clearRect(0, 0, window.screen.width, window.screen.height);
	if(this.historyPen.length > 0) {
		for(var i in this.historyPen) {
			this.drawLine(this.historyPen[i]);
		}
	}
}

/**
 * 取消上一笔
 */
BoardCanvas.prototype.cancel = function() {
	if(this.historyPen.length > 0) {
		this.historyPen.pop();
	}
	this.reload();
}

/**
 * 清空
 */
BoardCanvas.prototype.clear = function() {
	this.historyPen.splice(0);
	this.reload();
}

/**
 * 保存笔迹
 * @param {Object} paint
 */
BoardCanvas.prototype.savePaint = function(paint) {
	this.historyPen.push(paint);
}

/**
 * 画线
 * @param {Object} color 颜色
 * @param {Object} width 宽度
 * @param {Object} points 路径
 * @param {Object} type 是笔还是橡皮擦 pen or eraser
 */
BoardCanvas.prototype.drawLine = function(paint) {
	var ctx = this.paintingCtx,
		color = paint.color,
		width = paint.width,
		points = paint.path,
		type = paint.type;

	if(type && type == "eraser") {
		ctx.globalCompositeOperation = "destination-out";
	} else {
		ctx.globalCompositeOperation = "source-over";
	}

	$.extend(ctx, {
		lineJoin: "round",
		lineCap: "round",
		lineWidth: width,
		strokeStyle: color,
	});

	//设置矩阵变换
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.translate(-this.mLeft, -this.mTop);

	ctx.scale(this.mScale, this.mScale);

	ctx.scale(this.initScale, this.initScale);
	ctx.scale(this.scale, this.scale);
	ctx.translate(this.dx / this.initScale, this.dy / this.initScale);
	ctx.rotate(this.rotateAngle / 180 * Math.PI);

	ctx.translate(this.left, this.top);

	ctx.scale(this.rotateScale, this.rotateScale);

	//开始画路径
	ctx.beginPath();

	var i = 0,
		k = 0,
		point0,
		point;

	if(points.length < 2) {
		return;
	}

	point0 = points[0];
	ctx.moveTo(point0.x, point0.y);

	for(i = 1; i < points.length; i++) {
		point = points[i];
		ctx.quadraticCurveTo(point0.x, point0.y, (point.x + point0.x) / 2, (point.y + point0.y) / 2);
		point0 = point;
	}

	ctx.lineTo(point.x, point.y);

	ctx.stroke();

	ctx.closePath();
}

BoardCanvas.prototype.rotate = function(angle, scale, left, top) {
	this.rotateAngle = angle;
	var moreScale = 1;
	this.rotateScale = 1;
	this.mLeft = this.moreLeft;
	this.mTop = this.moreTop;

	if(angle == 90 || angle == 270) {
		this.rotateScale = scale;
		moreScale = this.moreScale;

		this.mLeft = this.lMoreLeft;
		this.mTop = this.lMoreTop;
	}
	this.rotateBox.css({
		transform: "rotate(" + angle + "deg)"
	});
	this.scaleBox.css({
		transform: "scale(" + moreScale + ")"
	});

	this.mScale = moreScale;

	this.zoom(1, left, top);
	this.reload();
}

/**
 * 缩放图片
 * @param {Object} scale
 * @param {Object} left
 * @param {Object} top
 */
BoardCanvas.prototype.zoom = function(scale, left, top) {
	this.scale = scale;
	this.left = left;
	this.top = top;

	left = left * this.initScale * scale;
	top = top * this.initScale * scale;

	//计算旋转点
	var cx = this.canvasWidth / 2,
		cy = this.canvasHeight / 2;

	var dx = cx - cx * Math.cos(this.rotateAngle / 180 * Math.PI) + cy * Math.sin(this.rotateAngle / 180 * Math.PI);
	var dy = cy - cy * Math.cos(this.rotateAngle / 180 * Math.PI) - cx * Math.sin(this.rotateAngle / 180 * Math.PI);

	if(this.rotateBox) {
		this.rotateBox.css({
			left: dx * scale - this.moreLeft,
			top: dy * scale - this.moreTop
		});
	}

	this.dx = dx;
	this.dy = dy;

	this.setPosition(scale, left, top);
	this.reload();
}

/**
 * 设置缩放和位置
 * @param {Object} scale
 * @param {Object} left
 * @param {Object} top
 */
BoardCanvas.prototype.setPosition = function(scale, left, top) {
	if(this.result) {
		this.result.css({
			transform: "scale(" + scale * this.rotateScale + ")",
			left: left,
			top: top
		});
	}
}

/**
 * 初始化canvas
 * @param {Object} image
 */
BoardCanvas.prototype.initCanvas = function(image) {
	var windowWidth = window.screen.width,
		windowHeight = window.screen.height,
		canvasWidth = windowWidth,
		canvasHeight = windowHeight,
		width = this.width,
		height = this.height,
		mobileScreen = this.mobileScreen;
	if(image) {
		width = image.width;
		height = image.height;
	}
	//图片适应屏幕
	if(width / height > windowWidth / windowHeight) {
		height = height / width * windowWidth;
		width = windowWidth;
	} else {
		width = width / height * windowHeight;
		height = windowHeight;
	}

	if(width / height > mobileScreen.width / mobileScreen.height) {
		canvasWidth = width;
		canvasHeight = mobileScreen.height / mobileScreen.width * canvasWidth;
	} else {
		canvasHeight = height;
		canvasWidth = mobileScreen.width / mobileScreen.height * canvasHeight;
	}

	//横屏图片适应屏幕
	if(height / width > windowWidth / windowHeight) {
		this.moreScale = windowWidth / canvasWidth;
	} else {
		this.moreScale = windowHeight / canvasHeight;
	}

	this.lMoreLeft = (canvasWidth * this.moreScale - windowWidth) / 2;
	this.lMoreTop = (canvasHeight * this.moreScale - windowHeight) / 2;

	//多余的left和top
	this.moreLeft = (canvasWidth - windowWidth) / 2;
	this.moreTop = (canvasHeight - windowHeight) / 2;

	if(image) {

		image.width = width;
		image.height = height;

		this.canvasImgCss = {
			width: width,
			height: height,
			top: (canvasHeight - height) / 2,
			left: (canvasWidth - width) / 2
		}

		this.canvasImg.css(this.canvasImgCss);
	}

	var painting = $('<canvas class="canvasImage" width="' + windowWidth + '" height="' + windowHeight + '"></canvas>')[0];
	//画笔上面的画板
	this.painting = painting;
	this.paintingCtx = painting.getContext("2d");
	this.width = width;
	this.height = height;
	this.canvasWidth = canvasWidth;
	this.canvasHeight = canvasHeight;
	this.mLeft = this.moreLeft;
	this.mTop = this.moreTop;

	//电脑和手机的比例
	this.initScale = this.firstScale = canvasWidth / mobileScreen.width;

	if(this.callback) {
		this.callback(this);
	}
	this.loaded = true;
}