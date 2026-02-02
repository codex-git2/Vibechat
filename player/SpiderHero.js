import * as THREE from "three";

const DEG2RAD = Math.PI / 180;

export class SpiderHero {
  constructor({ scene, physics, cameraController, input, colliders, audio }) {
    this.scene = scene;
    this.physics = physics;
    this.cameraController = cameraController;
    this.input = input;
    this.audio = audio;
    this.colliders = colliders;

    this.group = new THREE.Group();
    this.velocity = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0);
    this.cameraRotation = new THREE.Euler(0, 0, 0, "YXZ");
    this.speed = 0;
    this.webFluid = 1;
    this.stamina = 1;
    this.isGrounded = false;
    this.swingJoint = null;
    this.swingAnchor = null;
    this.swinging = false;
    this.swingCooldown = 0;

    this.initMesh();
    this.initPhysics();
    this.cameraController.setCollisionObjects(colliders);
  }

  initMesh() {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2c6fff,
      roughness: 0.35,
      metalness: 0.2,
    });
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0x0b0e16,
      roughness: 0.6,
    });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 1.3, 6, 12), bodyMat);
    torso.castShadow = true;
    torso.position.y = 1.5;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), suitMat);
    head.position.set(0, 2.5, 0.2);
    torso.add(head);

    this.group.add(torso);
    this.scene.add(this.group);
  }

  initPhysics() {
    const desc = this.physics.rapier.RigidBodyDesc.dynamic()
      .setTranslation(0, 4, 0)
      .setLinearDamping(0.1)
      .setAngularDamping(0.9);

    this.body = this.physics.world.createRigidBody(desc);
    const colliderDesc = this.physics.rapier.ColliderDesc.capsule(0.6, 0.9)
      .setRestitution(0.0)
      .setFriction(1.0);
    this.collider = this.physics.world.createCollider(colliderDesc, this.body);
  }

  update(delta) {
    this.swingCooldown = Math.max(0, this.swingCooldown - delta);
    this.handleCamera(delta);
    this.handleMovement(delta);
    this.handleSwing(delta);
    this.syncMesh();
  }

  handleCamera(delta) {
    const mouse = this.input.consumeMouseDelta();
    const yaw = -mouse.x * 0.0025;
    const pitch = -mouse.y * 0.0025;
    this.cameraRotation.y += yaw;
    this.cameraRotation.x = THREE.MathUtils.clamp(
      this.cameraRotation.x + pitch,
      -45 * DEG2RAD,
      60 * DEG2RAD
    );
  }

  handleMovement(delta) {
    const { x, y } = this.input.axes;
    const move = new THREE.Vector3(x, 0, y);
    if (move.lengthSq() > 0) {
      move.normalize();
    }

    const rotation = new THREE.Quaternion().setFromEuler(this.cameraRotation);
    move.applyQuaternion(rotation);
    move.y = 0;
    move.normalize();

    const baseSpeed = this.swinging ? 10 : 14;
    const boost = this.input.isActive("boost") ? 1.4 : 1.0;
    const desired = move.multiplyScalar(baseSpeed * boost);

    const linear = this.body.linvel();
    this.velocity.set(linear.x, linear.y, linear.z);

    const target = new THREE.Vector3(desired.x, this.velocity.y, desired.z);
    const impulse = target.sub(this.velocity).multiplyScalar(6 * delta);
    this.body.applyImpulse({ x: impulse.x, y: 0, z: impulse.z }, true);

    this.isGrounded = this.body.translation().y <= 1.4;
    if (this.input.isActive("jump") && this.isGrounded) {
      this.body.applyImpulse({ x: 0, y: 8, z: 0 }, true);
      this.audio.playJump();
    }

    this.speed = new THREE.Vector3(linear.x, 0, linear.z).length();
  }

  handleSwing(delta) {
    if (this.input.isActive("swing") && !this.swinging && this.swingCooldown <= 0) {
      this.tryAttachWeb();
    }
    if (this.input.isActive("release") && this.swinging) {
      this.detachWeb();
    }

    if (this.swinging && this.swingJoint) {
      const boost = this.input.isActive("boost") ? 1.35 : 1.0;
      const directional = this.getForward().multiplyScalar(12 * boost * delta);
      this.body.applyImpulse({ x: directional.x, y: 0, z: directional.z }, true);

      this.webFluid = Math.max(0, this.webFluid - delta * 0.05);
      if (this.webFluid <= 0.05) {
        this.detachWeb();
      }
    } else {
      this.webFluid = Math.min(1, this.webFluid + delta * 0.1);
    }
  }

  tryAttachWeb() {
    const origin = this.group.position.clone().add(new THREE.Vector3(0, 1, 0));
    const direction = this.getForward();
    const raycaster = new THREE.Raycaster(origin, direction, 2, 120);
    const hits = raycaster.intersectObjects(this.colliders, true);
    if (hits.length === 0) return;

    const attachPoint = hits[0].point;
    const anchorDesc = this.physics.rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(
      attachPoint.x,
      attachPoint.y,
      attachPoint.z
    );
    this.swingAnchor = this.physics.world.createRigidBody(anchorDesc);
    const jointDesc = this.physics.rapier.JointData.spherical(
      { x: 0, y: 0, z: 0 },
      {
        x: attachPoint.x - this.body.translation().x,
        y: attachPoint.y - this.body.translation().y,
        z: attachPoint.z - this.body.translation().z,
      }
    );
    this.swingJoint = this.physics.world.createImpulseJoint(jointDesc, this.swingAnchor, this.body, true);
    this.swinging = true;
    this.audio.playSwing();
  }

  detachWeb() {
    if (this.swingJoint) {
      this.physics.world.removeImpulseJoint(this.swingJoint, true);
      this.swingJoint = null;
    }
    if (this.swingAnchor) {
      this.physics.world.removeRigidBody(this.swingAnchor);
      this.swingAnchor = null;
    }
    this.swinging = false;
    this.swingCooldown = 0.4;
    this.audio.playRelease();
  }

  getForward() {
    const forward = new THREE.Vector3(0, 0, -1);
    const rotation = new THREE.Quaternion().setFromEuler(this.cameraRotation);
    return forward.applyQuaternion(rotation).normalize();
  }

  syncMesh() {
    const pos = this.body.translation();
    this.group.position.set(pos.x, pos.y - 1.2, pos.z);

    const target = this.getForward();
    this.group.lookAt(this.group.position.clone().add(target));
  }

  getCameraAnchor() {
    return {
      position: this.group.position.clone().add(new THREE.Vector3(0, 2, 0)),
      rotation: new THREE.Quaternion().setFromEuler(this.cameraRotation),
      speed: this.speed,
    };
  }
}
