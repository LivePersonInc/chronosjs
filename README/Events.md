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
