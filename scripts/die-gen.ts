import fs from 'fs';

const vertices: string[] = [];
const normals: string[] = [];
const faces: string[] = [];

const DIE_SIZE = 0.016;
const BEVEL = 0.00125;
const MARGIN = 0;//1;
const PADDING = 0.0005;
const SPOT = (DIE_SIZE - (BEVEL + MARGIN) * 2) / 3;
const SPOT_SEGS = 32;
const SPOT_RINGS = 8;
const SPOT_DEPTH = 0.0005;

const BEVEL_STEPS = 4;

function vertex(x: number, y: number, z: number) {
    const s = `v ${x} ${y} ${z}`;
    const index = vertices.indexOf(s);
    if (index !== -1) {
        return (index + 1).toString();
    }
    vertices.push(s);
    return vertices.length.toString();;
}

function normal(x: number, y: number, z: number) {
    const s = `vn ${x} ${y} ${z}`;
    const index = normals.indexOf(s);
    if (index !== -1) {
        return (index + 1).toString();
    }
    normals.push(s);
    return normals.length.toString();;
}

function face(...verts: string[]) {
    faces.push(`f ${verts.join(' ')}`);
}

const z = DIE_SIZE / 2;

function genSides(callback: (value: number, vert: (x: number, y: number, z: number) => string, norm: (x: number, y: number, z: number) => string) => void) {
    // front
    callback(3, vertex, normal);
    // back
    callback(4, (x, y, z) => vertex(-x, +y, -z), (x, y, z) => normal(-x, +y, -z));
    // left
    callback(5, (x, y, z) => vertex(-z, +y, +x), (x, y, z) => normal(-z, +y, +x));
    // right
    callback(2, (x, y, z) => vertex(+z, +y, -x), (x, y, z) => normal(+z, +y, -x));
    // top
    callback(6, (x, y, z) => vertex(+y, +z, +x), (x, y, z) => normal(+y, +z, +x));

    // bottom
    drawBlankOrSpot(0, 0, (x, y, z) => vertex(+y, -z, -x), (x, y, z) => normal(+y, -z, -x), 1, true, SPOT * 3, SPOT * 0.7);
}

// TODO: move these to a formular
const ringDepths = [0, 0.19, 0.378795181, 0.552771084, 0.705261044, 0.830401606, 0.923413655, 0.980682731, 1];
const ringOffsets = [0, 0.016331178, 0.073401936, 0.166086451, 0.290815401, 0.442796557, 0.61618785, 0.804334352, 1];

