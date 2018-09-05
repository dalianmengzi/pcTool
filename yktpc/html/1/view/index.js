/**
 * 教师授课页面
 * sibaoniu
 * 2015-09-22 18:38:07
 */

var cefHandler = {
    obj: null,
    call: function (type, data) {
        switch (type) {
            case "onUpdateIpList":
                this.obj.onUpdateIpList(data);
                break;
            case "onUpdateClassInfo":
                this.obj.onUpdateClassInfo(data);
                break;
            case "onUpdateQRCode":
                this.obj.onUpdateQRCode(data);
                break;
            default:
                break;
        }
    }
};

$(function () {
    var socketUrl = config.socketUrl,
		apiUrl = config.moocApp,
		users = [],
		courseIds = [],
		ips = [],
		loginUser = {},
		selectedIp;

    //socketIp和是否有网络连接
    window.localIps = getQuery("ip");
    window.network = true;

    if (getQuery("network")) {
        window.network = !!Number(getQuery("network")[0]);
    }

    window.theme = Number(getQuery("theme"));

    switchTheme(theme);

    ips = localIps[0].split(',');
    selectedIp = ips[0];

    //for (var i in localIps) {
    //    ips.push({
    //        ip: localIps[i],
    //        selected: false
    //    })
    //}
    //if (ips.length) {
    //    selectedIp = localIps[0];
    //    ips[0].selected = true;
    //}

    window.user = null;

    document.body.onmousewheel = function (event) {
        return false;
    };

    window.socketIO = {
        operateDoc: null,
        socket: {},
        socketSelf: {},
        socketId: null,
        content: null,
        token: "",
        docStack: [],
        socketIp: "",
        localServer: "",
        ipDlg: null,
        fromNet: false,
		versionCode: "1.0",
		showDiscuss: true,
		showSigned: true,
        init: function () {
            var _this = this,
				socket, socketSelf = {};
            socket = io(socketUrl);

            _this.socket = socket;

            _this.content = $("#main-box");

            _this.selectLogin();

            _this.eventInit();
			
			_this.getVersion();

            //有本地ip时使用
            if (window.localIps) {
                _this.localServer = "http://" + selectedIp + ":" + config.localServerPort;
                _this.socketIp = "http://" + selectedIp + ":" + config.localSocketPort;
                socketSelf = io("http://127.0.0.1:" + config.localSocketPort);
                _this.socketSelf = socketSelf;
                _this.initSocket(socketSelf);

                socketSelf.on("connect_error", function (data) {
                    cef.message.sendMessage("win32.startSocket", ['', '']);
                });
            }

            _this.initSocket(socket);
        },
		getVersion: function () {
			var _this = this;
			
			$.get(apiUrl + "/AppVersion/getToolAppVersion", {
				
			}, function(r) {
				if (r.code == 1) {
					if (r.data.appVersionInfo.versionCode == _this.versionCode) {
						
					} else {
						 
						alert("检测到有新版本，为了不影响您的正常使用，请到官网下载最新版http://zjy2.icve.com.cn/");
						
						
					}
				}
			}, 'json')
		},
        eventInit: function (socket, socketSelf) {
            var _this = this;

            //窗口事件
            $("body").on("click", ".plus", function () {
                cef.message.sendMessage("win32.close", ['', '']);
            });

            $("body").on("click", ".minus", function () {
                cef.message.sendMessage("win32.min", ['', '']);
            });

            $("body").on("click", ".switch-theme", function () {
                if (theme == 1) {
                    switchTheme(2);
                    $(this).removeClass("theme-switch-white");
                } else {
                    switchTheme(1);
                    $(this).addClass("theme-switch-white");
                }

                if (_this.operateDoc && _this.operateDoc.reloadChart) {
                    _this.operateDoc.reloadChart();
                }
            });

            $(document).on("click", ".touping", function () {

                if ($("input[type='radio']:checked").val() == "0") {

                    $(".jdtp").css("display", "block");
                    $('.aztp').css("display", "none");
                    $('.pgtp').css("display", "none");
                }

                if ($("input[type='radio']:checked").val() == "1") {

                    $(".jdtp").css("display", "none");
                    $('.aztp').css("display", "block");
                    $('.pgtp').css("display", "none");

                }
                if ($("input[type='radio']:checked").val() == "2") {

                    $(".jdtp").css("display", "none");
                    $('.aztp').css("display", "none");
                    $('.pgtp').css("display", "block");
                    $('#selectIp').text("IP:" + getQuery("ip"));
                }
            });


            //$("body").on("click", ".has-ips", function (e) {
            //    e.stopPropagation();
            //    $('.ips-list').slideToggle();
            //});

            //$(document).on('click', function () {
            //    $('.ips-list').slideUp();
            //});

            $("body").on("click", ".ips-list > p", function () {
                var $this = $(this);

                $(".ips-list > p").removeClass("active");
                $this.addClass("active");

                selectedIp = $this.html();
                $(".ip-wrap>.has-ips").html(selectedIp);

                _this.localServer = "http://" + selectedIp + ":" + config.localServerPort;
                _this.socketIp = "http://" + selectedIp + ":" + config.localSocketPort;
                if ($("#qrcode-img").length > 0) {
                    _this.createCode($("#qrcode-img"));
                }
            });

            //点击返回
            $("body").on("click", ".conf-login .back", function () {
                _this.codeLogin();
            });
        },
        initSocket: function (socket) {
            var _this = this;

            //连接事件
            socket.on("connected", function (data) {
                console.log("socketId:" + data);
                if ($("#qrcode-img").length > 0) {
                    _this.createCode($("#qrcode-img"));
                }

            });

            socket.on("connect", function () {
                socket.emit("pcTempLogin", "");
                if (user) {
                    _this.sendSocket("login", JSON.stringify(user));
                }
            });

            //消息事件
            socket.on("message", function (data) {
                _this.socketMessage(data);
            });

            //接收命令监听
            socket.on("order", function (data) {
                _this.socketOrder(data);
                cef.message.sendMessage("win32.show", ['', '']);
            });

            socket.on("webOrder", function (data) {
                cef.message.sendMessage("win32." + data, ['', '']);
            })

            //重连
            socket.on("reconnecting", function (number) {
                console.log("reconnect:" + number);
                if (number > 20) {
                    this.close();
                }
            })

        },
        //message命令处理
        socketMessage: function (data) {
            var _this = this;
            console.log(data);

            data = JSON.parse(data);

            if (data.code && data.userType == "teacher" && _this.fromNet) {
                tips(data.msg);

                setTimeout(function () {
                    _this.codeLogin.apply(_this);
                }, 2000);

            } else {
                switch (data.type) {
                    case 'connected':
                        break;
                    case 'login':
                        break;
                    case 'disconnected':
					 _this.codeLogin();
                        break;
                    case 'exited':
                        break;
                }
            }
        },
        //order命令处理
        socketOrder: function (dataStr) {
            var _this = this;
            $(".full-screen").removeClass(".opacity");
            if (dataStr) {
                var data = JSON.parse(dataStr);
                var action = data.action;
                fromNet = !data.socketType;
                if (action) {
                    if (action.fromRes && !action.isRes) {
                        _this.docStack.push(_this.operateDoc);
                        _this.content.hide();

                        //将当前环境推入栈
                        _this.content = $('<div class="main-box"></div>');

                        $(".zjy-wrapper").append(_this.content);

                    }
                    //															console.log(JSON.stringify(action));

                    _this.clearHtml(action);

                    _this.orderSwitch(data);
                }
            }
        },
        //清理html
        clearHtml: function (action) {
            switch (action.actionType) {
                case "discussAdd":
                case "discussClose":
                    break;
                default:
                    $("#discuss").remove()
                    break;
            }
        },
        //指令选择
        orderSwitch: function (data) {
            var _this = this,
				action = data.action;

            action.sendId = data.sendId;
            switch (action.actionType) {
                case 'joinClass':
                    _this.joinClass(action.code);
                    break;
                    //签到相关
                case 'signing':
					showSigned = true;
                    Sign.init(_this.content, action);
					Sign.studentIds = [];
                    _this.operateDoc = Sign;
                    break;
                case 'signed':
					if (showSigned) {
						Sign.signed(action);
					}
                    break;
                case 'signCancel':
                    _this.connectedPage();
                    break;
                case 'signResultReload':
                case 'signResult':
                    //_this.connectedPage();
                    Sign.signedResult(_this.content, action);
                    _this.operateDoc = Sign;
                    break;
                case 'signAnalysis':
                    Sign.signedAnalysis(_this.content,action);
                    _this.operateDoc = Sign;
                    break;
                    //测验相关
                case 'examing':
					Exam.studentIds = [];
                    Exam.init(_this.content, action);
                    _this.operateDoc = Exam;
					
                    break;
                case 'examed':
                    Exam.addStudent(action);
                    break;
                case 'examCancel':
                    _this.connectedPage();
                    break;
                case 'examEnd':
                    _this.connectedPage();
                    break;
                case 'examAnalysis':
                    Exam.showResult(action, "/FaceTeach/classTestStatis", "analysisPage");
                    _this.operateDoc = Exam;
                    break;
                case "questionAnalysis":
                    Exam.showResult(action, "", "analysisQuestion");
                    break;
                case "questionAnalysisBack":
                    Exam.questionAnalysisBack();
                    break;
                case "vote":
                    Vote.showResult(action, "/FaceTeach/GetFaceTeachVoteResult", "analysisPage");
                    _this.operateDoc = Vote;

                    break;
                    //讨论相关
                case "discussing":
					_this.operateDoc = Discuss.init(_this.content, _this.token, action);
                    break;
                case "discussDetail":
                    if (Discuss.content) {   
						_this.showDiscuss = false;
                        Discuss.showReplyDetail(action);
                    }
                    break;
                case "discussAdd":
                    if (Discuss.content && _this.showDiscuss) {
                        Discuss.addReply(action);
                    }
                    break;
                case "discussClose":
                    if (Discuss.content) {
						_this.showDiscuss = true;
                        Discuss.closeReplay();
                    }
                    break;
                case 'open':
                    _this.openDoc(action);
                  
                    break;
                case 'control':
                    _this.docOrder(action);
                    break;
                case 'login':
                    _this.loginPage(data.sendId);
                    break;
                case 'confirmLogin':
                    _this.confirmLogin(data);
                    break;
                case 'exit':
                    _this.exited();
                    break;
                case 'close':
					showSigned = false;
                    _this.close();
                    break;
                case "cancelLogin":
                    _this.codeLogin();
                    break;
                case 'imageOperate':
                    _this.imageOperate(action);
                    break;
                case "openBoard":
                    $(".full-screen").addClass("opacity");
                    _this.operateDoc = Board.open(_this.content, action);
                    break;
                case "openInfo":
                    _this.docRecover(action);
                    break;
                case "shake":
                    _this.operateDoc = Shake.init(_this.content, action);
                    break;
                case "shakeStudents":
                    Shake.showStudents(action);
                    break;
                case "brainStorming":
					BrainStorm.studentIds = [];
                    BrainStorm.init(_this.content, action);
                    _this.operateDoc = BrainStorm;
                    break;
                case "brainStormEnd":
					_this.operateDoc = BrainStormEnd.init(_this.content, _this.token, action);
                    break;
                case "brainstorming_praise":
                    //BrainStorm.addLike(action);
                    break;
                case "brainstorming_student":
                    BrainStorm.addStudent(action);
                    break;
                case "brainstormInfo":
                    BrainStorm.showResult(_this.content, action);
                    break;
                case "noInternetLogin":
                    _this.noInternetLogin(action);
                    break;
                case "question_ing":
                    Quiz.init(_this.content, action);
                    _this.operateDoc = Quiz;
                    break;
                case "questionSubmit":
                    Quiz.quized(action);
                    break;
                case "quizAnalysis":
                    Quiz.quizAnalysis(action, _this.content);
                    _this.operateDoc = Quiz;
                    break;
                case "quizQuestionAnalysis":
                    Quiz.questionAnalysis(action);
                    break;
                case "oneQuestionAnalysisChart":
                    Quiz.oneQuestionAnalysisChart(action.data);
                    break;
                case "quizStudentAnswer":
                    Quiz.studentAnswer(action, _this.content);
                    break;
                case "quizBack":
                    Quiz.back();
                    break;
                case "markScoreForStudent":
                    _this.markScoreForStudent(action);
                    break;
                case "videoRemoteStart":
                    RemoteVideo.init(_this.content, action.sendId);
                    break;
                case "videoRemoteInfo":
                    action.info.from = data.sendId;
                    RemoteVideo.handleMessage(action.info)
                    break;
                case "videoConnectBegin":
                    ConnectVideo.init(_this.content, action.sendId, action.userId);
                    break;
                case "videoConnectInfo":
                    action.info.from = data.sendId;
                    ConnectVideo.handleMessage(action.info, action.isReceive)
                    break;
                case "respondSubmit":
                    Shake.addStudent(action);
                    break;
                case "responding":
                    _this.operateDoc = Shake.initRespond(_this.content, action);
                    break;
                case "videoRemoteClose":
                    RemoteVideo.close();
                    break;
                case "face2face":
                    _this.showUrlQrcode(action.url);
                    break;
                case "pkinfo":
                    pk.showInfo(_this.content,action);
                    break;
                case "getpkscore":
                    pk.showScore(action);
                    break;
                case "getpkstu":
                    pk.showStu(_this.content,action);
                    break;


            }
        },
        close: function () {
            var _this = this;

            if (_this.docStack.length > 0) {
                _this.operateDoc = _this.docStack.pop();
                //隐藏界面
                $(".main-box").hide();
                $(".main-box:last").remove();

                _this.content = $(".main-box:last");

            } else {
                _this.operateDoc = null;
                window.operateDoc = null;
                _this.connectedPage();
            }
            _this.content.show();
        },
        showUrlQrcode: function (url) {
            //var html = $('<div class="invite-url-code"></div><img class="invite-yun-logo" src="../img/code-yun.jpg" />')
            var html = $('<div class="invite-url-code"></div>')
            var height = window.screen.height * 0.5,
				logoHeight = window.screen.height * 0.5 / 7;

            this.content.html(html);

            //$(".invite-yun-logo").css({
            //    width: logoHeight,
            //    top: (window.screen.height - logoHeight) / 2,
            //    left: (window.screen.width - logoHeight) / 2
            //});
            $(".invite-url-code").css({
                width: height,
                left: (window.screen.width - height) / 2
            }).qrcode({
                width: height,
                height: height,
                text: this.utf16to8(url)
            });
        },
        utf16to8: function (str) {
            var out, i, len, c;
            out = "";
            len = str.length;
            for (i = 0; i < len; i++) {
                c = str.charCodeAt(i);
                if ((c >= 0x0001) && (c <= 0x007F)) {
                    out += str.charAt(i);
                } else if (c > 0x07FF) {
                    out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
                    out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
                    out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
                } else {
                    out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
                    out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
                }
            }
            return out;
        },
        //给学生评分
        markScoreForStudent: function (action) {
            if (this.operateDoc && this.operateDoc.markScoreForStudent) {
                this.operateDoc.markScoreForStudent(action);
            }
            var html = $(template("mark-score-tips", action));
            html.hide();
            $(".zjy-wrapper").append(html);

            html.fadeIn(500, function () {
                html.fadeOut(3000, function () {
                    html.remove();
                })
            })

        },
        //退出登录
        exited: function () {
            this.token = "";
            user = null;

            this.sendSocket("exit", "");

            this.codeLogin();
        },
        //保存用户
        saveUser: function () {
            var userIds = [];
            var usersTemp = [];

            $.each(users, function (i, v) {
                if (userIds.indexOf(v.userId) > 0 || v.userId == user.userId) {
                    return true;
                }
                userIds.push(v.userId);
                usersTemp.push(v);
            });

            usersTemp.push(user);

            while (usersTemp.length > 3) {
                usersTemp.shift();
            }

            users = usersTemp;

            localStorage.users = JSON.stringify(users);
        },
        //选择登录
        selectLogin: function () {
            var _this = this,
				userStr = localStorage.users;

            if (!window.network) {
                _this.codeLogin();
                return;
            }

            //用户信息不存在，转到扫描登录
            if (userStr) {
                users = JSON.parse(userStr);

                if (users) {
                    var html = $(template("selectUser", {
                        ips: ips,
                        selectedIp: selectedIp,
                        theme: theme
                    })),
						userHtml;

                    for (var i in users) {
                        userHtml = $('<li><a href="javascript:;"><img src="../img/headDefault.png" /><span></span></a><h2>&nbsp;</h2></li>');
                        if (users[i].headUrl) {
                            userHtml.find("img").prop("src", users[i].headUrl);
                        }
                        userHtml.find("h2").html(users[i].userName);
                        userHtml.data("userId", users[i].userId);

                        if (html.find("li").length > 0) {
                            html.find("li:first").after(userHtml);
                        } else {
                            html.find("ul").append(userHtml);
                        }
                    }

                    userHtml.addClass("loginer-current");

                    html.find(".logining").data("userId", userHtml.data("userId"))

                    //头像点击事件
                    html.find("li").click(function () {
                        var $this = $(this);

                        if ($this.hasClass("loginer-current")) return false;

                        html.find("li").removeClass("loginer-current");

                        $this.addClass("loginer-current");

                        html.find(".logining").data("userId", $this.data("userId"));
                    });

                    //登录点击事件
                    html.find(".logining").click(function () {
                        _this.loginPage($(this).data("userId"));
                    });

                    //返回二维码登录
                    html.find(".back").click(function () {
                        _this.codeLogin();
                    })

                    _this.content.html(html);
                } else {
                    _this.codeLogin();
                }

            } else {
                _this.codeLogin();
            }
        },
        //下载app页面
        joinClass: function (accessCode) {
            var _this = this;

            var html = $(template("joinClass-page", {
                accessCode: accessCode
            }));

            _this.content.html(html);

            var height = window.screen.height * 0.4

            if (window.screen.width > 1210) {
                html.css("width", 1210);
            } else if (window.screen.width < 1000) {
                html.css("width", window.screen.width * 0.975);
            }

            $(".bg-code").css("width", height).qrcode({
                width: height,
                height: height,
                text: "http://qr14.cn/C7zKqY"
            });

        },
        //连接成功界面
        connectedPage: function () {
            var _this = this;

            var html = $(template("connected", {
                theme: theme
            }));

            $(".main-box").css("background", "");

            _this.content.html(html);
            $('#select_touping').css("display", "none");
            
        },
        //扫描登录界面
        codeLogin: function () {
            if ($("#qrcode-img").length > 0) {
                return;
            }
            $(".main-box").css("background", "");
            var html = $(template("code-login", {
                ips: ips,
                selectedIp: selectedIp,
                theme: theme
            }));

            this.createCode(html.find("#qrcode-img"));

            this.content.html(html);
            $('#select_touping').css("display", "block");
            //绑定全投屏二维码
            pageFunc.init();
        },
        //生成二维码用于登录
        createCode: function (elem) {
            var _this = this;
            var info = [];

            info.push(_this.socket.id || "");
            info.push(_this.socketSelf.id || "");
            info.push(selectedIp || "");
            //			info.push(network ? 1 : 0);

            elem.html("");
            elem.qrcode({
                text: info.join(";"),
                correctLevel: 2
            });
        },
        //手机端传来用户信息用于登录，data为user信息
        loginPage: function (userId) {
            var _this = this;
            $(".main-box").css("background", "");
            if (userId) {
                $.get(apiUrl + "/personalinfo/persionInfo_client", {
                    userId: userId,
                    time: Number(new Date())
                }, function (r) {
                    if (r.code == -2) {
                        tips("用户不存在");
                    }

                    if (r.code > 0) {
                        var html = $(template("confirm-login", {}));
                        $('#select_touping').css("display", "block");
                        html.find(".displayName").html(r.displayName);
                        if (r.url) {
                            html.find(".headUrl").prop("src", r.url);
                        }

                        user = {};
                        user.userId = r.userId;
                        user.userName = r.displayname;
                        user.userType = 'teacher';
                        user.equipment = 'web';
                        if (r.url) {
                            user.headUrl = r.url + "/200_200.jpg";
                        }

                        _this.content.html(html);

                        _this.sendConfirm(userId);
                    }
                }, 'json')
            }

        },
        //发送到手机确认登录
        sendConfirm: function (userId) {
            $(".main-box").css("background", "");
            var _this = this;

            //发送给手机确认登录
            var sendData = {
                sendId: userId,
                receiveType: "user",
                receiver: {
                    userType: "teacher",
                    equipment: "mobile",
                    userId: userId
                },
                action: {
                    actionType: "confirmLogin",
                    socketId: _this.socket.id,
                    socketP2PId: _this.socketSelf.id,
                    ip: selectedIp
                }
            };
            _this.sendSocket("order", JSON.stringify(sendData));
            //_this.socket.emit("order", JSON.stringify(sendData));
        },
        //手机端确认登录
        confirmLogin: function (data) {
            var _this = this;

            if (data.action.token) {
                $(".main-box").css("background", "");
                _this.content.find(".conf-login .back").html("正在登录...");

                _this.token = data.action.token;
                var userId = data.sendId;

                $.get(apiUrl + "/personalinfo/persionInfo_client", {
                    userId: userId,
                    time: Number(new Date())
                }, function (r) {
                    if (r.code == 1) {
                        user = {};
                        user.userId = r.userId;
                        user.userName = r.displayname;
                        user.userType = 'teacher';
                        user.equipment = 'web';
                        if (r.url) {
                            user.headUrl = r.url;
                        }

                        _this.saveUser();

                        _this.sendSocket("login", JSON.stringify(user))

                        _this.connectedPage();
                        _this.getOpenInfo();
                    }
                }, 'json');
            }
        },
        //无网络时本地登录
        noInternetLogin: function (action) {
            if (action.user) {
                user = {};
                user.userId = action.user.userId;
                user.userName = action.user.displayName;
                user.userType = 'teacher';
                user.equipment = 'web';
                user.headUrl = action.user.avatorUrl;
                user.socketIp = this.socketIp;
                user.localServer = this.localServer;
                this.token = action.token;

                this.sendSocket("login", JSON.stringify(user));

                this.connectedPage();
                //				this.saveUser();
            }
        },
        //打开作业附件
        openAssimentDoc: function (action) {
            var _this = this;
            if (action.cellId) {
                $.post(apiUrl + "/assignment/getPreviewDoc", {
                    id: action.cellId,
                    token: _this.token
                }, function (data) {
                    if (!data.code || data.code < 0) {
                        return false;
                    }

                    $(".full-screen").addClass("opacity");

                    _this.operateDoc = previewDoc(_this.content, data, action);

                    if (!_this.operateDoc) {
                        _this.close();
                        return;
                    }

                }, 'json')
            }
        },

        //打开文档
        openDoc: function (action, callback) {
            var _this = this;

            if (action.isAssignment) {
                _this.openAssimentDoc(action);
                return;
            }
            if (!action.fromRes) {
                $(".main-box:not(:first)").remove();
                _this.content = $("#main-box");
                _this.docStack = [];
            }

            //预览离线文件
            if (action.noInternet && action.uploadUrl) {
                _this.operateDoc = previewDocNoInternet(_this.content, action);
            } else {
                if (action.cellId) {
                    $.post(apiUrl + "/AssistTeacher/getPrivew", {
                        cellId: action.cellId,
                        token: _this.token
                    }, function (data) {
                        if (!data.code || data.code < 0) {
                            return false;
                        }

                        $(".full-screen").addClass("opacity");

                        if (data.content) {
                            _this.operateDoc = viewHtml(_this.content, data.content);
                        } else {
                            _this.operateDoc = previewDoc(_this.content, data, action);
                        }

                        if (!_this.operateDoc) {
                            _this.close();
                            return;
                        }

                        //回调函数
                        if (callback) {
                            callback();
                        }

                    }, 'json')
                }
            }
        },
        //文档命令
        docOrder: function (action) {
            var _this = this,
				operateDoc = this.operateDoc;

            if (operateDoc) {
                switch (action.operate) {
                    case "to":
                        operateDoc.getImage(action.page, action);
                        break;
                    case "zoom":
                        operateDoc.zoomImg(action.x, action.y, action.size);
                        break;
                    case "move":
                        operateDoc.moveImg(action.x, action.y, action.scale);
                        break;
                    case "seek":
                        operateDoc.seek(action.position);
                        break;
                    case "htmlPosition":
                        operateDoc.scrollTo(action.position);
                        break;
                    case "addBoard":
                        //						operateDoc.addBoard(action.position);
                        break;
                    case "next":
                    case "prev":
                    case "play":
                    case "pause":
                    case "reload":
                    case "pageUp":
                    case "pageDown":
                        if (operateDoc[action.operate]) {
                            operateDoc[action.operate](action);
                        }
                        break;
                }
            } else {
                this.getOpenInfo(action);
            }
        },
        //图像操作
        imageOperate: function (action) {
            var operateDoc = this.operateDoc;

            //文档已打开
            if (operateDoc) {
                if (action && action.operate) {
                    switch (action.operate) {
                        case 'pen':
                            operateDoc.drawLine(action);
                            break;
                        case 'eraser':
                        case 'empty':
                        case 'cancel':
                        case 'reload':
                        case 'zoom':
                        case 'rotate':
                            if (operateDoc[action.operate]) {
                                operateDoc[action.operate](action);
                            }
                            break;
                    }
                }
            } else {
                this.getOpenInfo();
            }
        },
        //获取已打开新文件信息
        getOpenInfo: function () {
            //发送给手机获取信息
            var sendData = {
                sendId: user.userId,
                receiveType: "user",
                receiver: {
                    userType: "teacher",
                    equipment: "mobile",
                    userId: user.userId
                },
                action: {
                    actionType: "getOpenInfo"
                }
            };

            this.socket.emit("order", JSON.stringify(sendData));
        },
        /**
		 * 还原文档
		 * @param {Object} action{
		 * 		cellId:活动Id
		 * 		type:1|2|4|8|16(doc|sign|exam|board|join)3|5|9(doc+sign|exam|board)
		 * 		page:第几页
		 * 		historys:历史记录
		 * 		next:下一步的次数
		 *
		 * }
		 */
        docRecover: function (action) {
            var _this = this;

            _this.openDoc(action, function () {

            });
        },
        sendSocket: function (type, msg) {
            if (this.socket.connected) {
                this.socket.emit(type, msg);
            }
            if (this.socketSelf.connected) {
                this.socketSelf.emit(type, msg);
            }
        },
        sendVideoInfo: function (action, id) {

            var order = {
                sendId: user.userId,
                receiveType: "user",
                receiver: {
                    userType: "teacher",
                    equipment: "mobile",
                    userId: id || user.userId
                },
                action: action
            }

            this.socketSelf.emit("order", JSON.stringify(order));
        }
    };
    var pageFunc = {
        init: function () {
            pageFunc.layout();
            pageFunc.bindEvent();
            pageFunc.onUpdateClassInfo(pageFunc.getQueryString("classname"));
            pageFunc.onUpdateIpList(pageFunc.getQueryString("ip"));
            pageFunc.onUpdateQRCode(0);
        },
        bindEvent: function () {
            //页面大小变动时执行函数
            $(window).resize(function () {
                pageFunc.layout();
            });

            //下拉列表
            //$('.np-select .np-selected').click(function () {
            //    var open = $(this).parent().is('.open');
            //    if (!open) {
            //        $(this).parent().addClass('open');
            //        $('.np-ips-list').slideDown();
            //    } else {
            //        $(this).parent().removeClass('open');
            //        $('.np-ips-list').slideUp();
            //    }
            //});

            //下拉选择点击
            //$('.np-ips-list').on('click', 'li', function() {
            //    var text = $(this).text();

            //    $(this).parents('.np-select').removeClass('open');
            //    $('.np-ips-list').slideUp();

            //    $('.np-select .np-selected-ip').text(text);
            //    cef.message.sendMessage('micro.ExecJsCall', ['onIPChanged', text]);
            //});

            //选择想投屏的ip
            $('.ips-list').on('click', 'li', function () {
                var _this = $(this);
                var text = _this.find('.np-ip-address').text();
                cef.message.sendMessage('micro.ExecJsCall', ['onIPChanged', text]);
            });


            //点击空白区域关闭下拉
            //$(document).on('click', function() {
            //    $('.np-select').removeClass('open');
            //    $('.np-ips-list').slideUp();
            //});

            //阻止冒泡
            //$('.np-selected').click(function (e) {
            //    e.stopPropagation(); //阻止冒泡
            //});

            //软件帮助点击展开引导页
            //$('.help-btn').click(function () {
            //    $('.mask-layer').fadeIn();
            //    $('.windows.boot').fadeIn();
            //});

            ////关闭引导页
            //$('.windows.boot .windows-close').click(function () {
            //    $('.mask-layer').fadeOut();
            //    $('.windows.boot').fadeOut();
            //});
        },
        layout: function () {
            var bodyHeight = $(window).height();
            var cotHeight = $('.content').outerHeight();
            var marTop = (bodyHeight - cotHeight) / 2;

            $('.content').css('marginTop', marTop);
        },
        getQueryString: function (name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
            var r = window.location.search.substr(1).match(reg);
            if (r != null) return decodeURIComponent(r[2]);
            return null;
        },
        getQueryStringRegExp: function (name) {
            var reg = new RegExp("(^|\\?|&)" + name + "=([^&]*)(\\s|&|$)", "i");
            if (reg.test(location.href)) return decodeURIComponent(RegExp.$2.replace(/\+/g, " "));
            return "";
        },
        /*更新ip下拉列表*/
        onUpdateIpList: function (str) {

            var container = $(".np-select .ips-list");
            container.empty();
            var container1 = $('.ip-wrap');
            container1.empty();
            var list = str.split(',');
            ips = [];

            $.each(list, function (index, item) {
                var _html = '<li class="np-ip-li"><label class="np-ip-item"><span class="np-ip-no">IP' + (index + 1)
                           + '</span><input type="radio" name="IP"><span class="np-ip-address">' + item
                           + '</span></label></li>'

                container.append(_html);
                ips.push(item);
            });
            //container1.append('<label>IP:</label><span class="has-ips current-ip select-ips">' + ips[0] + '</span>')

            var _html1 = ' <div class="ips-list">'
            $.each(ips, function (index, item) {

                if (item == ips[0]) {
                    _html1 += ' <p class="active">' + item + '</p>';
                } else {
                    _html1 += ' <p >' + item + '</p>';
                }
            });

            _html1 += "</div>";

            container1.append(_html1);
            selectedIp = ips[0];
            socketIO.createCode($("#qrcode-img"));

            $('.ips-list').find('li').eq(0).find('input').attr("checked", true);
            //$('.np-select .np-selected-ip').html(list[0]);
        },
        /*更新班级信息*/
        onUpdateClassInfo: function (classname) {
            //$(".class-info .classname").html(decodeURIComponent(classname));
        },
        /*更新二维码*/
        onUpdateQRCode: function (index) {
            if (index < 0)
                $(".np-qrcode-image img").attr('src', 'images/qrcode.png');
            else
                $(".np-qrcode-image img").attr('src', '../../../temp/qr_ws_' + index + '.bmp');
        },
        /*处理5:4分辨率二维码拉伸*/
        onHandleSpecialDisplay: function () {

        }
    };
    cefHandler.obj = pageFunc;

    pageFunc.init();

    socketIO.init();
})