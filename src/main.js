import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/** Free VALID Asian female casual — local first, then CDN mirrors (jsDelivr often blocked in CN). */
export const MODEL_CANDIDATES = [
  '/avatar.glb',
  'https://fastly.jsdelivr.net/gh/c-frame/valid-avatars-glb@c539a28/avatars/Asian/Asian_F_1_Casual.glb',
  'https://cdn.jsdelivr.net/gh/c-frame/valid-avatars-glb@c539a28/avatars/Asian/Asian_F_1_Casual.glb',
  'https://raw.githubusercontent.com/c-frame/valid-avatars-glb/c539a28/avatars/Asian/Asian_F_1_Casual.glb',
];
export const MODEL_URL = MODEL_CANDIDATES[0];

const canvas = document.getElementById('c');
const statusEl = document.getElementById('status');
const buttons = [...document.querySelectorAll('[data-act]')];

const scene = new THREE.Scene();

// Soft studio fill over pastel CSS gradient (canvas clear alpha)
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;

const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0.35, 1.45, 3.2);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.05, 0);
controls.enableDamping = true;
controls.minDistance = 1.4;
controls.maxDistance = 6;

const hemi = new THREE.HemisphereLight(0xffe8f5, 0xa8d8ff, 1.1);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.25);
key.position.set(2.5, 4, 2);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
scene.add(key);
const fill = new THREE.DirectionalLight(0xd4c4f5, 0.55);
fill.position.set(-2, 2, 1);
scene.add(fill);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(3.2, 64),
  new THREE.MeshStandardMaterial({
    color: 0xf7f2ff,
    roughness: 0.85,
    metalness: 0.05,
  }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Soft pastel ring to suggest studio backdrop depth
const ring = new THREE.Mesh(
  new THREE.RingGeometry(2.4, 3.15, 64),
  new THREE.MeshBasicMaterial({
    color: 0xe8d4f8,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  }),
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.002;
scene.add(ring);

const clock = new THREE.Clock();
/** @type {THREE.AnimationMixer | null} */
let mixer = null;
/** @type {Record<string, THREE.AnimationAction>} */
const actions = {};
/** @type {THREE.AnimationAction | null} */
let current = null;

function setStatus(text) {
  statusEl.textContent = text;
}

function findBone(root, names) {
  for (const name of names) {
    const b = root.getObjectByName(name);
    if (b) return b;
  }
  return null;
}

function bonePath(bone) {
  // AnimationMixer tracks use ".bones[Name].quaternion" for SkinnedMesh,
  // but VALID uses Object3D hierarchy — QuaternionKeyframeTrack on object uuid/name path.
  return bone.name + '.quaternion';
}

/**
 * Build short procedural clips on Mixamo-style bones via AnimationMixer.
 * sneeze is an approximation (no Mixamo FBX retarget).
 */
function buildClips(root) {
  const hips = findBone(root, ['Hips']);
  const spine = findBone(root, ['Spine', 'Spine1']);
  const spine1 = findBone(root, ['Spine1', 'Spine2']);
  const neck = findBone(root, ['Neck']);
  const head = findBone(root, ['Head']);
  const rArm = findBone(root, ['RightArm']);
  const rFore = findBone(root, ['RightForeArm']);
  const rHand = findBone(root, ['RightHand']);
  const lArm = findBone(root, ['LeftArm']);
  const lFore = findBone(root, ['LeftForeArm']);

  const needed = { hips, spine, neck, head, rArm, rFore, rHand, lArm };
  for (const [k, v] of Object.entries(needed)) {
    if (!v) throw new Error(`Missing bone: ${k}`);
  }

  const q = (bone, x, y, z) => {
    const base = bone.quaternion.clone();
    const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'XYZ'));
    return base.clone().multiply(delta);
  };

  const track = (bone, times, eulers) => {
    const values = [];
    for (const [x, y, z] of eulers) {
      const qq = q(bone, x, y, z);
      values.push(qq.x, qq.y, qq.z, qq.w);
    }
    return new THREE.QuaternionKeyframeTrack(bonePath(bone), times, values);
  };

  // --- idle: gentle sway ---
  const idleTimes = [0, 1.2, 2.4];
  const idle = new THREE.AnimationClip('idle', 2.4, [
    track(spine, idleTimes, [
      [0.02, 0, 0.01],
      [-0.015, 0, -0.01],
      [0.02, 0, 0.01],
    ]),
    track(lArm, idleTimes, [
      [0.05, 0, 0.08],
      [0.08, 0, 0.05],
      [0.05, 0, 0.08],
    ]),
    track(rArm, idleTimes, [
      [0.05, 0, -0.08],
      [0.08, 0, -0.05],
      [0.05, 0, -0.08],
    ]),
    track(head, idleTimes, [
      [0.02, 0.03, 0],
      [0.01, -0.03, 0],
      [0.02, 0.03, 0],
    ]),
  ]);

  // --- wave: raise right arm and oscillate forearm ---
  const waveTimes = [0, 0.25, 0.5, 0.75, 1.0, 1.25];
  const wave = new THREE.AnimationClip('wave', 1.25, [
    track(rArm, waveTimes, [
      [-1.35, 0.15, -0.2],
      [-1.4, 0.2, -0.15],
      [-1.35, 0.15, -0.2],
      [-1.4, 0.2, -0.15],
      [-1.35, 0.15, -0.2],
      [-1.35, 0.15, -0.2],
    ]),
    track(rFore, waveTimes, [
      [0, 0, -0.2],
      [0, 0, 0.55],
      [0, 0, -0.2],
      [0, 0, 0.55],
      [0, 0, -0.2],
      [0, 0, 0],
    ]),
    track(rHand, waveTimes, [
      [0, 0, 0.2],
      [0, 0, -0.35],
      [0, 0, 0.2],
      [0, 0, -0.35],
      [0, 0, 0.2],
      [0, 0, 0],
    ]),
  ]);

  // --- peace: arm up, hand tilt (V-sign approximated by wrist pose) ---
  const peaceTimes = [0, 0.35, 1.4, 1.7];
  const peace = new THREE.AnimationClip('peace', 1.7, [
    track(rArm, peaceTimes, [
      [0, 0, 0],
      [-1.55, 0.35, 0.1],
      [-1.55, 0.35, 0.1],
      [0, 0, 0],
    ]),
    track(rFore, peaceTimes, [
      [0, 0, 0],
      [-0.15, 0, 0.1],
      [-0.15, 0, 0.1],
      [0, 0, 0],
    ]),
    track(rHand, peaceTimes, [
      [0, 0, 0],
      [0.35, 0.2, 0.45],
      [0.35, 0.2, 0.45],
      [0, 0, 0],
    ]),
    track(head, peaceTimes, [
      [0, 0, 0],
      [0.05, -0.15, 0],
      [0.05, -0.15, 0],
      [0, 0, 0],
    ]),
  ]);

  // --- sneeze (approximated): inhale lean-back, then forward burst ---
  const sneezeTimes = [0, 0.2, 0.35, 0.5, 0.85];
  const sneeze = new THREE.AnimationClip('sneeze', 0.85, [
    track(spine, sneezeTimes, [
      [0, 0, 0],
      [-0.12, 0, 0],
      [0.35, 0, 0.05],
      [0.15, 0, 0],
      [0, 0, 0],
    ]),
    track(spine1 || spine, sneezeTimes, [
      [0, 0, 0],
      [-0.08, 0, 0],
      [0.28, 0, 0],
      [0.1, 0, 0],
      [0, 0, 0],
    ]),
    track(neck, sneezeTimes, [
      [0, 0, 0],
      [-0.15, 0, 0],
      [0.55, 0, 0.08],
      [0.2, 0, 0],
      [0, 0, 0],
    ]),
    track(head, sneezeTimes, [
      [0, 0, 0],
      [-0.2, 0, 0],
      [0.65, 0.05, 0.1],
      [0.15, 0, 0],
      [0, 0, 0],
    ]),
    track(lArm, sneezeTimes, [
      [0, 0, 0],
      [0.2, 0, 0.25],
      [0.55, 0, 0.45],
      [0.2, 0, 0.15],
      [0, 0, 0],
    ]),
    track(rArm, sneezeTimes, [
      [0, 0, 0],
      [0.2, 0, -0.25],
      [0.55, 0, -0.45],
      [0.2, 0, -0.15],
      [0, 0, 0],
    ]),
  ]);

  return { idle, wave, peace, sneeze };
}