function drawBlankOrSpot(x: number, y: number, vert: (x: number, y: number, z: number) => string, norm: (x: number, y: number, z: number) => string, value: number, spot: boolean, size = SPOT, radius = (SPOT - PADDING) / 2) {
    if (!spot) {
        faces.push(`f ${vert(x - size / 2, y - size / 2, z)} ${vert(x + size / 2, y - size / 2, z)} ${vert(x + size / 2, y + size / 2, z)} ${vert(x - size / 2, y + size / 2, z)}`);
        return;
    }

    const segAngle = Math.PI * 2 / SPOT_SEGS;
    faces.push( value === 1 ? 'usemtl Die_One' : 'usemtl Die_Spot');
    for (let r = 0; r < SPOT_RINGS; r++) {
        for (let s = 0; s < SPOT_SEGS; s++) {
            const angle = segAngle * s;
            const nextAngle = segAngle * (s + 1);
            const sd = radius - ringOffsets[r] * radius;
            const nd = radius - ringOffsets[r + 1] * radius;

            const sy = Math.cos(angle);
            const sx = Math.sin(angle);
            const ny = Math.cos(nextAngle);
            const nx = Math.sin(nextAngle);

            const sz = -ringDepths[r] * SPOT_DEPTH;
            const nz = -ringDepths[r + 1] * SPOT_DEPTH;

            function vn(ox: number, oy: number, oz: number, od: number) {
                return `${vert(x + ox * od, y + oy * od, z + oz)}//${norm(ox * od * -1, oy * od * -1 , -oz + SPOT_DEPTH)}`;
            }

            if (r === SPOT_RINGS - 1) {
                // faces.push(`f ${vert(x + sx * sd, y + sy * sd, z + sz)} ${vert(x, y, z + nz)} ${vert(x + nx * sd, y + ny * sd, z + sz)}`);
                faces.push(`f ${vn(sx, sy, sz, sd)} ${vn(0, 0, nz, 0)} ${vn(nx, ny, sz, sd)}`);
            } else {
                // faces.push(`f ${vert(x + sx * d, y + sy * d, z + sz)}//${norm(sx * d * -1, sy * d * -1 , -sz)} ${vert(x + sx * nd, y + sy * nd, z + nz)}//${norm(0, 0, 1)} ${vert(x + nx * nd, y + ny * nd, z + nz)}//${norm(0, 0, 1)} ${vert(x + nx * d, y + ny * d, z + sz)}//${norm(0, 0, 1)}`);
                faces.push(`f ${vn(sx, sy, sz, sd)} ${vn(sx, sy, nz, nd)} ${vn(nx, ny, nz, nd)} ${vn(nx, ny, sz, sd)}`);
            }

        }
    }

    faces.push('usemtl Die');
    for (let s = 0; s < SPOT_SEGS; s++) {
        const angle = segAngle * s;
        const nextAngle = segAngle * (s + 1);
        const sy = Math.cos(angle);
        const sx = Math.sin(angle);
        const ny = Math.cos(nextAngle);
        const nx = Math.sin(nextAngle);
        face(vert(x + sx * radius, y + sy * radius, z),
             vert(x + nx * radius, y + ny * radius, z),
             vert(x + size / 2 * Math.sign(sx + nx), y + size / 2 * Math.sign(sy + ny), z));
    }

    face(vert(x + size / 2, y + size / 2, z), vert(x - size / 2, y + size / 2, z), vert(x, y + radius, z));
    face(vert(x + size / 2, y - size / 2, z), vert(x + size / 2, y + size / 2, z), vert(x + radius, y, z));
    face(vert(x - size / 2, y - size / 2, z), vert(x + size / 2, y - size / 2, z), vert(x, y - radius, z));
    face(vert(x - size / 2, y + size / 2, z), vert(x - size / 2, y - size / 2, z), vert(x - radius, y, z));
}

genSides((value: number, vert: (x: number, y: number, z: number) => string, norm: (x: number, y: number, z: number) => string) => {
    drawBlankOrSpot(-1 * SPOT, +1 * SPOT, vert, norm, value, value >= 4);
    drawBlankOrSpot(-1 * SPOT, +0 * SPOT, vert, norm, value, false);
    drawBlankOrSpot(-1 * SPOT, -1 * SPOT, vert, norm, value, value >= 2);

    drawBlankOrSpot(+0 * SPOT, +1 * SPOT, vert, norm, value, value === 6);
    drawBlankOrSpot(+0 * SPOT, +0 * SPOT, vert, norm, value, value % 2 === 1);
    drawBlankOrSpot(+0 * SPOT, -1 * SPOT, vert, norm, value, value === 6);

    drawBlankOrSpot(+1 * SPOT, +1 * SPOT, vert, norm, value, value >= 2);
    drawBlankOrSpot(+1 * SPOT, +0 * SPOT, vert, norm, value, false);
    drawBlankOrSpot(+1 * SPOT, -1 * SPOT, vert, norm, value, value >= 4);
});


const bevelAngles = new Array(BEVEL_STEPS + 1).fill(1).map((_, i) => ({
    c: Math.cos(Math.PI * i / 2 / BEVEL_STEPS) * BEVEL,
    s: Math.sin(Math.PI * i / 2 / BEVEL_STEPS) * BEVEL
}))

const innerOffset = (DIE_SIZE / 2) - BEVEL;

function bv(x: number, y: number, z: number) {
    return `${vertex(x, y, z)}//${normal(x - innerOffset * Math.sign(x), y - innerOffset * Math.sign(y), z - innerOffset * Math.sign(z))}}`;
}

