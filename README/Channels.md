#Overview

Channels wraps Events, Commands and ReqRes as a single package.
It's main use is to pass around when you'd like to share your events bus with multiple iFrames or have a single triggering engine.
Such cases arise mainly when you'd like to trigger events between iFrames / Apps.

Channels exists in the <b>/dist/</b> folder and the <b>/dist/min/</b> folder as <b>Channels.js</b>.

Example :
```javascript
var channel = new Chronos.Channels(options);
```

Options can contain:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| config | Object | Configuration for protocols | None |
| events | Events Instance | A [Chronos.Events](Events.md) instance | None |
| commands | Commands Instance | A [Chronos.Commands](Commands.md) instance | None |
| reqres | ReqRes Instance | A [Chronos.ReqRes](ReqRes.md) instance | None |
| externalProxy | Boolean | Allows Courier to automatically trigger events to all iFrames that share Channels | false|

<b>In order to share your events across iFrames you must set the "externalProxy" flag to true</b>.

<b>config</b> object options:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| events | Object | A [Chronos.Events](Events.md) configuration object| None |
| commands | Object | A [Chronos.Commands](Commands.md) configuration object| None |
| reqres | Object | A [Chronos.ReqRes](ReqRes.md) configuration object| None |

Sample Code:
```javascript
var channel = new Chronos.Channels({
    externalProxy : true,
    config: {
        events: {},
        commands: {},
        reqres: {},
    }
});
```
Exposed Instance API:

1. once //From [Events](Events.md)

2. hasFiredEvents //From [Events](Events.md)

3. trigger //From [Events](Events.md)

4. publish //From [Events](Events.md)

5. bind //From [Events](Events.md)

6. register //From [Events](Events.md)

7. unbind //From [Events](Events.md)

8. unregister //From [Events](Events.md)

9. hasFiredCommands //From [Commands](Commands.md)

10. comply //From [Commands](Commands.md)

11. stopComplying //From [Commands](Commands.md)

12. command //From [Commands](Commands.md)

13. hasFiredReqres //From [ReqRes](ReqRes.md)

14. request //From [ReqRes](ReqRes.md)

15. reply //From [ReqRes](ReqRes.md)

16. stopReplying //From [ReqRes](ReqRes.md)

17. registerProxy

##registerProxy
If the <b>externalProxy</b> flag was set to true in the options, then this method is added.

It allows triggering events to your proxy and automatically triggers <b>[Events](Events.md)</b> to any [PostMessageCourier](Courier.md) instances using the same Channels instance.

This means your iFrames can get your <b>[Events](Events.md)</b> for free.

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| trigger| Function | The proxy function to call when an event triggers | None |
| context | Function Context | The execution context of the function | undefined |

Example:
```javascript
    var channel = new Chronos.Channels({
        externalProxy : true
    });

    channel.registerProxy({
       trigger: function(){
           //DO something with arguments
       },
       context: myContext
    });
```

