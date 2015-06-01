Include the lp-events js file in your main html.

```html
<script type="text/javascript" src="/node_modules/dist/lpPostMessageCourier.js"></script>
```

Add a factory to your module/app with the following code

### LPEventChannel
```javascript
module.factory('lpEventChannel', function ($window) {
    var channels = new $window.LPEventChannel();

    return channels;
});
```

### LPPostMessageCourier
```javascript
module.factory('lpPostMessageCourier', function ($window) {
    var postMessageCourier = new $window.LPPostMessageCourier({
        //YOUR configuration here
    });

    return postMessageCourier;
});
```

In your controller:

```javascript
module.controller('lpEventChannel', 'lpPostMessageCourier', function (lpEventChannel, lpPostMessageCourier) {
    //Your controller
});
```
