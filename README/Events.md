#Overview

Events is an event bus for your client application.
It supports triggering and listening to events.

It has some neat features including:

1. Async triggering / binding

2. Cloned event data

3. Getting triggered events after they have already triggered

Events exists in the <b>/dist/</b> folder and the <b>/dist/min/</b> folder as <b>Events.js</b>.

##Creation
Events receives a few parameters for it's constructor.

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | A default application name for events | "*" - trigger for all |
| cloneEventData | Boolean | Defines if data is cloned per subscriber, if ```true``` incurs minor performance penalty but promises original event data | false |
| eventBufferLimit | Number | Defines number of events stored in history (retrievable by hasFired) | -1 , no limitation |

Example:
```javascript
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
Returns an eventId you can use to unbind with.

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
```javascript
   var eventId = events.bind({
        appName: "MyApp",
        eventName: "Terminating",
        func : function doCleanUp(){ //Clean up my stuff  },
        context: myAppInstance,
        once: true,
        aSync : true
    });
```

##trigger / publish
This is used for triggering an event.

Parameters:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | The name of the application we're triggering with| default app (from configuration) |
| eventName | String | The nane of the event we're triggering | None - Required |
| data | Object/ String / Boolean / Number | The event data we are sharing | None - required |
| passDataByRef | Boolean | Can force passing all data by REF or as Cloned to each listener| true (*can be overriden in general config) |
| aSync | Boolean | Trigger as none blocking | false |

Example:
```javascript
    events.trigger({
        appName: "MyApp",
        eventName: "Terminating",
        aSync : true,
        passDataByRef: false,
        data: { msg: "App Ending", reason: "Server fail", code: 57  }
    });
```

Example data listener gets:
```javascript
    listener(
             EventData, //Whatever the event publisher sent
             EventMetaData //Event meta data : { eventName, appName }
            );
```
EventMetaData contains:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | The name of the application | default app (from configuration) |
| eventName | String | The name of the event | None - Required |


##unbind / unregister
Supports getting the full reference that you subscribed with or the eventId that was returned on bind / register.

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | The name of the application | None |
| eventName | String | The name of the event | None |
| func | Function | The bound function | None |
| context | Object | The execution context | None |

Or

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| eventId | String | The eventId returned when the bind /register occured | None |


Example:

```javascript
    events.unbind({
        appName: "MyApp",
        eventName: "Terminating",
        func : function doCleanUp(){ /*Clean up my stuff*/  },
        context: myAppInstance,
    });
```

Or

```javascript
    events.unbind(eventId);
```

##hasFired
Returns already fired events if they still exist in the cache (see configuring events at the top).

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| appName | String | The name of the application | default app name |
| eventName | String | The name of the event | None |

Example:

```javascript
    var firedEvents = events.hasFired(appName, eventName);

```


