#include <emscripten.h>
#include "uxn/src/uxnemu.h"
#include <SDL.h>

void
quit() {
    SDL_Quit();
    emscripten_force_exit(0);
}

int
main(int argc, char **argv)
{
    Uxn u;
    int err = validate(&u, argc, argv);

    if  (err != 0) {
        return err;
    }

    setup(&u);

    while (1) {
        run_event(&u);
        emscripten_sleep(10);
    }
	return 0;
}
