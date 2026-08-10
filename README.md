# MilHub Frontend

*Looking for the backend? The Spring Boot Microservices repository can be found here: [MilHub Microservices](https://github.com/rostikdiv/milhub-microservices.git)*

This is the React frontend for the MilHub handmade marketplace. It provides the user interface for buyers, sellers, and administrators.

## 📸 Screenshots

*(Replace these placeholders with actual screenshots of your application)*

- **Homepage/Catalog**: `[Screenshot: Product Catalog]`
- **Shopping Cart & Checkout**: `[Screenshot: Cart/Checkout Flow]`
- **Seller Dashboard**: `[Screenshot: Seller Analytics/Products]`
- **Admin Panel**: `[Screenshot: Admin Verification Panel]`

## ✨ Features

- **Product Catalog**: Browse and search for handmade items.
- **Shopping Cart & Checkout**: Add items, adjust quantities, and securely checkout.
- **Seller Dashboard**: Sellers can manage their products, view analytics, and fulfill orders.
- **Admin Panel**: Administrators can review and approve seller verification documents (KYC).
- **Authentication**: JWT-based login with dynamic UI rendering based on roles (Buyer, Seller, Admin).
- **Localization**: Full i18n support for English (EN) and Ukrainian (UK).

## 🏗️ Tech Stack

- **Framework**: React 18, Vite
- **State Management**: Context API (for Cart, Auth, and Toast notifications)
- **Routing**: React Router DOM v6
- **Styling**: TailwindCSS, Framer Motion
- **Testing**: Vitest, React Testing Library, MSW (Mock Service Worker)
- **Features**: i18n localization, global Error Boundaries, React Hot Toast for notifications.

---

## 🚀 Local Development Setup

### 1. Requirements
- Node.js 18+ is strictly required.

### 2. Environment Variables
The application uses environment variables for configuration.
- Copy the `.env.example` file to `.env`:
  ```bash
  cp .env.example .env
  ```
- Fill in any necessary values (e.g., `VITE_API_URL=/api/v1`).

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Development Server
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

## 📦 Production Build

To build the application for production:
```bash
npm run build
```

To locally preview the generated production build:
```bash
npm run preview
```

---

## 🧹 Code Quality (Linting)

To run ESLint and check for code quality issues:
```bash
npm run lint
```

---

## 🧪 Testing

The frontend uses Vitest and MSW (Mock Service Worker) for testing components and API interactions without needing a live backend.
*Coverage includes cart logic, auth flows, and API error states.*

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
