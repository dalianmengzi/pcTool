/**
 * 随堂测试相关类
 */
var Exam = {
    classType: "Exam",
    fragment: null,
    content: null,
    studentFinished: 0,
    studentCount: 0,
    studentIds: [],
    actId: "",
    A_Z: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    init: function(content, action) {
        if(!action.studentNumber) {
            action.studentNumber = 0;
        }

        if(!action.studycount) {
            action.studycount = 0;
        }

        var fragment = $(template("activitying-tmpl", {
            title: '答题中'
        }));

        this.fragment = fragment;
        this.content = content;

        this.studentFinished = action.studentNumber;
        this.studentCount = action.studycount;

        if(this.actId != action.examId) {
            this.studentIds = [];
        }

        this.actId = action.examId;

        content.html(fragment);
        this.initIng(fragment.find(".activitying-chart")[0]);
    },
    initIng: function(chart) {
        this.chartData = chart;
        this.chartFunction = this.initIng;
        Activitying.init(chart, this.studentCount, this.studentFinished);
    },
    //重新加载图表
    chartData: null,
    chartFunction: null,
    reloadChart: function() {
        if(this.chartData && this.chartFunction) {
            this.chartFunction(this.chartData);
        }
    },
    /**
	 * 显示完成测试学生
	 * @param {Object} name 学生姓名
	 */
    addStudent: function(action) {
        if(action.actId != this.actId) {
            return;
        }

        var _this = this,
			fragment = _this.fragment,
			student = $('<div class="activity-student"></div>');

        if(_this.studentIds.indexOf(action.sendId) < 0) {
            _this.studentIds.push(action.sendId);
            _this.studentFinished =  _this.studentIds.length
        } else {
            return;
        }

        Activitying.setNumber(_this.studentFinished, _this.content, action.name)
    },
    /**
	 * 显示测试结果
	 */
    showResult: function(action, url, operate) {
        var _this = this;

        _this.content = socketIO.content;

        if (action.actionType == "questionAnalysis") {
        _this[operate](action.data.data);
        } else {
        $.get(config.moocApp + url, {
            activityId: action.data.activityId,
            schoolId: action.data.schoolId,
            courseOpenId: action.data.courseOpenId,
            classTestId: action.data.classTestId,
        }, function(r) {
            if(!r) {
                tips("发生未知错误");
                return false;
            }
            if(r.code < 0) {
                return false;
            }

            r.action = action;
            r.token = socketIO.token;

            _this[operate](r.data);
        }, 'json');
      }
    },
    /**
	 * 显示结果到页面
	 * @param {Object} data 学生数据
	 */
    resultPage: function(data) {

    },
    /**
	 * 分析结果页
	 * @param {Object} data
	 */
    analysisPage: function(data) {
        var _this = this;

        if($("#exam-analysis:hidden").length) {
            _this.isReloadChart = true;
            return;
        }
        
        _this.chartData = data;
        _this.chartFunction = _this.analysisPage;

        var usetime = data.averageUseTime;

        if(usetime > 60) {
            data.min = Math.floor(usetime / 60) + "<i>Min</i>";
        }

        data.sec = Math.floor(usetime % 60) + "<i>Sec</i>";

        var chartHtml = $(".test-result-wrap .analysis-image");
        if(!chartHtml.length) {
            var fragment = $(template("activity-exam-analysis", data));

            _this.fragment = fragment;

            _this.content.html(fragment);
            chartHtml = $(".test-result-wrap .analysis-image");
        }

        //if(data && data.list) {
        if(data) {
            var list = data.list,
				item,
				studyCount = data.openClassStuCount,
				length = 6,
				dataX = ['未答题', '0-20', '20-40', '40-60', '60-80', '80以上'],
				dataY = [{value:data.unSubmitStuCount,itemStyle:{normal:{color:'#2ecc71'}}},
				{value:data.lessThan20StuCount,itemStyle:{normal:{color:'#f1c40f'}}},
                {value:data.from20To40StuCount,itemStyle:{normal:{color:'#e74c3c'}}},
                {value:data.from40To60StuCount,itemStyle:{normal:{color:'#3498db'}}},
                {value:data.from60To80StuCount,itemStyle:{normal:{color:'#2ecc71'}}},
                {value:data.greaterThan80StuCount,itemStyle:{normal:{color:'#f1c40f'}}}                          
				];
                          
            //dataY=[0,0,0,0,0,0];

            //for(var i = 0; i < list.length; i++) {
            //	item = list[i];

            //	var percent = 0;

            //	if(item.percent) {

            //		percent = item.percent;

            //		if(dataX[percent]) {
            //			dataY[percent] = item.count + dataY[percent];

            //			studyCount += item.count;
            //		} else {

            //			var j = percent;

            //			while(!dataX[j]) {
            //				dataX[j] = 20 * (j - 1) + "-" + 20 * j;
            //				dataY[j] = 0;
            //				j--;
            //			}
            //			i--;
            //		}
            //	} else {
            //		dataY[0] = item.count + dataY[0];
            //	}
            //}

            var setting = {
                grid: {
                    x: 80,
                    x2: 80,
                    y: 80,
                    y2: 50
                },
                title: {
                    text: '学生成绩区间分布图',
                    x: 'center',
                    y: 'top',
                    padding: 10,
                    textStyle: {
                        fontSize: 35,
                        color: theme == 1 ? "#000" : '#fff',
                        fontWeight: 'normal'
                    }
                },
                toolbox: {
                    show: false,
                    feature: {
                        mark: {
                            show: true
                        },
                        dataView: {
                            show: true,
                            readOnly: false
                        },
                        magicType: {
                            show: true,
                            type: ['line', 'bar']
                        },
                        restore: {
                            show: true
                        },
                        saveAsImage: {
                            show: true
                        }
                    }
                },
                calculable: false,
                xAxis: [{
                    type: 'category',
                    data: dataX,
                    name: '分数',
                    axisLabel: {
                        textStyle: {
                            fontSize: 25,
                            color: theme == 1 ? "#000" : '#fff'
                        }
                    },
                    nameTextStyle: {
                        color: theme == 1 ? "#000" : '#fff'
                    },
                    axisLine: {
                        lineStyle: {
                            color: theme == 1 ? "#000" : "#fff"
                        }
                    }
                }],
                yAxis: [{
                    type: 'value',
                    name: '人数',
                    axisLabel: {
                        textStyle: {
                            fontSize: 25,
                            color: theme == 1 ? "#000" : '#fff'
                        }
                    },
                    nameTextStyle: {
                        color: theme == 1 ? "#000" : '#fff'
                    },
                    axisLine: {
                        lineStyle: {
                            color: theme == 1 ? "#000" : "#fff"
                        }
                    }
                }],
                series: [{
                    name: '人数分布',
                    type: 'bar',
                    data: dataY
                }]
            };

            var chart = echarts.init(chartHtml[0]);
            chart.setOption(setting);
        }
    },
    analysisQuestion: function (data) {
       
        var _this = this,
			fragment = _this.fragment,
			//options = data.option.split(","),
			//selects = JSON.parse(data.select),
			reg = new RegExp('<(p|span)[^>]*>(&nbsp;((\\s)*))*(<br/>|<br>((\\s)*))*(</span>|</p>)', "g");

        data.title = data.title.replace(reg, "");

        //if(selects == true) {
        //    selects = [];
        //    selects.push({
        //        content: "正确",
        //        isAnswer: true,
        //        count: 0
        //    });
        //    selects.push({
        //        content: "错误",
        //        isAnswer: false,
        //        count: 0
        //    });
        //} else if(selects == false) {
        //    selects = [];
        //    selects.push({
        //        content: "正确",
        //        isAnswer: false,
        //        count: 0
        //    });
        //    selects.push({
        //        content: "错误",
        //        isAnswer: true,
        //        count: 0
        //    });
        //} else {
        //    for(var i = 0; i < selects.length; i++) {
        //        selects[i].content = selects[i].content.replace(reg, "");
        //        selects[i].count = 0;
        //    }
        //}

        //var count = 0;

        //$.each(data.list, function(index, item) {
        //    count += item.count;

        //    if(item === 27) {
        //        return true;
        //    }

        //    var temp = item.option.split(',');

        //    $.each(temp, function(i, v) {
        //        var select = selects[Number(v) - 1];
        //        select.count += item.count;
        //    });
        //});

        data.selects = data.dataJson;
        data.totalCount = data.openClassStuCount;
        data.color = ['#04ae84', '#818cf5', '#4fbaf1', '#fb7456', '#04ae84', '#818cf5', '#4fbaf1', '#fb7456', '#04ae84', '#818cf5', '#4fbaf1', '#fb7456', '#04ae84', '#818cf5', '#4fbaf1', '#fb7456', '#04ae84', '#818cf5', '#4fbaf1', '#fb7456'];

        var submitCount = data.totalCount - data.unSubmitStuCount;

        $.each(data.selects, function (i, v) {
            var percent = Math.round(v.StuChoiceCount / data.totalCount * 100);
            v.percent = percent;
            v.left = percent + 1;
            v.right = 100 - v.left;
        });

        data.A_Z = _this.A_Z;

        var html = $(template("activity-exam-analysis-question", data));

        _this.content.find("#exam-analysis").hide();
        _this.content.find("#question-one-analysis").html(html);

        var imgs = html.find("img"),
			imgCount = imgs.length,
			imgLoadedCount = 0;

        //如果存在图片，则图片加载完成后才设置题目显示样式
        if(imgCount > 0) {
            imgs.css("max-width", "100%");
            imgs.load(function() {
                imgLoadedCount++;
                if(imgCount == imgLoadedCount) {
                    _this.setHtmlHeight(html);
                }
            })
        } else {
            _this.setHtmlHeight(html);
        }
    },
    //设置题目的显示
    setHtmlHeight: function(html) {
        html.css({
            width: "50%",
            transform: "scale(2)"
        });
        //如果题目太高，则循环滚动
        var maxHeight = window.screen.height * 0.98,
            height = html.height() * 2,
            top = height / 4,
            bottom = maxHeight + top - height;

        if(height > maxHeight) {
            html.css("margin-top", top);

            this.top = top;
            this.bottom = bottom;
        } else {
            this.top = this.bottom = bottom;
            html.css("margin-top", bottom);
        }

    },
    questionAnalysisBack: function() {
        if(this.content) {
            this.content.find("#question-one-analysis").html("");
            this.content.find("#exam-analysis").show();

            if(this.isReloadChart) {
                this.isReloadChart = false;
                this.reloadChart();
            }
        }
    },
    pageUp: function() {
        if(this.top == this.bottom) return;
        var html = $("#exam-analysis-question");
        var top = parseInt(html.css("margin-top"));

        if(top == this.top) return;

        top += window.screen.height / 2;

        if(top > this.top) {
            top = this.top;
        }

        html.animate({
            marginTop: top
        }, 300, 'linear')
    },
    pageDown: function() {
        if(this.top == this.bottom) return;
        var html = $("#exam-analysis-question");
        var top = parseInt(html.css("margin-top"));

        if(top == this.bottom) return;

        top -= window.screen.height / 2;

        if(top < this.bottom) {
            top = this.bottom;
        }

        html.animate({
            marginTop: top
        }, 300, 'linear')
    }
}