Include the chronosjs js file in your main html.

```html
<script type="text/javascript" src="/node_modules/dist/PostMessageCourier.js"></script>
```
Channels is already provided with the [ngChronos module](/wrappers/ngChronos.js), you can use it by adding:
```html
<script type="text/javascript" src="/node_modules/wrappers/ngChronos.js"></script>
```
And skip to adding Chronos dependency to your app

Create a module and add a factory to it with the following code:
```javascript
var module = angular.module('Chronos', []);
```

### Channels
```javascript
module.factory('Chronos.Channels', function ($window) {
    var channels = new $window.Chronos.Channels();

    return channels;
});
```

### PostMessageCourier
```javascript
module.factory('Chronos.PostMessageCourier', function ($window) {
    var postMessageCourier = new $window.Chronos.PostMessageCourier({
        //YOUR configuration here
    });

    return postMessageCourier;
});
```

In you app.js add the Chronos dependency:
```javascript
angular.module('myApp', [
    'Chronos',
])
```

In your controller:

```javascript
module.controller('Chronos.Channels', 'Chronos.PostMessageCourier', function (channels, postMessageCourier) {
    //Your controller
});
```
