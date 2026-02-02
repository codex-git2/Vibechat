export class HUD {
  constructor(hero) {
    this.hero = hero;
    this.root = document.querySelector("#hud");
    this.root.innerHTML = `
      <div class="hud-block" id="hud-health">
        <div class="hud-label">Health</div>
        <div class="hud-meter"><span style="width: 100%"></span></div>
      </div>
      <div class="hud-block" id="hud-web">
        <div class="hud-label">Web Fluid</div>
        <div class="hud-meter"><span style="width: 100%"></span></div>
      </div>
      <div class="hud-block" id="hud-stamina">
        <div class="hud-label">Stamina</div>
        <div class="hud-meter"><span style="width: 100%"></span></div>
      </div>
    `;

    this.webEl = this.root.querySelector("#hud-web span");
    this.staminaEl = this.root.querySelector("#hud-stamina span");
  }

  update() {
    this.webEl.style.width = `${Math.round(this.hero.webFluid * 100)}%`;
    this.staminaEl.style.width = `${Math.round(this.hero.stamina * 100)}%`;
  }
}
