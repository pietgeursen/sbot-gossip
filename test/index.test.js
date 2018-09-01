var test = require('tape')
var App = require('../').App

var {PRIORITY_MED, PRIORITY_HIGH} = require('../types')
var {
  DISCONNECTED,
  CONNECTED,
  CONNECTING
} = require('../routes/types')

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

test('connecting to a route immediately updates to CONNECTING and eventually CONNECTED on success', function (t) {
  t.plan(2)
  function connectToPeer ({address}, cb) {
    var connectionState = app.selectRoutes(app.getState()).getIn([address, 'connectionState'])
    t.equal(connectionState, CONNECTING)
    cb(null)
    connectionState = app.selectRoutes(app.getState()).getIn([address, 'connectionState'])
    t.equal(connectionState, CONNECTED)
  }
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peer = {
    address
  }
  app.doAddRoute(peer)
  app.doRouteConnect(peer)
})

test('connecting to a route immediately dispatches CONNECTING and eventually DISCONNECTED on error', function (t) {
  t.plan(2)
  function connectToPeer ({address}, cb) {
    var connectionState = app.selectRoutes(app.getState()).getIn([address, 'connectionState'])
    t.equal(connectionState, CONNECTING)
    cb(new Error('zzzzt'))
    connectionState = app.selectRoutes(app.getState()).getIn([address, 'connectionState'])
    t.equal(connectionState, DISCONNECTED)
  }
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peer = {
    address
  }
  app.doAddRoute(peer)
  app.doRouteConnect(peer)
  t.end()
})

test('isLocal is set for a local route', function (t) {
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peer = {
    address,
    isLocal: true
  }
  app.doAddRoute(peer)
  var isLocal = app.selectRoutes(app.getState()).getIn([address, 'isLocal'])
  t.ok(isLocal, 'route is local')
  t.end()
})

test('on peer connection, the correct route has lastConnectionTime set to now', function (t) {
  t.plan(1)
  var expectedConnectionTime = 1234
  function connectToPeer ({address}, cb) {
    cb(null)
    var lastConnectionTime = app.selectRoutes(app.getState()).getIn([address, 'lastConnectionTime'])
    t.equal(lastConnectionTime, expectedConnectionTime) // division is just to allow for differences in times
  }
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peer = {
    address
  }
  app.doAddRoute(peer)
  app.doSchedulerTick(expectedConnectionTime)
  app.doRouteConnect(peer)
  t.end()
})

test('on peer connection, the correct route has connection count incremented by one', function (t) {
  t.plan(2)
  function connectToPeer ({address}, cb) {
    var connectionCount = app.selectRoutes(app.getState()).getIn([address, 'connectionCount'])
    t.equal(connectionCount, 0) // division is just to allow for differences in times
    cb(null)
    connectionCount = app.selectRoutes(app.getState()).getIn([address, 'connectionCount'])
    t.equal(connectionCount, 1) // division is just to allow for differences in times
  }
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peer = {
    address
  }
  app.doAddRoute(peer)
  app.doRouteConnect(peer)
  t.end()
})

test('on peer connection error, the errors array has the error added', function (t) {
  t.plan(1)
  var expectedErrorString = 'BANG'

  function connectToPeer ({address}, cb) {
    cb(new Error(expectedErrorString))
    var errors = app.selectRoutes(app.getState()).getIn([address, 'errors'])
    t.equal(errors.first(), expectedErrorString)
  }
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peer = {
    address
  }
  app.doAddRoute(peer)
  app.doRouteConnect(peer)
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

test('routes that are connected longer than conneciton lifetime get disconnected', function (t) {
  t.plan(2)
  function connectToPeer ({address}, cb) {
    cb(null)
    var connectionState = app.selectRoutes(app.getState()).getIn([address, 'connectionState'])
    t.equal(connectionState, CONNECTED)
  }
  var app = App({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peer = {
    address
  }

  app.doAddRoute(peer)
  app.doRouteConnect(peer)
  app.doSetConnectionLifetime(1000)

  app.doSchedulerTick(2000)

  setTimeout(function () {
    var connectionState = app.selectRoutes(app.getState()).getIn([address, 'connectionState'])
    t.equal(connectionState, DISCONNECTED)
  }, 1)
})
