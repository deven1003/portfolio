// 3D background scene — particle network with connecting lines
// Theme: neural / cloud topology — fits both DevOps (interconnected systems) and AI (neurons)

import * as THREE from 'three';

const canvas = document.getElementById('bg-canvas');
if (!canvas) { console.warn('No bg-canvas element'); }

// Honor reduced-motion
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Detect mobile to lighten the load
const isMobile = window.matchMedia('(max-width: 760px)').matches;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: !isMobile,
  powerPreference: 'low-power',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

// === Particles ===
const PARTICLE_COUNT = isMobile ? 60 : 140;
const SPREAD = 50;

const particleGeo = new THREE.BufferGeometry();
const positions = new Float32Array(PARTICLE_COUNT * 3);
const velocities = [];

for (let i = 0; i < PARTICLE_COUNT; i++) {
  positions[i * 3]     = (Math.random() - 0.5) * SPREAD;
  positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
  positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
  velocities.push({
    x: (Math.random() - 0.5) * 0.012,
    y: (Math.random() - 0.5) * 0.012,
    z: (Math.random() - 0.5) * 0.012,
  });
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Particle material — small glowing dots
const particleMat = new THREE.PointsMaterial({
  color: 0x00ff88,
  size: 0.18,
  transparent: true,
  opacity: 0.85,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// A second layer of violet (AI accent) particles
const aiCount = isMobile ? 25 : 50;
const aiGeo = new THREE.BufferGeometry();
const aiPositions = new Float32Array(aiCount * 3);
const aiVel = [];
for (let i = 0; i < aiCount; i++) {
  aiPositions[i * 3]     = (Math.random() - 0.5) * SPREAD;
  aiPositions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
  aiPositions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
  aiVel.push({
    x: (Math.random() - 0.5) * 0.01,
    y: (Math.random() - 0.5) * 0.01,
    z: (Math.random() - 0.5) * 0.01,
  });
}
aiGeo.setAttribute('position', new THREE.BufferAttribute(aiPositions, 3));
const aiMat = new THREE.PointsMaterial({
  color: 0xa78bfa,
  size: 0.22,
  transparent: true,
  opacity: 0.75,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const aiParticles = new THREE.Points(aiGeo, aiMat);
scene.add(aiParticles);

// === Lines connecting nearby particles (the network effect) ===
const MAX_DIST = isMobile ? 5 : 6;
const linesGeo = new THREE.BufferGeometry();
const maxLineSegments = PARTICLE_COUNT * 4;
const linePositions = new Float32Array(maxLineSegments * 2 * 3);
const lineColors = new Float32Array(maxLineSegments * 2 * 3);
linesGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
linesGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
const linesMat = new THREE.LineBasicMaterial({
  vertexColors: true,
  transparent: true,
  opacity: 0.35,
  blending: THREE.AdditiveBlending,
});
const lines = new THREE.LineSegments(linesGeo, linesMat);
scene.add(lines);

// === Mouse parallax ===
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('mousemove', (e) => {
  mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
});

// === Resize ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === Animate ===
const tmpVec = new THREE.Vector3();

function animate() {
  if (!reducedMotion) {
    // Move particles (DevOps green)
    const pos = particleGeo.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3]     += velocities[i].x;
      pos[i * 3 + 1] += velocities[i].y;
      pos[i * 3 + 2] += velocities[i].z;
      // Wrap around bounds
      for (let a = 0; a < 3; a++) {
        if (pos[i * 3 + a] >  SPREAD / 2) pos[i * 3 + a] = -SPREAD / 2;
        if (pos[i * 3 + a] < -SPREAD / 2) pos[i * 3 + a] =  SPREAD / 2;
      }
    }
    particleGeo.attributes.position.needsUpdate = true;

    // Move AI particles
    const apos = aiGeo.attributes.position.array;
    for (let i = 0; i < aiCount; i++) {
      apos[i * 3]     += aiVel[i].x;
      apos[i * 3 + 1] += aiVel[i].y;
      apos[i * 3 + 2] += aiVel[i].z;
      for (let a = 0; a < 3; a++) {
        if (apos[i * 3 + a] >  SPREAD / 2) apos[i * 3 + a] = -SPREAD / 2;
        if (apos[i * 3 + a] < -SPREAD / 2) apos[i * 3 + a] =  SPREAD / 2;
      }
    }
    aiGeo.attributes.position.needsUpdate = true;

    // Build lines between close particles
    let segIdx = 0;
    for (let i = 0; i < PARTICLE_COUNT && segIdx < maxLineSegments; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT && segIdx < maxLineSegments; j++) {
        const dx = pos[i * 3]     - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < MAX_DIST * MAX_DIST) {
          const a = segIdx * 6;
          linePositions[a]     = pos[i * 3];
          linePositions[a + 1] = pos[i * 3 + 1];
          linePositions[a + 2] = pos[i * 3 + 2];
          linePositions[a + 3] = pos[j * 3];
          linePositions[a + 4] = pos[j * 3 + 1];
          linePositions[a + 5] = pos[j * 3 + 2];
          // Color: green fading to violet at the second endpoint
          const t = Math.sqrt(d2) / MAX_DIST;
          lineColors[a]     = 0;          lineColors[a + 1] = 1.0 * (1 - t * 0.4); lineColors[a + 2] = 0.53;
          lineColors[a + 3] = 0.65 * t;   lineColors[a + 4] = 0.55;                lineColors[a + 5] = 0.98;
          segIdx++;
        }
      }
    }
    // Hide unused segments
    for (let k = segIdx; k < maxLineSegments; k++) {
      const a = k * 6;
      for (let z = 0; z < 6; z++) linePositions[a + z] = 0;
    }
    linesGeo.attributes.position.needsUpdate = true;
    linesGeo.attributes.color.needsUpdate = true;
    linesGeo.setDrawRange(0, segIdx * 2);

    // Smooth mouse parallax
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;

    // Subtle scene rotation + parallax
    scene.rotation.y += 0.0008;
    scene.rotation.x = mouse.y * 0.15;
    camera.position.x = mouse.x * 2;
    camera.lookAt(0, 0, 0);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

// === Theme reactivity — recolor particles when theme toggles ===
function syncTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (isLight) {
    particleMat.color.setHex(0x00a85a);
    particleMat.opacity = 0.6;
    aiMat.color.setHex(0x6d44d8);
    aiMat.opacity = 0.55;
    linesMat.opacity = 0.18;
  } else {
    particleMat.color.setHex(0x00ff88);
    particleMat.opacity = 0.85;
    aiMat.color.setHex(0xa78bfa);
    aiMat.opacity = 0.75;
    linesMat.opacity = 0.35;
  }
}
syncTheme();
new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
