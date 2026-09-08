# Zero Drift - Level Building & Development Guide

Welcome to **Zero Drift**, a minimalist mathematical sliding puzzle game played on ice. This guide explains how levels are structured and how you can build, add, or modify levels in `levels.json` and `index.html`.

---

## 🕹️ Game Rules & Mechanics

1. **Objective:** Slide your block into the golden **Exit (`E`)** with a value of **exactly 0**.
2. **Movement:** Because you are on frictionless ice, sliding in any direction (Up, Down, Left, Right) continues until you hit a **Wall (`W`)** or the board edge.
3. **Operators:** Passing over operator pads (`+N`, `-N`, `*N`, `/N`) instantly updates your block's value using standard math (division uses integer division `Math.floor`).
4. **Limits:** Keeping values within bounds (`0` to `99`). Going out of bounds triggers instant failure!

---

## 🗺️ Level Grid Format

Levels are defined as JSON objects containing a level name, starting block value (`startVal`), and a 2D grid array.

### Grid Legend:
- `W`: **Wall** (stops sliding movement)
- `S`: **Start Position** (where the player block spawns)
- `E`: **Exit** (target tile where value must be exactly 0)
- `.`: **Open Ice** (empty sliding space)
- `+N`: **Addition Operator** (e.g., `+5`)
- `-N`: **Subtraction Operator** (e.g., `-10`)
- `*N`: **Multiplication Operator** (e.g., `*2`)
- `/N`: **Division Operator** (e.g., `/3`)

---

## 📝 Example Level JSON Structure

```json
{
  "name": "First Steps",
  "startVal": 10,
  "grid": [
    ["W", "W", "W", "W", "W", "W"],
    ["W", "S", ".", "-10", ".", "W"],
    ["W", ".", ".", ".", ".", "W"],
    ["W", ".", ".", "E", ".", "W"],
    ["W", ".", ".", ".", ".", "W"],
    ["W", "W", "W", "W", "W", "W"]
  ]
}
```

---

## 🛠️ How to Add or Build a New Level

1. Open `levels.json` (and `index.html` if updating local fallback levels).
2. Append your new level object to the JSON array following the grid format above.
3. **Design Checklist for Level Builders:**
   - Ensure an unbroken border of walls (`W`) around the perimeter.
   - Verify there are open slide lanes from `S` to operator pads and the `E` exit.
   - Test your math sequence to ensure a player can reach `E` with an exact value of `0`.

---

## 🚀 Running the Game Locally

Simply open `index.html` in any modern web browser to play!
