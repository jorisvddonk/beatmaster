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

var displayTrack = function(trackdetails) {
    console.log(trackdetails); //todo
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
