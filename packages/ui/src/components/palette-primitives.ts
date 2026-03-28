import {registerComponents} from '@tinijs/core';

import DialogBase from '../../ui/components/dialog.js';
import InputBase from '../../ui/components/input.js';
import SpinnerBase from '../../ui/components/spinner.js';

export class PaletteInputComponent extends InputBase {
  static override readonly componentName = 'input';
  static override readonly defaultTagName = 'tini-input';
}

export class PaletteDialogComponent extends DialogBase {
  static override readonly componentName = 'dialog';
  static override readonly defaultTagName = 'tini-dialog';
}

export class PaletteSpinnerComponent extends SpinnerBase {
  static override readonly componentName = 'spinner';
  static override readonly defaultTagName = 'tini-spinner';
}

let primitivesRegistered = false;

export function ensurePalettePrimitivesRegistered(): void {
  if (primitivesRegistered || typeof customElements === 'undefined') {
    return;
  }

  registerComponents([
    PaletteInputComponent,
    PaletteDialogComponent,
    PaletteSpinnerComponent,
  ]);
  primitivesRegistered = true;
}
