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

let fullscreen = false;

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

const colorWrap = (text, color) => `<span style="color: var(--color-${color})">${text}</span>`;
const errWrap = (text) => colorWrap(text, 'red');
const successWrap = (text) => colorWrap(text, 'green');
const cleanupWrap = (text) => colorWrap(text, 'orange');

const log = (text, module) => {
  module = module || 'web';
  const prefixColorByLocation = {
    emu: 'blue',
    asm: 'purple',
    web: 'yellow',
  };
  const prefixColor = prefixColorByLocation[module];
  const prefix = colorWrap(`[${module}]`, prefixColor);

  // check for error messages that we want to suppress
  const lower = text.toLowerCase();
  const doSupress = ['sigaction: signal type not supported: this is a no-op.'];
  if (doSupress.some((x) => lower.includes(x))) {
    return;
  }

  // check for common error words if uxn tools don't use exit status code
  const hasBadLookingMessage = [
    'usage',
    'failed to open source',
    'failed to assemble rom',
    // macros
    'macro duplicate',
    'macro name is hex number',
    'macro name is invalid',
    'macro too large',
    'word too long',
    // labels
    'label duplicate',
    'label name is hex number',
    'label name is invalid',
    // token
    'address is not in zero page',
    'address is too far',
    'invalid hexadecimal literal',
    'invalid hexadecimal value',
    'invalid macro',
    'invalid token',
    // pass 1
    'invalid padding',
    // 'invalid macro',
    'invalid label',
    'invalid sublabel',
    // pass 2
    'memory overwrite',
    'unknown label',

    // emu
    'init failure',
    'sdl_',
    'failed to start uxn',
    'failed to open rom',
    'failed to initialize emulator',
  ].some((x) => lower.includes(x));

  const hasCleanupLookingMessage = ['--- unused'].some((x) => lower.includes(x));
  const hasGoodLookingMessage = ['assembled', 'loaded'].some((x) => lower.includes(x));

  if (hasGoodLookingMessage) {
    text = successWrap(text);
  } else if (hasBadLookingMessage) {
    text = errWrap(text);
  } else if (hasCleanupLookingMessage) {
    text = cleanupWrap(text);
  }

  const el = document.querySelector('#console');

  el.innerHTML += `${prefix} ${dateFmt()} ${text}\n`;
};

const errFmt = (e) => {
  const err = `${e.message || '(no msg)'} : ${e.code || '(no code)'} ${
    e.errno || '(no errno)'
  }`;
  return errWrap(err);
};

const readFile = (w, path, encoding) => {
  const fs = w.Module.FS;
  try {
    const contents = fs.readFile(path, { encoding });
    return contents;
  } catch (e) {
    log(errFmt(e));
    return '';
  }
};

const writeFile = (w, path, data) => {
  try {
    const fs = w.Module.FS;
    fs.writeFile(path, data);
  } catch (e) {
    log(errFmt(e));
  }
};

const deleteFile = (w, path) => {
  try {
    const fs = w.Module.FS;
    fs.unlink(path);
  } catch (e) {
    log(errFmt(e));
  }
};

///////////////
// ASSEMBLER //
///////////////

const reloadAsm = () => {
  window.asm.location.reload();
};

const readFileAsm = (path, encoding) => {
  log(`Reading path from assembler: ${path}`);
  return readFile(window.asm, path, encoding);
};

const writeFileAsm = (path, data) => {
  log(`Writing to path from assembler: ${path}`);
  return writeFile(window.asm, path, data);
};

const deleteFileAsm = (path) => {
  log(`Deleting path from assembler: ${path}`);
  return deleteFile(window.asm, path);
};

const assemble = (data) => {
  log('Assembling...');
  writeFileAsm('temp.tal', data);

  window.asm.callMain(['temp.tal', 'output.rom']);
  deleteFileAsm('temp.tal');
  const b64 = btoa(readFileAsm('output.rom', 'binary'));

  // reload to clear global state
  log('Reloading assembler...');
  reloadAsm();
  return b64;
};

const readEditor = () => window.editor.state.doc.toString();

/////////
// URL //
/////////

//eslint-disable-next-line
const setURLParam = (param, value) => {
  // Construct URLSearchParams object instance from current URL querystring.
  const queryParams = new URLSearchParams(window.location.search);

  // Set new or modify existing parameter value.
  queryParams.set(param, value);

  // Replace current querystring with the new one.
  //eslint-disable-next-line
  history.replaceState(null, null, `?${queryParams.toString()}`);
};

const getURLParam = (param) => {
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get(param);
};

