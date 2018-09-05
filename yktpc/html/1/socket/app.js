var config = require('./config').config;

// 对Date的扩展，将 Date 转化为指定格式的String   
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，   
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)   
// 例子：   
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423   
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18   
Date.prototype.Format = function(fmt) { //author: meizz   
	var o = {
		"M+": this.getMonth() + 1, //月份   
		"d+": this.getDate(), //日   
		"h+": this.getHours(), //小时   
		"m+": this.getMinutes(), //分   
		"s+": this.getSeconds(), //秒   
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度   
		"S": this.getMilliseconds() //毫秒   
	};
	if(/(y+)/.test(fmt))
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for(var k in o)
		if(new RegExp("(" + k + ")").test(fmt))
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
}

function jsonParse(str) {
	var data = null;
	if(str) {
		try {
			data = JSON.parse(str);
		} catch(e) {
			//console.log("json转换错误");
		}
	}
	return data;
}

var io = require('socket.io')(config.socketPort);
var remoteConnected = false;

io.set('heartbeat interval', 1000);

var remoteSocket;
try {
	var ioClient = require('socket.io-client');
	remoteSocket = ioClient.connect(config.socketUrl);

	remoteSocket.on("connect", function() {
		remoteConnected = true;
	});
	remoteSocket.on("disconnect", function() {
		remoteConnected = false;
	})

} catch(e) {
	console.log("请升级云课堂电脑版");
}

var express = require('express');
var fs = require('fs');
var path = require('path');
var multipart = require('connect-multiparty');

var app = express();

//文件路径
var filePath = path.join(__dirname, "/../../../data/upload/");

var versionPath = path.join(__dirname, "/../../../version.json");

if(!fs.existsSync(filePath)) {
	fs.mkdir(filePath);
}

//上传文件路径
app.use(multipart({
	uploadDir: filePath
}))

app.use(express.static(filePath));

app.listen(config.httpPort);
//文件上传
app.post('*/uploadFile*', function(req, res) {

	var result = {};

	if(req.files) {

		var fileInfo = null,
			newNames = [];

		for(var prop in req.files) {
			fileInfo = req.files[prop];
			var pointPosition = fileInfo.name.lastIndexOf("."),
				newName;

			if(pointPosition > 0 && fileInfo.size) {
				var name = fileInfo.name.substr(0, pointPosition),
					ext = fileInfo.name.substr(pointPosition);

				newName = name + fileInfo.size + ext;
			} else {
				newName = fileInfo.name + fileInfo.size;
			}

			fs.renameSync(fileInfo.path, filePath + newName);

			newNames.push(newName);
		}

		if(fileInfo && newName.length > 0) {
			result.code = 1;
			result.msg = "上传成功";
			result.fileName = newNames.join(";");
			result.filePath = filePath;
		} else {
			result.code = -1;
			result.msg = "没有文件";
		}
	} else {
		result.code = -1;
		result.msg = "没有文件";
	}

	// 发送响应数据
	res.writeHead(200, {
		'Content-Type': 'application/json;charset=UTF-8'
	});

	res.end(JSON.stringify(result));
});

//判断文件是否存在
var fileIsExited = function(name, size) {
	var result = {
		code: -1,
		msg: "文件不存在"
	};

	if(!fs.existsSync(filePath)) {
		fs.mkdir(filePath);
	}

	if(name && size) {
		var fileName = "",
			pointPosition = name.lastIndexOf("."),
			existed = false;

		//合并文件名和大小
		if(pointPosition > 0) {
			fileName = name.substr(0, pointPosition) + size + name.substr(pointPosition);

		} else {
			fileName = name + size;
		}

		existed = fs.existsSync(filePath + fileName);

		if(existed) {
			result.code = 1;
			result.msg = "文件存在";
			result.fileName = fileName;
			result.filePath = filePath;
		} else {
			result.code = -1;
			result.msg = "文件不存在";
		}

	} else {
		result.code = -2;
		result.msg = "参数错误";
	}

	return result;
}

//文件是否存在
app.all("*/fileIsExisted*", function(req, res) {
	var result = fileIsExited(req.param("name"), req.param("size"));

	// 发送响应数据
	res.writeHead(200, {
		'Content-Type': 'application/json;charset=UTF-8'
	});
	res.end(JSON.stringify(result));
})

