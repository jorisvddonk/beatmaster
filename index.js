import JSZip from 'jszip';
import Vue from 'vue';
import FileSaver from 'file-saver';

require('aframe');
require('super-hands');
require('./shaders/skyGradient.js');
var beatSaverAPI = require('./beatsaver_api.js');
var trackVisualization = require('./track-visualization.js');
var trackAnalytics = require('./track-analytics.js');

var url = require('url');
var parsedURL = url.parse(document.location.toString(), true);
var songURL = undefined;

var getSongURL = function() {
    return new Promise(function(resolve, reject) {
        setTimeout(function(){ // TODO: get rid of this and call getSongURL() after DOMReady
            if (parsedURL.query.songlocation) {
                songURL = parsedURL.query.songlocation;
                resolve(songURL);
            } else {
                reject("Please specify a song URL via the 'songlocation' query string parameter!");
            }
        });
    });
};

var setStage = function(stageName) {
    var st = document.getElementById('title');
    var ss = document.getElementById('select_song');
    var sd = document.getElementById('select_difficulty');

    if (stageName === 'play' || stageName === 'none') {
        ss.setAttribute('visible', false);
        sd.setAttribute('visible', false);
        setTitle('');
    } else if (stageName === 'selectSong') {
        ss.setAttribute('visible', true);
        sd.setAttribute('visible', false);
        setTitle('Select a song');
    } else if (stageName === 'selectDifficulty') {
        ss.setAttribute('visible', false);
        sd.setAttribute('visible', true);
        setTitle('Select a difficulty');
    }
}

var songParser = getSongURL().catch(function(e){
    return new Promise(function(resolve, reject){
        beatSaverAPI().then(function(data){
            setStage('selectSong');
            var ss = document.getElementById('select_song');
            data.songs.forEach(function(song, i) {
                var elem = document.createElement('a-entity');
                var text = document.createElement('a-entity');
                elem.setAttribute('gaze-tracker', '');
                elem.setAttribute('class', 'interactable');
                elem.appendChild(text);
                text.setAttribute('text', 'color', '#fff');
                text.setAttribute('text', 'align', 'center');
                var title = new DOMParser().parseFromString(song.name, 'text/html').documentElement.textContent;
                text.setAttribute('text', 'value', title);
                text.setAttribute('text', 'opacity', '1');
                text.setAttribute('text', 'lineHeight', '40');
                elem.setAttribute('position', {x: 0, y: i * 0.1, z: 0.0});
                elem.setAttribute('geometry', {primitive: 'plane', width: 1.0, height: 0.09})
                elem.setAttribute('material', {opacity: 0.5})
                elem.addEventListener('select', function(){
                    resolve(song.downloadUrl);
                    setStage('none');
                });
                ss.appendChild(elem);
            });
        }).catch(function(e){reject(e)});
    });
}).then(fetch).then(function(x){return JSZip.loadAsync(x.blob())});

