import * as THREE from "three";

export class CityGenerator {
  constructor(physics) {
    this.physics = physics;
    this.buildings = [];
    this.colliders = [];
    this.time = 0;
  }

  build() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02050a, 0.0025);

    const ambient = new THREE.AmbientLight(0x2d3d5a, 0.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(80, 120, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 400;
    scene.add(sun);

    const hemi = new THREE.HemisphereLight(0x22335a, 0x080a12, 0.6);
    scene.add(hemi);

    const groundGeo = new THREE.PlaneGeometry(600, 600);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x07080c, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const groundBody = this.physics.world.createRigidBody(this.physics.rapier.RigidBodyDesc.fixed());
    this.physics.world.createCollider(
      this.physics.rapier.ColliderDesc.cuboid(300, 0.5, 300),
      groundBody
    );
    this.colliders.push(ground);

    const skyGeo = new THREE.SphereGeometry(500, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x0b1633,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    const cityGroup = new THREE.Group();
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x101725,
      roughness: 0.45,
      metalness: 0.6,
    });

    const gridSize = 10;
    const spacing = 40;
    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        if ((x + z) % 2 !== 0) continue;
        const height = 20 + Math.random() * 120;
        const width = 10 + Math.random() * 18;
        const depth = 10 + Math.random() * 18;

        const baseGeo = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(baseGeo, buildingMaterial);
        mesh.position.set(x * spacing, height / 2, z * spacing);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const lod = new THREE.LOD();
        lod.addLevel(mesh, 0);
        const lowGeo = new THREE.BoxGeometry(width, height, depth);
        const lowMesh = new THREE.Mesh(lowGeo, new THREE.MeshStandardMaterial({ color: 0x0a101c }));
        lod.addLevel(lowMesh, 200);
        lod.position.copy(mesh.position);

        cityGroup.add(lod);
        this.buildings.push(lod);

        const body = this.physics.world.createRigidBody(
          this.physics.rapier.RigidBodyDesc.fixed().setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
        );
        const collider = this.physics.world.createCollider(
          this.physics.rapier.ColliderDesc.cuboid(width / 2, height / 2, depth / 2),
          body
        );
        collider.setFriction(0.2);
        this.colliders.push(lod);
      }
    }

    scene.add(cityGroup);

    return {
      scene,
      colliders: this.colliders,
      update: (delta) => {
        this.time += delta;
        const cycle = (Math.sin(this.time * 0.05) + 1) / 2;
        sun.intensity = THREE.MathUtils.lerp(0.4, 1.2, cycle);
        sun.position.set(
          80 * Math.cos(this.time * 0.05),
          90 + 40 * cycle,
          80 * Math.sin(this.time * 0.05)
        );
        sky.material.color.setHSL(0.62, 0.6, THREE.MathUtils.lerp(0.08, 0.18, cycle));
      },
    };
  }
}
