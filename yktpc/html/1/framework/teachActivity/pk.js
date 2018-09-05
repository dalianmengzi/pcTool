/**
 * 随堂测试相关类
 */
var pk = {
    classType: "pk",
    fragment: null,
    content: null,
    studentFinished: 0,
    studentCount: 0,
    studentIds: [],
    actId: "",

    //展示pk小组信息
    showInfo: function (content, action) {
        var _this = this;
        if (content && action) {
          
            var html = template("pk_info", action);
            content.html(html);
        }

    },
    //更改小组分值
    showScore: function (action) {
        var lis = $('#' + action.id).find('li');
        for (var i = 0; i < lis.length; i++) {
            lis[i].className = i < parseInt(action.num) ? "light" : "";//点亮星星就是加class为light的样式
        }

    },
    //查看小组人员
    showStu: function (content, action) {

        var _this = this;
        if (content && action) {
            var html = template("pk_stu", action);
            content.html(html);
        }

    },

    //设置题目的显示
    setHtmlHeight: function (html) {
        html.css({
            width: "50%",
            transform: "scale(2)"
        });
        //如果题目太高，则循环滚动
        var maxHeight = window.screen.height * 0.98,
            height = html.height() * 2,
            top = height / 4,
            bottom = maxHeight + top - height;

        if (height > maxHeight) {
            html.css("margin-top", top);

            this.top = top;
            this.bottom = bottom;
        } else {
            this.top = this.bottom = bottom;
            html.css("margin-top", bottom);
        }

    },
    questionAnalysisBack: function () {
        if (this.content) {
            this.content.find("#question-one-analysis").html("");
            this.content.find("#exam-analysis").show();

            if (this.isReloadChart) {
                this.isReloadChart = false;
                this.reloadChart();
            }
        }
    },
    pageUp: function () {
        if (this.top == this.bottom) return;
        var html = $("#exam-analysis-question");
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
        var html = $("#exam-analysis-question");
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