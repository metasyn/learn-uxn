const urlParams = new URLSearchParams(window.location.search);

var rom = urlParams.get('rom');

if (!rom || rom.length == 0) {
    rom = "piano"
}

Module.arguments = [`/roms/${rom}.rom`];

