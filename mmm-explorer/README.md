# MMM Data Explorer

An interactive dashboard for visualizing Marketing Mix Modelling (MMM) data.

## Features

- **Dashboard**: Key metrics overview (Total Spend, Total Revenue, ROAS).
- **Interactive Filters**: Filter by Vertical and Territory.
- **Visualizations**:
  - Spend vs Revenue trends over time.
  - Channel Spend Mix (Google, Meta, TikTok).
- **Performance**: Client-side CSV parsing using Web Workers for a responsive UI with large datasets.

## Technologies

- **Frontend**: React, Vite
- **Charts**: Recharts
- **Data Parsing**: PapaParse
- **Styling**: Vanilla CSS (Variables & Dark Mode)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run locally**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## Project Structure

- `public/conjura_mmm_data.csv`: The dataset.
- `src/utils/dataLoader.js`: Handles CSV parsing and data normalization.
- `src/App.jsx`: Main dashboard component and logic.
