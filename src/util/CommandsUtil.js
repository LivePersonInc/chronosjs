;(function (root, factory) {
    "use strict";

    /* istanbul ignore if */
    //<amd>
    if ("function" === typeof define && define.amd) {
        // AMD. Register as an anonymous module.
        define("Chronos.CommandsUtil", ["Chronos.EventsUtil"], function (EventsUtil) {
            return factory(root, root, EventsUtil, true);

        });
        return;
    }
    //</amd>
    /* istanbul ignore next */
    if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("./EventsUtil").EventsUtil);
    }
    /* istanbul ignore next  */
    else {
        /**
         * @depend ./EventsUtil.js
         */
            // Browser globals
        root.Chronos = root.Chronos || {};
        factory(root, root.Chronos, root.Chronos.EventsUtil);
    }
}(typeof ChronosRoot === "undefined" ? this : ChronosRoot, function (root, exports, evUtil, hide) {
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
    var ret = {
        bind: bind,
        valid: valid
    };
    if (!hide) {
        exports.CommandsUtil = exports.CommandsUtil || ret;
    }
    return ret;
}));
