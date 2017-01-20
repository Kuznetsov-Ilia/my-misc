 /*navigator,*/
import {window, document, body, html as root} from '../globals';
import { isArray, isObject, isset, isNumber, isString, isNode, isFunction, keys } from '../utils';

var Np = (window.Node || window.Element).prototype;
var Ep = window.Element.prototype;
var NLp = window.NodeList.prototype;
var HCp = window.HTMLCollection.prototype;
var Ap = Array.prototype;
var Wp = window;
var Dp = document;
var ETp = (window.EventTarget && window.EventTarget.prototype);
var CACHE = {};
var CACHE_KEY = 0;
var ES5ArrayMethods = [
  'join', 'split', 'concat', 'pop', 'push', 'shift', 'unshift', 'reverse', 'slice', 'splice', 'sort', 'indexOf', 'lastIndexOf',//ES3
  'forEach', 'some', 'every', /*'find', 'filter',*/ 'map', 'reduce', 'reduceRight'//ES5
].reduce((acc, value) => (acc[value] = {value: Ap[value]}, acc), {});

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
var listMethods = keys(CustomMethods)
  .reduce((acc, value) => (acc[value] = {value: CustomMethods[value]}, acc), ES5ArrayMethods);
var matches = Ep.matches ||
  Ep.matchesSelector ||
  Ep.webkitMatchesSelector ||
  Ep.khtmlMatchesSelector ||
  Ep.mozMatchesSelector ||
  Ep.msMatchesSelector ||
  Ep.oMatchesSelector ||
  function (selector) {
    return document.filter(selector).some(e => e === this);
  };

var NodeMethods = {
  on, once, one: once, off, trigger,
  find, filter,
  outerHeight, outerWidth,
  offset,
  height, width,
  position,
  parent,
  siblings,
  prev, next,
  first,//last!
  after, before,
  append, prepend,
  closest,
  replaceWith,
  css,
  data,
  attr,
  text,
  html,
  matches,
  is: matches
};

var NodeMethodsKeys = keys(NodeMethods);
var reduceNodeMethods = (acc, key) => (acc[key] = {value: NodeMethods[key]}, acc);
var nodeMethods = NodeMethodsKeys
  .filter(p => !(p in Np))
  .reduce(reduceNodeMethods, {});
var windowMethods = NodeMethodsKeys
  .filter(p => !(p in Wp))
  .filter(p => ['width', 'height'].indexOf(p) === -1)
  .reduce(reduceNodeMethods, {});
var documentMethods = NodeMethodsKeys
  .filter(p => !(p in Dp))
  .reduce(reduceNodeMethods, {});

document.matches = (selector) => body.matches(selector);

Object.defineProperties(NLp, listMethods);
if (window.StaticNodeList && window.StaticNodeList.prototype) {
  Object.defineProperties(window.StaticNodeList.prototype, listMethods);
}
Object.defineProperties(HCp, listMethods);
Object.defineProperties(Np, nodeMethods);
Object.defineProperties(Dp, documentMethods);
Object.defineProperties(Wp, windowMethods);
if (!('width' in Wp)) {
  Wp.width = (val) => isset(val) ? width.call(Wp, val) : (Wp.innerWidth || html.clientWidth || body.clientWidth);
}
if (!('height' in Wp)) {
  Wp.height = (val) => isset(val) ? height.call(Wp, val) : (Wp.innerHeight || html.clientHeight || body.clientHeight);
}

if (ETp) {
  var ETMethods = NodeMethodsKeys
    .filter(p => !(p in ETp))
    .reduce(reduceNodeMethods, {});
  Object.defineProperties(ETp, ETMethods);
}

