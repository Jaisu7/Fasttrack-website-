import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import mark from "./brand-mark.json";
import {
  clampProgress,
  manufacturingState,
  smoothRange,
} from "./journey-state.mjs";

type Vec3 = [number, number, number];
type Callbacks = {
  ready(): void;
  unavailable(): void;
  progress?(value: number, stage: string): void;
};
export interface ManufacturingScene {
  setProgress(value: number): void;
  /** Pointer coordinates in [-1, 1]; (0, 0) is neutral. */
  setPointer(x: number, y: number): void;
  pause(value: boolean): void;
  reset(): void;
  destroy(): void;
}

type PathSegment = {
  a: THREE.Vector3;
  b: THREE.Vector3;
  length: number;
  cutting: boolean;
  cutCount: number;
};
const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, value));
const pathSegments: PathSegment[] = [];
const cutPositions: number[] = [];
const panelWidth = 3.4,
  panelDepth = 1.3,
  centerWidth = 2,
  panelThickness = 0.022;
const punchPoints = Array.from(
  { length: 12 },
  (_, i) =>
    new THREE.Vector3(i < 6 ? -1.34 : 1.34, 0.024, -0.45 + (i % 6) * 0.18),
);
let totalPathLength = 0,
  cutCount = 0;
const contours = (mark as number[][][]).map((contour) =>
  contour.map(
    ([x, y]) => new THREE.Vector3((x - 0.5) * 1.42, 0.025, (y - 0.5) * 0.92),
  ),
);
contours.forEach((contour, index) => {
  if (index) {
    const a = contours[index - 1].at(-1)!,
      b = contour[0];
    const length = a.distanceTo(b);
    pathSegments.push({ a, b, length, cutting: false, cutCount });
    totalPathLength += length;
  }
  for (let i = 1; i < contour.length; i++) {
    const a = contour[i - 1],
      b = contour[i],
      length = a.distanceTo(b);
    cutPositions.push(...a.toArray(), ...b.toArray());
    cutCount++;
    pathSegments.push({ a, b, length, cutting: true, cutCount });
    totalPathLength += length;
  }
});
function pathAt(progress: number) {
  let remaining = clampProgress(progress) * totalPathLength;
  for (const segment of pathSegments) {
    if (remaining <= segment.length) {
      const t = segment.length ? remaining / segment.length : 0;
      return {
        point: segment.a.clone().lerp(segment.b, t),
        cutting: segment.cutting,
        cutCount: segment.cutCount,
      };
    }
    remaining -= segment.length;
  }
  return { point: contours.at(-1)!.at(-1)!.clone(), cutting: false, cutCount };
}

