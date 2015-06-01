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
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpEventChannel", ["exports", "lpEvents", "lpCommands", "lpReqres"], function (exports, LPEvents, LPCommands, LPReqRes) {
            if (!namespace.LPEventChannel) {
                factory(root, namespace, namespace.LPEvents, namespace.LPCommands, namespace.LPReqRes);
            }

            return namespace.LPEventChannel;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPEventChannel) {
            factory(root, namespace, namespace.LPEvents, namespace.LPCommands, namespace.LPReqRes);
        }
        //</lptag>
    }
    else if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("./lpEvents"), require("./lpCommands"), require("./lpReqres"));
    }
    else {
        /**
         * @depend ./lpEvents.js
         * @depend ./lpCommands.js
         * @depend ./lpReqres.js
         */
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.LPEvents, namespace.LPCommands, namespace.LPReqRes);
    }
}(this, function (root, exports, LPEvents, LPCommands, LPReqRes) {
    function LPEventChannel(options) {

        options = options || {};

        var events = options.events || new LPEvents();
        var commands = options.commands || new LPCommands();
        var reqres = options.reqres || new LPReqRes();


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
    exports.LPEventChannel = exports.LPEventChannel || LPEventChannel;
}));
