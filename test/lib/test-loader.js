(function () {
    require(["conf"], function (conf) {

        require.config(conf.requireConfig);

        require([
            "chai",
            "sinon"
        ], function (chai, sinon) {
            window[conf.chaiLib] = chai[conf.chaiLib];
            window.sinon = sinon;

            mocha.setup(conf.mochaInterface);
            mocha.timeout(conf.mochaTimeout);

            require(conf.tests, function () {
                if (window.PHANTOMJS) {
                    after(function(done) {
                        var xhr = new XMLHttpRequest();
                        xhr.open('POST', '/', false);
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.send(JSON.stringify(window.__coverage__));
                        done();
                    });
                    mocha.run();
                }
                else {
                    mocha.run();
                }
            });
        });
    });

})();
