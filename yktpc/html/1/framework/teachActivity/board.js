/**
 * 白板活动
 */
var Board = {
	classType: "Board",
	content: null,
	board: null,
	rate: 1,
	sx: 0,
	sy: 0,
	localPre: '../../../data/upload/',
	open: function(content, action) {
		if (!action) {
			return;
		}

		content.css("background", "#fff");
		this.content = content;

		//记住手机屏幕大小，等重新加载的时候用
		this.screen = action.screen;

		this.initBoard(action);

		return this;
	},
	/**
	 * 初始化白板 
	 * @param {Object} action
	 */
	initBoard: function(action) {
		var _this = this;
		if (action.noInternet) {
			if (action.img) {
				action.img = _this.localPre + action.img;
			}
		}
		//创建白板
		var board = new BoardCanvas(action.img, _this.screen, function(board) {
			_this.content.html(board.getShowCanvas());
			_this.content.append(board.painting);
			_this.board = board;
		})

	},
	drawLine: function(data) {
		var paint = data.paint;
		//画线并保存笔迹
		this.board.drawLine(paint);
		this.board.savePaint(paint);
	},
	cancel: function() {
		this.board.cancel();
	},
	empty: function(action) {
		this.board.clear();
	},
	reload: function(action) {
		this.initBoard(action);
	},
	zoom: function(action) {
		this.board.zoom(action.scale, action.left, action.top);
	},
	rotate: function(action) {
		this.board.rotate(action.angle, action.scale, action.left, action.top);
	}
}