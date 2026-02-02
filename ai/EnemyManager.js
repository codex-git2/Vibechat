import * as THREE from "three";

const STATES = {
  PATROL: "patrol",
  ALERT: "alert",
  ATTACK: "attack",
  RETREAT: "retreat",
};

export class EnemyManager {
  constructor(scene, world, hero) {
    this.scene = scene;
    this.world = world;
    this.hero = hero;
    this.enemies = [];
    this.spawnEnemies();
  }

  spawnEnemies() {
    const material = new THREE.MeshStandardMaterial({ color: 0xff5b5b, roughness: 0.6 });
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), material);
      mesh.position.set((Math.random() - 0.5) * 80, 1.2, (Math.random() - 0.5) * 80);
      mesh.castShadow = true;
      mesh.userData.state = STATES.PATROL;
      mesh.userData.health = 3;
      mesh.userData.velocity = new THREE.Vector3();
      mesh.userData.target = mesh.position.clone();
      mesh.userData.isEnemy = true;
      mesh.userData.hit = () => {
        mesh.userData.health -= 1;
        if (mesh.userData.health <= 0) {
          mesh.visible = false;
          mesh.userData.state = STATES.RETREAT;
        } else {
          mesh.userData.state = STATES.ALERT;
        }
      };
      this.scene.add(mesh);
      this.enemies.push(mesh);
    }
  }

  update(delta) {
    this.enemies.forEach((enemy) => {
      if (!enemy.visible) return;
      const toHero = this.hero.group.position.clone().sub(enemy.position);
      const distance = toHero.length();
      switch (enemy.userData.state) {
        case STATES.PATROL: {
          if (distance < 20) {
            enemy.userData.state = STATES.ALERT;
          } else if (enemy.position.distanceTo(enemy.userData.target) < 2) {
            enemy.userData.target.set(
              enemy.position.x + (Math.random() - 0.5) * 20,
              1.2,
              enemy.position.z + (Math.random() - 0.5) * 20
            );
          }
          break;
        }
        case STATES.ALERT: {
          if (distance < 6) {
            enemy.userData.state = STATES.ATTACK;
          } else if (distance > 25) {
            enemy.userData.state = STATES.PATROL;
          }
          break;
        }
        case STATES.ATTACK: {
          if (distance > 8) {
            enemy.userData.state = STATES.ALERT;
          }
          break;
        }
        default:
          break;
      }

      const moveTarget =
        enemy.userData.state === STATES.ATTACK ? this.hero.group.position : enemy.userData.target;
      const desired = moveTarget.clone().sub(enemy.position).setY(0).normalize();
      const speed = enemy.userData.state === STATES.ATTACK ? 6 : 3;
      enemy.userData.velocity.lerp(desired.multiplyScalar(speed), delta * 2.5);
      enemy.position.add(enemy.userData.velocity.clone().multiplyScalar(delta));
    });
  }
}
