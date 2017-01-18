const Promise = require('promise');
const request = require('browser-request');
const moment = require('moment');

class ShareLink {
  constructor(params) {
    if (!params.liquid) {
      throw new Error("Missing liquid");
    }

    this._id = params._id || null;
    this.liquid = params.liquid;
    this.expiry = params.expiry || null;
  }

  save() {
    return new Promise((resolve, reject) => {
      let url = `/share/create/${this.liquid}`;
      if (!!this.expiry) {
        let date = moment(this.expiry);
        if (date.isValid()) {
          url += `?expiry=${date.toISOString()}`;
        }
      }

      if (typeof this.liquid !== "string") {
        this.liquid = this.liquid._id;
      }

      request({method: 'get', url: url, json: true}, (err, res) => {
        if (err) return reject(err);

        const data = res.body;
        this._id = data._id;
        this.liquid = data.liquid;
        this.expiry = data.expiry;

        return resolve();
      });
    });
  }

  saveToUser() {
    return new Promise((resolve, reject) => {
      if (!this._id) {
        return reject(new Error('Link not saved'));
      }

      request({method: 'POST', url: `/share/${this._id}/save`}, (err, res) => {
        if (err) return reject(err);

        resolve(res.body);
      });
    });
  }
}

module.exports = ShareLink;
