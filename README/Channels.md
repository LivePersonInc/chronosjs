#Overview

Channels wraps Events, Commands and ReqRes as a single package.
It's main use is to pass around when you'd like to share your events bus with multiple iFrames or have a single triggering engine.
Such cases arise mainly when you'd like to trigger events between iFrames / Apps.

Channels exists in the <b>/dist/</b> folder and the <b>/dist/min/</b> folder as <b>Channels.js</b>.

Example :
```
var channel = new Chronos.Channels(options);
```

Options can contain:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| config | Object | Configuration for protocols | None |
| events | Events Instance | A [Chronos.Events](Events.md) instance | None |
| commands | Commands Instance | A [Chronos.Commands](Commands.md) instance | None |
| reqres | ReqRes Instance | A [Chronos.ReqRes](ReqRes.md) instance | None |


Config object options:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| events | Object | A [Chronos.Events](Events.md) configuration object| None |
| commands | Object | A [Chronos.Commands](Commands.md) configuration object| None |
| reqres | Object | A [Chronos.ReqRes](ReqRes.md) configuration object| None |


Sample Code:
```
var channel = new Chronos.Channels({
    config: {
        events: {},
        commands: {},
        reqres: {}
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

