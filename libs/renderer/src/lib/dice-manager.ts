/**
 * Inspired by Michael Wolf's threejs-dice: https://github.com/byWulf/threejs-dice
 */

import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { Vector3 } from 'three';

export class DiceManager {
    public readonly diceBodyMaterial: CANNON.Material;
    public readonly floorBodyMaterial: CANNON.Material;
    public readonly barrierBodyMaterial: CANNON.Material;

    constructor(readonly world: CANNON.World) {
        this.diceBodyMaterial = new CANNON.Material();
        this.floorBodyMaterial = new CANNON.Material();
        this.barrierBodyMaterial = new CANNON.Material();

        world.addContactMaterial(
            new CANNON.ContactMaterial(this.floorBodyMaterial, this.diceBodyMaterial, { friction: 0.01, restitution: 0.5 })
        );
        world.addContactMaterial(
            new CANNON.ContactMaterial(this.barrierBodyMaterial, this.diceBodyMaterial, { friction: 0, restitution: 1.0 })
        );
        world.addContactMaterial(
            new CANNON.ContactMaterial(this.diceBodyMaterial, this.diceBodyMaterial, { friction: 0, restitution: 0.5 })
        );
    }

    private throwRunning = false;

    /**
     *
     * @param {array} diceValues
     * @param {DiceObject} [diceValues.dice]
     * @param {number} [diceValues.value]
     *
     */
    prepareValues(diceValues: {value:number, die: Die}[]) {
        if (this.throwRunning) throw new Error('Cannot start another throw. Please wait, till the current throw is finished.');

        for (let i = 0; i < diceValues.length; i++) {
            if (diceValues[i].value < 1 || diceValues[i].die.values < diceValues[i].value) {
                throw new Error('Cannot throw die to value ' + diceValues[i].value + ', because it has only ' + diceValues[i].die.values + ' sides.');
            }
        }

        this.throwRunning = true;

        const dv = diceValues.map(d => ({
            ...d,
            vectors: d.die.getCurrentVectors(),
            stableCount: 0
        }));

        for (let i = 0; i < dv.length; i++) {
            dv[i].die.simulationRunning = true;
        }

        const check = () => {
            let allStable = true;
            for (let i = 0; i < dv.length; i++) {
                if (dv[i].die.isFinished()) {
                    dv[i].stableCount++;
                } else {
                    dv[i].stableCount = 0;
                }

                if (dv[i].stableCount < 50) {
                    allStable = false;
                }
            }

            if (allStable) {
                console.log("all stable");
                this.world.removeEventListener('postStep', check);

                for (let i = 0; i < dv.length; i++) {
                    dv[i].die.shiftUpperValue(dv[i].value);
                    dv[i].die.resetBody();
                    dv[i].die.setVectors(dv[i].vectors);
                    dv[i].die.simulationRunning = false;
                }

                this.throwRunning = false;
            } else {
                this.world.step(this.world.dt);
            }
        };

        this.world.addEventListener('postStep', check);
    }
}

export class Die {
    private invertUpside = false;

    /**
     * @constructor
     * @param {object} options
     * @param {Number} [options.size = 100]
     * @param {Number} [options.fontColor = '#000000']
     * @param {Number} [options.backColor = '#ffffff']
     */
    
    readonly values = 6;
    readonly tab = 0.1;
    readonly af = Math.PI / 4;
    readonly chamfer = 0.96;
    readonly vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
    readonly faces = [[0, 3, 2, 1, 1], [1, 2, 6, 5, 2], [0, 1, 5, 4, 3], [3, 7, 6, 2, 4], [0, 4, 7, 3, 5], [4, 5, 6, 7, 6]];
    readonly scaleFactor = 0.9;
    
    readonly faceTexts = [' ', '0', '1', '2', '3', '4', '5', '6'];
    readonly textMargin = 1.0;
    readonly mass = 300;
    readonly inertia = 13;

