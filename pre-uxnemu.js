// if in an iframe, the focus gets lost somehow
// and this was needed to ensure the keyboard works with the SDL
// setInterval(() => window.focus(), 500);

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

// get url params
const urlParams = new URLSearchParams(window.location.search);

// get the base64 encoded rom
const b64 = urlParams.get('rom');
let rom;

if (b64 && b64.length) {
  const decoded = atob(b64);

  // parse the bytes
  const arr = decoded.split(',').map((s) => parseInt(s, 10));

  // make them a nice array for emscripten
  rom = new Uint8Array(arr);
}

// write them here
const ROM_PATH = '/roms/input.rom';

// absolute minimum definition
// eslint-disable-next-line
var Module = {
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
    // write out the rom from global now that FS is initialized
    if (rom !== undefined) {
      Module.FS.writeFile(ROM_PATH, rom);
    }

    // any info to pass back to main window if needed from promise
    resolve({});
  },
  noInitialRun: rom === undefined,
  arguments: [ROM_PATH],
};
