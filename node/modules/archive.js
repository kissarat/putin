const request = require('request');

module.exports = {
  request: function (url) {
    return new Promise(function (resolve, reject) {
      request(url, function (err, response) {
        if (err) {
          reject(err);
        }
        else {
          resolve({status: response.statusCode})
        }
      })
    })
  }
};
