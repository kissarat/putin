const query = require('./db').query;
const archive_is = require('archive.is');

query('SELECT path FROM url ORDER BY id DESC')
  .then(function (rows) {
    const urls = rows.map(url => url.path);

    function archive() {
      const url = urls.pop();
      if (url) {
        archive_is.save('http://forum.ru-board.com/' + url)
          .then(function () {
            console.log(url);
            archive()
          })
          .catch(function (err) {
            console.error(err);
            archive()
          })
      }
    }

    for (let i = 0; i < 6; i++) {
      setTimeout(archive, i * 1000);
    }
  })
  .catch(function (err) {
    console.error(err);
  });
