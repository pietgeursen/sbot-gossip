var test = require('tape')

var {peersMaxNum} = require('../../actions/')
var reducer = require('../../reducers/')
var {initialState} = require('../../reducers/')

test('ok', function (t) {
  var expected = 3
  var action = peersMaxNum(expected)
  var newState = reducer(initialState, action)
  t.equal(newState.peers.max, expected)
  t.end()
})
