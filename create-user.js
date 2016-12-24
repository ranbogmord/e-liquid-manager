require('dotenv').config();
const cliArgs = require('command-line-args');
const models = require('./models');
const mongoose = require('mongoose');
const usage = require('command-line-usage');

mongoose.connect(process.env.MONGODB_URL);

const def = [
  {name: 'username', alias: 'u', type: String, description: 'Username'},
  {name: 'email', alias: 'e', type: String, description: 'Email'},
  {name: 'password', alias: 'p', type: String, description: 'Password'}
];

const args = cliArgs(def);

if (args.username && args.email && args.password) {
  let user = new models.User(args);
  user.save(err => {
    if (err) return console.error(err);

    console.log(`User ${user.username} created.`);
    process.exit(1);
  })
} else {
  console.log(usage([
    {
      header: 'E-Liquid Manager',
      content: 'CLI for ELM'
    },
    {
      header: 'Options',
      optionList: def
    }
  ]));
  process.exit(1);
}
