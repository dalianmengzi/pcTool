/**
 * 讨论管理类 
 */
var Discuss = {
    classType: "Discuss",
    replyCount: 4,
    replyHeight: 710,
    marinTop: 50,
    actId: '',
    contentWidth: 0,
    init: function (content, token, action) {
        //初始化数据
        this.contentWidth = window.screen.width * 0.9 - 230;
        this.colorClass = ["color-white", "color-blue"];
        this.colorCurrent = 0;

        this.replyCount = Math.floor(window.screen.height / 250);

        this.actId = action.actId;
        this.content = content;
        this.getDiscuss(action.actId);
        return this;
    },
    //给学生评分
    markScoreForStudent: function (action) {
        var score = $(".score_" + action.id);
        if (score.length > 0) {
            score.html(action.score);
        }
    },
    //获取讨论
    getDiscuss: function (discussId) {
        var _this = this;
        $.post(config.moocAppStudent + "/FaceTeach/getDiscussReplyList", {
            discussId: discussId,
        }, function (r) {
            if (r && r.code > 0) {
                _this.showDiscuss(r);
            }
        }, 'json');
    },
    //显示讨论
    showDiscuss: function (r) {
        var _this = this;
        var list = r.discussInfo.replyList,
			data = r.discussInfo;
        this.content.css("background", "#1C1C1C");
        var reg = new RegExp("<img[^>]+src\\s*=\\s*['\"]([^'\"]+)['\"][^>]*>", "g");
        var tagReg = new RegExp("<[^>]*>", "g");
        $.each(list, function (i, v) {
            if (v.docJson.length > 0) {
                v.content = v.content + '[图片]';
            }
        });
        if (data.docJson.length > 0) {
            data.content = data.content + '[图片]'
        }       

        var html = $(template("activity-discuss", {
            list: list,
            data: data
        }));

        //没有回复时显示标题
        if (list.length == 0) {
            html.find(".discuss-content").show();
            html.find(".discuss-wrap").hide();
        }
        html.find(".discuss-wrap").css({
            paddingTop: (window.screen.height - this.replyCount * 250) / 2 + 15
        });
        //设置奇偶不能色
        html.find(".discuss-list:even").addClass("color-blue");
        html.find(".discuss-list:odd").addClass("color-white");

        this.content.html(html);
        _this.setHtmlHeight($('.discuss-wrap'));
        html.find(".discuss_list_content").css({
            width: this.contentWidth
        });
    },
    //增加回复
    addReply: function (action) {
        var _this = this;

        if (_this.actId && action.actId != _this.actId) {
            return;
        }
        $(".discuss-wrap").show();
        $(".discuss-content").hide();
        //设置头像
        if (action.avator == "none" || action.avator == "null") {
            action.avator = '';
        }
        action.content = action.content.replace(/<img[^>]+src\s*=\s*['"]([^'"]+)['"][^>]*>/g, "[图片]").replace(/<[^>]*>/g, "");
        //显示新的回复
        var html = $(template("activity-discuss-reply", {
            value: action
        }));
        //设置当前行颜色
        html.addClass(this.colorClass[this.colorCurrent]);
        this.colorCurrent = (++this.colorCurrent) % 2;

        html.find(".discuss_list_content").css({
            width: this.contentWidth
        });

        html.hide();

        html.prependTo($(".discuss-wrap"));

        html.slideDown(1000);

        $(".discuss-list").slice(_this.replyCount).fadeOut(1000, function () {
            this.remove();
        });
    },
    //显示讨论详请
    showReplyDetail: function (data) {
        var _this = this;
        
        _this.showDetail(data);

    },
    //显示详情
    showDetail: function (r) {
        var _this = this;
        var html = $(template("activity-discuss-detail",  {
            value: r
        }));
                 
        var imgs = html.find("img:not(.cont_pic)");
        imgs.css({
            maxWidth: 960 / imgs.length,
            maxHeight: (_this.replyHeight - 200) / (imgs.length > 1 ? 2 : 1)
        });
        html.find(".discuss_list_content").css({
            width: _this.contentWidth
        })
        $(".discuss-wrap").hide();
        console.log($(".discuss-detail-box"));
        $(".discuss-detail-box").html(html).show();

        //计算字体大小
        var fontSize = 0,
			spacing = 0,
			height = window.screen.height * 0.95 - 200,
			width = _this.contentWidth;

        fontSize = Math.floor(Math.sqrt(((width * height) / r.content.length + 1)));

        if (fontSize > 40) {
            fontSize = 40;
        }

        spacing = Math.floor(fontSize / 10)

        html.find(".discuss_list_content").css({
            fontSize: fontSize - spacing,
            lineHeight: fontSize + "px",
            textIndent: fontSize + "px",
            letterSpacing: spacing + "px"
        })
    },
    //关闭讨论详请
    closeReplay: function () {
        var _this = this;
        $(".discuss-wrap").show();
        $(".discuss-detail-box").html("").hide();
    },
    setHtmlHeight: function (html) {
        //如果题目太高，则循环滚动
        var maxHeight = window.screen.height * 0.98,
            height = html.height(),
            //height = 600 * 2
            //top = height / 4,
            top = 0,
            bottom = maxHeight + top - height;

        if (height > maxHeight) {
            html.css("margin-top", top);

            this.top = top;
            this.bottom = bottom;
        } else {
            this.top = this.bottom = bottom;
            //html.css("margin-top", bottom);
        }

    },
    pageUp: function () {
        if (this.top == this.bottom) return;
        var html = $(".discuss-wrap");
        var top = parseInt(html.css("margin-top"));

        if (top == this.top) return;

        top += window.screen.height / 2;

        if (top > this.top) {
            top = this.top;
        }

        html.animate({
            marginTop: top
        }, 300, 'linear')
    },
    pageDown: function () {
        if (this.top == this.bottom) return;
        var html = $(".discuss-wrap");
        var top = parseInt(html.css("margin-top"));

        if (top == this.bottom) return;

        top -= window.screen.height / 2;

        if (top < this.bottom) {
            top = this.bottom;
        }

        html.animate({
            marginTop: top
        }, 300, 'linear')
    }

}