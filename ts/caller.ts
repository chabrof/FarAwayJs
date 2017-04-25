import { _console } from "./_debug"
import * as jsSHA from "jssha"

let _callables = {}
let _rCallIdx = 0
let _promiseOkCbksH = {}
let _wsServer = "ws://localhost:8080"
let _ws, _wsReadyPromise
let _declareWsReady :() => void
let _importedInstiables = {}

let _treat :any = {}
_treat.rError = function(errorObj) {
  _console.error("Error on simpleRpc", errorObj.error);
}

_treat.rCallReturn = function(callObj :any) {
  _console.log('treat_rCallReturn', callObj, _promiseOkCbksH)
  if (typeof callObj.rIdx !== "number") {
  throw {
      "message" : "rIdx is empty or invalid : " + callObj.rCallrIdx,
      "send" : false
    }
  }
  let ret = callObj.return
  _console.log('ici', typeof _promiseOkCbksH[callObj.rIdx]);
  _promiseOkCbksH[callObj.rIdx](ret) // complete the associated Promise
}

_treat.rInstantiateReturn = function(callObj) {
  _console.log('treat_rInstantiateReturn', callObj)
  if (typeof callObj.rIdx !== "number") {
    throw {
      "message" : "rIdx is empty or invalid : " + callObj.rCallrIdx,
      "send" : false
    }
  }
  let instanceRpc = new FarAwayCallerInstance(callObj.rIdx)
  _promiseOkCbksH[callObj.rIdx](instanceRpc) // complete the associated Promise
}

_treat.rImportReturn = function(callObj) {
  _console.log('treat.rImportReturn', callObj)
  if (typeof callObj.rIdx !== "number") {
    throw {
      "message" : "rIdx is empty or invalid : " + callObj.rCallrIdx,
      "send" : false
    }
  }
  let wrapObjects = _createWrappingObjects(callObj.objects)
  _promiseOkCbksH[callObj.rIdx].apply(this, wrapObjects) // complete the associated Promise
}

function _createWrappingObjects(objDescriptions :any[]) :any[] {
  let wrappingObjects = []

  objDescriptions.forEach(
    (objDescription) => {
      _wrappingObjFactory[objDescription.type](objDescription)
    } )
  return wrappingObjects
}

let _wrappingObjFactory = {}

_wrappingObjFactory['function'] = function(objDescription) {
  let func = function() {
    return farCall(objDescription.name)
  }
}

_wrappingObjFactory['instantiable'] = function(objDescription) {
  let factory = {}

  factory[objDescription] = {}
  /*
  for (let i in objDescription.structure) {
    if (i !== "__prototype__") {
      if (objDescription[i] === "function") {
        //factory[objDescription.name][i] = function
      }
    }
  }*/
  let remotePrototype = objDescription.structure.__prototype__
  for (let i in remotePrototype) {
    factory[i] =
      function(instanceIdx :number = undefined) {
        return farCall(objDescription.name + '.' + remotePrototype[i], [], instanceIdx)
      }
  }
}

class FarAwayCallerInstance {
  __farAwayInstIdx__ :number

  constructor(instanceIdx) {
    this.__farAwayInstIdx__ = instanceIdx
  }

  farCall(objectName :string, args :any[]) {
    return farCall(objectName, args, this.__farAwayInstIdx__)
  }
}

export function initWsListening(url :string = "localhost", port :string = "8080") {
  _console.assert(_ws === undefined, "You have already init the WebSocket listening")

  _ws = new WebSocket(_wsServer)
  _wsReadyPromise = new Promise(function(ok, ko) { _declareWsReady = ok; })
  _ws.addEventListener('open', function() { _declareWsReady() })

  _ws.addEventListener('message', function(message) {
    let messageObj
    try { messageObj = JSON.parse(message.data) }
    catch (e) {
      _console.log('Exception', e);
      _generateError(3, "Message is not in the good format")
    }

    try { _treat[messageObj.type](messageObj) }
    catch (e) {
      if (e.send) {
        _generateError(1, e.message)
      }
      else {
        console.error('Error : ', e.message)
      }
    }
  })
}

function _generateError (code :number, message :string) {
  console.error('Generate error :', message)
  _ws.send(JSON.stringify(
    {
      "type" :  "rError",
      "error" : {
        "code"     : code,
        "message"  : message
      }
    }  ))
}

function _getRCallIdx() {
  return _rCallIdx++
}

function _extractArgs(argsIn :any) {
  let argsOut = []
  for (let ct = 1; ct < argsIn.length; ct++) {
    argsOut.push(argsIn[ct]);
  }
  return argsOut;
}

export function farCall(objectName :string, args :any[] = [], instanceIdx :number = undefined) :Promise<any> {
  _console.log('farCall : ', objectName, args)
  _console.assert(_wsReadyPromise, 'Init seems not to be done yet, you must call initWsListening before such operation')

  if (typeof objectName !== "string" || ! objectName.length) {
    throw {
        "message" : "Method is empty or invalid : " + objectName,
        "send" : false
      }
  }
  let idx = _getRCallIdx()
  let promise = new Promise((ok, ko) => { _promiseOkCbksH[idx] = ok } )
  _wsReadyPromise.then(
    () => {
      _ws.send(JSON.stringify({
          "type"        : "rCall",
          "objectName"  : objectName,
          "args"        : args,
          "instanceIdx" : instanceIdx,
          "rIdx"        : idx
        }))
    })
  return promise
}

export function farImport(objNames :string[]) :any {
  _console.log('farImport : ', objNames)
  let idx = _getRCallIdx()
  let promise = new Promise(function(ok, ko) { _promiseOkCbksH[idx] = ok })
  _wsReadyPromise.then(
    function() {
      _ws.send(JSON.stringify({
          "type" : "rImport",
          "rIdx" : idx,
          "symbols" : objNames
      }))
    })
  return promise
}

export function farInstantiate (constructorName :string, args :any[] = []) :Promise<any> {
  _console.log('farInstantiate : ', constructorName)
  let idx = _getRCallIdx()
  let promise = new Promise(function(ok, ko) { _promiseOkCbksH[idx] = ok })
  _wsReadyPromise.then(
    function() {
      _ws.send(JSON.stringify({
          "type"             : "rInstantiate",
          "constructorName"  : constructorName,
          "rIdx"             : idx,
          "guid"             : _generateGuid(),
          "args"             : args
      }))
    })
  return promise
}


function _generateGuid() :string {
  let shaObj = new jsSHA("SHA-256", "TEXT");
  shaObj.update("This is a ");
  shaObj.update("test");
  return shaObj.getHash("HEX");
}
