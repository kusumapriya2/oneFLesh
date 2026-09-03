import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // Output ESM as .js and CJS as .cjs to match package.json exports
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
  dts: true,   // API + Web resolve @oneflesh/shared to source via tsconfig paths; no .d.ts needed in-monorepo
  clean: true,
  sourcemap: true,
  tsconfig: 'tsconfig.json',
});
