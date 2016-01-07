"use strict";

var shakeLevel = '',
    shattervalue = 0,
    hasExploded = false,
    heightCounter = 0,
    heightTotal = 0,
    maxPitchToShatter = 580;

var micInput = {
    microphone_stream: null,
    audioprocess: null,
    freqCallback: null,
    freqCallbackID: null,
    
    init: function(seismograph, freqCallbackID) {
        micInput.freqCallback = seismograph.freqCallback;
        micInput.freqCallbackID = freqCallbackID;
    },

    startMic: function () {
        getUserMedia({
                'audio': {
                    'mandatory': {
                        'googEchoCancellation': 'false',
                        'googAutoGainControl': 'false',
                        'googNoiseSuppression': 'false',
                        'googHighpassFilter': 'false'
                    },
                    'optional': []
                },
            }, micInput.start_microphoneStream,
            function (e) {
                alert('Error capturing audio: ' + e);
            });
    },
    
    start_microphoneStream: function (stream) {
        micInput.audioprocess = null;
        micInput.microphone_stream = null;
        
        var gain_node = null,
            script_processor_node = null,
            script_processor_fft_node = null,
            sampleFrame = 4096, //256, 512, 1024, 2048, 4096, 8192, 16384
            tone = null,
            toneFreqRounded = 0,
            pitchAnalyzer = new PitchAnalyzer(44100),
            _this = micInput;
        
        // CREATE A GAIN AND CONNECT TO OUTPUT
        gain_node = audioContext.createGain();
        gain_node.connect(audioContext.destination);
        gain_node.gain.value = 1;
        
        // FFT
        script_processor_fft_node = audioContext.createScriptProcessor(sampleFrame, 2, 2);
        //
        micInput.audioprocess = function (audioProcessingEvent) {
            // FFT in frequency domain
            if (micInput.microphone_stream.playbackState == micInput.microphone_stream.PLAYING_STATE) {
                //console.log(audioProcessingEvent.inputBuffer);
                pitchAnalyzer.input(audioProcessingEvent.inputBuffer.getChannelData(0));
                pitchAnalyzer.process();
                tone = pitchAnalyzer.findTone();
                if (tone) {
                    _this.freqCallback(Math.round(tone.freq), _this.freqCallbackID);
                }
                
                pitchAnalyzer.input(audioProcessingEvent.inputBuffer.getChannelData(1));
                pitchAnalyzer.process();
                tone = pitchAnalyzer.findTone();
                if (tone) {
                    toneFreqRounded = Math.round(tone.freq);
                    _this.freqCallback(toneFreqRounded, _this.freqCallbackID);
                    
                    heightCounter++;
                    heightTotal += toneFreqRounded;
                    
                    //console.log(toneFreqRounded);
                    if (toneFreqRounded <= maxPitchToShatter && !hasExploded) {
                        //console.log(Math.round(Math.random()*(toneFreqRounded%255)));
                        //console.log(toneFreqRounded);
                        //
                        
                        //
                        $('#backgroundColor')
                            .css('background-color', 'rgb('+
                                 Math.round(Math.random()*(toneFreqRounded%255)) + ','+
                                 Math.round(Math.random()*(toneFreqRounded%255)) + ','+
                                 Math.round(Math.random()*(toneFreqRounded%255)) + ')');
                        
                        
                        if (toneFreqRounded <= 100) {
                            shakeLevel = 'small';
                            shattervalue = 0;
                        } else {
                            shakeLevel = 'mid';
                        }
                        
                    } else {
                        shakeLevel = 'big';
                        shattervalue ++;
                        $('#backgroundColor').css('background-color', 'red');
                    }
                    
                } else {
                    // NO TONE
                    if (!hasExploded) {
                        toneFreqRounded = 0;
                        shattervalue = 0;
                        shakeLevel = '';
                        //heightCounter = 1;
                        //heightTotal = 1;
                        
                        $('#backgroundColor').css('background-color', 'ghostwhite');
                    }
                    
                }
            }
        }
        
        script_processor_fft_node.onaudioprocess = micInput.audioprocess;
        script_processor_fft_node.connect(gain_node);
        
        // Stream -> FFT -> Gain -> Destination
        micInput.microphone_stream = audioContext.createMediaStreamSource(stream);
        micInput.microphone_stream.connect(script_processor_fft_node);
        //microphone_stream.connect(gain_node);
    },
    
    stopMic: function () {
        micInput.microphone_stream.disconnect();
    }
};

function getUserMedia(dictionary, callback) {
    try {
        navigator.getUserMedia = navigator.getUserMedia || 
            navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

        navigator.getUserMedia(dictionary, callback, function () {
            alert('Stream generation failed.', e);
        });
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}