//文件下载
app.all("*/download", function(req, res) {

	var fileName = req.url;
	fileName = fileName.substr(0, fileName.lastIndexOf("/"));
	fileName = fileName.substr(fileName.lastIndexOf("4000/") + 1);

	if(fs.existsSync(filePath + fileName)) {

		res.download(filePath + fileName, fileName);
	} else {
		// 发送响应数据
		res.writeHead(200, {
			'Content-Type': 'application/json;charset=UTF-8'
		});
		res.end(JSON.stringify({
			code: -1,
			msg: '文件不存在'
		}));
	}

})

app.all("*/version", function(req, res) {

	fs.readFile(versionPath, function(err, data) {
		var version = 0;
		// 发送响应数据
		res.writeHead(200, {
			'Content-Type': 'application/json;charset=UTF-8'
		});
		if(!err) {
			var date = new Date(data);
			version = Number(date.Format("yyMMdd"));
		}

		res.end(JSON.stringify({
			code: 1,
			version: version
		}));
	})

})

var webTeachers = {}, //教师电脑信息
	mobileUsers = {}, //学生信息
	windowId = "", //电脑端Id
	orderList = {}, //消息列表
	socketTimeList = {}, //在线socket时间列表
	videoReady = {};

webTeachers.otherUsers = mobileUsers;
mobileUsers.otherUsers = webTeachers;

webTeachers.name = "电脑端";
mobileUsers.name = "手机端";

