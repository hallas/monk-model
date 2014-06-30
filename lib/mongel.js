
var monk = require('bleeding-monk');
var wrap = require('co-monk');
var util = require('util');

module.exports = exports = Mongel;

function Mongel (collection, url) {
  if (!(this instanceof Mongel)) return new Mongel(collection, url);

  Model.db = monk(url);
  Model._collection = Model.db.get(collection);
  Model.collection = wrap(Model._collection);

  function Model (doc) {
    if (doc instanceof Array) return doc.map(Model);
    if (!(this instanceof Model)) return new Model(doc);
    util._extend(this, doc);
  }

  var model = Model.prototype;

  model.fetch = function* () {
    return yield Model.findById(Model.collection.id(this._id));
  };

  model.save = function* () {
    if (this.isLinked()) return yield this.fetch();
    var doc = util._extend({}, this);
    return yield Model.create(doc);
  };

  model.update = function* (update, options) {
    if (!update) return;
    if (!this.isLinked) throw new Error('cannot remove unlinked instance');
    var query = { _id: Model.collection.id(this._id) };
    yield Model.update(query, update, options);
    return yield this.fetch();
  };

  model.remove = function* () {
    if (!this.isLinked) throw new Error('cannot remove unlinked instance');
    var query = { _id: Model.collection.id(this._id) };
    return yield Model.remove(query);
  };

  model.isLinked = function () {
    return !!this._id;
  }

  Model.find = function* (query) {
    var docs = yield Model.collection.find(query);
    if (!docs) return;
    return new Model(docs);
  };

  Model.findOne = function* (query) {
    var doc = yield Model.collection.findOne(query);
    if (!doc) return;
    return new Model(doc);
  };

  Model.findById = function* (id) {
    var doc = yield Model.collection.findById(Model.collection.id(id));
    if (!doc) return;
    return new Model(doc);
  };

  Model.create = function* (doc) {
    return new Model(yield Model.collection.insert(doc));
  };

  Model.update = function* (query, update, options) {
    return yield Model.collection.update(query, update, options);
  };

  Model.remove = function* (query, justOne) {
    return yield Model.collection.remove(query, justOne);
  };

  Model.count = function* (query) {
    query = query || {};
    return yield Model.collection.count(query);
  };

  Model.index = function () {
    return Model.collection.index.apply(Model.collection, arguments);
  };

  return Model;
}
