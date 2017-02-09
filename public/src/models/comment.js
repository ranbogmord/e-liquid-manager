const SocketConnection = require('../lib/socket-connection');
const Promise = require('promise');

class Comment {
  constructor(params) {
    Object.assign(this, {
      comment: "",
      liquid: null
    }, params);
  }

  save() {
    return new Promise((resolve, reject) => {
      if (!this.comment) {
        return reject(new Error("Comment cannot be empty"));
      } else if (!this.liquid) {
        return reject(new Error("Comment must be connected to a liquid"));
      }

      SocketConnection.createComment(this).then(resolve).catch(reject);
    });
  }
}

module.exports = Comment;
