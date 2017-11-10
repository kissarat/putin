const request = require('request');
require('colors');

module.exports = {
  request: function (url) {
    return new Promise(function (resolve, reject) {
      request('https://web.archive.org/save/' + url, function (err, response) {
        const time = new Date().toISOString()
        if (response && response.body) {
          console.log(time, url, response.body.toString().length)
        }
        else {
          console.error(time, url.red)
        }
        if (err) {
          reject(err);
        }
        else {
          resolve({
            status: response.statusCode,
            // body: response.body
          })
        }
      })
    })
  }
};