//////////////
// EMULATOR //
//////////////

const reloadEmu = () => {
  window.uxn.rom = null;
  window.uxn.location.reload();
};

const loadRom = (rom) => {
  log('Loading rom...');
  // force reload to get a clean slate
  // otherwise SDL has all these issues
  // with teardown
  reloadEmu();

  // grab the iframe again to get a new reference to the window
  // stash the rom we have here in the window so it can load it
  // after it is done initializing
  const iframe = document.querySelector('#uxnemu-iframe');
  iframe.onload = (e) => {
    e.target.contentWindow.rom = rom;
  };
};

////////////
// EDITOR //
////////////
const clearEditor = () => {
  const text = window.editor.state.doc.toString();
  window.editor.dispatch({
    changes: { from: 0, to: text.length, insert: '' },
  });
};

const populateEditor = (insert) => {
  clearEditor();
  window.editor.dispatch({
    changes: { from: 0, insert },
  });
};

//////////////
// DOM UTIL //
//////////////

const getTopMargin = () => {
  const topMarginPx = getComputedStyle(
    document.documentElement,
  ).getPropertyValue('--top-margin');
  return parseInt(topMarginPx.slice(0, -2), 10);
};

const resize = () => {
  // get the emulator height
  const el = document.querySelector('#uxnemu-iframe');
  const style = getComputedStyle(el.contentWindow.document.body) || undefined;

  if (style && style.height) {
    el.style.height = style.height;

    const consoleEl = document.querySelector('#console-wrapper');
    const topMargin = getTopMargin();
    const height = parseInt(style.height.slice(0, -2), 10);

    consoleEl.style.height = window.innerHeight - topMargin - height - 20;
  }
};

const hideNoScript = () => {
  document.querySelector('#noscript').innerHTML = '';
};

const scrollToBottom = (el) => {
  el.scrollTop = el.scrollHeight;
};

//////////////
// WORKFLOW //
//////////////

/**
 * assemble takes utf8 and produces a binary rom encoded in b64
 */

const load = (tal) => {
  populateEditor(tal);
  const rom = assemble(tal);
  loadRom(rom);
};

// eslint-disable-next-line
const loadRomByName = (romName) => {
  log(`🅻🅾🅰🅳🅸🅽🅶 ${romName}`);
  const tal = readFileAsm(`/tals/${romName}.tal`, 'utf8');
  load(tal);
};

