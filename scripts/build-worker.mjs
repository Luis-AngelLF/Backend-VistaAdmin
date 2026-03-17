import esbuild from 'esbuild';
import { polyfillNode } from 'esbuild-plugin-polyfill-node';

esbuild.build({
    entryPoints: ['workers/crypto.worker.ts'],
    bundle: true,
    outfile: 'public/scripts/zk-worker.js',
    platform: 'browser',
    format: 'iife',
    define: {
        global: 'globalThis',
        'process.env.NODE_ENV': '"development"',
    },
    plugins: [
        polyfillNode({
            globals: { buffer: true, process: true },
            polyfills: {
                fs: true, crypto: true, buffer: true, events: true,
                stream: true, assert: true, os: true, path: true, process: true
            }
        })
    ]
}).then(() => {
    console.log("⚡ Worker criptográfico pre-compilado en milisegundos a public/scripts/zk-worker.js.");
    process.exit(0);
}).catch((e) => {
    console.error("Error compilando worker", e);
    process.exit(1);
});
