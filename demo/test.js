console.log('starting');
var system = require('system');
var fs = require('fs');
var server = require('webserver').create();
var port, service;
port = 31234;
var tries = 100; 
var success = false;

while (tries --){
    try {
        service = server.listen(port, function (request, response) {
            response.statusCode = 200;
            response.headers = {
                'Cache': 'no-cache',
                'Content-Type': 'text/html'
            };
            var data = fs.read(request.url.substr(1).split('?')[0]);
            response.write(data);
            response.close();
        });
        success = true;
        break;
    } catch (e){}
}
if (service && success) {
    console.log('Web server running on port ' + port);
} else {
    console.log('Error: Could not create web server listening on port ' + port);
    phantom.exit(1);
}


/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
    console.trace()
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 30001, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 100);
};



var page = require('webpage').create();

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function(msg) {
    console.log(msg);
};

page.open('http://localhost:'+port+'/demo/test.html', function(status){
    if (status !== "success") {
        console.log("Unable to access network");
        phantom.exit(1);
    } else {
        console.log('Opened page');
        waitFor(
            function(){
                return page.evaluate(function(){
                    var el = document.getElementById('qunit-testresult');
                    if (el && el.innerText.match('completed')) {
                        return true;
                    }
                    return false;
                });
            }, 
            function(){
                console.log(page.evaluate(function(){return document.getElementById('qunit-testresult').innerText;}));
                var failedNum = page.evaluate(function(){
                    var el = document.getElementById('qunit-testresult');
                    try {
                        return el.getElementsByClassName('failed')[0].innerHTML;
                    } catch (e) { }
                    return 10000;
                });
                phantom.exit((parseInt(failedNum, 10) > 0) ? 1 : 0);
            }
        );
    }
});
