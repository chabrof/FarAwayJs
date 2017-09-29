import { _console } from "./_debug"
import { debugOn } from "./_debug"
import { FACalleeCommunication, TupleInstanceSecureHash } from "./interfaces"
import { generateError } from "./error"
import * as Chance from "chance"
import { generateSecureHash } from "./secure_hash"

let _callables = {}
let _rCallIdx = 0
let _com :FACalleeCommunication, _comReadyPromise :Promise<void>
let _instancesH = {}
let _magicToken = new (Chance.Chance as any)().guid()
let _callerSecureHashes = {}
let _myCalleeSecureHash = generateSecureHash(_magicToken, new (Chance.Chance as any)().guid())
let _instanceIdx = -1

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
    if (e.send && e.callerSecureHash) {
      generateError(_myCalleeSecureHash, _com, 1, e.message, e.callerSecureHash)
    }
    else {
      _console.error(`Error (not sent) on treat of type(${messageObj.type}) : `, e)
    }
  }
  _console.log(`\n`)
  return secureHash
}

function register(object :any, name :string = undefined, excludeCalls :string[] = undefined) {
  _console.assert(typeof object === 'function' && object, `Entity must be a not null function (${object} given)`)
  name = name ? name : object.name
  _console.assert(typeof name === "string")
  _callables[name] = new CallableObject(name, object, "instantiable", excludeCalls)
}

export class CallableObject {

  public name :string
  public structure :any = {}
  public object :any
  public type :string
  private _excludeCalls :string[]

  constructor(name :string, object :any, type :string, excludeCalls :string[] = []) {
    this.name = name
    this.type = type
    this.object = object
    this._excludeCalls = excludeCalls
    this.structure = this._exploreObject(this.object)
  }

  _exploreObject(object :any) {
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

    _instancesH[++_instanceIdx] = { "instance" : instance, "calleSecureHash" : constructorObj.callerSecureHash }
  }
  catch (e) {
    _console.error(e)
    throw `${constructorObj.name} seems not to be a valid constructor`
  }
  _console.log("\n_sendFarInstantiateReturn", _instanceIdx)
  _com.send(_myCalleeSecureHash,
            constructorObj.callerSecureHash,
            JSON.stringify({
                "type"        : "farInstantiateReturn",
                "name"        : constructorObj.name,
                "rIdx" 		    : constructorObj.rIdx,
                "instanceIdx" : _instanceIdx
              } ))
  return constructorObj.callerSecureHash
}

_treat.farCall = function(callObj) {
  _console.log('treat.farCall', callObj)
  _console.assert(_com, 'communication must be set before calling this function')

  if (! _checkSecureHash(callObj.callerSecureHash, callObj.instanceIdx)) return // -->

  if (typeof callObj.name !== "string" || ! callObj.name.length) {
    throw {
        "message"     : `name is empty or invalid : ${callObj.name}`,
        "send"        : true,
        "callerSecureHash"  : callObj.callerSecureHash
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
            "message"           : `Symbol '${symbol}' does not exist in callee`,
            "send"              : true,
            "callerSecureHash"  : callObj.callerGUID
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

  // At this point, caller must now provide its secureHash
  _com.registerCallerSecureHash(_myCalleeSecureHash, callObj.callerGUID, callerSecureHash)

  _console.log("\n_sendFarImportReturn", result)
  _com.send(_myCalleeSecureHash,
            callerSecureHash,
            JSON.stringify({
                "type" 		          : "farImportReturn",
                "rIdx"              : callObj.rIdx,
                "callerSecureHash"  : callerSecureHash,
                "objects"           : result
              }))
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
  let obj = _callables[callObj.name].object

  let objNameTab = callObj.name.split('.')

  for (let ct = 1; ct < objNameTab.length; ct++) {
    obj = obj[objNameTab[ct]]
    if (! obj) {
      throw {
        "message"           : `Object ${callObj.name} does not exist in callee ('${callObj.name}' called)`,
        "send"              : true,
        "callerSecureHash"  : callObj.callerSecureHash
      }
    }
  }
  if (! obj) {
    throw {
      "message"           : `Object ${callObj.name} does not exist in callee ('${callObj.name}' called)`,
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
  let objNameTab = callObj.name.split('.')
  if (callObj.instanceIdx !== undefined && callObj.instanceIdx !== null) {
    let localInstanceObj = _instancesH[callObj.instanceIdx]
    if (localInstanceObj.calleSecureHash !== callObj.callerSecureHash) {
      throw {
        "message"           : `Security error : you try to access a unavailable instance for your session`,
        "send"              : true,
        "callerSecureHash"  : callObj.callerSecureHash
      }
    }
    context = localInstanceObj.instance
    obj = context[objNameTab[1]]
  }
  else {
    obj = _callables[objNameTab[0]].object
    for (let ct = 1; ct < objNameTab.length; ct++) {
      obj = obj[objNameTab[ct]].object
      if (! obj) {
        throw {
          "message"           : `(1) Object ${callObj.name} does not exist in callee ('${callObj.name}' called)`,
          "send"              : true,
          "callerSecureHash"  : callObj.callerSecureHash
        }
      }
    }
    context = this
  }
  if (! obj || typeof obj !== 'function') {
    throw {
      "message"           : `(2) Object ${callObj.name} of type '${typeof obj}' does not exist ` +
                            ((callObj.instanceIdx !== undefined && callObj.instanceIdx !== null) ?
                              "(in instance) " :
                              "") +
                            `in callee ('${callObj.name}' called)`,
      "send"              : true,
      "callerSecureHash"  : callObj.callerSecureHash
    }
  }
  return function () { return obj.apply(context, callObj.args) }
}

export let farAwayCallee = {
  debugOn           : debugOn,
  setCommunication  : setCommunication,
  register          : register
}
