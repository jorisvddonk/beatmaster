import JSZip from 'jszip';
import Vue from 'vue';

require('aframe');
require('./shaders/skyGradient.js');
var trackAnalytics = require('./track-analytics.js');

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

var CELLSIZE = 0.33; // size of the cell surrounding a box
var BOXSIZE = 0.25; // size of the box itself
var OFFSET_Y = 1;
var OFFSET_Z = -7;
var RED = '#f00';
var BLUE = '#00f';
var infoMetaData = undefined;
var songMetaData = undefined;

var getPositionForNote = function(note) {
    var time = note._time * 4;
    return {
        y: (CELLSIZE * note._lineLayer) + OFFSET_Y,
        x: CELLSIZE * note._lineIndex - CELLSIZE * 2,
        z: (-time + OFFSET_Z) * CELLSIZE
    }
}

var playing = false;

var BOXROTATIONS = {
    0: 0, // up
    1: 180, // down
    2: 90, // left
    3: -90, // right
    4: 45, // up left
    5: -45, // up right
    6: 180 - 45, // down left
    7: 180 + 45, // down right
    8: 0 // no direction
}
var displayTrack = function(trackdetails) {
    var noteElements = trackdetails._notes.map(note => {
        var box = document.createElement('a-box');
        box.setAttribute('position', getPositionForNote(note));
        box.setAttribute('scale', `${BOXSIZE} ${BOXSIZE} ${BOXSIZE}`);
        box.setAttribute('material', 'color', note._type == 0 ? RED : BLUE)
        if (note._cutDirection != 8) {
            box.setAttribute('material', 'src', '#dir_0');
        }
        box.setAttribute('rotation', '0 0 ' + BOXROTATIONS[note._cutDirection]);
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
            var timedelta_sec = timeDelta / 1000;
            var move_in_1_minute = ((songMetaData._beatsPerMinute * 4) * CELLSIZE);
            var move = move_in_1_minute / 60 * timedelta_sec;
            var pos = this.el.getAttribute('position');
            pos.z += move;
            this.el.setAttribute('position', pos);
        }
    }
});

AFRAME.registerComponent('remove-hand-controls', {
    init: function() {},
    tick: function(time) {
        // remove default hand model
        var obj3d = this.el.getObject3D('mesh');
        if (obj3d) {
            this.el.removeObject3D('mesh');
            this.el.removeAttribute('remove-hand-controls'); // once default hand model is removed; remove this component
        }
    }
});

songParser.then(function(jszip){
    return getFileInZip(jszip, 'info.json').then(function(file){
        return file.async('text').then(function(filedetails){
            var filejson = JSON.parse(filedetails);
            var title = `${filejson.songName} - ${filejson.songSubName} (by ${filejson.authorName})`;
            setTitle(title);
            infoMetaData = filejson;
            var trackjsonfilename = filejson.difficultyLevels[filejson.difficultyLevels.length-1].jsonPath;
            var audiofilename = filejson.difficultyLevels[filejson.difficultyLevels.length-1].audioPath;
            console.log("Loading... " + trackjsonfilename + ' // ' + audiofilename);
            var getTrackDetails = getFileInZip(jszip, trackjsonfilename).then(function(trackjsonfile){
                return trackjsonfile.async('text').then(function(filedetails){
                    var trackjson = JSON.parse(filedetails);
                    songMetaData = trackjson;
                    displayTrack(trackjson);
                    return trackjson;
                });
            }).catch(showError);
            var getAudio = getFileInZip(jszip, audiofilename).then(function(audiofile){
                return audiofile.async('base64').then(function(b64data){
                    var audioElem = document.createElement('audio');
                    audioElem.setAttribute('id', 'audio');
                    var format = audiofilename.toLowerCase().endsWith('mp3') ? 'mp3' : 'ogg';
                    audioElem.setAttribute('src', `data:audio/${format};base64,${b64data}`);
                    audioElem.onplay = function() {
                        playing = true;
                    };
                    document.body.appendChild(audioElem);
                    return audioElem;
                }).catch(showError);
            });
            return Promise.all([getTrackDetails, getAudio]).then(function(results){
                return {
                    track_info: filejson,
                    track_data: results[0],
                    audioElement: results[1]
                }
            });
        });
    }).catch(showError);
}).then(function(data){
    console.log(data);
    data.audioElement.play();
    var analytics = trackAnalytics(data.track_info, data.track_data);
    var app = new Vue({
        el: '#stats',
        data: analytics,
        filters: {
            float: function(i){
                return i.toFixed(2);
            }
        }
    });
    document.getElementById('stats').style.display = ''; // show element
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