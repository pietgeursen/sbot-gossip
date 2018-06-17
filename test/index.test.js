var test = require('tape')
var App = require('../')
var {reducer, doAddRouteToPeer} = require('../peers/')

function connectToPeer (address) {

}

test('simple', function (t) {
  var app = App({connectToPeer})
  t.ok(app, 'app is a thing')
  t.end()
})

test('throws if connectToPeer not passed in opts', function (t) {
  t.throws(() => App({}), 'throws')
  t.end()
})

test('Set Max Peers', function (t) {
  var app = App({connectToPeer})
  var expected = 5
  app.doSetMaxNumConnections({'rtc': expected})

  var newState = app.selectMaxConnectedPeers(app.getState())
  t.equal(newState.get('rtc'), expected, 'Peers rtc max is set')
  t.ok(newState.get('net'), 'Peers net max is unchanged by merge')
  t.end()
})

test('Adds new route to a peer', function (t) {
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peer = {
    address
  }
  app.doAddRouteToPeer(peer)
  var routeAddress = app.selectPeers(app.getState()).getIn([peerId, 'routes', address])

  t.ok(routeAddress, 'route was added')

  t.end()
})

test('trying to add an existing route', function (t) {
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peer = {
    address
  }
  app.doAddRouteToPeer(peer)
  var routeAddress = app.selectPeers(app.getState()).getIn([peerId, 'routes', address])
  t.ok(routeAddress, 'route was added')

  var newState = app.selectPeers(app.getState()).setIn([peerId, 'routes', address, 'isConnected'], true)

  t.true(newState.getIn([peerId, 'routes', address, 'isConnected']), 'isConnected is set to true')
  newState = reducer(newState, doAddRouteToPeer(peer))
  t.true(newState.getIn([peerId, 'routes', address, 'isConnected']), 'isConnected is unchanged')

  t.end()
})

test('on peer connection, the correct route isConnected', function (t) {
  t.end()
})

test('selectConnectionCount', function (t) {
  t.end()
})

test('remove route from peer', function (t) {
  t.end()
})

test('set priority on a peer', function (t) {
  t.end()
})

test('set peer isLongerm', function (t) {
  t.end()
})

test('connect immedate calls connect function', function (t) {
  t.end()
})
