const esbuild = require('esbuild');
const path = require('path');

// --- THE FIX ---
// This plugin intercepts "three/..." imports and adds ".js" to the end
const threePatch = {
    name: 'three-patch',
    setup(build) {
        build.onResolve({ filter: /^three\/(examples|src)\// }, args => {
            try {
                // 1. Try to find the file using Node's resolution logic
                // If the import is "three/examples/jsm/lines/LineMaterial", 
                // we try to resolve "three/examples/jsm/lines/LineMaterial.js"
                const fullPath = require.resolve(args.path + '.js', { paths: [args.resolveDir] });
                return { path: fullPath };
            } catch (e) {
                return null; // If not found, let esbuild try default behavior
            }
        });
    },
};

console.log("📦 Bundling Converter (with patches)...");

esbuild.build({
  entryPoints: ['convert_v1.js'],
  bundle: true,
  platform: 'node',
  outfile: 'run_conversion.js',
  external: ['web-ifc', 'fs', 'path', 'crypto', 'perf_hooks'], 
  plugins: [threePatch], // <--- Activate the fix
  logLevel: 'info'
}).then(() => {
  console.log("✅ Build Complete! Now run: node run_conversion.js");
}).catch(() => process.exit(1));