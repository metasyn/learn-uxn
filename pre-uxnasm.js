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

const dispatch = (text, exit, err) => {
  const data = {
    module: 'asm',
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
  noInitialRun: true,
  onRuntimeInitialized: () => {
    resolve();
  },
};
