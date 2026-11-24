# NexCRM — React CRM Dashboard

A full-featured CRM SaaS dashboard built with React, Recharts, and Lucide React.

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm

### Install & Run

```bash
npm install
npm start
```

Opens at http://localhost:3000

### Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx       # Collapsible sidebar with navigation
│   │   └── Header.jsx        # Top header with search & actions
│   ├── dashboard/
│   │   └── MetricCard.jsx    # Metric cards, activity, team rows
│   └── charts/
│       └── Charts.jsx        # Recharts wrappers (area, bar, pie)
├── pages/
│   ├── DashboardPage.jsx     # Main dashboard with all widgets
│   ├── ContactsPage.jsx      # Contacts table with search/filter
│   ├── DealsPage.jsx         # Deals table with stage filtering
│   ├── AnalyticsPage.jsx     # Analytics with charts & KPIs
│   └── PlaceholderPages.jsx  # Pipeline, Calendar, Messages, Reports
├── data/
│   └── mockData.js           # All mock CRM data
└── styles/
    └── globals.css           # Global CSS variables & reset
```

## 🎨 Design System

- **Theme**: Dark mode with CSS variables
- **Colors**: Blue (#4f7df3), Purple (#a855f7), Cyan (#06b6d4)
- **Font**: Plus Jakarta Sans + DM Mono
- **Charts**: Recharts (AreaChart, BarChart, PieChart)
- **Icons**: Lucide React

## 📦 Dependencies

- `react` ^18.2.0
- `recharts` ^2.8.0  
- `lucide-react` ^0.383.0

## ☁️ Deploying to Vercel

1. Push the repo to GitHub and import it at https://vercel.com/new (framework is auto-detected as Create React App; `vercel.json` sets build/output).
2. In **Project → Settings → Environment Variables**, add every variable listed in `.env.example` (all `REACT_APP_FIREBASE_*`) for Production, Preview and Development.
3. Deploy. CRA inlines `REACT_APP_*` values at build time, so **redeploy after changing any variable**.
4. In Firebase Console → Authentication → Settings → **Authorized domains**, add your `*.vercel.app` / custom domain, otherwise sign-in will fail.

Local development: `cp .env.example .env.local`, fill in values, then `npm start`.
