# CraftHub Frontend

This is the React frontend for the CraftHub e-commerce platform. It provides the user interface for buyers, sellers, and administrators.

## 🏗️ Tech Stack

- **Framework**: React 18, Vite
- **Styling**: TailwindCSS, Framer Motion
- **Testing**: Vitest, React Testing Library, MSW (Mock Service Worker)
- **Features**: i18n localization, global Error Boundaries, React Hot Toast for notifications.

---

## 🚀 Local Development Setup

### 1. Install Dependencies
Make sure you have Node.js installed, then run:

```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
This will start the Vite server on `http://localhost:5173`.

---

## 🌐 API Routing & ngrok (Avoiding CORS)

To avoid CORS issues during local development, the frontend is configured to route all API calls through the Vite proxy.

### Option A: Localhost (Default)
When you run `npm run dev`, API requests to `/api/v1/...` are automatically proxied to `http://localhost:8080` (where your backend API Gateway should be running).

### Option B: Using ngrok
If you need a public URL (e.g., to test on mobile):
1. Start ngrok: `ngrok http 5173`
2. Open the `https://*.ngrok-free.dev` URL in your browser.
3. Accept the ngrok warning screen.
4. All API calls will naturally route through the Vite proxy without triggering cross-origin restrictions.

---

## 🧪 Testing

The frontend uses Vitest and MSW (Mock Service Worker) for testing components and API interactions without needing a live backend.

### Run Tests (CI/CD Mode)
Runs the test suite once and exits.
```bash
npm run test
```

### Run Tests in Watch Mode (Development)
Watches for file changes and re-runs tests automatically.
```bash
npm run test:watch
```

---

## 🛡️ Error Handling
The application uses a **Dual-Logging Strategy**:
- **UI Feedback**: User-facing errors trigger `react-hot-toast` notifications.
- **Developer Debugging**: Stack traces and HTTP details are simultaneously logged to the browser console.
- **Global Error Boundary**: The app is wrapped in an `<ErrorBoundary>` to catch rendering errors and display a fallback UI instead of crashing the entire page.
