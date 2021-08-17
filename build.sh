#!/usr/bin/env bash

end="\033[0m"
green="\033[0;32m"
blue="\033[0;36m"
purple="\033[0;35m"
red="\033[0;31m"

function green {
    echo
    echo -e "${green}${1}${end}"
}

function blue {
    echo
    echo -e "${blue}${1}${end}"
}

function purple {
    echo
    echo -e "${purple}${1}${end}"
}

function red {
    echo
    echo -e "${red}${1}${end}"
}


purple "
 ▄█          ▄████████    ▄████████    ▄████████ ███▄▄▄▄        ███    █▄  ▀████    ▐████▀ ███▄▄▄▄
███         ███    ███   ███    ███   ███    ███ ███▀▀▀██▄      ███    ███   ███▌   ████▀  ███▀▀▀██▄
███         ███    █▀    ███    ███   ███    ███ ███   ███      ███    ███    ███  ▐███    ███   ███
███        ▄███▄▄▄       ███    ███  ▄███▄▄▄▄██▀ ███   ███      ███    ███    ▀███▄███▀    ███   ███
███       ▀▀███▀▀▀     ▀███████████ ▀▀███▀▀▀▀▀   ███   ███      ███    ███    ████▀██▄     ███   ███
███         ███    █▄    ███    ███ ▀███████████ ███   ███      ███    ███   ▐███  ▀███    ███   ███
███▌    ▄   ███    ███   ███    ███   ███    ███ ███   ███      ███    ███  ▄███     ███▄  ███   ███
█████▄▄██   ██████████   ███    █▀    ███    ███  ▀█   █▀       ████████▀  ████       ███▄  ▀█   █▀
▀                                     ███    ███
"

function setup_emsdk() {
    blue "Setting up emscripten..."
    # https://emscripten.org/docs/getting_started/downloads.html#installation-instructions-using-the-emsdk-recommended
    if [[ ( ! -d "emsdk" ) ]]; then
        git clone https://github.com/emscripten-core/emsdk.git
        emsdk/emsdk install latest
    fi;

    emsdk/emsdk activate latest
    # Activate PATH and other environment variables in the current terminal
    source emsdk/emsdk_env.sh

    blue "Checking emcc..."
    command -v emcc > /dev/null || ( red "Failed setting up emscripten..." && exit 1 )
    green "\tDone!"
}

function setup_uxn() {
    blue "Setting up uxn..."
    if [[ ! -d "uxn" ]]; then
        git clone https://git.sr.ht/~metasyn/uxn
    fi;

    if [[  ! -f "uxn/bin/piano.rom" ]]; then
        pushd uxn
        ./build.sh
        popd
    fi;
    green "\tDone!"
}

function build_uxn_emscripten() {
    rm -rf roms
    mkdir -p roms
    for file in $(ls uxn/projects/examples/demos/*.tal); do
        blue "Compiling $file..."
        name=$(basename $file .tal)
        ./uxn/bin/uxnasm $file roms/$name.rom
        cp $file roms
    done;


    blue "Building UXN for emscripten..."
    EMCC_DEBUG=1 emcc \
        -s USE_SDL=2 \
        -s USE_SDL_MIXER=2 \
        -s WASM=1 \
        -s ASYNCIFY \
        -s ENVIRONMENT=web \
        -s EXPORTED_FUNCTIONS='["_main"]' \
        -s EXPORTED_RUNTIME_METHODS='["cwrap"]'\
        -O3 \
        --extern-pre-js pre.js \
        --preload-file roms \
        --shell-file shell.html \
        -o build/index.html \
            uxn/src/uxn.c \
            uxn/src/devices/ppu.c \
            uxn/src/devices/apu.c \
            uxn/src/uxnemu.c \
            uxnemscripten.c
}


function copy_static () {
    cp learn-uxn.js build
}


PARAMS=""
while (( "$#" )); do
  case "$1" in
    -c|--clean)
      CLEAN=1
      shift
      ;;
    -*|--*=) # unsupported flags
      echo "Error: Unsupported flag $1" >&2
      exit 1
      ;;
    *) # preserve positional arguments
      PARAMS="$PARAMS $1"
      shift
      ;;
  esac
done

# set positional arguments in their proper place
eval set -- "$PARAMS"


# Main!

if [[ -n ${CLEAN} ]]; then
    red "Cleaning..."
    rm -rf emsdk
    rm -rf uxn
fi;

rm -rf build
mkdir -p build

setup_emsdk
setup_uxn
build_uxn_emscripten
copy_static

green "Finished!"
