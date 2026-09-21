import esbuild from "esbuild";

const options = {
  entryPoints: ["dev/js/app.js"],
  outfile: "assets/js/app.js",
  bundle: true,
  format: "esm",
  target: ["es2022"],
  // Pagefind generates these into _site at build time; they must stay a
  // runtime URL rather than something esbuild tries to resolve on disk.
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
