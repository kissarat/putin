const fs = require('fs');
const merge = require('deepmerge');

class Store {
  constructor(name, debounce) {
    this.name = name.replace(/\.js$/, '-config');
    this.start = Date.now();
    this.debounce = debounce;
    try {
      this.config = JSON.parse(fs.readFileSync(this.name + '.json'));
    }
    catch (ex) {
      this.config = {}
    }
  }

  setDefaults(defaults) {
    this.config = merge(defaults, this.config)
  }

  save() {
    if (!this.debounce || Date.now() - this.debounce >= this.start) {
      fs.writeFileSync(this.name + '.json', JSON.stringify(this.config, null, '\t'));
      this.start = Date.now()
    }
  }
}

module.exports = {
  Store
};
