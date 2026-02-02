import * as THREE from "three";

export class CameraController {
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
    this.offset = new THREE.Vector3(0, 3.5, 9);
    this.velocity = new THREE.Vector3();
    this.fovTarget = 65;
    this.shakeIntensity = 0;
    this.raycaster = new THREE.Raycaster();
    this.collisionObjects = [];
  }

  setCollisionObjects(objects) {
    this.collisionObjects = objects;
  }

  addShake(amount) {
    this.shakeIntensity = Math.min(this.shakeIntensity + amount, 1.5);
  }

  update(delta, anchor) {
    if (!anchor) return;

    const targetFov = THREE.MathUtils.lerp(65, 85, anchor.speed / 40);
    this.fovTarget = THREE.MathUtils.lerp(this.fovTarget, targetFov, delta * 3);
    this.camera.fov = this.fovTarget;
    this.camera.updateProjectionMatrix();

    const desiredPosition = anchor.position.clone().add(this.offset.clone().applyQuaternion(anchor.rotation));

    if (this.collisionObjects.length > 0) {
      const direction = desiredPosition.clone().sub(anchor.position);
      this.raycaster.set(anchor.position, direction.clone().normalize());
      const hits = this.raycaster.intersectObjects(this.collisionObjects, true);
      if (hits.length > 0 && hits[0].distance < direction.length()) {
        desiredPosition.copy(anchor.position).add(direction.normalize().multiplyScalar(hits[0].distance - 0.5));
      }
    }

    this.camera.position.lerp(desiredPosition, 1 - Math.pow(0.001, delta));
    this.camera.lookAt(anchor.position);

    if (this.shakeIntensity > 0.01) {
      const shake = new THREE.Vector3(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity
      );
      this.camera.position.add(shake);
      this.shakeIntensity *= 0.9;
    }
  }
}
