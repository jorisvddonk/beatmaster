module.exports = function(mode, offset) {
  if (offset === undefined) {
    offset = 0;
  }
  if (mode === undefined) {
    mode = 'top';
  }
  return fetch(`https://beatsaver.com/api.php?mode=${mode}&off=${offset}`).then(function(res){return res.json()});
};