    constructor(private readonly manager: DiceManager, private readonly size = 100, private readonly labelColor = '#000000', private readonly diceColor = '#ffffff') {

        const radius = this.size * this.scaleFactor;

        const vectors = new Array<THREE.Vector3>(this.vertices.length);
        for (let i = 0; i < this.vertices.length; ++i) {
            vectors[i] = (new THREE.Vector3).fromArray(this.vertices[i]).normalize();
        }

        const chamferGeometry = this.getChamferGeometry(vectors, this.faces);
        const geometry = this.makeGeometry(chamferGeometry.vectors, chamferGeometry.faces, radius);
        const cannon_shape = this.createShape(vectors, this.faces, radius);

        this.object = new THREE.Mesh(geometry, this.getMaterials());

        this.object.receiveShadow = true;
        this.object.castShadow = true;
        this.object.userData['diceObject'] = this;
        this.body = new CANNON.Body({
            mass: this.mass,
            shape: cannon_shape,
            material: manager.diceBodyMaterial
        });
        this.body.linearDamping = 0.1;
        this.body.angularDamping = 0.1;
        this.body.position.set(0, size, 0);
        this.object.position.set(0, size, 0);
        manager.world.addBody(this.body);
    }

    readonly body: CANNON.Body;

    emulateThrow(callback: (upside: number) => void) {
        let stableCount = 0;

        const check = () => {
            if (this.isFinished()) {
                stableCount++;

                if (stableCount === 50) {
                    this.manager.world.removeEventListener('postStep', check);
                    callback(this.getUpsideValue());
                }
            } else {
                stableCount = 0;
            }

            this.manager.world.step(this.manager.world.dt);
        };

        this.manager.world.addEventListener('postStep', check);
    }

    isFinished() {
        const threshold = 1;

        const angularVelocity = this.body.angularVelocity;
        const velocity = this.body.velocity;

        return (Math.abs(angularVelocity.x) < threshold && Math.abs(angularVelocity.y) < threshold && Math.abs(angularVelocity.z) < threshold &&
            Math.abs(velocity.x) < threshold && Math.abs(velocity.y) < threshold && Math.abs(velocity.z) < threshold);
    }

    getUpsideValue() {
        const vector = new THREE.Vector3(0, this.invertUpside ? -1 : 1);
        let closest_face;
        let closest_angle = Math.PI * 2;

        const normals = this.object.geometry.getAttribute('normal').array;
        for (let i = 0; i < this.object.geometry.groups.length; ++i) {
            const face = this.object.geometry.groups[i];
            if (face.materialIndex === 0) continue;

            //Each group consists in 3 vertices of 3 elements (x, y, z) so the offset between faces in the Float32BufferAttribute is 9
            const startVertex = i * 9;
            const normal = new THREE.Vector3(normals[startVertex], normals[startVertex + 1], normals[startVertex + 2]);
            const angle = normal.clone().applyQuaternion(new THREE.Quaternion(...this.body.quaternion.toArray())).angleTo(vector);
            if (angle < closest_angle) {
                closest_angle = angle;
                closest_face = face;
            }
        }

        return (closest_face?.materialIndex ?? 0) - 1;
    }

    getCurrentVectors() {
        return {
            position: this.body.position.clone(),
            quaternion: this.body.quaternion.clone(),
            velocity: this.body.velocity.clone(),
            angularVelocity: this.body.angularVelocity.clone()
        };
    }

    setVectors(vectors: {
        position: CANNON.Vec3,
        quaternion: CANNON.Quaternion,
        velocity: CANNON.Vec3,
        angularVelocity: CANNON.Vec3,
    }) {
        this.body.position = vectors.position;
        this.body.quaternion = vectors.quaternion;
        this.body.velocity = vectors.velocity;
        this.body.angularVelocity = vectors.angularVelocity;
    }

    shiftUpperValue(toValue: number) {
        const geometry = this.object.geometry.clone();

        const fromValue = this.getUpsideValue();
        for (let i = 0, l = geometry.groups.length; i < l; ++i) {
            let materialIndex = geometry.groups[i].materialIndex ?? 0;
            if (materialIndex === 0) continue;

            materialIndex += toValue - fromValue - 1;
            while (materialIndex > this.values) materialIndex -= this.values;
            while (materialIndex < 1) materialIndex += this.values;

            geometry.groups[i].materialIndex = materialIndex + 1;
        }

        this.updateMaterialsForValue(toValue - fromValue);

        this.object.geometry = geometry;
    }

