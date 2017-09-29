var { callee, CalleeWS, CalleeSimpleStream } = require("../dist/FAJ_node.js");

console.log("Beginning");
//
// Init FarAwayJs (and activate console logs)
//
callee.debugOn();
console.log('Debug is now on');
var wsCommunication = new CalleeWS('localhost', '8080');
callee.setCommunication(wsCommunication);

//
// We define a very simple function
//
function test(arg1, arg2) {
  return 'Success (args : ' + arg1 + ',' + arg2;
}
// Register it !
callee.register(test, "test");
console.log('Function test is now registered for remote calls');

//
// Here we define an instantiable object
//
function MyClass(arg1, arg2) {
    this._prop1 = arg1;
    this._prop2 = arg2;
}
// One method with arguments
MyClass.prototype.foo = function (arg1, arg2) {
    return 'The method foo is called on an instance of MyClass. Stored props: ' + this._prop1 + this._prop2 + '. Arguments passed :' + arg1 + ',' + arg2;
};
// Another method, but we do not want it to be called remotely
MyClass.prototype.bar = function () {
    return 'The method bar can be called ... but not remotely';
};
// Create of a simpleStreamer, and send data every 2 sec period
var streamer = new CalleeSimpleStream();
streamer.setCommunication(wsCommunication); // the communication instance can be used and shared with the FarAway instance
setInterval(function() { streamer.sendData({ Test: "test" }); }, 2000);
var streamer2 = new CalleeSimpleStream();
streamer2.setCommunication(wsCommunication); // the communication instance can be used and shared with the FarAway instance
setInterval(function() { streamer2.sendData({ Test2: "test2" }); }, 2000);
// Another method which returns a stream which can be listen by the callers
MyClass.prototype.getAPreciousStream = function () {
    return streamer;
};
// Another method which returns a stream which can be listen by the callers
MyClass.prototype.getAnotherPreciousStream = function () {
    return streamer2;
};
// Register the MyClass object !
callee.register(MyClass, "MyClass", ["bar"]); // ["bar"] is there to exclude the method bar from remote calls
console.log('MyClass object is now registered for remote calls');
