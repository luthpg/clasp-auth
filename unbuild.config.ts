import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  clean: true,
  declaration: 'compatible',
  entries: ['src/cli', 'src/action'],
  outDir: 'dist',
  rollup: {
    emitCJS: true,
    cjsBridge: true,
  },
  externals: ['@inquirer/prompts', 'commander'],
});
