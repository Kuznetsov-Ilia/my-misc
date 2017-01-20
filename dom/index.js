'use strict';

var body = document.body;
var html$1 = document.documentElement;
var _window = self || window;
var head = document.head || document.getElementsByTagName('head')[0];

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

// inherit.js https://gist.github.com/RubaXa/8857525
function isObject(value) {
  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value !== null;
}
function isFunction(value) {
  return typeof value === 'function';
}
function isNode(value) {
  return value instanceof _window.Node;
}
if (!Array.isArray) {
  var op2str = Object.prototype.toString;
  Array.isArray = function (a) {
    return op2str.call(a) === '[object Array]';
  };
}
function isArray(value) {
  return Array.isArray(value); //return isset(value) && value instanceof Array;
}
function isString(value) {
  return isset(value) && typeof value === 'string';
}
function isNumber(value) {
  return isset(value) && typeof value === 'number';
}
function isset(value) {
  return value !== undefined;
}
function keys(o) {
  if (isObject(o)) {
    return Object.keys(o) || [];
  }
  return [];
}

/*navigator,*/
var Np = (_window.Node || _window.Element).prototype;
var Ep = _window.Element.prototype;
var NLp = _window.NodeList.prototype;
var HCp = _window.HTMLCollection.prototype;
var Ap = Array.prototype;
var Wp = _window;
var Dp = document;
var ETp = _window.EventTarget && _window.EventTarget.prototype;
var CACHE = {};
var CACHE_KEY = 0;
var ES5ArrayMethods = ['join', 'split', 'concat', 'pop', 'push', 'shift', 'unshift', 'reverse', 'slice', 'splice', 'sort', 'indexOf', 'lastIndexOf', //ES3
'forEach', 'some', 'every', /*'find', 'filter',*/'map', 'reduce', 'reduceRight' //ES5
].reduce(function (acc, value) {
  return acc[value] = { value: Ap[value] }, acc;
}, {});

var CustomMethods = {
  on: onAll,
  once: onceAll,
  one: onceAll,
  off: offAll,
  find: findAll,
  filter: filterAll,
  trigger: triggerAll,
  matches: matchesAll,
  is: matchesAll
};
var listMethods = keys(CustomMethods).reduce(function (acc, value) {
  return acc[value] = { value: CustomMethods[value] }, acc;
}, ES5ArrayMethods);
var matches = Ep.matches || Ep.matchesSelector || Ep.webkitMatchesSelector || Ep.khtmlMatchesSelector || Ep.mozMatchesSelector || Ep.msMatchesSelector || Ep.oMatchesSelector || function (selector) {
  var _this2 = this;

  return document.filter(selector).some(function (e) {
    return e === _this2;
  });
};

var NodeMethods = {
  on: on, once: once, one: once, off: off, trigger: trigger,
  find: find, filter: filter,
  outerHeight: outerHeight, outerWidth: outerWidth,
  offset: offset,
  height: height, width: width,
  position: position,
  parent: parent,
  siblings: siblings,
  prev: prev, next: next,
  first: first, //last!
  after: after, before: before,
  append: append, prepend: prepend,
  closest: closest,
  replaceWith: replaceWith,
  css: css,
  data: data,
  attr: attr,
  text: text,
  html: html$$1,
  matches: matches,
  is: matches
};

var NodeMethodsKeys = keys(NodeMethods);
var reduceNodeMethods = function reduceNodeMethods(acc, key) {
  return acc[key] = { value: NodeMethods[key] }, acc;
};
var nodeMethods = NodeMethodsKeys.filter(function (p) {
  return !(p in Np);
}).reduce(reduceNodeMethods, {});
var windowMethods = NodeMethodsKeys.filter(function (p) {
  return !(p in Wp);
}).filter(function (p) {
  return ['width', 'height'].indexOf(p) === -1;
}).reduce(reduceNodeMethods, {});
var documentMethods = NodeMethodsKeys.filter(function (p) {
  return !(p in Dp);
}).reduce(reduceNodeMethods, {});

