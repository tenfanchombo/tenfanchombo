import { TileKind, tileKind, tileValue } from '@tenfanchombo/common';
import { TileIndex, TileInfo, TilePosition, WALL_SIZE } from '@tenfanchombo/game-core';
import * as THREE from 'three';

const TILE_HEIGHT = 26;
const TILE_WIDTH  = 19;
const TILE_DEPTH  = 16;

const TILE_HEIGHT_2 = TILE_HEIGHT / 2;
const TILE_WIDTH_2  = TILE_WIDTH  / 2;
const TILE_DEPTH_2  = TILE_DEPTH  / 2;

export class TileInstace {
    constructor(tile: THREE.Group, texture: THREE.Texture, normalMap: THREE.Texture) {
        this.tile = tile.clone();
        this.texture = texture.clone();
        this.normalMap = normalMap.clone();

        this.texture.magFilter = THREE.LinearFilter;
        this.normalMap.magFilter = THREE.LinearFilter;
        this.texture.repeat.set(.1, .25);
        this.normalMap.repeat.set(.1, .25);

        this.texture.offset.set(.9, 0);
        this.normalMap.offset.set(.9, 0);

        this.tile.castShadow = true;
        this.tile.receiveShadow = true;
        this.tile.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;

                const material = new THREE.MeshPhongMaterial({
                    color: 0xFFFFFF,
                    vertexColors: true,
                    map: this.texture,
                    normalMap: this.normalMap,
                    // normalScale: new THREE.Vector2(1, 1),
                });

                material.onBeforeCompile = function (shader) {
                    const custom_map_fragment = THREE.ShaderChunk.map_fragment.replace(
                        `diffuseColor *= sampledDiffuseColor;`,
                        `diffuseColor = vec4( mix( diffuse, sampledDiffuseColor.rgb, sampledDiffuseColor.a ), opacity );`
                    );

                    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', custom_map_fragment);
                };

                child.material = material;
                child.castShadow = true;
            }
        });

    }

    private readonly tile: THREE.Group;
    private readonly texture: THREE.Texture;
    private readonly normalMap: THREE.Texture

    update(info: TileInfo, tileIndex: TileIndex, wallSplits: TileIndex[]) {
        const m = new THREE.Matrix4();
        m.identity();
        m.multiply(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), (Math.PI / -2) * info.seat));
        switch (info.position) {
            case TilePosition.Wall: {
                const y = info.index % 2 ? TILE_DEPTH_2 + TILE_DEPTH : TILE_DEPTH_2;
                let x = (Math.ceil(info.index / -2) + 8) * TILE_WIDTH;
                const sideStart = Math.floor(tileIndex / WALL_SIZE) * WALL_SIZE;
                const sideEnd = sideStart + WALL_SIZE;
                const splitsOnThisSide = wallSplits.filter(ti => ti >= sideStart && ti <= sideEnd);
                
                if (splitsOnThisSide.length > 1) {
                    x += TILE_WIDTH_2;
                }
                const afterSplits = splitsOnThisSide.filter(ti => ti < tileIndex).length;
                x += afterSplits * -TILE_WIDTH_2;

                m.multiply(new THREE.Matrix4().makeTranslation(x, y, 200));
                if (info.tile === null) {
                    m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
                } else {
                    m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / -2));
                }
                break;
            }
            case TilePosition.Hand: {
                m.multiply(new THREE.Matrix4().makeTranslation((info.index - 8) * TILE_WIDTH, TILE_HEIGHT_2, 250));
                break;
            }
            case TilePosition.Discards: {
                m.multiply(new THREE.Matrix4().makeTranslation(Math.floor(TILE_WIDTH * ((info.index % 6) - 2.5)), TILE_DEPTH_2, Math.floor(TILE_HEIGHT * (2.75 + Math.floor(info.index / 6)))));
                m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / -2));
                break;
            }
        }

        this.tile.matrix.identity().decompose(this.tile.position, this.tile.quaternion, this.tile.scale);
        this.tile.applyMatrix4(m);
        // m.tra

        // this.tile.matrix.set()
        // tile2.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), (Math.PI / 2) * x);
        // tile2.translateZ(200);
        // tile2.translateX((i - 8.5) * 19);
        // tile2.position.y = 8.2 + 16;
        // tile2.rotateX(Math.PI / -2);

        if (info.tile === null) {
            this.texture.offset.set(.9, 0);
            this.normalMap.offset.set(.9, 0);
        } else {
            const v = (tileValue(info.tile) - 1) / 10;
            const k = ({
                [TileKind.Man]: .75,
                [TileKind.Pin]: .5,
                [TileKind.Sou]: .25,
                [TileKind.Honor]: 0,
            } as Record<TileKind, number>)[tileKind(info.tile)];
            this.texture.offset.set(v, k);
            this.normalMap.offset.set(v, k);
        }

        // bumpTexture.offset.set((i % 10) * .1, x * .25);
        // bumpTexture.repeat.set(.1, .25);
        // text.offset.set((i % 10) * .1, x * .25);
        // text.repeat.set(.1, .25);
    }

    addToScene(scene: THREE.Scene) {
        scene.add(this.tile);
    }
}
