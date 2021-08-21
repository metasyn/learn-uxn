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

// absolute minimum definition
// eslint-disable-next-line
var Module = {
  noInitialRun: true,
  onRuntimeInitialized: () => {
    resolve();
  },
};
