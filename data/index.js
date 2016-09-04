const fs = require('fs');
const _ = require('underscore');

const data = {};

fs.readdirSync(__dirname).forEach(function (filename) {
  filename = /^([^.]+)\.list$/.exec(filename);
  if (filename) {
    const name = filename[1];
    exports[name] = function (n) {
      let list = data[name];
      if (!list) {
        list = fs
          .readFileSync(__dirname + `/${name}.list`)
          .toString('utf8')
          .split('\n')
          .filter(line => line.trim());
        data[name] = list;
      }
      return _.sample(list, n)
    }
  }
});
