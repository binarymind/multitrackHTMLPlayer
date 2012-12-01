//--------------------------------------------------------------------
//FFT CODE
//--------------------------------------------------------------------
var FFT = function (bufferSize, sampleRate) {
        this.bufferSize = bufferSize;
        this.sampleRate = sampleRate;
        this.spectrum = new Float32Array(bufferSize / 2);
        this.real = new Float32Array(bufferSize);
        this.imag = new Float32Array(bufferSize);
        this.reverseTable = new Uint32Array(bufferSize);
        this.sinTable = new Float32Array(bufferSize);
        this.cosTable = new Float32Array(bufferSize);

        var limit = 1,
            bit = bufferSize >> 1;

        while (limit < bufferSize) {
            for (var i = 0; i < limit; i++) {
                this.reverseTable[i + limit] = this.reverseTable[i] + bit;
            }

            limit = limit << 1;
            bit = bit >> 1;
        }

        for (var i = 0; i < bufferSize; i++) {
            this.sinTable[i] = Math.sin(-Math.PI / i);
            this.cosTable[i] = Math.cos(-Math.PI / i);
        }
    };

FFT.prototype.forward = function (buffer) {
    var bufferSize = this.bufferSize,
        cosTable = this.cosTable,
        sinTable = this.sinTable,
        reverseTable = this.reverseTable,
        real = this.real,
        imag = this.imag,
        spectrum = this.spectrum;

    if (bufferSize !== buffer.length) {
        throw "Supplied buffer is not the same size as defined FFT. FFT Size: " + bufferSize + " Buffer Size: " + buffer.length;
    }

    for (var i = 0; i < bufferSize; i++) {
        real[i] = buffer[reverseTable[i]];
        imag[i] = 0;
    }

    var halfSize = 1,
        phaseShiftStepReal, phaseShiftStepImag, currentPhaseShiftReal, currentPhaseShiftImag, off, tr, ti, tmpReal, i;

    while (halfSize < bufferSize) {
        phaseShiftStepReal = cosTable[halfSize];
        phaseShiftStepImag = sinTable[halfSize];
        currentPhaseShiftReal = 1.0;
        currentPhaseShiftImag = 0.0;

        for (var fftStep = 0; fftStep < halfSize; fftStep++) {
            i = fftStep;

            while (i < bufferSize) {
                off = i + halfSize;
                tr = (currentPhaseShiftReal * real[off]) - (currentPhaseShiftImag * imag[off]);
                ti = (currentPhaseShiftReal * imag[off]) + (currentPhaseShiftImag * real[off]);

                real[off] = real[i] - tr;
                imag[off] = imag[i] - ti;
                real[i] += tr;
                imag[i] += ti;

                i += halfSize << 1;
            }

            tmpReal = currentPhaseShiftReal;
            currentPhaseShiftReal = (tmpReal * phaseShiftStepReal) - (currentPhaseShiftImag * phaseShiftStepImag);
            currentPhaseShiftImag = (tmpReal * phaseShiftStepImag) + (currentPhaseShiftImag * phaseShiftStepReal);
        }

        halfSize = halfSize << 1;
    }

    i = bufferSize / 2;
    while (i--) {
        spectrum[i] = 2 * Math.sqrt(real[i] * real[i] + imag[i] * imag[i]) / bufferSize;
    }
};

