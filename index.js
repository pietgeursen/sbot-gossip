var {composeBundlesRaw, debugBundle, createReactorBundle} = require('redux-bundler')

var actions = require('./actions/')

var bundle = Object.assign({
  name: 'sbot-connection-manager',
  reducer: require('./reducers/')

}, actions)

var createStore = composeBundlesRaw(debugBundle, createReactorBundle(), bundle)

var store = createStore()
