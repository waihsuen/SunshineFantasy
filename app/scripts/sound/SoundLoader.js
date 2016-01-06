"use strict";

function SoundLoader(filepath, seismograph, freqCallbackID) {
    this.requestFile(filepath);
    this.freqCallback = seismograph.freqCallback;
    this.freqCallbackID = freqCallbackID;
}

SoundLoader.prototype = {
    gain_node: null,
    audioBuffer: null,
    outputFreq: null,
    audioprocess: null,
    soundSourceNode: null,

    requestFile: function (filePath) {
        var request = new XMLHttpRequest(),
            _this = this;

        request.open('GET', filePath, true);
        request.responseType = 'arraybuffer';
        request.onload = function () {
            audioContext.decodeAudioData(request.response, function (buffer) {
                _this.audioBuffer = buffer;
                $('#mainContainer').trigger('Sound_LoadCompleted');
            });
        }
        request.send();
    },

    startSound: function () {
        this.gain_node = null;
        this.soundSourceNode = null;
        this.audioprocess = null;

        var script_processor_node = null,
            script_processor_fft_node = null,
            sampleFrame = 8192, //256, 512, 1024, 2048, 4096, 8192, 16384
            tone = null,
            pitchAnalyzer = new PitchAnalyzer(44100),
            _this = this;

        // CREATE A GAIN AND CONNECT TO OUTPUT
        this.gain_node = audioContext.createGain();
        this.gain_node.connect(audioContext.destination);
        this.gain_node.gain.value = 1;

        // FFT
        script_processor_fft_node = audioContext.createScriptProcessor(sampleFrame, 1, 1);
        //
        this.audioprocess = function (audioProcessingEvent) {
            pitchAnalyzer.input(audioProcessingEvent.inputBuffer.getChannelData(0));
            pitchAnalyzer.process();
            tone = pitchAnalyzer.findTone();
            if (tone) {
                _this.freqCallback(Math.round(tone.freq), _this.freqCallbackID);
                tone = null;
            }
        }
        
        script_processor_fft_node.onaudioprocess = this.audioprocess;
        script_processor_fft_node.connect(this.gain_node);

        // Stream -> Gain -> FFT -> Destination
        this.gain_node.connect(script_processor_fft_node);
        //
        this.soundSourceNode = audioContext.createBufferSource();
        this.soundSourceNode.buffer = this.audioBuffer;
        this.soundSourceNode.loop = false;
        this.soundSourceNode.connect(this.gain_node)
        //
        this.soundSourceNode.onended = function () {
            _this.soundSourceNode.stop();
            _this.soundSourceNode = null;
            $('#mainContainer').trigger('Sound_PlayCompleted');
        }
        //
        this.soundSourceNode.start();
    },

    stopSound: function () {
        this.soundSourceNode.stop();
    },
    muteSound: function () {
        if (this.gain_node) {
            this.gain_node.gain.value = 0;
        }
    },
    unmuteSound: function () {
        if (this.gain_node) {
            this.gain_node.gain.value = 1;
        }
    }
};