# Future SolidWorks model integration

The live showroom currently uses procedural concepts. Saved project items contain stable product IDs and requested dimensions/layouts rather than Three.js meshes, so project lists and enquiry summaries can remain intact when the model source changes.

## Model delivery

Keep the original SolidWorks part and assembly files as engineering source. Prepare optimised web GLB assets for the browser. Resolve external assembly references before export. A SolidWorks assembly is not loaded directly by the current browser viewer.

## Integration boundary

- `src/lib/product-models.ts`: current product geometry factory. Return the same ProductModel contract for imported assets or introduce a source registry ahead of this factory.
- `src/lib/product-viewer-engine.ts`: scene, camera, bounds, materials, controls and resource cleanup.
- `src/lib/fasttrack-data.ts`: stable product IDs and reviewed catalog content.
- `src/lib/product-configuration.mjs`: requested configuration and input ranges for concept previews.
- `src/lib/project-list.mjs`: saved list and enquiry text, independent of model geometry.

## Asset preparation

Use consistent units, ground plane and forward orientation. Preserve meaningful part names, hinges/pivots and separate shelf/door geometry. Supply material intent, dimensions and approved operating motions. Check triangle counts, texture dimensions, compression, mobile memory use and licenses before publication.

## Important configuration distinction

The current preview changes proportions and procedural shelf arrangements. Do not stretch an approved CAD model and describe it as an engineered product variant. For exact customer configurations, use reviewed pre-exported variants, mapped parameter constraints or an engineering generation service. Map supported UI options to those variants and clearly mark unsupported combinations for review.

## Import acceptance

Verify external dimensions against the engineering source, normals/materials, hinge clearances, visible shelves, assembled/exploded bounds, touch and keyboard controls, lighting, context-loss handling and disposal. Test source load failures with a useful image fallback. No CAD import is claimed as implemented until the supplied assets pass this workflow.
