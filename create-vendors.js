require('dotenv').config();
const mongoose = require('mongoose');
const models = require('./models');

mongoose.connect(process.env.MONGODB_URL);

const vendors = [
  {name: "Flavour Art", abbr: "FA", enabled: true},
  {name: "The Flavour/Parfumer's Apprentice", abbr: "TFA/TPA", enabled: true},
  {name: "Inawera", abbr: "INW", enabled: true},
  {name: "Capella", abbr: "CAP", enabled: true},
  {name: "Flavourah", abbr: "FVH", enabled: true},
];

vendors.forEach((v) => {
  const m = new models.FlavourVendor(v);

  m.save((err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("created ", m.name);
    }
  })
});
