module.exports = function(track_info, track_data) {
    return {
        track_info: track_info,
        track_data: track_data,

        track_songname: track_info.songName,
        track_songsubname: track_info.songSubName,
        track_author: track_info.authorName,
        bpm: track_data._beatsPerMinute
    }
}