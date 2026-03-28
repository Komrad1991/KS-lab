import {GLOBAL_TINI} from '@tinijs/core';

if (!GLOBAL_TINI.clientApp) {
  GLOBAL_TINI.clientApp = {options: {}} as never;
}

if (typeof HTMLDialogElement !== 'undefined') {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.open = true;
    };
  }

  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close() {
      this.open = false;
    };
  }
}
