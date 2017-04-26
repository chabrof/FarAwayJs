import { _console } from "./_debug"
import { FACommunication } from "./interfaces"
import { generateError } from "./error"
import * as Chance from "chance"

let _callables = {}
let _rCallIdx = 0
let _promiseOkCbksH = {}

let _com :FACommunication, _comReadyPromise :Promise<void>
let _importedInstiables = {}

export let setCommunication = function(communication :FACommunication) :Promise<any> {
  _com = communication
  _com.onMessage(_messageCbk)
  _comReadyPromise = _com.initListening()
  return _comReadyPromise
}

let _messageCbk = function(event) {
  let messageObj
  try {
    messageObj = JSON.parse(event.data)
  }
  catch (e) {
    _console.log('Exception', e);
    generateError(_com, 3, "Message is not in the good format")
  }

  try {
    _treat[messageObj.type](messageObj)
  }
  catch (e) {
    if (e.send) {
      generateError(_com, 1, e.message)
    }
    else {
      console.error('Error : ', e.message, e.stack)
    }
  }
}

let _treat :any = {}
_treat.farError = function(errorObj) {
  _console.error("Error on simpleRpc", errorObj.error);
}

_treat.farCallReturn = function(callObj :any) {
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

_treat.farInstantiateReturn = function(callObj) {
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

_treat.farImportReturn = function(callObj) {
  _console.log('treat.rImportReturn', callObj)
  if (typeof callObj.rIdx !== "number") {
    throw {
      "message" : "rIdx is empty or invalid : " + callObj.rCallrIdx,
      "send" : false
    }
  }
  _secureHash = callObj.secureHash
  if (! _secureHash) {
    throw {
      "message" : "_secureHash is empty or invalid in response",
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
  _console.assert(_comReadyPromise, 'Init seems not to be done yet, you must call initWsListening before such operation')
  _console.assert(_secureHash, 'secureHash is not defined, you must call farImport and wait for its response (promise) before calling this method')

  if (typeof objectName !== "string" || ! objectName.length) {
    throw {
        "message" : "Method is empty or invalid : " + objectName,
        "send" : false
      }
  }
  let idx = _getRCallIdx()
  let promise = new Promise((ok, ko) => { _promiseOkCbksH[idx] = ok })
  _comReadyPromise.then(
    () => {
      _com.send(JSON.stringify({
          "type"        : "farCall",
          "objectName"  : objectName,
          "args"        : args,
          "instanceIdx" : instanceIdx,
          "rIdx"        : idx,
          "secureHash"  : _secureHash
        }))
    })
  return promise
}

// unique guid for caller instance
let _guid :string
let _secureHash :string

export function farImport(objNames :string[]) :any {
  _console.log('farImport : ', objNames)

  let idx = _getRCallIdx()
  let promise = new Promise(function(ok, ko) { _promiseOkCbksH[idx] = ok })
  let chance = new Chance()
  _guid = chance.guid()
  _comReadyPromise.then(
    function() {
      _com.send(JSON.stringify({
          "type" : "farImport",
          "rIdx" : idx,
          "guid" : _guid,
          "symbols" : objNames
      }))
    })
  return promise
}

export function farInstantiate (constructorName :string, args :any[] = []) :Promise<any> {
  _console.log('farInstantiate : ', constructorName)
  _console.assert(_secureHash, 'secureHash is not defined, you must call farImport and wait for its response (promise) before calling this method')

  let idx = _getRCallIdx()
  let promise = new Promise(function(ok, ko) { _promiseOkCbksH[idx] = ok })
  _comReadyPromise.then(
    function() {
      _com.send(JSON.stringify({
          "type"             : "farInstantiate",
          "constructorName"  : constructorName,
          "rIdx"             : idx,
          "GUID"             : _guid,
          "args"             : args,
          "secureHash"       : _secureHash
      }))
    })
  return promise
}
