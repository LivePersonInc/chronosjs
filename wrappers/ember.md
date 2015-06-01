Include the lp-events js file in your main html.

```html
<script type="text/javascript" src="/node_modules/dist/lpPostMessageCourier.js"></script>
```

Add a controller to your module/app with the following code

### LPEventChannel
```javascript
var App = Ember.Application.create();
App.LPEventChannelController = Ember.Controller.extend(new window.LPEventChannel());
```

### LPPostMessageCourier
```javascript
var App = Ember.Application.create();
App.LPPostMessageCourierController = Ember.Controller.extend(
    new window.LPPostMessageCourier({
    //YOUR configuration here
    }
);
```

In your controller:

```javascript
App.MyController('lpEventChannel', 'lpPostMessageCourier', function (lpEventChannel, lpPostMessageCourier) {
    //Your controller
});
App.MyController = Ember.Controller.extend({
    needs: ['lPEventChannel', 'lPPostMessageCourier'],
    someFunc: function(src){
        this.get('controllers.lPEventChannel').bind({/*whatever*/})
    }
});
```
