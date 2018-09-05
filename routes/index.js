'use strict'
var {Record, Map, List} = require('immutable')
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
  lastConnectionTime: -1,
  lastErrorTime: -1,
  isLongterm: false,
  isLocal: false, // we can't tell a local connection by looking at its multiserver address. It will always be 'net'
  errors: List([]),
  connectionCount: 0
})

var initialState = Map({})

module.exports = {
  name: 'routes',
  getReducer: function () {
    if (this.initialState) {
      initialState = this.initialState
    }
    return this._reducer
  },
  _reducer: function (state = initialState, action) {
    switch (action.type) {
      case ROUTE_ADDED: {
        const { multiserverAddress, isLocal, isLongterm } = action.payload
        const key = getKeyFromAddress(multiserverAddress)

        return state.update(multiserverAddress, function (route) {
          if (!route) {
            route = RouteRecord({id: multiserverAddress, peer: key, isLocal, isLongterm: Boolean(isLongterm)})
          }

          return route
        })
      }
      case ROUTE_REMOVED: {
        const { multiserverAddress } = action.payload

        return state.delete(multiserverAddress)
      }
      case CONNECTION_LONGTERM_SET: {
        const { multiserverAddress, isLongterm } = action.payload

        return state.setIn([multiserverAddress, 'isLongterm'], isLongterm)
      }
      case PRIORITY_SET: {
        const { multiserverAddress, priority } = action.payload

        return state.setIn([multiserverAddress, 'priority'], priority)
      }
      case CONNECTION_STARTED_MULTI: {
        const { multiserverAddresses } = action.payload

        const updatedRoutes = multiserverAddresses
          .reduce(function (currentState, multiserverAddress) {
            return currentState
              .setIn([multiserverAddress, 'connectionState'], CONNECTING)
          }, state)

        return state.mergeDeep(updatedRoutes)
      }
      case CONNECTION_CONNECTED: {
        const { multiserverAddress, appTime } = action.payload

        return state
          .setIn([multiserverAddress, 'connectionState'], CONNECTED)
          .setIn([multiserverAddress, 'lastConnectionTime'], appTime)
          .updateIn([multiserverAddress, 'connectionCount'], function (count) {
            return count + 1
          })
      }
      case CONNECTION_CLOSED: {
        const { multiserverAddress } = action.payload

        return state.setIn([multiserverAddress, 'connectionState'], DISCONNECTED)
      }
      case CONNECTION_ERROR: {
        const { multiserverAddress, error, appTime } = action.payload

        return state
          .updateIn([multiserverAddress, 'errors'], function (errors) {
            return errors.push(error)
          })
          .setIn([multiserverAddress, 'lastErrorTime'], appTime)
      }
      case CONNECTION_STARTED_CLOSING: {
        const { multiserverAddress } = action.payload

        return state.setIn([multiserverAddress, 'connectionState'], DISCONNECTING)
      }
      case CONNECTION_STARTED_CLOSING_MULTI: {
        const { multiserverAddresses } = action.payload

        const updatedRoutes = multiserverAddresses
          .reduce(function (currentState, multiserverAddress) {
            return currentState
              .setIn([multiserverAddress, 'connectionState'], DISCONNECTING)
          }, state)

        return state.mergeDeep(updatedRoutes)
      }
      default:
        return state
    }
  },
  doAddRoute,
  doRemoveRoute,
  doRoutesConnect,
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
  selectConnectedRoutesNotLongterm: createSelector('selectConnectedRoutes', function (routes) {
    return routes.filter(function (route) {
      return !route.get('isLongterm')
    })
  }),
  selectDisconnectedRoutes: createSelector('selectRoutes', function (routes) {
    return routes.filter(function (route) {
      return route.get('connectionState') === DISCONNECTED
    })
  }),
  selectDisconnectedRoutesWithoutRecentErrors: createSelector('selectDisconnectedRoutes', function (routes) {
    return routes.filter(function (route) {
      return route.get('lastConnectionTime') >= route.get('lastErrorTime')
    })
  }),
  selectDisconnectedRoutesWithRecentErrors: createSelector('selectDisconnectedRoutes', function (routes) {
    return routes.filter(function (route) {
      return route.get('lastConnectionTime') < route.get('lastErrorTime')
    })
  }),
  selectNextRoutesToConnectTo: createSelector('selectDisconnectedRoutesWithoutRecentErrors', 'selectDisconnectedRoutesWithRecentErrors', function (routesWithoutErrors, routesWithErrors) {
    // This is _ok_ but could be better. For now as soon as it errors it goes to the back where it's unlikely to be tried again. Maybe that's ok.
    var sortedWithoutErrors = routesWithoutErrors
      .sortBy(function (route) {
        return route.get('lastConnectionTime')
      })
    var sortedWithErrors = routesWithErrors
      .sortBy(function (route) {
        return route.get('lastErrorTime')
      })

    return sortedWithoutErrors
      .concat(sortedWithErrors)
      .sortBy(function (route) {
        return !route.get('isLongterm')
      })
  }),
  selectRoutesThatShouldDisconnect: createSelector('selectConnectedRoutesNotLongterm', 'selectAppTime', 'selectConnectionLifetime', function (routes, appTime, connectionLifetime) {
    return routes
      .filter(function (route) {
        const connectionTime = route.get('lastConnectionTime')
        const timePassed = appTime - connectionTime
        return timePassed > connectionLifetime
      })
      .sortBy(function (route) {
        return route.get('lastConnectionTime')
      })
      .reverse()
      .skip(1)
  }),
  reactRoutesThatShouldDisconnect: createSelector('selectRoutesThatShouldDisconnect', function (routes) {
    // needs to return an action. but we're dealing with an action that should change mulitple routes.
    var addresses = routes.map(function (route) {
      return route.id
    })
    if (routes.isEmpty()) return

    return doRoutesDisconnect(addresses)
  }),
  reactRoutesThatShouldConnect: createSelector('selectIsSchedulerRunning', 'selectNumberOfFreeConnectionSlots', 'selectNextRoutesToConnectTo', function (isSchedulerRunning, numberOfFreeSlots, nextRoutesToConnectTo) {
    if (isSchedulerRunning && numberOfFreeSlots > 0) {
      var addresses = nextRoutesToConnectTo
        .take(numberOfFreeSlots)
        .map(function (route) {
          return route.id
        })
      return doRoutesConnect(addresses)
    }
  }),
  RouteRecord
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
const CONNECTION_STARTED_MULTI = 'CONNECTION_STARTED_MULTI'
const CONNECTION_CONNECTED = 'CONNECTION_CONNECTED'
const CONNECTION_ERROR = 'CONNECTION_ERROR'
const CONNECTION_STARTED_CLOSING = 'CONNECTION_STARTED_CLOSING'
const CONNECTION_STARTED_CLOSING_MULTI = 'CONNECTION_STARTED_CLOSING_MULTI'
const CONNECTION_CLOSED = 'CONNECTION_CLOSED'

function doAddRoute ({multiserverAddress, isLocal, isLongterm}) {
  return {
    type: ROUTE_ADDED,
    payload: {
      multiserverAddress,
      isLocal,
      isLongterm
    }
  }
}

function doRemoveRoute ({multiserverAddress}) {
  return {
    type: ROUTE_REMOVED,
    payload: {
      multiserverAddress
    }
  }
}

function doSetRoutePriority ({multiserverAddress}, priority) {
  return {
    type: PRIORITY_SET,
    payload: {
      multiserverAddress,
      priority
    }
  }
}

function doSetRouteLongtermConnection ({multiserverAddress}, isLongterm) {
  return {
    type: CONNECTION_LONGTERM_SET,
    payload: {
      multiserverAddress,
      isLongterm
    }
  }
}
// on connected we'll return a thunk that immediately dispatched connected with timeoutId as payload. Started closing will be dispatched eventually
// OR we use the nice reactor pattern. We dispatch connection time timed out and then write a selector so we only dispatch disconnect if we are still connected
function doRouteConnect ({multiserverAddress}) {
  return function ({dispatch, connect, getState, store, notifyChanges}) {
    var appTime = store.selectAppTime(getState())

    connect(multiserverAddress, function (err) {
      if (err) {
        dispatch({type: CONNECTION_ERROR, payload: {multiserverAddress, error: err.message, appTime}})
        dispatch(doRouteDidDisconnect({multiserverAddress}))
        notifyChanges({type: 'connect-failure'}, multiserverAddress)
      } else {
        notifyChanges({type: 'connect'}, multiserverAddress)
        dispatch({type: CONNECTION_CONNECTED, payload: {multiserverAddress, appTime}})
      }
    })
  }
}

// we want to disconnect
function doRouteDisconnect ({multiserverAddress}) {
  return function ({dispatch, disconnect, notifyChanges}) {
    disconnect(multiserverAddress)
    dispatch(doRouteDidDisconnect({multiserverAddress}))
    notifyChanges({type: 'disconnect'}, multiserverAddress)
  }
}

function doRoutesDisconnect (multiserverAddresses) {
  return function ({dispatch, disconnect}) {
    dispatch({ type: CONNECTION_STARTED_CLOSING_MULTI, payload: {multiserverAddresses} })
    multiserverAddresses.forEach(function (multiserverAddress) {
      dispatch(doRouteDisconnect({multiserverAddress}))
    })
  }
}

function doRoutesConnect (multiserverAddresses) {
  return function ({dispatch, disconnect}) {
    dispatch({ type: CONNECTION_STARTED_MULTI, payload: {multiserverAddresses} })
    multiserverAddresses.forEach(function (multiserverAddress) {
      dispatch(doRouteConnect({multiserverAddress}))
    })
  }
}
// disconnected remotely
function doRouteDidDisconnect ({multiserverAddress}) {
  return {type: CONNECTION_CLOSED, payload: {multiserverAddress}}
}

function doInboundRouteConnected ({multiserverAddress}) {
  return {
    type: CONNECTED_TO_US,
    payload: multiserverAddress
  }
}

var feedIdRegex = new RegExp(FeedIdRegex)

function getKeyFromAddress (address) {
  var {key} = parseAddress(address)
  return key.match(feedIdRegex)[1]
}
