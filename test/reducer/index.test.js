var test = require('tape')

var {peersMaxConnectionsSet, peersAdded} = require('../../actions/')
var reducer = require('../../reducers/')
var {initialState} = require('../../reducers/')

test('Set Peers Max', function (t) {
  var expected = 3
  var action = peersMaxConnectionsSet(expected)
  var newState = reducer(initialState, action)
  t.equal(newState.get('maxConnectedPeers'), expected, 'Peers max is set')
  t.end()
})

test('Adds peers', function (t) {
  var peers = ['123', '456']
  var action = peersAdded(peers)
  var newState = reducer(initialState, action)
  t.deepEqual(newState.get('peers').toJS(), peers, 'Peers are added')
  t.end()
})
