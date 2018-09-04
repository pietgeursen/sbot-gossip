var test = require('tape')
var Store = require('../store')

var {PRIORITY_MED, PRIORITY_HIGH} = require('../types')
var {
  DISCONNECTED,
  CONNECTED,
  CONNECTING
} = require('../routes/types')

function connectToPeer (address) {

}

test('simple', function (t) {
  var app = Store({connectToPeer})
  t.ok(app, 'app is a thing')
  t.end()
})

test('throws if connectToPeer not passed in opts', function (t) {
  t.throws(() => Store({}), 'throws')
  t.end()
})

test('Set Max Peers', function (t) {
  var app = Store({connectToPeer})
  var expected = 5
  app.doSetMaxNumConnections(expected)

  var newState = app.selectMaxConnectedPeers(app.getState())
  t.equal(newState, expected, 'Peers rtc max is set')
  t.end()
})

test('Adds a peer', function (t) {
  var app = Store({connectToPeer})
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

test('remove peer', function (t) {
  var app = Store({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var address = `rtc:hello.com:8091~shs:${peerId}`
  var peerAddress = {
    address
  }
  app.doAddPeer(peerAddress)
  var peer = app.selectPeers(app.getState()).get(peerId)
  t.ok(peer, 'new peer was added')

  app.doRemovePeer(peerAddress)
  peer = app.selectPeers(app.getState()).get(peerId)
  t.false(peer)

  t.end()
})

test('connecting to a route immediately updates to CONNECTING and eventually CONNECTED on success', function (t) {
  t.plan(2)
  function connectToPeer (address, cb) {
    var connectionState = app.selectRoutes(app.getState()).getIn([address, 'connectionState'])
    t.equal(connectionState, CONNECTING)
    cb(null)
    connectionState = app.selectRoutes(app.getState()).getIn([address, 'connectionState'])
    t.equal(connectionState, CONNECTED)
  }
  var app = Store({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var multiserverAddress = `rtc:hello.com:8091~shs:${peerId}`
  app.doAddRoute({multiserverAddress})
  app.doRouteConnect({multiserverAddress})
})

test('connecting to a route immediately dispatches CONNECTING and eventually DISCONNECTED on error', function (t) {
  t.plan(2)
  function connectToPeer (address, cb) {
    var connectionState = app.selectRoutes(app.getState()).getIn([address, 'connectionState'])
    t.equal(connectionState, CONNECTING)
    cb(new Error('zzzzt'))
    connectionState = app.selectRoutes(app.getState()).getIn([address, 'connectionState'])
    t.equal(connectionState, DISCONNECTED)
  }
  var app = Store({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var multiserverAddress = `rtc:hello.com:8091~shs:${peerId}`
  var payload = {
    multiserverAddress
  }
  app.doAddRoute(payload)
  app.doRouteConnect(payload)
  t.end()
})

test('isLocal is set for a local route', function (t) {
  var app = Store({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var multiserverAddress = `rtc:hello.com:8091~shs:${peerId}`
  var payload = {
    multiserverAddress,
    isLocal: true
  }
  app.doAddRoute(payload)
  var isLocal = app.selectRoutes(app.getState()).getIn([multiserverAddress, 'isLocal'])
  t.ok(isLocal, 'route is local')
  t.end()
})

test('on peer connection, the correct route has lastConnectionTime set to now', function (t) {
  t.plan(1)
  var expectedConnectionTime = 1234
  function connectToPeer (multiserverAddress, cb) {
    cb(null)
    var lastConnectionTime = app.selectRoutes(app.getState()).getIn([multiserverAddress, 'lastConnectionTime'])
    t.equal(lastConnectionTime, expectedConnectionTime) // division is just to allow for differences in times
  }
  var app = Store({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var multiserverAddress = `rtc:hello.com:8091~shs:${peerId}`
  var payload = {
    multiserverAddress
  }
  app.doAddRoute(payload)
  app.doSchedulerTick(expectedConnectionTime)
  app.doRouteConnect(payload)
  t.end()
})

test('on peer connection, the correct route has connection count incremented by one', function (t) {
  t.plan(2)
  function connectToPeer (multiserverAddress, cb) {
    var connectionCount = app.selectRoutes(app.getState()).getIn([multiserverAddress, 'connectionCount'])
    t.equal(connectionCount, 0) // division is just to allow for differences in times
    cb(null)
    connectionCount = app.selectRoutes(app.getState()).getIn([multiserverAddress, 'connectionCount'])
    t.equal(connectionCount, 1) // division is just to allow for differences in times
  }
  var app = Store({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var multiserverAddress = `rtc:hello.com:8091~shs:${peerId}`
  var payload = {
    multiserverAddress
  }
  app.doAddRoute(payload)
  app.doRouteConnect(payload)
  t.end()
})

test('on peer connection error, the errors array has the error added', function (t) {
  t.plan(1)
  var expectedErrorString = 'BANG'

  function connectToPeer (multiserverAddress, cb) {
    cb(new Error(expectedErrorString))
    var errors = app.selectRoutes(app.getState()).getIn([multiserverAddress, 'errors'])
    t.equal(errors.first(), expectedErrorString)
  }
  var app = Store({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var multiserverAddress = `rtc:hello.com:8091~shs:${peerId}`
  var payload = {
    multiserverAddress
  }
  app.doAddRoute(payload)
  app.doRouteConnect(payload)
  t.end()
})

test('set priority on a route', function (t) {
  var app = Store({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var multiserverAddress = `rtc:hello.com:8091~shs:${peerId}`
  var payload = {
    multiserverAddress
  }
  app.doAddRoute(payload)
  app.doSetRoutePriority(payload, PRIORITY_MED)

  var priority = app.selectRoutes(app.getState()).getIn([multiserverAddress, 'priority'])

  t.equal(priority, PRIORITY_MED, 'route priority is set')

  app.doSetRoutePriority(payload, PRIORITY_HIGH)

  priority = app.selectRoutes(app.getState()).getIn([multiserverAddress, 'priority'])

  t.equal(priority, PRIORITY_HIGH, 'route priority is updated')

  t.end()
})

test('set peer isLongterm', function (t) {
  var app = Store({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var multiserverAddress = `rtc:hello.com:8091~shs:${peerId}`
  var payload = {
    multiserverAddress
  }
  app.doAddRoute(payload)

  var isLongterm = app.selectRoutes(app.getState()).getIn([multiserverAddress, 'isLongterm'])
  t.equal(isLongterm, false, 'longterm is set')

  app.doSetRouteLongtermConnection(payload, true)

  isLongterm = app.selectRoutes(app.getState()).getIn([multiserverAddress, 'isLongterm'])
  t.equal(isLongterm, true, 'longterm is set')

  t.end()
})

test('routes that are connected longer than conneciton lifetime get disconnected', function (t) {
  t.plan(2)
  function connectToPeer (multiserverAddress, cb) {
    cb(null)
    var connectionState = app.selectRoutes(app.getState()).getIn([multiserverAddress, 'connectionState'])
    t.equal(connectionState, CONNECTED)
  }
  var app = Store({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var multiserverAddress = `rtc:hello.com:8091~shs:${peerId}`
  var payload = {
    multiserverAddress
  }

  app.doAddRoute(payload)
  app.doRouteConnect(payload)
  app.doSetConnectionLifetime(1000)

  app.doSchedulerTick(2000)

  setTimeout(function () {
    var connectionState = app.selectRoutes(app.getState()).getIn([multiserverAddress, 'connectionState'])
    t.equal(connectionState, DISCONNECTED)
  }, 1)
})

test('scheduler makes connections when started and disconnects when scheduler is stopped', function (t) {
  t.plan(2)
  function connectToPeer (multiserverAddress, cb) {
    cb(null)
    var connectionState = app.selectRoutes(app.getState()).getIn([multiserverAddress, 'connectionState'])
    t.equal(connectionState, CONNECTED, 'scheduler made the connection on start')
    app.doStopScheduler()

    setTimeout(function () {
      connectionState = app.selectRoutes(app.getState()).getIn([multiserverAddress, 'connectionState'])
      t.equal(connectionState, DISCONNECTED, 'scheduler closed the connection on stop')
    }, 1)
  }
  var app = Store({connectToPeer})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  var multiserverAddress = `rtc:hello.com:8091~shs:${peerId}`
  var payload = {
    multiserverAddress
  }
  app.doAddRoute(payload)
  app.doStartScheduler(100)
})
