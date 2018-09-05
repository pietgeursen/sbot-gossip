# sbot-connection-manager

> improved connection (gossip) manager for scuttlebot

Module that manages making connections to other sbots (peers).
This is a replacement for the scuttlebot gossip plugin that's built into scuttlebot.

I want to get away from using the word gossip because that's not really what this module does.
This modules doesn't discover peers. It doesn't know which peers are friends. It doesn't choose what feeds get replicated.

It just keeps a list of peers and schedules connections to their scuttlebot.

The goal is to provide more control over the manager with code that's easier to understand and extend.

Features:
- Set maximum number of peers to connect to, specified by protocol type.
- Start and stop all connections. 
- Manager is 'off' by default, will only start trying to connect to peers when told to.
- Supports multiple `routes` to a peer. There might be multiple ways to connect to a peer. Other modules in the stack are responsible for discovering routes to peers and then calling `addRouteToPeer(route)`. In this way we can support cases where we might discover a peer locally but also discover it via multiple rtc introducers.
---

Later Features:
- Supports prioritising peers by `HIGH`, `MEDIUM`, `LOW` and `BANNED`.
- Supports initial sync mode. TBD what this actually does, for now just one peer connection, all scheduling of other connections is off.
- Supports "long term connections" where a peer can be specified to remain connected as long as possible.
- Supports connecting immediately and permanently to a peer. Useful for debugging. 
- Provides a stream of peers with errors. Useful for another module to decide which peers should be forgotten and which could be retried occasionally with low priority.
- Provides an observable of peers
- Provides a hook for `onPrioritise` so other modules can change the prioritisation of peers.



This module uses redux as a data store. Hopefully redux is a commonly understood pattern that makes it easy for others to contribute.

## Usage

## API

### Initialisation

```js
var Manager = require('sbot-connection-manager')
var manager = Manager(opts)
```

where `opts` is an object with keys:

`connectToPeer`: (required) an async function that can be passed a multiserver address to begin an outbound connection to a peer. Will normally be the `sbot.connect` function.

### Add a new route to a peer

```js
manager.peer.addRoute(route)
```

Where a route has the shape:

```js
{
  address: <multiserver address>,
  isLocal: false
}
```

### Remove a route to a peer

If a peer discovery module knows that a peer is no longer available it can advise this module it's gone.

```js
manager.peer.removeRoute(route)
```

Where a route has the shape:

```js
{
  address: <multiserver address>,
}
```

### Peers observable

An observable of the peers the manager knows about.

```js
manager.peers // tbd
```

emits objects of shape:

```
TBD
```

### Prioritise peers

```js
manager.peer.setPriority(peer)
```
Where `peer` is an object with shape:
```js
{
  address: multiserverAddress 
  priority: priority.HIGH
}
```
And priority is an enum of HIGH, MED, LOW, BANNED.

### Start making connections 

```js
manager.connections.start()
```

### Stop all connections 

```js
manager.connections.stop()
```

### Set maximum number of connections by type

```js
manager.connections.setMaxByType(max)
```

where `max` is an object of shape. Object will be merged with existing state so you only need to provide keys and values for ones you want to update.
```js
{
  [multiserve protocol]: integer
}
```

defaults to:

```js
{
  'rtc': 3,
  'net': 3,
  'onion': 3,
  'ws': 0,
  'wss': 0,
}
```

### Set scheduler connection lifetime before disconnecting

If a connection is not "long term" it will be disconnected after `time` ms.

```js
manager.connections.setLifetime(timeMs)
```

### Remote peer did connect

```js
manager.peer.remotePeerConnected(peerId)
```

### Connection errors

```js
manager.connection.errors()
```
A pull stream of errors received from trying to connect to peers. Will emit objects of shape:

```js
{
  peer: multiServerAddress,
  error: Error
}
```
where `peerId` is the public key of the peer that connected.

### Initial sync

Starts or stops an initial sync with one (optionally provided) peer.
When initial sync is happening we don't want to be trying to connecting to multiple peers.

```js
manager.initialSync.start([peer])
```

where `peer` is optional.

or

```js
manager.initialSync.stop()
```

## Internal Data Model

The internal data model is a [normalized]() structure with `peers` and `routes` as entities.

```js

{
  peers: {
    <pubKey>: {
      id: <pubKey>,
      isBanned: false,
      routes: []
    } 
  },
  routes: {
    <multiserver-address>: {
      id: <multiserver-address>,
      peer: <pubKey>,
      priority: ... ,
      isLocal: false,
      errors: [],
      connectionStatus: ...,
      connectionCount: 0,
      lastConnectionTime: null
    }
  }
}
```

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install sbot-gossip
```

## Acknowledgments

This project is funded by a grant from [staltz](https://github.com/staltz) for the [mmmmm-mobile](https://github.com/staltz/mmmmm-mobile) project.

Thanks to [dominctarr](https://github.com/dominictarr) for a brain dump and some guidance on how to make this useful in the "normal" scuttlebot context.

Thanks to [mixmix](https://github.com/mixmix) for engaging with the readme and giving feedback.

## See Also

- [`noffle/common-readme`](https://github.com/noffle/common-readme)
- ...

## License

MIT

## TODO

- [x] check where I need to do multi dispatch from the reactors 
- [x] wire up network events the way the old scheduler did 
- [x] write tests over the selectors / sorting alogorithm 
- [ ] write pull stream thing that updates the peers array based on the notify stream. Will need a function that maps my record to the data structure already used.
- [x] allow for config setting that stops gossip on start up. 
- [x] expose function to connect immediately 
- [x] tests on scheduler
- [ ] limit to one connection per peer, even if we have multi routes to it.
- [ ] in the gossip plugin. Just pass around ms addresses, not objects where possible. 
  - [x] test that the scheduler makes and breaks connections
  - [ ] what else needs to be tested?
- [x] decide who to connect to next
  - [x] list sorted by age of last connection time / last error time. 
  - [x] if connection errors, push to end of list
- open a PR on scuttlebot
  - replace gossip plugin with connection manager
 
## TODO later
- is the 'join' stuff set up ok and working. Think we need a selector and to make sure the join is created ok.
- tests on peers
- handle inbound peer stuff


## Open Questions

- what isLocal? 
  - is it about signifying this is high bandwidth / we can hammer this connection? 
  - is it about being physically close to another human 
- why do Peers exist as distinct from Routes 
  - peer is mainly useful for blanket-banning any connections to a route 
  - could have a priority list by connection type e.g. isLocal, bluetooth, onion, tcp 
- how do we ban people from connecting to us? 

- Should this be a stand-alone sbot plugin or just straightup replace gossip
  - If it's standalone gossip needs to be turned off and we need to find places in sbot or clients that reference it
    
  - For mvp I could just leave almost all of the gossip plugin alone and just insert connection manager as the scheduler.
