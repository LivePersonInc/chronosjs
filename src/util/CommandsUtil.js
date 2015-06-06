;(function (root, factory) {
    "use strict";

    /* istanbul ignore if */
    //<amd>
    if ("function" === typeof define && define.amd) {
        // Browser globals
        root.Chronos = root.Chronos || {};

        // AMD. Register as an anonymous module.
        define("Chronos.CommandsUtil", ["exports", "Chronos.EventsUtil"], function () {
            if (!root.Chronos.CommandsUtil) {
                factory(root, root.Chronos, root.Chronos.EventsUtil);
            }

            return root.Chronos.CommandsUtil;
        });
        return;
    }
    //</amd>
    /* istanbul ignore else */
    if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("util/EventsUtil"));
    }
    else {
        /**
         * @depend ./EventsUtil.js
         */
            // Browser globals
        root.Chronos = root.Chronos || {};
        factory(root, root.Chronos, root.Chronos.EventsUtil);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, evUtil) {
    "use strict";

    /**
     * var cmdObj = {
     *   cmd: cmd,
     *   attrName: "cmdName",
     *   loggerName: "Commands",
     *   prefix: "_somePrefix",
     *   id: commandId,
     *   lstnrs: {}
     * };
     */
    function bind(cmdObj) {
        var cmdName = cmdObj.cmd[cmdObj.attrName];

        if (!cmdName || !cmdObj.cmd.func || "function" !== typeof cmdObj.cmd.func || !valid(cmdObj.cmd, cmdName)) {
            evUtil.log("comply: has invalid params: command=[" + cmdName + "]", "ERROR", cmdObj.loggerName);
            return null;
        }
        if (cmdObj.lstnrs[cmdName] && cmdObj.lstnrs[cmdName].length) {
            evUtil.log("comply: cannot comply because command already exist command=" + cmdName, "ERROR", cmdObj.loggerName);
            return null;
        }
        var cmdId = cmdObj.prefix + (cmdObj.id++);
        var newObj = {
            id: cmdId,
            func: cmdObj.cmd.func,
            context: cmdObj.cmd.context || null,
            appName: cmdObj.cmd.appName
        };

        cmdObj.lstnrs[cmdName] = cmdObj.lstnrs[cmdName] || [];
        cmdObj.lstnrs[cmdName].push(newObj);
        evUtil.log("Cmd comply: evName=[" + cmdName + "] appName=" + newObj.appName, "DEBUG", cmdObj.loggerName);
        return cmdId;
    }

    function valid(cmd, name) {
        return !((name && name === "*") || (cmd.appName && cmd.appName === "*"));
    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.CommandsUtil = exports.CommandsUtil || {
            bind: bind,
            valid: valid
        };
}));
