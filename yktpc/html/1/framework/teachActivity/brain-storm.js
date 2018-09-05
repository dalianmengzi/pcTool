/**
 * 头脑风暴类 
 */

var BrainStorm = {
	classType: "BrainStorm",
	content: null,
	colors: ["#3CB2EF", "#31D8B5", "#818CF5", "#EC87BF"],
	studentFinished: 0,
	studentCount:0,
	studentIds: [],
	actId: "",
	count: 0,
	init: function(content, action) {
		if (!action.studentNumber) {
			action.studentNumber = 0;
		}
		if (!action.studycount) {
			action.studycount = 0;
		}

		this.studentFinished = action.studentNumber;
		this.studentCount = action.studycount;

		var fragment = $(template("activitying-tmpl", {
			title: '头脑风暴中'
		}));

		this.fragment = fragment;
		this.content = content;

		if (this.actId != action.stormId) {
			this.studentIds = [];
		}

		this.actId = action.stormId;

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
	addStudent: function(action) {
		if (action.id != this.actId) {
			return;
		}

		var _this = this,
			fragment = _this.fragment,
			student = $('<div class="activity-student"></div>');

		if (action.isFirst) {
			if (_this.studentIds.indexOf(action.userId) < 0 && _this.studentFinished < _this.studentCount) {
				_this.studentIds.push(action.userId);
				
				_this.studentFinished  = _this.studentIds.length
				
			} else {
				return;
			}
			fragment.find("#activity-ended").html(this.studentFinished);
		} else {
			return;
		}

		Activitying.setNumber(_this.studentFinished, _this.content, action.name)
	},
	//给学生评分
	markScoreForStudent: function(action) {
		var score = $(".score_" + action.id);
		if (score.length > 0) {
			score.html(action.score);
		}
	},
	showResult: function(content, action) {
		content.css("background", "");
		var wrap = content.find(".activity-brain-storm-result");

		if (wrap.length == 0) {
			wrap = $("<div class = 'activity-brain-storm-result' style='padding-top: 1%;'></div>");

			content.html(wrap);
		}

		var html = $(template("activity-one-brain", action));

		wrap.html(html);
		var height = window.screen.height - 200;
		wrap.find(".storm-content").css("height", height);
		//计算字体大小
		var fontSize = 0,
			spacing = 0,
			width = wrap.find(".storm-content").width();

		fontSize = Math.floor(Math.sqrt(((width * height) / action.content.length)));

		if (fontSize > 66) {
			fontSize = 66;
		}

		spacing = Math.floor(fontSize / 10)

		wrap.find(".storm-content").css({
			fontSize: fontSize - spacing,
			lineHeight: fontSize + "px",
			textIndent: fontSize + "px",
			letterSpacing: spacing + "px"
		})

		socketIO.operateDoc = BrainStorm;
	}
}