document.matches = function (selector) {
  return body.matches(selector);
};

Object.defineProperties(NLp, listMethods);
if (_window.StaticNodeList && _window.StaticNodeList.prototype) {
  Object.defineProperties(_window.StaticNodeList.prototype, listMethods);
}
Object.defineProperties(HCp, listMethods);
Object.defineProperties(Np, nodeMethods);
Object.defineProperties(Dp, documentMethods);
Object.defineProperties(Wp, windowMethods);
if (!('width' in Wp)) {
  Wp.width = function (val) {
    return isset(val) ? width.call(Wp, val) : Wp.innerWidth || html$$1.clientWidth || body.clientWidth;
  };
}
if (!('height' in Wp)) {
  Wp.height = function (val) {
    return isset(val) ? height.call(Wp, val) : Wp.innerHeight || html$$1.clientHeight || body.clientHeight;
  };
}

if (ETp) {
  var ETMethods = NodeMethodsKeys.filter(function (p) {
    return !(p in ETp);
  }).reduce(reduceNodeMethods, {});
  Object.defineProperties(ETp, ETMethods);
}

var ua = _window.navigator.userAgent;
if (ua.indexOf('MSIE ') !== -1 || ua.indexOf('Trident/') !== -1 || ua.indexOf('Edge/') !== -1) {
  // rewrite broken cloneNode method in IE
  var originalCloneNode = Np.cloneNode;
  Np.cloneNode = function (deep) {
    // If the node is a text node, then re-create it rather than clone it
    var clone$$1 = this.nodeType === 3 ? document.createTextNode(this.nodeValue) : originalCloneNode.call(this, false);
    if (deep) {
      var child = this.firstChild;
      while (child) {
        clone$$1.appendChild(child.cloneNode(true));
        child = child.nextSibling;
      }
    }
    return clone$$1;
  };
}

