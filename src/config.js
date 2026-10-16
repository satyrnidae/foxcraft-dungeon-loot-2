// mc-build 4.x does not read config.json; expose it to sources via `import ./config.js`
module.exports = { config: require('../config.json').mc };
