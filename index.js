var fs = require('fs');
var join = require('path').join;

var eachAsync = require('each-async');
var glob = require('glob');

var SRC_DIR = __dirname + '/../../files';
var DEST_DIR = __dirname + '/../../../..';

function log() {
    console.log.apply(console, ['[package-dotfiles]'].concat([].slice.call(arguments)));
}

fs.realpath(__dirname, function (err, realpath) {

    if (err) throw err;

    var reversePath = realpath.split('/').reverse();

    if (reversePath[1] !== 'node_modules' || reversePath[1] !== 'node_modules' || reversePath[4] === 'lib') return;

    glob('**/*', { cwd: SRC_DIR, dot: true, mark: true }, function (err, paths) {

        if (err) throw err;

        var files = [];

        paths.filter(function (path) {
            if (!/\/$/.test(path)) {
                files.push({
                    name: path.replace('gitignore', '.gitignore'),
                    src: join(SRC_DIR, path),
                    dest: join(DEST_DIR, path.replace('gitignore', '.gitignore'))
                });
            }
        })

        files.sort(function compare(a, b) {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });

        if (files.length === 0) {
            return;
        } else {
            log(files.length + ' files to copy: ' + files.map(function (file) { return file.name; }).join(', '));
        }

        eachAsync(files, function (file, index, done) {
            var readStream = fs.createReadStream(file.src),
                writeStream = fs.createWriteStream(file.dest);

            readStream.on('error', done);
            writeStream.on('error', done);

            writeStream.on('finish', function () {
                fs.lstat(file.src, function (err, stat) {
                    if (err) return done(err);

                    fs.chmod(file.dest, stat.mode, function (err) {
                        return done(err || null);
                    });
                })
            })

            readStream.pipe(writeStream);

        }, function (err) {
            if (err) throw err;

            log('Files copied');
        });

    });

});
