import JSZip from 'jszip';

require('aframe');
require('./shaders/skyGradient.js');
var songURL = require('./data/song.zip');

var songParser = fetch(songURL).then(function(x){return JSZip.loadAsync(x.blob())});

var setTitle = function(title){
    document.getElementById('song_title').setAttribute('text', 'value', title.toString());
};
var showError = function(err){
    console.error(err);
    setTitle(err);
};

var getFileInZip = function(jszip, filename) {
    return new Promise(function(resolve, reject){
        for (var i in jszip.files) {
            var file = jszip.files[i];
            if (file.name.split('/').pop().toLowerCase() === filename.toLowerCase()) {
                resolve(file);
                break;
            }
        }
        reject('file not found');
    });
};

var BOXSIZE = 1;
var RED = '#f00';
var BLUE = '#00f';
var getPositionForNote = function(note) {
    // TODO: verify that this is correct :)
    return {
        y: BOXSIZE * note._lineLayer,
        x: BOXSIZE * note._lineIndex - BOXSIZE * 2,
        z: -note._time
    }
}

var displayTrack = function(trackdetails) {
    var noteElements = trackdetails._notes.map(note => {
        var box = document.createElement('a-box');
        box.setAttribute('position', getPositionForNote(note));
        console.log(note)
        box.setAttribute('material', 'color', note._type == 0 ? RED : BLUE)
        return box;
    });

    noteElements.forEach(element => {
        document.getElementById('notes').appendChild(element);
    });
};

songParser.then(function(jszip){
    getFileInZip(jszip, 'info.json').then(function(file){
        return file.async('text').then(function(filedetails){
            var filejson = JSON.parse(filedetails);
            var title = `${filejson.songName} - ${filejson.songSubName} (by ${filejson.authorName})`;
            setTitle(title);
            console.log(filejson)
            var trackjsonfilename = filejson.difficultyLevels[filejson.difficultyLevels.length-1].jsonPath;
            console.log("Loading... " + trackjsonfilename);
            getFileInZip(jszip, trackjsonfilename).then(function(trackjsonfile){
                return trackjsonfile.async('text').then(function(filedetails){
                    var trackjson = JSON.parse(filedetails);
                    displayTrack(trackjson);
                });
            }).catch(showError);
        });
    }).catch(showError);
}).catch(showError);
