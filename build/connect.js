var fs = require("fs");
var mkdirp = require('mkdirp');

module.exports = {
    "server": {
        "options": {
            "port": 8000,
            "base": ".",
            middleware: function(connect, options, middlewares) {
                // inject a custom middleware into the array of default middlewares
                middlewares.unshift(function(req, res, next) {
                    if (req && req.method === "POST") {
                        mkdirp.sync(__dirname.replace('build','test/coverage/reports/'));
                        fs.writeFile(__dirname.replace('build','test/coverage/reports/coverage.json'), JSON.stringify(req.body), function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('Code coverage information exported!');
                            }
                        });
                        res.write('{\'status\': \'success\'}');
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end();
                    } else {
                        return next();
                    }
                });

                middlewares.unshift(connect.json());

                return middlewares;
            }
        }
    }
};
