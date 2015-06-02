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
    var define  = window.define;

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpCommandUtil", ["exports", "lpEventsUtil"], function () {
            if (!namespace.lpCommandUtil) {
                factory(root, namespace, namespace.lpEventsUtil);
            }

            return namespace.lpCommandUtil;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.lpCommandUtil) {
            factory(root, namespace, namespace.lpEventsUtil);
        }
        //</lptag>
    }
    else if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("util/lpEventsUtil"));
    }
    else {
        /**
         * @depend ./lpEventsUtil.js
         */
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.lpEventsUtil);
    }
}(this, function (root, exports, evUtil) {
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
    exports.lpCommandUtil = exports.lpCommandUtil || {
        bind: bind,
        valid: valid
    };
}));
