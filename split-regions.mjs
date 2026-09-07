// Extract the existing demo islands without modifying the world or custom assets.
import { readFile, writeFile } from 'node:fs/promises';
const source = await readFile(new URL('./src/assets/demo-world.glb', import.meta.url));
const jsonSize = source.readUInt32LE(12);
const original = JSON.parse(source.subarray(20, 20 + jsonSize));
const binaryOffset = 20 + jsonSize;
const binary = source.subarray(binaryOffset + 8, binaryOffset + 8 + source.readUInt32LE(binaryOffset));
if (original.meshes.length !== 1 || original.nodes.length !== 1) throw new Error('This extractor only supports the original ATLAS demo.');
for (const [region, materialName] of Object.entries({ grove: 'Aether Teal', citadel: 'Sunforge Amber', ashen: 'Ash Crimson' })) {
  const material = original.materials.findIndex(item => item.name === materialName);
  if (material < 0) throw new Error(`Missing material: ${materialName}`);
  const doc = structuredClone(original);
  doc.meshes[0].primitives = doc.meshes[0].primitives.filter(p => p.material === material);
  if (!doc.meshes[0].primitives.length) throw new Error(`Empty region: ${region}`);
  doc.meshes[0].name = `ATLAS demo region: ${region}`;
  // Repack only referenced accessors and binary views, excluding other regions.
  const accessors = [], views = [], chunks = [], indexMap = new Map();
  let byteLength = 0;
  function copyAccessor(index) {
    if (indexMap.has(index)) return indexMap.get(index);
    const accessor = structuredClone(original.accessors[index]);
    const view = structuredClone(original.bufferViews[accessor.bufferView]);
    const chunk = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    const padded = Buffer.alloc(Math.ceil(chunk.length / 4) * 4); chunk.copy(padded);
    view.byteOffset = byteLength; view.buffer = 0;
    accessor.bufferView = views.length;
    views.push(view); chunks.push(padded); byteLength += padded.length;
    indexMap.set(index, accessors.length); accessors.push(accessor);
    return accessors.length - 1;
  }
  for (const primitive of doc.meshes[0].primitives) {
    for (const key of Object.keys(primitive.attributes)) primitive.attributes[key] = copyAccessor(primitive.attributes[key]);
    if (primitive.indices !== undefined) primitive.indices = copyAccessor(primitive.indices);
    primitive.material = 0;
  }
  doc.accessors = accessors; doc.bufferViews = views; doc.buffers = [{ byteLength }];
  doc.materials = [doc.materials[material]];
  const bounds = doc.meshes[0].primitives.map(p => doc.accessors[p.attributes.POSITION]);
  doc.nodes[0].translation = [0, 1, 2].map(axis => -(Math.min(...bounds.map(a => a.min[axis])) + Math.max(...bounds.map(a => a.max[axis]))) / 2);
  const json = Buffer.from(JSON.stringify(doc));
  const paddedJson = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20); json.copy(paddedJson);
  const header = Buffer.alloc(20), binaryHeader = Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + paddedJson.length + byteLength, 8);
  header.writeUInt32LE(paddedJson.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  binaryHeader.writeUInt32LE(byteLength, 0); binaryHeader.writeUInt32LE(0x004e4942, 4);
  const output = Buffer.concat([header, paddedJson, binaryHeader, ...chunks]);
  // Refuse to overwrite existing region assets. Custom models are never regenerated on build.
  await writeFile(new URL(`./src/assets/region-${region}.glb`, import.meta.url), output, { flag: 'wx' });
  console.log(`${region}: ${output.length} bytes`);
}
