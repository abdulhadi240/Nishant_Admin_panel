import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import preserveDirectives from 'rollup-preserve-directives';
import { pathToFileURL } from 'url';

export default defineConfig(async () => {
    const packagesDir = path.resolve(__dirname, '../../packages');
    const packages = fs.readdirSync(packagesDir);

    const aliases: Record<string, string> = {
        'data-generator-retail': path.resolve(__dirname, '../data-generator/src'),
    };
    for (const dirName of packages) {
        if (dirName === 'create-react-admin') continue;

        const packageJsonPath = path.resolve(packagesDir, dirName, 'package.json');
        const fileUrl = pathToFileURL(packageJsonPath).href;
        const packageJson = await import(fileUrl, { with: { type: 'json' } });

        aliases[packageJson.default.name] = path.resolve(
            __dirname,
            `../../packages/${packageJson.default.name}/src`
        );
    }

    return {
        plugins: [
            react(),
            visualizer({
                open: process.env.NODE_ENV !== 'CI',
                filename: './dist/stats.html',
            }),
        ],
        define: {
            'process.env': process.env,
        },
        server: {
            port: 8000,
            open: true,
        },
        base: './',
        esbuild: {
            keepNames: true,
        },
        build: {
            sourcemap: true,
            rollupOptions: {
                plugins: [preserveDirectives()],
            },
        },
        resolve: {
            preserveSymlinks: true,
            alias: {
                'data-generator-retail': path.resolve(__dirname, '../data-generator/src'),
                ...Object.keys(aliases).map((packageName) => ({
                    find: packageName,
                    replacement: aliases[packageName],
                })),
            },
        },
    };
});
