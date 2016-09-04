// Just a very dumb proxy wrapper to unify
// all events mechanisms inside a single
// channel proxy wrapper
;(function (root, factory) {
    "use strict";
    /* istanbul ignore if  */
    //<amd>
    if ("function" === typeof define && define.amd) {
        // AMD. Register as an anonymous module.
        define("Chronos.Channels", ["Chronos.Events", "Chronos.Commands", "Chronos.Reqres"], function (Events, Commands, Reqres) {
            return factory(root, root, Events, Commands, Reqres, true);
        });
        return;
    }
    //</amd>
    /* istanbul ignore next  */
    if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("./Events").Events, require("./Commands").Commands, require("./Reqres").ReqRes);
    }
    /* istanbul ignore next  */
    else {
        /**
         * @depend ./Events.js
         * @depend ./Commands.js
         * @depend ./Reqres.js
         */
        // Browser globals
        root.Chronos = root.Chronos || {};
        factory(root, root.Chronos, root.Chronos.Events, root.Chronos.Commands, root.Chronos.ReqRes);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, Events, Commands, ReqRes, hide) {
    function Channels(options) {

        options = options || {};
        var externalAPIS = [];

        var events = options.events || new Events(options.config && options.config.events);
        var commands = options.commands || new Commands(options.config && options.config.commands);
        var reqres = options.reqres || new ReqRes(options.config && options.config.reqres);


        this.once = events.once;
        this.hasFiredEvents = events.hasFired;
        this.trigger = _wrapCalls({
            func: events.trigger,
            context: events,
            triggerType: "trigger"
        });
        this.publish = this.trigger;
        this.bind = events.bind;
        this.register = events.register;
        this.unbind = events.unbind;
        this.unregister = events.unregister;
        this.hasFiredCommands = commands.hasFired;
        this.comply = commands.comply;
        this.stopComplying = commands.stopComplying;
        this.command = commands.command;
        this.hasFiredReqres = reqres.hasFired;
        this.request = reqres.request;
        this.reply = reqres.reply;
        this.stopReplying = reqres.stopReplying;
        if (options.externalProxy === true) {
            this.registerProxy = registerProxy;
         }

        /**
         * Wraps API calls to trigger other registered functions
         * @param options
         * @returns {Function}
         * @private
         */
        function _wrapCalls(options){
            return function(){
                var api;

                options.func.apply(options.context, Array.prototype.slice.call(arguments, 0));

                for(var i = 0; i < externalAPIS.length; i++){
                    api = externalAPIS[i];
                    if(api[options.triggerType]){
                        try{
                            api[options.triggerType].apply(api.context,Array.prototype.slice.call(arguments, 0));
                        }catch (exc){}
                    }
                }
            };
        }

        /**
         * Registers external proxy for trigger of events
         * @param external
         */
        function registerProxy(external){
            if(typeof external === 'object' && external.trigger){
                externalAPIS.push(external);
            }
        }
    }

    // attach properties to the exports object to define
    // the exported module properties.
    if (!hide) {
        exports.Channels = exports.Channels || Channels;
    }
    return Channels;
}));