// bevels
for (let bi = 0; bi < BEVEL_STEPS; bi++) {
    const inO = innerOffset;
    const bcA = inO + Math.cos(Math.PI * (bi + 0) / 2 / BEVEL_STEPS) * BEVEL;
    const bcB = inO + Math.cos(Math.PI * (bi + 1) / 2 / BEVEL_STEPS) * BEVEL;
    const bsA = inO + Math.sin(Math.PI * (bi + 0) / 2 / BEVEL_STEPS) * BEVEL;
    const bsB = inO + Math.sin(Math.PI * (bi + 1) / 2 / BEVEL_STEPS) * BEVEL;

    face(bv(+bcA, -inO, +bsA), bv(+bcA, +inO, +bsA), bv(+bcB, +inO, +bsB), bv(+bcB, -inO, +bsB));
    face(bv(+inO, +bcA, +bsA), bv(-inO, +bcA, +bsA), bv(-inO, +bcB, +bsB), bv(+inO, +bcB, +bsB));
    face(bv(+bcA, +bsA, +inO), bv(+bcA, +bsA, -inO), bv(+bcB, +bsB, -inO), bv(+bcB, +bsB, +inO));

    face(bv(-bcA, -inO, -bsA), bv(-bcA, +inO, -bsA), bv(-bcB, +inO, -bsB), bv(-bcB, -inO, -bsB));
    face(bv(+inO, -bcA, -bsA), bv(-inO, -bcA, -bsA), bv(-inO, -bcB, -bsB), bv(+inO, -bcB, -bsB));
    face(bv(-bcA, -bsA, +inO), bv(-bcA, -bsA, -inO), bv(-bcB, -bsB, -inO), bv(-bcB, -bsB, +inO));

    face(bv(+bcA, +inO, -bsA), bv(+bcA, -inO, -bsA), bv(+bcB, -inO, -bsB), bv(+bcB, +inO, -bsB));
    face(bv(-inO, +bcA, -bsA), bv(+inO, +bcA, -bsA), bv(+inO, +bcB, -bsB), bv(-inO, +bcB, -bsB));
    face(bv(+bcA, -bsA, -inO), bv(+bcA, -bsA, +inO), bv(+bcB, -bsB, +inO), bv(+bcB, -bsB, -inO));

    face(bv(-bcA, +inO, +bsA), bv(-bcA, -inO, +bsA), bv(-bcB, -inO, +bsB), bv(-bcB, +inO, +bsB));
    face(bv(-inO, -bcA, +bsA), bv(+inO, -bcA, +bsA), bv(+inO, -bcB, +bsB), bv(-inO, -bcB, +bsB));
    face(bv(-bcA, +bsA, -inO), bv(-bcA, +bsA, +inO), bv(-bcB, +bsB, +inO), bv(-bcB, +bsB, -inO));
}

function discoPoint(m: number, n: number) {
    const x = Math.sin(Math.PI / 2 * m / BEVEL_STEPS) * Math.cos(Math.PI / 2 * n / BEVEL_STEPS);
    const y = Math.sin(Math.PI / 2 * m / BEVEL_STEPS) * Math.sin(Math.PI / 2 * n / BEVEL_STEPS);
    const z = Math.cos(Math.PI / 2 * m / BEVEL_STEPS);
    return `${vertex(innerOffset + BEVEL * x, innerOffset + BEVEL * y, innerOffset + BEVEL * z)}//${normal(x, y, z)}`;
}

// corners 
for (let m = 0; m < BEVEL_STEPS; m++)
{
    for (var n = 0; n < BEVEL_STEPS; n++)
    {
        face(discoPoint(m + 0, n + 0),
             discoPoint(m + 1, n + 0),
             discoPoint(m + 1, n + 1),
             discoPoint(m + 0, n + 1));
    }
}

const content = 'mtllib die.mtl\n\n'
    + vertices.join('\n')
    + '\n\n'
    + normals.join('\n')
    + '\n\nusemtl Die\n'
    + faces.join('\n');

fs.writeFile('./apps/test-harness/src/assets/die.obj', content, err => {
    if (err) {
        console.error(err);
    }
});