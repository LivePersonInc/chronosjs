'use strict';

const path = require('path');
const assert = require('assert');

describe('chronosjs', function () {

    describe('module', function () {

        const MODULE_ERROR_PATTERN = /Cannot find module/;

        let moduleLoader = (modulePath) => {
            return () => {
                require(modulePath);
            };
        };

        let errorAssertionHandler = (errorPattern) => {
            return (err) => {
                if ((err instanceof Error) && errorPattern.test(err)) {
                    return err;
                }
            };
        };

        let moduleLoadingTest = (modulePath) => {
            let moduleName = path.basename(modulePath);
            it(`'${moduleName}' should be consumable in a commonjs environment`, () => {
                assert.doesNotThrow(moduleLoader(modulePath), errorAssertionHandler(MODULE_ERROR_PATTERN));
            });
        };

        moduleLoadingTest('../src/Channels');
        moduleLoadingTest('../src/Commands');
        moduleLoadingTest('../src/Events');
        moduleLoadingTest('../src/Reqres');

        moduleLoadingTest('../src/util/CommandsUtil');
        moduleLoadingTest('../src/util/EventsUtil');

        moduleLoadingTest('../src/courier/PostMessageChannel');
        moduleLoadingTest('../src/courier/PostMessageChannelPolyfill');
        moduleLoadingTest('../src/courier/PostMessageCourier');
        moduleLoadingTest('../src/courier/PostMessageMapper');
        moduleLoadingTest('../src/courier/PostMessagePromise');
        moduleLoadingTest('../src/courier/PostMessageUtilities');

    });
});
