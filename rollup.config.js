import typescript from '@rollup/plugin-typescript';
import {lezer} from "@lezer/generator/rollup"
import {nodeResolve} from '@rollup/plugin-node-resolve';

export default [
  {
    input: "codemirror/editor.js",
    output: [
      {file: "site/editor.bundle.js", format: "iife"},
    ],
    plugins: [nodeResolve()],
    plugins: [lezer(), typescript(), nodeResolve()],
  },
]
