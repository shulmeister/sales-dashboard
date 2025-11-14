# Colorado CareAssist CRM

A modern, beautiful CRM built with React Admin, inspired by Atomic CRM.

## Features

- 📊 **Deals Pipeline** - Kanban board with drag-and-drop
- 👥 **Contacts Management** - Full contact tracking
- 🏢 **Companies** - Referral sources and organizations
- ✅ **Tasks** - Task management and tracking
- 📈 **Dashboard** - Charts and KPIs

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **React** + **Vite** - Fast modern development
- **React Admin** - Professional admin framework
- **Material-UI** - Beautiful dark theme components
- **Recharts** - Data visualization
- **React DnD** - Drag and drop functionality

## Backend Integration

This frontend connects to the FastAPI backend at `/api`. The backend handles:
- Authentication (session-based)
- Data storage (PostgreSQL)
- API endpoints for all resources

## Deployment

Built files are served by the FastAPI backend in production.
