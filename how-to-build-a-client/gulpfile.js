var gulp          = require('gulp');

var $ = require('gulp-load-plugins')();

gulp.task('connect', function () {
    var connect = require('connect');
    var serveStatic = require('serve-static');
    var app = connect()
        .use(require('connect-livereload')({ port: 35729 }))
        .use(serveStatic('./'))

    require('http').createServer(app)
        .listen(7000)
        .on('listening', function () {
            console.log('Started connect web server on http://localhost:7000');
        });
});

gulp.task('serve', ['connect'], function () {
    require('opn')('http://localhost:7000');
});

gulp.task('watch', ['connect', 'serve'], function () {
    var server = $.livereload();

    // watch for changes

    gulp.watch([
        '*.html',
        '*.js',
        '*.css'
    ]).on('change', function (file) {
        server.changed(file.path);
    });
});