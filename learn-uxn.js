///////////
// UTILS //
///////////

let loadNav = () => {
  var hamburger = {
    navToggle: document.querySelector(".nav-toggle"),
    nav: document.querySelector("nav"),
    doToggle: function (e) {
      e.preventDefault();
      this.navToggle.classList.toggle("expanded");
      this.nav.classList.toggle("expanded");
    },
  };

  hamburger.navToggle.addEventListener("click", function (e) {
    hamburger.doToggle(e);
  });
};

let loadRom = (rom) => {
  let original = window.location.href.split("?")[0];
  let url = original + "?rom=" + rom;
  console.log("loading: " + url);
  window.location.replace(url);
};

/**
 * Loads the tal source using the ?rom= query param
 */
let loadTal = () => {
    let urlParams = new URLSearchParams(window.location.search);
    let rom = urlParams.get('rom');
    if (!rom || rom.length == 0) {
        rom = "piano";
    }
    let contents = "\n" + FS.readFile(`/roms/${rom}.tal`, {encoding: 'utf8'})

    let el = document.getElementById('tal-contents')

    commentRegex = /\((.+?)\)/gms
    parsed = contents.replace(commentRegex, '<span class="comment">($1)</span>');

    let labelRegex = /(@.+?)(\s)/g
    parsed = parsed.replace(labelRegex, '<span class="rune-label">$1</span>$2');

    let sublabelRegex = /(&.+?)(\s)/g
    parsed = parsed.replace(sublabelRegex, '<span class="rune-sublabel">$1</span>$2');

    let hexLiteral = /(#.+?)(\s)/g
    parsed = parsed.replace(hexLiteral, '<span class="rune-hexliteral">$1</span>$2');

    let makeOpCodeRegex = (ops) => {
        let regex = "("
        let temp = [];
        ops.forEach((x) => {
            temp.push(`${x}2kr`)
            temp.push(`${x}2r`)
            temp.push(`${x}2k`)
            temp.push(`${x}2`)
            temp.push(`${x}k`)
            temp.push(`${x}r`)
            temp.push(x)
        });
        regex  += temp.join("|")
        regex += ")"
        return new RegExp(regex, "g");
    }

    let stackOpCodes = [
        "BRK",
        "LIT",
        "POP",
        "DUP",
        "NIP",
        "SWP",
        "OVR",
        "ROT"
    ]
    parsed = parsed.replaceAll(makeOpCodeRegex(stackOpCodes), '<span class="stack-opcode" data-opcode="$1">$1</span>');

    let logicOpCodes = [
        "EQU",
        "NEQ",
        "GTH",
        "LTH",
        "JMP",
        "JCN",
        "JSR",
        "STH"
    ]
    parsed = parsed.replaceAll(makeOpCodeRegex(logicOpCodes), '<span class="logic-opcode" data-opcode="$1">$1</span>');

    let memoryOpCodes = [
        "LDZ",
        "STZ",
        "LDR",
        "STR",
        "LDA",
        "STA",
        "DEI",
        "DEO",
    ]

    parsed = parsed.replaceAll(makeOpCodeRegex(memoryOpCodes), '<span class="memory-opcode" data-opcode="$1">$1</span>');

    let arithmeticOpCodes = [
        "ADD",
        "SUB",
        "MUL",
        "DIV",
        "AND",
        "ORA",
        "EOR",
        "SFT",
    ]

    parsed = parsed.replaceAll(makeOpCodeRegex(arithmeticOpCodes), '<span class="arithmetic-opcode" data-opcode="$1">$1</span>');

    el.innerHTML = parsed;
}

let loadRomButtons = () => {
  document.querySelectorAll("button").forEach((button) =>
    button.addEventListener("click", (e) => {
      let rom = button.getAttribute("data-rom");
      loadRom(rom);
    })
  );
};


let assemble = (inputText) => {
    return uxnasm().then((x) => {
        // read from the "main" module
        x.FS.writeFile("/input", inputText)

        // call the assembler main
        x.callMain(["/input", "/output"])

        // read from the assembler file system
        output = x.FS.readFile("/output") 

        return output;
    })
}



///////////
// MAIN //
//////////

var statusElement = document.getElementById("status");
var progressElement = document.getElementById("progress");
var spinnerElement = document.getElementById("spinner");

var Module = {
  preRun: [
      // function() {}
  ],
  postRun: [],
  print: (function () {
    var element = document.getElementById("output");
    if (element) element.value = ""; // clear browser cache
    return function (text) {
      if (arguments.length > 1)
        text = Array.prototype.slice.call(arguments).join(" ");
      // These replacements are necessary if you render to raw HTML
      //text = text.replace(/&/g, "&amp;");
      //text = text.replace(/</g, "&lt;");
      //text = text.replace(/>/g, "&gt;");
      //text = text.replace('\n', '<br>', 'g');
      console.log(text);
      if (element) {
        element.value += text + "\n";
        element.scrollTop = element.scrollHeight; // focus on bottom
      }
    };
  })(),
  printErr: function (text) {
    if (arguments.length > 1)
      text = Array.prototype.slice.call(arguments).join(" ");
    console.error(text);
  },
  canvas: (function () {
    var canvas = document.getElementById("canvas");

    // As a default initial behavior, pop up an alert when webgl context is lost. To make your
    // application robust, you may want to override this behavior before shipping!
    // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
    canvas.addEventListener(
      "webglcontextlost",
      function (e) {
        alert("WebGL context lost. You will need to reload the page.");
        e.preventDefault();
      },
      false
    );

    return canvas;
  })(),
  setStatus: function (text) {
    if (!Module.setStatus.last)
      Module.setStatus.last = { time: Date.now(), text: "" };
    if (text === Module.setStatus.last.text) return;
    var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
    var now = Date.now();
    if (m && now - Module.setStatus.last.time < 30) return; // if this is a progress update, skip it if too soon
    Module.setStatus.last.time = now;
    Module.setStatus.last.text = text;
    if (m) {
      text = m[1];
      progressElement.value = parseInt(m[2]) * 100;
      progressElement.max = parseInt(m[4]) * 100;
      progressElement.hidden = false;
      spinnerElement.hidden = false;
      statusElement.classList.remove("hidden");
    } else {
      progressElement.value = null;
      progressElement.max = null;
      progressElement.hidden = true;
      if (!text) spinnerElement.hidden = true;
      if (!text) statusElement.classList.add("hidden");
    }
    statusElement.innerHTML = text;
  },
  totalDependencies: 0,
  monitorRunDependencies: function (left) {
    this.totalDependencies = Math.max(this.totalDependencies, left);
    Module.setStatus(
      left
        ? "Preparing... (" +
            (this.totalDependencies - left) +
            "/" +
            this.totalDependencies +
            ")"
        : "All downloads complete."
    );
  },
  onRuntimeInitialized: function() {
    Module.setStatus("Downloading...");
    loadNav();
    loadRomButtons();
    loadTal();
  },
};

window.onerror = function () {
  Module.setStatus("Exception thrown, see JavaScript console");
  spinnerElement.style.display = "none";
  statusElement.classList.remove("hidden");
  Module.setStatus = function (text) {
    if (text) Module.printErr("[post-exception status] " + text);
  };
};
