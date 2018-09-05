/**
 * 头脑风暴结束类
 */
 
var BrainStormEnd = {
	classType : "BrainStormEnd",
	replyCount: 4,
	replyHeight: 710,
    marinTop: 50,
    actId: '',
    contentWidth: 0,
	init: function(content, token, action) {
		// 初始化数据
		this.contentWidth = window.screen.width * 0.9 - 230;
		this.colorClass = ["color-white", "color-blue"];
		this.colorCurrent = 0;
		 
		this.replyCount = Math.floor(window.screen.height / 250);

        this.actId = action.actId;
        this.content = content;
        this.getBrainStorm(action.actId);
        return this;
	},
	// 获取头脑风暴
	getBrainStorm: function(BrainStormId) {
		var _this = this;
        $.post(config.moocAppStudent + "/FaceTeach/getBrainStromStuInfo", {
            BrainStormId: BrainStormId,
        }, function (r) {
            if (r && r.code > 0) {
                _this.showBrainStorm(r);
            }
        }, 'json');
	},
	// 显示头脑风暴
	showBrainStorm: function(r) {
		var _this = this;
		var list = r.datalist;
		this.content.css("background", "#1C1C1C");
        var reg = new RegExp("<img[^>]+src\\s*=\\s*['\"]([^'\"]+)['\"][^>]*>", "g");
        var tagReg = new RegExp("<[^>]*>", "g");
		$.each(list, function (i, v) {
            if (v.DocJson.length > 0) {
                v.Content = v.Content + '[图片]';
            } else {
				v.Content = v.Content;
			}
        });
		
		var html = $(template("activity-brain-storm", {
            list: list
        }));
		
		html.find(".brain-storm-wrap").css({
            paddingTop: (window.screen.height - this.replyCount * 250) / 2 + 15
        });
		//设置奇偶不能色
        html.find(".brain-storm-list:even").addClass("color-blue");
        html.find(".brain-storm-list:odd").addClass("color-white");

        this.content.html(html);
        _this.setHtmlHeight($('.brain-storm-wrap'));
        html.find(".brain_storm_content").css({
            width: this.contentWidth
        });
	},
	setHtmlHeight: function (html) {
        //如果题目太高，则循环滚动
        var maxHeight = window.screen.height * 0.98,
            height = html.height(),
            top = 0,
            bottom = maxHeight + top - height;

        if (height > maxHeight) {
            html.css("margin-top", top);

            this.top = top;
            this.bottom = bottom;
        } else {
            this.top = this.bottom = bottom;
        }
    },
	
	pageUp: function () {
        if (this.top == this.bottom) return;
        var html = $(".brain-storm-wrap");
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
        var html = $(".brain-storm-wrap");
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