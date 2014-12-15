var model = require('../..');
var assert = require('assert');

var Car = model();

describe('lib mongel', function () {

  it('should instantiate', function () {
    var car = new Car({ color: 'green' });
    assert.equal(car.color, 'green');
  });

  it('should instantiate array', function () {
    var cars = new Car([ { color: 'yellow' }, { color: 'red' } ]);
    assert.equal(cars.length, 2);

    var car = cars.pop();
    assert.equal(car.color, 'red');
  });

  it('should not instantiate', function () {
    var empty = Car();
    assert.equal(empty, undefined);
  });

});