    getChamferGeometry(vectors: THREE.Vector3[], faces: number[][]) {
        const chamfer_vectors = [], chamfer_faces = [], corner_faces = new Array(vectors.length);
        for (let i = 0; i < vectors.length; ++i) corner_faces[i] = [];
        for (let i = 0; i < faces.length; ++i) {
            const ii = faces[i], fl = ii.length - 1;
            const center_point = new THREE.Vector3();
            const face = new Array(fl);
            for (let j = 0; j < fl; ++j) {
                const vv = vectors[ii[j]].clone();
                center_point.add(vv);
                corner_faces[ii[j]].push(face[j] = chamfer_vectors.push(vv) - 1);
            }
            center_point.divideScalar(fl);
            for (let j = 0; j < fl; ++j) {
                const vv = chamfer_vectors[face[j]];
                vv.subVectors(vv, center_point).multiplyScalar(this.chamfer).addVectors(vv, center_point);
            }
            face.push(ii[fl]);
            chamfer_faces.push(face);
        }
        for (let i = 0; i < faces.length - 1; ++i) {
            for (let j = i + 1; j < faces.length; ++j) {
                const pairs = [];
                let lastm = -1;
                for (let m = 0; m < faces[i].length - 1; ++m) {
                    const n = faces[j].indexOf(faces[i][m]);
                    if (n >= 0 && n < faces[j].length - 1) {
                        if (lastm >= 0 && m !== lastm + 1) pairs.unshift([i, m], [j, n]);
                        else pairs.push([i, m], [j, n]);
                        lastm = m;
                    }
                }
                if (pairs.length !== 4) continue;
                chamfer_faces.push([chamfer_faces[pairs[0][0]][pairs[0][1]],
                chamfer_faces[pairs[1][0]][pairs[1][1]],
                chamfer_faces[pairs[3][0]][pairs[3][1]],
                chamfer_faces[pairs[2][0]][pairs[2][1]], -1]);
            }
        }
        for (let i = 0; i < corner_faces.length; ++i) {
            const cf = corner_faces[i];
            const face = [cf[0]];
            let count = cf.length - 1;
            while (count) {
                for (let m = faces.length; m < chamfer_faces.length; ++m) {
                    let index = chamfer_faces[m].indexOf(face[face.length - 1]);
                    if (index >= 0 && index < 4) {
                        if (--index === -1) index = 3;
                        const next_vertex = chamfer_faces[m][index];
                        if (cf.indexOf(next_vertex) >= 0) {
                            face.push(next_vertex);
                            break;
                        }
                    }
                }
                --count;
            }
            face.push(-1);
            chamfer_faces.push(face);
        }
        return { vectors: chamfer_vectors, faces: chamfer_faces };
    }

    makeGeometry(vertices: THREE.Vector3[], faces: number[][], radius: number) {
        const geom = new THREE.BufferGeometry();

        for (let i = 0; i < vertices.length; ++i) {
            vertices[i] = vertices[i].multiplyScalar(radius);
        }

        const positions = [];
        const normals = [];
        const uvs = [];

        const cb = new THREE.Vector3();
        const ab = new THREE.Vector3();
        let materialIndex;
        let faceFirstVertexIndex = 0;

        for (let i = 0; i < faces.length; ++i) {
            const ii = faces[i], fl = ii.length - 1;
            const aa = Math.PI * 2 / fl;
            materialIndex = ii[fl] + 1;
            for (let j = 0; j < fl - 2; ++j) {

                //Vertices
                positions.push(...vertices[ii[0]].toArray());
                positions.push(...vertices[ii[j + 1]].toArray());
                positions.push(...vertices[ii[j + 2]].toArray());

                // Flat face normals
                cb.subVectors( vertices[ii[j + 2]], vertices[ii[j + 1]] );
                ab.subVectors( vertices[ii[0]], vertices[ii[j + 1]] );
                cb.cross( ab );
                cb.normalize();

                // Vertex Normals
                normals.push(...cb.toArray());
                normals.push(...cb.toArray());
                normals.push(...cb.toArray());

                //UVs
                uvs.push((Math.cos(this.af) + 1 + this.tab) / 2 / (1 + this.tab), (Math.sin(this.af) + 1 + this.tab) / 2 / (1 + this.tab));
                uvs.push((Math.cos(aa * (j + 1) + this.af) + 1 + this.tab) / 2 / (1 + this.tab), (Math.sin(aa * (j + 1) + this.af) + 1 + this.tab) / 2 / (1 + this.tab));
                uvs.push((Math.cos(aa * (j + 2) + this.af) + 1 + this.tab) / 2 / (1 + this.tab), (Math.sin(aa * (j + 2) + this.af) + 1 + this.tab) / 2 / (1 + this.tab));

            }

            //Set Group for face materials.
            const numOfVertices = (fl - 2) * 3;
            for (let i = 0; i < numOfVertices/3; i++) {
              geom.addGroup(faceFirstVertexIndex, 3, materialIndex);
              faceFirstVertexIndex += 3;
            }

        }


        geom.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        geom.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
        geom.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
        geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
        return geom;
    }

