import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    server: {
      port: 5173,
      host: true
    },
    define: {
      // Make env variables available as global constants
      __APP_CONFIG__: JSON.stringify({
        AWS_REGION: env.AWS_REGION || 'us-east-1',
        AWS_COGNITO_USER_POOL_ID: env.AWS_COGNITO_USER_POOL_ID || '',
        AWS_COGNITO_CLIENT_ID: env.AWS_COGNITO_CLIENT_ID || '',
        AWS_COGNITO_IDENTITY_POOL_ID: env.AWS_COGNITO_IDENTITY_POOL_ID || '',
        APP_TITLE: env.APP_TITLE || 'HRIS Staging Monitor',
        CACHE_DURATION_MS: parseInt(env.CACHE_DURATION_MS) || 60000,
        STEP_FUNCTION_ARN: env.STEP_FUNCTION_ARN || ''
      })
    },
    build: {
      // Enable minification in production
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'aws-sdk': [
              '@aws-sdk/client-cognito-identity',
              '@aws-sdk/credential-provider-cognito-identity',
              '@aws-sdk/client-ec2',
              '@aws-sdk/client-sfn'
            ]
          }
        }
      }
    }
  }
})