module.exports = function(track_info, track_data) {
    var ordered_notes = track_data._notes.sort(function(a,b){
        if (a._time < b._time) {
            return -1;
        } else if (a._time > b._time) {
            return 1;
        }
        return 0;
    });
    var tempNotes = ordered_notes.map(function(note){return note._time});
    var gaps = [];
    for (var i = 1; i < tempNotes.length; i++) {
        gaps.push(tempNotes[i] - tempNotes[i-1]);
    }
    gaps.sort(function(a,b){return a > b});

    var convertBeatsToSeconds = function(beats) {
        return beats * (60 / track_data._beatsPerMinute);
    };
    var getLongestGap = function() {
        return gaps[gaps.length-1];
    };
    var getShortestGap = function() { // shortest non-0 gap
        return gaps.reduce(function(memo, gap) {
            if (gap > 0 && memo === 0) {
                return gap;
            }
            return memo;
        }, 0);
    };

    var getNumberOfBombs = function() {
        return track_data._notes.reduce(function(memo, note){
            if (note._type === 3) {
                memo += 1;
            }
            return memo;
        }, 0);
    };

    var getNumberOfNotes = function() {
        return track_data._notes.reduce(function(memo, note){
            if (note._type == 0 || note._type == 1) {
                memo += 1;
            }
            return memo;
        }, 0);
    };

    var getNumberOfObstacles = function() {
        return track_data._obstacles.length;
    };

    var getNumberOfEvents = function() {
        return track_data._events.length;
    };

    return {
        track_info: track_info,
        track_data: track_data,
        longest_gap: getLongestGap(),
        shortest_gap: getShortestGap(),
        longest_gap_sec: convertBeatsToSeconds(getLongestGap()),
        shortest_gap_sec: convertBeatsToSeconds(getShortestGap()),
        number_notes: getNumberOfNotes(),
        number_bombs: getNumberOfBombs(),
        number_obstacles: getNumberOfObstacles(),
        number_events: getNumberOfEvents()
    }
}