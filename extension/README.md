# Browser Extension

A Chrome extension built with Manifest v3, React, TypeScript, and Vite.

## 🏗️ Architecture

This extension follows Chrome Manifest v3 specifications and consists of three main components:

- **Background Service Worker** (`src/background/`) - Handles extension lifecycle, messaging, and API requests
- **Content Script** (`src/content/`) - Injects into ChatGPT and Gemini pages to enhance functionality
- **Popup UI** (`src/popup/`) - React-based popup interface for user interaction

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies from the monorepo root
npm install

# Or install in this package directly
cd extension
npm install
```

### Environment Variables

Copy the `.env.example` file to `.env` and configure:

```bash
cp .env.example .env
```

**Available Variables:**

- `VITE_API_BASE_URL` - Backend API base URL (default: `http://localhost:3000`)
- `VITE_EXTENSION_ID` - Chrome extension ID (auto-generated after first install)

## 🛠️ Development

### Build for Development

```bash
npm run dev
```

This will build the extension in watch mode. Any changes to the source files will trigger a rebuild.

### Build for Production

```bash
npm run build
```

This will:
1. Run TypeScript type checking
2. Build optimized production bundles
3. Output to `dist/` directory

### Create Distribution Package

```bash
npm run zip
```

This will build the extension and create `extension.zip` ready for distribution.

## 📦 Loading the Extension in Chrome

1. Build the extension:
   ```bash
   npm run build
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked"

5. Select the `dist/` folder from this package

The extension should now be loaded and active!

## 🔄 Development Workflow

1. Make changes to source files
2. Run `npm run dev` (if not already running)
3. The extension will rebuild automatically
4. Go to `chrome://extensions/`
5. Click the refresh icon on your extension card
6. Test your changes

## 📂 Project Structure

```
extension/
├── public/
│   ├── icons/              # Extension icons (16, 32, 48, 128)
│   └── manifest.json       # Chrome extension manifest
├── scripts/
│   └── zip.ts             # Script to package extension
├── src/
│   ├── background/
│   │   └── background.ts  # Service worker
│   ├── content/
│   │   ├── contentScriptNew.tsx # Main content script for ChatGPT/Gemini
│   │   ├── dashboardSync.ts     # Dashboard auth token sync script
│   │   └── components/          # React components for content UI
│   ├── popup/
│   │   ├── index.html     # Popup HTML
│   │   ├── main.tsx       # Popup entry point
│   │   ├── Popup.tsx      # Main popup component
│   │   └── styles.css     # Popup styles
│   ├── utils/
│   │   ├── auth.ts        # Authentication utilities
│   │   ├── config.ts      # Configuration utilities
│   │   └── messaging.ts   # Messaging utilities
│   └── vite-env.d.ts      # TypeScript env declarations
├── .eslintrc.json         # ESLint configuration
├── .prettierrc.json       # Prettier configuration
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
└── package.json
```

## 🎯 Features

### PromptLens Optimization (Phase 1)

The extension now includes PromptLens functionality for ChatGPT and Gemini:

- **Textarea Detection**: Automatically detects input areas on ChatGPT and Gemini
- **Optimize Button**: Floating "✨ Optimize with PromptLens" button appears near active textareas
- **Optimization Modal**: Shows original prompt, optimized version, and explanation
- **Actions**: Replace textarea content, copy to clipboard, or save to backend
- **Auth Integration**: Uses stored auth token from dashboard login
- **Error Handling**: User-friendly messages for auth errors, rate limits, and network issues

#### Authentication Sync

The extension automatically syncs authentication tokens from the PromptLens dashboard:

