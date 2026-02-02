import RAPIER from "@dimforge/rapier3d-compat";

export class PhysicsWorld {
  static async create() {
    await RAPIER.init();
    const gravity = new RAPIER.Vector3(0, -25, 0);
    const world = new RAPIER.World(gravity);
    return new PhysicsWorld(world, RAPIER);
  }

  constructor(world, rapier) {
    this.world = world;
    this.rapier = rapier;
    this.timestep = 1 / 60;
    this.accumulator = 0;
  }

  step(delta) {
    this.accumulator += delta;
    while (this.accumulator >= this.timestep) {
      this.world.timestep = this.timestep;
      this.world.step();
      this.accumulator -= this.timestep;
    }
  }
}
