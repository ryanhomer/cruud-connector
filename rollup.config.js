import nodeResolve from "@rollup/plugin-node-resolve";
import ts from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: ["src/index.ts"],
    plugins: [nodeResolve(), ts(), terser()],
    output: {
      file: "dist/index.min.js",
      format: "umd",
      name: "cruudConnector",
      esModule: false,
      exports: "named",
    },
  },
  {
    input: "tmp/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts()],
  },
];
