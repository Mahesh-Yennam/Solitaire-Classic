/**
 * Solitaire Classic (Klondike) - Core Game Engine
 * Pure Vanilla JavaScript & Synthesized Web Audio API
 */

(function () {
  'use strict';

  // --- Web Audio Synthesizer ---
  let audioCtx = null;
  let isMuted = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (isMuted || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;

      if (type === 'snap') {
        // Crisp card snap onto table
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'deal') {
        // Quick slide whoosh
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.06);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'foundation') {
        // Ascending harmonic chime
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.15, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.18);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.18);
        });
      } else if (type === 'undo') {
        // Low reverse chirp
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'victory') {
        // Triumphant Fanfare
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.22, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.4);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.4);
        });
      }
    } catch (e) {
      // Audio fallback
    }
  }

  // --- Card Constants ---
  const SUITS = [
    { name: 'hearts', symbol: '♥', color: 'red' },
    { name: 'diamonds', symbol: '♦', color: 'red' },
    { name: 'clubs', symbol: '♣', color: 'black' },
    { name: 'spades', symbol: '♠', color: 'black' }
  ];

  const RANK_LABELS = {
    1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
    7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K'
  };

  // --- Game State ---
  let stock = [];      // Cards face down in stock
  let waste = [];      // Cards face up in waste
  let foundations = [[], [], [], []]; // 4 suit piles
  let tableau = [[], [], [], [], [], [], []]; // 7 columns

  let drawMode = 1;    // 1 or 3
  let score = 0;
  let moves = 0;
  let timerSeconds = 0;
  let timerInterval = null;
  let isRunning = false;
  let isPaused = false;
  let isWon = false;
  let undoStack = [];

  let bestScore = parseInt(localStorage.getItem('solitaire_best_score') || '0', 10);

  // Dragging state
  let dragData = null;

  // DOM Elements
  const scoreVal = document.getElementById('scoreVal');
  const movesVal = document.getElementById('movesVal');
  const timerVal = document.getElementById('timerVal');
  const bestScoreVal = document.getElementById('bestScoreVal');
  const modeSubtitle = document.getElementById('modeSubtitle');

  const stockPile = document.getElementById('stockPile');
  const wastePile = document.getElementById('wastePile');
  const foundationSlots = [
    document.getElementById('foundation-0'),
    document.getElementById('foundation-1'),
    document.getElementById('foundation-2'),
    document.getElementById('foundation-3')
  ];
  const tableauColumns = [
    document.getElementById('tableau-0'),
    document.getElementById('tableau-1'),
    document.getElementById('tableau-2'),
    document.getElementById('tableau-3'),
    document.getElementById('tableau-4'),
    document.getElementById('tableau-5'),
    document.getElementById('tableau-6')
  ];

  const newGameBtn = document.getElementById('newGameBtn');
  const undoBtn = document.getElementById('undoBtn');
  const drawModeBtn = document.getElementById('drawModeBtn');
  const hintBtn = document.getElementById('hintBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const muteBtn = document.getElementById('muteBtn');
  const autoCompleteBtn = document.getElementById('autoCompleteBtn');

  const pauseOverlay = document.getElementById('pauseOverlay');
  const resumeBtn = document.getElementById('resumeBtn');
  const victoryOverlay = document.getElementById('victoryOverlay');
  const finalScoreEl = document.getElementById('finalScore');
  const finalMovesEl = document.getElementById('finalMoves');
  const finalTimeEl = document.getElementById('finalTime');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const victoryCanvas = document.getElementById('victoryCanvas');

  if (bestScoreVal) bestScoreVal.textContent = bestScore;

  // Initialize Pause Button State (Disabled before game start)
  if (pauseBtn) {
    pauseBtn.disabled = true;
    pauseBtn.style.opacity = '0.4';
    pauseBtn.style.pointerEvents = 'none';
  }

  // --- Deck Generator ---
  function createDeck() {
    const deck = [];
    let id = 1;
    for (const suit of SUITS) {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({
          id: id++,
          suit: suit.name,
          symbol: suit.symbol,
          color: suit.color,
          rank: rank,
          label: RANK_LABELS[rank],
          faceUp: false
        });
      }
    }
    return deck;
  }

  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // --- State Snapshot Serialization for Undo ---
  function saveSnapshot() {
    const snapshot = {
      stock: stock.map(c => ({ ...c })),
      waste: waste.map(c => ({ ...c })),
      foundations: foundations.map(pile => pile.map(c => ({ ...c }))),
      tableau: tableau.map(col => col.map(c => ({ ...c }))),
      score: score,
      moves: moves
    };
    undoStack.push(snapshot);
    if (undoStack.length > 50) undoStack.shift(); // Max 50 undos
  }

  function performUndo() {
    if (undoStack.length === 0 || isWon || isPaused) return;

    initAudio();
    playSound('undo');

    const prev = undoStack.pop();
    stock = prev.stock;
    waste = prev.waste;
    foundations = prev.foundations;
    tableau = prev.tableau;
    score = Math.max(0, prev.score - 15); // Small penalty for undo
    moves++;

    updateHUD();
    renderBoard();
  }

  // --- New Deal ---
  function startNewGame() {
    initAudio();
    playSound('deal');

    const deck = shuffle(createDeck());
    stock = [];
    waste = [];
    foundations = [[], [], [], []];
    tableau = [[], [], [], [], [], [], []];
    undoStack = [];
    score = 0;
    moves = 0;
    isWon = false;
    isRunning = true;
    isPaused = false;
    timerSeconds = 0;

    // Deal to Tableau
    // Col 0 gets 1, Col 1 gets 2... Col 6 gets 7
    let cardIdx = 0;
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck[cardIdx++];
        card.faceUp = (row === col); // Top card face up
        tableau[col].push(card);
      }
    }

    // Remaining cards go to Stock
    while (cardIdx < deck.length) {
      const card = deck[cardIdx++];
      card.faceUp = false;
      stock.push(card);
    }

    // Enable Pause Button
    if (pauseBtn) {
      pauseBtn.disabled = false;
      pauseBtn.innerHTML = '⏸️ Pause';
      pauseBtn.style.opacity = '1';
      pauseBtn.style.pointerEvents = 'auto';
    }

    pauseOverlay?.classList.add('hidden');
    victoryOverlay?.classList.add('hidden');
    victoryCanvas?.classList.add('hidden');
    autoCompleteBtn?.classList.add('hidden');

    startTimer();
    updateHUD();
    renderBoard();
  }

  // --- Timer Engine ---
  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!isRunning || isPaused || isWon) return;
      timerSeconds++;
      updateTimerDisplay();
    }, 1000);
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    if (!timerVal) return;
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    timerVal.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function updateHUD() {
    if (scoreVal) scoreVal.textContent = score;
    if (movesVal) movesVal.textContent = moves;
    if (bestScoreVal) bestScoreVal.textContent = bestScore;
    if (modeSubtitle) {
      modeSubtitle.textContent = `Klondike • Turn ${drawMode} Mode`;
    }
    if (drawModeBtn) {
      drawModeBtn.innerHTML = `<span>🎴</span> Draw ${drawMode}`;
    }
  }

  // --- Card Element Factory ---
  function createCardElement(card, sourceLocation) {
    const el = document.createElement('div');
    el.className = `solitaire-card ${card.faceUp ? card.color : 'face-down'}`;
    el.dataset.cardId = card.id;

    if (card.faceUp) {
      // Top corner index
      const topCorner = document.createElement('div');
      topCorner.className = 'card-corner-index';
      topCorner.innerHTML = `<span>${card.label}</span><span class="card-suit">${card.symbol}</span>`;
      el.appendChild(topCorner);

      // Center glyph
      const centerGlyph = document.createElement('div');
      centerGlyph.className = 'card-center-glyph';
      centerGlyph.textContent = card.symbol;
      el.appendChild(centerGlyph);

      // Bottom inverted corner index
      const bottomCorner = document.createElement('div');
      bottomCorner.className = 'card-bottom-index';
      bottomCorner.innerHTML = `<span>${card.label}</span><span class="card-suit">${card.symbol}</span>`;
      el.appendChild(bottomCorner);

      // Drag and Click Handlers
      el.draggable = true;
      el.addEventListener('dragstart', (e) => onDragStart(e, card, sourceLocation));
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onCardClick(card, sourceLocation);
      });
      el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        onCardDoubleClick(card, sourceLocation);
      });
    }

    return el;
  }

  // --- Rendering the Table ---
  function renderBoard() {
    // 1. Stock Pile
    if (stockPile) {
      stockPile.innerHTML = '';
      if (stock.length > 0) {
        const topStockCard = stock[stock.length - 1];
        const cardEl = createCardElement(topStockCard, { type: 'stock' });
        cardEl.style.top = '0';
        stockPile.appendChild(cardEl);
      } else {
        const emptyPlaceholder = document.createElement('div');
        emptyPlaceholder.className = 'slot-placeholder';
        emptyPlaceholder.textContent = '🔄';
        stockPile.appendChild(emptyPlaceholder);
      }
    }

    // 2. Waste Pile
    if (wastePile) {
      wastePile.innerHTML = '';
      if (waste.length > 0) {
        // Show up to top 3 cards in Turn 3 mode, with slight offset
        const startIndex = Math.max(0, waste.length - (drawMode === 3 ? 3 : 1));
        const visibleWaste = waste.slice(startIndex);

        visibleWaste.forEach((c, idx) => {
          const cardEl = createCardElement(c, { type: 'waste', index: startIndex + idx });
          cardEl.style.top = '0';
          cardEl.style.left = `${idx * 16}px`;
          wastePile.appendChild(cardEl);
        });
      }
    }

    // 3. Foundations
    foundations.forEach((pile, fIdx) => {
      const slotEl = foundationSlots[fIdx];
      if (!slotEl) return;
      slotEl.innerHTML = '';

      if (pile.length > 0) {
        const topCard = pile[pile.length - 1];
        const cardEl = createCardElement(topCard, { type: 'foundation', fIdx: fIdx });
        cardEl.style.top = '0';
        slotEl.appendChild(cardEl);
      } else {
        // Suit watermark
        const suitWatermark = document.createElement('div');
        const suit = SUITS[fIdx];
        suitWatermark.className = `slot-suit-watermark ${suit.color}-suit`;
        suitWatermark.textContent = suit.symbol;
        slotEl.appendChild(suitWatermark);
      }
    });

    // 4. Tableau Columns
    tableau.forEach((col, colIdx) => {
      const colEl = tableauColumns[colIdx];
      if (!colEl) return;
      colEl.innerHTML = '';

      let topOffset = 0;
      col.forEach((card, rowIdx) => {
        const cardEl = createCardElement(card, { type: 'tableau', col: colIdx, row: rowIdx });
        cardEl.style.top = `${topOffset}px`;
        colEl.appendChild(cardEl);

        // Face-down cards overlap more tightly than face-up cards
        topOffset += card.faceUp ? 26 : 14;
      });

      // Set min-height dynamically based on stack depth
      colEl.style.minHeight = `${Math.max(140, topOffset + 100)}px`;
    });

    // Check for Autocomplete readiness
    checkAutocompleteAvailable();
  }

  // --- Stock / Draw Logic ---
  stockPile?.addEventListener('click', () => {
    if (!isRunning || isPaused || isWon) return;
    initAudio();

    saveSnapshot();
    moves++;

    if (stock.length > 0) {
      playSound('deal');
      const countToDraw = Math.min(drawMode, stock.length);
      for (let i = 0; i < countToDraw; i++) {
        const card = stock.pop();
        card.faceUp = true;
        waste.push(card);
      }
    } else {
      // Recycle Waste into Stock
      if (waste.length > 0) {
        playSound('deal');
        while (waste.length > 0) {
          const card = waste.pop();
          card.faceUp = false;
          stock.push(card);
        }
        score = Math.max(0, score - 20); // Recycle penalty
      }
    }

    updateHUD();
    renderBoard();
  });

  // --- Rule Verification Logic ---
  function canPlaceOnFoundation(card, fIdx) {
    const pile = foundations[fIdx];
    const foundationSuit = SUITS[fIdx].name;

    if (card.suit !== foundationSuit) return false;

    if (pile.length === 0) {
      return card.rank === 1; // Must be Ace
    }

    const topCard = pile[pile.length - 1];
    return card.rank === topCard.rank + 1;
  }

  function canPlaceOnTableau(card, targetCol) {
    const colCards = tableau[targetCol];

    if (colCards.length === 0) {
      return card.rank === 13; // Only King on empty column
    }

    const targetTop = colCards[colCards.length - 1];
    return targetTop.faceUp && (card.color !== targetTop.color) && (card.rank === targetTop.rank - 1);
  }

  // --- Smart Move Logic (Click to Auto-Move) ---
  function onCardClick(card, sourceLocation) {
    if (!isRunning || isPaused || isWon) return;

    // Try moving to Foundations first (single card only)
    if (sourceLocation.type === 'waste' || (sourceLocation.type === 'tableau' && sourceLocation.row === tableau[sourceLocation.col].length - 1)) {
      for (let fIdx = 0; fIdx < 4; fIdx++) {
        if (canPlaceOnFoundation(card, fIdx)) {
          moveCardToFoundation(card, sourceLocation, fIdx);
          return;
        }
      }
    }

    // Try moving to Tableau
    for (let targetCol = 0; targetCol < 7; targetCol++) {
      if (sourceLocation.type === 'tableau' && sourceLocation.col === targetCol) continue;

      if (canPlaceOnTableau(card, targetCol)) {
        moveCardToTableau(card, sourceLocation, targetCol);
        return;
      }
    }
  }

  function onCardDoubleClick(card, sourceLocation) {
    if (!isRunning || isPaused || isWon) return;

    // Double-click fast-tracks to foundation
    for (let fIdx = 0; fIdx < 4; fIdx++) {
      if (canPlaceOnFoundation(card, fIdx)) {
        moveCardToFoundation(card, sourceLocation, fIdx);
        return;
      }
    }
  }

  // --- Execution of Valid Card Movements ---
  function moveCardToFoundation(card, sourceLocation, fIdx) {
    saveSnapshot();
    initAudio();
    playSound('foundation');

    if (sourceLocation.type === 'waste') {
      waste.pop();
      foundations[fIdx].push(card);
      score += 10;
    } else if (sourceLocation.type === 'tableau') {
      const colCards = tableau[sourceLocation.col];
      colCards.pop();
      foundations[fIdx].push(card);
      score += 15;

      // Flip top remaining card in tableau column if face down
      if (colCards.length > 0 && !colCards[colCards.length - 1].faceUp) {
        colCards[colCards.length - 1].faceUp = true;
        score += 5;
      }
    }

    moves++;
    updateHUD();
    renderBoard();
    checkWinCondition();
  }

  function moveCardToTableau(card, sourceLocation, targetCol) {
    saveSnapshot();
    initAudio();
    playSound('snap');

    if (sourceLocation.type === 'waste') {
      waste.pop();
      tableau[targetCol].push(card);
      score += 5;
    } else if (sourceLocation.type === 'tableau') {
      const srcColCards = tableau[sourceLocation.col];
      // Move all cards from row onwards (multi-card stack)
      const movingCards = srcColCards.splice(sourceLocation.row);
      tableau[targetCol].push(...movingCards);

      // Flip previous card in source column
      if (srcColCards.length > 0 && !srcColCards[srcColCards.length - 1].faceUp) {
        srcColCards[srcColCards.length - 1].faceUp = true;
        score += 5;
      }
    } else if (sourceLocation.type === 'foundation') {
      foundations[sourceLocation.fIdx].pop();
      tableau[targetCol].push(card);
      score = Math.max(0, score - 15); // Penalty for taking off foundation
    }

    moves++;
    updateHUD();
    renderBoard();
  }

  // --- Drag and Drop Implementation ---
  function onDragStart(e, card, sourceLocation) {
    if (!isRunning || isPaused || isWon) {
      e.preventDefault();
      return;
    }

    initAudio();
    dragData = { card, sourceLocation };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id.toString());
  }

  // Setup Drop Targets
  function initDropTargets() {
    // Foundation drop zones
    foundationSlots.forEach((slot, fIdx) => {
      slot.addEventListener('dragover', (e) => {
        if (!dragData) return;
        if (canPlaceOnFoundation(dragData.card, fIdx)) {
          e.preventDefault();
          slot.classList.add('drag-over');
        }
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        if (!dragData) return;
        if (canPlaceOnFoundation(dragData.card, fIdx)) {
          moveCardToFoundation(dragData.card, dragData.sourceLocation, fIdx);
        }
        dragData = null;
      });
    });

    // Tableau drop zones
    tableauColumns.forEach((colEl, targetCol) => {
      colEl.addEventListener('dragover', (e) => {
        if (!dragData) return;
        if (canPlaceOnTableau(dragData.card, targetCol)) {
          e.preventDefault();
          colEl.classList.add('drag-over');
        }
      });
      colEl.addEventListener('dragleave', () => colEl.classList.remove('drag-over'));
      colEl.addEventListener('drop', (e) => {
        e.preventDefault();
        colEl.classList.remove('drag-over');
        if (!dragData) return;
        if (canPlaceOnTableau(dragData.card, targetCol)) {
          moveCardToTableau(dragData.card, dragData.sourceLocation, targetCol);
        }
        dragData = null;
      });
    });
  }

  // --- Autocomplete Solver ---
  function checkAutocompleteAvailable() {
    if (isWon) return;

    // Check if any face-down cards remain in tableau
    let hasFaceDownCards = false;
    for (const col of tableau) {
      for (const card of col) {
        if (!card.faceUp) {
          hasFaceDownCards = true;
          break;
        }
      }
      if (hasFaceDownCards) break;
    }

    // Ready for autocomplete if all tableau cards are face-up and stock/waste are resolved
    if (!hasFaceDownCards && stock.length === 0 && waste.length === 0) {
      autoCompleteBtn?.classList.remove('hidden');
    } else {
      autoCompleteBtn?.classList.add('hidden');
    }
  }

  function runAutocomplete() {
    if (isWon) return;

    // Find next eligible card that can go to a foundation
    let movedAny = false;

    for (let colIdx = 0; colIdx < 7; colIdx++) {
      const col = tableau[colIdx];
      if (col.length === 0) continue;

      const topCard = col[col.length - 1];
      for (let fIdx = 0; fIdx < 4; fIdx++) {
        if (canPlaceOnFoundation(topCard, fIdx)) {
          moveCardToFoundation(topCard, { type: 'tableau', col: colIdx, row: col.length - 1 }, fIdx);
          movedAny = true;
          break;
        }
      }
      if (movedAny) break;
    }

    if (movedAny && !isWon) {
      setTimeout(runAutocomplete, 80);
    }
  }

  // --- Hint System ---
  function showHint() {
    if (!isRunning || isPaused || isWon) return;
    initAudio();

    // Check waste card to foundation
    if (waste.length > 0) {
      const topWaste = waste[waste.length - 1];
      for (let fIdx = 0; fIdx < 4; fIdx++) {
        if (canPlaceOnFoundation(topWaste, fIdx)) {
          highlightCard(topWaste.id);
          return;
        }
      }
      for (let colIdx = 0; colIdx < 7; colIdx++) {
        if (canPlaceOnTableau(topWaste, colIdx)) {
          highlightCard(topWaste.id);
          return;
        }
      }
    }

    // Check tableau cards
    for (let colIdx = 0; colIdx < 7; colIdx++) {
      const col = tableau[colIdx];
      for (let rowIdx = 0; rowIdx < col.length; rowIdx++) {
        const card = col[rowIdx];
        if (!card.faceUp) continue;

        // Try foundation
        if (rowIdx === col.length - 1) {
          for (let fIdx = 0; fIdx < 4; fIdx++) {
            if (canPlaceOnFoundation(card, fIdx)) {
              highlightCard(card.id);
              return;
            }
          }
        }

        // Try tableau
        for (let targetCol = 0; targetCol < 7; targetCol++) {
          if (targetCol === colIdx) continue;
          if (canPlaceOnTableau(card, targetCol)) {
            // Avoid pointlessly moving King to another empty column
            if (card.rank === 13 && rowIdx === 0 && tableau[targetCol].length === 0) continue;
            highlightCard(card.id);
            return;
          }
        }
      }
    }

    // If stock has cards, hint stock
    if (stock.length > 0 || waste.length > 0) {
      stockPile?.classList.add('drag-over');
      setTimeout(() => stockPile?.classList.remove('drag-over'), 1200);
    }
  }

  function highlightCard(cardId) {
    const el = document.querySelector(`.solitaire-card[data-card-id="${cardId}"]`);
    if (el) {
      el.classList.add('hint-highlight');
      setTimeout(() => el.classList.remove('hint-highlight'), 1400);
    }
  }

  // --- Victory Detection & Cascade Celebration ---
  function checkWinCondition() {
    const totalInFoundations = foundations.reduce((sum, p) => sum + p.length, 0);
    if (totalInFoundations === 52) {
      triggerVictory();
    }
  }

  function triggerVictory() {
    isWon = true;
    isRunning = false;
    clearInterval(timerInterval);
    playSound('victory');

    // Disable Pause Button on Game Over / Victory
    if (pauseBtn) {
      pauseBtn.disabled = true;
      pauseBtn.innerHTML = '⏸️ Pause';
      pauseBtn.style.opacity = '0.4';
      pauseBtn.style.pointerEvents = 'none';
    }

    // Time Bonus
    const timeBonus = Math.max(0, 700 - timerSeconds * 2);
    score += timeBonus;

    // Save records
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('solitaire_best_score', bestScore.toString());
      if (bestScoreVal) bestScoreVal.textContent = bestScore;
    }

    // Populate Victory Overlay
    if (finalScoreEl) finalScoreEl.textContent = score;
    if (finalMovesEl) finalMovesEl.textContent = moves;
    if (finalTimeEl) {
      const mins = Math.floor(timerSeconds / 60);
      const secs = timerSeconds % 60;
      finalTimeEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    startVictoryCascade();
    setTimeout(() => {
      victoryOverlay?.classList.remove('hidden');
    }, 1200);
  }

  // Classic Card Cascade Animation
  function startVictoryCascade() {
    if (!victoryCanvas) return;
    victoryCanvas.classList.remove('hidden');

    const rect = victoryCanvas.parentElement.getBoundingClientRect();
    victoryCanvas.width = rect.width;
    victoryCanvas.height = rect.height;

    const ctx = victoryCanvas.getContext('2d');
    const bouncingCards = [];
    const suits = ['♥', '♦', '♣', '♠'];
    const colors = ['#dc2626', '#dc2626', '#0f172a', '#0f172a'];

    // Spawn 52 bouncing cards
    for (let i = 0; i < 52; i++) {
      const sIdx = i % 4;
      bouncingCards.push({
        x: Math.random() * (rect.width - 60),
        y: Math.random() * -100,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2,
        gravity: 0.35,
        bounce: -0.85,
        symbol: suits[sIdx],
        color: colors[sIdx],
        rank: RANK_LABELS[(i % 13) + 1]
      });
    }

    let animId;
    function renderCascade() {
      ctx.clearRect(0, 0, victoryCanvas.width, victoryCanvas.height);

      for (const card of bouncingCards) {
        card.vy += card.gravity;
        card.x += card.vx;
        card.y += card.vy;

        // Ground bounce
        if (card.y + 60 >= victoryCanvas.height) {
          card.y = victoryCanvas.height - 60;
          card.vy *= card.bounce;
        }

        // Draw card
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(card.x, card.y, 45, 60, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = card.color;
        ctx.font = 'bold 12px Outfit, sans-serif';
        ctx.fillText(card.rank, card.x + 6, card.y + 16);
        ctx.font = '16px Outfit, sans-serif';
        ctx.fillText(card.symbol, card.x + 16, card.y + 36);
      }

      if (isWon) {
        animId = requestAnimationFrame(renderCascade);
      }
    }

    renderCascade();
  }

  // --- Pause & Mute Toggles ---
  function togglePause() {
    if (!isRunning || isWon) return;
    isPaused = !isPaused;

    if (isPaused) {
      pauseOverlay?.classList.remove('hidden');
      if (pauseBtn) pauseBtn.innerHTML = '▶️ Resume';
    } else {
      pauseOverlay?.classList.add('hidden');
      if (pauseBtn) pauseBtn.innerHTML = '⏸️ Pause';
    }
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (muteBtn) {
      muteBtn.innerHTML = isMuted ? '🔇 Muted' : '🔊 Sound';
    }
  }

  // --- Keyboard Shortcuts ---
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP') {
      e.preventDefault();
      togglePause();
    } else if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      performUndo();
    } else if (e.code === 'KeyH') {
      e.preventDefault();
      showHint();
    } else if (e.code === 'KeyN') {
      e.preventDefault();
      startNewGame();
    }
  });

  // --- Event Bindings ---
  newGameBtn?.addEventListener('click', startNewGame);
  playAgainBtn?.addEventListener('click', startNewGame);
  undoBtn?.addEventListener('click', performUndo);
  hintBtn?.addEventListener('click', showHint);
  pauseBtn?.addEventListener('click', togglePause);
  resumeBtn?.addEventListener('click', togglePause);
  muteBtn?.addEventListener('click', toggleMute);

  drawModeBtn?.addEventListener('click', () => {
    drawMode = (drawMode === 1) ? 3 : 1;
    startNewGame();
  });

  autoCompleteBtn?.addEventListener('click', runAutocomplete);

  // Initialize
  initDropTargets();
  startNewGame();
})();
