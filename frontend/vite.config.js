// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// // let url = import.meta.env.VITE_API_BASE_URL
// // let VITE_WS_URL = import.meta.env.VITE_WS_URL;
// // console.log(url);
// // const env = loadEnv(mode, process.cwd(), '');
// // const backendURL = env.VITE_API_BASE_URL;
// // const wsURL = env.VITE_WS_URL;
// let beckendURL = 'https://loves-feb-involvement-sir.trycloudflare.com/'
// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 5173,
//     host: true,
//     allowedHosts: [
//       'http://localhost:8080/api/v1'
//     ],
//     proxy: {
//       '/cdn': {
//         target: 'https://res.cloudinary.com/mmryuaqu',
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/cdn/, ''),
//         secure: true,
//       },
//       '/api': {
//         target: `http://localhost:8080/api/v1`,
//         // target: 'https://loves-feb-involvement-sir.trycloudflare.com/',
//         changeOrigin: true,
//         secure: false,
//       },
//       '/uploads': {
//         target: 'http://localhost:8080/api/v1',
//         // target: 'https://loves-feb-involvement-sir.trycloudflare.com/',
//         changeOrigin: true,
//         secure: false,
//       },
//       '/ws': {
//         target: 'ws://localhost:8080/ws',
//         // target: 'https://loves-feb-involvement-sir.trycloudflare.com/',
//         changeOrigin: true,
//         secure: false,
//         ws: true,
//       },
//     },
//   },
//   build: {
//     rollupOptions: {
//       output: {
//         manualChunks: {
//           'react-vendor': ['react', 'react-dom', 'react-router-dom', 'zustand'],
//           'ui-vendor': ['lucide-react', 'framer-motion'],
//           'network-vendor': ['axios'],
//         },
//       },
//     },
//   },
//   test: {
//     globals: true,
//     environment: 'jsdom',
//     setupFiles: './src/test/setup.js',
//     pool: 'forks',
//     poolOptions: {
//       forks: {
//         singleFork: true,
//       },
//     },
//   },
// });





import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const resolveProxyOrigin = (rawUrl, fallback) => {
  if (!rawUrl || !rawUrl.trim()) return fallback;
  try {
    const parsed = new URL(rawUrl.trim());
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return fallback;
  }
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Strip path suffixes like /api/v1 or /ws so Vite proxies to the backend origin
  const backendOrigin = resolveProxyOrigin(
    env.VITE_API_BASE_URL,
    env.VITE_BACKEND_ORIGIN || 'http://localhost:8080'
  );
  const wsOrigin = resolveProxyOrigin(env.VITE_WS_URL, backendOrigin.replace(/^http/, 'ws'));
  const cloudinaryURL = (env.VITE_CLOUDINARY_URL || 'https://res.cloudinary.com/mmryuaqu').trim();
  return {
    plugins: [react()],

    server: {
      port: 5173,
      host: true,

      allowedHosts: ['localhost'],

      proxy: {
        '/cdn': {
          target: cloudinaryURL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/cdn/, ''),
          secure: true,
        },

        '/api': {
          target: backendOrigin,
          changeOrigin: true,
          secure: false,
        },

        '/uploads': {
          target: backendOrigin,
          changeOrigin: true,
          secure: false,
        },

        '/ws': {
          target: wsOrigin,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': [
              'react',
              'react-dom',
              'react-router-dom',
              'zustand',
            ],
            'ui-vendor': ['lucide-react', 'framer-motion'],
            'network-vendor': ['axios'],
          },
        },
      },
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
    },
  };
});