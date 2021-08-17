const urlParams = new URLSearchParams(window.location.search);
const rom= urlParams.get('rom');
Module.arguments = [`/roms/${rom}.rom`];

