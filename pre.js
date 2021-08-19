// if in an iframe, the focus gets lost somehow
// and this was needed to ensure the keyboard works with the SDL
setInterval(() => window.focus(), 500);

// absolute minimum definition
var Module = {
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
}

const urlParams = new URLSearchParams(window.location.search);

var rom = urlParams.get('rom');

if (!rom || rom.length == 0) {
    rom = "piano"
}

Module.arguments = [`/roms/${rom}.rom`];

