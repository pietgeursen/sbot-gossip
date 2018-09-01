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

test('Adds a peer', function (t) {
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peerAddress = {
    address
  }
  app.doAddPeer(peerAddress)
  var peer = app.selectPeers(app.getState()).get(peerId)
  t.ok(peer, 'peer was added')
  t.equal(peer.id, peerId, 'peer has id set to the pub key')

  t.end()
})

test('remove route from peer', function (t) {
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peerAddress = {
    address
  }
  app.doAddPeer(peerAddress)
  var peer = app.selectPeers(app.getState()).get(peerId)
  t.ok(peer, 'new route was added')

  app.doRemovePeer(peerAddress)
  peer = app.selectPeers(app.getState()).get(peerId)
  t.false(peer)

  t.end()
})

test('on peer connection, the correct route isConnected', function (t) {
  t.end()
})

test('on peer connection, the correct route has lastConnectionTime set to now', function (t) {
  t.end()
})

test('set priority on a route', function (t) {
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peer = {
    address
  }
  app.doAddRoute(peer)
  app.doSetRoutePriority(peer, PRIORITY_MED)

  var priority = app.selectRoutes(app.getState()).getIn([address, 'priority'])

  t.equal(priority, PRIORITY_MED, 'route priority is set')

  app.doSetRoutePriority(peer, PRIORITY_HIGH)

  priority = app.selectRoutes(app.getState()).getIn([address, 'priority'])

  t.equal(priority, PRIORITY_HIGH, 'route priority is updated')

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
  app.doAddRoute(peer)

  var isLongterm = app.selectRoutes(app.getState()).getIn([address, 'isLongterm'])
  t.equal(isLongterm, false, 'longterm is set')

  app.doSetRouteLongtermConnection(peer, true)

  isLongterm = app.selectRoutes(app.getState()).getIn([address, 'isLongterm'])
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
