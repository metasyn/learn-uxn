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
const readFile = (w, path, encoding) => {
  const fs = w.Module.FS;
  const contents = fs.readFile(path, { encoding });
  return contents;
};

const writeFile = (w, path, data) => {
  const fs = w.Module.FS;
  return fs.writeFile(path, data);
};

///////////////
// ASSEMBLER //
///////////////

const readFileAsm = (path, encoding) => {
  console.log(`Reading path from assembler: ${path}`);
  return readFile(window.asm, path, encoding);
};

const writeFileAsm = (path, data) => {
  console.log(`Writing to path from assembler: ${path}`);
  return writeFile(window.asm, path, data);
};

const assemble = (data) => {
  console.log('Assembling...');
  console.log(data);
  writeFileAsm('temp.tal', data);

  window.asm.callMain(['temp.tal', 'output.rom']);
  const b64 = btoa(readFileAsm('output.rom', 'binary'));

  // reload to clear global state
  window.asm.location.reload();
  return b64;
};

const assembleEditor = () => {
  const content = window.editor.getValue();
  assemble(content);
};

//////////////
// EMULATOR //
//////////////

const loadRom = (rom) => {
  console.log('Loading rom...');
  const original = window.uxn.location.href.split('?')[0];
  const url = `${original}?rom=${rom}`;
  // file doesn't exist yet to load...
  window.uxn.location.replace(url);
};

////////////
// EDITOR //
////////////

const syntaxHighlightTal = (contents) => {
  const commentRegex = /\((.+?)\)/gms;
  let parsed = contents.replace(
    commentRegex,
    '<span class="comment">($1)</span>',
  );

  const labelRegex = /(@.+?)(\s)/g;
  parsed = parsed.replace(labelRegex, '<span class="rune-label">$1</span>$2');

  const sublabelRegex = /(&.+?)(\s)/g;
  parsed = parsed.replace(
    sublabelRegex,
    '<span class="rune-sublabel">$1</span>$2',
  );

  const hexLiteral = /(#.+?)(\s)/g;
  parsed = parsed.replace(
    hexLiteral,
    '<span class="rune-hexliteral">$1</span>$2',
  );

  const makeOpCodeRegex = (ops) => {
    let regex = '(';
    const temp = [];
    ops.forEach((x) => {
      temp.push(`${x}2kr`);
      temp.push(`${x}2r`);
      temp.push(`${x}2k`);
      temp.push(`${x}2`);
      temp.push(`${x}k`);
      temp.push(`${x}r`);
      temp.push(x);
    });
    regex += temp.join('|');
    regex += ')';
    return new RegExp(regex, 'g');
  };

  const stackOpCodes = ['BRK', 'LIT', 'POP', 'DUP', 'NIP', 'SWP', 'OVR', 'ROT'];
  parsed = parsed.replaceAll(
    makeOpCodeRegex(stackOpCodes),
    '<span class="stack-opcode" data-opcode="$1">$1</span>',
  );

  const logicOpCodes = ['EQU', 'NEQ', 'GTH', 'LTH', 'JMP', 'JCN', 'JSR', 'STH'];
  parsed = parsed.replaceAll(
    makeOpCodeRegex(logicOpCodes),
    '<span class="logic-opcode" data-opcode="$1">$1</span>',
  );

  const memoryOpCodes = [
    'LDZ',
    'STZ',
    'LDR',
    'STR',
    'LDA',
    'STA',
    'DEI',
    'DEO',
  ];

  parsed = parsed.replaceAll(
    makeOpCodeRegex(memoryOpCodes),
    '<span class="memory-opcode" data-opcode="$1">$1</span>',
  );

  const arithmeticOpCodes = [
    'ADD',
    'SUB',
    'MUL',
    'DIV',
    'AND',
    'ORA',
    'EOR',
    'SFT',
  ];

  parsed = parsed.replaceAll(
    makeOpCodeRegex(arithmeticOpCodes),
    '<span class="arithmetic-opcode" data-opcode="$1">$1</span>',
  );

  return parsed;
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
  const rom = assemble(tal);
  loadRom(rom);
};

const loadRomButton = (romName) => {
  const tal = readFileAsm(`/tals/${romName}.tal`, 'utf8');
  load(tal);
};

// eslint-disable-next-line
const reload = () => {
  window.uxn.location.reload();
};

//////////////
// DOM UTIL //
//////////////

const resizeIframe = (el) => {
  el.style.height = el.contentWindow.document.getElementById('canvas').clientHeight + 25;
};

// listener related
const addNavListeners = () => {
  const hamburger = {
    navToggle: document.querySelector('.nav-toggle'),
    nav: document.querySelector('nav'),
    doToggle(e) {
      e.preventDefault();
      this.navToggle.classList.toggle('expanded');
      this.nav.classList.toggle('expanded');
    },
  };

  hamburger.navToggle.addEventListener('click', (e) => {
    hamburger.doToggle(e);
  });
};

const addRomButtonListeners = () => {
  document.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
    const romName = button.getAttribute('data-rom');
    loadRomButton(romName);
  }));
};

(async () => {
  addNavListeners();
  addRomButtonListeners();

  const uxnIframe = document.getElementById('uxnemu-iframe');
  window.uxn = uxnIframe.contentWindow;

  const asmIframe = document.getElementById('uxnasm-iframe');
  window.asm = asmIframe.contentWindow;

  // on the iframe load
  window.asm.onload = (w) => {
    // check the flat promise
    w.currentTarget.allReady.then(() => {});
  };

  window.addEventListener('resize', () => {
    resizeIframe(uxnIframe);
  });
})();
