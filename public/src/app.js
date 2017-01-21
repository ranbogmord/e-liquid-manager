const Liquid = require('./models/liquid');
const Flavour = require('./models/flavour');
const IOConnection = require('./lib/ioconnection');

!function ($) {
  var roundingFilter = Vue.filter('round', function (val, decimals) {
    if (!decimals && decimals != 0) {
      decimals = 2;
    }

    var rounder = Math.pow(10, decimals);
    return parseInt(val * rounder, 10) / rounder;
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
        this.currentLiquid.target.vgPercent = 100 - this.currentLiquid.getTargetPgPercent();
      },
      'currentLiquid.target.vgPercent': function () {
        this.currentLiquid.target.pgPercent = 100 - this.currentLiquid.getTargetVgPercent();
      },
      'currentLiquid.target.batchSize': function () {
        localStorage.setItem('preferred-batch-size', this.currentLiquid.getBatchSize());
      },
      'currentLiquid.target.nicStrength': function () {
        localStorage.setItem('preferred-nic-strength', this.currentLiquid.getTargetNicStrength());
      }
    },
    methods: {
      setCurrentLiquid: function (data) {
        this.currentLiquid = new Liquid(data || {});
      },
      createFlavour: function () {
        this.newFlavour.save()
        .then(() => {
          self.resetFlavourForm();
        })
        .catch(err => {
          alert(err.message);
          console.log(err);
        });
      },
      saveLiquid: function () {
        this.currentLiquid.save()
        .then(() => {
          this.resetLiquidForm();
        })
        .catch(err => {
          alert(err.message);
          console.log(err);
        })
      },
      resetFlavourForm: function () {
        this.showNewFlavourForm = false;
        this.newFlavour = new Flavour();
      },
      resetLiquidForm: function () {
        this.setCurrentLiquid({
          target: {
            batchSize: localStorage.getItem('preferred-batch-size'),
            nicStrength: localStorage.getItem('preferred-nic-strength'),
          }
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
        return this.currentLiquid.getPgFlavourVol();
      },
      flavourVgVol: function () {
        return this.currentLiquid.getVgFlavourVol();
      },

      pgNicVol: function () {
        return this.currentLiquid.getPgNicVol();
      },
      pgZeroVol: function () {
        return this.currentLiquid.getPgZeroVol();
      },
      vgVol: function () {
        return this.currentLiquid.getVgVol();
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
      'liquid-list': require('./components/liquid-list'),
      'flavour-list': require('./components/flavour-list')
    },
    filters: {
      'round': roundingFilter
    }
  });

  $('body').swipe({
    swipeLeft: function (event, direction, distance, duration, fingerCount) {
      // Close mobile menu
      $('#mobile-menu-toggle').removeClass('open');

      var flavourList = $('#flavour-list');
      var liquidList = $('#liquid-list');
      if (flavourList.hasClass('open')) {
        // Do nothing if menu is already open
        // return false;
      } else if (liquidList.hasClass('open')) {
        // Close the liquid list instead if it's open
        liquidList.removeClass('open');
      } else {
        // Open list
        flavourList.addClass('open');
      }
    },
    swipeRight: function (event, direction, distance, duration, fingerCount) {
      // Close mobile menu
      $('#mobile-menu-toggle').removeClass('open');

      var flavourList = $('#flavour-list');
      var liquidList = $('#liquid-list');
      if (liquidList.hasClass('open')) {
        // Do nothing if menu is open
        // return false;
      } else if (flavourList.hasClass('open')) {
        // Close flavour list instead if it's open
        flavourList.removeClass('open');
      } else {
        // open list
        liquidList.addClass('open');
      }
    }
  });

  var checkSwipe = function () {
    if (window.innerWidth > 768) {
      $('body').swipe('disable');
    } else {
      $('body').swipe('enable');
    }
  };
  checkSwipe();

  $(window).on('resize', checkSwipe);

  $(document).on('click', '#liquid-list .searchable-list--search-result', function (e) {
    $('#liquid-list').removeClass('open');
  });
}(jQuery);