function play(name, { loop = false, fade = 0.2 } = {}) {
  const next = actions[name];
  if (!next) {
    console.warn('[hero] unknown action:', name);
    return false;
  }
  if (current === next && next.isRunning()) return true;
  next.reset();
  next.setEffectiveWeight(1);
  next.clampWhenFinished = !loop;
  next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
  if (current && current !== next) {
    current.fadeOut(fade);
    next.fadeIn(fade).play();
  } else {
    next.play();
  }
  current = next;

  if (!loop) {
    const onFinished = (e) => {
      if (e.action !== next) return;
      mixer?.removeEventListener('finished', onFinished);
      play('idle', { loop: true, fade: 0.25 });
      setStatus(`Action: idle`);
    };
    mixer?.addEventListener('finished', onFinished);
  }
  return true;
}

window.hero = {
  /**
   * @param {'sneeze'|'peace'|'wave'|'idle'} name
   */
  act(name) {
    const map = {
      idle: { loop: true },
      wave: { loop: false },
      peace: { loop: false },
      sneeze: { loop: false },
    };
    if (!map[name]) {
      console.warn("[hero] use act('sneeze'|'peace'|'wave'|'idle')");
      return false;
    }
    const ok = play(name, map[name]);
    if (ok) {
      const note = name === 'sneeze' ? ' (approximated)' : '';
      setStatus(`Action: ${name}${note}`);
    }
    return ok;
  },
};

buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    window.hero.act(btn.dataset.act);
  });
});

function setButtonsEnabled(enabled) {
  buttons.forEach((b) => {
    b.disabled = !enabled;
  });
}
setButtonsEnabled(false);

const loader = new GLTFLoader();

function onAvatarLoaded(gltf) {
  const root = gltf.scene;
  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  const box = new THREE.Box3().setFromObject(root);
  root.position.y -= box.min.y;
  scene.add(root);

  mixer = new THREE.AnimationMixer(root);
  const clips = buildClips(root);
  for (const [name, clip] of Object.entries(clips)) {
    actions[name] = mixer.clipAction(clip);
  }

  window.hero.act('idle');
  setButtonsEnabled(true);
  setStatus('Ready — try Wave / Peace / Sneeze ≈');
}

function loadAvatar(index = 0) {
  if (index >= MODEL_CANDIDATES.length) {
    setStatus('Failed to load avatar GLB. Put public/avatar.glb or check network.');
    return;
  }
  const url = MODEL_CANDIDATES[index];
  setStatus(`Loading avatar… (${index + 1}/${MODEL_CANDIDATES.length})`);
  loader.load(
    url,
    onAvatarLoaded,
    (ev) => {
      if (ev.total) {
        const pct = Math.round((100 * ev.loaded) / ev.total);
        setStatus(`Loading avatar… ${pct}%`);
      }
    },
    (err) => {
      console.warn('Avatar load failed:', url, err);
      loadAvatar(index + 1);
    },
  );
}

loadAvatar();

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  mixer?.update(dt);
  controls.update();
  renderer.render(scene, camera);
}
animate();
