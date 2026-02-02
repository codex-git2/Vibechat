export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.axes = { x: 0, y: 0 };
    this.actions = new Set();
    this.pointerLocked = false;
    this.mouseDelta = { x: 0, y: 0 };

    this.keyMap = {
      KeyW: "forward",
      KeyS: "backward",
      KeyA: "left",
      KeyD: "right",
      Space: "jump",
      ShiftLeft: "boost",
      KeyE: "swing",
      KeyQ: "release",
      KeyF: "attack",
    };

    window.addEventListener("keydown", (event) => this.onKey(event, true));
    window.addEventListener("keyup", (event) => this.onKey(event, false));
    window.addEventListener("mousemove", (event) => this.onMouseMove(event));
    canvas.addEventListener("click", () => {
      if (!this.pointerLocked) {
        canvas.requestPointerLock();
      }
    });
    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = document.pointerLockElement === canvas;
    });
  }

  onKey(event, pressed) {
    const action = this.keyMap[event.code];
    if (!action) return;
    if (pressed) {
      this.actions.add(action);
    } else {
      this.actions.delete(action);
    }
  }

  onMouseMove(event) {
    if (!this.pointerLocked) return;
    this.mouseDelta.x += event.movementX;
    this.mouseDelta.y += event.movementY;
  }

  consumeMouseDelta() {
    const delta = { ...this.mouseDelta };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return delta;
  }

  update() {
    const forward = this.actions.has("forward") ? 1 : 0;
    const backward = this.actions.has("backward") ? 1 : 0;
    const left = this.actions.has("left") ? 1 : 0;
    const right = this.actions.has("right") ? 1 : 0;

    this.axes.x = right - left;
    this.axes.y = forward - backward;
  }

  isActive(action) {
    return this.actions.has(action);
  }
}