function on(name, callback, context) {
  var el = this;
  if (!el) {
    return false;
  }
  if (isArray(name)) {
    // el.on(['click', 'submit'], fn, this)
    name.forEach(function (n) {
      on.call(el, n, callback, context);
    });
  } else if (isObject(name)) {
    // el.on({click: fn1, submit: fn2})
    context = callback;
    for (var i in name) {
      on.call(el, i, name[i], context);
    }
  } else {
    //submit, focus, blur, load, unload, change, reset, scroll
    var types = name.split(/\s+/);
    var handler = callback;

    var _types$0$split = types[0].split('.'),
        eventName = _types$0$split[0],
        _types$0$split$ = _types$0$split[1],
        nameSpace = _types$0$split$ === undefined ? 'default' : _types$0$split$;

    if (context) {
      handler = callback.bind(context);
    }
    if (types.length > 1) {
      handler = delegate(types[1], handler);
    }
    el.addEventListener(eventName, handler, false);
    if (el.handlers === undefined) {
      el.handlers = {};
    }
    el.handlers[eventName] = el.handlers[eventName] || {};
    el.handlers[eventName][nameSpace] = el.handlers[eventName][nameSpace] || [];
    el.handlers[eventName][nameSpace].push(handler);
  }
  return el;
}
function once(name, callback, context) {
  var el = this;
  if (!el) {
    return false;
  }
  if (isArray(name)) {
    // el.once(['click', 'submit'], fn, this)
    if (context) {
      callback = callback.bind(context);
    }
    name.forEach(function (n) {
      var clb = function clb(e) {
        callback(e);
        off.call(el, n, clb);
      };
      on.call(el, n, clb);
    });
  } else if (isObject(name)) {
    // el.once({click: fn1, submit: fn2})
    context = callback;
    for (var i in name) {
      if (context) {
        callback = name[i].bind(context);
      }
      var clb = function clb(e) {
        callback(e);
        off.call(el, i, clb);
      };
      on.call(el, i, clb);
    }
  } else {
    if (context) {
      callback = callback.bind(context);
    }
    var clb = function clb(e) {
      callback(e);
      off.call(el, name, clb);
    };
    on.call(el, name, clb);
  }
}
function off(event, fn) {
  var el = this;
  if (!el) {
    return false;
  }
  /*    || !isset(this.handlers[eventName])
    || !this.handlers[eventName][nameSpace] || !this.handlers[eventName][nameSpace].length*/

  //не установлены хендлеры в принципе
  if (!isset(el.handlers)) {
    return el;
  } else if (isset(fn)) {
    // el.off(['click.popup', 'change'], fn)
    if (isArray(event)) {
      event.forEach(function (e) {
        el.removeEventListener(e, fn, false);
      });
    } else {
      // el.off('click.popup', fn)
      el.removeEventListener(event, fn, false);
    }
  } else if (isset(event)) {
    //el.off(['click.popup', 'change'])
    if (isArray(event)) {
      event.forEach(function (e) {
        var _e$split = e.split('.'),
            eventName = _e$split[0],
            _e$split$ = _e$split[1],
            nameSpace = _e$split$ === undefined ? 'default' : _e$split$;

        if (eventName in el.handlers && nameSpace in el.handlers[eventName] && el.handlers[eventName][nameSpace].length > 0) {
          el.handlers[eventName][nameSpace].forEach(function (handler) {
            el.removeEventListener(eventName, handler, false);
          });
          el.handlers[eventName][nameSpace] = [];
        }
      });
    } else {
      // el.off(click.popup)
      var _event$split = event.split('.'),
          eventName = _event$split[0],
          _event$split$ = _event$split[1],
          nameSpace = _event$split$ === undefined ? 'default' : _event$split$;

      if (eventName in el.handlers && nameSpace in el.handlers[eventName] && el.handlers[eventName][nameSpace].length > 0) {
        el.handlers[eventName][nameSpace].forEach(function (handler) {
          el.removeEventListener(eventName, handler, false);
        });
        el.handlers[eventName][nameSpace] = [];
      }
    }
  } else {
    // el.off()
    keys(el.handlers).forEach(function (eventName2) {
      keys(el.handlers[eventName2]).forEach(function (nameSpace2) {
        el.handlers[eventName2][nameSpace2].forEach(function (handler) {
          el.removeEventListener(eventName2, handler, false);
        });
      });
    });
    el.handlers = {};
  }
  return el;
}
function find(selector, flag) {
  if (isFunction(selector)) {
    return Ap.find.call(this, selector);
  } else {
    if (flag) {
      switch (selector.charAt(0)) {
        case '#':
          return document.getElementById(selector.substr(1));
        case '.':
          return this.getElementsByClassName(selector.substr(1))[0];
        case /w+/gi:
          return this.getElementsByTagName(selector);
      }
    }
    return this.querySelector(selector || '☺');
  }
}
function filter(selector) {
  return this.querySelectorAll(selector || '☺') || [];
}

/* Traverse DOM from event target up to parent, searching for selector */
function passedThrough(event, selector, stopAt) {
  var currentNode = event.target;
  while (true) {
    if (currentNode === null) {
      return false;
    } else if (currentNode.matches(selector)) {
      return currentNode;
    } else if (currentNode !== stopAt && currentNode !== body) {
      currentNode = currentNode.parentNode;
    } else {
      return false;
    }
  }
}
function delegate(delegationSelector, handler) {
  return function (event) {
    var found = passedThrough(event, delegationSelector, event.currentTarget);
    if (found) {
      event.delegateTarget = found;
      return handler(event);
    }
  };
}

function trigger(type, _data) {
  var el = this;
  var event = document.createEvent('HTMLEvents');
  _data = _data || {};
  _data.target = el;
  event.initEvent(type, true, true, _data);
  event.data = _data;
  event.eventName = type;
  this.dispatchEvent(event);
  return this;
}

