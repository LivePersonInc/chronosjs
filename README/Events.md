#Overview

Events is an event bus for your client application.
It supports triggering and listening to events.

##Creation
Events recieves a few parameters for it's constructor.

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | A default application name for events | "*" - trigger for all |
| cloneEventData | Boolean | Defines if data is cloned per subscriber, if ```true``` incurs minor performance penalty but promises original event data | false |
| eventBufferLimit | Number | Defines number of events stored in history (retrievable by hasFired) | -1 , no limitation |

Example:
```
 var events = new Chronos.Events({
    appName: "MyApp",
    cloneEventData : true,
    eventBufferLimit: 100
 });
```

#API
These are the exposed methods on an instance.

##bind / register / once
This binds to a specific event.
<b>bind</b> and <b>register</b> are the same, <b>once</b> raises the once flag when binding.

Parameters:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | The name of the application we're listening to | default app (from configuration) |
| eventName | String | The nanme of the event we're listening to | None - Required |
| func | Function OR Array of functions | Function/s to trigger when event has fired | None - required |
| context | Object | Execution context for the function | None |
| aSync | Boolean | Trigger call back as none blocking for the original flow | false |
| once | Boolean | Triggers this function only once and unbinds it| false |

Example:
```
    event.bind({
        appName: "MyApp",
        eventName: "Terminating",
        func : function doCleanUp(){ //Clean up my stuff  },
        context: myAppInstance,
        once: true,
        aSync : true
    });
```




