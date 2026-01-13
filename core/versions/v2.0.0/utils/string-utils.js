// String utilities v2.0
const StringUtils = {
  capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),
  truncate: (str, len) => str.substring(0, len) + '...',
  reverse: (str) => str.split('').reverse().join('')
};
module.exports = StringUtils;