function onAll(name, callback, context) {
  this.forEach(function (node) {
    on.call(node, name, callback, context);
  });
  return this;
}
function onceAll(name, callback, context) {
  this.forEach(function (node) {
    once.call(node, name, callback, context);
  });
  return this;
}
function offAll(event, fn) {
  this.forEach(function (node) {
    off.call(node, event, fn);
  });
  return this;
}
function triggerAll(type, _data) {
  this.forEach(function (node) {
    trigger.call(node, type, _data);
  });
  return this;
}
function findAll(selector) {
  if (typeof selector === 'function') {
    return Ap.find.call(this, selector);
  }
  this.forEach(function (node) {
    var found = node.find(selector);
    if (found) {
      return found;
    }
  });
  return null;
}
function filterAll(selector) {
  if (typeof selector === 'function') {
    return Ap.filter.call(this, selector);
  }
  var result$$1 = [];
  var r;
  this.forEach(function (node) {
    r = node.filter(selector);
    if (r) {
      result$$1.push(r);
    }
  });
  return result$$1.length ? result$$1 : [];
}
function matchesAll(selector) {
  return this.every(function (node) {
    return node.matches(selector);
  });
}

function outerHeight(withMargins) {
  var el = this;
  if (el) {
    var _height = el.offsetHeight;
    if (withMargins) {
      var style = _window.getComputedStyle(el, null);
      _height += parseInt(style.marginTop) + parseInt(style.marginBottom, 10);
    }
    return _height;
  }
}
function outerWidth(withMargins) {
  var _width = this.offsetWidth;
  if (withMargins) {
    var style = _window.getComputedStyle(this, null);
    _width += parseInt(style.marginLeft) + parseInt(style.marginRight, 10);
  }
  return width;
}
function offset() {
  var el = this;
  if (!el) {
    return {};
  }
  var box = el.getBoundingClientRect();
  return {
    top: box.top + _window.pageYOffset - html$1.clientTop,
    left: box.left + _window.pageXOffset - html$1.clientLeft
  };
}
function height(value) {
  if (isset(value)) {
    value = parseInt(value);
    this.style.height = value + 'px';
    return value;
  } else {
    return parseInt(_window.getComputedStyle(this, null).height);
  }
}
function width(value) {
  if (isset(value)) {
    value = parseInt(value);
    this.style.width = value + 'px';
    return value;
  } else {
    return parseInt(_window.getComputedStyle(this, null).width);
  }
}
function position() {
  return {
    left: this.offsetLeft,
    top: this.offsetTop
  };
}
function parent(_filter) {
  var el = this;
  if (!el) {
    return false;
  }
  if (isset(_filter)) {
    var _filterFn;
    if (isNumber(_filter)) {
      _filterFn = function _filterFn(node, k) {
        return k === _filter;
      };
    } else {
      _filterFn = function _filterFn(node) {
        return node.matches(_filter);
      };
    }

    var _parent = el;
    var ii = 1;
    while (_parent = _parent.parentElement) {
      if (_filterFn(_parent, ii)) {
        return _parent;
      }
      ii++;
    }
    return false;
  } else {
    return el.parentElement;
  }
}
function siblings(_filter) {
  var _this = this;
  return this.parent().children.filter(function (child) {
    var valid = child !== _this;
    if (valid && isset(_filter)) {
      valid = child.matches(_filter);
    }
    return valid;
  });
}
function prev(_filter) {
  if (isset(_filter)) {
    var _prev = this;
    //var result = [];
    while (_prev = _prev.previousElementSibling) {
      if (_prev.matches(_filter)) {
        return _prev;
      }
    }
    return false;
  } else {
    return this.previousElementSibling;
  }
}
function next(filter) {
  if (isset(filter)) {
    var _next = this;
    while (_next = _next.nextElementSibling) {
      if (_next.matches(filter)) {
        return _next;
      }
    }
    return false;
  } else {
    return this.nextElementSibling;
  }
}
function first(filter) {
  if (isset(filter)) {
    var children = this.children;
    if (isset(children) && children.length > 0) {
      for (var ii = 0, l = children.length; ii < l; ii++) {
        if (children[ii].matches(filter)) {
          return children[ii];
        }
      }
    }
    return null;
  } else {
    return this.firstChild;
  }
}
function closest(selector) {
  var parentNode = this;
  var matches;
  while (
  // document has no .matches
  (matches = parentNode && parentNode.matches) && !parentNode.matches(selector)) {
    parentNode = parentNode.parentNode;
  }
  return matches ? parentNode : null;
}
function after(_html, _position) {
  var el = this;
  if (_position) {
    _position = 'afterend';
  } else {
    _position = 'afterbegin';
  }
  if (isset(_html)) {
    if (isString(_html)) {
      return el.insertAdjacentHTML(_position, _html);
    } else if (isNode(_html)) {
      var _parent = el.parentNode;
      var _next = el.nextSibling;
      if (_next === null) {
        return _parent.appendChild(_html);
      } else {
        return _parent.insertBefore(_html, _next);
      }
    }
  } else {
    return '';
  }
}
function before(_html, _position) {
  if (_position) {
    _position = 'beforeend';
  } else {
    _position = 'beforebegin';
  }
  if (isset(_html)) {
    if (isString(_html)) {
      return this.insertAdjacentHTML(_position, _html);
    } else if (isNode(_html)) {
      return this.parent().insertBefore(_html, this);
    }
  }
  return '';
}
function append(node) {
  if (isNode(node)) {
    return this.appendChild(node);
  } else if (isString(node)) {
    return this.before(node, 1);
  }
}
function prepend(node) {
  if (isNode(node)) {
    this.insertBefore(node, this.firstChild);
  } else if (isArray(node)) {
    var _this = this;
    node.each(function (n) {
      _this.prepend(n);
    });
  }
  return this;
}
function replaceWith(html$$1) {
  var parentNode = this.parentNode;
  if (parentNode) {
    if (isString(html$$1)) {
      this.outerHTML = html$$1;
    } else if (isNode(html$$1)) {
      parentNode.replaceChild(html$$1, this);
    } else {
      console.error('unsuported input type in replaceWith', typeof html$$1 === 'undefined' ? 'undefined' : _typeof(html$$1), html$$1);
    }
  }
  return this;
}
function css(ruleName, value) {
  var el = this;
  if (isObject(ruleName)) {
    for (var ii in ruleName) {
      el.style[camelCase(ii)] = ruleName[ii];
    }
    return el;
  } else if (isset(ruleName)) {
    if (isset(value)) {
      el.style[camelCase(ruleName)] = value;
      return value;
    } else {
      return _window.getComputedStyle(el, null)[camelCase(ruleName)];
    }
  }
}
function data(key, value) {
  var el = this;
  var id;
  if ('__CACHE_KEY__' in el) {
    id = el.__CACHE_KEY__;
  } else {
    el.__CACHE_KEY__ = id = CACHE_KEY++;
    CACHE[id] = Object.assign({}, el.dataset);
  }
  var cached = CACHE[id];
  if (isObject(key)) {
    for (var ii in key) {
      cached[ii] = key[ii];
    }
  } else if (isset(key)) {
    if (isset(value)) {
      cached[key] = value;
      return value;
    }
    return cached[key];
  }
  return cached;
}
function attr(name, value) {
  if (isObject(name)) {
    for (var ii in name) {
      this.setAttribute(ii, name[ii]);
    }
    return this;
  } else if (isset(name)) {
    if (isset(value)) {
      this.setAttribute(name, value);
      return this;
    } else {
      return this.getAttribute(name);
    }
  }
  return '';
}
function text(textString) {
  if (isset(textString)) {
    this.textContent = textString;
    return this;
  } else {
    return this.textContent;
  }
}

function html$$1(string) {
  if (isset(string)) {
    this.innerHTML = string;
    return this;
  } else {
    return this.innerHTML;
  }
}
function camelCase(string) {
  return string.replace(/^-ms-/, 'ms-').replace(/-([\da-z])/gi, function (all, letter) {
    return letter.toUpperCase();
  });
}

