var util = require('util');

module.exports = function () {
  return function Model (doc) {
    if (!doc) return;
    if (doc instanceof Array) return doc.map(Model);
    if (!(this instanceof Model)) return new Model(doc);
    util._extend(this, doc);
  }
}
