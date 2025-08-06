# HRIS Staging Monitor - Vue 3 + Vite

A modern single-page application for monitoring HRIS staging EC2 instances, built with Vue 3, Vite, and AWS SDK v3.

## Tech Stack

- **Vue 3** - Modern reactive framework
- **Vite** - Lightning fast build tool
- **Pinia** - State management
- **Vue Router** - SPA routing
- **Tailwind CSS** - Utility-first CSS
- **AWS SDK v3** - Modular AWS services
- **TypeScript** - Optional (can be added)

## Features

- 🔐 **Cognito Authentication** - Secure login via AWS Cognito with Authorization Code + PKCE flow
- 🖥️ **EC2 Monitoring** - Real-time instance status
- ⚡ **Step Functions** - Start stopped instances
- 🎨 **Modern UI** - Clean, responsive design with Tailwind
- 🚀 **Fast Performance** - Vite's HMR and optimized builds
- 📦 **Code Splitting** - Automatic route-based splitting
- 🔄 **Token Refresh** - Automatic token renewal with refresh tokens

## Project Structure

```
src/
├── components/       # Reusable Vue components
│   ├── AppHeader.vue
│   ├── InstanceCard.vue
│   └── InstanceGrid.vue
├── views/           # Page components
│   ├── AuthCheck.vue
│   └── Dashboard.vue
├── stores/          # Pinia stores
│   ├── auth.js
│   └── ec2.js
├── router/          # Vue Router config
├── App.vue          # Root component
├── main.js          # App entry point
└── style.css        # Global styles with Tailwind
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS configuration
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

6. **Deploy to S3**
   ```bash
   npm run deploy
   ```

## Configuration

Edit `.env` file with your AWS resources:

```env
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=your-user-pool-id
AWS_COGNITO_CLIENT_ID=your-client-id
AWS_COGNITO_IDENTITY_POOL_ID=your-identity-pool-id
S3_BUCKET_NAME=your-s3-bucket
APP_TITLE="HRIS Staging Monitor"
CACHE_DURATION_MS=60000
```

## Development

### Key Components

- **Auth Store** (`stores/auth.js`) - Handles Cognito authentication
- **EC2 Store** (`stores/ec2.js`) - Manages instance data and operations
- **Router Guards** - Protects routes requiring authentication
- **Auto Refresh** - Updates instance data every minute

### Build Optimization

Vite automatically handles:
- Tree shaking for AWS SDK v3
- Code splitting by routes
- CSS purging with Tailwind
- Minification with Terser
- Asset optimization

## Deployment

The build process creates optimized static files in `dist/`:

```bash
npm run build
```

Output includes:
- Minified JS chunks
- Optimized CSS
- Hashed assets for caching
- index.html with injected scripts

Deploy to S3:
```bash
aws s3 sync dist/ s3://your-bucket --delete
```

## Security

- All AWS operations use temporary Cognito credentials
- No API keys in code
- Environment variables injected at build time
- Auth tokens stored in localStorage with expiration
- Automatic redirect to Cognito for authentication

## License

MIT