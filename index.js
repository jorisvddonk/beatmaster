import JSZip from 'jszip';

require('aframe');
require('./shaders/skyGradient.js');

var songParser = fetch('http://127.0.0.1:8081/data/song.zip').then(function(x){return JSZip.loadAsync(x.blob())});

var getFileInZip = function(jszip, filename) {
    return new Promise(function(resolve, reject){
        for (var i in jszip.files) {
            var file = jszip.files[i];
            if (file.name.split('/').pop().toLowerCase() === filename) {
                resolve(file);
                break;
            }
        }
        reject('file not found');
    });
}

songParser.then(function(jszip){
    getFileInZip(jszip, 'info.json').then(function(file){
        file.async('text').then(function(filedetails){
            var filejson = JSON.parse(filedetails);
            console.log(filejson);
            var title = `${filejson.songName} - ${filejson.songSubName} (by ${filejson.authorName})`;
            document.getElementById('song_title').setAttribute('text', 'value', title);
        });
    });
});
