//ppt操作类
function Office() {

}

Office.prototype.init = function (i, url, content, historyRealy, mobileScreen, noInternet) {
    if (!content) return;
    content.html($("<div id = 'loading' class='loading'></div>"));
    var _this = this;
    content.css("background", "#fff");

    this.currentIndex = -1;

    _this.content = content;
    _this.url = url;
    _this.urls = url.urls;
    _this.screenTemp = screenTemp;
    _this.canvasImgs = [];
    _this.mobileScreen = mobileScreen;
    _this.historys = [];
    _this.currentImg = null;

    if (historyRealy.length > 0) {
        _this.historys = historyRealy;
    }

    if (!i) {
        i = 1;
    }
    if (!noInternet) {
        _this.imgs = [];

        var args = url.args;

        //判断是不是走oss预览文件
        if (_this.urls.preview_oss_gen == "") {

            if (url.category == 'img') {
                _this.imgs.push("preview.jpg");
            } else {

                if (!args || !args.page_count) {
                    return false;
                }

                for (var j = 1; j <= args.page_count; j++) {
                    _this.imgs.push(j + ".preview.jpg")
                }
            }
        } else {
            if (url.category == "img") {

                _this.imgs.push("img");

            } else {


                if (!args || !args.page_count) {
                    return false;
                }

                for (var j = 1; j <= args.page_count; j++) {
                    _this.imgs.push(j + ".png")

                }

            }
        }
    }

    _this.getImage(i);

    return true;
}

//下载完成后开始
Office.prototype.begin = function (action) {
    this.imgs = action.imgs;

    this.init(action.page, {
        urls: {
            previewUrl: action.previewUrl
        }
    }, socketIO.content, [], action.screen, true);

}

Office.prototype.getImage = function (i) {
    var _this = this,
		imgs = _this.imgs;

    if (i > imgs.length) {
        return;
    }

    i--;

    if (i == this.currentIndex) {
        return;
    }

    var img = imgs[i];

    if (img) {
        var imgUrl = "";

        //是否从oss中读取图片
        if (this.urls.preview_oss_gen == "") {
            imgUrl = _this.urls.previewUrl.replace("[place]", img);
        } else {
            imgUrl = img == "img" ? _this.urls.preview_oss_ori : _this.urls.preview_oss_gen + "/" + img;
        }


        //保存笔迹
        if (_this.currentImg && _this.currentImg.historyPen) {
            _this.historys[_this.currentIndex] = _this.currentImg.historyPen.concat();
        }

        var currentImg = _this.currentImg,
			imgCanvas = _this.canvasImgs[i],
			lastIndex = _this.currentIndex;
        _this.currentIndex = i;

        if (imgCanvas && imgCanvas.imgUrl == imgUrl) {

            _this.currentImg = imgCanvas;
            _this.currentImg.imgPositon = i;

            var callback = function (board) {
                //隐藏的设置类，用于查找
                var html = imgCanvas.getShowCanvas();

                html.addClass("image_" + board.imgPositon);

                _this.content.html(html);
                _this.content.append(imgCanvas.painting);
                //显示
                //				_this.setAnimate(board.imgPositon, lastIndex);

                if (_this.historys[board.imgPositon]) {
                    board.historyPen = _this.historys[board.imgPositon];
                }
                board.reload();
                //开始缓存
                _this.cacheImgs(board.imgPositon);
            }

            if (imgCanvas.loaded) {
                callback(imgCanvas);
            } else {
                imgCanvas.callback = callback;
            }

        } else {

            _this.currentImg = new BoardCanvas(imgUrl, _this.mobileScreen, function (board) {
                var html = board.getShowCanvas();

                html.addClass("image_" + board.imgPositon);
                _this.content.html(html);
                _this.content.append(board.painting);

                if (_this.historys[board.imgPositon]) {
                    board.historyPen = _this.historys[board.imgPositon];
                }
                board.reload();

                //开始缓存
                _this.cacheImgs(board.imgPositon);
                _this.canvasImgs[board.imgPositon] = board;
            })
            _this.currentImg.imgPositon = i;
        }
    }
}

//设置动画效果
Office.prototype.setAnimate = function (index, lastIndex) {
    var _this = this;

    var currentCanvas = _this.content.find(".image_" + index),
		lastCanvas = _this.content.find(".image_" + lastIndex);

    currentCanvas.fadeIn(300, function () {
        lastCanvas.remove();
    });
}

//缓存图片
Office.prototype.cacheImgs = function (i) {
    var n = 1;
    var _this = this,
		imgs = _this.imgs,
		imgList = [],
		canvasImgs = _this.canvasImgs;

    //要缓存的数据，从i前后缓存
    for (m = 1; m <= 1; m++) {
        if (i + m < imgs.length) {
            imgList.push(i + m);
        }

        if (i - m >= 0) {
            imgList.push(i - m);
        }
    }
    var j = 0;
    for (j = 0; j < i - n && j < canvasImgs.length; j++) {
        if (canvasImgs[j]) {
            canvasImgs[j].closed = true;
            canvasImgs[j] = null;
        }
    }

    for (j = i + n + 1; j < canvasImgs.length; j++) {
        canvasImgs[j] = null;
    }

    var cacheSuccess = function () {
        if (imgList.length > 0) {
            cachePosition(imgList.shift());
        }
    }

    var cachePosition = function (position) {
        var imgName = imgs[position];
        var imgCanvas = canvasImgs[position];
        var imgUrl = _this.urls.previewUrl.replace("[place]", imgName);

        if (imgCanvas && imgCanvas.imgUrl == imgUrl) {
            cacheSuccess();
            return;
        }

        canvasImgs[position] = new BoardCanvas(imgUrl, _this.mobileScreen, function (board) {
            cacheSuccess();
        });
    }

    cacheSuccess();

}
Office.prototype.drawLine = function (action) {
    var paint = action.paint;
    //画线并保存笔迹
    this.currentImg.drawLine(paint);
    this.currentImg.savePaint(paint);
}
Office.prototype.cancel = function () {
    this.currentImg.cancel();
}
Office.prototype.empty = function (action) {
    this.currentImg.clear();
}
Office.prototype.reload = function (action) {
    this.initBoard(action);
}
Office.prototype.zoom = function (action) {
    this.currentImg.zoom(action.scale, action.left, action.top);
}
Office.prototype.rotate = function (action) {
    this.currentImg.rotate(action.angle, action.scale, action.left, action.top);
}