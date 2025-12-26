# Game Lobby Prototype Plan (React Refactor)

## 1. Project Overview
Refactoring the existing HTML/CSS prototype into a **React** application. This aligns with the user's goal of eventually integrating with game engines or cutting assets for production.
We will address the UI feedback:
*   Fix "Gift Pack" button overlap.
*   Implement real page views for bottom tabs (Lobby, Activities, Tasks, Profile).

## 2. Technology Stack
*   **Framework**: React 18+ (via Vite for fast setup).
*   **Styling**: CSS Modules or Standard CSS (porting existing styles).
*   **Icons**: `react-icons` (FontAwesome replacement).

## 3. Directory Structure
```
/
├── package.json
├── vite.config.js
├── index.html          # Entry HTML
├── src/
│   ├── main.jsx        # React Entry
│   ├── App.jsx         # Main Layout & Routing State
│   ├── App.css         # Global Styles (Reset + Variables)
│   ├── components/
│   │   ├── Header.jsx       # Top Bar
│   │   ├── Header.css
│   │   ├── BottomNav.jsx    # Tab Bar
│   │   ├── BottomNav.css
│   │   ├── GameGrid.jsx     # Main Lobby Content
│   │   ├── GameGrid.css
│   │   ├── HUD.jsx          # Floating Buttons
│   │   ├── HUD.css
│   │   └── Modal.jsx        # Reusable Modal
│   └── views/               # New Pages for Tabs
│       ├── LobbyView.jsx
│       ├── ActivityView.jsx
│       ├── TaskView.jsx
│       └── ProfileView.jsx
└── assets/
```

## 4. UI Improvements & Logic

### 4.1 Fix "Gift Pack" Overlap
*   **Solution**: Adjust the `top` or `left` positioning of `.hud-left` in CSS. Move it slightly lower or check z-index stacking context to ensure it sits above game cards but below modals.

### 4.2 Page Switching (Tab System)
*   **State Management**: `activeTab` state in `App.jsx` ('lobby', 'activity', 'task', 'profile').
*   **Rendering**: Conditional rendering based on `activeTab`.
    *   `'lobby'`: Renders `<GameGrid />` + `<HUD />`.
    *   `'activity'`: Renders `<ActivityView />` (List of event banners).
    *   `'task'`: Renders `<TaskView />` (Daily/Weekly task list with progress bars).
    *   `'profile'`: Renders `<ProfileView />` (User stats, settings).

### 4.3 Component Logic
*   **Header**: Props for `balance`, `vipLevel`. Buy button triggers "Recharge" modal.
*   **HUD**: Only visible in 'Lobby' view. Triggers specific modals.
*   **Modal**: Global modal state or specific local states. Global is easier for this prototype level.

## 5. Implementation Steps
1.  **Scaffold**: Initialize Vite + React project.
2.  **Port Styles**: Move `style.css` content into component-specific CSS or a global `App.css`.
3.  **Components**: Create `Header`, `BottomNav`, `GameCard`.
4.  **Views**: Implement the placeholder views for Activities/Tasks to replace the alerts.
5.  **Integration**: Stitch everything in `App.jsx` with state for tabs and modals.
6.  **Verify**: Check overlap fix and navigation flow.
