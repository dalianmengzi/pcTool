var Quiz = {
	classType: "Quiz",
	content: null,
	actId: '',
	studentFinished: 0,
	studentIds: [],
	urls: [],
	A_Z: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
	init: function(content, action) {
		var _this = this;

		_this.content = content;
		_this.studentFinished = action.studentNumber;
		_this.studentCount = action.studycount;

		if(_this.actId != action.actId) {
			_this.studentIds = [];
		}
		_this.actId = action.actId;

		var fragment = $(template("activitying-tmpl", {
			title: '答题中'
		}));

		_this.fragment = fragment;

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
	quized: function(action) {

		var _this = this,
			fragment = _this.fragment;

		if(action.actId != _this.actId) {
			return;
		}

		var student = $('<div class="activity-student"></div>');

		if(_this.studentIds.indexOf(action.sendId) < 0) {
			_this.studentIds.push(action.sendId);
			_this.studentFinished++;
		} else {
			return;
		}

		Activitying.setNumber(_this.studentFinished, _this.content, action.name)
	},
	quizAnalysis: function(action, content) {

		var _this = this;
		_this.content = content;
		if(action.data) {
			_this.analysisChart(action.data);
		} else {
			$.post(config.moocApp + "/putquestion/putQuestionScore", {
				actId: action.actId,
				questionId: action.questionId,
				token: socketIO.token
			}, function(data) {
				if(data.code == 1) {
					_this.analysisChart(data);
				}
			}, 'json')
		}

	},
	questionData: null,
	analysisChart: function(data) {
		var _this = this;
		_this.questionData = data;
		_this.chartData = data;
		_this.chartFunction = _this.analysisChart;

		var usetime = data.avgTime;

		if(usetime > 60) {
			data.min = Math.floor(usetime / 60) + "<i>Min</i>";
		}

		data.sec = usetime % 60 + "<i>Sec</i>";

		var fragment = template("activity-quiz-analysis", data);

		_this.content.html(fragment);

		if(data && data.arr) {
			var list = data.arr,
				item,
				studyCount = 0,
				length = 6,
				dataX = ['未答题', '0-20', '20-40', '40-60', '60-80', '80-100'],
				dataY = [0, 0, 0, 0, 0, 0];

			for(var i = 0; i < list.length; i++) {
				item = list[i];

				var percent = 0;

				if(item.count) {

					percent = Number(item.scoreRank);

					if(dataX[percent]) {
						dataY[percent] = item.count + dataY[percent];

						studyCount += item.count;
					} else {

						var j = percent;

						while(!dataX[j]) {
							dataX[j] = 20 * (j - 1) + "-" + 20 * j;
							dataY[j] = 0;
							j--;
						}
						i--;
					}
				}
			}

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
					name: "分数",
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
					name: "人数",
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

			var chart = echarts.init($(".analysis-image")[0]);
			chart.setOption(setting);
		}
	},
	questionAnalysis: function(action) {
		var _this = this;

		if($(".quiz-page").length == 0) return;

		$.post(config.moocApp + "/putquestion/putQuestionOption", {
			actId: action.actId,
			questionId: action.questionId,
			num: action.num,
			token: socketIO.token
		}, function(data) {
			if(data.code == 1) {
				_this.oneQuestionAnalysisChart(data);
			}
		}, 'json')
	},
	oneQuestionAnalysisChart: function(data) {
		if($(".quiz-page").length == 0) return;

		this.chartData = data;
		this.chartFunction = this.oneQuestionAnalysisChart;

		var _this = this,
			arr = [],
			lett = [],
			correctAnswer = "",
			answers = data.correctAnswer.split(",");

		$(".quiz-page").hide();
		$("#question-one-analysis").show();

		if(data.type == 0) {
			for(var i = 0; i < 4; i++) {
				arr[i] = {
					name: _this.A_Z[i],
					value: 0
				}
				lett[i] = _this.A_Z[i];
			}
		} else if(data.type == 1) {

			arr.push({
				name: '对',
				value: 0
			})
			arr.push({
				name: '错',
				value: 0
			})

			lett.push('对');
			lett.push('错');
		}

		$.each(data.arr, function(i, v) {
			var options = v.option.split(",");
			$.each(options, function(j, item) {
				arr[item - 1].value += v.count;
			});
		});

		$.each(answers, function(i, v) {
			var n = Number(v);
			correctAnswer += arr[n - 1].name + ",";
		});

		correctAnswer = correctAnswer.substr(0, correctAnswer.length - 1);
		$("#question-one-analysis .correct-answer").html(correctAnswer);

		var option = {
			tooltip: {
				trigger: 'item',
				formatter: "{b}:{c}人 {d}%"
			},
			legend: {
				orient: 'vertical',
				x: 'left',
				data: lett,
				itemWidth: 100,
				itemHeight: 40,
				textStyle: {
					fontSize: 50,
					color: theme == 1 ? "#000" : "#fff"
				}
			},
			series: [{
				name: '访问来源',
				type: 'pie',
				radius: '70%',
				center: ['50%', '50%'],
				data: arr,
				itemStyle: {
					normal: {
						label: {
							textStyle: {
								fontSize: 40
							}
						}
					}
				}
			}]
		};
		$('.question-analysis-image').css({
			height: window.screen.height * 0.7,
			width: window.screen.width * 0.8
		})
		var chart = echarts.init($('.question-analysis-image')[0]);
		chart.setOption(option);
	},
	studentAnswer: function(action, content) {
		var _this = this;
		_this.content = content;
		_this.studentAnswerPage(action.data);
		return this;
	},
	studentAnswerPage: function(data) {
		var _this = this;
		//不是主观题
		if(data.type != 2) {
			$.each(data.arr, function(i, v) {
				v.options = [];
				v.num = Number(v.num) + 1;
				var selects = v.option.split(",");
				if(data.type == 0) {
					for(var i = 0; i < 4; i++) {
						v.options[i] = '<i>' + _this.A_Z[i] + '</i>';

						if(selects.indexOf(i + 1 + "") >= 0) {
							v.options[i] = '<i class="' + (v.isRight ? 'current' : 'currenterror') + '">' + _this.A_Z[i] + '</i>';
						}
					}
				} else if(data.type == 1) {
					if(v.option == "1") {
						v.options[0] = '<i class="current">A</i>对';
						v.options[1] = '<i>B</i>错';
					} else {
						v.options[0] = '<i>A</i>对';
						v.options[1] = '<i class="current">B</i>错';
					}
				}
			});
		}

		var html = $(template("quiz-student-answer", data));

		_this.content.html(html);

		var questionImg = html.find(".body-pic img");
		questionImg.load(function() {
			if(questionImg.width() / questionImg.height() > window.screen.width / window.screen.height * 2) {
				questionImg.css("width", window.screen.width * 0.9);
			} else {
				questionImg.css("height", window.screen.height * 0.9);
			}

		})

		if(data.type == 2) {
			_this.urls = data.arr;
			var imgHight = window.screen.height * 0.85,
				$liImage = html.find(".answer-image-li img"),
				imgCount = $liImage.length,
				loadedImg = 0;

			$liImage.css("height", imgHight);
			$(".answer-image-ul", html).css("height", imgHight);

			$liImage.load(function() {
				loadedImg++;
				if(loadedImg == imgCount) {
					_this.setImageScroll(html);
				}
			})
		}
	},
	setImageScroll: function(html) {
		var sumWidth = 0;

		$(".answer-image-li img", html).each(function() {
			sumWidth += $(this).width() + 1;
		});

		var $ul = $(".answer-image-ul", html),
			ulWidth = $(".body-cont", html).width();
		$ul.css({
			width: sumWidth
		});

		if(sumWidth > ulWidth) {
			//移动距离
			var distance = sumWidth - ulWidth;
			var time = 3000;

			if(distance > 300) {
				time = distance * 10;
			}

			//向左移
			var toLeft = function() {
				$ul.animate({
					marginLeft: distance * -1 - 5
				}, time, "linear", function() {
					toRight();
				});
			};
			//向右移
			var toRight = function() {
				$ul.animate({
					marginLeft: 5
				}, time, "linear", function() {
					toLeft();
				});
			}
			toLeft();
		}
	},
	back: function() {
		$(".quiz-page:visible").hide().prev().show();

		this.analysisChart(this.questionData);
	}
}