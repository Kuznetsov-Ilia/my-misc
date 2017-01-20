var body = document.body;
var html = document.documentElement;
var _console = console || {log: noop, warn: noop, debug: noop, error: noop, table: noop};
var _window = self || window;
var head = document.head || document.getElementsByTagName('head')[0];
var process = {};
export {
  _window as window,
  _console as console,
  body,
  head,
  document,
  navigator,
  location,
  html,
  process
};
export default _window;

function noop (){}
