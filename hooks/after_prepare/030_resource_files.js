#!/usr/bin/env node
var filestocopy = [
    {"resources/android/reply/drawable-mdpi/reply.png":"platforms/android/res/drawable/reply.png"},
    {"resources/android/chat/drawable-mdpi/chat.png":"platforms/android/res/drawable/chat.png"}
];
var fs = require('fs');
var path = require('path');
// no need to configure below
var rootdir = process.argv[2];
 
filestocopy.forEach(function(obj) {
    Object.keys(obj).forEach(function(key) {
        var val = obj[key];
        var srcfile = path.join(rootdir, key);
        var destfile = path.join(rootdir, val);
        //console.log("copying "+srcfile+" to "+destfile);
        var destdir = path.dirname(destfile);
        if (fs.existsSync(srcfile) && fs.existsSync(destdir)) {
            fs.createReadStream(srcfile).pipe(
               fs.createWriteStream(destfile));
        }
    });
});