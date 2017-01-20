'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var jsdom = require('jsdom');
var process = _interopDefault(require('process'));

var document = jsdom.jsdom('<html><body></body></html>');
var d = document;
exports.window = document.defaultView;
exports.body = document.body;
var navigator = {};
var location = {};
var html = {};
var window$1 = exports.window;
function set(vals){
  if (vals.window) {
    exports.window = vals.window;
  }
  if (vals.body) {
    exports.body = vals.body;
  }
  if (vals.document) {
    document = vals.document;
  }
}

exports['default'] = window$1;
exports.console = console;
exports.document = d;
exports.navigator = navigator;
exports.location = location;
exports.html = html;
exports.process = process;
exports.set = set;