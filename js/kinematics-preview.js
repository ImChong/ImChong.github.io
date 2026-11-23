/* ─── Interactive 3D Kinematics Preview (Three.js + GMR Unitree G1 + LAFAN1 BVH) ─── */
(function initKinematicsPreview() {
  'use strict';

  const TV = window.ThreeViewport;
  const stages = [...document.querySelectorAll('[data-kin-stage]')];
  if (!TV || !stages.length) return;

  const root = document.documentElement;
  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileMq = window.matchMedia('(max-width: 639px)');

  const SIDE_OFFSET_X = 0.56;
  const DEFAULT_TARGET_Z = 0.76;
  const DEFAULT_CAM_OFFSET = [0.95, -2.65, 0.88];
  const BONE_UP = new TV.Vector3(0, 1, 0);

  function getActiveLangMode() {
    return root.getAttribute('data-lang-mode') === 'zh' ? 'zh' : 'en';
  }

  function findActiveStage() {
    const mode = getActiveLangMode();
    const container = document.getElementById(mode === 'zh' ? 'lang-zh' : 'lang-en');
    if (container) {
      const s = container.querySelector('[data-kin-stage]');
      if (s) return s;
    }
    return stages[0];
  }

  function getThemePalette() {
    const isLight = root.getAttribute('data-theme') === 'light';
    return isLight
      ? {
          bg: 0xeceae5,
          fogNear: 12,
          fogFar: 28,
          floor: ['#e8e8e4', '#dcdbd5'],
          bone: 0x5c6676,
          boneEmissive: 0x11151d,
          joint: 0x1947c2,
        }
      : {
          bg: 0x0d0f13,
          fogNear: 11,
          fogFar: 25,
          floor: ['#151820', '#1d222c'],
          bone: 0x8d99ae,
          boneEmissive: 0x10151c,
          joint: 0x5ca4ff,
        };
  }

  function createCheckerTexture(colors) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const n = 2;
    const cell = size / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? colors[0] : colors[1];
        ctx.fillRect(i * cell, j * cell, cell, cell);
      }
    }
    const texture = new TV.CanvasTexture(canvas);
    texture.wrapS = TV.RepeatWrapping;
    texture.wrapT = TV.RepeatWrapping;
    // 24m plane repeated 12x => 2m per 2x2 checker period (1m per tile)
    texture.repeat.set(12, 12);
    texture.colorSpace = TV.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  function dequantize(i16Val, min, max) {
    return min + (i16Val / 32767 + 1) * 0.5 * (max - min);
  }

  function buildG1Rig(modelMeta, meshBuffer) {
    const geometries = modelMeta.meshes.map((m) => {
      const i16 = new Int16Array(meshBuffer, m.posByteOffset, m.vertexCount * 3);
      const i8 = new Int8Array(meshBuffer, m.normByteOffset, m.vertexCount * 3);
      const idx = new Uint16Array(meshBuffer, m.idxByteOffset, m.indexCount);

      const pos = new Float32Array(m.vertexCount * 3);
      const norm = new Float32Array(m.vertexCount * 3);
      const spanX = m.max[0] - m.min[0];
      const spanY = m.max[1] - m.min[1];
      const spanZ = m.max[2] - m.min[2];

      for (let i = 0; i < m.vertexCount; i++) {
        const o = i * 3;
        pos[o] = m.min[0] + (i16[o] / 32767 + 1) * 0.5 * spanX;
        pos[o + 1] = m.min[1] + (i16[o + 1] / 32767 + 1) * 0.5 * spanY;
        pos[o + 2] = m.min[2] + (i16[o + 2] / 32767 + 1) * 0.5 * spanZ;
        norm[o] = i8[o] / 127;
        norm[o + 1] = i8[o + 1] / 127;
        norm[o + 2] = i8[o + 2] / 127;
      }

      const geo = new TV.BufferGeometry();
      geo.setAttribute('position', new TV.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new TV.BufferAttribute(norm, 3));
      geo.setIndex(new TV.BufferAttribute(idx, 1));
      return geo;
    });

    const materialCache = new Map();
    function getMat(rgba) {
      const key = rgba.map((v) => v.toFixed(2)).join(',');
      let mat = materialCache.get(key);
      if (!mat) {
        const isDark = rgba[0] < 0.35 && rgba[1] < 0.35 && rgba[2] < 0.35;
        mat = new TV.MeshStandardMaterial({
          color: new TV.Color(rgba[0], rgba[1], rgba[2]),
          metalness: isDark ? 0.32 : 0.42,
          roughness: isDark ? 0.58 : 0.44,
        });
        materialCache.set(key, mat);
      }
      return mat;
    }

    const rootGroup = new TV.Group();
    rootGroup.name = 'g1-robot';
    const bodyGroups = new Array(modelMeta.bodies.length);
    const bodyBaseQuats = new Array(modelMeta.bodies.length);
    const bodyAxisVecs = new Array(modelMeta.bodies.length);

    for (let b = 1; b < modelMeta.bodies.length; b++) {
      const bMeta = modelMeta.bodies[b];
      const group = new TV.Group();
      group.position.set(bMeta.pos[0], bMeta.pos[1], bMeta.pos[2]);
      const baseQ = new TV.Quaternion(bMeta.quat[1], bMeta.quat[2], bMeta.quat[3], bMeta.quat[0]);
      group.quaternion.copy(baseQ);
      bodyGroups[b] = group;
      bodyBaseQuats[b] = baseQ;
      bodyAxisVecs[b] = bMeta.joint
        ? new TV.Vector3(bMeta.joint.axis[0], bMeta.joint.axis[1], bMeta.joint.axis[2]).normalize()
        : null;

      if (bMeta.parent === 0) {
        rootGroup.add(group);
      } else {
        bodyGroups[bMeta.parent].add(group);
      }

      for (const g of bMeta.geoms) {
        const mesh = new TV.Mesh(geometries[g.meshIndex], getMat(g.rgba));
        mesh.position.set(g.pos[0], g.pos[1], g.pos[2]);
        mesh.quaternion.set(g.quat[1], g.quat[2], g.quat[3], g.quat[0]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      }
    }

    const hingeQuat = new TV.Quaternion();
    function applyQpos(qpos) {
      const pelvis = bodyGroups[1];
      pelvis.position.set(qpos[0], qpos[1], qpos[2]);
      pelvis.quaternion.set(qpos[4], qpos[5], qpos[6], qpos[3]).normalize();

      for (let b = 2; b < modelMeta.bodies.length; b++) {
        const bMeta = modelMeta.bodies[b];
        const group = bodyGroups[b];
        if (bMeta.joint) {
          hingeQuat.setFromAxisAngle(bodyAxisVecs[b], qpos[bMeta.joint.qadr]);
          group.quaternion.copy(bodyBaseQuats[b]).multiply(hingeQuat);
        } else {
          group.quaternion.copy(bodyBaseQuats[b]);
        }
      }
    }

    return { rootGroup, applyQpos };
  }

  function buildBvhRig(jointCount, edges, palette) {
    const rootGroup = new TV.Group();
    rootGroup.name = 'bvh-skeleton';

    const jointMat = new TV.MeshStandardMaterial({
      color: palette.joint,
      roughness: 0.35,
      metalness: 0.15,
    });
    const boneMat = new TV.MeshStandardMaterial({
      color: palette.bone,
      emissive: palette.boneEmissive,
      roughness: 0.55,
      metalness: 0.2,
    });

    const sphereGeo = new TV.SphereGeometry(0.025, 14, 10);
    const cylGeo = new TV.CylinderGeometry(0.016, 0.016, 1, 10);

    const joints = [];
    for (let j = 0; j < jointCount; j++) {
      const m = new TV.Mesh(sphereGeo, jointMat);
      m.castShadow = true;
      rootGroup.add(m);
      joints.push(m);
    }

    const bones = [];
    for (let e = 0; e < edges.length; e++) {
      const m = new TV.Mesh(cylGeo, boneMat);
      m.castShadow = true;
      rootGroup.add(m);
      bones.push(m);
    }

    const pA = new TV.Vector3();
    const pB = new TV.Vector3();
    const dir = new TV.Vector3();

    function applyPositions(jointArr) {
      for (let j = 0; j < jointCount; j++) {
        joints[j].position.set(jointArr[j * 3], jointArr[j * 3 + 1], jointArr[j * 3 + 2]);
      }
      for (let e = 0; e < edges.length; e++) {
        const [a, b] = edges[e];
        pA.copy(joints[a].position);
        pB.copy(joints[b].position);
        dir.subVectors(pB, pA);
        const len = dir.length();
        const bone = bones[e];
        bone.position.addVectors(pA, pB).multiplyScalar(0.5);
        if (len > 1e-4) {
          bone.visible = true;
          bone.scale.set(1, len, 1);
          dir.divideScalar(len);
          bone.quaternion.setFromUnitVectors(BONE_UP, dir);
        } else {
          bone.visible = false;
        }
      }
    }

    function applyTheme(nextPalette) {
      jointMat.color.setHex(nextPalette.joint);
      boneMat.color.setHex(nextPalette.bone);
      boneMat.emissive.setHex(nextPalette.boneEmissive);
    }

    return { rootGroup, applyPositions, applyTheme };
  }

  function decodeFrameBuffers(clipsMeta, clipsBuffer) {
    const nq = clipsMeta.nq;
    const J = clipsMeta.bvhJointCount;
    const stride = nq + J * 3;
    return clipsMeta.clips.map((c) => {
      const i16 = new Int16Array(clipsBuffer, c.byteOffset, c.byteLength / 2);
      const qpos = new Float32Array(c.frameCount * nq);
      const bvh = new Float32Array(c.frameCount * J * 3);
      for (let f = 0; f < c.frameCount; f++) {
        const src = f * stride;
        const dstQ = f * nq;
        for (let k = 0; k < nq; k++) {
          qpos[dstQ + k] = dequantize(i16[src + k], c.qposMin[k], c.qposMax[k]);
        }
        const dstB = f * J * 3;
        for (let j = 0; j < J; j++) {
          for (let comp = 0; comp < 3; comp++) {
            bvh[dstB + j * 3 + comp] = dequantize(
              i16[src + nq + j * 3 + comp],
              c.bvhMin[comp],
              c.bvhMax[comp]
            );
          }
        }
      }
      return { meta: c, qpos, bvh };
    });
  }

  function showFallback(msg) {
    stages.forEach((stage) => {
      stage.textContent = '';
      const note = document.createElement('div');
      note.className = 'kin-fallback';
      note.textContent = msg;
      stage.appendChild(note);
    });
  }

  async function boot() {
    let renderer;
    try {
      renderer = new TV.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      showFallback('3D WebGL preview unavailable on this device.');
      return;
    }

    const activeStage0 = findActiveStage();
    const initialPalette = getThemePalette();

    const scene = new TV.Scene();
    scene.background = new TV.Color(initialPalette.bg);
    scene.fog = new TV.Fog(initialPalette.bg, initialPalette.fogNear, initialPalette.fogFar);

    const camera = new TV.PerspectiveCamera(40, 1.5, 0.05, 80);
    camera.up.set(0, 0, 1);

    const isMobile = mobileMq.matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = TV.PCFSoftShadowMap;
    renderer.outputColorSpace = TV.SRGBColorSpace;

    const canvasEl = renderer.domElement;
    canvasEl.className = 'kin-webgl-canvas';
    canvasEl.style.display = 'block';
    canvasEl.style.position = 'absolute';
    canvasEl.style.inset = '0';
    canvasEl.style.width = '100%';
    canvasEl.style.height = '100%';
    canvasEl.style.touchAction = 'none';

    const hemi = new TV.HemisphereLight(0xdfeaff, 0x30363f, 1.05);
    hemi.position.set(0, 0, 1);
    scene.add(hemi);

    const dirLight = new TV.DirectionalLight(0xffffff, 2.25);
    dirLight.position.set(2.8, -2.6, 5.0);
    dirLight.castShadow = true;
    const shadowRes = isMobile ? 512 : 1024;
    dirLight.shadow.mapSize.set(shadowRes, shadowRes);
    dirLight.shadow.camera.left = -2.8;
    dirLight.shadow.camera.right = 2.8;
    dirLight.shadow.camera.top = 2.8;
    dirLight.shadow.camera.bottom = -2.8;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 16;
    dirLight.shadow.bias = -0.0004;
    dirLight.target.position.set(0, 0, 0.6);
    scene.add(dirLight);
    scene.add(dirLight.target);
    dirLight.target.updateMatrixWorld();

    let floorTex = createCheckerTexture(initialPalette.floor);
    const floorMat = new TV.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.92,
      metalness: 0.0,
    });
    const floorMesh = new TV.Mesh(new TV.PlaneGeometry(24, 24), floorMat);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    activeStage0.appendChild(canvasEl);

    const controls = new TV.OrbitControls(camera, canvasEl);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.maxPolarAngle = Math.PI * 0.51;
    controls.minPolarAngle = 0.25;
    controls.minDistance = 1.6;
    controls.maxDistance = 5.2;

    let currentStage = activeStage0;
    let needsRender = true;
    let userOrbited = false;
    controls.addEventListener('change', () => {
      needsRender = true;
    });
    controls.addEventListener('start', () => {
      userOrbited = true;
    });

    function resetCameraView() {
      const aspectScale = camera.aspect < 1.25 ? 1.25 / Math.max(0.8, camera.aspect) : 1.0;
      controls.target.set(0, 0, DEFAULT_TARGET_Z);
      camera.position.set(
        DEFAULT_CAM_OFFSET[0] * aspectScale,
        DEFAULT_CAM_OFFSET[1] * aspectScale,
        DEFAULT_TARGET_Z + DEFAULT_CAM_OFFSET[2] * aspectScale
      );
      controls.update();
      needsRender = true;
    }

    function resizeToStage(stage) {
      if (!stage) return;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (w < 4 || h < 4) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      if (!userOrbited) resetCameraView();
      needsRender = true;
    }

    function mountToActiveStage() {
      const next = findActiveStage();
      if (next && next !== currentStage) {
        next.appendChild(canvasEl);
        currentStage = next;
        inView = true;
      }
      resizeToStage(currentStage);
      startLoop();
    }

    resizeToStage(currentStage);

    const [modelMeta, meshBuffer, clipsMeta, clipsBuffer] = await Promise.all([
      fetch('assets/kinematics/g1-model.json').then((r) => {
        if (!r.ok) throw new Error('g1-model.json fetch failed');
        return r.json();
      }),
      fetch('assets/kinematics/g1-meshes.bin').then((r) => {
        if (!r.ok) throw new Error('g1-meshes.bin fetch failed');
        return r.arrayBuffer();
      }),
      fetch('assets/kinematics/clips.json').then((r) => {
        if (!r.ok) throw new Error('clips.json fetch failed');
        return r.json();
      }),
      fetch('assets/kinematics/clips.bin').then((r) => {
        if (!r.ok) throw new Error('clips.bin fetch failed');
        return r.arrayBuffer();
      }),
    ]);

    const g1Rig = buildG1Rig(modelMeta, meshBuffer);
    g1Rig.rootGroup.position.set(SIDE_OFFSET_X, 0, 0);
    scene.add(g1Rig.rootGroup);

    const bvhRig = buildBvhRig(clipsMeta.bvhJointCount, clipsMeta.bvhEdges, initialPalette);
    scene.add(bvhRig.rootGroup);

    const clips = decodeFrameBuffers(clipsMeta, clipsBuffer);
    const nq = clipsMeta.nq;
    const J = clipsMeta.bvhJointCount;
    const bvhCoordsCount = J * 3;
    const frameQpos = new Float32Array(nq);
    const frameBvh = new Float32Array(bvhCoordsCount);
    const qA = new TV.Quaternion();
    const qB = new TV.Quaternion();

    const clipBtns = [...document.querySelectorAll('[data-kin-clip]')];
    const pauseBtns = [...document.querySelectorAll('[data-kin-pause]')];
    const resetBtns = [...document.querySelectorAll('[data-kin-reset]')];
    const progressBars = [...document.querySelectorAll('[data-kin-progress]')];
    const zRootEls = [...document.querySelectorAll('[data-kin-zroot]')];
    const qKneeEls = [...document.querySelectorAll('[data-kin-qknee]')];
    const vxEls = [...document.querySelectorAll('[data-kin-vx]')];

    let clipIdx = 0;
    let frameFloat = 0;
    let userPaused = reduceMq.matches;
    let inView = true;
    let rafId = 0;
    let lastTs = 0;
    let lastUiTs = 0;
    let smoothSpeed = 0.85;
    let floorOffsetX = 0;
    let floorOffsetY = 0;

    function syncControlsUI() {
      const activeId = clips[clipIdx].meta.id;
      clipBtns.forEach((btn) => {
        const match = btn.getAttribute('data-kin-clip') === activeId;
        btn.classList.toggle('is-active', match);
        btn.setAttribute('aria-pressed', String(match));
      });
      pauseBtns.forEach((btn) => {
        btn.setAttribute('aria-pressed', String(userPaused));
        btn.textContent = userPaused ? '▶' : '‖';
      });
    }

    function poseAt(clip, fFloat, nowTs) {
      const total = clip.meta.frameCount;
      const wrapped = ((fFloat % total) + total) % total;
      const f0 = Math.floor(wrapped);
      const f1 = Math.min(total - 1, f0 + 1);
      const alpha = f0 === f1 ? 0 : wrapped - f0;

      const o0 = f0 * nq;
      const o1 = f1 * nq;
      for (let k = 0; k < 3; k++) {
        frameQpos[k] = clip.qpos[o0 + k] * (1 - alpha) + clip.qpos[o1 + k] * alpha;
      }
      qA.set(clip.qpos[o0 + 4], clip.qpos[o0 + 5], clip.qpos[o0 + 6], clip.qpos[o0 + 3]);
      qB.set(clip.qpos[o1 + 4], clip.qpos[o1 + 5], clip.qpos[o1 + 6], clip.qpos[o1 + 3]);
      qA.slerp(qB, alpha).normalize();
      frameQpos[3] = qA.w;
      frameQpos[4] = qA.x;
      frameQpos[5] = qA.y;
      frameQpos[6] = qA.z;
      for (let k = 7; k < nq; k++) {
        frameQpos[k] = clip.qpos[o0 + k] * (1 - alpha) + clip.qpos[o1 + k] * alpha;
      }

      const b0 = f0 * bvhCoordsCount;
      const b1 = f1 * bvhCoordsCount;
      for (let i = 0; i < bvhCoordsCount; i++) {
        frameBvh[i] = clip.bvh[b0 + i] * (1 - alpha) + clip.bvh[b1 + i] * alpha;
      }

      g1Rig.applyQpos(frameQpos);
      bvhRig.applyPositions(frameBvh);

      // Pin both figures symmetrically around (0, 0) on a virtual treadmill so neither drifts out of view
      g1Rig.rootGroup.position.set(SIDE_OFFSET_X - frameQpos[0], -frameQpos[1], 0);
      bvhRig.rootGroup.position.set(-SIDE_OFFSET_X - frameBvh[0], -frameBvh[1], 0);

      // Scroll checkerboard floor UVs in sync with true world motion (2m checker repeat period)
      floorOffsetX = (((frameQpos[0] / 2) % 1) + 1) % 1;
      floorOffsetY = (((frameQpos[1] / 2) % 1) + 1) % 1;
      floorTex.offset.set(floorOffsetX, floorOffsetY);

      // Update UI progress bar & telemetry at ~12Hz
      const ratio = total > 1 ? wrapped / (total - 1) : 0;
      progressBars.forEach((bar) => {
        bar.style.transform = `scaleX(${Math.max(0.02, Math.min(1, ratio)).toFixed(3)})`;
      });

      if (!nowTs || nowTs - lastUiTs >= 85) {
        lastUiTs = nowTs || 0;
        const zRootTxt = `${frameQpos[2].toFixed(2)} m`;
        zRootEls.forEach((el) => {
          el.textContent = zRootTxt;
        });

        const qKnee = frameQpos[modelMeta.kneeQposIndex];
        const kneeTxt = `${qKnee >= 0 ? '+' : ''}${qKnee.toFixed(2)} rad`;
        qKneeEls.forEach((el) => {
          el.textContent = kneeTxt;
        });

        const fPrev = Math.max(0, f0 - 1);
        const fNext = Math.min(total - 1, f0 + 1);
        const spanFrames = Math.max(1, fNext - fPrev);
        const vxInstant =
          (Math.hypot(
            clip.qpos[fNext * nq] - clip.qpos[fPrev * nq],
            clip.qpos[fNext * nq + 1] - clip.qpos[fPrev * nq + 1]
          ) *
            clip.meta.fps) /
          spanFrames;
        smoothSpeed += (vxInstant - smoothSpeed) * 0.35;
        const vxTxt = `${smoothSpeed.toFixed(2)} m/s`;
        vxEls.forEach((el) => {
          el.textContent = vxTxt;
        });
      }

      needsRender = true;
    }

    function selectClip(nextIdx) {
      clipIdx = ((nextIdx % clips.length) + clips.length) % clips.length;
      frameFloat = 0;
      smoothSpeed = 0;
      syncControlsUI();
      poseAt(clips[clipIdx], 0, 0);
    }

    // Initial frame + camera framing
    syncControlsUI();
    poseAt(clips[0], 0, 0);
    resetCameraView();

    function step(ts) {
      rafId = 0;
      if (!inView || document.hidden) {
        lastTs = 0;
        return;
      }
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;

      if (!userPaused) {
        const clip = clips[clipIdx];
        frameFloat += dt * clip.meta.fps;
        if (frameFloat >= clip.meta.frameCount - 1) {
          clipIdx = (clipIdx + 1) % clips.length;
          frameFloat = 0;
          syncControlsUI();
          poseAt(clips[clipIdx], 0, ts);
        } else {
          poseAt(clip, frameFloat, ts);
        }
      }

      controls.update();
      if (needsRender) {
        renderer.render(scene, camera);
        needsRender = false;
      }

      rafId = window.requestAnimationFrame(step);
    }

    function startLoop() {
      if (!rafId && inView && !document.hidden) {
        lastTs = 0;
        rafId = window.requestAnimationFrame(step);
      }
    }

    function stopLoop() {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      lastTs = 0;
    }

    // Event bindings
    clipBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-kin-clip');
        const idx = clips.findIndex((c) => c.meta.id === id);
        if (idx >= 0) {
          userPaused = false;
          selectClip(idx);
          startLoop();
        }
      });
    });

    pauseBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        userPaused = !userPaused;
        syncControlsUI();
        needsRender = true;
        startLoop();
      });
    });

    resetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        userOrbited = false;
        resetCameraView();
      });
    });

    stages.forEach((stage) => {
      stage.addEventListener('dblclick', () => {
        userOrbited = false;
        resetCameraView();
      });
    });

    const themeObserver = new MutationObserver((mutations) => {
      let themeChanged = false;
      mutations.forEach((m) => {
        if (m.attributeName === 'data-theme') themeChanged = true;
      });
      if (themeChanged) {
        const nextPalette = getThemePalette();
        scene.background = new TV.Color(nextPalette.bg);
        scene.fog = new TV.Fog(nextPalette.bg, nextPalette.fogNear, nextPalette.fogFar);
        const oldTex = floorTex;
        floorTex = createCheckerTexture(nextPalette.floor);
        floorTex.offset.set(floorOffsetX, floorOffsetY);
        floorMat.map = floorTex;
        floorMat.needsUpdate = true;
        oldTex.dispose();
        bvhRig.applyTheme(nextPalette);
        needsRender = true;
      }
    });
    themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    window.addEventListener('cl:langchange', () => {
      window.requestAnimationFrame(() => {
        mountToActiveStage();
        syncControlsUI();
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      resizeToStage(currentStage);
    });
    stages.forEach((s) => resizeObserver.observe(s));

    const visObserver = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries.find((entry) => entry.target === currentStage);
        if (!activeEntry) return;
        inView = activeEntry.isIntersecting;
        if (inView) {
          needsRender = true;
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.05 }
    );
    stages.forEach((s) => visObserver.observe(s));

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopLoop();
      else {
        needsRender = true;
        startLoop();
      }
    });

    startLoop();
  }

  boot().catch(() => {
    showFallback('Unable to load 3D kinematics data.');
  });
})();
