var webpage = require('webpage');
var fs = require('fs');

var pageToOpen = 'YOUR_PAGE_HERE';
// This is the selector for our captcha image element
var selector = 'form[name=form1] img';

var fileName = 'captcha';
var fileExt = '.bmp';
var fileNameExt = fileName + fileExt;
var dirName = 'captchas';

// We want the script to end by itself after so many tries
var numberOfTries = 1000;
var minimalWaitTime = 1000;
var windowWaitTime = 1000;

var page = webpage.create();

getNewImage(numberOfTries);

function getNewImage(nbOfCallbacks) {
    // Set a timeout as to not overload the victim server with too many requests
    setTimeout(function() {
        page.open(pageToOpen, function (status) {
            if (status === 'success') {
                console.log('Webpage opened');
                page.viewportSize = {width: 1440, height: 900};

                var clipRect = page.evaluate(function (selector) {
                    return document.querySelector(selector).getBoundingClientRect();
                }, selector);
                page.clipRect = {
                    top: clipRect.top,
                    left: clipRect.left,
                    width: clipRect.width,
                    height: clipRect.height
                };

                page.render(fileNameExt);
                isNewImage();
            } else {
                console.log('Webpage not accessible');
            }

            console.log(nbOfCallbacks);
            --nbOfCallbacks;

            if (nbOfCallbacks > 0) {
                getNewImage(nbOfCallbacks);
            }
            else {
                phantom.exit();
            }
        });
    }, Math.random() * windowWaitTime + minimalWaitTime);
}

function isNewImage() {
    var newImageData = fs.read(fileNameExt, 'b');

    var isUnique = true;
    var numberOfFiles = 0;

    fs.list(dirName).forEach(function(file) {
        if (file === '.' || file === '..') {
            return;
        }
        numberOfFiles++;

        var oldData = fs.read(dirName + '/' + file, 'b');
        if (oldData === newImageData) {
            isUnique = false;
            console.log('Duplicate image found');
        }
    });

    if (isUnique) {
        fs.copy(fileNameExt, dirName + '/' + fileName + (numberOfFiles + 1) + fileExt);
        console.log('Unique image found');
    }
    fs.remove(fileNameExt);
}