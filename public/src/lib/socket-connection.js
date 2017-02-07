const IOConnection = require('./ioconnection');
const Promise = require('promise');

class SocketConnection {
  static createLiquid(liquid) {
    return new Promise((resolve, reject) => {
      IOConnection.emit('liquid:create', liquid, function (res) {
        if (res.error) {
          if (typeof res.error == 'object') {
            return reject(new Error("Failed to save liquid"));
          } else {
            return reject(new Error(res.error));
          }
        }

        return resolve();
      });
    });
  }

  static updateLiquid(liquid) {
    return new Promise((resolve, reject) => {
      IOConnection.emit('liquid:update', liquid, function (res) {
        if (res.error) {
          if (typeof res.error == 'object') {
            return reject(new Error("Failed to save liquid"));
          } else {
            return reject(new Error(res.error));
          }
        }

        return resolve();
      });
    });
  }

  static createFlavour(flavour) {
    return new Promise((resolve, reject) => {
      IOConnection.emit('flavour:create', {
        name: flavour.name,
        isVg: flavour.isVg,
        vendor: flavour.vendor
      }, function (res) {
        if (res.error) {
          if (typeof res.error == 'string') {
            return reject(new Error(res.error));
          } else {
            return reject(new Error("Failed to save flavour"));
          }
        }

        return resolve();
      });
    })
  }

  static fetchVendors() {
    return new Promise((resolve, reject) => {
      IOConnection.emit('vendors:list', (res) => {
        return resolve(res);
      });
    });
  }
}

module.exports = SocketConnection;
