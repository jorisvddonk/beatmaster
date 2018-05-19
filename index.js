import JSZip from 'jszip';

require('aframe');
require('./shaders/skyGradient.js');
var url = require('url');
var parsedURL = url.parse(document.location.toString(), true);
var songURL = undefined;
if (parsedURL.query.songlocation) {
    songURL = parsedURL.query.songlocation;
} else {
    alert("Please specify a song URL via the 'songlocation' query string parameter!");
};

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
var songMetaData = undefined;

var getPositionForNote = function(note) {
    var time = note._time * 4;
    return {
        y: BOXSIZE * note._lineLayer,
        x: BOXSIZE * note._lineIndex - BOXSIZE * 2,
        z: -time * BOXSIZE
    }
}

var playing = false;

var displayTrack = function(trackdetails) {
    var noteElements = trackdetails._notes.map(note => {
        var box = document.createElement('a-box');
        box.setAttribute('position', getPositionForNote(note));
        box.setAttribute('material', 'color', note._type == 0 ? RED : BLUE)
        box.setAttribute('material', 'src', '#dir_' + note._cutDirection);
        return box;
    });

    noteElements.forEach(element => {
        document.getElementById('notes').appendChild(element);
    });
};

AFRAME.registerComponent('game-track', {
    init: function() {
    },
    tick: function(time, timeDelta) {
        if (playing) {
            var pos = this.el.getAttribute('position');
            pos.z += 0.1;
            this.el.setAttribute('position', pos);
        }
    }
});

songParser.then(function(jszip){
    getFileInZip(jszip, 'info.json').then(function(file){
        return file.async('text').then(function(filedetails){
            var filejson = JSON.parse(filedetails);
            var title = `${filejson.songName} - ${filejson.songSubName} (by ${filejson.authorName})`;
            setTitle(title);
            console.log(filejson);
            songMetaData = filejson;
            var trackjsonfilename = filejson.difficultyLevels[filejson.difficultyLevels.length-1].jsonPath;
            console.log("Loading... " + trackjsonfilename);
            getFileInZip(jszip, trackjsonfilename).then(function(trackjsonfile){
                return trackjsonfile.async('text').then(function(filedetails){
                    var trackjson = JSON.parse(filedetails);
                    displayTrack(trackjson);
                    playing = true;
                });
            }).catch(showError);
        });
    }).catch(showError);
}).catch(showError);


/*
  Define custom behaviour for Hot Module Replacement
  A-Frame exposes no API for unregistering components, unfortunately.
  Therefore, we'll just reload the entire page whenever:
  * This module is about to be replaced
  * Any of this module's dependencies were just updated
  An error is thrown in both functions to prevent this module from getting reloaded in a split-second.
*/
if (module.hot) {
    module.hot.dispose(function() {
      // module is about to be replaced
      window.location.reload();
      throw new Error('Hot Module Reloading not supported!');
    });
    module.hot.accept(function() {
      // module or one of its dependencies was just updated
      window.location.reload();
      throw new Error('Hot Module Reloading not supported!');
    });
}