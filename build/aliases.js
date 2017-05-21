module.exports = function (grunt, options) {

    var validate = ['node_version', 'jshint'];
    var test = ['env', 'instrument', 'connect', 'mocha:test', 'makeReport'];
    var unitTest = ['simplemocha:unittest'];
    var pack = ['concat', 'concat_in_order', 'uglify'];
    var tasks = [].concat(validate, unitTest, test, pack);
    return {
        'tasks': ['availabletasks'],
        'default': tasks,
        'test': test,
        'unittest': unitTest
    };
};
