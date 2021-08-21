////////////
// EXTERN //
////////////

// eslint-disable-next-line
var CodeMirror;

// eslint-disable-next-line
var uxnasm;

////////
// IO //
////////
//
const dateFmt = () => {
  function toString(number, padLength) {
    return number.toString().padStart(padLength, '0');
  }

  const date = new Date();

  const fmt = `${toString(date.getHours(), 2)}:${toString(
    date.getMinutes(),
    2,
  )}:${toString(date.getSeconds(), 2)}.${toString(date.getMilliseconds(), 3)}`;
  return fmt;
};

const log = (text, success, location) => {
  let color;

  if (success === true) {
    color = 4;
  } else if (success === false) {
    color = 1;
  }

  if (color) {
    text = `<span style="color: var(--color-${color})">${text}</span>`;
  }

  let prefixColor;
  if (location === 'emu') {
    prefixColor = 6;
  } else if (location === 'asm') {
    prefixColor = 7;
  } else {
    prefixColor = 3;
  }

  location = location || 'web';

  const prefix = `<span style="color: var(--color-${prefixColor}">[${location}]</span>`;

  const el = document.getElementById('console');

  el.innerHTML += `${prefix} ${dateFmt()} ${text}\n`;
};

const errFmt = (e) => {
  const err = `${e.message || '(no msg)'} : ${e.code || '(no code)'} ${
    e.errno || '(no errno)'
  }`;
  return err;
};

const readFile = (w, path, encoding) => {
  const fs = w.Module.FS;
  try {
    const contents = fs.readFile(path, { encoding });
    return contents;
  } catch (e) {
    log(errFmt(e), false);
    throw e;
  }
};

const writeFile = (w, path, data) => {
  try {
    const fs = w.Module.FS;
    return fs.writeFile(path, data);
  } catch (e) {
    log(errFmt(e), false);
    throw e;
  }
};

///////////////
// ASSEMBLER //
///////////////

const readFileAsm = (path, encoding) => {
  log(`Reading path from assembler: ${path}`);
  return readFile(window.asm, path, encoding);
};

const writeFileAsm = (path, data) => {
  log(`Writing to path from assembler: ${path}`);
  return writeFile(window.asm, path, data);
};

const assemble = (data) => {
  log('Assembling...');
  writeFileAsm('temp.tal', data);

  window.asm.callMain(['temp.tal', 'output.rom']);
  const b64 = btoa(readFileAsm('output.rom', 'binary'));

  // reload to clear global state
  log('Reloading assembler...');
  window.asm.location.reload();
  return b64;
};

const assembleEditor = () => {
  // chunk are just big groups of text
  const { children } = window.editor.state.doc;
  if (!children) {
    log('No uxntal to assemble!', false);
    return;
  }
  const chunks = children.map((x) => x.text);
  const lines = chunks.map((x) => x.join('\n'));
  const text = lines.join('\n');
  assemble(text);
};

/////////
// URL //
/////////

const setURLParam = (param, value) => {
  // Construct URLSearchParams object instance from current URL querystring.
  const queryParams = new URLSearchParams(window.location.search);

  // Set new or modify existing parameter value.
  queryParams.set(param, value);

  // Replace current querystring with the new one.
  history.replaceState(null, null, `?${queryParams.toString()}`);
};

const getURLParam = (param) => {
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get(param);
};

//////////////
// EMULATOR //
//////////////

const loadRom = (rom) => {
  log('Loading rom...');
  const original = window.uxn.location.href.split('?')[0];
  const url = `${original}?rom=${rom}`;
  window.uxn.location.replace(url);
};

////////////
// EDITOR //
////////////

const populateEditor = (insert) => {
  window.editor.dispatch({
    changes: { from: 0, insert },
  });
};

//////////////
// WORKFLOW //
//////////////

/**
 * assemble takes utf8 and produces a binary rom encoded in b64
 */

const load = (tal) => {
  populateEditor(tal);
  setURLParam('tal', btoa(tal));
  const rom = assemble(tal);
  loadRom(rom);
};

// eslint-disable-next-line
const loadRomByName = (romName) => {
  const tal = readFileAsm(`/tals/${romName}.tal`, 'utf8');
  load(tal);
};

// eslint-disable-next-line
const reload = () => {
  window.uxn.location.reload();
};

const addListeners = () => {
  document.getElementById('assemble').addEventListener('click', () => {
    assembleEditor();
  });

  document.getElementById('save').addEventListener('click', () => {
    log('todo', true);
  });

  window.document.addEventListener(
    'uxn',
    (e) => {
      const { module, message, err } = e.detail;
      log(message, err, module);
    },
    false,
  );
};

//////////////
// DOM UTIL //
//////////////

const resize = (el) => {
  // get the emulator height
  const height = el.contentWindow.document.getElementById('canvas').clientHeight;
  const newHeight = height + 25;
  el.style.height = `${newHeight}px`;
};

(async () => {
  const uxnIframe = document.getElementById('uxnemu-iframe');
  window.uxn = uxnIframe.contentWindow;

  const asmIframe = document.getElementById('uxnasm-iframe');
  window.asm = asmIframe.contentWindow;

  addListeners();

  // on the iframe load
  window.onload = () => {
    // check the flat promise
    Promise.all([window.uxn.allReady, window.asm.allReady]).then(() => {
      resize(uxnIframe);

      const initTal = getURLParam('tal');
      if (initTal) {
        load(atob(initTal));
      } else {
        loadRomByName('piano');
      }
    });
    resize(uxnIframe);
  };

  window.addEventListener('resize', () => {
    resize(uxnIframe);
  });
})();
