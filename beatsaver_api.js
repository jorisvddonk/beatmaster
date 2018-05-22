var url = require('url');

module.exports = function(mode, offset) {
  if (offset === undefined) {
    offset = 0;
  }
  if (mode === undefined) {
    mode = 'top';
  }
  var parsedURL = url.parse(document.location.toString(), true);
  var apiURL = `https://beatsaver.com/api.php?mode=${mode}&off=${offset}`;
  if (parsedURL.query.DEVELOP) { // if DEVELOP query string parameter is used, use a different URL to prevent sending traffic to beatsaver.com during development.
    apiURL = 'http://localhost:8081/data/example.json';
  }
  return fetch(apiURL).then(function(res){return res.json()});
};
