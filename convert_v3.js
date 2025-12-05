const fs = require('fs');
const path = require('path');

// 1. IMPORT WEB-IFC FIRST (Before polluting global scope)
const WEBIFC = require('web-ifc');

// 2. CHECK WASM EXISTENCE
const wasmPath = path.join(__dirname, 'node_modules', 'web-ifc', 'web-ifc.wasm');
if (!fs.existsSync(wasmPath)) {
    console.error("❌ CRITICAL ERROR: web-ifc.wasm not found at:", wasmPath);
    console.error("Run: npm install web-ifc@0.0.64 --save-exact");
    process.exit(1);
}

// 3. DEFINE POLYFILLS (Strictly for @thatopen)
const { webcrypto } = require('crypto');
const { performance } = require('perf_hooks');

global.window = {
    crypto: webcrypto,
    performance: performance,
    devicePixelRatio: 1,
    navigator: { userAgent: 'Node' },
    location: { href: '' }
};

global.document = {
    createElement: (tag) => {
        return {
            getContext: () => ({
                getParameter: () => 0,
                getExtension: () => null,
            }),
            style: {},
            addEventListener: () => {},
            removeEventListener: () => {}
        };
    },
    body: { appendChild: () => {} }
};

// DO NOT define global.self = global.window; (This kills web-ifc)

global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// 4. IMPORT THATOPEN LIBRARIES
const THREE = require('three');
global.THREE = THREE;
const OBC = require('@thatopen/components');

async function convert() {
    console.log("🚀 Initializing V3 Converter (Stable 0.0.64)...");

    try {
        const components = new OBC.Components();
        components.init();

        const fragments = components.get(OBC.FragmentsManager);
        fragments.init(); 

        const ifcLoader = components.get(OBC.IfcLoader);

        // 5. SETUP LOADER WITH EXPLICIT PATH
        await ifcLoader.setup({
            wasm: {
                path: wasmPath,
                absolute: true,
                logLevel: WEBIFC.LogLevel.LOG_LEVEL_OFF
            }
        });

        // Settings
        ifcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;
        ifcLoader.settings.webIfc.OPTIMIZE_PROFILES = true;

        // 6. LOAD
        const inputPath = 'model.ifc'; 
        if (!fs.existsSync(inputPath)) {
            throw new Error(`'${inputPath}' not found.`);
        }

        console.log("📂 Reading IFC...");
        const ifcBuffer = fs.readFileSync(inputPath);
        
        console.log("⚙️  Parsing IFC...");
        const group = await ifcLoader.load(ifcBuffer);
        
        console.log("💾 Exporting to .frag...");
        const exportedBuffer = fragments.export(group);

        const outputPath = 'model_v3.frag';
        fs.writeFileSync(outputPath, exportedBuffer);
        
        console.log(`✅ Success! Saved: ${outputPath} (${exportedBuffer.length} bytes)`);
        
        components.dispose();
        process.exit(0);

    } catch (e) {
        console.error("❌ Conversion Error:", e);
        process.exit(1);
    }
}

convert();