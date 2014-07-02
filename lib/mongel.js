var util    = require('util');
var events  = require('events');
var mongodb = require('mongodb');

var Mongel = module.exports = function Mongel (collection, URL, options) {

  if (!(this instanceof Mongel)) return new Mongel(collection, URL);
  var mongel = this;

  events.EventEmitter.call(mongel);

  mongodb.MongoClient.connect(URL, options, function (err, db) {
    if (err) return mongel.emit('error', err);
    Model.collection = db.collection(collection);
    mongel.db = db;
    mongel.emit('connect', db);
  });

  function wait (thunk) {
    return function (done) {
      mongel.on('connect', function () {
        thunk(function () {
          if (done) done.apply(Model.collection, arguments);
        });
      });
    };
  };

  function Model (doc) {
    if (doc instanceof Array) return doc.map(Model);
    if (!(this instanceof Model)) return new Model(doc);
    util._extend(this, doc);
  }

  Model.driver = mongel;

  Model.command = function (thunk) {
    if (mongel.db) return thunk;
    return wait(thunk);
  };

  Model.ensureIndex = function (index, options) {
    return Model.command(function (done) {
      Model.collection.ensureIndex(index, options, done);
    });
  };

  Model.indexInformation = function (index) {
    return Model.command(function (done) {
      Model.collection.indexInformation(done);
    });
  };

  Model.dropIndex = function (index) {
    return Model.command(function (done) {
      Model.collection.dropIndex(index, done);
    });
  };

  Model.dropIndexes = function () {
    return Model.command(function (done) {
      Model.collection.dropIndexes(done);
    });
  };

  Model.find = function (query, fields, options) {
    return Model.command(function (done) {
      Model.collection.find(query, fields, options, function (err, cursor) {
        if (err) return done(err);
        return cursor.toArray(function (err, docs) {
          if (err) return done(err);
          done(null, new Model(docs));
        });
      });
    });
  };

  Model.findCursor = function (query, fields, options) {
    return Model.command(function (done) {
      Model.collection.find(query, fields, options, function (err, cursor) {
        if (err) return done(err);
        done(null, cursor);
      });
    });
  };

  Model.findOne = function (query) {
    return Model.command(function (done) {
      Model.collection.findOne(query, function (err, doc) {
        if (err) return done(err);
        if (!doc) return done();
        done(null, new Model(doc));
      });
    });
  };

  Model.findById = function (id) {
    return Model.findOne({ _id: Mongel.toObjectId(id) });
  };

  Model.create = function (docs) {
    return Model.command(function (done) {
      Model.collection.insert(docs, function (err, docs) {
        if (err) return done(err);
        done(null, new Model(docs));
      });
    });
  };

  Model.createOne = function (doc) {
    var create = Model.create(doc);
    return function (done) {
      create(function (err, docs) {
        if (err) return done(err);
        done(null, docs.shift());
      });
    };
  };

  Model.update = function (query, update, options) {
    return Model.command(function (done) {
      Model.collection.update(query, update, options, function (err, count, result) {
        if (err) return done(err);
        done(null, result);
      });
    });
  };

  Model.updateById = function (id, update, options) {
    return Model.update({ _id: Mongel.toObjectId(id) }, update, options);
  };

  Model.remove = function (query, options) {
    return Model.command(function (done) {
      Model.collection.remove(query, options, function (err, count, result) {
        if (err) return done(err);
        done(null, result);
      });
    });
  };

  Model.removeById = function (id, options) {
    return Model.remove({ _id: Mongel.toObjectId(id) }, options);
  };

  Model.count = function (query, options) {
    return Model.command(function (done) {
      Model.collection.count(query, options, function (err, count) {
        if (err) return done(err);
        done(null, count);
      })
    });
  };

  var model = Model.prototype;

  model.fetch = function () {
    return Model.findById(this._id);
  };

  model.save = function () {
    if (this._id) return this.fetch();
    var doc = util._extend({}, this);
    return Model.createOne(doc);
  };

  model.update = function (update, options) {
    var updated = Model.updateById(this._id, update, options);
    var fetched = this.fetch();
    return function (done) {
      updated(function (err) {
        if (err) return done(err);
        fetched(done);
      });
    };
  };

  model.remove = function () {
    return Model.removeById(this._id);
  };

  return Model;

};

Mongel.toObjectId = function (hex) {
  if (hex instanceof mongodb.ObjectID) return hex;
  if (!hex || hex.length != 24) return hex;
  return mongodb.ObjectID.createFromHexString(hex);
};

util.inherits(Mongel, events.EventEmitter);
