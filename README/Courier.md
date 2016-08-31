#Overview

Courier functions in two main ways:
1. Spawning it's own private events engine
2. Receiving an event engine (Channels externally)

It is important to note the use case you want when creating a Courier instance.

Example (Private events channel):
```
    var courier = new new Chronos.PostMessageCourier({ target :  targetConfiguration });
```

Example shared Events channel:
```
    var channel = new Chronos.Channels(); //Private instance you can pass around to other couriers
    var courier = new new Chronos.PostMessageCourier({
        eventChannel: channel,
        target :  targetConfiguration
    });
```
Here is a more in depth [iFrame integration overview](IFRAME.md).



