/**
 * 视频操作类
 */
var Video = {
    classType: "Video",
    player: null,
    init: function (data, content) {
        content.css("background", "#000");
        var _this = this,
            player = $('<video></video>');

        _this.content = content;
        _this.socket = socketIO.socket;
        if (socketIO.socketSelf.connected) {
            _this.socket = socketIO.socketSelf;
        }
        var objPreview = jQuery.parseJSON(data.url)

        var previewUrl = "";

        if (objPreview.urls.preview_oss_gen == "") {
            previewUrl = objPreview.urls.preview;

        } else {
            previewUrl = objPreview.urls.preview_oss_gen;

        };

        var url = previewUrl;

		if (objPreview.args['720p'] == true) {
			url = url + "/720p.mp4";
		} else if (objPreview.args['480p'] == true) {
			url = url + "/480p.mp4";
		} else if (objPreview.args['360p'] == true) {
			url = url + "/360p.mp4";
		}

        player.prop("src", url);

        content.html(player);

        _this.player = player[0];

        _this.initEvent(player);

        return this;
    },
    initEvent: function (player) {
        var _this = this;

        player.on("canplay", function () {
            _this.sendInfo("videoDuration");
        });

        player.on("ended seeked pause", function () {
            _this.sendInfo("videoInfo", false);
        });

        player.on("play", function () {
            _this.sendInfo("videoInfo", true);
        });
    },
    play: function (action) {
        var _this = this;
        if (action && action.position) {
            this.player.currentTime = Number(action.position);
        }
        _this.player.play();
    },
    pause: function (action) {
        this.player.pause();
        if (action && action.position) {
            this.player.currentTime = Number(action.position);
        }
    },
    reload: function () {
        this.player.load();
    },
    seek: function (position) {
        this.player.currentTime = Number(position);
    },
    //给手机发送消息
    sendInfo: function (name, isContinue) {
        var _this = this;
        //发送给手机确认登录
        var sendData = {
            sendId: user.userId,
            receiveType: "user",
            receiver: {
                userType: "teacher",
                equipment: "mobile",
                userId: user.userId
            },
            action: {
                actionType: name,
                duration: _this.player.duration,
                currentTime: _this.player.currentTime,
                paused: _this.player.paused
            }
        };

        _this.socket.emit("order", JSON.stringify(sendData));

        if (isContinue) {
            setTimeout(function () {
                if (!_this.player.paused) {
                    _this.sendInfo(name, true);
                }
            }, 500);
        }

    }
}