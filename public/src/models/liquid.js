const SocketConnection = require('../lib/socket-connection');
const Promise = require('promise');

class Liquid {
  constructor(params) {
    Object.assign(this, {
      _id: params._id || null,
      name: params.name || null,
      base: {
        nicStrength: (params.base || {}).nicStrength || 30,
        nicPgPerc: params.nicPgPerc || localStorage.getItem('preferred-nic-pg') || 100,
        nicVgPerc: params.nicVgPerc || Math.max(100 - localStorage.getItem('preferred-nic-pg'), 0) || 0
      },
      target: {
        batchSize: (params.target || {}).batchSize || localStorage.getItem('preferred-batch-size') || 30,
        pgPercent: (params.target || {}).pgPercent || localStorage.getItem('preferred-target-pg') || 30,
        vgPercent: (params.target || {}).vgPercent || Math.max(100 - localStorage.getItem('preferred-target-pg'), 0) || 70,
        nicStrength: (params.target || {}).nicStrength || localStorage.getItem('preferred-nic-strength') || 3
      },
      flavours: params.flavours || [],
      comments: params.comments || [],
      next_version: params.next_version || null,
      prev_version: params.prev_version || null
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
      flavours: this.flavours,
      next_version: this.next_version,
      prev_version: this.prev_version
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

  archive() {
    return new Promise((resolve, reject) => {
      const liq = this.toObject();

      if (!liq._id) {
        return resolve();
      }

      SocketConnection.archiveLiquid(liq).then(resolve).catch(reject);
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

  getNicVol() {
    return (this.getTargetNicStrength() / this.getBaseNicStrength()) * this.getBatchSize();
  }

  getNicPercent() {
    return this.mlToPercent(this.getNicVol());
  }

  getPgNicVol() {
    return (this.base.nicPgPerc / 100) * this.getNicVol();
  }

  getVgNicVol() {
    return (this.base.nicVgPerc / 100) * this.getNicVol();
  }

  getPgZeroVol() {
    return ((this.getTargetPgPercent() / 100) * this.getBatchSize()) - (this.getPgFlavourVol() + this.getPgNicVol());
  }

  getVgVol() {
    return ((this.getTargetVgPercent() / 100) * this.getBatchSize()) - this.getVgFlavourVol() - this.getVgNicVol();
  }
}

module.exports = Liquid;
