Generator based MongoDB models for Node.js. Perfect for use with
[Koa](http://koajs.com) and other co-based libraries. If you want to learn about
generators, see the article [Working with Koa and Generators](https://medium.com/code-adventures/1776085cb4af).

Please notice that it is by design that when using a method such as
`instance.save` the caller instance is not altered or modified, and that you
must use the returned instance, as that is the latest representation of the
doc that we know of.

Most methods such as `.update` are available to both the instantiated objects
but also as statics on the model it self.

Please forgive my use of terminology such as methods and statics, I'm aware that
they may not be correct for JavaScript, but to make sure we're on the same page,
a static is a method that can be called on the model it self such as
`Model.update` while instance methods can be called on instantiated objects of
the model such as `instance.update`.

## Installation

This library should be installed with `npm`.

```
$ npm install mongel
```

### Harmony

Please notice that using generators in Node.js require the V8 harmony features.
These are available in v0.11 and run using `node --harmony-generators`. Use
[nvm](https://github.com/creationix/nvm) to install v0.11.

## Tests

For such a small library I haven't written any suites but instead I have a
little test file that assumes a local MongoDB instance.

```
$ npm test
```

## Usage

When reading this docation, just assume that every snippet of code is one
file, and look to previous snippets for missing variables.

### Models

Notice that every model maintains its own monk MongoDB connection and should be
created on the form `model(collection, url)`.

```javascript
var mongel = require('mongel');

var Item = mongel('items', 'localhost/test');
var item = new Item({ title: 'My test item' });
```

### Saving

**save**

Models that are instantiated are not linked (they have no `._id`), in order to
link an instance, use `instance.save` and overwrite the reference with the
returned instance.

```javascript
var item = yield item.save();
```

You can use `Model.create` to instantiate a doc that is saved and linked.

**create**

```javascript
var item = yield Item.create(doc);
```

### Finding

**fetch**

Use this to fetch an already linked instance.

```javascript
var item = yield item.fetch();
```

**find**

```javascript
var item = yield Item.find(query);
```

**findOne**

```javascript
var item = yield Item.findById(query);
```

**findById**

```javascript
var item = yield Item.findById(id);
```

### Updating

```javascript
var item = yield item.update(update, options);
```

```javascript
var item = yield Item.update(query, update, options);
```

### Removing

```javascript
yield item.remove();
```

### Collection

This library is built on monk, which is turn is a wrapper around mongoskin which
uses the native driver. You can always run commands directly on the collections.

```javascript
var item = Item.collection.findOne(query);
```

### Extending

You can extend your model with both static and instance methods. When you extend
a model you can access the underlying collection as well.

**static**

Here we try to find a doc but if it doesn't exists, we create and return
it.

```javascript
Item.findOrCreate = function* (doc) {
  var query = { title: doc.title };
  var item = yield Item.findOne(query);
  if (!item) item = yield Item.create(doc);
  return item;
};
```

**instance**

Assuming `Item` has a price field.

```javascript
Item.prototype.getRoundedPrice = function () {
  return Math.round(this.price * 100) / 100;
};
```

### Formatting

In the case of Koa, your `context.body` is stringified into JSON. To customize how a model is formatted as JSON simply prototype the `.toJSON` function.

```javascript
Item.prototype.toJSON = function () {
  var output = {
    id           : this._id.toString(),
    roundedPrice : this.getRoundedPrice()
  };
  return output;
}
```
