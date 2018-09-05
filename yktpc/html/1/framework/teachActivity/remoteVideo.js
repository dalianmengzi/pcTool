var iceServer = {
	iceServers: [{
		"url": "stun:120.26.88.30"
	}]
};
var peerConnectionConstraints = {
	optional: [{
		"DtlsSrtpKeyAgreement": true
	}],
	mandatory: [{
		"OfferToReceiveAudio": true
	}, {
		"OfferToReceiveVideo": true
	}, {
		"VoiceActivityDetection": false
	}]
};

function videoError(err) {
	console.log(err);
}

function Peer(id) {
	this.pc = new RTCPeerConnection(iceServer, peerConnectionConstraints);
	this.id = id;
	var html = $('<video autoplay="autoplay"></video>');
	html.css({
		height: window.screen.height,
		width: "100%"
	})

	this.remoteVideo = html[0];
	this.remoteVideo.controls = false;
	this.remoteVideo.autoplay = true;
}

var RemoteVideo = {
	init: function(content, id) {
		content.css("background", "#000");
		var html = $('<div></div>');
		this.html = html;
		content.html(html);
		this.createPeer(id);
	},
	createPeer: function(id) {
		var _this = this;
		var peer = new Peer(id);

		this.peer = peer;
		peer.pc.onicecandidate = function(event) {
			if (event.candidate) {
				_this.send('candidate', {
					label: event.candidate.sdpMLineIndex,
					id: event.candidate.sdpMid,
					candidate: event.candidate.candidate
				});
			}
		};
		peer.pc.onaddstream = function(event) {
			attachMediaStream(peer.remoteVideo, event.stream);
			_this.html.html(peer.remoteVideo);
		};
		peer.pc.onremovestream = function(event) {
			peer.remoteVideo.src = '';
			_this.html.html("");
		};
		peer.pc.oniceconnectionstatechange = function(event) {
			switch (
				(event.srcElement // Chrome
					|| event.target) // Firefox
				.iceConnectionState) {
				case 'disconnected':
					_this.html.html("");
					break;
			}
		};

		_this.send("init", "");
	},
	answer: function() {
		var _this = this;
		var pc = this.peer.pc;
		pc.createAnswer(
			function(sessionDescription) {
				pc.setLocalDescription(sessionDescription);
				_this.send('answer', sessionDescription);
			},
			videoError
		);
	},
	handleMessage: function(message) {
		var type = message.type,
			from = message.from,
			pc;

		if (!this.peer || this.peer.id != from) {
			this.createPeer(from);
			return;
		}

		pc = this.peer.pc;

		switch (type) {
			case 'offer':
				pc.setRemoteDescription(new RTCSessionDescription(message.payload), function() {}, videoError);
				this.answer();
				break;
			case 'candidate':
				if (pc.remoteDescription) {
					pc.addIceCandidate(new RTCIceCandidate({
						sdpMLineIndex: message.payload.label,
						sdpMid: message.payload.id,
						candidate: message.payload.candidate
					}), function() {}, videoError);
				}
				break;
		}
	},
	send: function(type, payload) {
		var info = {
			type: type,
			payload: payload
		}
		var action = {
			actionType: "videoRemoteInfo",
			info: info,
			isMobile: false
		}

		socketIO.sendVideoInfo(action, this.peer.id);
	},
	close: function() {
		if (this.peer) {
			this.peer.pc.close();
		}
	}
}