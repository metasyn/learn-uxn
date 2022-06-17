# learn-uxn

[![builds.sr.ht status](https://builds.sr.ht/~metasyn/learn-uxn.svg)](https://builds.sr.ht/~metasyn/learn-uxn?)

* learn you a uxn for great good!!!!!
* see it here: https://metasyn.github.io/learn-uxn

## uses

* [uxn](https://git.sr.ht/~rabbits/uxn)
* [codemirror 6](https://codemirror.net/6)
* [lezer](https://lezer.codemirror.net)
* [emscripten](https://emscripten.org)
* cursed hackery

## building

```
make build
```
which is composed of:

* build.sh - downloads/installs emscripten, builds uxn, builds emscripten port
* npm install - ugh don't we all just adore javascript
* rollup

## Contributing

* be reasonable
* keep it cursed
* `make format` before PR if you're adding/modifying js

## Contributors

* andrew alderwick

## TODO

- [ ] allow save rom? - currently roms compiled in the web wont work on real uxnemu
- [ ] fix debug view? - it is proper fucked right now

# LICENSE

The [Unlicense](https://unlicense.org/):
```
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
```
