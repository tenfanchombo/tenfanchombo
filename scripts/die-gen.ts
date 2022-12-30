import fs from 'fs';

const vertices: string[] = [];
const faces: string[] = [];

const DIE_SIZE = 16;
const BEVEL = 0.5;
const MARGIN = 1;
const PADDING = 0.5;
const SPOT = (DIE_SIZE - (BEVEL + MARGIN) * 2) / 3;
const SPOT_SEGS = 32;
const SPOT_RINGS = 8;
const SPOT_DEPTH = 0.5;

function vertex(x: number, y: number, z: number) {
    const s = `v ${x} ${y} ${z}`;
    const index = vertices.indexOf(s);
    if (index !== -1) {
        return (index + 1).toString();
    }
    vertices.push(s);
    return vertices.length.toString();;
}

const z = DIE_SIZE / 2;

function genSides(callback: (value: number, vert: (x: number, y: number, z: number) => string) => void) {
    // front
    callback(3, vertex);
    // back
    callback(4, (x, y, z) => vertex(-x, y, -z));
    // left
    callback(5, (x, y, z) => vertex(-z, y, x));
    // right
    callback(2, (x, y, z) => vertex(z, y, -x));
    // top
    callback(6, (x, y, z) => vertex(y, z, x));

    // bottom
    drawBlankOrSpot(0, 0, (x, y, z) => vertex(y, -z, -x), 1, true, SPOT * 3, SPOT);
}

// TODO: move these to a formular
const ringDepths = [0, 0.19, 0.378795181, 0.552771084, 0.705261044, 0.830401606, 0.923413655, 0.980682731, 1];
const ringOffsets = [0, 0.016331178, 0.073401936, 0.166086451, 0.290815401, 0.442796557, 0.61618785, 0.804334352, 1];

function drawBlankOrSpot(x: number, y: number, vert: (x: number, y: number, z: number) => string, value: number, spot: boolean, size = SPOT, radius = (SPOT - PADDING) / 2) {
    if (!spot) {
        faces.push(`f ${vert(x - size / 2, y + size / 2, z)} ${vert(x + size / 2, y + size / 2, z)} ${vert(x + size / 2, y - size / 2, z)} ${vert(x - size / 2, y - size / 2, z)}`);
        return;
    }

    const segAngle = Math.PI * 2 / SPOT_SEGS;
    faces.push( value === 1 ? 'usemtl Die_One' : 'usemtl Die_Spot');
    for (let r = 0; r < SPOT_RINGS; r++) {
        for (let s = 0; s < SPOT_SEGS; s++) {
            const angle = segAngle * s;
            const nextAngle = segAngle * (s + 1);
            const d = radius - ringOffsets[r] * radius;
            const nd = radius - ringOffsets[r + 1] * radius;

            const sy = Math.cos(angle);
            const sx = Math.sin(angle);
            const ny = Math.cos(nextAngle);
            const nx = Math.sin(nextAngle);
            
            const sz = -ringDepths[r] * SPOT_DEPTH;
            const nz = -ringDepths[r + 1] * SPOT_DEPTH;

            if (r === SPOT_RINGS - 1) {
                faces.push(`f ${vert(x + sx * d, y + sy * d, z + sz)} ${vert(x + sx * nd, y + sy * nd, z + nz)} ${vert(x + nx * d, y + ny * d, z + sz)}`);
            } else {
                faces.push(`f ${vert(x + sx * d, y + sy * d, z + sz)} ${vert(x + sx * nd, y + sy * nd, z + nz)} ${vert(x + nx * nd, y + ny * nd, z + nz)} ${vert(x + nx * d, y + ny * d, z + sz)}`);
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
        faces.push(`f ${vert(x + sx * radius, y + sy * radius, z)} ${vert(x + size / 2 * Math.sign(sx + nx), y + size / 2 * Math.sign(sy + ny), z)} ${vert(x + nx * radius, y + ny * radius, z)}`);
    }

    faces.push(`f ${vert(x - size / 2, y + size / 2, z)} ${vert(x + size / 2, y + size / 2, z)} ${vert(x, y + radius, z)}`);
    faces.push(`f ${vert(x + size / 2, y + size / 2, z)} ${vert(x + size / 2, y - size / 2, z)} ${vert(x + radius, y, z)}`);
    faces.push(`f ${vert(x + size / 2, y - size / 2, z)} ${vert(x - size / 2, y - size / 2, z)} ${vert(x, y - radius, z)}`);
    faces.push(`f ${vert(x - size / 2, y + size / 2, z)} ${vert(x - size / 2, y - size / 2, z)} ${vert(x - radius, y, z)}`);
}

genSides((value: number, vert: (x: number, y: number, z: number) => string) => {
    drawBlankOrSpot(-1 * SPOT, +1 * SPOT, vert, value, value >= 4);
    drawBlankOrSpot(-1 * SPOT, +0 * SPOT, vert, value, false);
    drawBlankOrSpot(-1 * SPOT, -1 * SPOT, vert, value, value >= 2);

    drawBlankOrSpot(+0 * SPOT, +1 * SPOT, vert, value, value === 6);
    drawBlankOrSpot(+0 * SPOT, +0 * SPOT, vert, value, value % 2 === 1);
    drawBlankOrSpot(+0 * SPOT, -1 * SPOT, vert, value, value === 6);

    drawBlankOrSpot(+1 * SPOT, +1 * SPOT, vert, value, value >= 2);
    drawBlankOrSpot(+1 * SPOT, +0 * SPOT, vert, value, false);
    drawBlankOrSpot(+1 * SPOT, -1 * SPOT, vert, value, value >= 4);
});

const content = 'mtllib die.mtl\n\n' + vertices.join('\n')
    + '\n\nusemtl Die\n'
    + faces.join('\n');

fs.writeFile('./apps/test-harness/src/assets/die.obj', content, err => {
    if (err) {
        console.error(err);
    }
});