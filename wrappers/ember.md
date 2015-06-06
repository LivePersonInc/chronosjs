Include the lp-events js file in your main html.

```html
<script type="text/javascript" src="/node_modules/dist/PostMessageCourier.js"></script>
```

Add a controller to your module/app with the following code

### Channels
```javascript
var App = Ember.Application.create();
App.ChronosChannelsController = Ember.Controller.extend(new window.Chronos.Channels());
```

### PostMessageCourier
```javascript
var App = Ember.Application.create();
App.ChronosPostMessageCourierController = Ember.Controller.extend(
    new window.Chronos.PostMessageCourier({
    //YOUR configuration here
    }
);
```

In your controller:

```javascript
App.MyController('ChronosChannelsController', 'ChronosPostMessageCourierController', function (channels, postMessageCourier) {
    //Your controller
});
App.MyController = Ember.Controller.extend({
    needs: ['ChronosChannelsController', 'ChronosPostMessageCourierController'],
    someFunc: function(src){
        this.get('controllers.ChronosChannelsController').bind({/*whatever*/})
    }
});
```
