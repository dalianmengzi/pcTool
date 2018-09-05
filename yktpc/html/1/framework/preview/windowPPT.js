var WindowPPT = {
	classType: "WindowPPT",
	times: 0,
	open: function(action) {
		this.sendOrder(action);
	},
	getImage: function(page, action) {
		this.sendOrder(action);
	},
	next: function(action) {
		this.sendOrder(action);
	},
	prev: function(action) {
		this.sendOrder(action);
	},
	drawLine: function(action) {
		this.sendOrder(action);
	},
	eraser: function(action) {
		action.points.width = 10;
		this.sendOrder(action);
	},
	cancel: function(action) {
		this.sendOrder(action);
	},
	empty: function(action) {
		this.sendOrder(action);
	},
	show: function() {
		this.sendOrder({
			actionType: 'show'
		});
	},
	hide: function() {
		this.sendOrder({
			actionType: 'hide'
		});
	},
	close: function() {
		this.sendOrder({
			actionType: 'close'
		});
	},
	sendOrder: function(order) {
		socketIO.socketSelf.emit("windowOrder", JSON.stringify(order));
	},
	formClose: function() {
		this.sendOrder({
			actionType: "formClose"
		});
	}
}