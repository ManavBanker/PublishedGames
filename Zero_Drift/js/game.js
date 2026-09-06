/* -------------------------------------------------------------------------
   GAME ENGINE LOGIC, CONTROLLERS & RENDERING
   ------------------------------------------------------------------------- */
"use strict";

const LOCAL_LEVELS = [
  {
    name: "First Steps",
    startVal: 10,
    grid: [
      ['W', 'W', 'W', 'W', 'W', 'W'],
      ['W', 'S', '.', '-10', '.', 'W'],
      ['W', '.', '.', 'W', '.', 'W'],
      ['W', '.', '.', 'E', '.', 'W'],
      ['W', '.', 'W', '.', '.', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W']
    ]
  },
  {
    name: "Double Down",
    startVal: 5,
    grid: [
      ['W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ['W', 'S', '.', '*2', '.', '.', 'W'],
      ['W', 'W', '.', '.', '.', '.', 'W'],
      ['W', '.', '.', '.', 'E', 'W', 'W'],
      ['W', '.', '.', '.', '.', '.', 'W'],
      ['W', '.', '.', '-10', '.', '.', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W']
    ]
  },
  {
    name: "The Grid Divide",
    startVal: 12,
    grid: [
      ['W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ['W', 'S', '.', '/2', '.', '.', 'W'],
      ['W', 'W', '.', '.', '.', '.', 'W'],
      ['W', '.', '.', '.', 'E', 'W', 'W'],
      ['W', '.', '.', '.', '.', '.', 'W'],
      ['W', '.', '.', '-6', '.', '.', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W']
    ]
  },
  {
    name: "Triple Threat",
    startVal: 3,
    grid: [
      ['W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ['W', 'S', '.', '*3', '.', '.', 'W'],
      ['W', 'W', '.', '.', '.', '.', 'W'],
      ['W', '.', '.', '.', 'E', 'W', 'W'],
      ['W', '.', '.', '.', '.', '.', 'W'],
      ['W', '.', '.', '-9', '.', '.', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W']
    ]
  },
  {
    name: "The Compound",
    startVal: 8,
    grid: [
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ['W', 'S', '.', '+4', '.', '.', '.', 'W'],
      ['W', 'W', '.', '.', '.', '.', '.', 'W'],
      ['W', '.', '.', '.', '.', 'E', 'W', 'W'],
      ['W', '.', '.', '.', '.', '.', '*2', 'W'],
      ['W', '.', '.', '.', '.', '.', '.', 'W'],
      ['W', '.', '.', '-24', '.', '.', '.', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W']
    ]
  },
  {
    name: "Absolute Zero",
    startVal: 15,
    grid: [
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ['W', 'S', '.', '/3', '.', '.', '.', 'W'],
      ['W', 'W', '.', '.', '.', '.', '.', 'W'],
      ['W', '.', '.', '.', '.', 'E', 'W', 'W'],
      ['W', '.', '.', '.', '.', '.', '*12', 'W'],
      ['W', '.', '.', '.', '.', '.', '.', 'W'],
      ['W', '.', '.', '-60', '.', '.', '.', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W']
    ]
  }
];

let LEVELS = [...LOCAL_LEVELS];

let state = {
  currentLevelIdx: 0,
  gameState: 'MENU',
  soundOn: true,
  bestMoves: {},
  unlockedLevel: 0,
  demoMode: false,
  levelGrid: [],
  startVal: 0,
  moves: 0,
  player: {
    gridX: 0,
    gridY: 0,
    currentX: 0,
    currentY: 0,
    value: 0,
    isSliding: false,
    slidePath: [],
    pathIndex: 0,
    targetGridX: 0,
    targetGridY: 0
  },
  particles: [],
  scale: 1.0,
  panX: 0.0,
  panY: 0.0,
  isPanToolActive: false
};

let activeTouches = {};

async function fetchRemoteLevels() {
  try {
    const response = await fetch("levels.json");
    if (!response.ok) throw new Error("Server response negative.");

    const rawText = await response.text();
    const cleanText = rawText
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "")
      .trim();

    const parsedLevels = JSON.parse(cleanText);
    if (Array.isArray(parsedLevels) && parsedLevels.length > 0) {
      LEVELS = parsedLevels;
      console.log("Zero Drift remote levels fetched successfully.");
    }
  } catch (e) {
    console.warn("Using local fallback levels:", e);
  }
}

function loadProgress() {
  try {
    const saved = localStorage.getItem('sk_zero_drift_save_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      state.unlockedLevel = parsed.unlockedLevel || 0;
      state.bestMoves = parsed.bestMoves || {};
      state.soundOn = parsed.soundOn !== undefined ? parsed.soundOn : true;
      AudioEngine.enabled = state.soundOn;
    }
  } catch (e) {
    console.error(e);
  }
}

function saveProgress() {
  try {
    localStorage.setItem('sk_zero_drift_save_v1', JSON.stringify({
      unlockedLevel: state.unlockedLevel,
      bestMoves: state.bestMoves,
      soundOn: state.soundOn
    }));
  } catch (e) {
    console.error(e);
  }
}

function resetTransformations() {
  state.scale = 1.0;
  state.panX = 0;
  state.panY = 0;
}

function loadLevel(idx) {
  if (idx < 0 || idx >= LEVELS.length) return;
  state.currentLevelIdx = idx;
  const rawLevel = LEVELS[idx];
  state.startVal = rawLevel.startVal;
  
  state.levelGrid = rawLevel.grid.map(row => [...row]);
  state.moves = 0;
  state.gameState = 'PLAYING';
  state.demoMode = false;
  state.particles = [];
  resetTransformations();

  let foundStart = false;
  for (let r = 0; r < state.levelGrid.length; r++) {
    for (let c = 0; c < state.levelGrid[r].length; c++) {
      if (state.levelGrid[r][c] === 'S') {
        state.player.gridX = c;
        state.player.gridY = r;
        state.player.currentX = c;
        state.player.currentY = r;
        foundStart = true;
      }
    }
  }

  state.player.value = rawLevel.startVal;
  state.player.isSliding = false;
  state.player.slidePath = [];
  state.player.pathIndex = 0;

  updateUI();
  hideAllOverlays();
}

function isOperator(cell) {
  if (!cell) return false;
  return cell.startsWith('+') || cell.startsWith('-') || cell.startsWith('*') || cell.startsWith('/');
}

function applyMath(current, cell) {
  const op = cell.charAt(0);
  const val = parseInt(cell.substring(1), 10);
  if (isNaN(val)) return current;
  switch (op) {
    case '+': return current + val;
    case '-': return current - val;
    case '*': return current * val;
    case '/': return Math.floor(current / val);
  }
  return current;
}

function handleSlide(dx, dy) {
  if (state.gameState !== 'PLAYING') return;
  if (state.player.isSliding) return;

  let path = [];
  let cx = state.player.gridX;
  let cy = state.player.gridY;
  let currentVal = state.player.value;
  const grid = state.levelGrid;
  const h = grid.length;
  const w = grid[0].length;

  while (true) {
    let nx = cx + dx;
    let ny = cy + dy;

    if (nx < 0 || nx >= w || ny < 0 || ny >= h) break;
    if (grid[ny][nx] === 'W') break;

    cx = nx;
    cy = ny;

    let stepData = { x: cx, y: cy, opApplied: null, valAfter: currentVal };
    let tile = grid[cy][cx];

    if (isOperator(tile)) {
      currentVal = applyMath(currentVal, tile);
      stepData.opApplied = tile;
      stepData.valAfter = currentVal;
    }

    path.push(stepData);

    if (tile === 'E') {
      let nxtX = cx + dx;
      let nxtY = cy + dy;
      const outOfBounds = nxtX < 0 || nxtX >= w || nxtY < 0 || nxtY >= h;
      if (outOfBounds || grid[nxtY][nxtX] === 'W') {
        break;
      }
    }
  }

  if (path.length > 0) {
    state.player.isSliding = true;
    state.player.slidePath = path;
    state.player.pathIndex = 0;
    state.player.targetGridX = cx;
    state.player.targetGridY = cy;
    state.moves++;
    updateUI();
    AudioEngine.playSlide();
  }
}

function checkSlideEndState() {
  const finalVal = state.player.value;
  const cell = state.levelGrid[state.player.gridY][state.player.gridX];

  if (finalVal < 0 || finalVal > 99) {
    triggerFail("Your block value went out of bounds (0-99)!");
    return;
  }

  if (cell === 'E') {
    if (finalVal === 0) {
      triggerVictory();
    } else {
      triggerFail("Stopped on exit, but mathematical value is not exactly 0!");
    }
  }
}

function triggerFail(msg) {
  state.gameState = 'GAMEOVER';
  AudioEngine.playFail();
  spawnFailExplosion(state.player.gridX, state.player.gridY);
  document.getElementById('sk_fail_msg').innerText = msg;
  document.getElementById('sk_overlay_gameover').classList.remove('sk_hidden');
}

function triggerVictory() {
  AudioEngine.playClear();
  spawnWinFireworks();

  const best = state.bestMoves[state.currentLevelIdx];
  if (!best || state.moves < best) {
    state.bestMoves[state.currentLevelIdx] = state.moves;
  }

  if (state.currentLevelIdx === state.unlockedLevel && state.unlockedLevel < LEVELS.length - 1) {
    state.unlockedLevel++;
  }

  saveProgress();

  if (state.currentLevelIdx >= LEVELS.length - 1) {
    state.gameState = 'COMPLETED';
    document.getElementById('sk_overlay_game_win').classList.remove('sk_hidden');
  } else {
    state.gameState = 'VICTORY';
    document.getElementById('sk_overlay_victory').classList.remove('sk_hidden');
  }
}

let demoTimer = null;
function startDemo() {
  loadLevel(0);
  state.demoMode = true;
  hideAllOverlays();
  
  const demoMoves = [
    {dx: 1, dy: 0},
    {dx: 0, dy: 1},
    {dx: -1, dy: 0},
    {dx: 0, dy: -1}
  ];
  let step = 0;

  function playNext() {
    if (!state.demoMode) return;
    if (step < demoMoves.length) {
      handleSlide(demoMoves[step].dx, demoMoves[step].dy);
      step++;
      demoTimer = setTimeout(playNext, 1200);
    }
  }

  demoTimer = setTimeout(playNext, 600);
}

function cancelDemo() {
  if (state.demoMode) {
    state.demoMode = false;
    clearTimeout(demoTimer);
    loadLevel(state.currentLevelIdx);
  }
}

function togglePause() {
  if (state.gameState === 'PLAYING') {
    state.gameState = 'PAUSED';
    document.getElementById('sk_overlay_paused').classList.remove('sk_hidden');
    document.getElementById('sk_btn_pause').innerText = "▶ Resume";
  } else if (state.gameState === 'PAUSED') {
    state.gameState = 'PLAYING';
    document.getElementById('sk_overlay_paused').classList.add('sk_hidden');
    document.getElementById('sk_btn_pause').innerText = "Pause";
  }
}

const canvas = document.getElementById('sk_game_canvas');
const ctx = canvas.getContext('2d');

function spawnOpParticles(gx, gy, opStr) {
  const cellSize = canvas.width / state.levelGrid[0].length;
  const px = (gx + 0.5) * cellSize;
  const py = (gy + 0.5) * cellSize;
  
  let color = '#0ea5e9';
  if (opStr.startsWith('-')) color = '#f43f5e';
  if (opStr.startsWith('*')) color = '#8b5cf6';
  if (opStr.startsWith('/')) color = '#10b981';

  for (let i = 0; i < 8; i++) {
    state.particles.push({
      x: px,
      y: py,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 4 - 2,
      life: 1.0,
      decay: 0.03,
      text: opStr,
      color: color,
      size: Math.random() * 8 + 14
    });
  }
}

function spawnFailExplosion(gx, gy) {
  const cellSize = canvas.width / state.levelGrid[0].length;
  const px = (gx + 0.5) * cellSize;
  const py = (gy + 0.5) * cellSize;

  for (let i = 0; i < 20; i++) {
    state.particles.push({
      x: px,
      y: py,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1.0,
      decay: 0.04,
      text: '💥',
      color: '#f43f5e',
      size: Math.random() * 10 + 12
    });
  }
}

function spawnWinFireworks() {
  for (let k = 0; k < 3; k++) {
    setTimeout(() => {
      const px = Math.random() * canvas.width;
      const py = Math.random() * canvas.height;
      for (let i = 0; i < 20; i++) {
        state.particles.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 1.0,
          decay: 0.03,
          text: Math.random() > 0.5 ? '★' : '✨',
          color: `hsl(${Math.random() * 360}, 100%, 70%)`,
          size: Math.random() * 12 + 12
        });
      }
    }, k * 200);
  }
}

function updateParticles() {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    let p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

function drawGame() {
  if (!state.levelGrid.length) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(state.panX, state.panY);
  ctx.scale(state.scale, state.scale);

  const cols = state.levelGrid[0].length;
  const rows = state.levelGrid.length;
  const cellSize = canvas.width / cols;

  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = state.levelGrid[r][c];
      const tx = c * cellSize;
      const ty = r * cellSize;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(tx + 2, ty + 2, cellSize - 4, cellSize - 4);

      if (tile === 'W') {
        ctx.fillStyle = '#475569';
        ctx.fillRect(tx + 2, ty + 2, cellSize - 4, cellSize - 4);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.strokeRect(tx + 5, ty + 5, cellSize - 10, cellSize - 10);
      } else if (tile === 'E') {
        const cx = tx + cellSize / 2;
        const cy = ty + cellSize / 2;
        const rad = (cellSize / 2) * (0.6 + Math.sin(Date.now() / 150) * 0.08);
        
        let grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(1, '#ca8a04');

        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.fillStyle = '#854d0e';
        ctx.font = `bold ${Math.floor(cellSize * 0.25)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("EXIT", cx, cy);
      } else if (isOperator(tile)) {
        const cx = tx + cellSize / 2;
        const cy = ty + cellSize / 2;
        
        let color = '#38bdf8';
        if (tile.startsWith('-')) color = '#fda4af';
        if (tile.startsWith('*')) color = '#c084fc';
        if (tile.startsWith('/')) color = '#34d399';

        ctx.beginPath();
        ctx.arc(cx, cy, cellSize * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${Math.floor(cellSize * 0.28)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tile, cx, cy);
      }
    }
  }

  let px = state.player.currentX * cellSize;
  let py = state.player.currentY * cellSize;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(px + 6, py + 6, cellSize - 12, cellSize - 12);
  ctx.restore();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(px + 8, py + 8, cellSize - 16, cellSize - 16);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.floor(cellSize * 0.35)}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.player.value, px + cellSize / 2, py + cellSize / 2);

  updateParticles();
  state.particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.font = `bold ${p.size}px system-ui`;
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  });

  ctx.restore();

  if (state.demoMode) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(0, 0, canvas.width, 35);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const alpha = 0.5 + Math.sin(Date.now() / 150) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillText("DEMO WATCH MODE - INTERRUPT TO PLAY", canvas.width / 2, 17);
  }
}

function updateAnimationStep() {
  if (state.gameState === 'PAUSED') return;
  if (state.player.isSliding && state.player.slidePath.length > 0) {
    const node = state.player.slidePath[state.player.pathIndex];
    const dx = node.x - state.player.currentX;
    const dy = node.y - state.player.currentY;
    const dist = Math.hypot(dx, dy);
    const speed = 0.25;

    if (dist < 0.05) {
      state.player.currentX = node.x;
      state.player.currentY = node.y;

      if (node.opApplied) {
        state.player.value = node.valAfter;
        AudioEngine.playOp();
        spawnOpParticles(node.x, node.y, node.opApplied);
        updateUI();
      }

      state.player.pathIndex++;
      if (state.player.pathIndex >= state.player.slidePath.length) {
        state.player.isSliding = false;
        state.player.gridX = state.player.targetGridX;
        state.player.gridY = state.player.targetGridY;
        checkSlideEndState();
      }
    } else {
      state.player.currentX += (dx / dist) * Math.min(speed, dist);
      state.player.currentY += (dy / dist) * Math.min(speed, dist);
    }
  }
}

function loop() {
  updateAnimationStep();
  drawGame();
  requestAnimationFrame(loop);
}

function updateUI() {
  document.getElementById('sk_hud_level').innerText = state.currentLevelIdx + 1;
  document.getElementById('sk_hud_value').innerText = state.player.value;
  document.getElementById('sk_hud_moves').innerText = state.moves;
}

function hideAllOverlays() {
  document.getElementById('sk_overlay_start').classList.add('sk_hidden');
  document.getElementById('sk_overlay_gameover').classList.add('sk_hidden');
  document.getElementById('sk_overlay_victory').classList.add('sk_hidden');
  document.getElementById('sk_overlay_game_win').classList.add('sk_hidden');
  document.getElementById('sk_overlay_paused').classList.add('sk_hidden');
}

function togglePopup(id, open) {
  const el = document.getElementById(id);
  if (open) {
    document.querySelectorAll('.sk_popup').forEach(p => p.classList.add('sk_hidden'));
    el.classList.remove('sk_hidden');
    if (id === 'sk_popup_levels') renderLevelsPopup();
    if (id === 'sk_popup_scores') renderScoresPopup();
  } else {
    el.classList.add('sk_hidden');
  }
}

function renderLevelsPopup() {
  const grid = document.getElementById('sk_levels_grid');
  grid.innerHTML = '';
  
  LEVELS.forEach((lvl, idx) => {
    const btn = document.createElement('button');
    btn.className = 'sk_level_btn';
    
    const isUnlocked = idx <= state.unlockedLevel;
    if (isUnlocked) {
      btn.innerText = idx + 1;
      btn.addEventListener('click', () => {
        loadLevel(idx);
        togglePopup('sk_popup_levels', false);
      });
    } else {
      btn.className = 'sk_level_btn sk_level_locked';
      btn.innerText = '🔒';
    }
    grid.appendChild(btn);
  });
}

function renderScoresPopup() {
  const container = document.getElementById('sk_scores_body');
  container.innerHTML = '';
  
  LEVELS.forEach((lvl, idx) => {
    const p = document.createElement('p');
    const best = state.bestMoves[idx];
    const bestStr = best ? `${best} moves` : 'Not completed yet';
    const status = idx <= state.unlockedLevel ? 'Unlocked' : 'Locked';
    p.innerHTML = `Level ${idx + 1} (${lvl.name}): <span class="sk_badge">${bestStr}</span> <i style="font-size:11px; color:#64748b;">${status}</i>`;
    container.appendChild(p);
  });
}

function handleResize() {
  const container = document.getElementById('sk_canvas_container');
  const size = Math.min(container.clientWidth, container.clientHeight, 500);
  canvas.width = size;
  canvas.height = size;
}

function openDrawer() {
  document.getElementById('sk_side_drawer').classList.remove('sk_drawer_closed');
  document.getElementById('sk_drawer_overlay').classList.remove('sk_hidden');
}

function closeDrawer() {
  document.getElementById('sk_side_drawer').classList.add('sk_drawer_closed');
  document.getElementById('sk_drawer_overlay').classList.add('sk_hidden');
}

let touchStartX = 0;
let touchStartY = 0;
let touchStartDistance = 0;
let touchStartScale = 1;
let touchStartPanX = 0;
let touchStartPanY = 0;
let isPinching = false;
let lastTapTime = 0;
let longPressTimer = null;

canvas.addEventListener('touchstart', (e) => {
  if (state.demoMode) { cancelDemo(); return; }

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    activeTouches[t.identifier] = { x: t.clientX, y: t.clientY };
  }

  if (e.touches.length === 1) {
    const singleTouch = e.touches[0];
    touchStartX = singleTouch.clientX;
    touchStartY = singleTouch.clientY;
    touchStartPanX = state.panX;
    touchStartPanY = state.panY;

    longPressTimer = setTimeout(() => {
      if (!state.player.isSliding) {
        loadLevel(state.currentLevelIdx);
        AudioEngine.playClear();
      }
    }, 700);
  }

  if (e.touches.length === 2) {
    isPinching = true;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    touchStartDistance = Math.hypot(dx, dy);
    touchStartScale = state.scale;

    touchStartPanX = state.panX;
    touchStartPanY = state.panY;
    touchStartX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    touchStartY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
  }
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1) {
    const singleTouch = e.touches[0];
    const dx = singleTouch.clientX - touchStartX;
    const dy = singleTouch.clientY - touchStartY;

    if (Math.hypot(dx, dy) > 10) {
      clearTimeout(longPressTimer);
    }

    if (state.isPanToolActive) {
      state.panX = touchStartPanX + dx;
      state.panY = touchStartPanY + dy;
      return;
    }
  }

  if (e.touches.length === 2 && isPinching) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.hypot(dx, dy);

    if (distance > 5) {
      const factor = distance / touchStartDistance;
      state.scale = Math.max(0.5, Math.min(touchStartScale * factor, 3.0));
      
      const currentMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const currentMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      state.panX = currentMidX - (touchStartX - touchStartPanX) * (state.scale / touchStartScale);
      state.panY = currentMidY - (touchStartY - touchStartPanY) * (state.scale / touchStartScale);
    }
  }
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  clearTimeout(longPressTimer);

  if (e.touches.length === 0) {
    const now = Date.now();
    const tapDuration = now - lastTapTime;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dist = Math.hypot(endX - touchStartX, endY - touchStartY);

    if (dist < 15) {
      if (tapDuration < 300) {
        resetTransformations();
        lastTapTime = 0;
        return;
      }
      lastTapTime = now;
    }

    if (!state.isPanToolActive && !isPinching) {
      const dx = endX - touchStartX;
      const dy = endY - touchStartY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) > 25 && state.gameState === 'PLAYING') {
        if (absX > absY) {
          handleSlide(dx > 0 ? 1 : -1, 0);
        } else {
          handleSlide(0, dy > 0 ? 1 : -1);
        }
      }
    }
  }

  if (e.touches.length < 2) {
    isPinching = false;
  }

  for (let i = 0; i < e.changedTouches.length; i++) {
    delete activeTouches[e.changedTouches[i].identifier];
  }
}, { passive: true });

canvas.addEventListener('touchcancel', (e) => {
  clearTimeout(longPressTimer);
  isPinching = false;
  for (let i = 0; i < e.changedTouches.length; i++) {
    delete activeTouches[e.changedTouches[i].identifier];
  }
}, { passive: true });

let isMouseDown = false;
let mouseStartX = 0;
let mouseStartY = 0;

canvas.addEventListener('mousedown', (e) => {
  if (state.isPanToolActive) {
    isMouseDown = true;
    mouseStartX = e.clientX - state.panX;
    mouseStartY = e.clientY - state.panY;
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isMouseDown && state.isPanToolActive) {
    state.panX = e.clientX - mouseStartX;
    state.panY = e.clientY - mouseStartY;
  }
});

window.addEventListener('mouseup', () => {
  isMouseDown = false;
});

window.addEventListener('keydown', (e) => {
  if (state.demoMode) {
    cancelDemo();
    return;
  }

  if (e.ctrlKey && (e.key === '=' || e.key === '+' || e.code === 'Equal')) {
    e.preventDefault();
    zoomCanvas(1.1);
    return;
  }
  if (e.ctrlKey && (e.key === '-' || e.code === 'Minus')) {
    e.preventDefault();
    zoomCanvas(0.9);
    return;
  }

  if (state.gameState === 'MENU') {
    if (e.key === 'Enter') {
      loadLevel(0);
      return;
    }
  }

  if (state.gameState === 'GAMEOVER') {
    if (e.key === 'r' || e.key === 'R') {
      loadLevel(state.currentLevelIdx);
      return;
    }
  }

  if (state.gameState === 'VICTORY') {
    if (e.key === 'Enter') {
      loadLevel(state.currentLevelIdx + 1);
      return;
    }
  }

  if (e.key === ' ') {
    e.preventDefault();
    togglePause();
    return;
  }

  if (state.gameState === 'PLAYING') {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        handleSlide(0, -1);
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        handleSlide(0, 1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        handleSlide(-1, 0);
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        handleSlide(1, 0);
        e.preventDefault();
        break;
      case 'r':
      case 'R':
        loadLevel(state.currentLevelIdx);
        e.preventDefault();
        break;
    }
  }
});

const dragContainer = document.getElementById('sk_drag_controls');
const dragHandle = dragContainer.querySelector('.sk_drag_handle');
let activeDrag = false;
let dragX, dragY, initialX, initialY;

dragHandle.addEventListener('mousedown', dragStart);
dragHandle.addEventListener('touchstart', dragStart, { passive: false });

function dragStart(e) {
  if (e.type === 'touchstart') {
    dragX = e.touches[0].clientX;
    dragY = e.touches[0].clientY;
  } else {
    dragX = e.clientX;
    dragY = e.clientY;
  }
  const rect = dragContainer.getBoundingClientRect();
  const parentRect = document.querySelector('.sk_game_suite_root').getBoundingClientRect();
  
  initialX = rect.left - parentRect.left;
  initialY = rect.top - parentRect.top;
  
  activeDrag = true;
  document.addEventListener('mousemove', dragMove);
  document.addEventListener('touchmove', dragMove, { passive: false });
  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('touchend', dragEnd);
}

function dragMove(e) {
  if (!activeDrag) return;
  if (e.cancelable) e.preventDefault();
  
  let clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
  let clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
  
  let dx = clientX - dragX;
  let dy = clientY - dragY;
  
  let newX = initialX + dx;
  let newY = initialY + dy;
  
  const parent = document.querySelector('.sk_game_suite_root');
  const parentRect = parent.getBoundingClientRect();
  const containerRect = dragContainer.getBoundingClientRect();
  
  const maxX = parentRect.width - containerRect.width;
  const maxY = parentRect.height - containerRect.height;
  
  newX = Math.max(0, Math.min(newX, maxX));
  newY = Math.max(0, Math.min(newY, maxY));
  
  dragContainer.style.left = `${newX}px`;
  dragContainer.style.top = `${newY}px`;
  dragContainer.style.bottom = 'auto';
  dragContainer.style.right = 'auto';
}

function dragEnd() {
  activeDrag = false;
  document.removeEventListener('mousemove', dragMove);
  document.removeEventListener('touchmove', dragMove);
  document.removeEventListener('mouseup', dragEnd);
  document.removeEventListener('touchend', dragEnd);
}

function zoomCanvas(factor) {
  const prevScale = state.scale;
  state.scale = Math.max(0.5, Math.min(state.scale * factor, 3.0));
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  state.panX = centerX - (centerX - state.panX) * (state.scale / prevScale);
  state.panY = centerY - (centerY - state.panY) * (state.scale / prevScale);
}

document.getElementById('sk_zoom_in').addEventListener('click', () => zoomCanvas(1.15));
document.getElementById('sk_zoom_out').addEventListener('click', () => zoomCanvas(0.85));

const panToggleBtn = document.getElementById('sk_pan_toggle');
panToggleBtn.addEventListener('click', () => {
  state.isPanToolActive = !state.isPanToolActive;
  if (state.isPanToolActive) {
    panToggleBtn.classList.add('sk_zoom_btn_active');
    panToggleBtn.innerText = "🖐 Panning";
  } else {
    panToggleBtn.classList.remove('sk_zoom_btn_active');
    panToggleBtn.innerText = "🖐 Slide";
  }
});

document.getElementById('sk_ctrl_center').addEventListener('click', () => {
  resetTransformations();
});

document.getElementById('sk_btn_menu').addEventListener('click', openDrawer);
document.getElementById('sk_btn_close_drawer').addEventListener('click', closeDrawer);
document.getElementById('sk_drawer_overlay').addEventListener('click', closeDrawer);

document.getElementById('sk_btn_levels').addEventListener('click', () => {
  closeDrawer();
  togglePopup('sk_popup_levels', true);
});
document.getElementById('sk_btn_settings').addEventListener('click', () => {
  closeDrawer();
  togglePopup('sk_popup_settings', true);
});
document.getElementById('sk_btn_scores').addEventListener('click', () => {
  closeDrawer();
  togglePopup('sk_popup_scores', true);
});
document.getElementById('sk_btn_info').addEventListener('click', () => {
  closeDrawer();
  togglePopup('sk_popup_info', true);
});
document.getElementById('sk_btn_start_demo_menu').addEventListener('click', () => {
  closeDrawer();
  startDemo();
});

document.getElementById('sk_btn_pause').addEventListener('click', togglePause);
document.getElementById('sk_btn_resume').addEventListener('click', togglePause);

document.getElementById('sk_close_levels').addEventListener('click', () => togglePopup('sk_popup_levels', false));
document.getElementById('sk_close_settings').addEventListener('click', () => togglePopup('sk_popup_settings', false));
document.getElementById('sk_close_scores').addEventListener('click', () => togglePopup('sk_popup_scores', false));
document.getElementById('sk_close_info').addEventListener('click', () => togglePopup('sk_popup_info', false));

document.getElementById('sk_btn_start_play').addEventListener('click', () => loadLevel(0));
document.getElementById('sk_btn_start_demo').addEventListener('click', startDemo);
document.getElementById('sk_btn_retry').addEventListener('click', () => loadLevel(state.currentLevelIdx));
document.getElementById('sk_btn_next_level').addEventListener('click', () => loadLevel(state.currentLevelIdx + 1));
document.getElementById('sk_btn_restart_all').addEventListener('click', () => loadLevel(0));

document.getElementById('sk_ctrl_up').addEventListener('click', () => handleSlide(0, -1));
document.getElementById('sk_ctrl_down').addEventListener('click', () => handleSlide(0, 1));
document.getElementById('sk_ctrl_left').addEventListener('click', () => handleSlide(-1, 0));
document.getElementById('sk_ctrl_right').addEventListener('click', () => handleSlide(1, 0));
document.getElementById('sk_hud_reset').addEventListener('click', () => loadLevel(state.currentLevelIdx));

document.getElementById('sk_toggle_sound').addEventListener('click', (e) => {
  state.soundOn = !state.soundOn;
  AudioEngine.enabled = state.soundOn;
  e.target.innerText = state.soundOn ? 'ON' : 'OFF';
  saveProgress();
});

document.getElementById('sk_toggle_loader').addEventListener('click', () => {
  LEVELS = [...LOCAL_LEVELS];
  alert("Level database refreshed back to fallback configuration.");
});

document.getElementById('sk_hud_view_mode').addEventListener('click', () => {
  const parent = document.querySelector('.sk_game_suite_root');
  const container = document.getElementById('sk_canvas_container');
  if (parent.style.flexDirection === 'row') {
    parent.style.flexDirection = 'column';
    container.style.maxWidth = '500px';
  } else {
    parent.style.flexDirection = 'row';
    container.style.maxWidth = '400px';
  }
  handleResize();
});

document.getElementById('sk_btn_fullscreen').addEventListener('click', () => {
  const root = document.querySelector('.sk_game_suite_root');
  if (!document.fullscreenElement) {
    root.requestFullscreen().catch(err => {
      console.error(`Fullscreen request execution negative: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
});

window.addEventListener('resize', handleResize);

loadProgress();
handleResize();
updateUI();
document.getElementById('sk_overlay_start').classList.remove('sk_hidden');
loop();

window.addEventListener('DOMContentLoaded', fetchRemoteLevels);
