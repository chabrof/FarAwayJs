import {  _console }              from "./_debug"
import {  debugOn }               from "./_debug"
import {  generateError }         from "./error"
import {  CallableObject }        from "./callee"
import * as Chance                from "chance"
import {  FACallerCommunication,
          CallerBackCreate,
          CallerBCInitData }      from "./interfaces"

let _callables = {}
let _rCallIdx = 0
let _promiseOkCbksH = {}

let _com :FACallerCommunication, _comReadyPromise :Promise<void>
let _importedInstiables = {}

// unique guid for caller instance
let _myCallerGUID :string
let _myCallerSecureHash :string
let _backCreates :{[name :string]: CallerBackCreate} = {}
let _instancesTemp :{[name :string]: any} = {}

function setCommunication(communication :FACallerCommunication) :Promise<any> {
  _com = communication
  _com.onMessage(_messageCbk)
  _comReadyPromise = _com.initListening()
  return _comReadyPromise
}

function regBackCreateObject(name :string, backCreateObject :CallerBackCreate) {
  _console.assert(name, name.length, "name of BackCreateObject must be a not null string")
  _backCreates[name] = backCreateObject
}

let _messageCbk = function(data) {
  let messageObj
  try {
    messageObj = JSON.parse(data.message)
  }
  catch (e) {
    _console.error(`JSON.parse error: ${data.message}`, e);
    generateError(_myCallerSecureHash, _com, 3, "Message is not in the good format")
  }

  try {
    _treat[messageObj.type](messageObj)
  }
  catch (e) {
    if (e.send) {
      generateError(_myCallerSecureHash, _com, 1, e.message)
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
  _console.log('treat.farCallReturn', callObj, _promiseOkCbksH)
  if (typeof callObj.rIdx !== "number") {
    throw {
      "message" : "rIdx is empty or invalid : " + callObj.rCallrIdx,
      "send"    : false
    }
  }
  let ret = callObj.return
  _console.log('ici', typeof _promiseOkCbksH[callObj.rIdx])
  _promiseOkCbksH[callObj.rIdx](ret) // complete the associated Promise
}

_treat.farBackCreateReturn = function(callObj :any) {
  _console.log('treat.farBackCreateReturn', callObj)
  if (typeof callObj.rIdx !== "number") {
    throw {
      "message" : "rIdx is empty or invalid : " + callObj.rCallrIdx,
      "send"    : false
    }
  }
  let ret :CallerBCInitData = callObj.return as CallerBCInitData
  // Instantiate the "BackCreate" object
  if (! _backCreates[ret.constructorName]) {
    let availableBCObjectsStr = ""
    let zeroIdxFlag = true
    for (let i in _backCreates) {
      availableBCObjectsStr += ((!zeroIdxFlag ? ', ' : '') + i)
      zeroIdxFlag = false
    }
    throw {
      "message" : `backCreateConstructor (${ret.constructorName}) is not registered by the caller (${_myCallerGUID}). Avalaible objects : ${availableBCObjectsStr}.`,
      "send"    : true
    }
  }
  ret.constructorArgs.unshift(null)
  console.log('---> back create', ret.constructorName, _backCreates, ret.constructorArgs)
  let backCreateInst = new (Function.prototype.bind.apply(_backCreates[ret.constructorName], ret.constructorArgs))
  _console.assert(backCreateInst.init, "BackCreate object must have an 'init' method wich must return a promise")
  backCreateInst.init.apply(backCreateInst, ret.initArgs)
    .then(() => {
        _promiseOkCbksH[callObj.rIdx](backCreateInst)
      })
}

_treat.farInstantiateReturn = function(callObj) {
  _console.log('treat.farInstantiateReturn', callObj)
  if (typeof callObj.rIdx !== "number") {
    throw {
      "message" : "rIdx is empty or invalid : " + callObj.rCallrIdx,
      "send"    : false
    }
  }

  let instanceRpc = _instancesTemp[callObj.rIdx]
  console.log(' instance', instanceRpc)
  _instancesTemp[callObj.rIdx] = undefined
  instanceRpc.__farAwayInstIdx__ = callObj.instanceIdx
  instanceRpc.__farInstDoneConfirm__() // confirm that instantiation has been remotely done
  _promiseOkCbksH[callObj.rIdx](instanceRpc) // complete the associated Promise
}

_treat.farImportReturn = function(callObj) {
  _console.log('treat.farImportReturn', callObj)
  if (typeof callObj.rIdx !== "number") {
    throw {
      "message" : "rIdx is empty or invalid : " + callObj.rIdx,
      "send"    : false
    }
  }
  _myCallerSecureHash = callObj.callerSecureHash
  if (! _myCallerSecureHash) {
    throw {
      "message" : "_myCallerSecureHash is empty or invalid in response",
      "send"    : false
    }
  }
  let wrapObjects = _createWrappingObjects(callObj.objects)
  _console.log(`--> Result of farImportReturn`, wrapObjects)
  _promiseOkCbksH[callObj.rIdx](wrapObjects) // complete the associated Promise
}

function _createWrappingObjects(objDescriptions :any[]) :any {
  let wrappingObjects = {}

  objDescriptions.forEach(
    (objDescription) => {
      wrappingObjects[objDescription.name] = _wrappingObjFactory[objDescription.type](objDescription)
    } )
  return wrappingObjects
}

let _wrappingObjFactory = {}

_wrappingObjFactory['function'] = function(objDescription) {
  let func = function() {
    let args :any[] = Array.prototype.slice.call(arguments)
    return farCall(objDescription.name, args)
  }
  return func
}

_wrappingObjFactory['instantiable'] = function(objDescription) {
  let factory = {}

  let result = {}
  /*
  for (let i in objDescription.structure) {
    if (i !== "__prototype__") {
      if (objDescription[i] === "function") {
        //factory[objDescription.name][i] = function
      }
    }
  }*/


  let func = function() {
    let args :any[] = Array.prototype.slice.call(arguments)
    if ( this === (function () { return this; })() ) {
      // Called as a function
      return farCall(objDescription.name, args)
    }
    else {
      // Called as a constructor
      this.__farInstPromise__ = new Promise((ok, ko) => { this.__farInstDoneConfirm__ = ok })
      farInstantiate(objDescription.name, this, args)
      return null
    }
  }

  ; (func as any).__farAwayInstIdx__ = undefined

  let remotePrototype = objDescription.structure.__prototype__
  for (let i in remotePrototype) {
    func.prototype[i] =
      function() {
        let args :any[] = Array.prototype.slice.call(arguments)
        return this.__farInstPromise__.then(() => farCall(objDescription.name + '.' + i, args, this.__farAwayInstIdx__))
      }
  }
  _importedInstiables[objDescription.name] = func
  return func
}
/*
class FarAwayCallerInstance {
  __farAwayInstIdx__ :number

  constructor(instanceIdx) {
    this.__farAwayInstIdx__ = instanceIdx
  }

  farCall(name :string, args :any[]) {
    return farCall(name, args, this.__farAwayInstIdx__)
  }
}
*/
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

function farCall(name :string, args :any[] = [], instanceIdx :number = undefined) :Promise<any> {
  _console.log('farCall : ', name, args)
  _console.assert(_comReadyPromise, 'Init seems not to be done yet, you must call initWsListening before such operation')
  _console.assert(_myCallerSecureHash, '_myCallerSecureHash is not defined, you must call farImport and wait for its response (promise) before calling this method')

  if (typeof name !== "string" || ! name.length) {
    throw {
        "message" : "Method is empty or invalid : " + name,
        "send" : false
      }
  }
  let idx = _getRCallIdx()
  let promise = new Promise((ok, ko) => { _promiseOkCbksH[idx] = ok })
  _comReadyPromise.then(() => {
      _com.send(null,
                _myCallerSecureHash,
                JSON.stringify({
                    "type"              : "farCall",
                    "name"              : name,
                    "args"              : args,
                    "instanceIdx"       : instanceIdx,
                    "rIdx"              : idx,
                    "callerSecureHash"  : _myCallerSecureHash
                  }))
    })
  return promise
}

function farImport(objNames :string[]) :any {
  _console.log('farImport : ', objNames)

  let rIdx = _getRCallIdx()
  let promise = new Promise(function(ok, ko) { _promiseOkCbksH[rIdx] = ok })
  let chance = new (Chance.Chance as any)()
  _myCallerGUID = chance.guid()
  _comReadyPromise.then(
    function() {
        _com.send(null,
                  _myCallerGUID,
                  JSON.stringify({
                      "type"        : "farImport",
                      "rIdx"        : rIdx,
                      "callerGUID"  : _myCallerGUID,
                      "symbols"     : objNames
                    }))
    })
  return promise
}

function farInstantiate (name :string, instance, args :any[] = []) :Promise<any> {
  _console.log('farInstantiate : ', name)
  _console.assert(_myCallerSecureHash, '_myCallerSecureHash is not defined, you must call farImport and wait for its response (promise) before calling this method')

  let rIdx = _getRCallIdx()
  _instancesTemp[rIdx] = instance
  let promise = new Promise(function(ok, ko) { _promiseOkCbksH[rIdx] = ok })
  _comReadyPromise.then(
    function() {
      _com.send(null,
                _myCallerSecureHash,
                JSON.stringify({
                    "type"              : "farInstantiate",
                    "name"              : name,
                    "rIdx"              : rIdx,
                    "args"              : args,
                    "callerSecureHash"  : _myCallerSecureHash
                  }))
    })
  return promise
}

export let farAwayCaller = {
  debugOn             : debugOn,
  setCommunication    : setCommunication,
  farCall             : farCall,
  farInstantiate      : farInstantiate,
  farImport           : farImport,
  regBackCreateObject : regBackCreateObject
}
