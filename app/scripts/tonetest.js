console.log('\'Allo \'Allo!');


//create one of Tone's built-in synthesizers and connect it to the master output
var synth = new Tone.SimpleSynth().toMaster();

//play a middle c for the duration of an 8th note
//synth.triggerAttackRelease("C4", "8n");


var notes = ["A5", "D5", "E5", "F5", "B5", "G5", "A5", "C5"];
var position = 0;


var dist = new Tone.Distortion().toMaster();
var synth = new Tone.SimpleSynth().connect(dist);
var voicesynth = new Tone.PolySynth(4, Tone.MonoSynth);
var drumsynth = new Tone.DrumSynth().toMaster();


Tone.Transport.setInterval(function (time) {
    var note = notes[position++];
    position = position % notes.length;
    synth.triggerAttackRelease(note, 0.25, time);
}, 0.5);

Tone.Transport.setInterval(function (time) {
    //drumsynth.triggerAttackRelease("C3", "8n", time);
}, 0.8);

//the transport won't start firing events until it's started
//Tone.Transport.start();


////a polysynth composed of 6 Voices of MonoSynth
//var voicesynth = new Tone.PolySynth(6, Tone.MonoSynth).toMaster();
////set the attributes using the set interface
//voicesynth.set("detune", -1200);
////play a chord
//voicesynth.triggerAttackRelease(["C4", "E4", "A4"], "4n");

var mainData = {};

$(document).ready(function () {
    $.getJSON('http://api.giphy.com/v1/gifs/search?q=funny+cat&api_key=dc6zaTOxFJmzC', function (data) {
        mainData = data;
        //
        $('#mainContainer').css({'background-image' : 'url('+mainData.data[0].images.fixed_height.url+')'});
    });

});