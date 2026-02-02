import { Renderer } from "./engine/Renderer.js";
import { CameraController } from "./engine/CameraController.js";
import { InputManager } from "./engine/InputManager.js";
import { PhysicsWorld } from "./physics/PhysicsWorld.js";
import { CityGenerator } from "./city/CityGenerator.js";
import { SpiderHero } from "./player/SpiderHero.js";
import { CombatSystem } from "./combat/CombatSystem.js";
import { EnemyManager } from "./ai/EnemyManager.js";
import { HUD } from "./ui/HUD.js";
import { AudioManager } from "./audio/AudioManager.js";

const loadingEl = document.querySelector("#loading");

async function bootstrap() {
  const renderer = new Renderer();
  const input = new InputManager(renderer.canvas);
  const physics = await PhysicsWorld.create();
  const city = new CityGenerator(physics);
  const { scene, colliders, update: updateCity } = city.build();

  const cameraController = new CameraController(renderer.camera, renderer.canvas);
  const audio = new AudioManager();
  const hero = new SpiderHero({
    scene,
    physics,
    cameraController,
    input,
    colliders,
    audio,
  });
  const combat = new CombatSystem(hero, scene, physics.world);
  const enemies = new EnemyManager(scene, physics.world, hero);
  const hud = new HUD(hero);

  renderer.attachScene(scene);
  loadingEl.classList.add("hidden");

  let lastTime = performance.now();
  function animate(now) {
    const delta = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;

    input.update();
    hero.update(delta);
    combat.update(delta);
    enemies.update(delta);
    updateCity(delta);
    cameraController.update(delta, hero.getCameraAnchor());
    physics.step(delta);
    hud.update();
    audio.update(delta, hero);
    renderer.render();

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

bootstrap();