//initFFT = function(event, that) {
loadedMetaData = function(event) {
	var that = $(event.currentTarget);
	var myAudio = event.currentTarget;
	
	var containerID = that.attr("container");
	var index = parseInt(that.attr("index"));
	var canvas = players[containerID].canvas[0];
    players[containerID].fft[index] = {
    	channels : myAudio.mozChannels,
	    rate : myAudio.mozSampleRate,
	    frameBufferLength : myAudio.mozFrameBufferLength,
	};
	players[containerID].fft[index].fft = new FFT(players[containerID].fft[index].frameBufferLength / players[containerID].fft[index].channels, players[containerID].fft[index].rate);

};
initFFT = function(event) {
	var that = $(event.currentTarget);
	var myAudio = event.currentTarget;
	var containerID = that.attr("container");

	//exit if canvas is not visible
	if(!players[containerID].canvasVisible) return; 

	var index = parseInt(that.attr("index"));
	var canvas = players[containerID].canvas[0];
    players[containerID].fft[index].ctx = canvas.getContext('2d');
	if(index==0) {
		//tell that the canvas must be cleared
		players[containerID].canvasCleared=false;
	}
	if(myAudio.volume==0) return;

	var fb = event.frameBuffer,
        t = event.time,
        /* unused, but it's there */
        signal = new Float32Array(fb.length / players[containerID].fft[index].channels),
        magnitude;

    for (var i = 0, fbl = players[containerID].fft[index].frameBufferLength / 2; i < fbl; i++) {
        // Assuming interlaced stereo channels,
        // need to split and merge into a stero-mix mono signal
        signal[i] = (fb[2 * i] + fb[2 * i + 1]) / 2;
    }

    players[containerID].fft[index].fft.forward(signal);

    // Clear the canvas before drawing spectrum
    if(players[containerID].canvasCleared==false) {
    	players[containerID].fft[index].ctx.clearRect(0, 0, canvas.width, canvas.height);
    	players[containerID].canvasCleared = true;
    }

    players[containerID].fft[index].ctx.fillStyle =that.attr("color");  
    
    for (var i = 0; i < players[containerID].fft[index].fft.spectrum.length; i++) {
        // multiply spectrum by a zoom value
        magnitude = players[containerID].fft[index].fft.spectrum[i] * 4000;

        // Draw rectangle bars for each frequency bin
        players[containerID].fft[index].ctx.fillRect(i * 4, canvas.height, 3, -magnitude);
    }
};




function get_random_color() {
	var letters = '0123456789ABCDEF';
    var possibilities = letters.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += possibilities[Math.round(Math.random() * (letters.length-1))];
    }
    return color;
}

generateHierarchy = function(container) {
	var myLis = container.find('li[name]');
	myLis.each(function(){
		var that = $(this);
		that.wrap('<ul class="expandable closed"></ul>');
		that.parent().wrap('<li></li>');
		that.before('<li><a href="javascript://">'+that.attr('name')+'<span class="icon-expand"></span><span class="icon-reduce"></span></a></li>');
	});

	//MUTE not active
	//----------------------------------------------
	container.on('click', '.expandable > :first-child a', function() {
		$(this).closest(".expandable").removeClass("closed").toggleClass("opened");
		return false;
	});
};

generateHtml = function(container) {
	var containerID = container.attr('id');	
	var preload = container.attr("preload") == "none" ? false : true;
	var srcAttr = 'url';
	if(preload) srcAttr = "src";

	//specify containercount to parent
	var nbContainer = container.parent().attr("containers");
	if(nbContainer) {
		nbContainer = parseInt(nbContainer)+1;
		container.parent().attr("containers", nbContainer);
	} else {
		container.parent().attr("containers", 1);
	}
	//insert main control
	container.prepend('<h1>'+container.attr('name')+'</h1><div class="main-control"><ul class="control"><li class="play"><a href="javascript://">play</a></li> <li class="pause"><a href="javascript://">pause</a></li> <li class="stop"><a href="javascript://">stop</a></li> <li class="repeat"><a href="javascript://">repeat</a></li></ul><div class="timebar-wrapper"><div class="timebar"></div></div></div>');
	var audioTags = container.find("audio");
	audioTags.detach();
	
	//insert tracks
	container.append(($.browser.mozilla ? '<canvas width="400"></canvas><a href="javascript://" class="canvas-toggle">▼</a>':"")+'<ul class="tracks"></ul>');
	var containerTracks = container.find('.tracks');
	audioTags.each(function(i){
		var randomColor = get_random_color();
		containerTracks.append('<li class="track"><ul class="control"><li class="mute"><a href="javascript://">mute</a></li><li class="solo"><a href="javascript://"><span></span></a></li></ul><span class="status"></span><audio index="'+i+'" container="'+containerID+'" color="'+randomColor+'" preload="auto" '+srcAttr+'="'+$(this).attr("url")+'"></audio><span class="track-name">'+$(this).attr("name")+'</span>'+($.browser.mozilla ? '<span class="color" style="background-color:'+randomColor+'"></span>':"")+'</li>');
	});	
	container.append('<span class="loader"></span>');
	if(!preload) {
		container.append('<a class="loading-link" href="javascript://"></a>').addClass("waiting");
	}
	audioTags.remove();
};
players = {};

