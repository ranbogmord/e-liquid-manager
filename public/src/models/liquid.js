const SocketConnection = require('../lib/socket-connection');
const Promise = require('promise');

class Liquid {
  constructor(params) {
    Object.assign(this, {
      _id: params._id || null,
      name: params.name || null,
      base: {
        nicStrength: (params.base || {}).nicStrength || 30
      },
      target: {
        batchSize: (params.target || {}).batchSize || localStorage.getItem('preferred-batch-size') || 30,
        pgPercent: (params.target || {}).pgPercent || 30,
        vgPercent: (params.target || {}).vgPercent || 70,
        nicStrength: (params.target || {}).nicStrength || localStorage.getItem('preferred-nic-strength') || 3
      },
      flavours: params.flavours || [],
      comments: params.comments || []
    });
  }

  toObject() {
    return {
      _id: this._id,
      name: this.name,
      base: {
        nicStrength: this.base.nicStrength
      },
      target: {
        pgPercent: this.target.pgPercent,
        vgPercent: this.target.vgPercent,
        nicStrength: this.target.nicStrength
      },
      flavours: this.flavours
    };
  }

  save() {
    return new Promise((resolve, reject) => {
      var liquid = this.toObject();

      if (!liquid.name) {
        return reject(new Error("Liquid name is required"));
      }

      if (liquid._id) {
        SocketConnection.updateLiquid(liquid).then(resolve).catch(reject);
      } else {
        SocketConnection.createLiquid(liquid).then(resolve).catch(reject);
      }
    });
  }

  getBatchSize() {
    return this.target.batchSize;
  }

  mlToPercent(ml) {
    return ml / this.getBatchSize();
  }

  percentToMl(percent) {
    return this.getBatchSize() * (percent / 100);
  }

  getBaseNicStrength() {
    return this.base.nicStrength;
  }

  getTargetNicStrength() {
    return this.target.nicStrength;
  }

  getTargetPgPercent() {
    return this.target.pgPercent;
  }

  getTargetVgPercent() {
    return this.target.vgPercent;
  }

  getPgFlavourVol() {
    let totalFlavourPg = 0;

    this.flavours.forEach(f => {
      if (f.flavour.isVg) {
        return;
      }

      totalFlavourPg += this.percentToMl(f.perc);
    });

    return totalFlavourPg;
  }

  getVgFlavourVol() {
    let totalFlavourVg = 0;

    this.flavours.forEach(f => {
      if (!f.flavour.isVg) {
        return;
      }

      totalFlavourVg += this.percentToMl(f.perc);
    });

    return totalFlavourVg;
  }

  getPgNicVol() {
    return (this.getTargetNicStrength() / this.getBaseNicStrength()) * this.getBatchSize();
  }

  getPgZeroVol() {
    return ((this.getTargetPgPercent() / 100) * this.getBatchSize()) - (this.getPgFlavourVol() + this.getPgNicVol());
  }

  getVgVol() {
    return ((this.getTargetVgPercent() / 100) * this.getBatchSize()) - this.getVgFlavourVol();
  }
}

module.exports = Liquid;
