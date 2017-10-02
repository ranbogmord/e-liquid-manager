const IOConnection = require('../lib/ioconnection');

module.exports = Vue.component('liquid-list', {
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

    IOConnection.emit('liquid:list', { ignoreVersions: false }, function (data) {
      if (data.error) {
        console.warn(data.error);
        return;
      }

      self.rawData = data;
    });
  },
  computed: {
    sortedResults: function () {
      return this.rawData.sort(function (a, b) {
        a = a.name.toUpperCase();
        b = b.name.toUpperCase();

        if (a < b) {
          return -1;
        } else if (a > b) {
          return 1;
        } else {
          return 0;
        }
      });
    },
    results: function () {
      var self = this;
      if (!self.search) {
        return self.sortedResults;
      }

      return self.sortedResults.filter(function (liquid) {
        return liquid.name.toLowerCase().indexOf(self.search.toLowerCase()) !== -1;
      }).sort(function (a, b) {
        a = a.name.toUpperCase();
        b = b.name.toUpperCase();
        if (a < b) {
          return -1;
        } else if (a > b) {
          return 1;
        } else {
          return 0;
        }
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
