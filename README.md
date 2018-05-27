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
- Supports prioritising peers by `HIGH`, `MEDIUM`, `LOW` and `BANNED`.
- Supports initial sync mode. TBD what this actually does, for now just one peer connection, all scheduling of other connections is off.
- Supports "long term connections" where a peer can be specified to remain connected as long as possible.
- Supports connecting immediately and permanently to a peer. Useful for debugging. 
- Provides a stream of peers with errors. Useful for another module to decide which peers should be forgotten and which could be retried occasionally with low priority.
- Provides an observable of peers
- Provides a hook for `onPrioritise` so other modules can change the prioritisation of peers.
- Supports multiple `routes` to a peer. There might be multiple ways to connect to a peer. Other modules in the stack are responsible for discovering routes to peers and then calling `addRouteToPeer(route)`. In this way we can support cases where we might discover a peer locally but also discover it via multiple rtc introducers.


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
manager.peers.setPriority(peer)
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
manager.connections.remotePeerConnected(peerId)
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

