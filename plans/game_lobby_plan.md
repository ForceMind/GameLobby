# Game Lobby Prototype Plan

## 1. Project Overview
We will create a mobile-first responsive web prototype for a Game Lobby, mimicking the visual style of the provided screenshot (Deep Purple/Blue night theme, gold accents).
We will integrate the requested new features: **Activities**, **Tasks**, **Gift Packs**, and **Recharge Events**.

## 2. Technology Stack
*   **HTML5**: Semantic structure.
*   **CSS3**: Flexbox/Grid for layout, gradients for visual style, CSS shapes for placeholders.
*   **JavaScript (Vanilla)**: Handling UI interactions (navigation switching, modals for new features).

## 3. Directory Structure
```
/
├── index.html        # Main entry point
├── css/
│   └── style.css     # All styling
├── js/
│   └── app.js        # Interaction logic
└── assets/           # (Optional) Images if strictly needed, otherwise CSS generation
```

## 4. UI Layout & Design

### 4.1 Visual Theme
*   **Background**: Deep purple/blue vertical gradient (`linear-gradient(#2b1055, #7597de)`).
*   **Color Palette**:
    *   Primary Text: White `#ffffff`
    *   Gold Accent: `#ffd700` (Borders, VIP, Coins)
    *   Button Green: `#00e676` (Buy button)
    *   Hot Tag Red: `#ff3d00`
*   **Font**: System sans-serif (Arial/Roboto), bold weights for visibility.

### 4.2 Layout Sections

#### A. Header (Top Bar)
*   **Left**: User Avatar (Circle), User Name, VIP/Level Badge.
*   **Right**: Coin Balance (Pill shape), "BUY" Button (Green), Exit/Settings Icon.

#### B. Floating HUD (New Features - High Priority)
*   **Left Floating Button**: **Gift Packs (礼包)** - Animated or glowing icon.
*   **Right Floating Button**: **Recharge Events (充值活动)** - Near the balance/buy button.

#### C. Main Content (Game Grid)
*   **Scrollable Area**: Vertical scroll.
*   **Grid**: 2 columns wide (typical for mobile slots).
*   **Game Cards**: Square/Rounded rectangles.
    *   Image placeholder (CSS gradient).
    *   "HOT" badge on top-right for selected games.
    *   Game Title at bottom.
*   **Content**:
    *   Slot Games (e.g., "Dragon Era", "Buffalo", "Zeus").
    *   Casual Games (e.g., "Fishing", "Cards").

#### D. Bottom Navigation (New Features - Core Nav)
*   Fixed at the bottom.
*   **Tabs**:
    1.  **Lobby (大厅)** - Active by default.
    2.  **Activities (活动)** - Requested feature.
    3.  **Tasks (任务)** - Requested feature.
    4.  **Profile (我的)** - Standard app practice.

### 4.3 Interaction Logic (JS)
*   **Tab Switching**: Clicking bottom tabs updates the "active" state (visually) and could toggle the main content view (e.g., showing a list of tasks instead of games).
*   **Modals**: Clicking "Gift Packs" or "Recharge" should open a simple centered modal overlay explaining the feature.
*   **Buy Button**: Simulates a top-up action (e.g., balance increases or modal opens).

## 5. Implementation Steps
1.  **Setup**: Create files.
2.  **HTML Structure**: Build the containers for Header, Grid, HUD, and Bottom Nav.
3.  **CSS Styling**: Apply the "Night Sky" theme, grid layout, and specific button styles.
4.  **JavaScript**: Add click handlers for the nav bar and buttons to demonstrate functionality.
5.  **Refinement**: Polish the "Game Card" look to resemble the screenshot's high-quality art using CSS effects (shadows, borders).