var setTitle = function(title){
    document.getElementById('title').setAttribute('visible', true);
    document.getElementById('title').setAttribute('text', 'value', title.toString());
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
var COLORS = ['#fff', '#333'];
var infoMetaData = undefined;
var songMetaData = undefined;
var lastFocusForController = new Map();

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
        if (note._type == 0 || note._type == 1) {
            var box = document.createElement('a-box');
            box.setAttribute('position', getPositionForNote(note));
            box.setAttribute('scale', `${BOXSIZE} ${BOXSIZE} ${BOXSIZE}`);
            box.setAttribute('material', 'color', note._type == 0 ? RED : BLUE)
            if (note._cutDirection != 8) {
                box.setAttribute('material', 'src', '#dir_0');
            }
            box.setAttribute('rotation', '0 0 ' + BOXROTATIONS[note._cutDirection]);
            return box;
        } else if (note._type == 3) {
            var sphere = document.createElement('a-sphere');
            sphere.setAttribute('position', getPositionForNote(note));
            sphere.setAttribute('radius', `${BOXSIZE*0.5}`);
            sphere.setAttribute('material', 'color', '#444')
            return sphere;
        }
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
            return {
                filejson: filejson,
                jszip: jszip
            };
        });
    })
}).then(function(data){
    var selectedDifficulty;
    return new Promise(function(resolve, reject) {
        var songDifficulty = undefined;
        if (parsedURL.query.difficulty) {
            songDifficulty = parsedURL.query.difficulty;
        }

        if (songDifficulty) {
            // use difficulty provided by query string parameter
            selectedDifficulty = data.filejson.difficultyLevels.find(function(difficulty){
                return difficulty.difficulty.toLowerCase() === songDifficulty.toLowerCase();
            });
            if (selectedDifficulty) {
                data.selectedDifficulty = selectedDifficulty;
                resolve(data);
            } else {
                reject(new Error("Could not find difficulty " + songDifficulty + "!"));
            }
        } else {
            // show UI
            setStage('selectDifficulty');
            var sd = document.getElementById('select_difficulty');
            data.filejson.difficultyLevels.forEach(function(difficulty, i) {
                var elem = document.createElement('a-entity');
                var text = document.createElement('a-entity');
                elem.setAttribute('gaze-tracker', '');
                elem.setAttribute('class', 'interactable');
                elem.appendChild(text);
                text.setAttribute('text', 'color', '#fff');
                text.setAttribute('text', 'align', 'center');
                var title = new DOMParser().parseFromString(difficulty.difficulty, 'text/html').documentElement.textContent;
                text.setAttribute('text', 'value', title);
                text.setAttribute('text', 'opacity', '1');
                text.setAttribute('text', 'lineHeight', '40');
                elem.setAttribute('position', {x: 0, y: 0.5 + i * 0.1, z: 0.0});
                elem.setAttribute('geometry', {primitive: 'plane', width: 1.0, height: 0.09})
                elem.setAttribute('material', {opacity: 0.5})
                elem.addEventListener('select', function(){
                    data.selectedDifficulty = difficulty;
                    setStage('none');
                    resolve(data);
                });
                sd.appendChild(elem);
            });
        }
    });
}).then(function(data){
    var selectedDifficulty = data.selectedDifficulty;
    var jszip = data.jszip;
    var filejson = data.filejson;

    var trackjsonfilename = selectedDifficulty.jsonPath;
    var audiofilename = selectedDifficulty.audioPath;
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
            audioElem.onpause = function() {
                playing = false;
            };
            document.body.appendChild(audioElem);
            return audioElem;
        }).catch(showError);
    });
    return Promise.all([getTrackDetails, getAudio]).then(function(results){
        return {
            track_info: filejson,
            track_data: results[0],
            audioElement: results[1],
            zip: jszip,
            difficulty: selectedDifficulty
        }
    });
}).then(function(data){
    console.log(data);
    data.audioElement.play();
    var analytics = trackAnalytics(data.track_info, data.track_data);
    var appdata = Object.assign({
        expandStats: true,
        difficulty: data.difficulty
    }, analytics);
    var app = new Vue({
        el: '#stats',
        data: appdata,
        filters: {
            float: function(i){
                return i.toFixed(2);
            }
        },
        methods: {
            download: function(){
                data.zip.generateAsync({type:"blob"}).then(function (blob) {
                    var filename = songURL.split('/').pop();
                    FileSaver.saveAs(blob, filename);
                });
            },
            toggleExpandStats: function() {
                this.expandStats = !this.expandStats;
            },
            playPause: function() {
                if (data.audioElement.paused) {
                    data.audioElement.play();
                } else {
                    data.audioElement.pause();
                }
            }
        }
    });
    trackVisualization(data);
    document.getElementById('stats').style.display = ''; // show element
}).catch(showError);

var getController = function (evt) {
    return 'TODO_SUPPORT_MULTIPLE_CONTROLLERS';
}

AFRAME.registerComponent('gaze-tracker', {
    init: function () {
        this.el.setAttribute('material', 'color', COLORS[1]);
        this.el.addEventListener('mouseover', function (evt) {
            var last = lastFocusForController.get(getController(evt));
            if (last) {
                last.setAttribute('material', 'color', COLORS[1]);
            }
            lastFocusForController.set(getController(evt), evt.target);
            this.setAttribute('material', 'color', COLORS[0]);
        });
        this.el.addEventListener('mouseout', function (evt) {
            lastFocusForController.delete(getController(evt));
            this.setAttribute('material', 'color', COLORS[1]);
        });
    }
});

AFRAME.registerComponent('vr-ctrl', {
    init: function () {
        var handle = function (controller) {
            var tile = lastFocusForController.get(controller);
            if (tile) {
                var evt = new Event('select');
                tile.dispatchEvent(evt);
            }
        }
        window.addEventListener('keydown', function (evt) { // handle spacebar
            if (evt.keyCode === 32) {
                handle('TODO_SUPPORT_MULTIPLE_CONTROLLERS');
            }
        })
        this.el.addEventListener('triggerdown', function (evt) { // handle controller trigger down
            handle('TODO_SUPPORT_MULTIPLE_CONTROLLERS');
        });
    }
});


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