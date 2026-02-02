# Neon Arachnid — Open-World Spider-Hero Prototype

An original, physics-driven 3D spider-hero action prototype built with Three.js + Rapier. This project focuses on realistic traversal, momentum, and camera feel while keeping the architecture modular for Replit.

## Quick Start (Replit)
1. Create a new **HTML, CSS, JS** repl (or a Node.js repl).
2. Upload the project files or connect the repo.
3. Serve the root directory with a static server. Example for Node.js repl:
   ```bash
   npx serve .
   ```
4. Open the webview. Click the canvas to lock the pointer.

### Controls
- **WASD** — Move
- **Mouse** — Look
- **Space** — Jump
- **E** — Fire web (attach)
- **Q** — Release web
- **Shift** — Boost
- **F** — Attack

## Architecture Overview
The project is modular and organized for rapid iteration:

```
/engine   Core renderer, camera, and input systems
/player   Spider-hero controller, traversal, animation stubs
/physics  Rapier physics world setup
/city     City layout, buildings, day/night cycle
/combat   Combat and hit detection
/ai       Enemy state logic
/ui       HUD and overlays
/audio    Procedural audio layer
```

## Traversal & Swing Physics (Math)
Swinging uses a **spherical joint constraint** between the player’s rigid body and an attachment anchor:

- When the player fires a web, a raycast finds a building point.
- A kinematic rigid body is created at that attach point.
- A **spherical joint** constrains the hero body to the anchor, creating a pendulum-like motion.
- Momentum is preserved because we **do not zero linear velocity** when attaching; impulses are applied tangentially for boost.

Key components:
- **Pendulum constraint**: `JointData.spherical()` in Rapier creates an anchor constraint.
- **Boost impulse**: applied along forward vector to let the player pump the arc.
- **Release**: removing the joint preserves existing velocity, giving realistic carry into air.

## Camera Logic
The camera system emphasizes a cinematic, speed-reactive feel:
- **Dynamic FOV** grows with speed (65 → 85 degrees).
- **Collision avoidance** uses raycasting from the player to the desired camera position.
- **Camera shake** is applied during combat and strong impacts.

## Enemy AI Behavior
Enemies use a lightweight state machine:
- **Patrol**: wander between nearby points.
- **Alert**: investigate the hero when in range.
- **Attack**: chase the hero and press into combat distance.
- **Retreat**: used when defeated (placeholder for ragdoll/despawn).

## Expansion Points
- Replace the hero mesh with a skinned rig and animation graph.
- Add IK for hands/feet using targets from wall contact points.
- Swap procedural audio for authored SFX.
- Upgrade traffic/pedestrian logic and add LOD clusters.
- Replace city generation with streaming districts.

## Notes
- This prototype uses **original assets** only. Models are geometric placeholders that can be replaced with authored content.
- Physics settings are tuned for responsive but weighty movement.
