import {defineTiniConfig} from '../../packages/project/dist/public-api.js';

export default defineTiniConfig({
  build: {
    options: {
      configPath: '../../packages/vite-builder/vite.config.js',
    },
  },
});
