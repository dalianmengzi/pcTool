window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;

var Audio = {
	classType: "Audio",
	player: null,
	ctx: null,
	init: function(url) {
		if (!url) {
			return;
		}

		var html = template("music-play", {
			url: url
		});

		socketIO.content.html(html);

		this.player = $(".audio-player")[0];
		this.canvasInit();
	},
	play: function() {
		this.player.play();
	},
	pause: function() {
		this.player.pause();
	},
	reload: function() {
		this.player.load();
	},
	seek: function(position) {
		this.player.currentTime = position;
	},
	canvasInit: function() {
		var audio = this.player;
		if (!this.ctx) {
			this.ctx = new AudioContext();
		}
		var ctx = this.ctx;
		var analyser = ctx.createAnalyser();
		var audioSrc = ctx.createMediaElementSource(audio);
		// we have to connect the MediaElementSource with the analyser 
		audioSrc.connect(analyser);
		analyser.connect(ctx.destination);
		// we could configure the analyser: e.g. analyser.fftSize (for further infos read the spec)
		// analyser.fftSize = 64;
		// frequencyBinCount tells you how many values you'll receive from the analyser
		var frequencyData = new Uint8Array(analyser.frequencyBinCount);

		// we're ready to receive some data!
		var canvas = $('.audio-canvas')[0];

		canvas.width = window.screen.width - 200;
		canvas.height = window.screen.height - 100;

		var cwidth = canvas.width,
			cheight = canvas.height - 2,
			meterNum = 35,
			meterSum = 50, //基本上后面0.3用不到
			gap = 2, //gap between meters
			meterWidth = (cwidth - meterNum * gap) / meterNum, //width of the meters in the spectrum
			capHeight = 2,
			capStyle = '#fff',
			zoomSize = cheight / 250,
			capYPositionArray = []; ////store the vertical position of hte caps for the preivous frame

		ctx = canvas.getContext('2d');
		var gradient = ctx.createLinearGradient(0, 0, 0, cheight);
		gradient.addColorStop(1, '#0f0');
		gradient.addColorStop(0.5, '#ff0');
		gradient.addColorStop(0, '#f00');
		var max = 0;
		// loop
		function renderFrame() {
			var array = new Uint8Array(analyser.frequencyBinCount);
			analyser.getByteFrequencyData(array);
			var step = Math.round(array.length / (meterSum)); //sample limited data from the total array
			ctx.clearRect(0, 0, cwidth, cheight);
			for (var i = 0; i < meterNum; i++) {
				var value = array[i * step] * zoomSize;
				if (capYPositionArray.length < meterNum) {
					capYPositionArray.push(value);
				};
				ctx.fillStyle = capStyle;
				//draw the cap, with transition effect
				if (value < capYPositionArray[i]) {
					ctx.fillRect(i * (meterWidth + gap), cheight - (--capYPositionArray[i]), meterWidth, capHeight);
				} else {
					ctx.fillRect(i * (meterWidth + gap), cheight - value, meterWidth, capHeight);
					capYPositionArray[i] = value;
				};
				ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
				ctx.fillRect(i * (meterWidth + gap) /*meterWidth+gap*/ , cheight - value + capHeight, meterWidth, cheight); //the meter
			}
			requestAnimationFrame(renderFrame);
		}
		renderFrame();

		audio.play();
		audio.pause();
	}
}