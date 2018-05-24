var test = require('tape')
var App = require('../')

function connectToPeer (address) {

}

test('ok', function (t) {
  var app = App({connectToPeer})
  console.log(app)
  t.ok(app, 'app is a thing')
  t.end()
})

test('throws if connectToPeer not passed in opts', function (t) {
  t.throws(() => App({}), 'throws')
  t.end()
})
