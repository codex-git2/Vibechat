import * as THREE from "three";

export class CombatSystem {
  constructor(hero, scene, world) {
    this.hero = hero;
    this.scene = scene;
    this.world = world;
    this.cooldown = 0;
    this.hitbox = new THREE.Sphere(new THREE.Vector3(), 2.2);
  }

  update(delta) {
    this.cooldown = Math.max(0, this.cooldown - delta);
    if (this.hero.input.isActive("attack") && this.cooldown === 0) {
      this.cooldown = 0.6;
      this.hitbox.center.copy(this.hero.group.position).add(this.hero.getForward());
      this.scene.traverse((child) => {
        if (!child.userData.isEnemy) return;
        if (child.position.distanceTo(this.hitbox.center) <= this.hitbox.radius) {
          child.userData.hit();
        }
      });
      this.hero.cameraController.addShake(0.4);
      this.hero.audio.playImpact();
    }
  }
}
