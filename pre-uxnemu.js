function flatPromise() {
  let resolve;
  let reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

const { resolve, promise } = flatPromise();
window.allReady = promise;

const ROM_PATH = '/input.rom';

const dispatch = (text, exit, err, module) => {
  const data = {
    module: module || 'emu',
    message: text,
    exit,
    err,
  };
  const event = new CustomEvent('uxn', { detail: data });
  window.parent.document.dispatchEvent(event);
};
// absolute minimum definition
// eslint-disable-next-line
var Module = {
  print: (x) => dispatch(x, Module.EXITSTATUS, false),
  printErr: (x) => dispatch(x, Module.EXITSTATUS, true),
  canvas: (() => {
    const canvas = document.getElementById('canvas');

    // As a default initial behavior, pop up an alert when webgl context is lost. To make your
    // application robust, you may want to override this behavior before shipping!
    // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
    canvas.addEventListener(
      'webglcontextlost',
      (e) => {
        alert('WebGL context lost. You will need to reload the page.');
        e.preventDefault();
      },
      false,
    );

    return canvas;
  })(),
  onRuntimeInitialized: () => {
    // get the base64 encoded rom

    const b64 = window.rom;
    let rom;

    if (b64 && b64.length) {
      dispatch('Decoding rom from base64...', 0, null, 'web');
      const decoded = atob(b64);

      dispatch('Parsing rom to binary...', 0, null, 'web');
      const arr = decoded.split(',').map((s) => parseInt(s, 10));
      rom = new Uint8Array(arr);
    }

    // write out the rom from global now that FS is initialized
    if (rom !== undefined) {
      dispatch(
        'Writing rom to emulator virtual file system...',
        0,
        null,
        'web',
      );
      Module.FS.writeFile(ROM_PATH, rom);
    } else {
      dispatch('Rom not loaded yet...', 0, null, 'web');
    }

    // any info to pass back to main window if needed from promise
    resolve({});
  },
  arguments: [ROM_PATH],
};
