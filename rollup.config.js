import tsPlugin from "rollup-plugin-typescript2";
// rollup默认可以导出一个对象 作为打包的配置文件
import resolve from "rollup-plugin-node-resolve";
import path from "path";
export default {
  input: "./src/index.ts",
  output: {
    file: "./dist/bundle.js",
    name: "Promise",
    format: "iife",
    sourcemap: true,
  },
  plugins: [
    tsPlugin({
      tsconfig: path.resolve(__dirname, "./tsconfig.json"),
    }),
    resolve(),
  ],
};
