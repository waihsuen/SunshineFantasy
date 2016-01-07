var audioContext = new AudioContext(),
    time = new Date().getTime(),
    intervalID = 0,
    animationFrame = 0,
    isPlaying = false;

var animationFrame = function () {
    var now = new Date().getTime();

    seismograph.canvasUpdate();
    animationFrameID = window.requestAnimationFrame(animationFrame);
}


$(function () {
    // SINGLETON
    seismograph.init('seismograph'); // PASS IN THE DIV LAYER ID
    micInput.init(seismograph, 'micFreq'); // INPUT THE MIC FREQ ID (can be anything)
    seismograph.createNeedleHead(micInput.freqCallbackID, seismograph.drawType.dots, 'rgba(125, 125, 125, 0.6)');
    
    
    init();
    animate();
    
    $('#startBtn').one('click', function (e) {
        e.preventDefault();
        if(isPlaying) {
            stopPlay();
            micInput.stopMic();
        } else {
            startPlay();
            micInput.startMic();
        }
        
        $('#startBtn').css({'display' : 'none'});
    });
    
});


var startPlay = function() {
    $('#startBtn').html('Stop Playing');
    isPlaying = true;
    
    intervalID = setInterval(seismograph.fireEvery500ms, 500);
    animationFrame();
}

var stopPlay = function() {
    $('#startBtn').html('Start Playing');
    isPlaying = false;
    
    clearInterval(intervalID);
    window.cancelAnimationFrame(animationFrameID);
}