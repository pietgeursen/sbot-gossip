'use strict'
var {Record, fromJS, List} = require('immutable')
var {createSelector} = require('redux-bundler')
var { parseAddress, feedIdRegex: FeedIdRegex } = require('ssb-ref')

var {PRIORITY_MED} = require('../types')

var {
  DISCONNECTED,
  DISCONNECTING,
  CONNECTED,
  CONNECTING
} = require('./types')

var RouteRecord = Record({
  id: '', // A multiserver address
  peer: '', // id of peer this route belongs to. TBD if this needs to be here if the peer has a list of routes too.
  connectionState: DISCONNECTED,
  priority: PRIORITY_MED,

  // Below here all needs to be non-volatile
  lastConnectionTime: null,
  isLongterm: false,
  isLocal: false, // we can't tell a local connection by looking at its multiserver address. It will always be 'net'
  errors: List([]),
  connectionCount: 0
})

const initialState = fromJS({})

module.exports = {
  name: 'routes',
  reducer: function (state = initialState, action) {
    switch (action.type) {
      case ROUTE_ADDED: {
        const { address, isLocal } = action.payload
        const key = getKeyFromAddress(address)

        return state.update(address, function (route) {
          if (!route) {
            route = RouteRecord({id: address, peer: key, isLocal})
          }

          return route
        })
      }
      case ROUTE_REMOVED: {
        const { address } = action.payload

        return state.delete(address)
      }
      case CONNECTION_LONGTERM_SET: {
        const { address, isLongterm } = action.payload

        return state.setIn([address, 'isLongterm'], isLongterm)
      }
      case PRIORITY_SET: {
        const { address, priority } = action.payload

        return state.setIn([address, 'priority'], priority)
      }
      case CONNECTION_STARTED: {
        const { address } = action.payload

        return state.setIn([address, 'connectionState'], CONNECTING)
      }
      case CONNECTION_CONNECTED: {
        const { address, appTime } = action.payload

        return state
          .setIn([address, 'connectionState'], CONNECTED)
          .setIn([address, 'lastConnectionTime'], appTime)
          .updateIn([address, 'connectionCount'], function (count) {
            return count + 1
          })
      }
      case CONNECTION_CLOSED: {
        const { address } = action.payload

        return state.setIn([address, 'connectionState'], DISCONNECTED)
      }
      case CONNECTION_ERROR: {
        const { address, error } = action.payload

        return state.updateIn([address, 'errors'], function (errors) {
          return errors.push(error)
        })
      }
      case CONNECTION_STARTED_CLOSING: {
        const { address } = action.payload

        return state.setIn([address, 'connectionState'], DISCONNECTING)
      }
      default:
        return state
    }
  },
  doAddRoute,
  doRemoveRoute,
  doRouteConnect,
  doRouteDisconnect,
  doRoutesDisconnect,
  doRouteDidDisconnect,
  doSetRoutePriority,
  doSetRouteLongtermConnection,
  doInboundRouteConnected,

  selectRoutes,
  selectConnectedRoutes: createSelector('selectRoutes', function (routes) {
    return routes.filter(function (route) {
      return route.get('connectionState') === CONNECTED
    })
  }),
  selectRoutesThatShouldDisconnect: createSelector('selectConnectedRoutes', 'selectAppTime', 'selectConnectionLifetime', function (routes, appTime, connectionLifetime) {
    return routes.filter(function (route) {
      const connectionTime = route.get('lastConnectionTime')
      const routeConnectionTime = connectionTime === null ? 0 : connectionTime
      const timePassed = appTime - routeConnectionTime
      return timePassed > connectionLifetime
    })
  }),
  reactRoutesThatShouldDisconnect: createSelector('selectRoutesThatShouldDisconnect', function (routes) {
    // needs to return an action. but we're dealing with an action that should change mulitple routes.
    if (routes.isEmpty()) return
    return {
      actionCreator: 'doRoutesDisconnect',
      args: [routes]
    }
  })

}

function selectRoutes (state) {
  return state.routes
}

const ROUTE_ADDED = 'ROUTE_ADDED'
const ROUTE_REMOVED = 'ROUTE_REMOVED'
const CONNECTED_TO_US = 'CONNECTION_CONNECTED_TO_US'
const PRIORITY_SET = 'PRIORITY_SET' // Does this have immediate affect? Easier if not.
const CONNECTION_LONGTERM_SET = 'CONNECTION_LONGTERM_SET'
// thunk here to dispatch this.
const CONNECTION_STARTED = 'CONNECTION_STARTED'
const CONNECTION_CONNECTED = 'CONNECTION_CONNECTED'
const CONNECTION_ERROR = 'CONNECTION_ERROR'
const CONNECTION_STARTED_CLOSING = 'CONNECTION_STARTED_CLOSING'
const CONNECTION_CLOSED = 'CONNECTION_CLOSED'

function doAddRoute ({address, isLocal}) {
  return {
    type: ROUTE_ADDED,
    payload: {
      address,
      isLocal
    }
  }
}

function doRemoveRoute ({address}) {
  return {
    type: ROUTE_REMOVED,
    payload: {
      address
    }
  }
}

function doSetRoutePriority ({address}, priority) {
  return {
    type: PRIORITY_SET,
    payload: {
      address,
      priority
    }
  }
}

function doSetRouteLongtermConnection ({address}, isLongterm) {
  return {
    type: CONNECTION_LONGTERM_SET,
    payload: {
      address,
      isLongterm
    }
  }
}
// on connected we'll return a thunk that immediately dispatched connected with timeoutId as payload. Started closing will be dispatched eventually
// OR we use the nice reactor pattern. We dispatch connection time timed out and then write a selector so we only dispatch disconnect if we are still connected
function doRouteConnect (route) {
  return function ({dispatch, connect, getState, store}) {
    var appTime = store.selectAppTime(getState())

    dispatch({ type: CONNECTION_STARTED, payload: route })
    connect(route, function (err) {
      if (err) {
        dispatch({type: CONNECTION_ERROR, payload: {address: route.address, error: err.message}})
        dispatch(doRouteDidDisconnect(route))
      } else {
        dispatch({type: CONNECTION_CONNECTED, payload: {address: route.address, appTime}})
      }
    })
  }
}

// we want to disconnect
function doRouteDisconnect (route) {
  return function ({dispatch, disconnect}) {
    dispatch({type: CONNECTION_STARTED_CLOSING, payload: route})
    disconnect(route, function (err) {
      if (err) console.log(err) // we tried to disconnect from an already disconnected route. Log and forget.
      dispatch({type: CONNECTION_CLOSED, payload: route})
    })
  }
}

function doRoutesDisconnect (routes) {
  return function ({dispatch, disconnect}) {
    routes.forEach(function (_, route) {
      dispatch(doRouteDisconnect({address: route}))
    })
  }
}

// disconnected remotely
function doRouteDidDisconnect (route) {
  return {type: CONNECTION_CLOSED, payload: route}
}

function doInboundRouteConnected (route) {
  return {
    type: CONNECTED_TO_US,
    payload: route
  }
}

var feedIdRegex = new RegExp(FeedIdRegex)

function getKeyFromAddress (address) {
  var {key} = parseAddress(address)
  return key.match(feedIdRegex)[1]
}
