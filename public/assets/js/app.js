!function () {
  var IOConnection = io.connect();

  var roundingFilter = Vue.filter('round', function (val, decimals) {
    if (!decimals && decimals != 0) {
      decimals = 2;
    }

    var rounder = Math.pow(10, decimals);
    return parseInt(val * rounder, 10) / rounder;
  });

  var liquidList = Vue.component('liquid-list', {
    template: '#searchable-list-tpl',
    data: function () {
      return {
        search: '',
        rawData: []
      };
    },
    created: function () {
      var self = this;
      IOConnection.on('liquid:created', function (data) {
        self.rawData.push(data);
      });

      IOConnection.on('liquid:updated', function (data) {
        var item = self.rawData.filter(function (d) {
          return d._id === data._id;
        }).pop();

        self.rawData.splice(self.rawData.indexOf(item), 1, data);
      });

      IOConnection.on('liquid:archived', function (data) {
        var item = self.rawData.filter(function (d) {
          return d._id === data._id;
        }).pop();

        if (!item) {
          return;
        }

        self.rawData.splice(self.rawData.indexOf(item), 1);
      });

      IOConnection.emit('liquid:list', function (data) {
        if (data.error) {
          console.warn(data.error);
          return;
        }

        self.rawData = data;
      });
    },
    computed: {
      results: function () {
        var self = this;
        if (!self.search) {
          return self.rawData;
        }

        return self.rawData.filter(function (liquid) {
          return liquid.name.toLowerCase().indexOf(self.search.toLowerCase()) !== -1;
        });
      }
    },
    methods: {
      displayName: function (item) {
        return item.name;
      },
      onItemClicked: function (item) {
        this.$emit('liquid-added', item);
      }
    }
  });

  var flavourList = Vue.component('flavour-list', {
    template: '#searchable-list-tpl',
    data: function () {
      return {
        search: '',
        rawData: []
      };
    },
    created: function () {
      var self = this;
      IOConnection.on('flavour:created', function (data) {
        self.rawData.push(data);
      });

      IOConnection.on('flavour:archived', function (data) {
        var item = self.rawData.filter(function (d) {
          return d._id === data._id;
        }).pop();

        if (!item) {
          return;
        }

        self.rawData.splice(self.rawData.indexOf(item), 1);
      });

      IOConnection.on('flavour:updated', function (data) {
        var item = self.rawData.filter(function (d) {
          return d._id === data._id;
        }).pop();

        if (!item) {
          return;
        }

        self.rawData.splice(self.rawData.indexOf(item), 1, data);
      });

      IOConnection.emit('flavour:list', function (data) {
        if (data.error) {
          console.warn(data.error);
          return;
        }

        self.rawData = data;
      });
    },
    computed: {
      results: function () {
        var self = this;
        if (!self.search) {
          return self.rawData;
        }

        return self.rawData.filter(function (liquid) {
          return liquid.name.toLowerCase().indexOf(self.search.toLowerCase()) !== -1;
        });
      }
    },
    methods: {
      displayName: function (item) {
        return item.name;
      },
      onItemClicked: function (item) {
        this.$emit('flavour-added', item);
      }
    }
  });

  var eLiquidApp = new Vue({
    el: '#e-liquid-app',
    data: {
      mode: 'edit',
      currentLiquid: {},
      showNewFlavourForm: false,
      newFlavour: {
        name: '',
        basePercent: 0,
        isVg: false
      }
    },
    watch: {
      'currentLiquid.target.pgPercent': function () {
        this.currentLiquid.target.vgPercent = 100 - this.currentLiquid.target.pgPercent;
      },
      'currentLiquid.target.vgPercent': function () {
        this.currentLiquid.target.pgPercent = 100 - this.currentLiquid.target.vgPercent;
      },
      'currentLiquid.target.batchSize': function () {
        localStorage.setItem('preferred-batch-size', this.currentLiquid.target.batchSize);
      },
      'currentLiquid.target.nicStrength': function () {
        localStorage.setItem('preferred-nic-strength', this.currentLiquid.target.nicStrength);
      }
    },
    methods: {
      setCurrentLiquid: function (data) {
        this.currentLiquid = {
          _id: data._id,
          name: data.name,
          base: {
            nicStrength: data.base.nicStrength
          },
          target: {
            batchSize: localStorage.getItem('preferred-batch-size') || 30,
            pgPercent: data.target.pgPercent,
            vgPercent: data.target.vgPercent,
            nicStrength: localStorage.getItem('preferred-nic-strength') || data.target.nicStrength
          },
          flavours: data.flavours,
          comments: data.comments
        };
      },
      createFlavour: function () {
        var self = this;
        if (!this.newFlavour.name) {
          alert('Name is required');
          this.newFlavour.nameError = true;
          return;
        } else {
          this.newFlavour.nameError = false;
        }

        IOConnection.emit('flavour:create', {
          name: this.newFlavour.name,
          isVg: this.newFlavour.isVg
        }, function (res) {
          if (res.error) {
            if (typeof res.error == 'string') {
              alert(res.error);
            } else {
              alert('Failed to save flavour');
            }

            return;
          }

          self.resetFlavourForm();
        });
      },
      saveLiquid: function () {
        var self = this;

        const liquid = JSON.parse(JSON.stringify(this.currentLiquid));

        if (!liquid.name) {
          alert('Liquid name is required');
          self.currentLiquid.nameError = true;
          return;
        } else {
          self.currentLiquid.nameError = false;
        }

        let data = {
          name: liquid.name,
          base: {
            nicStrength: liquid.base.nicStrength
          },
          target: {
            pgPercent: liquid.target.pgPercent,
            vgPercent: liquid.target.vgPercent,
            nicStrength: liquid.target.nicStrength
          },
          flavours: liquid.flavours
        };
        let action = "liquid:create";

        if (liquid._id) {
          data._id = liquid._id;
          action = "liquid:update";
        }

        IOConnection.emit(action, data, function (res) {
          if (res.error) {
            if (typeof res.error == 'object') {
              alert('Failed to save e-liquid');
              console.warn(res.error);
            } else {
              alert(res.error);
            }

            return;
          }

          self.resetLiquidForm();
        });
      },
      resetFlavourForm: function () {
        this.showNewFlavourForm = false;
        this.newFlavour = {
          name: '',
          nameError: false,
          isVg: false
        };
      },
      resetLiquidForm: function () {
        this.setCurrentLiquid({
          _id: null,
          name: '',
          nameError: false,
          base: {
            nicStrength: 30
          },
          target: {
            pgPercent: 30,
            vgPercent: 70,
            nicStrength: 0
          },
          flavours: [],
          comments: []
        });
      },
      addFlavour: function (flavour) {
        this.currentLiquid.flavours.push({
          flavour: flavour,
          perc: flavour.basePercent
        });
      }
    },
    created: function () {
      this.resetLiquidForm();
    },
    computed: {
      flavourPgVol: function () {
        var self = this;
        var totalFlavourPg = 0;

        this.currentLiquid.flavours.forEach(function (f) {
          if (f.flavour.isVg) {
            return;
          }

          totalFlavourPg += (f.perc / 100) * self.currentLiquid.target.batchSize;
        });

        return totalFlavourPg;
      },
      flavourVgVol: function () {
        var self = this;
        var totalFlavourVg = 0;

        self.currentLiquid.flavours.forEach(function (f) {
          if (!f.flavour.isVg) {
            return;
          }

          totalFlavourVg += (f.perc / 100) * self.currentLiquid.target.batchSize;
        });

        return totalFlavourVg;
      },

      pgNicVol: function () {
        return (this.currentLiquid.target.nicStrength / this.currentLiquid.base.nicStrength) * this.currentLiquid.target.batchSize;
      },
      pgZeroVol: function () {
        return ((this.currentLiquid.target.pgPercent / 100) * this.currentLiquid.target.batchSize) - (this.flavourPgVol + this.pgNicVol);
      },
      vgVol: function () {
        return ((this.currentLiquid.target.vgPercent / 100) * this.currentLiquid.target.batchSize) - this.flavourVgVol;
      },
      mixingTableRows: function () {
        var self = this;
        var rows = [
          {
            name: 'Base nicotine',
            ml: self.pgNicVol,
            perc: (self.pgNicVol / self.currentLiquid.target.batchSize) * 100
          },
          {
            name: 'PG (0 mg/ml)',
            ml: self.pgZeroVol,
            perc: (self.pgZeroVol / self.currentLiquid.target.batchSize) * 100
          },
          {
            name: 'VG (0 mg/ml)',
            ml: self.vgVol,
            perc: (self.vgVol / self.currentLiquid.target.batchSize) * 100
          }
        ];

        self.currentLiquid.flavours.forEach(function (f) {
          rows.push({
            name: f.flavour.name,
            perc: f.perc,
            ml: (f.perc / 100) * self.currentLiquid.target.batchSize
          });
        });

        return rows;
      },
      mixingTableTotals: function () {
        var totalMl = 0;
        this.mixingTableRows.forEach(function (r) {
          totalMl += r.ml;
        });

        return {
          ml: totalMl,
          perc: 100
        };
      }
    },
    components: {
      'liquid-list': liquidList,
      'flavour-list': flavourList
    },
    filters: {
      'round': roundingFilter
    }
  });
}();
