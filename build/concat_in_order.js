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
                "dist/Events.js": ["src/Events.js"],
                "dist/Commands.js": ["src/Commands.js"],
                "dist/Reqres.js": ["src/Reqres.js"],
                "dist/Channels.js": ["src/Channels.js"],
                "dist/PostMessageCourier.js": ["src/courier/PostMessageCourier.js"]
            }
        }
    };
};

