var Mongel = require('../..');
var assert = require('assert');

describe('lib mongel', function () {

  describe('model', function () {

    var Car;

    before(function* () {
      Car = Mongel('items', 'mongodb://localhost/mongel-test');
      yield Car.dropIndexes();
      yield Car.remove();
    });

    it('should create', function () {
      assert(Car);
    });

    it('should execute custom command', function* () {
      var cars = yield Car.command(function (done) {
        Car.collection.insert({ color: 'red', engine: 'V8' }, function (err, doc) {
          if (err) return done(err);
          done(null, doc);
        });
      });
      assert(Array.isArray(cars));
      var car = cars.shift();
      assert(car._id);
      assert.equal(car.color, 'red');
      assert.equal(car.engine, 'V8');
    });

    describe('index', function () {

      it('should index', function* () {
        var index = yield Car.ensureIndex('color');
        assert.equal(index, 'color_1');
      });

      it('should get index information', function* () {
        var information = yield Car.indexInformation();
        var colorIndex = information.color_1[0];
        assert(colorIndex);
        assert.equal(colorIndex[0], 'color');
        assert.equal(colorIndex[1], 1);
      });

    });

    describe('create', function () {

      it('should create', function* () {
        var cars = yield Car.create({ color: 'yellow', engine: 'V4' });
        assert(Array.isArray(cars));
        var car = cars[0];
        assert(car);
        assert(car instanceof Car);
        assert(car._id);
        assert.equal(car.color, 'yellow');
        assert.equal(car.engine, 'V4');
      });

      it('should create one', function* () {
        var car = yield Car.createOne({ color: 'yellow', engine: 'V4' });
        assert(car);
        assert(car instanceof Car);
        assert(car._id);
        assert.equal(car.color, 'yellow');
        assert.equal(car.engine, 'V4');
      });

    });

    describe('remove', function () {

      var car;

      beforeEach(function* () {
        yield Car.remove();
        car = yield Car.createOne({ color: 'green', engine: 'V2' });
      });

      it('should remove', function* () {
        var result = yield car.remove();
        assert(result.ok);
        assert.equal(result.n, 1);
        car = yield car.fetch();
        assert(!car);
      });

      it('should remove statically', function* () {
        var result = yield Car.remove();
        assert(result.ok);
        assert(result.n > 0);
        car = yield car.fetch();
        assert(!car);
      });

      it('should remove by id', function* () {
        var result = yield Car.removeById(car._id);
        assert(result.ok);
        assert.equal(result.n, 1);
        car = yield car.fetch();
        assert(!car);
      });

    });

    describe('update', function () {

      var car;

      beforeEach(function* () {
        yield Car.remove();
        car = yield Car.createOne({ color: 'green', engine: 'V2' });
      });

      it('should update', function* () {
        assert.equal(car.color, 'green');
        car = yield car.update({ $set: { color: 'purple' } });
        assert.equal(car.color, 'purple');
      });

      it('should update by id', function* () {
        assert.equal(car.color, 'green');
        var result = yield Car.updateById(car._id, { $set: { color: 'purple' } });
        assert(result.ok);
        assert(result.n, 1);
        car = yield car.fetch();
        assert.equal(car.color, 'purple');
      });

      it('should update statically', function* () {
        assert.equal(car.color, 'green');
        var result = yield Car.update({ _id: car._id }, { $set: { color: 'purple' } });
        assert(result.ok);
        assert(result.n, 1);
        car = yield car.fetch();
        assert.equal(car.color, 'purple');
      });

    });

    describe('find', function () {

      var car;

      before(function* () {
        yield Car.remove();
        car = yield Car.createOne({ color: 'blue', engine: 'V6' });
      });

      it('should fetch', function* () {
        car = yield car.fetch();
        assert(car);
        assert(car instanceof Car);
        assert.equal(car.color, 'blue');
        assert.equal(car.engine, 'V6');
      });

      it('should find', function* () {
        var cars = yield Car.find();
        assert(Array.isArray(cars));
        var car = cars[0];
        assert(car instanceof Car);
        assert.equal(car.color, 'blue');
        assert.equal(car.engine, 'V6');
      });

      it('should find with cursor', function* () {
        var cursor = yield Car.findCursor();
        assert(cursor);
        var doc = yield function (done) {
          cursor.next(done);
        };
        assert(doc);
        assert.equal(doc.color, 'blue');
        assert.equal(doc.engine, 'V6');
      });

      describe('findOne', function () {

        it('should find one by color', function* () {
          var car = yield Car.findOne({ color: 'blue' });
          assert(car instanceof Car);
          assert.equal(car.color, 'blue');
          assert.equal(car.engine, 'V6');
        });

        it('should find one by engine', function* () {
          var car = yield Car.findOne({ engine: 'V6' });
          assert(car instanceof Car);
          assert.equal(car.color, 'blue');
          assert.equal(car.engine, 'V6');
        });

      });

      it('should find by id', function* () {
        var id = car._id;
        car = null;
        car = yield Car.findById(id);
        assert(car instanceof Car);
        assert.equal(car.color, 'blue');
        assert.equal(car.engine, 'V6');
      });

    });

    describe('count', function () {

      beforeEach(function* () {
        yield Car.remove();
        yield Car.createOne({ color: 'green', engine: 'V2' });
      });

      it('should count', function* () {
        var count = yield Car.count();
        assert.equal(count, 1);
      });

    });

  });

});
