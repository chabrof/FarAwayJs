/**
 * @class NullConsole
 * @impletments Console
 * This class implements all Browser Console methods
 */
export class NullConsole implements Console {

  constructor (stdW :any, stdE :any) {
  }

  log() :void {
    return null;
  }

  debug() :void {
    return null;
  }

  info() :void {
    return null;
  }

  warn() :void {
    return null;
  }

  error() :void {
    return null;
  }

  group() :void {
    return null;
  }

  groupEnd() :void {
    return null;
  }

  assert() :void {
    return null;
  }

  clear() :void {
    return null;
  }

  count() {
    return null;
  }

  dir() {
    return null;
  }

  dirxml() {
    return null;
  }

  exception() {
    return null;
  }

  groupCollapsed() {
    return null;
  }

  time () {
    return null;
  }

  timeEnd () {
    return null;
  }

  trace() {
    return null;
  }

  msIsIndependentlyComposed() {
    return null;
  }

  profile() {
    return null;
  }

  profileEnd() {
    return null;
  }

  select() {
    return null;
  }

  table() {
    return null;
  }
}

// Singleton
export let nullConsole = new NullConsole()
