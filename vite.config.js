import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Custom plugin to copy non-module JS files to dist
function copyScripts() {
    const scripts = ['crypto.js', 'steganography.js', 'app.js'];
    return {
        name: 'copy-scripts',
        writeBundle(options) {
            const outDir = options.dir || 'dist';
            scripts.forEach(script => {
                const src = resolve(__dirname, script);
                const dest = resolve(outDir, script);
                if (existsSync(src)) {
                    copyFileSync(src, dest);
                }
            });
        }
    };
}

export default defineConfig({
    plugins: [copyScripts()],
    build: {
        // Ensure assets are handled correctly
        assetsDir: 'assets',
    }
});
