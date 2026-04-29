const Long = require('long');

const browserModules = {
  long: Long,
  fs: null,
  buffer: null,
};

module.exports = function inquireBrowserModule(moduleName) {
  // protobufjs calls this through CommonJS require, so this file must be CJS.
  return browserModules[moduleName] || null;
};
