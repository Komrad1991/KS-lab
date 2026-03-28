// Directly define globals without vi.stubGlobal
globalThis.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
};

globalThis.KeyboardEvent = function(type, eventInit) {
  this.type = type;
  this.key = eventInit?.key || '';
  this.ctrlKey = eventInit?.ctrlKey || false;
  this.metaKey = eventInit?.metaKey || false;
  this.altKey = eventInit?.altKey || false;
  this.shiftKey = eventInit?.shiftKey || false;
  this.preventDefault = () => {};
};