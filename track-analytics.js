module.exports = function(track_info, track_data) {
    var ordered_notes = track_data._notes.sort(function(a,b){
        if (a._time < b._time) {
            return -1;
        } else if (a._time > b._time) {
            return 1;
        }
        return 0;
    });
    var getLongestGap = function() {
        var gap = 0; // time in beats
        for (var i = 1; i < ordered_notes.length; i++) {
            var thisGap = ordered_notes[i]._time - ordered_notes[i-1]._time;
            if (thisGap > gap) {
                gap = thisGap;
            }
        }
        return gap * (60 / track_data._beatsPerMinute);
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
        number_notes: getNumberOfNotes(),
        number_bombs: getNumberOfBombs(),
        number_obstacles: getNumberOfObstacles(),
        number_events: getNumberOfEvents()
    }
}