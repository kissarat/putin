const fs = require('fs');
const _ = require('underscore');

const data = {};

exports.load = function (filename) {
  return fs
    .readFileSync(filename)
    .toString('utf8')
    .split('\n')
    .filter(line => line.trim());
};

exports.save = function (filename, data) {
  fs.writeFileSync(filename, data.join('\n'));
};

fs.readdirSync(__dirname).forEach(function (filename) {
  filename = /^([^.]+)\.list$/.exec(filename);
  if (filename) {
    const name = filename[1];
    exports[name] = function (n) {
      let list = data[name];
      if (!list) {
        list = this.load(__dirname + `/${name}.list`);
        data[name] = list;
      }
      return _.sample(list, n)
    }
  }
});
