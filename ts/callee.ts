import { _console } from "./_debug"

let _callables = {}
let _rCallIdx = 0
let _wsServer = "ws://localhost:8080"
let _ws, _wsReadyPromise
let _declareWsReady :() => void
let _instancesH = {}

export function usePassThroughWsServer(url :string = "localhost", port :string = "8080") {

  _ws = new WebSocket(_wsServer)
  _wsReadyPromise = new Promise(function(ok, ko) { _declareWsReady = ok; })
  _ws.addEventListener('open', function() { _declareWsReady() })

  _ws.addEventListener('message', function(message) {
    let messageObj :any
    try { messageObj = JSON.parse(message.data) }
    catch (e) {
      _generateError(3, "Message is not in the good format")
    }

    try {
      _treat[messageObj.type](messageObj)
    }
    catch (e) {
      if (e.send) {
        _generateError(1, e.message)
      }
      else {
        _console.error('Error : ', e.message)
      }
    }
  })
}

export function regInstantiable(object :any, excludeCalls :string[], objectName :string = undefined) {
  _console.assert(typeof object === 'function' && object, 'Entity must be a not null function (' + object + ' given)')

  _callables[objectName ? objectName : object.name] = new CallableObject(object, "instantiable", excludeCalls)
}

class CallableObject {

  public stucture :any = {}
  public object :any
  public type :string
  private _excludeCalls :string[]

  constructor(object :any, type :string, excludeCalls :string[] = []) {
    this.type = type
    this.object = object
    this._excludeCalls = excludeCalls
    this.stucture = this._exploreObject(this.object)
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

let _treat :any = {}

_treat.rInstantiate = function(constructorObj) {
  _console.log('treat.rInstantiate', constructorObj)

  let Constructor = _extractConstructorReferenceWName(constructorObj.constructorName)
  try {
    constructorObj.args.unshift(null);
    let instance = new (Function.prototype.bind.apply(Constructor, constructorObj.args))
    _instancesH[constructorObj.rIdx] = instance
  }
  catch (e) {
    throw constructorObj.constructorName + "seems not to be a valid constructor"
  }

  _ws.send(JSON.stringify({
      "type" 		: "rInstantiateReturn",
      "rIdx" 		: constructorObj.rIdx
    } ))
}

_treat.rCall = function(callObj) {
  _console.log('treat.rCall', callObj)

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
      .then(function(ret) { _sendRCallReturn(callObj, ret) })
      .catch(function(error) { _generateError(10, error) })
  }
  else {
    _sendRCallReturn(callObj, ret)
  }
}

_treat.rImport = function(callObj) {
  if (typeof callObj.symbols !== "object" || ! callObj.symbols.length) {
    throw {
        "message" : "List of symbols is empty or invalid : " + callObj.symbols,
        "send"    : true
      }
  }
  let result :any[] = []
  callObj.forEach((symbol :string) => {
      if (! _callables[symbol]) {
        throw {
            "message" : `Symbol '${symbol}' does not exist in callee`,
            "send"    : true
          }
      }
      result.push(_callables[symbol])
    })
  _ws.send(JSON.stringify({
      "type" 		: "rImportReturn",
      "rIdx"    : callObj.rIdx,
      "objects" : result
    }))
}

function _sendRCallReturn(callObj, ret) {
  _console.log('_sendRCallReturn', ret)
  _ws.send(JSON.stringify({
    "type" 		: "rCallReturn",
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
    obj = _instancesH[instanceId][objNameTab[0]]
    context = _instancesH[instanceId]
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
      "message" : "Object " + objectName + " does not exist in callee ('" + objectName + "' called)",
      "send" : true
    }
  }
  return function () { console.log('context', context); return obj.apply(context, args) }
}

function _generateError(code :number, message :string) {
  _console.error('Generate error :', message)
  _ws.send(JSON.stringify(
    {
      "type" :	"rError",
      "error" : {
        "code" 		: code,
        "message"	: message
      }
    }	))
}
