import { _console } from "./_debug"
import { FACommunication, TupleInstanceSecureHash } from "./interfaces"
import { generateError } from "./error"
import * as jsSHA from "jssha"
import * as Chance from "chance"

let _callables = {}
let _rCallIdx = 0
let _com :FACommunication, _comReadyPromise :Promise<void>
let _instancesH = {}
let _magicToken = new Chance().guid()
let _secureHashes = {}

export let setCommunication = function(communication :FACommunication) :Promise<any> {
  _com = communication
  _com.onMessage(_messageCbk)
  _comReadyPromise = _com.initListening()
  return _comReadyPromise
}

let _messageCbk = function(event) {
  let messageObj :any
  try {
    messageObj = JSON.parse(event.data)
  }
  catch (e) {
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
      _console.error('Error : ', e.message, e.stack)
    }
  }
}

function _generateSecureHash(clientGUID :string) :string {
  let shaObj = new jsSHA("SHA-256", "TEXT")
  shaObj.update(_magicToken + clientGUID)
  let secureHash = shaObj.getHash("HEX")
  _secureHashes[secureHash] = true
  return secureHash
}

export function regInstantiable(object :any, excludeCalls :string[], objectName :string = undefined) {
  _console.assert(typeof object === 'function' && object, 'Entity must be a not null function (' + object + ' given)')

  _callables[objectName ? objectName : object.name] = new CallableObject(object, "instantiable", excludeCalls)
}

class CallableObject {

  public structure :any = {}
  public object   :any
  public type     :string
  private _excludeCalls :string[]

  constructor(object :any, type :string, excludeCalls :string[] = []) {
    this.type = type
    this.object = object
    this._excludeCalls = excludeCalls
    this.structure = this._exploreObject(this.object)
  }

  _exploreObject(object :any) {
    if (this.type === "function") return null // --> return
    let objectStruct = { __prototype__ : {} }

    for (let i in object) {
      if (this._excludeCalls.indexOf(i) === -1)
        objectStruct[i] = typeof object[i]
    }

    if (object.prototype) {
      for (let i in object.prototype) {
        if (this._excludeCalls.indexOf(i) === -1)
          objectStruct.__prototype__[i] = typeof object[i]
      }
    }
    return objectStruct
  }
}

export function regFunction (func :any, funcName) {
  console.assert(typeof func === 'function', 'func must be a not null function (' + func + ' given)')

  _callables[funcName ? funcName : funcName.name] = new CallableObject(func, "function")
}

let _checkSecureHash = function(secureHash :string, instanceIdx? :number) : boolean {
  if (_secureHashes[secureHash] === undefined) {
    generateError(_com, 4, 'The client seems not to be registered, it must call farImport before further operation and then pass secureHash on each request')
    return false
  }

  if (instanceIdx !== undefined && _instancesH[instanceIdx].secureHash !== secureHash) {
    generateError(_com, 4, 'The client is not allowed to access this ressource')
    return false
  }
  return true
}

let _treat :any = {}

_treat.farInstantiate = function(constructorObj) {
  _console.log('treat.farInstantiate', constructorObj)
  _console.assert(_com, 'communication must be set before calling this function')

  if (! _checkSecureHash(constructorObj.secureHash)) return // -->

  let Constructor = _extractConstructorReferenceWName(constructorObj.constructorName)
  try {
    constructorObj.args.unshift(null);
    let instance = new (Function.prototype.bind.apply(Constructor, constructorObj.args))
    _instancesH[constructorObj.rIdx] = { "instance" : instance, "secureHash" : constructorObj.secureHash }
  }
  catch (e) {
    throw constructorObj.constructorName + "seems not to be a valid constructor"
  }

  _com.send(JSON.stringify({
      "type" 		: "farInstantiateReturn",
      "rIdx" 		: constructorObj.rIdx
    } ))
}

_treat.farCall = function(callObj) {
  _console.log('treat.farCall', callObj)
  _console.assert(_com, 'communication must be set before calling this function')

  if (! _checkSecureHash(callObj.secureHash, callObj.instanceIdx)) return // -->

  if (typeof callObj.objectName !== "string" || ! callObj.objectName.length) {
    throw {
        "message" : "objectName is empty or invalid : " + callObj.objectName,
        "send"    : true
      }
  }
  let obj = _extractObjectReferenceWName(callObj.objectName, callObj.args, callObj.instanceIdx)
  let ret = obj()

  if (ret instanceof Promise) {
    ret
      .then(function(ret) { _sendFarCallReturn(callObj, ret) })
      .catch(function(error) { generateError(_com, 10, error) })
  }
  else {
    _sendFarCallReturn(callObj, ret)
  }
}

_treat.farImport = function(callObj) {
  _console.assert(_com, 'communication must be set before calling this function')
  if (typeof callObj.symbols !== "object" || ! callObj.symbols.length) {
    throw {
        "message" : "List of symbols is empty or invalid : " + callObj.symbols,
        "send"    : true
      }
  }
  let result :any[] = []
  callObj.symbols.forEach((symbol :string) => {
      if (! _callables[symbol]) {
        throw {
            "message" : `Symbol '${symbol}' does not exist in callee`,
            "send"    : true
          }
      }
      result.push(_callables[symbol])
    })
  _com.send(JSON.stringify({
      "type" 		: "farImportReturn",
      "rIdx"    : callObj.rIdx,
      "secureHash" : _generateSecureHash(callObj.GUID),
      "objects" : result
    }))
}

function _sendFarCallReturn(callObj, ret) {
  _console.log('_sendFarCallReturn', ret)
  _com.send(JSON.stringify({
    "type" 		: "farCallReturn",
    "rIdx" 		: callObj.rIdx,
    "return" 	: ret
  } ))
}

function _extractConstructorReferenceWName(objectName) {
  let obj = _callables[objectName].object

  let objNameTab = objectName.split('.')

  for (let ct = 1; ct < objNameTab.length; ct++) {
    obj = obj[objNameTab[ct]]
    if (! obj) {
      throw {
        "message" : "Object " + objectName + " does not exist in callee ('" + objectName + "' called)",
        "send" : true
      }
    }
  }
  if (! obj) {
    throw {
      "message" : "Object " + objectName + " does not exist in callee ('" + objectName + "' called)",
      "send" : true
    }
  }
  return obj;
}

function _extractObjectReferenceWName(objectName :string, args, instanceId :number) {
  let obj
  let context
  let objNameTab = objectName.split('.')
  if (instanceId !== undefined && instanceId !== null) {
    context = _instancesH[instanceId].instance
    obj = context[objNameTab[0]]
  }
  else {
    obj = _callables[objNameTab[0]].object
    for (let ct = 1; ct < objNameTab.length; ct++) {
      obj = obj[objNameTab[ct]].object
      if (! obj) {
        throw {
          "message" : "Object " + objectName + " does not exist in callee ('" + objectName + "' called)",
          "send" : true
        }
      }
    }
    context = this
  }
  if (! obj || typeof obj !== 'function') {
    throw {
      "message" : "Object " + objectName + ' does not exist ' + (instanceId ? "(in instance) " : "") + "in callee ('" + objectName + "' called)",
      "send" : true
    }
  }
  return function () { console.log('context', context); return obj.apply(context, args) }
}
