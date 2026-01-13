// Date utilities v2.0
const DateUtils = {
  now: () => new Date(),
  format: (date, fmt) => date.toISOString(),
  fromNow: (date) => new Date().getTime() - date.getTime()
};
module.exports = DateUtils;
