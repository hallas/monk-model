var util    = require('util');
var events  = require('events');
var Session = require('prosession');

module.exports = Mongel;

function Mongel (collection, url, options) {
  if (!(this instanceof Mongel)) {
    return new Mongel(collection, url, options);
  }

  function Model (doc) {
    if (doc instanceof Array) {
      return doc.map(Model);
    }

    if (!(this instanceof Model)) {
      return new Model(doc);
    }

    util._extend(this, doc);
  }

  if (typeof(url) == 'string') {
    Model.session = new Session(url, options);
  } else {
    Model.session = url;
  }

  Model.session.on('connected', function (err, db) {
    Model.collection = db.collection(collection);
  });

  Model.ensureIndex = function (index, options) {
    return Model.session.command(function (db, done) {
      Model.collection.ensureIndex(index, options, done);
    });
  };

  Model.indexInformation = function (index) {
    return Model.session.command(function (db, done) {
      Model.collection.indexInformation(done);
    });
  };

  Model.dropIndex = function (index) {
    return Model.command(function (done) {
      Model.collection.dropIndex(index, done);
    });
  };

  Model.dropIndexes = function () {
    return Model.session.command(function (db, done) {
      Model.collection.dropIndexes(done);
    });
  };

  Model.find = function (query, fields, options) {
    return Model.session.command(function (db, done) {
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
    return Model.session.command(function (db, done) {
      Model.collection.find(query, fields, options, function (err, cursor) {
        if (err) return done(err);
        done(null, cursor);
      });
    });
  };

  Model.findOne = function () {
    var args = [].slice.call(arguments);
    return Model.session.command(function (db, done) {
      Model.collection.findOne.apply(Model.collection, args.concat(function (err, doc) {
        if (err) return done(err);
        if (!doc) return done();
        done(null, new Model(doc));
      }));
    });
  };

  Model.findById = function (id) {
    return Model.findOne({ _id: Mongel.objectId(id) });
  };

  Model.create = function (docs) {
    return Model.session.command(function (db, done) {
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
    return Model.session.command(function (db, done) {
      Model.collection.update(query, update, options, function (err, count, result) {
        if (err) return done(err);
        done(null, result);
      });
    });
  };

  Model.updateById = function (id, update, options) {
    return Model.update({ _id: Mongel.objectId(id) }, update, options);
  };

  Model.remove = function (query, options) {
    return Model.session.command(function (db, done) {
      Model.collection.remove(query, options, function (err, count, result) {
        if (err) return done(err);
        done(null, result);
      });
    });
  };

  Model.removeById = function (id, options) {
    return Model.remove({ _id: Mongel.objectId(id) }, options);
  };

  Model.count = function (query, options) {
    return Model.session.command(function (db, done) {
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

Mongel.objectId = Session.objectId;

util.inherits(Mongel, events.EventEmitter);
