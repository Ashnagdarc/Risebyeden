# Obsidian Portfolio Dashboard

A minimal dark-themed property investment portfolio dashboard built with Next.js 15, React 19, and TypeScript.

![Dashboard Preview](screenshot.png)

## Features

- Sleek obsidian-inspired dark UI with vitreous glass effects
- Real-time portfolio metrics and analytics
- Property asset distribution with detailed metrics
- Performance tracking with interactive charts
- Smooth animations and 3D hover effects
- Fully responsive design
- Multi-page navigation (Dashboard, Analytics, Performance, Acquire Property)
- Built with Next.js App Router and TypeScript

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
│   ├── layout.tsx              # Root layout with font configuration
│   ├── page.tsx                # Main dashboard page
│   ├── page.module.css         # Dashboard styles
│   ├── globals.css             # Global styles and CSS variables
│   ├── acquire/
│   │   ├── page.tsx            # Acquire property form page
│   │   └── page.module.css
│   ├── analytics/
│   │   ├── page.tsx            # Analytics dashboard with pie chart
│   │   └── page.module.css
│   └── performance/
│       ├── page.tsx            # Performance tracking with bar chart
│       └── page.module.css
├── components/
│   ├── Sidebar.tsx             # Navigation sidebar component
│   Main Dashboard
- **Total Managed Assets**: Portfolio value with percentage change
- **Net Annual Yield**: Investment return percentage
- **Portfolio LTV**: Loan-to-value ratio visualization
- **Occupancy Rate**: Real-time occupancy status
- **Property List**: Asset distribution with detailed metrics

### Analytics Page
- **Portfolio Distribution**: Interactive pie chart showing asset allocation
- **Performance Metrics**: YoY growth, ROI, and portfolio statistics
- **Top Performers**: Ranking of best-performing properties
- **Market Insights**: AI-driven recommendations and alerts

### Performance Page
- **Revenue/Expense Tracking**: Monthly comparison bar chart
- **Property Performance Table**: Occupancy rates and revenue by property
- **Quick Stats**: Key performance indicators at a glance

### Acquire Property Page
- **Comprehensive Form**: Add new properties to your portfolio
- **Financial Metrics**: Purchase price, valuation, cap rate tracking
- **Property Details**: Full specifications including location, type, and amenities
- **Smart Validation**: Form validation with helpful input guidancessets:** Portfolio value with percentage change
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
