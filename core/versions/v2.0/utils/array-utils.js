// Array utilities v2.0
const ArrayUtils = {
  flatten: (arr) => arr.flat(Infinity),
  unique: (arr) => [...new Set(arr)],
  shuffle: (arr) => arr.sort(() => Math.random() - 0.5)
};
module.exports = ArrayUtils;
