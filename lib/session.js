var mongodb      = require('mongodb');
var EventEmitter = require('events').EventEmitter;
var util         = require('util');

var MongoClient = mongodb.MongoClient;

util.inherits(Session, EventEmitter);
module.exports = Session;

function Session (uri) {
  if (!(this instanceof Session)) {
    return new Session(uri);
  }

  EventEmitter.call(this);

  this.on('command', function (fn, done) {
    if (!this.db) {
      this.emit('error', new Error('Not connected to database.'));
      return;
    }
    fn.call(this, this.db, done);
  }.bind(this));

  MongoClient.connect(uri, function (err, db) {
    if (err) {
      throw err;
    }
    this.db = db;
    this.emit('connected', this.db);
  }.bind(this));
}

Session.objectId = mongodb.ObjectID;

// Immediately executes a command.
Session.prototype.execute = function (cmd, done) {
  this.emit('command', cmd, done);
}

// Returns thunk that may be yielded to execute.
Session.prototype.command = function (cmd) {
  return function (done) {
    this.execute(cmd, done);
  }.bind(this);
}
