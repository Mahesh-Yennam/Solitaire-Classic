# 🃏 Solitaire Classic (Klondike)

An elegant, responsive Klondike Solitaire web game built with pure vanilla JavaScript, modern CSS, and the Web Audio API. Play the world's most beloved single-player patience card game directly in any browser with zero installation.

Part of the [Gamility](https://mahesh-yennam.github.io/Gamility/) web games collection. Fully configured to run as an **independent standalone repository** or embedded directly within the Gamility portal.

---

## 📁 Repository Structure

```text
solitaire-classic/
├── index.html        # Game layout, casino felt table, semantic HTML & Schema.org JSON-LD
├── style.css         # Green velvet table, crisp vector cards, fluid drag & drop animations
├── game.js           # Klondike rules engine, Turn 1/Turn 3, autocomplete & Web Audio SFX
├── favicon.svg       # Ace of Spades & card deck vector SVG favicon
├── site.webmanifest  # Progressive Web App (PWA) manifest for mobile install
├── robots.txt        # Search engine crawler configuration
├── sitemap.xml       # Standalone XML sitemap
├── .gitignore        # Standard web gitignore
└── README.md         # Documentation & deployment guide
```

---

## 🎮 How to Play

- **Objective:** Build all four suits up from Ace to King into the 4 Foundation piles (Hearts ♥, Diamonds ♦, Clubs ♣, Spades ♠).
- **Tableau Rules:**
  - Build columns downward in **alternating colors** (e.g., Black 8 on Red 9, Red Queen on Black King).
  - Only a **King** (or a stack starting with a King) can be placed in an empty tableau column.
  - Cards can be moved individually or as valid sequential stacks.
- **Stock & Waste:**
  - Tap the Stock deck to draw cards to the Waste pile.
  - When the Stock is exhausted, tap the empty deck space to reset the waste cards back to the stock.
- **Controls & Shortcuts:**
  - **Drag & Drop:** Touch or click and drag cards to legal destinations.
  - **Click / Tap to Move:** Tap any face-up card to automatically send it to the best legal foundation or tableau column!
  - **Double-Click:** Instantly sends an eligible card directly to its foundation pile.
  - **Autocomplete:** When all hidden face-down cards have been revealed, an **Autocomplete** button appears to gracefully cascade all remaining cards to victory.
  - **Undo (`Ctrl + Z` / Button):** Unlimited move history stack.
  - **Hint (`H` / Button):** Highlights available legal moves.
  - **P:** Pause / Resume the game timer.

---

## ✨ Features

- **Draw 1 & Draw 3 Modes:** Switch between relaxing Turn 1 or strategic casino-standard Turn 3 rules anytime.
- **Pure Vanilla Web Tech:** Zero external frameworks or heavy libraries. Fast, responsive, and lightweight.
- **Web Audio Sound Effects:** Card slide whooshes, crisp card snap-to-table sounds, foundation chimes, and victory cascades synthesized natively via HTML5 `AudioContext`.
- **Winning Deal Detection & Celebration:** Classic bouncing card cascade celebration upon clearing the board.
- **Persistent Local Records:** Personal best scores, fastest winning times, and games won saved in browser `localStorage`.
- **Mobile First Touch Support:** Optimized for fingers on smartphones and tablets, with magnetic card positioning and responsive sizing.

---

## 📄 Copyright & Terms

Copyright © 2026 Gamility. All rights reserved.  
This repository and its source code are proprietary. Unauthorized copying, distribution, or commercial reuse without explicit permission is strictly prohibited.
