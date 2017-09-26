import { _console } from "./_debug"
import { debugOn } from "./_debug"
import { FACalleeCommunication, TupleInstanceSecureHash } from "./interfaces"
import { generateError } from "./error"
import {Chance} from "chance"
import { generateSecureHash } from "./secure_hash"

let _callables = {}
let _rCallIdx = 0
let _com :FACalleeCommunication, _comReadyPromise :Promise<void>
let _instancesH = {}
let _magicToken = new (Chance.Chance as any)().guid()
let _callerSecureHashes = {}
let _myCalleeSecureHash = generateSecureHash(_magicToken, new (Chance.Chance as any)().guid())

let setCommunication = function(communication :FACalleeCommunication) :Promise<any> {
  _com = communication
  _com.onMessage(_myCalleeSecureHash, _messageCbk, true)
  _comReadyPromise = _com.initListening()
  return _comReadyPromise
}

let _messageCbk = function(data :string) {
  let messageObj :any
  try {
    messageObj = JSON.parse(data)
  }
  catch (e) {
    _console.error(`JSON parse error, message is not in the good format : ${data}`)
    return
  }
  let secureHash
  try {
    secureHash = _treat[messageObj.type](messageObj)
  }
  catch (e) {
    if (e.send && e.secureHash) {
      generateError(_myCalleeSecureHash, _com, 1, e.message, e.secureHash)
    }
    else {
      _console.error(`Error (not sent) on treat of type(${messageObj.type}) : `, e)
    }
  }
  _console.log(`\n`)
  return secureHash
}

function regInstantiable(object :any, excludeCalls :string[], objectName :string = undefined) {
  _console.assert(typeof object === 'function' && object, `Entity must be a not null function (${object} given)`)
  let name = objectName ? objectName : object.name
  _console.assert(typeof name === "string")
  _callables[name] = new CallableObject(name, object, "instantiable", excludeCalls)
}

export class CallableObject {

  public name :string
  public structure :any = {}
  public object   :any
  public type     :string
  private _excludeCalls :string[]

