/**
 * 投票相关类
 */
var Vote = {
    classType: "Vote",
    fragment: null,
    content: null,

    init: function (content, action) {
        if (!action.studentNumber) {
            action.studentNumber = 0;
        }

        if (!action.studycount) {
            action.studycount = 0;
        }

        var fragment = $(template("activitying-tmpl", {
            title: '投票'
        }));

        this.fragment = fragment;
        this.content = content;

        this.studentFinished = action.studentNumber;
        this.studentCount = action.studycount;

        if (this.actId != action.examId) {
            this.studentIds = [];
        }

        this.actId = action.examId;

        content.html(fragment);
        this.initIng(fragment.find(".activitying-chart")[0]);
    },
    initIng: function (chart) {
        this.chartData = chart;
        this.chartFunction = this.initIng;
        Activitying.init(chart, this.studentCount, this.studentFinished);
    },
    //重新加载图表
    chartData: null,
    chartFunction: null,
    reloadChart: function () {
        if (this.chartData && this.chartFunction) {
            this.chartFunction(this.chartData);
        }
    },

    /**
	 * 显示测试结果
	 */
    showResult: function (action, url, operate) {
        var _this = this;

        _this.content = socketIO.content;

        // if(action.data) {
        //_this[operate](action.data);
        //} else {
        $.get(config.moocApp + url, {
            activityId: action.data.activityId,
            schoolId: action.data.schoolId,
            courseOpenId: action.data.courseOpenId,
            voteId: action.data.voteId,
            openClassIds: action.data.openClassIds
        }, function (r) {
            if (!r) {
                tips("发生未知错误");
                return false;
            }
            if (r.code < 0) {
                return false;
            }

            r.action = action;
            r.token = socketIO.token;

            _this[operate](r.voteInfo, r.voteOptionStatic);
        }, 'json');
        //}
    },

    /**
	 * 分析结果页
	 * @param {Object} data
	 */
    analysisPage: function (data, data1) {
        var _this = this;

        _this.chartData = data;
        _this.chartFunction = _this.analysisPage;



        var DocJson = data.DocJson;
        var DataJson = data1;



        var chartHtml_2 = $(".test-result-wrap .vote_pie");
        if (!chartHtml_2.length) {
            var fragment = $(template("activity-vote-analysis", data));

            _this.fragment = fragment;

            _this.content.html(fragment);
            chartHtml_2 = $(".test-result-wrap .vote_pie");
        }
        var chartHtml_1 = $(".test-result-wrap .vote_pic");

        if (DocJson.length == 0) {
            chartHtml_1.css("display", "none");
           
        } 
        if (DocJson.length > 0) {
            var pic_html = "";
			var W = 160,H= 90;
            jQuery.each(DocJson, function (i, val) {
                pic_html += '<img src="' + val.docPreview + '" style=" box-shadow: 0px 0px 5px #888;border: 1px dashed green;width:'+W+'px;height:'+H+'px;margin-left:5px;padding-top:0px;"/>';
            });
            chartHtml_1.html(pic_html);
        }

        var voteOption = [];
        var stuCount = 0;
       
        jQuery.each(DataJson, function (i, val) {
           // if (val.StuCount > 0) {
                voteOption.push({
                    value: val.StuCount,
                    name: val.VoteContent,

                });
                stuCount += val.StuCount;
           // }
        });

       // if (stuCount > 0) {
            var option1 = {
                backgroundColor: 'clear',

                title: {
                    text: '投票结果分布',
                    right: 0,
                    top: '80%',
                    textStyle: {
                        color: '#888'
                    }
                },
				color:["#388cfd","#f42f35","#cf3c5c","#78ba52","#fb8124","#fec62e"],
                tooltip: {
                    trigger: 'item',
                    formatter: "{a} <br/>{b} : {d}%"
                },
                series: [
                   {
                       name: '投票结果分布',
                       type: 'pie',
                       clockwise: 'true',
                       startAngle: '0',
                       radius: '60%',
                       center: ['50%', '50%'],
                       data: voteOption,
                       itemStyle: {
                           emphasis: {
                               shadowBlur: 10,
                               shadowOffsetX: 0,
                               shadowColor: 'rgba(0, 0, 0, 0.5)'
                           }
                       }
                   }
                ],
                
            };
            var chart = echarts.init(chartHtml_2[0]);
            chart.setOption(option1);
       // }


    }
}