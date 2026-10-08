import esbuild from "esbuild";

const options = {
  entryPoints: ["dev/js/app.js"],
  outfile: "assets/js/app.js",
  bundle: true,
  format: "esm",
  target: ["es2022"],
  // esbuild must not bundle /pagefind/*; those files do not exist during jekyll serve.
  external: ["/pagefind/*"],
  minify: true,
  sourcemap: false,
  logLevel: "info",
};

if (process.argv.includes("--watch")) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
