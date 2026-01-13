// Validators v2.0
const validators = {
  email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
  url: (val) => /^https?:\/\//.test(val)
};
module.exports = validators;