1. **Sign in to Dashboard**: Log in at the PromptLens dashboard (default: http://localhost:3000)
2. **Automatic Token Sync**: A content script on the dashboard domain detects your login and syncs the auth token to the extension's storage
3. **Seamless Extension Use**: The extension can now make authenticated API requests without requiring separate login
4. **Token Persistence**: Tokens persist across browser sessions and are automatically cleared on logout

**How It Works:**
- Dashboard stores tokens in localStorage after successful login
- Dashboard sync content script (`src/content/dashboardSync.ts`) monitors token changes
- Tokens are copied to `chrome.storage.local` for extension access
- Background service worker uses stored tokens for API authentication
- Extension shows helpful error messages with dashboard link if authentication is missing

#### Usage

1. **First-time Setup**:
   - Sign in to the PromptLens dashboard
   - Wait a few seconds for token sync
   - Navigate to ChatGPT or Gemini
   
2. **Using the Extension**:
   - Click on the textarea to focus it
   - The optimize button will appear
   - Type your prompt and click "✨ Optimize with PromptLens"
   - Review the optimized version in the modal
   - Use Replace, Copy, or Save actions as needed

3. **If Authentication Fails**:
   - The error message will include the dashboard URL
   - Sign in to the dashboard in a new tab
   - Reload the ChatGPT/Gemini page
   - Try again

See `TESTING.md` for the complete manual testing checklist.

### Messaging System

The extension includes a robust messaging system for communication between components:

```typescript
import { sendMessageToBackground, MessageType } from '@/utils/messaging';

// Send a message to background
const response = await sendMessageToBackground({
  type: MessageType.PING,
  payload: { data: 'test' }
});
```

### Configuration Management

Store and retrieve configuration using Chrome storage:

```typescript
import { getConfig, setConfig } from '@/utils/config';

// Get configuration
const config = await getConfig();

// Update configuration
await setConfig({ apiBaseUrl: 'https://api.example.com' });
```

### API Requests

Make API requests through the background service worker:

```typescript
import { sendMessageToBackground, MessageType } from '@/utils/messaging';

const response = await sendMessageToBackground({
  type: MessageType.API_REQUEST,
  payload: {
    endpoint: '/api/data',
    method: 'POST',
    body: { key: 'value' }
  }
});
```

## 🎨 Styling

The popup uses vanilla CSS for styling. The styles are located in `src/popup/styles.css`.

You can easily integrate Tailwind CSS if needed by:
1. Creating `tailwind.config.js`
2. Creating `postcss.config.js`
3. Importing Tailwind in your CSS

## 🔍 Supported Platforms

The extension currently targets:
- ChatGPT (`chat.openai.com`, `chatgpt.com`)
- Google Gemini (`gemini.google.com`)

## 🧪 Testing

### Manual Testing

1. Build and load the extension
2. Navigate to ChatGPT or Gemini
3. Open the extension popup
4. Click "Test Connection" to verify messaging works
5. Check the console logs in:
   - Background worker (chrome://extensions → Background worker)
   - Content script (Page DevTools)
   - Popup (Right-click popup → Inspect)

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Formatting

```bash
# Check formatting
npm run format:check

# Fix formatting
npm run format
```

## 📋 Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Build in watch mode for development |
| `npm run build` | Build production bundle |
| `npm run zip` | Build and create distribution zip |
| `npm run clean` | Remove generated files |
| `npm run lint` | Lint source files |
| `npm run lint:fix` | Fix linting issues |
| `npm run format` | Format source files |
| `npm run format:check` | Check if files are formatted |
| `npm run typecheck` | Run TypeScript type checking |

## 🐛 Debugging

### Background Service Worker

1. Go to `chrome://extensions/`
2. Find your extension
3. Click "service worker" link
4. DevTools will open for the background script

### Content Script

1. Navigate to ChatGPT or Gemini
2. Open DevTools (F12)
3. Check the Console for logs from content script

### Popup

1. Right-click the extension icon
2. Select "Inspect popup"
3. DevTools will open for the popup

## 🔐 Permissions

The extension requests the following permissions:

- `activeTab` - Access to the active tab
- `scripting` - Inject content scripts
- `storage` - Store configuration and data
- `host_permissions` - Access to ChatGPT and Gemini domains

## 🚨 Common Issues

### Extension not loading

- Make sure you've run `npm run build` first
- Check that all files are present in the `dist/` folder
- Verify the manifest.json is valid

### Content script not running

- Check the URL matches the patterns in manifest.json
- Look for errors in the page console
- Verify the content script is listed in the manifest

### Messaging not working

- Ensure the background service worker is active
- Check for errors in the service worker console
- Verify message types match between sender and receiver

## 📝 Development Guidelines

- Use TypeScript strict mode
- Follow ESLint rules (no warnings allowed in CI)
- Format code with Prettier before committing
- Keep components small and focused
- Use the messaging utilities for all cross-component communication
- Store sensitive data in Chrome storage, not in code

## 🔄 Hot Reload

The extension doesn't support hot module replacement (HMR) like web apps. To see changes:

1. Save your files
2. The build will update automatically (in dev mode)
3. Go to `chrome://extensions/`
4. Click the refresh icon on your extension
5. Reload the page where content script runs (if applicable)

## 📚 Resources

- [Chrome Extension Manifest v3 Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Extension API Reference](https://developer.chrome.com/docs/extensions/reference/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run linting and type checking: `npm run lint && npm run typecheck`
4. Format your code: `npm run format`
5. Test the extension thoroughly
6. Submit a pull request

## 📄 License

MIT
