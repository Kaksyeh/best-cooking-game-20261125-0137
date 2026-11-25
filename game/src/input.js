// input.js — keyboard and mouse state, with per-frame edge detection.
// One job: turn raw browser events into "held" and "just pressed" answers.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const clicks = [];

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    clicks.push({
      x: ((e.clientX - r.left) * canvas.width) / r.width,
      y: ((e.clientY - r.top) * canvas.height) / r.height,
    });
  });

  return {
    // Held down right now (also true while the debug hold is set).
    debugHoldE: false,
    down(code) {
      return keys.has(code);
    },
    // Pressed since the last frame.
    pressed(code) {
      return pressed.has(code);
    },
    takeClicks() {
      return clicks.splice(0);
    },
    endFrame() {
      pressed.clear();
    },
  };
}
