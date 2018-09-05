var Shake = {
    classType: "Shake",
    content: null,
    fragment: null,
    students: [],
    studentIds: [],
    init: function(content) {
        this.initHtml(content, "提问");
        return this;
    },
    initHtml: function(content, name) {
        this.students = [];
        this.studentIds = [];

        var html = $(template("activity-shake", {
            name: name
        }));
        this.fragment = html;

        content.html(html);
    },
    initRespond: function(content, action) {
        var _this = this;
        this.initHtml(content, "抢答中");
        if (!action.send2student) {
            $.post(config.moocApp + "/FaceTeach/getStuAskedList", {
                askId: action.askId
            }, function(data) {
                if (data && data.code && data.code == 1) {
                    _this.initRespondStudents(data.dataList);
                }
            }, 'json');
        }
        return _this;
    },
    initStudents: function(list) {
        var _this = this;
        $.each(list, function(i, v) {
            var stu = {
                userId: v.userId,
                userName: v.displayName,
                userAvator: v.avatorUrl,
                score: v.performanceScore
            }
            if (_this.studentIds.indexOf(stu.userId) < 0) {
                _this.students.push(stu);
                _this.studentIds.push(stu.userId)
                console.log(_this.students.length + "1111111111111111111111111" + stu.userId);
            }

        });
        if (_this.students.length > 0) {

            _this.showStudents({
                userInfo: _this.students
            });
        }
    },
    initRespondStudents: function(list) {
        var _this = this;
        $.each(list, function(i, v) {
            var stu = {
                userId: v.Id,
                userName: v.Name,
                userAvator: v.Avator,
                score: v.PerformanceScore
            }
            if (_this.studentIds.indexOf(stu.userId) < 0) {
                console.log(_this.students.length + "2222222222222222222" + stu.userId);
                _this.students.push(stu);
                _this.studentIds.push(stu.userId)
            }
        });
        if (_this.students.length > 0) {
            _this.showStudents({
                userInfo: _this.students
            });
        }
    },
    showStudents: function(action) {
        var html = $(template("activity-shake-students", action));
        var count = action.userInfo.length;

        var wrap = this.fragment.find(".shaking");

        wrap.html(html);
    },
    addStudent: function(action) {
        var _this = this;
        if (_this.students.length >= 10) {
            return;
        }

        var info = {
            userId: action.userId,
            userName: action.userName,
            userAvator: action.userAvatar,
            score: 0
        };
        if (_this.studentIds.indexOf(info.userId) < 0) {
            console.log(_this.students.length + "2222222222222222222" + info.userId);
            _this.students.push(info);
            _this.studentIds.push(info.userId)
        }


        var html = $(template("activity-shake-student", info));
        this.fragment.find(".shaking").append(html);
    },
    //给学生评分
    markScoreForStudent: function(action) {
        var score = $(".score_" + action.id);
        if (score.length > 0) {
            score.html(action.score).addClass("has_score");
        }
    }
}