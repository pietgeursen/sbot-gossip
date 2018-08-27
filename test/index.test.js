var test = require('tape')
var App = require('../')
var {PRIORITY_MED, PRIORITY_HIGH} = require('../types')

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
  var route = app.selectPeers(app.getState()).getIn([peerId, 'routes', address])
  t.ok(route, 'new route was added')

  app.doAddRouteToPeer(peer)
  var newRoute = app.selectPeers(app.getState()).getIn([peerId, 'routes', address])
  t.equal(newRoute, route, 'peers are unchanged when route already exists')

  t.end()
})

test('remove route from peer', function (t) {
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peer = {
    address
  }
  app.doAddRouteToPeer(peer)
  var route = app.selectPeers(app.getState()).getIn([peerId, 'routes', address])
  t.ok(route, 'new route was added')

  app.doRemoveRouteToPeer(peer)
  var newRoute = app.selectPeers(app.getState()).getIn([peerId, 'routes', address])
  t.false(newRoute)

  t.end()
})

test('remove route from peer is ok if that peer does not exist', function (t) {
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peer = {
    address
  }

  app.doRemoveRouteToPeer(peer)
  var newRoute = app.selectPeers(app.getState()).getIn([peerId, 'routes', address])
  t.false(newRoute)

  t.end()
})

test('on peer connection, the correct route isConnected', function (t) {
  t.end()
})

test('on peer connection, the correct route has lastConnectionTime set to now', function (t) {
  t.end()
})

test('set priority on a peer', function (t) {
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peer = {
    address
  }
  app.doAddRouteToPeer(peer)
  app.doSetPeerPriority(peer, PRIORITY_MED)

  var route = app.selectPeers(app.getState()).getIn([peerId, 'routes', address, 'priority'])

  t.equal(route, PRIORITY_MED, 'route priority is set')

  app.doSetPeerPriority(peer, PRIORITY_HIGH)

  route = app.selectPeers(app.getState()).getIn([peerId, 'routes', address, 'priority'])
  t.equal(route, PRIORITY_HIGH, 'route priority is updated')

  t.end()
})

test('set priority on a peer with invalid priority throws', function (t) {
  t.end()
})

test('set peer isLongterm', function (t) {
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peer = {
    address
  }
  app.doAddRouteToPeer(peer)

  var isLongterm = app.selectPeers(app.getState()).getIn([peerId, 'routes', address, 'isLongterm'])
  t.equal(isLongterm, false, 'longterm is set')

  app.doSetPeerLongtermConnection(peer, true)

  isLongterm = app.selectPeers(app.getState()).getIn([peerId, 'routes', address, 'isLongterm'])
  t.equal(isLongterm, true, 'longterm is set')

  t.end()
})

// selectors
test('selectConnectionCount', function (t) {
  t.end()
})

// side effects
test('connect immediate calls connect function', function (t) {
  t.end()
})
