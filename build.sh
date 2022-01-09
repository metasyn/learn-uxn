#!/usr/bin/env bash
set -euo pipefail

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
        git clone https://git.sr.ht/~rabbits/uxn
    fi;

    if ! grep -q 'emscripten_sleep' uxn/src/uxnemu.c; then
        sed -i -e '1s/^/#include <emscripten.h>\n/;/SDL_Delay/s/^/emscripten_sleep(10);\n/' uxn/src/uxnemu.c
    fi

    green "\tDone!"
}

function inject_uxn_commit() {
    uxn_commit=$(cd uxn && git rev-parse HEAD);
    blue "Setting commit to $uxn_commit";
    sed -i -e "s/__UXN_COMMIT__/${uxn_commit}/g" docs/index.html
}

function inject_date() {
    blue "Setting date to $(date)";
    sed -i -e "s/__DATE__/$(date)/g" docs/index.html
}

function copy_docs() {
	rm -rf docs
	cp -r site docs
}

function build_uxn_emscripten() {
    rm -rf tals
    mkdir -p tals

    for file in $(ls uxn/projects/examples/demos/*.tal); do
        cp "$file" tals
    done;

    for file in $(ls uxn/projects/examples/devices/*.tal); do
        cp "$file" tals
    done;

    for file in $(ls uxn/projects/examples/gui/*.tal); do
        cp "$file" tals
    done;

    cp uxn/projects/software/neralie.tal tals/neralie.tal
    cp uxn/projects/software/calc.tal tals/calc.tal
    cp uxn/projects/software/hexes.tal tals/hexes.tal

    cp uxn/projects/library/load-rom.tal tals/load-rom.tal

    for file in $(ls submissions/*.tal); do
        cp "$file" tals
    done;


    blue "Building UXN for emscripten..."
    emcc \
        -s WASM=1 \
        -s ASSERTIONS=1 \
        -s ENVIRONMENT=web \
        -s ASYNCIFY \
        -s USE_SDL=2 \
        -s USE_SDL_MIXER=2 \
        -s FORCE_FILESYSTEM=1 \
        -s EXPORTED_FUNCTIONS='["_main"]' \
        -s EXPORTED_RUNTIME_METHODS='["callMain", "FS"]' \
        -s NO_EXIT_RUNTIME=1 \
        -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
        --shell-file=shell-uxnemu.html \
        --extern-pre-js=pre-uxnemu.js \
        -O3 \
        -o site/uxnemu.html \
            uxn/src/devices/audio.c \
            uxn/src/devices/controller.c \
            uxn/src/devices/datetime.c \
            uxn/src/devices/file.c \
            uxn/src/devices/mouse.c \
            uxn/src/devices/screen.c \
            uxn/src/devices/system.c \
            uxn/src/uxnemu.c \
            uxn/src/uxn.c

    EMCC_DEBUG=1 emcc \
        -s WASM=1 \
        -s ASSERTIONS=1 \
        -s ENVIRONMENT=web \
        -s FORCE_FILESYSTEM=1 \
        -s EXPORTED_FUNCTIONS='["_main"]' \
        -s EXPORTED_RUNTIME_METHODS='["callMain", "FS"]' \
        --preload-file tals \
        --shell-file=shell-uxnasm.html \
        --extern-pre-js=pre-uxnasm.js \
        -O3 \
        -o site/uxnasm.html \
            uxn/src/uxnasm.c
}

PARAMS=""
CLEAN=
while (( "$#" )); do
  case "$1" in
    -c|--clean)
      CLEAN=1
      shift
      ;;
    -d|--debug)
      export EMCC_DEBUG=1
      shift
      ;;
    -*) # unsupported flags
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

setup_emsdk
setup_uxn
build_uxn_emscripten
copy_docs
inject_uxn_commit
inject_date

green "Finished!"
