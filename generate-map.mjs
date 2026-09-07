import { mkdir, writeFile } from "node:fs/promises";

const primitives = [];

function normal(a, b, c) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const length = Math.hypot(...n) || 1;
  return n.map(value => value / length);
}

function builder(material) {
  const positions = [], normals = [], indices = [];
  const tri = (a, b, c) => {
    const n = normal(a, b, c), start = positions.length / 3;
    for (const point of [a, b, c]) positions.push(...point);
    normals.push(...n, ...n, ...n);
    indices.push(start, start + 1, start + 2);
  };
  return { material, positions, normals, indices, tri };
}

function island(cx, cz, radius, height, seed, material) {
  const mesh = builder(material);
  const count = 14;
  const top = [], lower = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const wobble = 1 + Math.sin(i * 2.71 + seed) * .16 + Math.cos(i * 1.37 + seed) * .08;
    const r = radius * wobble;
    top.push([cx + Math.cos(angle) * r, height + Math.sin(i * 1.83 + seed) * .16, cz + Math.sin(angle) * r]);
    lower.push([cx + Math.cos(angle) * r * .83, .05 + Math.sin(i + seed) * .05, cz + Math.sin(angle) * r * .83]);
  }
  const center = [cx, height + .38, cz];
  const bottom = [cx, 0, cz];
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    mesh.tri(center, top[j], top[i]);
    mesh.tri(top[i], top[j], lower[j]);
    mesh.tri(top[i], lower[j], lower[i]);
    mesh.tri(bottom, lower[i], lower[j]);
  }
  primitives.push(mesh);
}

function box(cx, y, cz, sx, sy, sz, material) {
  const mesh = builder(material);
  const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = y, y1 = y + sy, z0 = cz - sz / 2, z1 = cz + sz / 2;
  const p = [[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
  for (const [a,b,c,d] of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]) { mesh.tri(p[a],p[b],p[c]); mesh.tri(p[a],p[c],p[d]); }
  primitives.push(mesh);
}

function bridge(a, b, material) {
  const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz), angle = Math.atan2(dz, dx);
  const mesh = builder(material), width = .08, y = .42;
  const along = [Math.cos(angle), Math.sin(angle)], side = [-along[1] * width, along[0] * width];
  const p0 = [a[0] + side[0], y, a[1] + side[1]], p1 = [a[0] - side[0], y, a[1] - side[1]], p2 = [b[0] - side[0], y, b[1] - side[1]], p3 = [b[0] + side[0], y, b[1] + side[1]];
  mesh.tri(p0, p3, p2); mesh.tri(p0, p2, p1); primitives.push(mesh);
}

island(-4, 1.1, 2.35, .75, .3, 0);
island(0, -2.1, 2.7, .95, 1.7, 1);
island(4.1, 1.15, 2.25, .82, 3.1, 2);
bridge([-2.3,.2],[-1.3,-1.1],3); bridge([1.4,-1],[2.6,.2],3); bridge([-1.9,1.2],[2.2,1.2],3);
for (let i = 0; i < 7; i++) box(-4 + (i % 3 - 1) * .48, .8, 1.1 + Math.floor(i / 3) * .45, .28, .65 + (i % 2) * .35, .28, 0);
box(-4, .8, 1.1, .6, 1.8, .6, 0);
for (let i = 0; i < 9; i++) box(Math.cos(i * .7) * .9, 1, -2.1 + Math.sin(i * .7) * .9, .22, .7 + (i % 3) * .3, .22, 1);
box(0, 1, -2.1, .7, 2.2, .7, 1);
for (let i = 0; i < 8; i++) box(4.1 + Math.cos(i * .78) * .85, .85, 1.15 + Math.sin(i * .78) * .85, .3, .7 + (i % 2) * .45, .3, 2);
box(4.1, .85, 1.15, .8, 2.5, .8, 2);

const chunks = [], bufferViews = [], accessors = [];
let offset = 0;
const align = () => { while (offset % 4) { chunks.push(Buffer.from([0])); offset++; } };
const append = (typed, target) => {
  align(); const data = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength); const index = bufferViews.length;
  bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: data.length, target }); chunks.push(data); offset += data.length; return index;
};
const addAccessor = (view, componentType, count, type, min, max) => { const index = accessors.length; accessors.push({ bufferView:view, componentType, count, type, min, max }); return index; };
const meshPrimitives = primitives.map(item => {
  const pos = new Float32Array(item.positions), nor = new Float32Array(item.normals), ind = new Uint16Array(item.indices);
  const pv = append(pos, 34962), nv = append(nor, 34962), iv = append(ind, 34963);
  const xs = item.positions.filter((_,i)=>i%3===0), ys = item.positions.filter((_,i)=>i%3===1), zs = item.positions.filter((_,i)=>i%3===2);
  return { attributes:{ POSITION:addAccessor(pv,5126,pos.length/3,"VEC3",[Math.min(...xs),Math.min(...ys),Math.min(...zs)],[Math.max(...xs),Math.max(...ys),Math.max(...zs)]), NORMAL:addAccessor(nv,5126,nor.length/3,"VEC3") }, indices:addAccessor(iv,5123,ind.length,"SCALAR"), material:item.material };
});
align();
const bin = Buffer.concat(chunks);
const gltf = { asset:{version:"2.0",generator:"ATLAS procedural demo map"}, scene:0, scenes:[{nodes:[0]}], nodes:[{mesh:0}], meshes:[{name:"Demo World Map — replace with your GLB",primitives:meshPrimitives}], materials:[
  {name:"Sunforge Amber",pbrMetallicRoughness:{baseColorFactor:[.55,.23,.06,1],metallicFactor:.35,roughnessFactor:.64},emissiveFactor:[.12,.035,.005]},
  {name:"Aether Teal",pbrMetallicRoughness:{baseColorFactor:[.04,.38,.35,1],metallicFactor:.3,roughnessFactor:.7},emissiveFactor:[.01,.08,.07]},
  {name:"Ash Crimson",pbrMetallicRoughness:{baseColorFactor:[.38,.045,.025,1],metallicFactor:.45,roughnessFactor:.58},emissiveFactor:[.11,.008,.002]},
  {name:"Luminous Paths",pbrMetallicRoughness:{baseColorFactor:[.45,.58,.55,1],metallicFactor:.5,roughnessFactor:.35},emissiveFactor:[.12,.23,.21]}
], accessors, bufferViews, buffers:[{byteLength:bin.length}] };
let json = Buffer.from(JSON.stringify(gltf)); while (json.length % 4) json = Buffer.concat([json, Buffer.from(" ")]);
const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67,0); header.writeUInt32LE(2,4); header.writeUInt32LE(12+8+json.length+8+bin.length,8);
const jsonHeader = Buffer.alloc(8); jsonHeader.writeUInt32LE(json.length,0); jsonHeader.writeUInt32LE(0x4e4f534a,4);
const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(bin.length,0); binHeader.writeUInt32LE(0x004e4942,4);
await mkdir("src/assets", {recursive:true}); await writeFile("src/assets/demo-world.glb", Buffer.concat([header,jsonHeader,json,binHeader,bin]));
console.log("Generated src/assets/demo-world.glb", bin.length, "bytes");
