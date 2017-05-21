module.exports = function (grunt, options) {

    var testTasks = ['env', 'instrument', 'connect', 'mocha', 'makeReport'];
    var tasks = [].concat(['node_version', 'jshint'], testTasks, ['concat', 'concat_in_order', 'uglify']);
    return {
        'tasks': ['availabletasks'],
        'default': tasks,
        'test': testTasks
    };
};
