define("conf", function() {
    return {
        "blanket": true,
        "blanketCoverOnly": "['../../src/','../../src/courier/']",
        "blanketCoverNever": "['../lib/','../../src/../node_modules/','//^\w+test\.js$/gi']",
        "requireConfig": {
            //By default load any module IDs from src directory
            baseUrl: "../coverage/instrument/src",
            paths: {
                chai: "../../../../node_modules/chai/chai",
                sinon: "../../../../node_modules/sinon/pkg/sinon",
                cacher: "../../../../node_modules/cacherjs/src/cacher",
                lpEvents: "lpEvents",
                lpEventsUtil: "util/lpEventsUtil",
                lpCommands: "lpCommands",
                lpCommandUtil: "util/lpCommandUtil",
                lpReqres: "lpReqres",
                lpEventChannel: "lpEventChannel",
                lpPostMessageCourier: "courier/lpPostMessageCourier",
                lpPostMessageUtilities: "courier/lpPostMessageUtilities",
                lpPostMessagePromise: "courier/lpPostMessagePromise",
                lpPostMessageMapper: "courier/lpPostMessageMapper",
                lpCircuitBreaker: "courier/lpCircuitBreaker",
                lpPostMessageChannel: "courier/lpPostMessageChannel",
                lpPostMessageChannelPolyfill: "courier/lpPostMessageChannelPolyfill"
            }
        },
        "chaiLib": "expect",
        "mochaInterface": "bdd",
        "mochaTimeout": 60000,
        "tests": [
            "../js/events_sanity_test.js",
            "../js/commands_sanity_test.js",
            "../js/reqres_sanity_test.js",
            "../js/courier_sanity_test.js",
            "../js/courier_sanity_no_iframe_test.js"
        ]
    };
});
