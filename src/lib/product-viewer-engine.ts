import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createProductModel } from "./product-models";
import { readRenderQuality, frameIsDue } from "./render-quality.mjs";

export interface ProductViewerEngine {
  configure(config: { width: number; depth: number; height: number }): void;
  setRotation(value: boolean): void;
  setLighting(mode: 0 | 1 | 2): void;
  setAssembly(value: boolean): void;
  setOperation(value: boolean | number): void;
  setView(view: "perspective" | "front" | "side" | "top"): void;
  zoom(factor: number): void;
  setFinish(mode: 0 | 1): void;
  rotate(dx: number, dy: number): void;
  reset(): void;
  destroy(): void;
}

type Callbacks = {
  ready(): void;
  unavailable(): void;
  rotation?(enabled: boolean): void;
  operation?(amount: number): void;
};

export function createProductViewer(
  canvas: HTMLCanvasElement,
  productId: string,
  callbacks: Callbacks,
  configuration?: { shelves: number },
): ProductViewerEngine {
  let quality = readRenderQuality();
  canvas.dataset.renderQuality = quality.mode;
  canvas.dataset.maxFps = String(quality.maxFps);
  const noEngine: ProductViewerEngine = {
    configure() {},
    setRotation() {},
    setLighting() {},
    setAssembly() {},
    setOperation() {},
    setView() {},
    zoom() {},
    setFinish() {},
    rotate() {},
    reset() {},
    destroy() {},
  };
  const contextAttributes: WebGLContextAttributes = {
    antialias: quality.antialias,
    alpha: false,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
    failIfMajorPerformanceCaveat: false,
  };
  let context: WebGL2RenderingContext | null;
  try {
    context = canvas.getContext("webgl2", contextAttributes);
  } catch {
    callbacks.unavailable();
    return noEngine;
  }
  if (!context) {
    callbacks.unavailable();
    return noEngine;
  }
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      context,
      antialias: quality.antialias,
      alpha: false,
      powerPreference: "low-power",
    });
  } catch {
    callbacks.unavailable();
    return noEngine;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe1e2df);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 60);
  renderer.setPixelRatio(quality.pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.enablePan = false;
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.autoRotateSpeed = 1.15;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.75;
  controls.enableZoom = true;

  let model: ReturnType<typeof createProductModel>;
  let environmentTarget: THREE.WebGLRenderTarget;
  try {
    const environment = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(renderer);
    environmentTarget = generator.fromScene(environment, 0.035);
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 0.8;
    generator.dispose();
    environment.dispose();
    model = createProductModel(productId, configuration);
    scene.add(model.group);
  } catch {
    controls.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    callbacks.unavailable();
    return noEngine;
  }
  model.animate(0, 0, 0, false);
  const steelMaterials = new Map<THREE.MeshStandardMaterial, number>();
  model.group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material])
      if (
        material instanceof THREE.MeshStandardMaterial &&
        material.metalness > 0.8
      )
        steelMaterials.set(material, material.roughness);
  });
  const bounds = new THREE.Box3().setFromObject(model.group);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const nativeSize = size.clone();
  model.animate(1, 0, 0, false);
  const expandedSphere = new THREE.Box3()
    .setFromObject(model.group)
    .getBoundingSphere(new THREE.Sphere());
  const assembledRadius = bounds.getBoundingSphere(new THREE.Sphere()).radius;
  const assemblyFitScale = Math.max(
    1.08,
    (expandedSphere.radius + expandedSphere.center.distanceTo(center)) /
      Math.max(assembledRadius, 0.01),
  );
  let operationFitScale = 1,
    combinedFitScale = assemblyFitScale;
  if (["cabinets", "refrigerator", "hot-cabinet"].includes(productId)) {
    model.animate(0, 1, 0, false);
    const openSphere = new THREE.Box3()
      .setFromObject(model.group)
      .getBoundingSphere(new THREE.Sphere());
    operationFitScale = Math.max(
      1,
      (openSphere.radius + openSphere.center.distanceTo(center)) /
        Math.max(assembledRadius, 0.01),
    );
    model.animate(1, 1, 0, false);
    const combinedSphere = new THREE.Box3()
      .setFromObject(model.group)
      .getBoundingSphere(new THREE.Sphere());
    combinedFitScale = Math.max(
      assemblyFitScale,
      operationFitScale,
      (combinedSphere.radius + combinedSphere.center.distanceTo(center)) /
        Math.max(assembledRadius, 0.01),
    );
  }
  model.animate(0, 0, 0, false);
  const floorY = Math.min(0, bounds.min.y) - 0.005;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({
      color: 0x979e99,
      envMapIntensity: 0.15,
      roughness: 0.95,
      metalness: 0,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = floorY;
  floor.receiveShadow = true;
  scene.add(floor);
  const contactTexture = makeContactShadow();
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(size.x * 1.6, size.z * 2),
    new THREE.MeshBasicMaterial({
      map: contactTexture,
      transparent: true,
      opacity: 0.47,
      depthWrite: false,
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(center.x, floorY + 0.002, center.z);
  scene.add(contact);
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(-3.5, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -4;
  key.shadow.intensity = 0.32;
  key.shadow.radius = 4;
  key.shadow.normalBias = 0.012;
  key.shadow.bias = -0.00015;
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 18;
  key.target.position.copy(center);
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xe9eeeb, 0.9);
  fill.position.set(4, 3, -3);
  scene.add(fill);
  const hemisphere = new THREE.HemisphereLight(0xf3f5f4, 0x7b817e, 0.7);
  scene.add(hemisphere);
  const root = canvas;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let alive = true,
    failed = false,
    visible = false,
    reduced = preference.matches;
  let frameId = 0,
    lastTime = 0,
    elapsed = 0,
    dirtyFrames = 2,
    drawing = false;
  let assembly = 0,
    assemblyTarget = 0,
    operation = 0,
    operationTarget = 0,
    lighting: 0 | 1 | 2 = 0,
    finish = 0;
  let aspect = 1,
    distance = 4.6,
    ready = false,
    assemblyCameraScale = 1;
  const homeDirection = new THREE.Vector3(1.5, 0.92, 2.1).normalize();

  function framingDistance() {
    const vertical = Math.max(size.y * 1.18, (size.x / aspect) * 1.14);
    return (
      (vertical / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) +
        size.z * 0.42) *
      (aspect < 1.25 ? 1.08 : 1.27)
    );
  }
  function home() {
    canvas.dataset.view = "perspective";
    assemblyCameraScale = 1;
    distance = framingDistance();
    controls.target.copy(center).add(new THREE.Vector3(0, -size.y * 0.06, 0));
    camera.position
      .copy(controls.target)
      .addScaledVector(homeDirection, distance);
    controls.minDistance = Math.max(1.7, distance * 0.48);
    controls.maxDistance = distance * 1.85;
    controls.update();
    controls.saveState();
  }
  function resize() {
    if (!alive || failed) return;
    quality = readRenderQuality();
    renderer.setPixelRatio(quality.pixelRatio);
    if (key.shadow.mapSize.x !== quality.shadowSize) {
      key.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
      key.shadow.map?.dispose();
      key.shadow.map = null;
    }
    canvas.dataset.renderQuality = quality.mode;
    canvas.dataset.maxFps = String(quality.maxFps);
    canvas.dataset.pixelRatio = String(quality.pixelRatio);
    const rect = root.getBoundingClientRect();
    const w = Math.max(1, rect.width),
      h = Math.max(1, rect.height);
    aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (!ready) home();
    else {
      const nextDistance = framingDistance();
      const ray = camera.position.clone().sub(controls.target);
      camera.position
        .copy(controls.target)
        .add(ray.multiplyScalar(nextDistance / distance));
      distance = nextDistance;
      controls.minDistance = Math.max(1.7, distance * 0.48);
      controls.maxDistance = distance * 1.85 * assemblyCameraScale;
      controls.update();
    }
    dirtyFrames = 2;
    if (w > 1 && h > 1) render(0);
    if (failed) return;
    if (!ready && w > 1 && h > 1) {
      ready = true;
      canvas.dataset.ready = "true";
      callbacks.ready();
    }
    wake();
  }
  function stop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = lastTime = 0;
  }
  function wake() {
    if (!alive || failed || drawing || frameId || !visible || document.hidden)
      return;
    frameId = requestAnimationFrame(frame);
  }
  function render(dt: number) {
    if (!alive || failed) return;
    const ease = reduced || !dt ? 1 : 1 - Math.exp(-dt * 7);
    assembly += (assemblyTarget - assembly) * ease;
    operation += (operationTarget - operation) * ease;
    if (Math.abs(assembly - assemblyTarget) < 0.0004) assembly = assemblyTarget;
    if (Math.abs(operation - operationTarget) < 0.0004)
      operation = operationTarget;
    model.animate(assembly, operation, elapsed, reduced);
    // Preserve the current orbit/user zoom while allowing for both exploded and open poses.
    // LED switching and water flow retain their framing because their operation scale is 1.
    const assembledScale = THREE.MathUtils.lerp(1, assemblyFitScale, assembly);
    const operatedScale = THREE.MathUtils.lerp(
      operationFitScale,
      combinedFitScale,
      assembly,
    );
    const nextCameraScale = THREE.MathUtils.lerp(
      assembledScale,
      operatedScale,
      operation,
    );
    if (Math.abs(nextCameraScale - assemblyCameraScale) > 0.000001) {
      const offset = camera.position.clone().sub(controls.target);
      camera.position
        .copy(controls.target)
        .add(offset.multiplyScalar(nextCameraScale / assemblyCameraScale));
      assemblyCameraScale = nextCameraScale;
      controls.maxDistance = distance * 1.85 * assemblyCameraScale;
      controls.update(0);
    }
    try {
      renderer.render(scene, camera);
    } catch {
      onFailure();
      return;
    }
    canvas.dataset.product = productId;
    canvas.dataset.rotation = String(controls.autoRotate);
    canvas.dataset.lighting = String(lighting);
    canvas.dataset.finish = String(finish);
    canvas.dataset.assembly = String(assemblyTarget === 1);
    canvas.dataset.operation = String(operationTarget === 1);
    canvas.dataset.assemblyProgress = assembly.toFixed(3);
    canvas.dataset.assemblyZoom = assemblyCameraScale.toFixed(3);
    canvas.dataset.operationZoom = (
      1 +
      (operationFitScale - 1) * operation
    ).toFixed(3);
    canvas.dataset.poseZoom = assemblyCameraScale.toFixed(3);
    canvas.dataset.operationProgress = operation.toFixed(3);
    canvas.dataset.distance = camera.position.distanceTo(controls.target).toFixed(3);
    canvas.dataset.azimuth = (
      ((controls.getAzimuthalAngle() % (2 * Math.PI)) + 2 * Math.PI) %
      (2 * Math.PI)
    ).toFixed(3);
    canvas.dataset.polar = controls.getPolarAngle().toFixed(3);
    canvas.dataset.motion = reduced ? "reduced" : "standard";
  }
  function frame(time: number) {
    frameId = 0;
    if (!alive || failed || !visible || document.hidden) {
      lastTime = 0;
      return;
    }
    if (!frameIsDue(time, lastTime, quality.maxFps)) { wake(); return; }
    drawing = true;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 1 / 60;
    lastTime = time;
    elapsed += dt;
    const changed = controls.update(dt);
    if (changed) dirtyFrames = 18;
    else dirtyFrames = Math.max(0, dirtyFrames - 1);
    render(dt);
    drawing = false;
    const tweening =
      assembly !== assemblyTarget || operation !== operationTarget;
    const flowing = model.operationContinuous && operation > 0 && !reduced;
    if (controls.autoRotate || dirtyFrames || tweening || flowing) wake();
    else lastTime = 0;
  }
  function onFailure() {
    if (failed || !alive) return;
    failed = true;
    stop();
    canvas.dataset.ready = "false";
    callbacks.unavailable();
  }
  function onContextLost(event: Event) {
    event.preventDefault();
    onFailure();
  }
  function onChange() {
    dirtyFrames = 18;
    wake();
  }
  function onStart() {
    if (controls.autoRotate) {
      controls.autoRotate = false;
      callbacks.rotation?.(false);
    }
    onChange();
  }
  function onVisibility() {
    if (document.hidden) stop();
    else wake();
  }
  function onPreference() {
    reduced = preference.matches;
    if (reduced && controls.autoRotate) {
      controls.autoRotate = false;
      callbacks.rotation?.(false);
    }
    dirtyFrames = 2;
    wake();
  }
  const raycaster = new THREE.Raycaster();
  let pointerStart = { x: 0, y: 0 };
  const onPointerDown = (event: PointerEvent) => { pointerStart = { x: event.clientX, y: event.clientY }; };
  const onPointerUp = (event: PointerEvent) => {
    if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 7 || assemblyTarget > 0) return;
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
    const hit = raycaster.intersectObject(model.group, true)[0];
    let part: THREE.Object3D | null = hit?.object || null;
    while (part && !part.userData.operable) part = part.parent;
    if (part) { operationTarget = operationTarget > 0 ? 0 : 1; callbacks.operation?.(operationTarget); dirtyFrames = 2; wake(); }
  };
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
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
  controls.addEventListener("change", onChange);
  controls.addEventListener("start", onStart);
  document.addEventListener("visibilitychange", onVisibility);
  preference.addEventListener("change", onPreference);
  canvas.addEventListener("webglcontextlost", onContextLost);
  observer.observe(root);
  dimensions.observe(root);
  resize();

  return {
    configure(config) {
      model.group.scale.set(config.width / 1000 / nativeSize.x, config.height / 1000 / nativeSize.y, config.depth / 1000 / nativeSize.z);
      model.animate(0, 0, 0, true);
      bounds.setFromObject(model.group); bounds.getSize(size); bounds.getCenter(center);
      contact.scale.set(size.x / nativeSize.x, size.z / nativeSize.z, 1);
      contact.position.set(center.x, floorY + 0.002, center.z);
      home(); dirtyFrames = 2; wake();
      canvas.dataset.dimensions = `${config.width}x${config.depth}x${config.height}`;
      canvas.dataset.shelves = String(configuration?.shelves ?? "default");
    },
    setRotation(value) {
      controls.autoRotate = value && !reduced;
      callbacks.rotation?.(controls.autoRotate);
      dirtyFrames = 2;
      wake();
    },
    setLighting(mode) {
      lighting = mode;
      key.color.set(mode === 1 ? 0xffdeb1 : mode === 2 ? 0xc8e6ff : 0xffffff);
      fill.color.set(mode === 1 ? 0xfff0d9 : mode === 2 ? 0x94c9ef : 0xe9eeeb);
      key.position.set(mode === 2 ? 3.8 : -3.5, 6, mode === 1 ? 2 : 4);
      scene.environmentRotation.y = mode === 1 ? 0.8 : mode === 2 ? -0.65 : 0;
      renderer.toneMappingExposure =
        mode === 1 ? 0.9 : mode === 2 ? 0.89 : 0.92;
      dirtyFrames = 2;
      wake();
    },
    setAssembly(value) {
      assemblyTarget = value ? 1 : 0;
      dirtyFrames = 2;
      wake();
    },
    setOperation(value) {
      operationTarget = typeof value === "number" ? THREE.MathUtils.clamp(value, 0, 1) : value ? 1 : 0;
      callbacks.operation?.(operationTarget);
      dirtyFrames = 2;
      wake();
    },
    setView(view) {
      controls.autoRotate = false; callbacks.rotation?.(false);
      const directions = { perspective: homeDirection, front: new THREE.Vector3(0, 0.05, 1), side: new THREE.Vector3(1, 0.05, 0), top: new THREE.Vector3(0, 1, 0.01) };
      camera.position.copy(controls.target).addScaledVector(directions[view].clone().normalize(), distance * assemblyCameraScale);
      controls.update(); dirtyFrames = 2; wake();
      canvas.dataset.view = view;
    },
    zoom(factor) {
      const ray = camera.position.clone().sub(controls.target);
      ray.setLength(THREE.MathUtils.clamp(ray.length() * factor, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(ray); controls.update(); dirtyFrames = 2; wake();
    },
    setFinish(mode) {
      finish = mode;
      steelMaterials.forEach((original, material) => {
        material.roughness = mode ? Math.min(0.68, original + 0.25) : original;
      });
      dirtyFrames = 2;
      wake();
    },
    rotate(dx, dy) {
      controls.autoRotate = false;
      callbacks.rotation?.(false);
      const spherical = new THREE.Spherical().setFromVector3(
        camera.position.clone().sub(controls.target),
      );
      spherical.theta += dx;
      spherical.phi = THREE.MathUtils.clamp(
        spherical.phi + dy,
        controls.minPolarAngle,
        controls.maxPolarAngle,
      );
      camera.position
        .copy(controls.target)
        .add(new THREE.Vector3().setFromSpherical(spherical));
      controls.update();
      dirtyFrames = 2;
      wake();
    },
    reset() {
      controls.autoRotate = false;
      callbacks.rotation?.(false);
      assembly = assemblyTarget = operation = operationTarget = 0;
      lighting = 0;
      elapsed = 0;
      finish = 0;
      steelMaterials.forEach((original, material) => {
        material.roughness = original;
      });
      key.color.set(0xffffff);
      fill.color.set(0xe9eeeb);
      key.position.set(-3.5, 6, 4);
      scene.environmentRotation.y = 0;
      renderer.toneMappingExposure = 0.92;
      home();
      dirtyFrames = 2;
      wake();
    },
    destroy() {
      if (!alive) return;
      alive = false;
      stop();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      observer.disconnect();
      dimensions.disconnect();
      controls.removeEventListener("change", onChange);
      controls.removeEventListener("start", onStart);
      controls.dispose();
      document.removeEventListener("visibilitychange", onVisibility);
      preference.removeEventListener("change", onPreference);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>(),
        textures = new Set<THREE.Texture>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          const list = Array.isArray(object.material)
            ? object.material
            : [object.material];
          list.forEach((material) => {
            materials.add(material);
            for (const value of Object.values(material))
              if (value instanceof THREE.Texture) textures.add(value);
          });
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

function makeContactShadow() {
  const size = 128,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (x - size / 2) / (size / 2),
        dy = (y - size / 2) / (size / 2);
      const falloff = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
      const i = (y * size + x) * 4;
      data[i] = 31;
      data[i + 1] = 41;
      data[i + 2] = 35;
      data[i + 3] = Math.round(falloff * falloff * 150);
    }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}
