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

  static archiveLiquid(liquid) {
    return new Promise((resolve, reject) => {
      IOConnection.emit('liquid:archive', liquid, function (res) {
        if (res.error) {
          if (typeof res.error === "object") {
            return reject(new Error("Failed to archive liquid"));
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

  static createComment(comment) {
    return new Promise((resolve, reject) => {
      IOConnection.emit('comment:create', {
        comment: comment.comment,
        liquid: comment.liquid
      }, (res) => {
        if (res.error) {
          return reject(new Error(res.error));
        }

        return resolve(res);
      });
    });
  }

  static removeComment(comment) {
    return new Promise((resolve, reject) => {
      IOConnection.emit('comment:delete', {
        comment: comment
      }, res => {
        if (res.error) {
          return reject(new Error(res.error));
        }

        return resolve();
      });
    });
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