initPlayer = function(containerID) {
	var container = $("#"+containerID);	
	generateHtml(container);
	
	//fast access to main control buttons and timebar
	players[containerID] = {
		tracks :  Array(), 
	 	playButton : container.find(".main-control .play"),
		pauseButton : container.find(".main-control .pause"),
		stopButton : container.find(".main-control .stop"),
		repeatButton : container.find(".main-control .repeat"),
		timebar : container.find(".main-control .timebar"),
		timebarWrapper : container.find(".main-control .timebar-wrapper"),
		canvas : container.find("canvas"),
		canvasToggle : container.find(".canvas-toggle"),
		firstTrack : null, 
		loadedAudio:0,
		playing:false, 
		canvasCleared:false,
		fft : Array(),
		canvasVisible:false,
		repeat : false
	};
	players[containerID].playButton.attr('container', containerID);
	players[containerID].pauseButton.attr('container', containerID);
	players[containerID].stopButton.attr('container', containerID);
	players[containerID].repeatButton.attr('container', containerID);
	players[containerID].timebar.attr('container', containerID);
	players[containerID].timebarWrapper.attr('container', containerID);
	players[containerID].canvas.attr('container', containerID);
	players[containerID].canvasToggle.attr('container', containerID);

	container.find(".tracks audio").each(function(i, value){
		var that = $(this);
		that.attr('container', containerID);
		players[containerID].tracks.push(that[0]);
		players[containerID].fft.push({});
		//load track
		that[0].load();
		that[0].addEventListener("canplaythrough", function() {
			players[containerID].loadedAudio++;
			if(players[containerID].loadedAudio==players[containerID].tracks.length) container.trigger("ready");
		}, false);
		that[0].addEventListener("error", function() {
			container.trigger("error", i+1);
		}, false);
		that.attr("index", i);
		/*that.bind('MozAudioAvailable', function(event, that) {
			initFFT(event, that);
		});*/
		if($.browser.mozilla) {
			that[0].addEventListener('loadedmetadata', loadedMetaData, false);
			that[0].addEventListener('MozAudioAvailable', initFFT, false);
		}
	});
	players[containerID].trackCount=players[containerID].tracks.length;
	players[containerID].firstTrack = players[containerID].tracks[0];
	container.on("ready", function(){
		$(this).addClass("ready");
	});
	container.on("error", function(e,i){
		$(this).addClass("error");
		$(this).find('.track:nth-child('+i+')').addClass("error");
	});
	
	//MUTE not active
	//----------------------------------------------
	container.on('click', '.tracks .track:not(.locked):not(.solo) .mute:not(.active) > a', function() {
		//switch button aspect
		var dad = $(this).parent();
		dad.addClass("active");
		dad.closest(".track").addClass("mute");
		
		//get track
		var track = $(this).closest('.track').find('audio:first')[0];
		
		//add volume to the track
		track.volume=0;
	});
	
	//MUTE active
	//----------------------------------------------
	container.on('click', '.tracks .track:not(.locked):not(.solo) .mute.active > a', function() {
		//switch button aspect
		var dad = $(this).parent();
		dad.removeClass("active");
		dad.closest(".track").removeClass("mute");
		
		//get track
		var track = $(this).closest('.track').find('audio:first')[0];
		
		//mute the track
		track.volume=1;
	});
	

	//SOLO not active
	//----------------------------------------------
	container.on('click', '.tracks .solo:not(.active) > a', function() {
		//switch button aspect
		var dad = $(this).parent();
		
		//mute all others
		dad.closest('.tracks').find(".track").removeClass("solo").addClass("locked").each(function() {
			//remove potential active solo track
			$(this).find(".solo.active").removeClass("active");

			//get track
			var track = $(this).find('audio:first')[0];
			track.volume=0;
		});

		dad.addClass("active");
		
		//remove locked class to my track and get audio track
		var track = dad.closest(".track").addClass("solo").removeClass("locked").find('audio:first')[0];
		
		//add volume to the track
		track.volume=1;

	});
	
	//SOLO active
	//----------------------------------------------
	container.on('click', '.tracks .solo.active > a', function() {
		//switch button aspect
		var dad = $(this).parent();
		
		//mute all others
		dad.closest('.tracks').find(".track").removeClass("locked solo").each(function() {
			//remove potential active solo track
			$(this).find(".solo.active").removeClass("active");

			//get track
			var track = $(this).find('audio:first')[0];
			if($(this).hasClass("mute"))
				track.volume=0;
			else
				track.volume=1;
		});
		dad.removeClass("active");
	});

	//PLAY
	//----------------------------------------------
	container.on('click', '.main-control .play:not(.active)', function() {
		var containerID = $(this).attr('container');
		players[containerID].pauseButton.removeClass("active");
		players[containerID].playButton.addClass("active");
		$.each(players[containerID].tracks, function(){
			this.play();
		});
		players[containerID].playing=true;
	});
	
	//LOAD
	//----------------------------------------------
	container.on('click', '.loading-link', function() {
		var container = $(this).closest(".audio-container");
		container.removeClass("waiting").find('audio').each(function(){
			$(this).attr("src", $(this).attr("url"));
		});
	});
	//REPEAT
	//----------------------------------------------
	container.on('click', '.main-control .repeat', function() {
		var containerID = $(this).attr('container');
		$(this).toggleClass("active");
		players[containerID].repeat = $(this).hasClass("active");
	});

	//PAUSE
	//----------------------------------------------
	container.on('click', '.main-control .play.active + .pause:not(.active)', function() {
		var containerID = $(this).attr('container');	
		players[containerID].playButton.removeClass("active");
		players[containerID].pauseButton.addClass("active");
		$.each(players[containerID].tracks, function(){
			this.pause();
		});
		players[containerID].playing=false;
	});
	
	//STOP
	//----------------------------------------------
	container.on('click', '.main-control .stop', function() {
		var containerID = $(this).attr('container');
		players[containerID].playButton.removeClass("active");
		players[containerID].pauseButton.removeClass("active");
		$.each(players[containerID].tracks, function(){
			this.pause();
			this.currentTime=0;
		});
		players[containerID].playing=false;
	});
	
	//CANVAS TOGGLE
	container.on('click', '.canvas-toggle', function() {
		var container = $("#"+$(this).attr('container')).toggleClass('canvas-opened');
		if(container.hasClass('canvas-opened')) {
			$(this).html("▲");
			players[container.attr('id')].canvasVisible = true;
		}
		else {
			$(this).html("▼");
			players[container.attr('id')].canvasVisible = false;
		}	
	});
	//SEEK BAR
	//----------------------------------------------
	container.on('click', '.main-control .timebar-wrapper', function(e) {
		var containerID = $(this).attr('container');
		//to be more sure : pause current playing
		players[containerID].tracks[0].pause();
		var myWidth = e.pageX - players[containerID].timebar.offset().left;
		var widthPercent = (myWidth*100)/players[containerID].timebarWrapper.width();
		timePercent = players[containerID].firstTrack.duration*widthPercent/100;
		
		//change the bar progression
		players[containerID].timebar.css('width', widthPercent+'%');
		
		//apply the wanted currentTime to all tracks
		//console.log((players[containerID].playing ? "playing":"not playing")+ ' currentTime='+timePercent+' => '+widthPercent+"%");
		
		for(var i=1;i<players[containerID].tracks.length;i++) {
			var trackI = players[containerID].tracks[i];
			trackI.currentTime=timePercent;
			//console.log('track['+i+'].currentTime='+trackI.currentTime+" != "+timePercent+' ????');
		
		}
		//apply the wanted current time to the first track (the observed one)
		players[containerID].tracks[0].currentTime=timePercent;	

		//play again if we were playing
		if(players[containerID].playing==true) players[containerID].tracks[0].play();
	});
	
	//TIME UPDATE
	//----------------------------------------------
	$(players[containerID].tracks[0]).bind('timeupdate', function() {
		var containerID = $(this).attr('container');
		
		//console.log("TIME UPDATE : "+players[containerID].firstTrack.currentTime);
		//change the bar progression
		players[containerID].timebar.css('width', ((players[containerID].firstTrack.currentTime*100) / players[containerID].firstTrack.duration)+'%');
	});

	$(players[containerID].tracks[0]).bind('ended', function() {
		//stop player if we terminate the track
		var containerID = $(this).attr('container');	
		players[containerID].stopButton.click();
		if(players[containerID].repeat)
			players[containerID].playButton.click();
	});
};
var constID = 0;
$(document).ready(function () {
	$("body").addClass("high-graphics");
	generateHierarchy($('body'));
	//loop through all audio container 
	$(".audio-container").each(function(){
		var myId = $(this).attr('id'); 
		if(!myId){
			myId = "generated-audio-container-" + constID; 
			$(this).attr('id', myId);
			constID++;
		}
		//create the player for this container
		initPlayer(myId);
	});
});