var ua = window.navigator.userAgent;
if (ua.indexOf('MSIE ') !== -1 || ua.indexOf('Trident/') !== -1 || ua.indexOf('Edge/') !== -1) {
  // rewrite broken cloneNode method in IE
  var originalCloneNode = Np.cloneNode;
  Np.cloneNode = function (deep) {
    // If the node is a text node, then re-create it rather than clone it
    var clone = this.nodeType === 3 ? document.createTextNode(this.nodeValue) : originalCloneNode.call(this, false);
    if (deep) {
      var child = this.firstChild;
      while (child) {
        clone.appendChild(child.cloneNode(true));
        child = child.nextSibling;
      }
    }
    return clone;
  };
}

function on(name, callback, context) {
  var el = this;
  if (!el) {
    return false;
  }
  if (isArray(name)) {// el.on(['click', 'submit'], fn, this)
    name.forEach(function (n) {
      on.call(el, n, callback, context);
    });
  } else if (isObject(name)) {// el.on({click: fn1, submit: fn2})
    context = callback;
    for (var i in name) {
      on.call(el, i, name[i], context);
    }
  } else {
    //submit, focus, blur, load, unload, change, reset, scroll
    var types = name.split(/\s+/);
    var handler = callback;
    var [eventName, nameSpace = 'default'] = types[0].split('.');

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
  if (isArray(name)) {// el.once(['click', 'submit'], fn, this)
    if (context) {
      callback = callback.bind(context);
    }
    name.forEach(n => {
      var clb = e => {
        callback(e);
        off.call(el, n, clb);
      }
      on.call(el, n, clb);
    });
  } else if (isObject(name)) {// el.once({click: fn1, submit: fn2})
    context = callback;
    for (var i in name) {
      if (context) {
        callback = name[i].bind(context);
      }
      var clb = e => {
        callback(e);
        off.call(el, i, clb);
      }
      on.call(el, i, clb);
    }
  } else {
    if (context) {
      callback = callback.bind(context);
    }
    var clb = e => {
      callback(e);
      off.call(el, name, clb);
    }
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
        var [eventName, nameSpace = 'default'] = e.split('.');
        if (eventName in el.handlers
        && nameSpace in el.handlers[eventName]
        && el.handlers[eventName][nameSpace].length > 0
        ) {
          el.handlers[eventName][nameSpace].forEach(function (handler) {
            el.removeEventListener(eventName, handler, false);
          });
          el.handlers[eventName][nameSpace] = [];
        }
      });
    } else {
      // el.off(click.popup)
      var [eventName, nameSpace = 'default'] = event.split('.');
      if (eventName in el.handlers
        && nameSpace in el.handlers[eventName]
        && el.handlers[eventName][nameSpace].length > 0
        ) {
        el.handlers[eventName][nameSpace].forEach(function (handler) {
          el.removeEventListener(eventName, handler, false);
        });
        el.handlers[eventName][nameSpace] = [];
      }
    }
  } else {
    // el.off()
    keys(el.handlers).forEach(function (eventName2) {
      keys(el.handlers[eventName2]).forEach(function(nameSpace2) {
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
function filter (selector) {
  return this.querySelectorAll(selector || '☺') || [];
}

/* Traverse DOM from event target up to parent, searching for selector */
function passedThrough(event, selector, stopAt) {
  var currentNode = event.target;
  while(true) {
    if (currentNode === null) {
      return false;
    } else if (currentNode.matches(selector)) {
      return currentNode;
    } else if(currentNode !== stopAt && currentNode !== body) {
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

function onAll (name, callback, context) {
  this.forEach(node => {on.call(node, name, callback, context); });
  return this;
}
function onceAll (name, callback, context) {
  this.forEach(node => {once.call(node, name, callback, context); });
  return this;
}
function offAll (event, fn) {
  this.forEach(node => { off.call(node, event, fn); });
  return this;
}
function triggerAll (type, _data) {
  this.forEach(node => {trigger.call(node, type, _data); });
  return this;
}
function findAll(selector) {
  if (typeof selector === 'function') {
    return Ap.find.call(this, selector);
  }
  this.forEach(node => {
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
  var result = [];
  var r;
  this.forEach(node => {
    r = node.filter(selector);
    if (r) {
      result.push(r);
    }
  });
  return result.length ? result : [];
}
function matchesAll (selector) {
  return this.every(node => node.matches(selector));
}


function outerHeight(withMargins) {
  var el = this;
  if (el) {
    var _height = el.offsetHeight;
    if (withMargins) {
      var style = window.getComputedStyle(el, null);
      _height += parseInt(style.marginTop) + parseInt(style.marginBottom, 10);
    }
    return _height;
  }
}
function outerWidth(withMargins) {
  var _width = this.offsetWidth;
  if (withMargins) {
    var style = window.getComputedStyle(this, null);
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
    top: box.top + window.pageYOffset - root.clientTop,
    left: box.left + window.pageXOffset - root.clientLeft
  };
}
function height(value) {
  if (isset(value)) {
    value = parseInt(value);
    this.style.height = value + 'px';
    return value;
  } else {
    return parseInt(window.getComputedStyle(this, null).height);
  }
}
function width(value) {
  if (isset(value)) {
    value = parseInt(value);
    this.style.width = value + 'px';
    return value;
  } else {
    return parseInt(window.getComputedStyle(this, null).width);
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
      _filterFn = function (node, k) {
        return k === _filter;
      };
    } else {
      _filterFn = function (node) {
        return node.matches(_filter);
      };
    }

    var _parent = el;
    var ii = 1;
    while ((_parent = _parent.parentElement)) {
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
function parentAll(_filter) {
  if (isset(_filter)) {
    var _filterFn;
    if (isNumber(_filter)) {
      _filterFn = function (node, iii) {
        return iii === _filter;
      };
    } else {
      _filterFn = function (node) {
        return node.matches(_filter);
      };
    }

    var _parent = this;
    var ii = 1;
    var _result = [];
    while ((_parent = _parent.parentElement)) {
      if (_filterFn(_parent, ii)) {
        _result.push(_parent);
      }
      ii++;
    }
    return _result;
  } else {
    var __parent = this;
    var __result = [];
    while ((__parent = __parent.parentElement)) {
      __result.push(__parent);
    }
    return __result;
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
    while ((_prev = _prev.previousElementSibling)) {
      if (_prev.matches(_filter)) {
        return _prev;
      }
    }
    return false;
  } else {
    return this.previousElementSibling;
  }
}
function prevAll(_filter) {
  if (isset(_filter)) {
    var _prev = this;
    var __result = [];
    while ((_prev = _prev.previousElementSibling)) {
      if (_prev.matches(_filter)) {
        __result.push(_prev);
      }
    }
    return __result;
  } else {
    var __prev = this;
    var _result = [];
    while ((__prev = __prev.previousElementSibling)) {
      _result.push(__prev);
    }
    return _result;
  }
}
function next(filter) {
  if (isset(filter)) {
    var _next = this;
    while ((_next = _next.nextElementSibling)) {
      if (_next.matches(filter)) {
        return _next;
      }
    }
    return false;
  } else {
    return this.nextElementSibling;
  }
}
function nextAll(_filter) {
  if (isset(_filter)) {
    var _next = this;
    var __result = [];
    while ((_next = _next.nextElementSibling)) {
      if (_next.matches(_filter)) {
        __result.push(_next);
      }
    }
    return __result;
  } else {
    var __next = this;
    var _result = [];
    while ((__next = __next.nextElementSibling)) {
      _result.push(__next);
    }
    return _result;
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
    (matches = parentNode && parentNode.matches) &&
    !parentNode.matches(selector)
  ) {
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
function replaceWith(html) {
  var parentNode = this.parentNode;
  if (parentNode) {
    if (isString(html)) {
      this.outerHTML = html;
    } else if (isNode(html)) {
      parentNode.replaceChild(html, this);
    } else {
      console.error('unsuported input type in replaceWith', typeof html, html);
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
      return window.getComputedStyle(el, null)[camelCase(ruleName)];
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

function html(string) {
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
