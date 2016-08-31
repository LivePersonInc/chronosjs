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

##How to set up iFrames with Courier
Both parent page and child iFrame need to include the <b>PostMessageCourier.js</b> from the dist directory (there is a minified, compressed version in the <b>min</b> directory).
In order to set up iFrames you have two options:

1. Create your own iFrame and pass it in to Courier
2. Pass in a URL and let Courier create it for you


##Creating your own iFrame
```
    function createIFrame(options) {
        var src ,
        frame = document.createElement("IFRAME");

        for(var key in options.attributes){
            frame.setAttribute(key, options[key]);
        }
        for(var attr in options.styles){
            frame.style[attr] = options.styles[attr];
        }

        frame.addEventListener("load", function() {
            if (typeof options.callback === "function") {
                options.callback(options.context);
            }
        }.bind(this), true);

        document.body.appendChild(frame);

        if (options && options.target && options.target.url) {
            src = options.url + (0 < options.url.indexOf("?") ? "&bust=" : "?bust=");
            src += (new Date()).getTime();
            src += ("&host=" + document.location.protocol + "//" + document.location.host);
            frame.setAttribute("src", src);
        }
        return frame;
    }
```
After you have created your own iFrame you need to create a courier instance and pass it to the Courier.

```
    var frame = createIFrame({
        url: "https://mysite.com/integration/index.html",
        attrs: {
            id: "MyId",
            title: "MyTitle",
            name: "MyName",
            tabindex : 0
        },
        styles : {
            position: "fixed",
            top: "5px",
            left: "5px",
            width: "50%",
            height: "300px"
        }
    });

    var courier = new Chronos.PostMessageCourier({
        target: frame,
        targetOrigin: protocol + hostname + port
    });
```

The other option is to let Courier create the iFrame and pass it back to you.
###Please note if you dont set any attributes the iFrame will be hidden from view.

```
     var courier = new Chronos.PostMessageCourier({
        target: {
            url: protocol + hostname + port + "/MYPATH/index.html",
            style: {
                width: "100px",
                height: "100px"
            },
            attributes :{
                name : "name"
            }
        }
     });
```

##Configuration for Courier

The configuration supports the following properties in the target attribute:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| url | String | The URL of your iFrame | None |
| bust | Boolean | If to use a cache bust parameter when adding the iFrame | true |
| container | DOM Element | The element you want the iFrame in | document.body |
| style | Object | The style attributes you'd like to set on the iFrame | ```{ width :"0px", height : "0px", position :"absolute", top : "-1000px",  left : "-1000px" }``` |
| attributes | Object | The attributes you'd like to set on the iFrame | ```{"id": name, "name" :name, "tabindex": "-1", "aria-hidden": "true", "title":  "","role": "presentation","allowTransparency":"true"}```|
| callback | Function | A function to be called after the iFrame has loaded | None|
| context | Object | The execution context for the callback | None |

Example:
```
{ target :{
    url: ...,
    style: { ... },
    attributes :{ ... }
    container: ...,
    callback: function() { ... },
    context : ...
  }
}
```

Other configuration options:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| onready | Object with callback and context | A function to be called when the handshake with the iFrame has been completed | None |
| serialize | Function | Function for serializing data into the iFrame | JSON.stringify |
| deserialize | deserialize | Function for deserializing data from the iFrame | JSON.parse |
| targetOrigin | String | the domain of the iFrame being added <b>*must be supplied in case of external iFrame</b> | None |
| handshakeInterval | milliseconds | Number of milliseconds before handshake retry | 5000 |
| handshakeAttempts | int | Maximum attempts at handshake | 3 |
| onmessage | Function | Handler for incoming messages <b>*optional</b>| None |

Example:
```
{
    target :{ ... }
    onready : {
      callback: function(){},
      context : ...
    },
    serialize : function() { ... },
    deserialize : function() { ... },
    targetOrigin: ...,
    handshakeInterval : ...,
    handshakeAttempts : ...,
    onmessage  : function() { ... },
}
```






