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
  }
};

const writeFile = (w, path, data) => {
  try {
    const fs = w.Module.FS;
    return fs.writeFile(path, data);
  } catch (e) {
    log(errFmt(e));
  }
};

const deleteFile = (w, path) => {
  try {
    const fs = w.Module.FS;
    return fs.unlink(path);
  } catch (e) {
    log(errFmt(e));
  }
};


///////////////
// ASSEMBLER //
///////////////

const reloadAsm = () => {
  window.asm.location.reload();
}

const readFileAsm = (path, encoding) => {
  log(`Reading path from assembler: ${path}`);
  return readFile(window.asm, path, encoding);
};

const writeFileAsm = (path, data) => {
  log(`Writing to path from assembler: ${path}`);
  return writeFile(window.asm, path, data);
};

const deleteFileAsm = (path ) => {
  log(`Deleting path from assembler: ${path}`);
  return deleteFile(window.asm, path);
};

const assemble = (data) => {
  log('Assembling...');
  writeFileAsm('temp.tal', data);

  window.asm.callMain(['temp.tal', 'output.rom']);
  deleteFileAsm("temp.tal");
  const b64 = btoa(readFileAsm('output.rom', 'binary'));

  // reload to clear global state
  log('Reloading assembler...');
  reloadAsm()
  return b64;
};


const readEditor = () => {
  return window.editor.state.doc.toString();
  const { children, texts } = window.editor.state.doc;
  if (!children && !texts) {
    return null;
  }
  const chunks = children ? children.map((x) => { return x.text }) : texts;

  const lines = chunks.map((x) => {
    if (x) {
      return x.join('\n')
    } else {
      return ''
    }
  });
  const text = lines.join('\n');
  return text;
}

const assembleEditor = () => {
  let text = readEditor();
  if (!text) {
    log(errWrap("No unxtal to assemble!"))
    return;
  }
  log(`Read ${text.length} bytes from editor...`);
  let rom = assemble(text);
  loadRom(rom);
};

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
}


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
  let text = window.editor.state.doc.toString()
  window.editor.dispatch({
    changes: { from: 0, to: text.length, insert: ""},
  });
}

const populateEditor = (insert) => {
  clearEditor()
  window.editor.dispatch({
    changes: { from: 0, insert },
  });
};

//////////////
// DOM UTIL //
//////////////

const resize = () => {
  // get the emulator height
  const el = document.querySelector('#uxnemu-iframe');
  const style = getComputedStyle(el.contentWindow.document.body);

  if (style.height) {
    el.style.height = style.height;

    const consoleEl = document.querySelector('#console-wrap');
    const topMarginPx = getComputedStyle(
      document.documentElement,
    ).getPropertyValue('--top-margin');

    const topMargin = parseInt(topMarginPx.slice(0, -2), 10);
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

let download = (filename, text, binary) => {
  var element = document.createElement('a');
  let encoding = binary ? 'application/octet-stream,' : 'text/plain;charset=utf-8,';
  element.setAttribute('href', `data:${encoding}${encodeURIComponent(text)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

let downloadUxntal = () => {
  download("learn-uxn." + Date.now() + ".tal", readEditor(), false);
}

let downloadRom = () => {
  download("learn-uxn." + Date.now() + ".rom", readFile(window.uxn, "/input.rom", 'binary'), true);
}

const addListeners = () => {
  // control listeners
  document.querySelector('#assemble').addEventListener('click', () => {
    log('🅰🆂🆂🅴🅼🅱🅻🅴');
    assembleEditor();
  });

  document.querySelector('#export').addEventListener('click', () => {
    log('🅴🆇🅿🅾🆁🆃');
  });

  document.querySelector('#new').addEventListener('click', () => {
    reload();
  });

  const about = document.querySelector('#about');
  about.addEventListener('click', () => {
    document.querySelector("#about-modal").classList.toggle("hidden");
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

  let anchors = document.querySelectorAll('#roms > div > a')
  anchors.forEach((x) => {
    x.addEventListener('click', (e) => {
      loadRomByName(e.srcElement.innerHTML);
    });
  });

  // TODO: figure out whats different
  // document.querySelector("#download-rom").addEventListener('click', downloadRom);
  document.querySelector("#download-uxntal").addEventListener('click', downloadUxntal);

  document.querySelector('#editor').addEventListener('click', () => {
    window.editor.focus();
  });
};

const reload = () => {
  log("Restarting...")
  reloadAsm();
  reloadEmu();
  document.querySelector('#console').innerHTML = '';
  populateEditor("( L E A R N  U X N )");
}

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
