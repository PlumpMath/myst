var $$RUNTIME$$ = require('./runtime.js');
var IO = $$RUNTIME$$.IO;
var Pure = $$RUNTIME$$.Pure;
var force = $$RUNTIME$$.force;
var Thunk = $$RUNTIME$$.Thunk;
var Immutable = $$RUNTIME$$.Immutable;
var call = $$RUNTIME$$.call;

var bind = Pure(function(x, y) {
  // Check if x is IO
  return IO(function() {
    var v = force(x)();
    var rIO = force(call(y, v));
    return rIO();
  });
});

var deref = Pure(function(obj, prop) {
  var o = force(obj);
  if (o && o['$$immutable']) {
    var val = o[prop];
    if (typeof val !== 'undefined')
      return val;
  }

  throw new Error('Could not dereference property: ' + prop + ' from object: ' + obj); // TODO: Better error reporting
});

var derefM = Pure(function(obj, prop) {
  return IO(function() {
    return force(obj)[prop];
  });
});

var iff = Pure(function(cond, consequent, alternative) {
  if (force(cond)) {
    return consequent;
  } else {
    return alternative;
  }
});

/* add */
var _PLUS_ = Pure(function(a, b) {
  var a = force(a), b = force(b);
  if (typeof a !== 'number' || typeof b !== 'number' || a !== a || b !== b)
    throw new Error('Both arguments to + operator must be numbers');

  return a + b;
});

/* minus */
var _MINUS_ = Pure(function(a, b) {
  var a = force(a), b = force(b);
  if (typeof a !== 'number' || typeof b !== 'number' || a !== a || b !== b)
    throw new Error('Both arguments to - operator must be numbers');

  return a - b;
});

/* multiplication */
var _TIMES_ = Pure(function(a, b) {
  var a = force(a), b = force(b);
  if (typeof a !== 'number' || typeof b !== 'number' || a !== a || b !== b)
    throw new Error('Both arguments to * operator must be numbers');

  return a - b;
});

/* division */
var _SLASH_ = Pure(function(a, b) {
  var a = force(a), b = force(b);
  if (typeof a !== 'number' || typeof b !== 'number' || a !== a || b !== b)
    throw new Error('Both arguments to / operator must be numbers');

  return a / b;
});

/* modulo */
var _MODULO_ = Pure(function(a, b) {
  var a = force(a), b = force(b);
  if (typeof a !== 'number' || typeof b !== 'number' || a !== a || b !== b)
    throw new Error('Both arguments to % operator must be numbers');

  return a % b;
});

/* equals */
var _EQ__EQ_ = Pure(function(a, b) {
  var a = force(a), b = force(b);
  // TODO: Make immutable objects compare more deeply
  return a === b;
});

/* not equals */
var _EXCLAM__EQ_ = Pure(function(a, b) {
  return call(_EXCLAM_, call(_EQ__EQ_, a, b));
});

/* less than */
var _LT_ = Pure(function(a, b) {
  return force(a) < force(b);
});

/* greater than */
var _GT_ = Pure(function(a, b) {
  return force(a) > force(b);
});

/* less than or equals */
var _LT__EQ_ = Pure(function(a, b) {
  return force(a) <= force(b);
});

/* greater than or equals */
var _GT__EQ_ = Pure(function(a, b) {
  return force(a) >= force(b);
});

/* logical or */
var _BAR__BAR_ = Pure(function(a, b) {
  var fa = force(a);
  if (fa) return fa;

  return b;
});

/* logical or */
var _AND__AND_ = Pure(function(a, b) {
  var fa = force(a);
  if (! fa) return fa;

  return b;
});

/* not */
var _EXCLAM_ = Pure(function(a) {
  return ! force(a);
});

/* cons */
var _COLON_ = Pure(function(a, b) {
  if (! Array.isArray(b))
    throw new Error('Second argument to : operator must be an array');

  var nb = b.slice();
  nb.unshift(a);
  return nb;
});

module.exports = Immutable({
  bind: bind,
  deref: deref,
  derefM: derefM,
  iff: iff,
  _PLUS_: _PLUS_,
  _MINUS_: _MINUS_,
  _TIMES_: _TIMES_,
  _SLASH_: _SLASH_,
  _MODULO_: _MODULO_,
  _EQ__EQ_: _EQ__EQ_,
  _EXCLAM__EQ_: _EXCLAM__EQ_,
  _LT_: _LT_,
  _GT_: _GT_,
  _LT__EQ_: _LT__EQ_,
  _GT__EQ_: _GT__EQ_,
  _BAR__BAR_: _BAR__BAR_,
  _AND__AND_: _AND__AND_,
  _EXCLAM_: _EXCLAM_,
  _COLON_: _COLON_
});