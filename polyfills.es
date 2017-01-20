var arrayProto = Array.prototype;
var stringProto = String.prototype;
var arrayProps = {};
var stringProps = {};

//https://github.com/sindresorhus/object-assign/blob/master/index.js
/* eslint-disable no-unused-vars */
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
  if (val === null || val === undefined) {
    throw new TypeError('Object.assign cannot be called with null or undefined');
  }

  return Object(val);
}

function shouldUseNative() {
  try {
    if (!Object.assign) {
      return false;
    }

    // Detect buggy property enumeration order in older V8 versions.

    // https://bugs.chromium.org/p/v8/issues/detail?id=4118
    var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
    test1[5] = 'de';
    if (Object.getOwnPropertyNames(test1)[0] === '5') {
      return false;
    }

    // https://bugs.chromium.org/p/v8/issues/detail?id=3056
    var test2 = {};
    for (var i = 0; i < 10; i++) {
      test2['_' + String.fromCharCode(i)] = i;
    }
    var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
      return test2[n];
    });
    if (order2.join('') !== '0123456789') {
      return false;
    }

    // https://bugs.chromium.org/p/v8/issues/detail?id=3056
    var test3 = {};
    'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
      test3[letter] = letter;
    });
    if (Object.keys(Object.assign({}, test3)).join('') !==
        'abcdefghijklmnopqrst') {
      return false;
    }

    return true;
  } catch (err) {
    // We don't expect any of the above to throw, but better to be safe.
    return false;
  }
}

Object.assign = shouldUseNative() ? Object.assign : function (target, source) {
  var from;
  var to = toObject(target);
  var symbols;

  for (var s = 1; s < arguments.length; s++) {
    from = Object(arguments[s]);

    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }

    if (Object.getOwnPropertySymbols) {
      symbols = Object.getOwnPropertySymbols(from);
      for (var i = 0; i < symbols.length; i++) {
        if (propIsEnumerable.call(from, symbols[i])) {
          to[symbols[i]] = from[symbols[i]];
        }
      }
    }
  }

  return to;
};


/* array */
if (!arrayProto.find) {
  arrayProps.find = {
    value: function (predicate) {
      if (this === null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      var value;

      for (var i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
          return value;
        }
      }
      return undefined;
    }
  };
}
if (!arrayProto.includes) {
  arrayProps.includes = {
    value: has
  };
}
arrayProps.matches = {value: has};
arrayProps.contains = {value: has};
arrayProps.has = {value: has};

if (!Array.from) {
  Array.from = function (iterable) {
    var i = Number(iterable.length);
    var array = new Array(i);
    while (i--) {
      array[i] = iterable[i];
    }
    return array;
  };
}
/*if (!Array.isArray) {
  var op2str = Object.prototype.toString;
  Array.isArray = function(a) {
    return op2str.call(a) === '[object Array]';
  };
}*/


/* string */
if (!stringProto.trim) {
  stringProto = {value: trim};
}
const hasDiscriptor = {value: has};
if (!stringProto.includes) {
  stringProps.includes = hasDiscriptor;
}
stringProps.matches = hasDiscriptor;
stringProps.contains = hasDiscriptor;
stringProps.has = hasDiscriptor;

if (!stringProto.startsWith) {
  stringProps.startsWith = {
    value: function (string, position) {
      if (!position) {
        position = 0;
      }
      return this.indexOf(string, position) === position;
    }
  };
}
if (!stringProto.endsWith) {
  stringProps.endsWith = {
    value: function (string, position) {
      var lastIndex;
      position = position || this.length;
      position = position - string.length;
      lastIndex = this.lastIndexOf(string);
      return lastIndex !== -1 && lastIndex === position;
    }
  };
}

Object.defineProperties(arrayProto, arrayProps);
Object.defineProperties(stringProto, stringProps);

/* number */
if (!Number.isFinite) {
  Number.isFinite = function (value) {
    return typeof value === 'number' && isFinite(value);
  };
}
if (!Number.isInteger) {
  Number.isInteger = function (value) {
    return typeof value === 'number'
      && isFinite(value)
      && value > -9007199254740992
      && value < 9007199254740992
      && Math.floor(value) === value;
  };
}
if (!Number.isNaN) {
  Number.isNaN = function (value) {
    return typeof value === 'number' && isNaN(value);
  };
}
if (!Number.parseInt) {
  Number.parseInt = parseInt;
}
if (!Number.parseFloat) {
  Number.parseFloat = parseFloat;
}

function has(it) {
  return this.indexOf(it) !== -1;
}

const trimRegExp = '(?:\\.|[\w#-]|[^\x00-\xa0])+';
function trim(string) {
  return null == string ? '' : (string + '').replace(trimRegExp, '');
}
