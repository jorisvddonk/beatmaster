import JSZip from 'jszip';

require('aframe');
require('./shaders/skyGradient.js');

var songParser = fetch('http://127.0.0.1:8081/data/song.zip').then(function(x){return JSZip.loadAsync(x.blob())});

songParser.then(function(jszip){
    for (var i in jszip.files) {
        var file = jszip.files[i];
        if (file.name.split('/').pop().toLowerCase() === 'info.json') {
            file.async('text').then(function(filedetails){
                var filejson = JSON.parse(filedetails);
                var title = `${filejson.songName} - ${filejson.songSubName} (by ${filejson.authorName})`;
                document.getElementById('song_title').setAttribute('text', 'value', title);
            });
        }
    };
});