//socket服务类
var socketServer = {
	init: function() {
		var _this = this;

		//socket连接
		io.on('connection', function(socket) {

			console.log(socket.id + ": 连接");

			_this.socketEvent(socket);

			socket.emit('connected', socket.id);
		});
	},
	socketEvent: function(socket) {
		var _this = this,
			user = null,
			studentIds = []; //本班学生Id

		socket.on("videoInfo", function(details) {
			var otherClient = io.sockets.connected[details.to];

			if(!otherClient) {
				return;
			}
			delete details.to;
			details.from = socket.id;
			otherClient.emit('videoInfo', details);
		});

		socket.on("videoReady", function() {
			videoReady[socket.id] = true;
			socket.broadcast.emit('videoReady', videoReady);
			socket.emit('videoReady', videoReady);
		})

		socket.conn.on('heartbeat', function() {
			socketTimeList[socket.id] = new Date();
		});

		socket.on("login", function(data) {
			data = jsonParse(data);
			socketTimeList[socket.id] = new Date();
			if(data) {
				data.socketId = socket.id;
				if(_this.userLogin(data, socket)) {
					user = data;
					console.log(user.userName + "登录" + socket.id);
				}

				for(var i in orderList) {
					var order = orderList[i];
					var position = order.students.indexOf(data.userId);
					if(position >= 0) {
						socket.emit("order", JSON.stringify(order));
					}
				}
			}
		});

		//教师发送班级学生Id
		socket.on("students", function(data) {
			if(data) {
				studentIds = data.split(";");
			}
		});

		//删除order
		socket.on("deleteActivityOrder", function(data) {
			delete orderList[data];

			var remoteList = [];

			var order = {
				sendId: user.userId,
				receiveType: "user",
				receiver: {
					userType: "student",
					equipment: "mobile",
					users: [],
				},
				action: {
					actionType: "deleteActivity",
					actId: data
				}
			};

			for(var i = 0; i < studentIds.length; i++) {
				var nowId;
				if(mobileUsers[studentIds[i]]) {
					nowId = mobileUsers[studentIds[i]].socketId;

					if((new Date() - socketTimeList[nowId]) < 2000) {
						io.to(nowId).emit("order", JSON.stringify(order));
					} else if(remoteConnected) {
						remoteList.push(studentIds[i]);
					} else {
						io.to(nowId).emit("order", JSON.stringify(order));
					}
				} else {
					remoteList.push(studentIds[i])
				}
			}

			if(remoteList.length > 0 && remoteConnected) {
				order.receiveType = "users";
				order.receiver.users = remoteList;

				remoteSocket.emit("order", JSON.stringify(order));
			}
		});

		//学生返回收到消息
		socket.on("orderReceived", function(data) {
			var order = orderList[data];

			if(order && user) {
				var userId = user.userId;
				var students = order.students;
				if(userId && students) {
					var position = students.indexOf(userId);
					if(position >= 0) {
						students.splice(position, 1);
					}

					if(students.length == 0) {
						delete orderList[data];
					}
				}
			}

		});

		//用户命令事件
		socket.on("order", function(data) {
			data = jsonParse(data);

			if(data) {
				//更新socketId

				if(data.sendId && data.receiver && (data.receiver.userType != "teacher" || data.receiver.equipment == "web")) {
					if(mobileUsers[data.sendId]) {
						mobileUsers[data.sendId].socketId = socket.id;
					}
				}

				data.socketType = "myComputer";

				switch(data.receiveType) {
					case "id":
						io.to(data.socketId).emit("order", JSON.stringify(data));
						break;
					case "user":
						data.action.dataPath = filePath;
						//发送给两个教师
						if(data.receiver.equipment == "both") {

							if(webTeachers[data.receiver.userId]) {
								io.to(webTeachers[data.receiver.userId].socketId).emit("order", JSON.stringify(data));
							} else if(remoteConnected) {
								delete data.socketType;
								data.receiver.equipment = "web";
								remoteSocket.emit("order", JSON.stringify(data));
							}

							if(mobileUsers[data.receiver.userId]) {
								var nowId = mobileUsers[data.receiver.userId].socketId;
								if((new Date() - socketTimeList[nowId]) < 2000) {
									io.to(nowId).emit("order", JSON.stringify(data));
								} else if(remoteConnected) {
									data.receiver.equipment = "mobile";
									remoteSocket.emit("order", JSON.stringify(data));

								} else {
									io.to(nowId).emit("order", JSON.stringify(data));
								}
							} else {
								if(remoteSocket) {
									delete data.socketType;
									data.receiver.equipment = "mobile";
									remoteSocket.emit("order", JSON.stringify(data));
								}
							}

						} else {
							var users = _this.getUserType(data.receiver);

							if(users && users[data.receiver.userId]) {
								var nowId = users[data.receiver.userId].socketId;
								if((new Date() - socketTimeList[nowId]) < 2000) {
									io.to(nowId).emit("order", JSON.stringify(data));
								} else if(remoteConnected) {
									remoteSocket.emit("order", JSON.stringify(data));
								} else {
									io.to(nowId).emit("order", JSON.stringify(data));
								}

							} else if(remoteConnected) {
								remoteSocket.emit("order", JSON.stringify(data));
							}

						}
						break;
					case "users":
						var users = _this.getUserType(data.receiver);
						var userIds = data.receiver.users;

						for(var i in userIds) {
							if(users[userIds[i]]) {
								data.receiver.userId = userIds[i];
								io.to(users[userIds[i]].socketId).emit("order", JSON.stringify(data));
							}
						}

						break;
				}
				//如果发送给学生
				if(data.action && data.action.send2student) {
					_this.send2student(data, studentIds);
				}
			}
		});

		//发送给web的指令
		socket.on("webOrder", function(data) {
			data = jsonParse(data);

			if(data) {
				io.to(data.socketId).emit("webOrder", data.order);
			}

		});

		//发送给电脑的指令
		socket.on("windowOrder", function(data) {
			data = jsonParse(data);
			if(data) {

				data.filePath = filePath;
				data.socketId = socket.id;
				io.to(windowId).emit("order", data);
			}
		});

		//windows登录
		socket.on("windowLogin", function(data) {
			windowId = this.id;
		});

		//用户退出事件
		socket.on("exit", function(data) {
			if(user) {
				console.log(user.userName + "退出成功");
				socket.emit("message", JSON.stringify({
					type: 'exited',
					msg: user.userName + "退出成功",
					equipment: user.equipment
				}));

				var users = _this.getUserType(user);

				var nowUser = users[user.userId];

				if(nowUser && nowUser.socketId == socket.id) {
					delete users[user.userId];
				}

				if(users.otherUsers && users.otherUsers[user.userId]) {
					io.to(users.otherUsers[user.userId].socketId).emit("message", JSON.stringify({
						type: 'exited',
						msg: user.userName + "退出成功",
						equipment: user.equipment
					}));
				}

				user = null;
			}
		});

		//断开连接
		socket.on("disconnect", function(data) {
			console.log(socket.id + ": 断开连接");
			delete videoReady[socket.id];
			if(user) {
				var users = _this.getUserType(user);

				if(users.otherUsers && users.otherUsers[user.userId]) {
					io.to(users.otherUsers[user.userId].socketId).emit("message", JSON.stringify({
						type: "disconnected",
						msg: users.name + "断开已连接",
						equipment: user.equipment
					}));
				}

				var nowUser = users[user.userId];
				if(nowUser && nowUser.socketId == socket.id) {
					delete users[user.userId];
				}

				user = null;
			}
		});
	},
	//发送给学生
	send2student: function(data, studentIds) {
		var studentList = studentIds.concat();
		var remoteList = [];

		for(var i = studentList.length - 1; i >= 0; i--) {
			var nowId;
			if(mobileUsers[studentList[i]]) {
				nowId = mobileUsers[studentIds[i]].socketId;

				if((new Date() - socketTimeList[nowId]) < 2000) {
					io.to(nowId).emit("order", JSON.stringify(data));
				} else if(remoteConnected) {
					remoteList.push(studentList[i]);
					studentList.splice(i, 1);
				} else {
					io.to(nowId).emit("order", JSON.stringify(data));
				}
			} else if(remoteConnected) {
				remoteList.push(studentList[i]);
				studentList.splice(i, 1);
			}
		}

		if(remoteList.length > 0 && remoteConnected) {
			var order = jsonParse(JSON.stringify(data));
			delete order.students;
			order.receiveType = "users";
			order.receiver.users = remoteList;
			order.receiver.equipment = "mobile";
			order.receiver.userType = "student";
			remoteSocket.emit("order", JSON.stringify(order));
		}

		data.students = studentList;

		var actId = data.action.activityId;

		if(!actId) {
			actId = data.action.actId;
		} else if(!actId) {
			actId = data.action.signId;
		} else if(!actId) {
			actId = data.action.stormId;
		}

		if(actId) {
			orderList[actId] = data;
		}

	},
	//用户登录处理
	userLogin: function(data, socket) {
		var _this = this,
			users = null;

		users = _this.getUserType(data);

		if(users) {

			users[data.userId] = data;

			socket.emit("message", JSON.stringify({
				type: 'login',
				msg: data.userName + "登录成功"
			}));

			if(users.otherUsers && users.otherUsers[data.userId]) {
				var otherUser = users.otherUsers[data.userId];

				io.to(otherUser.socketId).emit("message", JSON.stringify({
					type: "connected",
					msg: users.name + "已连接",
					equipment: data.equipment
				}));

				socket.emit("message", JSON.stringify({
					type: "connected",
					msg: users.otherUsers.name + "已连接",
					equipment: data.equipment,
				}))
			}

			return true;

		} else {
			return false;
		}
	},

	/**
	 *    获取用户类型数组
	 * @param {Object} data
	 */
	getUserType: function(data) {
		var users = null;
		//判断用户类型
		if(data) {
			if(data.equipment == "web") {
				users = webTeachers;
			} else {
				users = mobileUsers;
			}
		}

		return users;
	}
}

socketServer.init();

//udp服务
var dgram = require("dgram");
var server = dgram.createSocket("udp4");
var message = new Buffer("I'm server");

var sendBroadcast = function(ip) {
	if(!ip) {
		ip = "255.255.255.255";
	}
	server.send(message, 0, message.length, config.clientPort, ip);
}

//发生错误事件
server.on("error", function(err) {
	console.log("server error:\n" + err.stack);
	server.close();
});

//收到消息事件
server.on("message", function(msg, rinfo) {
	console.log("server got: " + msg + " from " +
		rinfo.address + ":" + rinfo.port);
	//发送消息
	sendBroadcast(rinfo.address);
});

//udp创建成功事件
server.on("listening", function() {
	var address = server.address();
	console.log("server listening " +
		address.address + ":" + address.port);
	//发送消息
	sendBroadcast();
});

//绑定端口10033
server.bind(config.serverPort, function() {
	server.setBroadcast(true);
});