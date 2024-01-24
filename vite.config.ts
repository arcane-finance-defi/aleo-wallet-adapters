import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), dts()],
    build: {
        target: 'es6',
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'aleo-adapters',
            fileName: (format) => `index.${format}.js`,
        },
        sourcemap: false,
        emptyOutDir: true,
    },
})
