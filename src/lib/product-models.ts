import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export interface ProductModel {
  group: THREE.Group;
  operationContinuous: boolean;
  animate(
    assembly: number,
    operation: number,
    time: number,
    reduced: boolean,
  ): void;
}

type Vec = [number, number, number];
type Part = {
  object: THREE.Object3D;
  origin: THREE.Vector3;
  travel: THREE.Vector3;
};

/** Native, representative product geometry; these are not production CAD files. */
export function createProductModel(id: string, configuration?: { shelves: number }): ProductModel {
  const group = new THREE.Group();
  const parts: Part[] = [];
  const actions: ((value: number, time: number, reduced: boolean) => void)[] =
    [];
  let operationContinuous = false;
  const grain = brushedTexture();
  const steel = new THREE.MeshPhysicalMaterial({
    color: 0xc2c8cc,
    metalness: 0.96,
    roughness: 0.24,
    roughnessMap: grain,
    bumpMap: grain,
    bumpScale: 0.00025,
    envMapIntensity: 1.15,
    clearcoat: 0.12,
    clearcoatRoughness: 0.3,
    anisotropy: 0.65,
    anisotropyRotation: Math.PI / 2,
  });
  const polished = new THREE.MeshStandardMaterial({
    color: 0xc8d1cd,
    metalness: 1,
    roughness: 0.16,
    envMapIntensity: 1.25,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x15231e,
    metalness: 0.35,
    roughness: 0.48,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x151a17,
    roughness: 0.82,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xc5e0d9,
    metalness: 0,
    roughness: 0.07,
    transparent: true,
    opacity: 0.24,
    transmission: 0.35,
    thickness: 0.009,
    ior: 1.5,
    envMapIntensity: 1.15,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  function mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D = group,
  ) {
    const m = new THREE.Mesh(geometry, material);
    m.castShadow = material !== glass;
    m.receiveShadow = material !== glass;
    parent.add(m);
    return m;
  }
  function box(
    size: Vec,
    at: Vec,
    material: THREE.Material = steel,
    parent: THREE.Object3D = group,
    radius = 0.008,
  ) {
    const r = Math.max(0.0005, Math.min(radius, ...size.map((v) => v * 0.23)));
    const m = mesh(new RoundedBoxGeometry(...size, 2, r), material, parent);
    m.position.set(...at);
    return m;
  }
  function cylinder(
    radius: number,
    height: number,
    at: Vec,
    material = polished,
    parent: THREE.Object3D = group,
  ) {
    const m = mesh(
      new THREE.CylinderGeometry(radius, radius, height, 24),
      material,
      parent,
    );
    m.position.set(...at);
    return m;
  }
  function tube(
    points: Vec[],
    radius: number,
    material: THREE.Material = polished,
    parent: THREE.Object3D = group,
    segments = 48,
  ) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    return mesh(
      new THREE.TubeGeometry(curve, segments, radius, 10, false),
      material,
      parent,
    );
  }
  function rod(
    a: Vec,
    b: Vec,
    radius = 0.012,
    material: THREE.Material = polished,
    parent: THREE.Object3D = group,
  ) {
    const va = new THREE.Vector3(...a),
      vb = new THREE.Vector3(...b),
      delta = vb.clone().sub(va);
    const m = mesh(
      new THREE.CylinderGeometry(radius, radius, delta.length(), 14),
      material,
      parent,
    );
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.normalize(),
    );
    return m;
  }
  function explode(object: THREE.Object3D, travel: Vec) {
    parts.push({
      object,
      origin: object.position.clone(),
      travel: new THREE.Vector3(...travel),
    });
    return object;
  }
  function legs(w: number, d: number, height: number, y = 0) {
    for (const x of [-w / 2, w / 2])
      for (const z of [-d / 2, d / 2]) {
        const leg = new THREE.Group();
        group.add(leg);
        leg.position.set(x, y, z);
        box(
          [0.055, height - 0.08, 0.055],
          [0, (height + 0.08) / 2, 0],
          steel,
          leg,
          0.006,
        );
        cylinder(0.026, 0.08, [0, 0.075, 0], polished, leg);
        cylinder(0.035, 0.04, [0, 0.02, 0], rubber, leg);
        cylinder(0.031, 0.012, [0, 0.044, 0], polished, leg);
        explode(leg, [Math.sign(x) * 0.2, -0.01, Math.sign(z) * 0.18]);
      }
  }
  function tray(
    w: number,
    d: number,
    y: number,
    parent: THREE.Object3D = group,
  ) {
    const p = new THREE.Group();
    parent.add(p);
    p.position.y = y;
    box([w, 0.024, d], [0, 0, 0], steel, p);
    for (const x of [-1, 1])
      box([0.022, 0.065, d], [x * (w / 2 - 0.011), -0.024, 0], steel, p);
    for (const z of [-1, 1])
      box([w - 0.04, 0.065, 0.022], [0, -0.024, z * (d / 2 - 0.011)], steel, p);
    return p;
  }
  function bolt(
    at: Vec,
    parent: THREE.Object3D = group,
    face: "front" | "side" = "front",
  ) {
    const b = cylinder(0.011, 0.006, at, polished, parent);
    b.rotation.x = Math.PI / 2;
    if (face === "side") b.rotation.z = Math.PI / 2;
    return b;
  }
  function shallowPan(w: number, d: number, at: Vec, parent: THREE.Object3D) {
    const p = new THREE.Group();
    parent.add(p);
    p.position.set(...at);
    box([w, 0.012, d], [0, 0, 0], steel, p, 0.018);
    for (const x of [-1, 1])
      box([0.016, 0.055, d], [x * (w / 2 - 0.008), 0.026, 0], polished, p);
    for (const z of [-1, 1])
      box([w, 0.055, 0.016], [0, 0.026, z * (d / 2 - 0.008)], polished, p);
    return p;
  }

  if (id === "worktable") {
    legs(2.16, 0.78, 1.38);
    const top = box([2.4, 0.075, 1.02], [0, 1.42, 0], steel, group, 0.015);
    explode(top, [0, 0.48, 0]);
    // Folded worktop hems and underside reinforcement channels.
    for (const z of [-0.482, 0.482]) box([2.34, 0.055, 0.022], [0, 1.365, z]);
    for (const x of [-0.75, 0.75]) box([0.06, 0.06, 0.88], [x, 1.33, 0]);
    for (let i = 0; i < (configuration?.shelves ?? 1); i++) {
      const shelf = tray(2.17, 0.79, 0.3 + i * 0.45);
      explode(shelf, [0, 0.16, 0.4]);
    }
    for (const x of [-1.08, 1.08])
      for (const z of [-0.39, 0.39]) bolt([x, 0.3, z + 0.03]);
    box([2.2, 0.045, 0.035], [0, 1.33, -0.37]);
  } else if (id === "sink" || id === "sink-shelf") {
    legs(2.17, 0.78, 1.35);
    for (const z of [-0.39, 0.39])
      rod([-1.08, 0.28, z], [1.08, 0.28, z], 0.022);
    for (const x of [-1.08, 1.08])
      rod([x, 0.28, -0.39], [x, 0.28, 0.39], 0.022);
    if ((configuration?.shelves ?? (id === "sink-shelf" ? 1 : 0)) > 0) {
      const lowerShelf = tray(2.08, 0.73, 0.25);
      lowerShelf.name = "sink-lower-shelf";
      explode(lowerShelf, [0, 0.12, 0.38]);
    }
    const basinAssembly = new THREE.Group();
    group.add(basinAssembly);
    const topShape = roundedRect(-1.23, -0.52, 2.46, 1.04, 0.025);
    for (const x of [-0.57, 0.57]) {
      const hole = roundedRect(x - 0.47, -0.35, 0.94, 0.7, 0.055);
      topShape.holes.push(new THREE.Path(hole.getPoints(10)));
      const bottomY = 0.94,
        topY = 1.39,
        topW = 0.94,
        topD = 0.7,
        botW = 0.8,
        botD = 0.55;
      for (const sign of [-1, 1]) {
        const xwall = quad([
          [x + (sign * topW) / 2, topY, -topD / 2],
          [x + (sign * topW) / 2, topY, topD / 2],
          [x + (sign * botW) / 2, bottomY, botD / 2],
          [x + (sign * botW) / 2, bottomY, -botD / 2],
        ]);
        const zwall = quad([
          [x - topW / 2, topY, (sign * topD) / 2],
          [x + topW / 2, topY, (sign * topD) / 2],
          [x + botW / 2, bottomY, (sign * botD) / 2],
          [x - botW / 2, bottomY, (sign * botD) / 2],
        ]);
        const bowlSteel = steel.clone();
        bowlSteel.side = THREE.DoubleSide;
        mesh(xwall, bowlSteel, basinAssembly);
        mesh(zwall, bowlSteel, basinAssembly);
      }
      box([botW, 0.025, botD], [x, bottomY, 0], steel, basinAssembly, 0.024);
      cylinder(0.055, 0.013, [x, bottomY + 0.018, 0], dark, basinAssembly);
      const rim = mesh(
        new THREE.TorusGeometry(0.056, 0.006, 8, 30),
        polished,
        basinAssembly,
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.set(x, bottomY + 0.028, 0);
      for (let i = -1; i <= 1; i++)
        box(
          [0.066, 0.006, 0.004],
          [x, bottomY + 0.026, i * 0.018],
          polished,
          basinAssembly,
        );
      cylinder(0.05, 0.09, [x, bottomY - 0.05, 0], polished, basinAssembly);
      tube(
        [
          [x, 0.89, 0],
          [x, 0.73, 0],
          [x * 0.6, 0.68, 0],
          [0, 0.68, 0],
        ],
        0.024,
        polished,
        basinAssembly,
      );
      cylinder(0.033, 0.05, [x, 0.81, 0], polished, basinAssembly);
    }
    const topGeometry = new THREE.ExtrudeGeometry(topShape, {
      depth: 0.024,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.005,
      bevelThickness: 0.004,
      curveSegments: 10,
    });
    const top = mesh(topGeometry, steel, basinAssembly);
    top.rotation.x = -Math.PI / 2;
    top.position.y = 1.38;
    cylinder(0.029, 0.31, [0, 0.53, 0], polished, basinAssembly);
    for (const z of [-0.5, 0.5])
      box([2.44, 0.065, 0.025], [0, 1.36, z], steel, basinAssembly);
    const splash = box(
      [2.44, 0.24, 0.03],
      [0, 1.51, -0.505],
      steel,
      basinAssembly,
    );
    explode(splash, [0, 0.22, -0.2]);
    explode(basinAssembly, [0, 0.3, 0]);
    const tap = new THREE.Group();
    basinAssembly.add(tap);
    cylinder(0.032, 0.56, [0, 1.68, -0.39], polished, tap);
    cylinder(0.052, 0.035, [0, 1.43, -0.39], polished, tap);
    rod([-0.15, 1.53, -0.39], [0.15, 1.53, -0.39], 0.026, polished, tap);
    for (const x of [-0.15, 0.15]) {
      cylinder(0.029, 0.07, [x, 1.56, -0.39], polished, tap);
      const tip = new THREE.MeshStandardMaterial({
        color: x < 0 ? 0xb45543 : 0x477c91,
        metalness: 0.2,
        roughness: 0.4,
      });
      cylinder(0.017, 0.009, [x, 1.6, -0.39], tip, tap);
      rod([x, 1.6, -0.39], [x * 1.6, 1.6, -0.39], 0.008, polished, tap);
    }
    const hosePath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.92, -0.39),
      new THREE.Vector3(0.07, 2.23, -0.35),
      new THREE.Vector3(0.34, 2.3, -0.2),
      new THREE.Vector3(0.56, 2.12, 0),
      new THREE.Vector3(0.56, 1.99, 0.08),
    ]);
    mesh(new THREE.TubeGeometry(hosePath, 60, 0.013, 10, false), rubber, tap);
    const coils: THREE.Vector3[] = [];
    for (let i = 0; i <= 400; i++) {
      const t = i / 400,
        p = hosePath.getPoint(t),
        tangent = hosePath.getTangent(t);
      const normal = new THREE.Vector3(0, 0, 1).cross(tangent).normalize();
      const binormal = tangent.clone().cross(normal).normalize();
      const angle = t * Math.PI * 2 * 24;
      p.addScaledVector(normal, Math.cos(angle) * 0.027).addScaledVector(
        binormal,
        Math.sin(angle) * 0.027,
      );
      coils.push(p);
    }
    mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(coils),
        420,
        0.004,
        6,
        false,
      ),
      polished,
      tap,
    );
    cylinder(0.025, 0.15, [0.56, 1.935, 0.08], rubber, tap);
    cylinder(0.032, 0.04, [0.56, 1.84, 0.08], polished, tap);
    const water = new THREE.Group();
    tap.add(water);
    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xb1e3ed,
      transparent: true,
      opacity: 0.55,
      metalness: 0,
      roughness: 0.1,
      transmission: 0.18,
      depthWrite: false,
    });
    cylinder(0.009, 0.79, [0.56, 1.42, 0.08], waterMaterial, water);
    const drops: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const drop = mesh(
        new THREE.SphereGeometry(0.014, 8, 6),
        waterMaterial,
        water,
      );
      drop.scale.set(0.65, 1.6, 0.65);
      drops.push(drop);
    }
    water.visible = false;
    actions.push((value, time, reduced) => {
      water.visible = value > 0.03;
      drops.forEach((drop, i) => {
        drop.position.set(
          0.56 + Math.sin(i * 5) * 0.03,
          1.76 - ((reduced ? i / 12 : time * 1.9 + i / 12) % 1) * 0.76,
          0.08 + Math.cos(i * 3) * 0.02,
        );
      });
    });
    operationContinuous = true;
  } else if (id === "rack") {
    legs(1.96, 0.7, 2.43);
    const levels = configuration?.shelves ?? 4;
    for (let i = 0; i < levels; i++) {
      const y = 0.25 + i * (2.07 / (levels - 1));
      const shelf = tray(2.06, 0.79, y);
      explode(shelf, [0, 0.15 + i * 0.13, 0.23 + i * 0.025]);
      for (const x of [-0.98, 0.98])
        for (const z of [-0.35, 0.35]) bolt([x, y - 0.025, z + 0.031]);
    }
    rod([-0.98, 0.25, -0.36], [0.98, 2.3, -0.36], 0.009, polished);
    rod([0.98, 0.25, -0.36], [-0.98, 2.3, -0.36], 0.009, polished);
  } else if (id === "shelves") {
    // Wall fixing rails and triangular brackets distinguish shelves from a rack.
    for (const x of [-0.88, 0.88]) {
      box([0.065, 1.62, 0.04], [x, 1.08, -0.32]);
      for (const y of [0.4, 1.04, 1.76]) bolt([x, y, -0.29]);
    }
    for (let i = 0; i < 2; i++) {
      const y = 0.76 + i * 0.84;
      const shelf = tray(2.3, 0.68, y);
      shelf.name = `wall-shelf-${i}`;
      explode(shelf, [0, 0.18 + i * 0.15, 0.24]);
      for (const x of [-0.88, 0.88]) {
        box([0.04, 0.04, 0.59], [x, y - 0.065, -0.015]);
        rod([x, y - 0.42, -0.29], [x, y - 0.065, 0.27], 0.016);
      }
      box([2.3, 0.11, 0.022], [0, y + 0.05, -0.329]);
    }
  } else if (id === "produce-shelf") {
    const frame = new THREE.Group();
    frame.name = "produce-display-frame";
    group.add(frame);
    for (const x of [-1.11, 1.11]) {
      box([0.06, 1.9, 0.06], [x, 1.02, -0.47], steel, frame);
      box([0.06, 0.56, 0.06], [x, 0.35, 0.65], steel, frame);
      rod([x, 0.12, -0.47], [x, 0.12, 0.65], 0.025, steel, frame);
      rod([x, 0.58, 0.63], [x, 1.92, -0.44], 0.025, steel, frame);
      for (const z of [-0.47, 0.65])
        cylinder(0.04, 0.06, [x, 0.04, z], rubber, frame);
    }
    const produceMaterials = [0xc8452e, 0x77a142, 0xe3b448].map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.72 }),
    );
    for (let tier = 0; tier < 3; tier++) {
      const bins = new THREE.Group();
      bins.name = `produce-bin-tier-${tier}`;
      bins.position.set(0, 0.55 + tier * 0.61, 0.4 - tier * 0.36);
      group.add(bins);
      for (let column = 0; column < 3; column++) {
        const x = (column - 1) * 0.73;
        const bin = shallowPan(0.69, 0.54, [x, 0, 0], bins);
        // Raised lips retain the illustrative produce without implying a load rating.
        box([0.69, 0.12, 0.018], [0, 0.075, 0.26], steel, bin);
        for (let item = 0; item < 6; item++) {
          const fruit = mesh(
            new THREE.SphereGeometry(0.073, 12, 8),
            produceMaterials[(tier + column) % 3],
            bin,
          );
          fruit.position.set((item % 3 - 1) * 0.18, 0.09, Math.floor(item / 3) * 0.18 - 0.09);
          if (tier === 1) fruit.scale.set(1, 0.7, 1.25);
        }
      }
      explode(bins, [0, 0.15 + tier * 0.12, 0.28]);
    }
  } else if (id === "refrigerator" || id === "hot-cabinet") {
    const hot = id === "hot-cabinet";
    const width = hot ? 1.18 : 1.72;
    const depth = 1.04;
    const baseY = 0.21, topY = 2.5;
    legs(width - 0.15, depth - 0.2, 0.2);
    const shell = new THREE.Group();
    shell.name = `${id}-shell`;
    group.add(shell);
    for (const sign of [-1, 1]) {
      const side = box([0.055, topY - baseY, depth], [sign * (width / 2 - 0.0275), (baseY + topY) / 2, 0], steel, shell);
      explode(side, [sign * 0.3, 0.08, 0]);
    }
    const back = box([width - 0.1, topY - baseY, 0.04], [0, (baseY + topY) / 2, -0.5], steel, shell);
    explode(back, [0, 0.08, -0.25]);
    box([width - 0.08, 0.05, depth - 0.06], [0, baseY, 0], steel, shell);
    const top = box([width, 0.06, depth], [0, topY, 0], steel, shell);
    explode(top, [0, 0.35, 0]);
    // Shelves remain inside the assembled shell with a gap behind the closed door.
    const shelfWidth = width - 0.17;
    // Recessed liner, shelf rails and attachment points inside the cabinet.
    const liner = steel.clone(); liner.roughness = 0.42;
    box([width - 0.14, 2.04, 0.018], [0, 1.26, -0.469], liner, shell);
    for (const sign of [-1, 1]) {
      box([0.022, 1.86, 0.04], [sign * (width / 2 - 0.085), 1.25, -0.39], polished, shell);
      for (let n = 0; n < 12; n++) {
        box([0.025, 0.018, 0.007], [sign * (width / 2 - 0.085), 0.46 + n * 0.14, -0.365], dark, shell);
      }
    }
    for (let level = 0; level < (hot ? 5 : 4); level++) {
      const shelf = tray(shelfWidth, 0.85, 0.52 + level * (hot ? 0.33 : 0.43), shell);
      shelf.name = `${id}-internal-shelf-${level}`;
      explode(shelf, [0, 0.1 + level * 0.07, 0.2]);
      for (const sign of [-1, 1])
        box([0.025, 0.028, 0.87], [sign * (shelfWidth / 2), 0.47 + level * (hot ? 0.33 : 0.43), 0], polished, shell);
    }
    box([width - 0.11, 0.2, 0.06], [0, 2.33, 0.5], dark, shell);
    const screen = new THREE.MeshStandardMaterial({ color: 0x1c2c27, roughness: 0.36 });
    box([0.26, 0.09, 0.014], [hot ? 0.18 : 0.4, 2.33, 0.541], screen, shell);
    for (let i = 0; i < 4; i++)
      box([0.18, 0.01, 0.018], [hot ? -0.24 : -0.4, 2.28 + i * 0.035, 0.54], polished, shell);
    for (let n = 0; n < 11; n++) {
      box([width - 0.22, 0.012, 0.02], [0, 2.395 + n * 0.007, 0.54], polished, shell);
    }
    const doorCount = hot ? 1 : 2;
    for (let index = 0; index < doorCount; index++) {
      const sign = hot ? -1 : index === 0 ? -1 : 1;
      const doorWidth = (width - 0.14) / doorCount;
      const doorHeight = 1.94;
      const hinge = new THREE.Group();
      hinge.name = `${id}-door-${index}`;
      hinge.userData.operable = true;
      hinge.position.set(sign * (width / 2 - 0.065), 1.23, 0.535);
      shell.add(hinge);
      const doorCenter = -sign * doorWidth / 2;
      if (hot) {
        box([doorWidth - 0.13, doorHeight - 0.22, 0.018], [doorCenter, 0, 0], glass, hinge);
        for (const edge of [-1, 1]) {
          box([0.07, doorHeight, 0.055], [doorCenter + edge * (doorWidth / 2 - 0.035), 0, 0], steel, hinge);
          box([doorWidth, 0.09, 0.055], [doorCenter, edge * (doorHeight / 2 - 0.045), 0], steel, hinge);
        }
      } else {
        box([doorWidth - 0.01, doorHeight, 0.065], [doorCenter, 0, 0], steel, hinge, 0.016);
      }
      // Insulated inner door liner and continuous dark gasket, carried by the hinge.
      if (!hot) box([doorWidth - 0.1, doorHeight - 0.1, 0.026], [doorCenter, 0, -0.047], steel, hinge);
      for (const edge of [-1, 1]) {
        box([0.018, doorHeight - 0.06, 0.018], [doorCenter + edge * (doorWidth / 2 - 0.035), 0, -0.046], rubber, hinge);
        box([doorWidth - 0.06, 0.018, 0.018], [doorCenter, edge * (doorHeight / 2 - 0.035), -0.046], rubber, hinge);
      }
      for (const y of [-0.65, 0.65]) {
        box([0.048, 0.105, 0.035], [0, y, 0.028], polished, hinge);
        bolt([0, y, 0.048], hinge);
      }
      const handleX = doorCenter - sign * (doorWidth / 2 - 0.13);
      rod([handleX, -0.26, 0.09], [handleX, 0.26, 0.09], 0.019, polished, hinge);
      for (const y of [-0.26, 0.26])
        rod([handleX, y, 0.025], [handleX, y, 0.09], 0.013, polished, hinge);
      explode(hinge, [sign * 0.16, 0, 0.3]);
      actions.push((value) => { hinge.rotation.y = sign * value * Math.PI * 0.48; });
    }
  } else if (id === "cabinets") {
    legs(2.12, 0.78, 0.2);
    const shell = new THREE.Group();
    group.add(shell);
    const top = box([2.42, 0.067, 1.04], [0, 1.43, 0], steel, shell, 0.013);
    explode(top, [0, 0.4, 0]);
    const rear = box([2.28, 1.17, 0.024], [0, 0.81, -0.47], steel, shell);
    explode(rear, [0, 0.12, -0.27]);
    for (const x of [-1.14, 1.14]) {
      const side = box([0.028, 1.18, 0.95], [x, 0.81, 0], steel, shell);
      explode(side, [Math.sign(x) * 0.3, 0.08, 0]);
    }
    box([2.27, 0.035, 0.93], [0, 0.23, 0], steel, shell);
    const shelf = tray(2.24, 0.88, 0.81, shell);
    shelf.name = "cabinet-internal-shelf";
    explode(shelf, [0, 0.18, 0.28]);
    const splash = box([2.4, 0.19, 0.027], [0, 1.56, -0.5], steel, shell);
    explode(splash, [0, 0.35, -0.15]);
    const doors: { hinge: THREE.Group; sign: number }[] = [];
    for (const sign of [-1, 1]) {
      const hinge = new THREE.Group();
      shell.add(hinge);
      hinge.userData.operable = true;
      hinge.name = "cabinet-door";
      hinge.position.set(sign * 1.105, 0.81, 0.487);
      const center = -sign * 0.546;
      box([1.081, 1.1, 0.038], [center, 0, 0], steel, hinge, 0.012);
      const handleX = center - sign * 0.38;
      rod(
        [handleX, -0.18, 0.05],
        [handleX, 0.18, 0.05],
        0.014,
        polished,
        hinge,
      );
      for (const y of [-0.18, 0.18])
        rod([handleX, y, 0.018], [handleX, y, 0.05], 0.011, polished, hinge);
      for (const y of [-0.4, 0.4])
        box([0.028, 0.12, 0.027], [0, y, 0.013], polished, hinge);
      explode(hinge, [sign * 0.15, 0, 0.34]);
      doors.push({ hinge, sign });
    }
    actions.push((value) =>
      doors.forEach(({ hinge, sign }) => {
        hinge.rotation.y = sign * value * Math.PI * 0.48;
      }),
    );
  } else if (id === "display") {
    legs(2.16, 0.83, 0.15);
    const base = new THREE.Group();
    group.add(base);
    box([2.42, 0.66, 1.03], [0, 0.43, 0], steel, base, 0.028);
    const grille = box([0.94, 0.28, 0.016], [0.62, 0.3, 0.524], dark, base);
    for (let i = 0; i < 7; i++)
      box([0.91, 0.016, 0.018], [0.62, 0.18 + i * 0.04, 0.537], polished, base);
    for (const x of [-1.16, 1.16])
      for (const y of [0.21, 0.6]) bolt([x, y, 0.522], base);
    explode(grille, [0.1, 0, 0.22]);
    const trayGroup = new THREE.Group();
    group.add(trayGroup);
    for (const y of [0.81, 1.22]) {
      box([2.3, 0.032, 0.86], [0, y, -0.02], steel, trayGroup);
      for (let i = 0; i < 3; i++)
        shallowPan(0.69, 0.68, [(i - 1) * 0.74, y + 0.025, -0.02], trayGroup);
      for (const x of [-1.1, 1.1])
        rod([x, y, -0.45], [x, y, 0.39], 0.014, polished, trayGroup);
    }
    explode(trayGroup, [0, 0.28, 0.22]);
    const canopy = new THREE.Group();
    group.add(canopy);
    const cross = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0.79, 0.54),
      new THREE.Vector3(0, 1.55, 0.54),
      new THREE.Vector3(0, 1.87, 0.08),
    );
    const glassVertices: number[] = [],
      glassIndices: number[] = [];
    const arc = cross.getPoints(28);
    arc.forEach((p) => {
      glassVertices.push(-1.18, p.y, p.z, 1.18, p.y, p.z);
    });
    for (let i = 0; i < arc.length - 1; i++) {
      const a = i * 2;
      glassIndices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const curved = new THREE.BufferGeometry();
    curved.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(glassVertices, 3),
    );
    curved.setIndex(glassIndices);
    curved.computeVertexNormals();
    mesh(curved, glass, canopy);
    const sideShape = new THREE.Shape();
    sideShape.moveTo(0.45, 0.79);
    sideShape.lineTo(-0.54, 0.79);
    arc.forEach((p) => sideShape.lineTo(-p.z, p.y));
    sideShape.lineTo(0.45, 1.87);
    sideShape.closePath();
    for (const x of [-1.18, 1.18]) {
      const side = mesh(new THREE.ShapeGeometry(sideShape, 24), glass, canopy);
      side.rotation.y = Math.PI / 2;
      side.position.x = x;
      tube(
        arc.map((p) => [x, p.y, p.z] as Vec),
        0.02,
        dark,
        canopy,
      );
      rod([x, 0.78, -0.45], [x, 1.86, -0.45], 0.019, polished, canopy);
      rod([x, 1.86, -0.45], [x, 1.87, 0.08], 0.018, polished, canopy);
    }
    rod([-1.18, 1.87, 0.08], [1.18, 1.87, 0.08], 0.021, polished, canopy);
    box([2.36, 0.032, 0.51], [0, 1.866, -0.18], steel, canopy);
    const rearGlass = box([2.29, 0.98, 0.008], [0, 1.31, -0.45], glass, canopy);
    rearGlass.castShadow = rearGlass.receiveShadow = false;
    explode(canopy, [0, 0.49, -0.12]);
    const ledMaterial = new THREE.MeshStandardMaterial({
      color: 0xd5ddd4,
      emissive: 0xfff2d7,
      emissiveIntensity: 0,
      roughness: 0.3,
    });
    const led = box(
      [2.16, 0.018, 0.028],
      [0, 1.835, 0.025],
      ledMaterial,
      canopy,
    );
    led.castShadow = false;
    const lamps: THREE.PointLight[] = [];
    for (const x of [-0.72, 0, 0.72]) {
      const lamp = new THREE.PointLight(0xffefd0, 0, 1.5, 2);
      lamp.position.set(x, 1.76, 0.02);
      canopy.add(lamp);
      lamps.push(lamp);
    }
    actions.push((value) => {
      ledMaterial.emissiveIntensity = value * 3.5;
      lamps.forEach((l) => {
        l.intensity = value * 1.3;
      });
    });
  } else {
    const stone = new THREE.MeshStandardMaterial({
      color: 0xb9bbb4,
      metalness: 0.05,
      roughness: 0.5,
    });
    const wood = new THREE.MeshStandardMaterial({
      color: 0x5c3828,
      metalness: 0.05,
      roughness: 0.4,
    });
    const base = box([2.6, 0.59, 1], [0, 0.345, 0], stone, group, 0.018);
    box([2.46, 0.075, 0.89], [0, 0.045, 0], dark);
    for (let i = 0; i < 3; i++)
      box([0.53, 0.15, 0.016], [(i - 1) * 0.7, 0.17, 0.51], dark);
    const counter = box([2.64, 0.042, 1.05], [0, 0.665, 0], steel);
    explode(counter, [0, 0.17, 0]);
    const upper = new THREE.Group();
    group.add(upper);
    const lower = tray(2.39, 0.88, 0.74, upper);
    explode(lower, [0, 0.12, 0.14]);
    const mid = tray(2.39, 0.88, 1.22, upper);
    explode(mid, [0, 0.27, 0]);
    for (const x of [-1.23, 0, 1.23]) {
      box([0.03, 1.13, 0.03], [x, 1.22, 0.48], polished, upper);
      box([0.03, 1.13, 0.03], [x, 1.22, -0.48], polished, upper);
    }
    for (const y of [0.71, 1.2, 1.76]) {
      box([2.48, 0.025, 0.035], [0, y, -0.48], polished, upper);
      box([2.48, 0.045, 0.04], [0, y, 0.48], wood, upper);
    }
    for (const x of [-1.24, 1.24]) {
      const side = box([0.009, 1.02, 0.94], [x, 1.25, 0], glass, upper);
      explode(side, [Math.sign(x) * 0.25, 0.08, 0]);
    }
    const roof = box([2.49, 0.01, 0.96], [0, 1.77, 0], glass, upper);
    explode(roof, [0, 0.4, 0]);
    for (const y of [0.96, 1.48])
      for (const x of [-0.62, 0.62]) {
        const panel = box([1.18, 0.45, 0.008], [x, y, 0.48], glass, upper);
        explode(panel, [Math.sign(x) * 0.09, 0.1, 0.24]);
        box([0.23, 0.017, 0.019], [x, y - 0.19, 0.507], polished, upper);
      }
    box([2.41, 1.03, 0.009], [0, 1.25, -0.48], glass, upper);
    for (const y of [0.77, 1.25])
      for (let i = 0; i < 3; i++)
        shallowPan(0.68, 0.68, [(i - 1) * 0.75, y, 0], upper);
    explode(upper, [0, 0.18, 0]);
    explode(base, [0, 0, -0.02]);
  }

  return {
    group,
    operationContinuous,
    animate(assembly, operation, time, reduced) {
      for (const p of parts)
        p.object.position.copy(p.origin).addScaledVector(p.travel, assembly);
      for (const action of actions) action(operation, time, reduced);
      group.updateMatrixWorld();
    },
  };
}

function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  s.closePath();
  return s;
}

function quad(points: Vec[]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(points.flat(), 3),
  );
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2),
  );
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  geometry.computeTangents();
  return geometry;
}

function brushedTexture() {
  const width = 256,
    height = 128,
    data = new Uint8Array(width * height * 4);
  let seed = 19;
  for (let y = 0; y < height; y++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const stripe = ((seed >>> 16) % 26) - 13;
    for (let x = 0; x < width; x++) {
      const value = Math.max(
        0,
        Math.min(255, 145 + stripe + Math.sin(x * 0.12) * 2),
      );
      const i = (y * width + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 2;
  texture.repeat.set(2, 5);
  texture.needsUpdate = true;
  return texture;
}
