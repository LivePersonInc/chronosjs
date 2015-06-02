// Just a very dumb proxy wrapper to unify
// all events mechanisms inside a single
// channel proxy wrapper
;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        root.Chronos = root.Chronos || {};
        return root.Chronos;
    }

    var define  = window.define;

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("Chronos.Channels", ["exports", "Chronos.Events", "Chronos.Commands", "Chronos.Reqres"], function () {
            if (!namespace.Channels) {
                factory(root, namespace, namespace.Events, namespace.Commands, namespace.ReqRes);
            }

            return namespace.Channels;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.Channels) {
            factory(root, namespace, namespace.Events, namespace.Commands, namespace.ReqRes);
        }
        //</lptag>
    }
    else if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("./Events"), require("./Commands"), require("./Reqres"));
    }
    else {
        /**
         * @depend ./Events.js
         * @depend ./Commands.js
         * @depend ./Reqres.js
         */
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.Events, namespace.Commands, namespace.ReqRes);
    }
}(this, function (root, exports, Events, Commands, ReqRes) {
    function Channels(options) {

        options = options || {};

        var events = options.events || new Events();
        var commands = options.commands || new Commands();
        var reqres = options.reqres || new ReqRes();


        this.once = events.once;
        this.hasFiredEvents = events.hasFired;
        this.trigger = events.trigger;
        this.publish = events.publish;
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

    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.Channels = exports.Channels || Channels;
}));