const download = (filename, text, binary) => {
  const element = document.createElement('a');
  const encoding = binary
    ? 'application/octet-stream,'
    : 'text/plain;charset=utf-8,';
  element.setAttribute('href', `data:${encoding}${encodeURIComponent(text)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const downloadUxntal = () => {
  download(`learn-uxn.${Date.now()}.tal`, readEditor(), false);
};

// TODO: broken; always underflow
// eslint-disable-next-line
const downloadRom = () => {
  download(
    `learn-uxn.${Date.now()}.rom`,
    readFile(window.uxn, '/input.rom', 'binary'),
    true,
  );
};

const importRomHandler = () => {
  const fileList = document.querySelector('#import-rom-input').files;

  if (!fileList) {
    log(errWrap('No files in list to load...'));
    return;
  }

  const file = fileList[0];
  if (!file.size) {
    log(errWrap('File is empty...'));
    return;
  }

  const reader = new FileReader();
  reader.onload = (t) => {
    const uintArray = new Uint8Array(t.target.result);
    const b64 = btoa(uintArray);
    loadRom(b64);
  };

  log(`Loading "${file.name}"...`);
  reader.readAsArrayBuffer(file);
};

const listFilesInEmulator = () => {
  const root = window.uxn.Module.FS.root.contents;
  const toIgnore = ['tmp', 'dev', 'home', 'proc', 'input.rom'];
  return Object.keys(root).filter((x) => !toIgnore.includes(x));
};

const addFilesToIoListing = () => {
  const files = listFilesInEmulator();
  const existingListingIds = [
    ...document.querySelectorAll('#io > .dropdown-content > a'),
  ].map((x) => x.id);

  const dropdown = document.querySelector('#io > .dropdown-content');

  files.forEach((fname) => {
    if (!existingListingIds.includes(fname)) {
      const a = document.createElement('a');
      const linkText = document.createTextNode(fname);
      a.appendChild(linkText);
      a.id = fname;
      dropdown.appendChild(a);
      debugger;
      // also add event listener
      a.addEventListener('click', () => {
        download(fname, readFile(window.uxn, `/${fname}`, 'binary'), true);
      });
    }
  });
};

const assembleEditor = () => {
  const text = readEditor();
  if (!text) {
    log(errWrap('No unxtal to assemble!'));
    return;
  }
  log(`Read ${text.length} bytes from editor...`);
  const rom = assemble(text);
  loadRom(rom);
};

const reload = () => {
  log('Restarting...');
  reloadAsm();
  reloadEmu();
  document.querySelector('#console').innerHTML = '';
  load('( L E A R N  U X N )');
};

const addListeners = () => {
  // control listeners
  document.querySelector('#assemble').addEventListener('click', () => {
    log('🅰🆂🆂🅴🅼🅱🅻🅴');
    assembleEditor();
  });

  document
    .querySelector('#download-uxntal')
    .addEventListener('click', downloadUxntal);

  document.querySelector('#import-rom').addEventListener('click', () => {
    document.querySelector('#import-rom-input').click();
  });

  document
    .querySelector('#import-rom-input')
    .addEventListener('change', (e) => {
      importRomHandler(e);
    });

  document.querySelector('#new').addEventListener('click', () => {
    reload();
  });

  const about = document.querySelector('#about');
  about.addEventListener('click', () => {
    document.querySelector('#about-modal').classList.toggle('hidden');
  });

  document.querySelector('#fullscreen').addEventListener('click', () => {
    document.querySelector('#editor-wrapper').classList.toggle('hidden');
    document.querySelector('#console-wrapper').classList.toggle('hidden');

    if (fullscreen) {
      document.querySelector('#uxnemu').style.width = '50vw';
      document.querySelector('#uxnemu-iframe').style.width = '50%';
      fullscreen = false;
    } else {
      document.querySelector('#uxnemu').style.width = '100%';

      const topMargin = getTopMargin();
      const maxHeight = window.innerHeight - topMargin;
      const fullWidth = Math.min(maxHeight * 1.6, window.innerWidth);
      const iframe = document.querySelector('#uxnemu-iframe');
      iframe.style.width = `${fullWidth}px`;

      fullscreen = true;
    }
  });

  // console scroller
  const consoleEl = document.querySelector('#console'); // Create an observer and pass it a callback.
  const observer = new MutationObserver(() => {
    scrollToBottom(consoleEl); // Tell it to look for new children that will change the height.
  });
  observer.observe(consoleEl, { childList: true });

  // uxn iframe event dispatches for logging
  window.document.addEventListener(
    'uxn',
    (e) => {
      const { module, message } = e.detail;
      // normally we'd try to use the err verus normal stream
      // but uxn tools seem to write info to stderr

      // it seems uxn tools don't actually set exitstatus
      // but in case they do later...
      // let success = e.detail.exit === 0

      log(message, module);
    },
    false,
  );

  [
    document.querySelector('#uxnemu'),
    document.querySelector('#uxnemu-iframe'),
  ].forEach((x) => {
    // reset focus anytime there is a click on the uxniframe
    x.addEventListener('click', () => {
      window.uxn.document.getElementById('canvas').focus();
    });
    // or if it gets moused over
    x.addEventListener('mouseover', () => {
      window.uxn.document.getElementById('canvas').focus();
    });
  });

  const anchors = document.querySelectorAll('#roms > div > a');
  anchors.forEach((x) => {
    x.addEventListener('click', (e) => {
      loadRomByName(e.srcElement.innerHTML);
    });
  });

  // TODO: figure out whats different?
  // always gives buffer underflow
  // document
  //  .querySelector('#download-rom')
  //  .addEventListener('click', downloadRom);

  document
    .querySelector('#editor')
    .addEventListener('click', window.editor.focus);

  // add files to the io listing
  document
    .querySelector('#io')
    .addEventListener('mouseover', addFilesToIoListing);
};

//////////
// MAIN //
//////////

(async () => {
  hideNoScript();

  const uxnIframe = document.querySelector('#uxnemu-iframe');
  window.uxn = uxnIframe.contentWindow;

  const asmIframe = document.querySelector('#uxnasm-iframe');
  window.asm = asmIframe.contentWindow;

  addListeners();
  window.addEventListener('resize', resize);

  // on the iframe load
  window.onload = () => {
    // check the flat promise
    Promise.all([window.uxn.allReady, window.asm.allReady]).then(() => {
      resize();

      const rom = getURLParam('rom') || 'piano';
      loadRomByName(rom);
    });
  };

  log('🅻🅴🅰🆁🅽 🆄🆇🅽');
  resize();
  setInterval(resize, 1000);
})();