/** Native scroll-driven fabrication concept. One primary panel remains the cabinet's rear/side shell. */
export function createManufacturingScene(
  canvas: HTMLCanvasElement,
  callbacks: Callbacks,
): ManufacturingScene {
  canvas.dataset.ready = "false";
  canvas.dataset.stage = "raw-steel";
  canvas.dataset.progress = "0.0000";
  const noScene: ManufacturingScene = {
    setProgress(value) {
      const state = manufacturingState(value);
      canvas.dataset.progress = state.progress.toFixed(4);
      canvas.dataset.stage = state.stage;
      canvas.dataset.stageIndex = String(state.stageIndex);
      callbacks.progress?.(state.progress, state.stage);
    },
    setPointer() {},
    pause(value) {
      canvas.dataset.paused = String(value);
    },
    reset() {
      noScene.setProgress(0);
    },
    destroy() {},
  };
  const contextAttributes: WebGLContextAttributes = {
    alpha: false,
    antialias: true,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: "low-power",
  };
  let context: WebGL2RenderingContext | null;
  try {
    context = canvas.getContext("webgl2", contextAttributes);
  } catch {
    callbacks.unavailable();
    return noScene;
  }
  if (!context) {
    callbacks.unavailable();
    return noScene;
  }
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      context,
      alpha: false,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    callbacks.unavailable();
    return noScene;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101619);
  scene.fog = new THREE.Fog(0x101619, 14, 35);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 70);
  let environmentTarget: THREE.WebGLRenderTarget;
  try {
    const environment = new RoomEnvironment(),
      generator = new THREE.PMREMGenerator(renderer);
    environmentTarget = generator.fromScene(environment, 0.04);
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 0.82;
    generator.dispose();
    environment.dispose();
  } catch {
    renderer.dispose();
    renderer.forceContextLoss();
    callbacks.unavailable();
    return noScene;
  }

  const grain = brushedTexture();
  const steel = new THREE.MeshPhysicalMaterial({
    color: 0xbac7ca,
    map: grain,
    metalness: 0.97,
    roughness: 0.34,
    roughnessMap: grain,
    bumpMap: grain,
    bumpScale: 0.00065,
    envMapIntensity: 1.15,
    clearcoat: 0.08,
    clearcoatRoughness: 0.3,
  });
  const polished = new THREE.MeshStandardMaterial({
    color: 0xc5cfd2,
    metalness: 1,
    roughness: 0.16,
    envMapIntensity: 1.1,
  });
  const graphite = new THREE.MeshStandardMaterial({
    color: 0x182125,
    metalness: 0.65,
    roughness: 0.35,
  });
  const black = new THREE.MeshStandardMaterial({
    color: 0x080e11,
    metalness: 0.2,
    roughness: 0.65,
  });
  const copper = new THREE.MeshStandardMaterial({
    color: 0xba733e,
    metalness: 0.9,
    roughness: 0.25,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x11171a,
    roughness: 0.82,
  });
  const key = new THREE.DirectionalLight(0xe9f2f7, 2.5);
  key.position.set(-3.5, 7, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -4;
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 20;
  key.shadow.normalBias = 0.012;
  key.shadow.bias = -0.00015;
  key.target.position.set(0, 1, 0);
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xb8cbd7, 1.05);
  fill.position.set(4, 3, -3);
  scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xdce9ed, 0x10171b, 0.75));
  const rim = new THREE.DirectionalLight(0xb0ddd3, 1.3);
  rim.position.set(0, 4, -5);
  scene.add(rim);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshBasicMaterial({
      color: 0x101619,
      toneMapped: false,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.008;
  floor.receiveShadow = true;
  scene.add(floor);
  const shadowMap = radialTexture(0x000000);
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 3.8),
    new THREE.MeshBasicMaterial({
      map: shadowMap,
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = -0.004;
  scene.add(contact);

  function mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D = scene,
  ) {
    const object = new THREE.Mesh(geometry, material);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(
    size: Vec3,
    at: Vec3,
    material: THREE.Material = steel,
    parent: THREE.Object3D = scene,
    radius = 0.01,
  ) {
    const object = mesh(
      new RoundedBoxGeometry(
        ...size,
        2,
        Math.min(radius, ...size.map((v) => v * 0.22)),
      ),
      material,
      parent,
    );
    object.position.set(...at);
    return object;
  }
  function cylinder(
    top: number,
    bottom: number,
    height: number,
    at: Vec3,
    material: THREE.Material = polished,
    parent: THREE.Object3D = scene,
  ) {
    const object = mesh(
      new THREE.CylinderGeometry(top, bottom, height, 30),
      material,
      parent,
    );
    object.position.set(...at);
    return object;
  }
  function tube(
    points: Vec3[],
    radius: number,
    material: THREE.Material,
    parent: THREE.Object3D = scene,
  ) {
    return mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        32,
        radius,
        8,
        false,
      ),
      material,
      parent,
    );
  }
  function rod(
    a: Vec3,
    b: Vec3,
    radius: number,
    material: THREE.Material,
    parent: THREE.Object3D = scene,
  ) {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b),
      delta = end.clone().sub(start);
    const object = cylinder(
      radius,
      radius,
      delta.length(),
      [0, 0, 0],
      material,
      parent,
    );
    object.position.copy(start).add(end).multiplyScalar(0.5);
    object.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
    return object;
  }
  function bolt(
    at: Vec3,
    parent: THREE.Object3D,
    axis: "front" | "top" = "front",
  ) {
    const object = cylinder(0.018, 0.018, 0.009, at, polished, parent);
    if (axis === "front") object.rotation.x = Math.PI / 2;
    const slot = box(
      [0.018, 0.004, 0.002],
      [0, 0, 0.006],
      black,
      object,
      0.0005,
    );
    slot.rotation.x = Math.PI / 2;
    return object;
  }

  const bench = new THREE.Group();
  scene.add(bench);
  box([3.85, 0.18, 1.82], [0, 0.68, 0], graphite, bench, 0.018);
  for (let i = 0; i < 18; i++)
    box(
      [0.038, 0.075, 1.71],
      [-1.73 + i * 0.205, 0.786, 0],
      graphite,
      bench,
      0.002,
    );
  for (const x of [-1.58, 1.58])
    for (const z of [-0.65, 0.65])
      box([0.12, 0.58, 0.12], [x, 0.3, z], graphite, bench);
  box([3.8, 0.1, 1.78], [0, 0.06, 0], graphite, bench);
  const plinth = box(
    [4, 0.65, 1.85],
    [0, 0.47, 0],
    new THREE.MeshStandardMaterial({
      color: 0x0b1114,
      metalness: 0.18,
      roughness: 0.64,
    }),
    scene,
    0.018,
  );
  const product = new THREE.Group();
  product.position.y = 0.85;
  scene.add(product);
  const primaryRig = new THREE.Group();
  product.add(primaryRig);
  const primary = mesh(new THREE.BufferGeometry(), steel, primaryRig);
  primary.name = "representative-primary-panel";
  let primaryBase = new Float32Array(),
    holes = -1,
    lastLeft = -1,
    lastRight = -1;
  function replacePrimary(count: number) {
    if (holes === count) return;
    const geometries: THREE.BufferGeometry[] = [];
    for (const [left, right] of [
      [-panelWidth / 2, -centerWidth / 2],
      [-centerWidth / 2, centerWidth / 2],
      [centerWidth / 2, panelWidth / 2],
    ]) {
      const shape = new THREE.Shape();
      shape.moveTo(left, -panelDepth / 2);
      shape.lineTo(right, -panelDepth / 2);
      shape.lineTo(right, panelDepth / 2);
      shape.lineTo(left, panelDepth / 2);
      shape.closePath();
      punchPoints
        .slice(0, count)
        .filter((p) => p.x > left && p.x < right)
        .forEach((p) => {
          const hole = new THREE.Path();
          hole.absarc(p.x, -p.z, 0.044, 0, Math.PI * 2, true);
          shape.holes.push(hole);
        });
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: panelThickness,
        steps: 1,
        bevelEnabled: false,
        curveSegments: 16,
      });
      geometry.rotateX(-Math.PI / 2);
      geometries.push(geometry);
    }
    const geometry = mergeGeometries(geometries, false)!;
    geometries.forEach((g) => g.dispose());
    primary.geometry.dispose();
    primary.geometry = geometry;
    primaryBase = new Float32Array(
      geometry.getAttribute("position").array as Float32Array,
    );
    holes = count;
    lastLeft = lastRight = -1;
  }
  function foldPrimary(left: number, right: number) {
    if (left === lastLeft && right === lastRight) return;
    const attribute = primary.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const positions = attribute.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = primaryBase[i],
        thickness = primaryBase[i + 1];
      const angle = ((x < -1 ? left : x > 1 ? right : 0) * Math.PI) / 2;
      if (x < -1) {
        const length = -1 - x;
        positions[i] =
          -1 - length * Math.cos(angle) + thickness * Math.sin(angle);
        positions[i + 1] =
          length * Math.sin(angle) + thickness * Math.cos(angle);
      } else if (x > 1) {
        const length = x - 1;
        positions[i] =
          1 + length * Math.cos(angle) - thickness * Math.sin(angle);
        positions[i + 1] =
          length * Math.sin(angle) + thickness * Math.cos(angle);
      } else {
        positions[i] = x;
        positions[i + 1] = thickness;
      }
      positions[i + 2] = primaryBase[i + 2];
    }
    attribute.needsUpdate = true;
    primary.geometry.computeVertexNormals();
    primary.geometry.computeBoundingSphere();
    lastLeft = left;
    lastRight = right;
  }
  replacePrimary(0);
  foldPrimary(0, 0);
  const cutGeometry = new THREE.BufferGeometry();
  cutGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(cutPositions, 3),
  );
  const cutMaterial = new THREE.LineBasicMaterial({
    color: 0x11191b,
    transparent: true,
    opacity: 0.96,
  });
  const kerf = new THREE.LineSegments(cutGeometry, cutMaterial);
  primaryRig.add(kerf);
  const hotGeometry = cutGeometry.clone();
  const hotLine = new THREE.LineSegments(
    hotGeometry,
    new THREE.LineBasicMaterial({
      color: 0xffbb73,
      transparent: true,
      opacity: 0.9,
      toneMapped: false,
    }),
  );
  primaryRig.add(hotLine);

  const additional = new THREE.Group();
  product.add(additional);
  const topPanel = box(
    [2.06, 0.045, 0.76],
    [0, 0.675, 0.35],
    steel,
    additional,
  );
  const basePanel = box([2.0, 0.035, 0.7], [0, -0.65, 0.35], steel, additional);
  const shelfPanel = box(
    [1.96, 0.027, 0.65],
    [0, -0.06, 0.35],
    steel,
    additional,
  );
  for (const x of [-0.88, 0.88])
    for (const z of [0.09, 0.61]) {
      cylinder(0.026, 0.026, 0.18, [x, -0.75, z], polished, additional);
      cylinder(0.037, 0.037, 0.035, [x, -0.8325, z], rubber, additional);
    }
  const doors: { root: THREE.Group; sign: number }[] = [];
  for (const sign of [-1, 1]) {
    const hinge = new THREE.Group();
    product.add(hinge);
    hinge.position.set(sign, 0, 0.725);
    const center = -sign * 0.492;
    box([0.976, 1.23, 0.032], [center, 0, 0], steel, hinge, 0.012);
    const handleX = center - sign * 0.33;
    rod([handleX, -0.13, 0.06], [handleX, 0.13, 0.06], 0.012, polished, hinge);
    for (const y of [-0.13, 0.13])
      rod([handleX, y, 0.02], [handleX, y, 0.06], 0.009, polished, hinge);
    for (const y of [-0.42, 0.42]) {
      box([0.027, 0.1, 0.028], [0, y, 0.012], polished, hinge);
      bolt([0, y, 0.03], hinge);
    }
    if (sign === -1) {
      const badgeGeometry = new THREE.BufferGeometry();
      const positions: number[] = [];
      for (let i = 0; i < cutPositions.length; i += 3)
        positions.push(
          cutPositions[i] * 0.24 + center - 0.08,
          -cutPositions[i + 2] * 0.24 + 0.24,
          0.019,
        );
      badgeGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      hinge.add(
        new THREE.LineSegments(
          badgeGeometry,
          new THREE.LineBasicMaterial({ color: 0x0b8060 }),
        ),
      );
    }
    doors.push({ root: hinge, sign });
  }

  const laser = new THREE.Group();
  scene.add(laser);
  box([0.53, 0.34, 0.38], [0, 0.76, 0], graphite, laser, 0.02);
  cylinder(0.18, 0.18, 0.34, [0, 0.46, 0], polished, laser);
  cylinder(0.195, 0.195, 0.075, [0, 0.26, 0], graphite, laser);
  cylinder(0.134, 0.134, 0.09, [0, 0.178, 0], polished, laser);
  cylinder(0.112, 0.007, 0.135, [0, 0.068, 0], copper, laser);
  for (const x of [-0.18, 0.18])
    for (const y of [0.66, 0.86]) bolt([x, y, 0.197], laser);
  tube(
    [
      [0.02, 0.89, -0.13],
      [0.16, 1.05, -0.24],
      [0.42, 1.1, -0.25],
      [0.62, 1.32, -0.31],
    ],
    0.034,
    rubber,
    laser,
  );
  const punch = new THREE.Group();
  scene.add(punch);
  box([0.57, 0.28, 0.42], [0, 0.8, 0], graphite, punch, 0.018);
  cylinder(0.2, 0.2, 0.42, [0, 0.46, 0], polished, punch);
  cylinder(0.214, 0.214, 0.095, [0, 0.31, 0], graphite, punch);
  cylinder(0.11, 0.11, 0.18, [0, 0.16, 0], polished, punch);
  cylinder(0.043, 0.043, 0.09, [0, 0.045, 0], polished, punch);
  for (const x of [-0.18, 0.18]) bolt([x, 0.8, 0.216], punch);
  const press = new THREE.Group();
  scene.add(press);
  box([0.33, 0.38, 1.68], [0, 0.55, 0], graphite, press);
  box([0.2, 0.22, 1.57], [0, 0.26, 0], polished, press, 0.004);
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.1, 0.15);
  bladeShape.lineTo(0.1, 0.15);
  bladeShape.lineTo(0, 0);
  bladeShape.closePath();
  const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 1.58,
    bevelEnabled: false,
  });
  const blade = mesh(bladeGeometry, polished, press);
  blade.position.z = -0.79;
  for (let i = 0; i < 6; i++) {
    const b = bolt([0.172, 0.55, -0.66 + i * 0.264], press);
    b.rotation.z = Math.PI / 2;
  }
  const lowerDie = new THREE.Group();
  scene.add(lowerDie);
  box([0.37, 0.16, 1.78], [0, 0.72, 0], graphite, lowerDie);
  for (const sign of [-1, 1])
    box(
      [0.075, 0.055, 1.75],
      [sign * 0.125, 0.817, 0],
      polished,
      lowerDie,
      0.003,
    );

  const torch = new THREE.Group();
  scene.add(torch);
  torch.rotation.z = -0.65;
  cylinder(0.053, 0.037, 0.22, [0, 0.11, 0], copper, torch);
  cylinder(0.058, 0.058, 0.055, [0, 0.245, 0], polished, torch);
  tube(
    [
      [0, 0.27, 0],
      [0.04, 0.42, 0],
      [0.17, 0.53, 0],
      [0.31, 0.55, 0],
    ],
    0.032,
    polished,
    torch,
  );
  const handle = cylinder(0.065, 0.065, 0.34, [0.46, 0.55, 0], graphite, torch);
  handle.rotation.z = -Math.PI / 2;
  tube(
    [
      [0.62, 0.55, 0],
      [0.85, 0.61, -0.06],
      [1.05, 0.77, -0.1],
    ],
    0.04,
    rubber,
    torch,
  );
  rod([0, -0.018, 0], [0, 0.015, 0], 0.003, polished, torch);
  const weldSegments = [
    [
      new THREE.Vector3(-0.978, -0.63, 0.028),
      new THREE.Vector3(-0.978, 0.63, 0.028),
    ],
    [
      new THREE.Vector3(0.978, 0.63, 0.028),
      new THREE.Vector3(0.978, -0.63, 0.028),
    ],
    [
      new THREE.Vector3(-0.975, 0.664, 0.03),
      new THREE.Vector3(-0.975, 0.664, 0.68),
    ],
    [
      new THREE.Vector3(0.975, 0.664, 0.68),
      new THREE.Vector3(0.975, 0.664, 0.03),
    ],
    [
      new THREE.Vector3(-0.97, -0.63, 0.68),
      new THREE.Vector3(0.97, -0.63, 0.68),
    ],
  ];
  const weldLength = weldSegments.reduce(
    (sum, [a, b]) => sum + a.distanceTo(b),
    0,
  );
  const beads = weldSegments.map(([a, b]) => {
    const length = a.distanceTo(b),
      count = Math.max(8, Math.ceil(length / 0.028));
    const geometry = new THREE.TubeGeometry(
      new THREE.LineCurve3(a, b),
      count,
      0.008,
      6,
      false,
    );
    const object = mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0x89999c,
        metalness: 0.95,
        roughness: 0.29,
      }),
      product,
    );
    return { object, length, count };
  });
  function weldAt(progress: number) {
    let remaining = clampProgress(progress) * weldLength;
    for (const [a, b] of weldSegments) {
      const length = a.distanceTo(b);
      if (remaining <= length) return a.clone().lerp(b, remaining / length);
      remaining -= length;
    }
    return weldSegments.at(-1)![1].clone();
  }

  const arcMap = radialTexture(0xffffff);
  function glowSprite(color: number, size: number) {
    const material = new THREE.SpriteMaterial({
      map: arcMap,
      color,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.setScalar(size);
    scene.add(sprite);
    return sprite;
  }
  const cutGlow = glowSprite(0xffc071, 0.18),
    weldGlow = glowSprite(0xcdeeff, 0.26);
  const hotLight = new THREE.PointLight(0xffa94d, 0, 1.1, 2),
    arcLight = new THREE.PointLight(0xaaddff, 0, 1.65, 2);
  scene.add(hotLight, arcLight);
  const particleCount = 64,
    particlePositions = new Float32Array(particleCount * 3),
    particleColors = new Float32Array(particleCount * 3);
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3),
  );
  particleGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(particleColors, 3),
  );
  const sparks = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      size: 0.029,
      map: arcMap,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      sizeAttenuation: true,
    }),
  );
  sparks.frustumCulled = false;
  scene.add(sparks);

  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = preference.matches,
    paused = false,
    alive = true,
    failed = false,
    visible = false,
    ready = false;
  let progress = 0,
    elapsed = 0,
    showroomTime = 0,
    frameId = 0,
    lastTime = 0,
    dirtyFrames = 2,
    width = 1,
    height = 1;
  let pointerX = 0,
    pointerY = 0,
    targetX = 0,
    targetY = 0,
    lastReported = -1,
    lastStage = "";
  const tip = new THREE.Vector3();
  function stop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = lastTime = 0;
  }
  function wake() {
    if (!alive || failed || !visible || document.hidden || frameId) return;
    frameId = requestAnimationFrame(frame);
  }
  function fail() {
    if (!alive || failed) return;
    failed = true;
    stop();
    canvas.dataset.ready = "false";
    callbacks.unavailable();
  }
  function resize() {
    if (!alive || failed) return;
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    if (width >= 720)
      camera.setViewOffset(width, height, -width * 0.2, 0, width, height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    dirtyFrames = 2;
    if (width > 1 && height > 1) draw(0);
    if (!ready && !failed && width > 1 && height > 1) {
      ready = true;
      canvas.dataset.ready = "true";
      callbacks.ready();
    }
    wake();
  }
  function draw(dt: number) {
    if (!alive || failed) return;
    const state = manufacturingState(progress);
    const easing = reduced || !dt ? 1 : 1 - Math.exp(-dt * 6);
    pointerX += (targetX - pointerX) * easing;
    pointerY += (targetY - pointerY) * easing;
    const stageMoving = !paused && !reduced;
    if (stageMoving) elapsed += dt;
    if (state.stageIndex === 5 && stageMoving) showroomTime += dt;
    else if (state.stageIndex !== 5) showroomTime = 0;
    product.position.x = (1 - smoothRange(state.raw, 0, 1)) * 0.5;
    plinth.visible = progress < 0.115;
    plinth.position.y = 0.47 - smoothRange(progress, 0.065, 0.115) * 1.1;
    product.rotation.y =
      smoothRange(state.finish, 0.05, 1) * Math.PI * 0.58 +
      (state.stageIndex === 5 ? showroomTime * 0.14 : 0);
    primaryRig.rotation.x = (state.upright * Math.PI) / 2;
    replacePrimary(
      Math.min(
        punchPoints.length,
        Math.floor(state.punch * punchPoints.length + 0.35),
      ),
    );
    foldPrimary(state.foldLeft, state.foldRight);
    const laserPath = pathAt(state.laser);
    cutGeometry.setDrawRange(
      0,
      state.laser >= 1 ? cutCount * 2 : laserPath.cutCount * 2,
    );
    if (!state.laser) cutGeometry.setDrawRange(0, 0);
    hotGeometry.setDrawRange(
      Math.max(0, laserPath.cutCount - 12) * 2,
      Math.min(12, laserPath.cutCount) * 2,
    );
    hotLine.visible = state.stageIndex === 1 && laserPath.cutting;
    const benchRetreat = smoothRange(progress, 0.652, 0.7);
    bench.position.y = -benchRetreat * 1.3;
    bench.visible = progress >= 0.075 && benchRetreat < 0.999;
    product.updateMatrixWorld(true);
    laser.visible = progress > 0.115 && progress < 0.355;
    const laserPresence =
      smoothRange(progress, 0.115, 0.145) *
      (1 - smoothRange(progress, 0.327, 0.355));
    laser.position.copy(primaryRig.localToWorld(laserPath.point.clone()));
    laser.position.y += 0.012 + (1 - laserPresence) * 1.8;
    punch.visible = progress > 0.332 && progress < 0.513;
    const punchPosition = Math.min(
      punchPoints.length - 1,
      Math.floor(state.punch * punchPoints.length),
    );
    const phase = (state.punch * punchPoints.length) % 1;
    const previous = punchPoints[Math.max(0, punchPosition - 1)];
    const punchPoint = previous
      .clone()
      .lerp(punchPoints[punchPosition], smoothRange(phase, 0.02, 0.31));
    const stroke =
      smoothRange(phase, 0.33, 0.59) * (1 - smoothRange(phase, 0.71, 0.94));
    const punchPresence =
      smoothRange(progress, 0.332, 0.35) *
      (1 - smoothRange(progress, 0.49, 0.513));
    punch.position.copy(primaryRig.localToWorld(punchPoint));
    punch.position.y += (1 - stroke) * 0.2 + (1 - punchPresence) * 1.5;
    press.visible = lowerDie.visible = progress > 0.49 && progress < 0.666;
    const pressX = -1 + smoothRange(progress, 0.575, 0.587) * 2;
    const pressStroke =
      progress < 0.582
        ? smoothRange(progress, 0.498, 0.51) *
          (1 - smoothRange(progress, 0.566, 0.577))
        : smoothRange(progress, 0.585, 0.591) *
          (1 - smoothRange(progress, 0.648, 0.654));
    const pressPresence =
      smoothRange(progress, 0.49, 0.51) *
      (1 - smoothRange(progress, 0.65, 0.666));
    press.position.set(
      pressX,
      0.875 + (1 - pressStroke) * 0.65 + (1 - pressPresence) * 1.3,
      0,
    );
    lowerDie.position.set(pressX, -benchRetreat * 1.3, 0);
    additional.visible = progress > 0.677;
    const parts = smoothRange(progress, 0.679, 0.731);
    topPanel.position.set(
      0,
      0.675 + (1 - parts) * 1.3,
      0.35 - (1 - parts) * 0.4,
    );
    basePanel.position.set((1 - parts) * 1.9, -0.65, 0.35 + (1 - parts) * 0.5);
    shelfPanel.position.set(
      -(1 - parts) * 1.7,
      -0.06 + (1 - parts) * 0.4,
      0.35 + (1 - parts) * 0.8,
    );
    for (const { root, sign } of doors) {
      root.visible = state.doors > 0.001;
      root.position.set(
        sign * (1 + (1 - state.doors) * 0.65),
        (1 - state.doors) * 0.45,
        0.725 + (1 - state.doors) * 1.8,
      );
      root.rotation.y = sign * (1 - state.doors) * 0.7;
    }
    let remaining = state.weld * weldLength;
    for (const bead of beads) {
      const amount = clampProgress(remaining / bead.length);
      bead.object.visible = amount > 0 && progress >= 0.705;
      bead.object.geometry.setDrawRange(
        0,
        Math.floor(amount * bead.count) * 6 * 6,
      );
      remaining -= bead.length;
    }
    product.updateMatrixWorld(true);
    const weldPoint = product.localToWorld(weldAt(state.weld));
    torch.visible = progress > 0.692 && progress < 0.85;
    const torchPresence =
      smoothRange(progress, 0.692, 0.712) *
      (1 - smoothRange(progress, 0.826, 0.85));
    torch.position.copy(weldPoint);
    torch.position.y += (1 - torchPresence) * 1.4;
    const cutting =
      state.stageIndex === 1 && laserPath.cutting && laserPresence > 0.5;
    const welding =
      state.stageIndex === 4 &&
      state.weld > 0 &&
      state.weld < 1 &&
      torchPresence > 0.5;
    cutGlow.visible = cutting;
    weldGlow.visible = welding;
    cutGlow.position.copy(primaryRig.localToWorld(laserPath.point.clone()));
    weldGlow.position.copy(weldPoint);
    hotLight.position.copy(cutGlow.position);
    arcLight.position.copy(weldPoint);
    hotLight.intensity = cutting ? 0.75 : 0;
    arcLight.intensity = welding ? 1.4 : 0;
    sparks.visible = (cutting || welding) && !reduced;
    tip.copy(welding ? weldPoint : cutGlow.position);
    if (sparks.visible) {
      for (let i = 0; i < particleCount; i++) {
        const age = (elapsed * 2.3 + i * 0.618) % 1,
          angle = i * 2.399963,
          speed = 0.2 + (i % 9) * 0.07,
          life = 1 - age;
        particlePositions[i * 3] = tip.x + Math.cos(angle) * age * speed;
        particlePositions[i * 3 + 1] =
          tip.y + Math.sin(angle * 0.7) * age * 0.28 - age * age * 0.24;
        particlePositions[i * 3 + 2] = tip.z + Math.sin(angle) * age * speed;
        particleColors[i * 3] = life * 1.8;
        particleColors[i * 3 + 1] = life * (welding ? 0.68 : 0.92);
        particleColors[i * 3 + 2] = life * 0.22;
      }
      particleGeometry.getAttribute("position").needsUpdate = true;
      particleGeometry.getAttribute("color").needsUpdate = true;
    }
    const aspect = width / height,
      usableAspect = width >= 720 ? aspect * 0.56 : aspect * 0.94;
    const fit = Math.max(
      6.3,
      (panelWidth /
        (2 * Math.tan(THREE.MathUtils.degToRad(38) / 2) * usableAspect)) *
        1.1,
    );
    const cameraDistance = fit * (1 - smoothRange(state.finish, 0, 0.7) * 0.17);
    const direction = new THREE.Vector3(
      2.8 + pointerX * 0.3,
      4.6 - state.upright * 2.15 - pointerY * 0.2,
      5.8,
    ).normalize();
    const target = new THREE.Vector3(
      0,
      0.98 - state.upright * 0.12,
      0.12 + state.upright * 0.2,
    );
    camera.position.copy(target).addScaledVector(direction, cameraDistance);
    camera.lookAt(target);
    fill.position.x = 4 + pointerX;
    fill.position.y = 3.2 - pointerY * 0.5;
    try {
      renderer.render(scene, camera);
    } catch {
      fail();
      return;
    }
    canvas.dataset.stage = state.stage;
    canvas.dataset.stageIndex = String(state.stageIndex);
    canvas.dataset.progress = progress.toFixed(4);
    canvas.dataset.ready = "true";
    canvas.dataset.paused = String(paused);
    canvas.dataset.motion = reduced ? "reduced" : "standard";
    canvas.dataset.primaryPanel = "same-representative-shell";
    canvas.dataset.punched = String(holes);
    canvas.dataset.foldLeft = state.foldLeft.toFixed(3);
    canvas.dataset.foldRight = state.foldRight.toFixed(3);
    if (
      state.stage !== lastStage ||
      Math.abs(progress - lastReported) > 0.003
    ) {
      lastStage = state.stage;
      lastReported = progress;
      callbacks.progress?.(progress, state.stage);
    }
  }
  function frame(time: number) {
    frameId = 0;
    if (!alive || failed || !visible || document.hidden) {
      lastTime = 0;
      return;
    }
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.045) : 1 / 60;
    lastTime = time;
    draw(dt);
    dirtyFrames = Math.max(0, dirtyFrames - 1);
    const state = manufacturingState(progress);
    const ambient = !paused && !reduced && [1, 4, 5].includes(state.stageIndex);
    const pointerMoving =
      Math.abs(pointerX - targetX) + Math.abs(pointerY - targetY) > 0.001;
    if (ambient || dirtyFrames || pointerMoving) wake();
    else lastTime = 0;
  }
  function onVisibility() {
    if (document.hidden) stop();
    else {
      dirtyFrames = 2;
      wake();
    }
  }
  function onPreference() {
    reduced = preference.matches;
    dirtyFrames = 2;
    wake();
  }
  function onContextLost(event: Event) {
    event.preventDefault();
    fail();
  }
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) {
        dirtyFrames = 2;
        wake();
      } else stop();
    },
    { threshold: 0.01 },
  );
  const dimensions = new ResizeObserver(resize);
  observer.observe(canvas);
  dimensions.observe(canvas);
  document.addEventListener("visibilitychange", onVisibility);
  preference.addEventListener("change", onPreference);
  canvas.addEventListener("webglcontextlost", onContextLost);
  resize();

  return {
    setProgress(value) {
      progress = clampProgress(value);
      dirtyFrames = 2;
      wake();
    },
    setPointer(x, y) {
      targetX = reduced ? 0 : clamp(Number.isFinite(x) ? x : 0, -1, 1);
      targetY = reduced ? 0 : clamp(Number.isFinite(y) ? y : 0, -1, 1);
      dirtyFrames = 2;
      wake();
    },
    pause(value) {
      paused = value;
      dirtyFrames = 2;
      wake();
    },
    reset() {
      progress =
        elapsed =
        showroomTime =
        targetX =
        targetY =
        pointerX =
        pointerY =
          0;
      dirtyFrames = 2;
      wake();
    },
    destroy() {
      if (!alive) return;
      alive = false;
      stop();
      observer.disconnect();
      dimensions.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      preference.removeEventListener("change", onPreference);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>(),
        textures = new Set<THREE.Texture>();
      scene.traverse((object) => {
        const renderable = object as
          | THREE.Mesh
          | THREE.Line
          | THREE.Points
          | THREE.Sprite;
        if ("geometry" in renderable && renderable.geometry)
          geometries.add(renderable.geometry);
        if ("material" in renderable && renderable.material) {
          for (const material of Array.isArray(renderable.material)
            ? renderable.material
            : [renderable.material]) {
            materials.add(material);
            for (const value of Object.values(material))
              if (value instanceof THREE.Texture) textures.add(value);
          }
        }
      });
      geometries.forEach((g) => g.dispose());
      textures.forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
      key.shadow.dispose();
      environmentTarget.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      scene.clear();
      canvas.dataset.ready = "false";
    },
  };
}

function brushedTexture() {
  const width = 1024,
    height = 512,
    data = new Uint8Array(width * height * 4);
  let seed = 41;
  for (let y = 0; y < height; y++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const stripe = ((seed >>> 16) % 42) - 21;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4,
        value =
          186 +
          stripe +
          Math.sin(x * 0.007) * 15 +
          Math.sin(x * 0.03 + y * 0.005) * 4;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 2;
  texture.needsUpdate = true;
  return texture;
}
function radialTexture(color: number) {
  const c = new THREE.Color(color),
    size = 64,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const radius = Math.hypot((x - 31.5) / 31.5, (y - 31.5) / 31.5);
      const alpha = Math.pow(Math.max(0, 1 - radius), 2.5);
      const i = (y * size + x) * 4;
      data[i] = c.r * 255;
      data[i + 1] = c.g * 255;
      data[i + 2] = c.b * 255;
      data[i + 3] = alpha * 255;
    }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
