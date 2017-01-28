const SocketConnection = require('../lib/socket-connection');
const Promise = require('promise');

class Flavour {
  constructor(params) {
    Object.assign(this, params, {
      name: "",
      isVg: false
    });
  }

  save() {
    return new Promise((resolve, reject) => {
      if (!this.name) {
        return reject(new Error("Name is required"));
      }

      SocketConnection.createFlavour(this).then(resolve).catch(reject);
    });
  }
}

module.exports = Flavour;
