function PeerVideo(id, isSend) {
	this.pc = new RTCPeerConnection(iceServer, peerConnectionConstraints);
	this.id = id;
	var html = $('<video autoplay="autoplay"></video>');
	html.css({
		height: window.screen.height,
		width: "50%"
	})

	this.isSend = isSend;
	this.remoteVideo = html[0];
	this.remoteVideo.controls = false;
	this.remoteVideo.autoplay = true;
}
var ConnectVideo = {
	init: function(content, id, remoteId) {
		content.css("background", "#000");
		var html = $('<div></div>');
		this.html = html;
		content.html(html);

		this.id = id;
		this.peer = this.createPeer(id, false);
		this.peerRemote = this.createPeer(remoteId, false);
		this.peerSend = this.createPeer(id, true);
		this.peerRemoteSend = this.createPeer(remoteId, true);

		this.addStreamEvent();
	},
	addStreamEvent: function() {
		var _this = this,
			peer = this.peer,
			peerRemote = this.peerRemote,
			peerSend = this.peerSend,
			peerRemoteSend = this.peerRemoteSend;

		peer.pc.onaddstream = function(event) {

			attachMediaStream(peer.remoteVideo, event.stream);
			_this.html.append(peer.remoteVideo);
			peerRemoteSend.pc.addStream(event.stream);
			_this.offer(peerRemoteSend);
		};

		peerRemote.pc.onaddstream = function(event) {
			attachMediaStream(peerRemote.remoteVideo, event.stream);
			_this.html.append(peerRemote.remoteVideo);
			peerSend.pc.addStream(event.stream);
			_this.offer(peerSend);
		};

		_this.send("init", "", peer);

		_this.send("init", "", peerRemote);
	},
	createPeer: function(id, isSend) {
		var _this = this;
		var peer = new PeerVideo(id, isSend);

		peer.pc.onicecandidate = function(event) {
			if (event.candidate) {
				_this.send('candidate', {
					label: event.candidate.sdpMLineIndex,
					id: event.candidate.sdpMid,
					candidate: event.candidate.candidate
				}, peer);
			}
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
				case 'connected':
					console.log("connected");
					break;
			}
		};

		return peer;
	},
	answer: function(peer) {
		var _this = this,
			pc = peer.pc;

		pc.createAnswer(
			function(sessionDescription) {
				pc.setLocalDescription(sessionDescription);
				_this.send('answer', sessionDescription, peer);
			},
			videoError
		);
	},
	offer: function(peer) {
		var _this = this,
			pc = peer.pc;;

		pc.createOffer(
			function(sessionDescription) {
				pc.setLocalDescription(sessionDescription);
				_this.send('offer', sessionDescription, peer);
			},
			videoError
		);
	},
	handleMessage: function(message, isReceive) {
		var type = message.type,
			from = message.from,
			peer;
		if (isReceive) {
			peer = (from == this.id) ? this.peerSend : this.peerRemoteSend;

		} else {
			peer = (from == this.id) ? this.peer : this.peerRemote;
		}

		if (!peer) {
			return;
		}

		var pc = peer.pc;

		switch (type) {
			case 'offer':
				pc.setRemoteDescription(new RTCSessionDescription(message.payload), function() {}, videoError);
				this.answer(peer);
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
			case 'init':
				this.offer(peer);
				break;
			case 'answer':
				pc.setRemoteDescription(new RTCSessionDescription(message.payload), function() {}, videoError);
				break;
		}
	},
	send: function(type, payload, peer) {

		var info = {
			type: type,
			payload: payload
		}
		var action = {
			actionType: "videoRemoteInfo",
			info: info,
			isSend: peer.isSend
		}

		socketIO.sendVideoInfo(action, peer.id);
	}
}