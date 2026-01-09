# XP Maestro Cloud Admin Dashboard

React-based admin dashboard for managing clients and instances.

## Features

- ✅ Admin login with JWT authentication
- ✅ Dashboard with real-time statistics
- ✅ Client management (create, view, delete)
- ✅ Instance management (create, view, delete)
- ✅ Responsive design with Tailwind CSS
- ✅ API integration with Node.js backend

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Runs on `http://localhost:5173` with API proxy to `http://localhost:3000`

## Building

```bash
npm run build
```

Outputs optimized production build to `dist/` folder

## Environment Variables

Create a `.env.local` file:

```
VITE_API_URL=http://localhost:3000/api
```

## Deployment

After building:

1. Copy `dist/` folder contents to Node.js server's public directory
2. Or use `npm run preview` to test production build locally

## Architecture

```
src/
├── components/         # Reusable UI components
│   ├── Login.jsx
│   ├── Navbar.jsx
│   ├── Dashboard.jsx
│   ├── Clients.jsx
│   ├── Instances.jsx
│   └── Modal.jsx
├── services/          # API calls
│   └── api.js
├── styles/            # Global styles
│   └── index.css
├── App.jsx            # Main app component
└── main.jsx           # Entry point
```
