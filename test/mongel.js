
var Mongel = require('..');
var co     = require('co');
var assert = require('assert');

var Item = Mongel('items', 'mongodb://localhost/mongel-test');

Item.findOrCreate = function* (doc) {
  var query = { title: doc.title };
  var item = yield Item.findOne(query);
  if (!item) item = yield Item.create(doc);
  return item;
};

Item.prototype.getRoundedPrice = function () {
  return Math.round(this.price * 100) / 100;
};

co(function* () {
  console.log('testing ensureIndex');
  yield Item.ensureIndex('title');

  console.log('testing static remove');
  yield Item.remove();

  console.log('testing static find');
  var items = yield Item.find();
  assert.equal(items.length, 0);

  var item = new Item({ title: 'Test A' });

  console.log('testing instance save');
  item = yield item.save();

  console.log('testing static find again');
  items = yield Item.find();
  assert.equal(items.length, 1);

  console.log('testing instance remove');
  yield item.remove();
  items = yield Item.find();
  assert.equal(items.length, 0);

  console.log('testing static create');
  item = yield Item.createOne({ title: 'Test B' });
  assert.equal('Test B', item.title);

  console.log('testing instance update');
  item = yield item.update({ $set: { title: 'Test C' } });
  assert.equal('Test C', item.title);

  console.log('testing static update');
  var result = yield Item.update({ _id: item._id }, { $set: { title: 'Test D', price: 432.435 } });
  assert.equal(1, result.n);

  console.log('testing instance fetch');
  item = yield item.fetch();
  assert.equal('Test D', item.title);

  console.log('testing instance getRoundedPrice');
  assert.equal(432.44, item.getRoundedPrice());

  console.log('testing static findOrCreate');
  previousItem = yield Item.findOrCreate({ title: 'Test D' });
  assert.deepEqual(previousItem, item);

  console.log('testing static findById');
  previousItem = yield Item.findById(previousItem._id);
  assert.deepEqual(previousItem, item);

  console.log('tests completed');
  process.exit(0);
})();