    createShape(vertices: Vector3[], faces: number[][], radius: number) {
        const cv = new Array<CANNON.Vec3>(vertices.length), cf = new Array<number[]>(faces.length);
        for (let i = 0; i < vertices.length; ++i) {
            const v = vertices[i];
            cv[i] = new CANNON.Vec3(v.x * radius, v.y * radius, v.z * radius);
        }
        for (let i = 0; i < faces.length; ++i) {
            cf[i] = faces[i].slice(0, faces[i].length - 1);
        }
        return new CANNON.ConvexPolyhedron({
            vertices: cv,
            faces: cf
        });
    }

    calculateTextureSize(approx: number) {
        return Math.max(128, Math.pow(2, Math.floor(Math.log(approx) / Math.log(2))));
    }

    createTextTexture(text: string) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const ts = this.calculateTextureSize(this.size / 2 + this.size * this.textMargin) * 2;
        canvas.width = canvas.height = ts;
        if (context) {
            context.font = ts / (1 + 2 * this.textMargin) + "pt Arial";
            context.fillStyle = this.diceColor;
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = this.labelColor;
            context.fillText(text, canvas.width / 2, canvas.height / 2);
        }
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    customTextTextureFunction: ((face: number) => THREE.Texture) | undefined;
    getMaterials() {
        const materials = [];
        for (let i = 0; i < this.faceTexts.length; ++i) {
            const texture = this.customTextTextureFunction
                          ? this.customTextTextureFunction(i)
                          : this.createTextTexture(this.faceTexts[i]);

            materials.push(new THREE.MeshPhongMaterial({
                specular: 0x172022,
                color: 0xf0f0f0,
                shininess: 40,
                flatShading: true,
                //shading: THREE.FlatShading,
                map: texture
            }));
        }
        return materials;
    }

    getObject() {
        return this.object;
    }

    private readonly object: THREE.Mesh;
    
    simulationRunning = false;
    updateMeshFromBody() {
        if (!this.simulationRunning) {
            this.object.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
            this.object.quaternion.set(this.body.quaternion.x, this.body.quaternion.y, this.body.quaternion.z, this.body.quaternion.w);
        }
    }

    updateBodyFromMesh() {
        this.body.position.set(this.object.position.x, this.object.position.y, this.object.position.z);
        this.body.quaternion.set(this.object.quaternion.x, this.object.quaternion.y, this.object.quaternion.z, this.object.quaternion.w);
    }

    resetBody() {
        this.body.vlambda = new CANNON.Vec3();
        //this.body.collisionResponse = true;
        this.body.position = new CANNON.Vec3();
        this.body.previousPosition = new CANNON.Vec3();
        this.body.initPosition = new CANNON.Vec3();
        this.body.velocity = new CANNON.Vec3();
        this.body.initVelocity = new CANNON.Vec3();
        this.body.force = new CANNON.Vec3();
        //this.body.sleepState = 0;
        //this.body.timeLastSleepy = 0;
        //this.body._wakeUpAfterNarrowphase = false;
        this.body.torque = new CANNON.Vec3();
        this.body.quaternion = new CANNON.Quaternion();
        this.body.initQuaternion = new CANNON.Quaternion();
        this.body.angularVelocity = new CANNON.Vec3();
        this.body.initAngularVelocity = new CANNON.Vec3();
        this.body.interpolatedPosition = new CANNON.Vec3();
        this.body.interpolatedQuaternion = new CANNON.Quaternion();
        this.body.inertia = new CANNON.Vec3();
        this.body.invInertia = new CANNON.Vec3();
        this.body.invInertiaWorld = new CANNON.Mat3();
        //this.body.invMassSolve = 0;
        this.body.invInertiaSolve = new CANNON.Vec3();
        this.body.invInertiaWorldSolve = new CANNON.Mat3();
        //this.body.aabb = new CANNON.AABB();
        //this.body.aabbNeedsUpdate = true;
        this.body.wlambda = new CANNON.Vec3();

        this.body.updateMassProperties();
    }

    updateMaterialsForValue(diceValue: number) {
        // empty?
    }
}