  constructor(name :string, object :any, type :string, excludeCalls :string[] = []) {
    this.name = name
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

function regFunction (func :any, funcName) {
  console.assert(typeof func === 'function', 'func must be a not null function (' + func + ' given)')
  let name = funcName ? funcName : funcName.name
  _callables[name] = new CallableObject(name, func, "function")
}

let _checkSecureHash = function(callerSecureHash :string, instanceIdx? :number) : boolean {
  if (_callerSecureHashes[callerSecureHash] === undefined) {
    generateError(_myCalleeSecureHash, _com, 4, `The caller (${callerSecureHash}) seems not to be registered, it must call farImport before further operation and then pass secureHash on each request`, callerSecureHash)
    return false
  }

  if (instanceIdx !== undefined && _instancesH[instanceIdx].secureHash !== callerSecureHash) {
    generateError(_myCalleeSecureHash, _com, 4, 'The caller is not allowed to access this ressource', callerSecureHash)
    return false
  }
  return true
}

let _treat :any = {}

_treat.farInstantiate = function(constructorObj) {
  _console.log('treat.farInstantiate', constructorObj)
  _console.assert(_com, 'communication must be set before calling this function')

  if (! _checkSecureHash(constructorObj.callerSecureHash)) return // -->

  let Constructor = _extractConstructorReferenceWName(constructorObj)
  try {
    constructorObj.args.unshift(null);
    let instance = new (Function.prototype.bind.apply(Constructor, constructorObj.args))
    _instancesH[constructorObj.rIdx] = { "instance" : instance, "secureHash" : constructorObj.callerSecureHash }
  }
  catch (e) {
    _console.error(e)
    throw `${constructorObj.constructorName} seems not to be a valid constructor`
  }

  _com.send(_myCalleeSecureHash,
            constructorObj.callerSecureHash,
            JSON.stringify({
                "type" 		: "farInstantiateReturn",
                "rIdx" 		: constructorObj.rIdx
              } ))
  return constructorObj.callerSecureHash
}

_treat.farCall = function(callObj) {
  _console.log('treat.farCall', callObj)
  _console.assert(_com, 'communication must be set before calling this function')

  if (! _checkSecureHash(callObj.callerSecureHash, callObj.instanceIdx)) return // -->

  if (typeof callObj.objectName !== "string" || ! callObj.objectName.length) {
    throw {
        "message"     : `objectName is empty or invalid : ${callObj.objectName}`,
        "send"        : true,
        "secureHash"  : callObj.callerSecureHash
      }
  }
  let obj = _extractObjectReferenceWName(callObj)
  let ret = obj()

  if (ret.getBCInitDataForCaller) {
    _sendBackCreateReturn(callObj, ret)
    return
  }
  if (ret instanceof Promise) {
    ret
      .then(function(ret) { _sendFarCallReturn(callObj, ret) })
      .catch(function(error) { generateError(_myCalleeSecureHash, _com, 10, error, callObj.callerSecureHash) })
  }
  else {
    _sendFarCallReturn(callObj, ret)
  }
}

_treat.farImport = function(callObj) {
  _console.log('treat.farImport', callObj)
  _console.assert(_com, 'communication must be set before calling this function')
  if (typeof callObj.symbols !== "object" || ! callObj.symbols.length) {
    throw {
        "message"           : "List of symbols is empty or invalid : " + callObj.symbols,
        "send"              : true,
        "callerSecureHash"  : callObj.callerSecureHash
      }
  }

  if (! callObj.callerGUID) {
    throw {
        "message"           : "GUID must be provided",
        "send"              : true,
        "callerSecureHash"  : null
      }
  }
  let result :any[] = []
  callObj.symbols.forEach(
    (symbol :string) => {
      if (! _callables[symbol]) {
        throw {
            "message"         : `Symbol '${symbol}' does not exist in callee`,
            "send"            : true,
            "callerSecureHash" : callObj.callerGUID
          }
      }
      result.push(_callables[symbol])
    })
  // CallerSecureHash is just a GUID, we generate callerSecureHash with it
  let callerSecureHash = generateSecureHash(_magicToken, callObj.callerGUID)
  // Register client
  _console.log(`--> Generate secure hash for GUID (${callObj.callerGUID})`)
  _console.log(`    : ${callerSecureHash}`);
  _callerSecureHashes[callerSecureHash] = true

  _com.registerCallerSecureHash(_myCalleeSecureHash, callObj.callerGUID, callerSecureHash)
  // At this point, caller must provide its secureHash
  _console.log(`--> Send back :`)
  _console.log(result)
  setTimeout(() => {
      _com.send(_myCalleeSecureHash,
                callerSecureHash,
                JSON.stringify({
                    "type" 		          : "farImportReturn",
                    "rIdx"              : callObj.rIdx,
                    "callerSecureHash"  : callerSecureHash,
                    "objects"           : result
                  }))
    }, 0)
}

function _sendFarCallReturn(callObj, ret) {
  _console.log("\n_sendFarCallReturn", ret)
  _com.send(_myCalleeSecureHash,
            callObj.callerSecureHash,
            JSON.stringify({
                "type" 		: "farCallReturn",
                "rIdx" 		: callObj.rIdx,
                "return" 	: ret
              } ))
}

function _sendBackCreateReturn(callObj, ret) {
  _console.log("\n_sendBackCreateReturn", ret.getBCInitDataForCaller())
  _com.send(_myCalleeSecureHash,
            callObj.callerSecureHash,
            JSON.stringify({
                "type" 		: "farBackCreateReturn",
                "rIdx" 		: callObj.rIdx,
                "return" 	: ret.getBCInitDataForCaller()
              } ))
}

function _extractConstructorReferenceWName(callObj) {
  _console.log("\n_extractConstructorReferenceWName", callObj)
  let obj = _callables[callObj.constructorName].object

  let objNameTab = callObj.constructorName.split('.')

  for (let ct = 1; ct < objNameTab.length; ct++) {
    obj = obj[objNameTab[ct]]
    if (! obj) {
      throw {
        "message"     : `Object ${callObj.constructorName} does not exist in callee ('${callObj.constructorName}' called)`,
        "send"        : true,
        "secureHash"  : callObj.callerSecureHash
      }
    }
  }
  if (! obj) {
    throw {
      "message"           : `Object ${callObj.constructorName} does not exist in callee ('${callObj.constructorName}' called)`,
      "send"              : true,
      "callerSecureHash"  : callObj.callerSecureHash
    }
  }
  return obj;
}

function _extractObjectReferenceWName(callObj) {
  _console.log("\n_extractObjectReferenceWName", callObj)
  let obj
  let context
  let objNameTab = callObj.objectName.split('.')
  if (callObj.instanceIdx !== undefined && callObj.instanceIdx !== null) {
    context = _instancesH[callObj.instanceIdx].instance
    obj = context[objNameTab[0]]
  }
  else {
    obj = _callables[objNameTab[0]].object
    for (let ct = 1; ct < objNameTab.length; ct++) {
      obj = obj[objNameTab[ct]].object
      if (! obj) {
        throw {
          "message"           : `Object ${callObj.objectName} does not exist in callee ('${callObj.objectName}' called)`,
          "send"              : true,
          "callerSecureHash"  : callObj.callerSecureHash
        }
      }
    }
    context = this
  }
  if (! obj || typeof obj !== 'function') {
    throw {
      "message"           : `Object ${callObj.objectName} does not exist ` + (callObj.instanceId ? "(in instance) " : "") + `in callee ('${callObj.objectName}' called)`,
      "send"              : true,
      "callerSecureHash"  : callObj.callerSecureHash
    }
  }
  return function () { return obj.apply(context, callObj.args) }
}

export let farAwayCallee = {
  debugOn           : debugOn,
  setCommunication  : setCommunication,
  regInstantiable   : regInstantiable,
  regFunction       : regFunction
}
