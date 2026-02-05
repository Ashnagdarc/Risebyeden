# Obsidian Portfolio Dashboard

A minimal dark-themed property investment portfolio dashboard built with Next.js 15, React 19, and TypeScript.

![Dashboard Preview](screenshot.png)

## Features

- ✨ Sleek obsidian-inspired dark UI with vitreous glass effects
- 📊 Real-time portfolio metrics and analytics
- 🏢 Property asset distribution with detailed metrics
- 🎨 Smooth animations and 3D hover effects
- 📱 Fully responsive design
- ⚡ Built with Next.js App Router and TypeScript

## Tech Stack

- **Framework:** Next.js 15
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** CSS Modules
- **Fonts:** Inter & JetBrains Mono (Google Fonts)

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm, yarn, pnpm, or bun

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with font configuration
│   ├── page.tsx            # Main dashboard page
│   ├── page.module.css     # Page-specific styles
│   └── globals.css         # Global styles and CSS variables
├── components/
│   ├── Sidebar.tsx         # Navigation sidebar component
│   ├── Header.tsx          # Dashboard header with portfolio total
│   ├── StatSlab.tsx        # Stat card with 3D hover effect
│   └── PropertyRow.tsx     # Property list item component
├── public/                 # Static assets
└── package.json
```

## Features Breakdown

### Dashboard Metrics
- **Total Managed Assets:** Portfolio value with percentage change
- **Net Annual Yield:** Investment return percentage
- **Portfolio LTV:** Loan-to-value ratio visualization
- **Occupancy Rate:** Real-time occupancy status

### Property List
Each property shows:
- Name and location
- Property type (Mixed Use, Residential, Commercial)
- Appreciation percentage
- Cap rate
- Current valuation

## Customization

### Colors
Edit CSS variables in [app/globals.css](app/globals.css):

```css
:root {
  --obsidian-base: #050505;
  --obsidian-surface: #0a0a0a;
  --accent-gold: #c5a368;
  --text-primary: #e5e5e5;
  /* ... more variables */
}
```

### Data
Update property data in [app/page.tsx](app/page.tsx):

```typescript
const properties = [
  {
    name: "Your Property",
    location: "City, Country",
    type: "Type",
    // ... more fields
  }
];
```

## Build for Production

```bash
npm run build
npm run start
```

## License

MIT

## Author

Built with ❤️ for Rise by Eden
