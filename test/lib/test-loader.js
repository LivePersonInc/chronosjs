(function () {
    require(["conf"], function (conf) {

        window.lpTag = window.lpTag || {};

        require.config(conf.requireConfig);

        if ("undefined" !== typeof blanket) {
            /* global blanket */
            blanket.options("filter", conf.blanketCoverOnly);
            blanket.options("antifilter", conf.blanketCoverNever);

            if (window.PHANTOMJS) {
                blanket.options("reporter", conf.gruntReporterLocation);
            }
        }

        require([
            "chai",
            "sinon",
        ], function (chai, sinon) {
            window[conf.chaiLib] = chai[conf.chaiLib];
            window.sinon = sinon;

            mocha.setup(conf.mochaInterface);
            mocha.timeout(conf.mochaTimeout);

            require(conf.tests, function () {
                if (window.mochaPhantomJS) {
                    mochaPhantomJS.run();
                }
                else {
                    mocha.run();
                }
            });
        });
    });

})();
