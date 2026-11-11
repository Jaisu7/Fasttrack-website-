import * as THREE from 'three';

/** A visual study mode; it does not change the requested specification. */
export function watchTechnicalView(root: THREE.Object3D, onChange: (active: boolean) => void) {
  const originals = new Map<THREE.MeshStandardMaterial, { wireframe: boolean; color: THREE.Color }>();
  const update = () => {
    const active = document.documentElement.dataset.experience === 'technical';
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!(material instanceof THREE.MeshStandardMaterial) || material.metalness < 0.45) continue;
        if (!originals.has(material)) originals.set(material, { wireframe: material.wireframe, color: material.color.clone() });
        const original = originals.get(material)!;
        material.wireframe = active || original.wireframe;
        material.color.copy(active ? new THREE.Color(0x52d39b) : original.color);
        material.needsUpdate = true;
      }
    });
    onChange(active);
  };
  window.addEventListener('fastrack:view-change', update);
  update();
  return () => { window.removeEventListener('fastrack:view-change', update); originals.clear(); };
}
