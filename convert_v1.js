// --- 1. ADVANCED FAKE BROWSER (Polyfills) ---
global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    devicePixelRatio: 1
};

global.navigator = {
    userAgent: 'Node',
    platform: 'Win32',
    appVersion: '5.0'
};

global.HTMLElement = class {};
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

// Helper to create a dummy element
function createMockElement(tag) {
    const el = {
        tagName: tag ? tag.toUpperCase() : "DIV",
        style: {},
        classList: {
            add: () => {},
            remove: () => {},
            contains: () => false,
            toggle: () => {}
        },
        appendChild: () => {},
        append: () => {},
        prepend: () => {},
        replaceWith: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
        addEventListener: () => {},
        removeEventListener: () => {},
        remove: () => {},
        querySelector: (selector) => createMockElement("div"),
        querySelectorAll: (selector) => [createMockElement("div")],
        
        innerHTML: "",
        textContent: "",
        id: "",
        value: "",
        
        // Getters to prevent infinite recursion
        get firstElementChild() { return createMockElement("DIV"); },
        get lastElementChild() { return createMockElement("DIV"); },
        get children() { return [createMockElement("DIV")]; }
    };
    
    el.content = el; 
    return el;
}

global.document = {
    createElement: (tag) => createMockElement(tag),
    body: {
        appendChild: () => {},
        append: () => {}
    },
    documentElement: {
        style: {}
    },
    querySelector: () => createMockElement("div")
};

global.self = global.window;

// --- 2. IMPORTS ---
const fs = require('fs');
const path = require('path');
const OBC = require('openbim-components');
const THREE = require('three');

global.THREE = THREE;

async function convert() {
    console.log("🚀 Initializing Stable V1 Converter...");

    const components = new OBC.Components();
    
    // --- MOCK UI ---
    const mockUI = {
        init: () => { console.log("   (Mock UI initialized)"); },
        dispose: () => {},
        get enabled() { return true; },
        set enabled(v) {},
        toolbar: { add: () => {}, components: [] },
        contextMenu: { add: () => {} },
        
        // THE FIX: Add the missing 'add' method
        add: (component) => { 
            // console.log("   (Mock UI: Component added)"); 
        }
    };

    Object.defineProperty(components, 'ui', {
        value: mockUI,
        writable: true,
        configurable: true
    });
    components.ui.init();

    const fragments = new OBC.FragmentManager(components);
    const ifcLoader = new OBC.FragmentIfcLoader(components);

    // 1. Configure WASM
    ifcLoader.settings.wasm = {
        path: "https://unpkg.com/web-ifc@0.0.53/", 
        absolute: true
    };
    
    // 2. Settings
    ifcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;
    ifcLoader.settings.webIfc.OPTIMIZE_PROFILES = true;

    // 3. Load
    const inputPath = 'model.ifc';
    if (!fs.existsSync(inputPath)) {
        console.error("❌ Error: model.ifc not found.");
        return;
    }

    console.log("📂 Reading IFC...");
    const ifcBuffer = fs.readFileSync(inputPath);
    
    console.log("⚙️  Parsing IFC (This may take a moment)...");
    
    try {
        const model = await ifcLoader.load(ifcBuffer);
        
        console.log("💾 Exporting...");
        const exported = fragments.export(model);
        
        // 4. Save
        const outputPath = 'model_v1.frag';
        fs.writeFileSync(outputPath, exported);
        
        console.log(`✅ Success! Saved ${outputPath} (${exported.length} bytes)`);
    } catch (err) {
        console.error("❌ Parse Error:", err);
    }
}

convert();