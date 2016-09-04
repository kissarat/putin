const pg = require('pg');

const pool = new pg.Pool({
  user: 'crawl',
  password: 'crawl',
  database: 'crawl'
});

exports.query = function(sql, params) {
  return new Promise(function (resolve, reject) {
    pool.connect(function (err, client, done) {
      if (err) {
        reject(err);
        console.error(err);
      }
      else {
        client.query(sql, params, function (err, result) {
          done();
          if (err) {
            reject(err);
          }
          else {
            resolve(result.rows);
          }
        })
      }
    })
  });
};
