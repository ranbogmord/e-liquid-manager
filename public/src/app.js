const Liquid = require('./models/liquid');
const Flavour = require('./models/flavour');
const Comment = require('./models/comment');
const IOConnection = require('./lib/ioconnection');
const SocketConnection = require('./lib/socket-connection');
const _ = require('lodash');
const moment = require('moment');

var appIsBooted = false;

!function ($) {
  var roundingFilter = Vue.filter('round', function (val, decimals) {
    if (!decimals && decimals != 0) {
      decimals = 2;
    }

    var rounder = Math.pow(10, decimals);
    return parseInt(val * rounder, 10) / rounder;
  });

  var startApp = () => {
    console.log('Booting app');

    var eLiquidApp = window.eLiquidApp = new Vue({
      el: '#e-liquid-app',
      data: {
        mode: 'edit',
        currentLiquid: {},
        showNewFlavourForm: false,
        newFlavour: new Flavour({
          name: '',
          basePercent: 0,
          isVg: false
        }),
        newComment: new Comment(),
        availableVendors: [],
        availableLiquids: []
      },
      watch: {
        'currentLiquid.target.pgPercent': function () {
          this.currentLiquid.target.vgPercent = 100 - this.currentLiquid.getTargetPgPercent();
          localStorage.setItem('preferred-target-pg', this.currentLiquid.getTargetPgPercent());
        },
        'currentLiquid.target.vgPercent': function () {
          this.currentLiquid.target.pgPercent = 100 - this.currentLiquid.getTargetVgPercent();
          localStorage.setItem('preferred-target-pg', this.currentLiquid.getTargetPgPercent());
        },
        'currentLiquid.target.batchSize': function () {
          localStorage.setItem('preferred-batch-size', this.currentLiquid.getBatchSize());
        },
        'currentLiquid.target.nicStrength': function () {
          localStorage.setItem('preferred-nic-strength', this.currentLiquid.getTargetNicStrength());
        },
        'currentLiquid.base.nicPgPerc': function () {
          this.currentLiquid.base.nicVgPerc = 100 - this.currentLiquid.base.nicPgPerc;
          localStorage.setItem('preferred-nic-pg', this.currentLiquid.base.nicPgPerc);
        },
        'currentLiquid.base.nicVgPerc': function () {
          this.currentLiquid.base.nicPgPerc = 100 - this.currentLiquid.base.nicVgPerc;
          localStorage.setItem('preferred-nic-pg', this.currentLiquid.base.nicPgPerc);
        }
      },
      methods: {
        formatFlavourName: function (item) {
          if (!item) {
            item = {};
          }

          var name = item.name;
          if (item.vendor) {
            name += " " + (item.vendor.abbr || "");
          }

          return name;
        },
        setCurrentLiquid: function (data) {
          this.currentLiquid = new Liquid(data || {});
          if (data && data._id) {
            this.newComment.liquid = data._id;
          } else {
            this.newComment.liquid = null;
          }
        },
        createFlavour: function () {
          this.newFlavour.save()
          .then(() => {
            this.resetFlavourForm();
          })
          .catch(err => {
            alert(err.message);
            console.log(err);
          });
        },
        createNewVersion: function () {
          if (!this.currentLiquid._id) {
            return false;
          }

          let liq = _.cloneDeep(this.currentLiquid);
          liq.prev_version = liq._id;
          liq._id = null;

          let lastChar = liq.name.substr(-1);
          if (_.toNumber(lastChar)) {
            liq.name = liq.name.slice(0, -1) + (parseInt(liq.name.slice(-1), 10) + 1);
          } else {
            liq.name += " v2";
          }

          this.currentLiquid = liq;
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
        archiveLiquid: function () {
          if (confirm("Are you sure?")) {
            this.currentLiquid.archive()
            .then(() => {
              this.resetLiquidForm();
            })
            .catch(err => {
              alert(err.message);
              console.log(err);
            });
          }
        },
        saveComment: function () {
          this.newComment.save()
          .then(comment => {
            if (!_.isArray(this.currentLiquid.comments)) {
              this.currentLiquid.comments = [];
            }

            this.currentLiquid.comments.unshift(comment);
            this.newComment = new Comment({
              liquid: this.currentLiquid._id
            });
          })
          .catch(err => {
            alert(err.message);
            console.log(err);
          });
        },
        removeComment: function (comment) {
          if (confirm("Are you sure? This is irreverisble!")) {
            SocketConnection.removeComment(comment._id)
            .then(() => {
              let idx = this.currentLiquid.comments.indexOf(comment);
              if (idx !== -1) {
                this.currentLiquid.comments.splice(idx, 1);
              }
            })
            .catch(err => {
              alert(err.message);
              console.log(err);
            });
          }
        },
        resetFlavourForm: function () {
          this.showNewFlavourForm = false;
          this.newFlavour = new Flavour();
        },
        resetLiquidForm: function () {
          this.setCurrentLiquid({
            base: {
              nicPgPerc: localStorage.getItem('preferred-nic-pg')
            },
            target: {
              batchSize: localStorage.getItem('preferred-batch-size'),
              nicStrength: localStorage.getItem('preferred-nic-strength'),
            },
            next_version: null
          });
        },
        addFlavour: function (flavour) {
          this.currentLiquid.flavours.push({
            flavour: flavour,
            perc: flavour.basePercent
          });
        },
        getMixingTableTotalFlavourings: function () {
          var totalFlavourMl = 0;
          var totalFlavourPerc = 0;

          this.currentLiquid.flavours.forEach((f) => {
            totalFlavourMl += this.currentLiquid.percentToMl(f.perc);
            totalFlavourPerc += f.perc;
          });

          return {
            perc: totalFlavourPerc,
            ml: totalFlavourMl
          };
        }
      },
      created: function () {
        this.resetLiquidForm();

        SocketConnection.fetchVendors().then((vendors) => {
          this.availableVendors = vendors;
        });
        SocketConnection.fetchLiquids(true).then(liquids => {
          this.availableLiquids = liquids;
        });
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
              ml: this.currentLiquid.getNicVol(),
              perc: this.currentLiquid.getNicPercent() * 100
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
            var name = f.flavour.name;
            if (f.flavour && f.flavour.vendor) {
              name += " " + (f.flavour.vendor.abbr || "");
            }

            rows.push({
              name: name,
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

          var flavourStats = this.getMixingTableTotalFlavourings();

          return {
            ml: totalMl,
            perc: 100,
            flavourMl: flavourStats.ml,
            flavourPerc: flavourStats.perc
          };
        }
      },
      components: {
        'liquid-list': require('./components/liquid-list'),
        'flavour-list': require('./components/flavour-list')
      },
      filters: {
        'round': roundingFilter,
        'date-format': (date) => {
          const d = moment(date);
          if (!d.isValid()) {
            return date;
          }

          return d.format('YYYY-MM-DD HH:mm:ss Z');
        }
      }
    });
  };

  require('viewport-units-buggyfill').init({
    hacks: require('../../node_modules/viewport-units-buggyfill/viewport-units-buggyfill.hacks')
  });


  IOConnection.on('connect', function () {
    if (!appIsBooted) {
      appIsBooted = true;
      startApp();
    }
  });

  var checkSwipe = function () {
    if (window.innerWidth > 768) {
      $('body').swipe('destroy');
    } else {
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
    }
  };
  checkSwipe();

  $(window).on('resize', checkSwipe);

  $(document).on('click', '#liquid-list .searchable-list--search-result', function (e) {
    $('#liquid-list').removeClass('open');
  });
}(jQuery);
