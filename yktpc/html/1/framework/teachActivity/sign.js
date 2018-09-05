/**
 * 签到类
 */
var Sign = {
    classType: "Sign",
    fragment: null,
    studentCount: 0,
    studentSigned: 0,
    studentIds: [],
    actId: "",
    init: function (content, action) {
        if (!action.studentNumber) {
            action.studentNumber = 0;

        }
        var _this = this,
            chart;

        _this.content = content;
        _this.studentSigned = action.studentNumber;
        _this.studentCount = action.studycount;

        if (_this.actId != action.signId) {
            _this.studentIds = [];
        }

        _this.actId = action.signId;

        switch (action.signType) {
            case "none":
                _this.fragment = $(template("activitying-tmpl", {
                    title: '签到中'
                }));
                chart = _this.fragment.find(".activitying-chart")[0];
                break;
            case "gesture":
                _this.fragment = $(template("activity-signing-gesture", action));
                _this.createGesture(action.numbers.split(""));
                chart = _this.fragment.find(".activitying-chart-gesture")[0]
                break;
        }

        content.html(_this.fragment);

        this.initIng(chart);
    },
    initIng: function (chart) {
        this.chartData = chart;
        this.chartFunction = this.initIng;
        Activitying.init(chart, this.studentCount, this.studentSigned);
    },
    //重新加载图表
    chartData: null,
    chartFunction: null,
    reloadChart: function () {
        if (this.chartData && this.chartFunction) {
            this.chartFunction(this.chartData);
        }
    },
    createGesture: function (numbers) {
        var _this = this;

        if (numbers.length < 2) {
            return false;
        }
        for (var i = 0; i < numbers.length - 1; i++) {
            var line = $('<div class="patt-lines" style="top: 82px; left: 82px; width: 138px; transform: rotate(45deg);"><div class="lines-arrow"></div></div>');
            var y1 = Math.floor(numbers[i] / 3),
                x1 = numbers[i] % 3,
                y2 = Math.floor(numbers[i + 1] / 3),
                x2 = numbers[i + 1] % 3,
                y = y2 - y1,
                x = x2 - x1;

            var top = 82 + y1 * 100,
                left = 82 + x1 * 100,
                tanAngle = Math.atan2(y, x) / Math.PI, //角比例
                angle = 180 * (2 + tanAngle), //角
                width = 0;

            if (y == 0) {
                width = Math.abs(x * 100 / Math.cos(Math.PI * Math.abs(tanAngle)));
            } else {
                width = Math.abs(y * 100 / Math.sin(Math.PI * Math.abs(tanAngle)));
            }

            line.css({
                'top': top + 'px',
                'left': left + 'px',
                'width': width + "px",
                'transform': 'rotate(' + angle + 'deg)'
            });

            line.find(".lines-arrow").css({
                "left": width - 15 + "px"
            })

            _this.fragment.find(".patt-holder").append(line);
        }
    },
    signed: function (action) {
        var _this = this;

        if (action.actId != this.actId) {
            return;
        }

        if (_this.studentIds.indexOf(action.sendId) < 0 && _this.studentSigned < _this.studentCount) {
            _this.studentIds.push(action.sendId);
            _this.studentSigned = _this.studentIds.length ;
        } else {
            return;
        }

        Activitying.setNumber(_this.studentSigned, _this.content, action.name)
    },
    signedResult: function (content, action) {
        var _this = this;
        if (content && action) {
            if (action.notSignUser) {
                var html = template("signed-result", action);

                content.html(html);
                _this.setHtmlHeight($('#signed-result-analysis'));
            }
        }
    },
    /**
     * 初始化图表
     * @return {this}
     */
    initChart: function (content, data) {

        var html = $(template("signed-analysis", data));

        content.html(html);

        $(".analysis-image", html).css("height", $(window).height() * 0.6);

        var data1 = [], data2 = [], data3 = [];
        if (data.signPercentData.signLackPercent != 0) {
            data1.push('缺勤');
            data2.push({ value: data.signStuCountData.signLackStuCount, name: '缺勤' });
            data3.push(data.signPercentData.signLackPercent);
        }
        if (data.signPercentData.signPercent != 0) {
            data1.push('已签');
            data2.push({ value: data.signStuCountData.signStuCount, name: '已签' });
            data3.push(data.signPercentData.signPercent);
        }
        if (data.signPercentData.signLatePercent != 0) {
            data1.push('迟到');
            data2.push({ value: data.signStuCountData.signLateStuCount, name: '迟到' });
            data3.push(data.signPercentData.signLatePercent);
        }
        if (data.signPercentData.signLatterPercent != 0) {
            data1.push('事假');
            data2.push({ value: data.signStuCountData.signLatterStuCount, name: '事假' });
            data3.push(data.signPercentData.signLatterPercent);
        }
        if (data.signPercentData.signLeaveEarlyPercent != 0) {
            data1.push('早退');
            data2.push({ value: data.signStuCountData.signLeaveEarlyStuCount, name: '早退' });
            data3.push(data.signPercentData.signLeaveEarlyPercent);
        }
        if (data.signPercentData.signIllnessPercent != 0) {
            data1.push('病假');
            data2.push({ value: data.signStuCountData.signIllnessStuCount, name: '病假' });
            data3.push(data.signPercentData.signIllnessPercent);
        }

        if (data.signPercentData.signHolidayStuCount != 0) {
            data1.push('公假');
            data2.push({ value: data.signStuCountData.signHolidayStuCount, name: '公假' });
            data3.push(data.signPercentData.signHolidayPercent);
            
        }


        option = {
            tooltip: {
                trigger: 'item',
                formatter: "{a} <br/>{b}: {c} ({d}%)"
            },
            legend: {
                show: true,
                orient: 'vertical',
                x: 'left',
                formatter: function (name) {
                    var str = 0;
                      $.each(data2, function (i, v) {
                         if (v.name == name) {
                            str = data3[i];

                          }
                       });
                    return name + str + '%';
                },

                data: data1

            },
            graphic: {
                type: 'text',
                left: 'center',
                top: 'center',
                style: {
                    text: '签到结果',
                    textAlign: 'center',
                    fill: '#000',
                    width: 30,
                    height: 30
                }
            },
            series: [
                {
                    name: '签到结果',
                    type: 'pie',
                    radius: ['35%', '65%'],
                    itemStyle: {
                        normal: {
                            label: {
                                show: true,
                                textStyle: { color: '#3c4858', fontSize: "18" },
                                formatter: function (val) {
                                    //让series 中的文字进行换行
                                    return val.value;
                                }

                            },
                            title: {
                                text: 'aaaa'
                            },
                            labelLine: {
                                show: true,
                                lineStyle: { color: '#3c4858' }
                            }
                        },
                        emphasis: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)',
                            textColor: '#000'
                        }
                    },
                    data: data2
                }
            ]
        };

        var myChart = echarts.init(document.getElementById('sign_pie'));
        myChart.setOption(option);

    },
    signedAnalysis: function (content, action) {
        var _this = this;

        $.post(config.moocApp + "/FaceTeach/signStatis", {
            activityId: action.activityId,
            courseOpenId: action.courseOpenId,
            signId: action.signId
        }, function (r) {
            if (!r) {
                tips("发生未知错误！");
                return false;
            }

            if (r.code < 0) {
                tips(r.msg || "发生错误");
                return false;
            }

            _this.initChart(content, r);

        }, 'json');

    },
    setHtmlHeight: function (html) {
        //html.css({
        //   width: "50%",
        //   transform: "scale(2)"
        //});
        //如果题目太高，则循环滚动
        var maxHeight = window.screen.height * 0.98,
            height = html.height(),
            //height = 600 * 2
            //top = height / 2,
            top = 0,
            bottom = maxHeight + top - height;

        if (height > maxHeight) {
            html.css("margin-top", top);

            this.top = top;
            this.bottom = bottom;
        } else {
            this.top = this.bottom = bottom;
            // html.css("margin-top", bottom);
        }

    },
    pageUp: function () {
        if (this.top == this.bottom) return;
        var html = $("#signed-result-analysis");
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
        var html = $("#signed-result-analysis");
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

};