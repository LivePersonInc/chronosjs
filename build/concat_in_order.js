module.exports = function (grunt, options) {
    var path = require('path');

    return {
        "release": {
            "options": {
                "extractRequired": function (filepath, filecontent) {
                    var workingdir = path.normalize(filepath).split(path.sep);
                    workingdir.pop();

                    var deps = this.getMatches(/\*\s*@depend\s(.*\.js)/g, filecontent);
                    deps.forEach(function (dep, i) {
                        var dependency = workingdir.concat([dep]);
                        deps[i] = path.join.apply(null, dependency);
                    });
                    return deps;
                },
                extractDeclared: function (filepath) {
                    return [filepath];
                },
                onlyConcatRequiredFiles: true
            },
            "files": {
                "dist/lpEvents.js": ["src/lpEvents.js"],
                "dist/lpCommands.js": ["src/lpCommands.js"],
                "dist/lpReqres.js": ["src/lpReqres.js"],
                "dist/lpEventChannel.js": ["src/lpEventChannel.js"],
                "dist/lpPostMessageCourier.js": ["src/courier/lpPostMessageCourier.js"]
            }
        }
    };
};

