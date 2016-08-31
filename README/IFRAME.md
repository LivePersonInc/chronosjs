#How to set up iFrames with Courier
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
After you have created your own iFrame you need to create:
1. A channels instance
2. A Courier instance - passing it channels and the iFrame

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

    var channel = new Chronos.Channels();
    var courier = new Chronos.PostMessageCourier({
        eventChannel: channel,
        target: frame,
        targetOrigin: protocol + hostname + port
    });
```

##Passing in a iFrame configuration to Courier
The other option is to let Courier create the iFrame and pass it back to you.
The iFrame configuration supports the following properties:

| Parameter | Type | Description |  Defaults |
| ---       | ---  | ---         | ---       |
| styles | Object | The style attributes you'd like to set on the Iframe | ```width :"0px",height : "0px",position :"absolute",top : "-1000px",left : "-1000px"}```|


 ```
     var courier = new Chronos.PostMessageCourier({
        target: {
            url: protocol + hostname + port + "/chronosjs/debug/courier.frame.html",
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




