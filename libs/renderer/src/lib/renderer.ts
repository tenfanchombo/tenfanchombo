import { DECK_SIZE, GameService, PlayerIndex, TileIndex, TileInfo } from '@tenfanchombo/game-core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper'
import Stats from 'three/examples/jsm/libs/stats.module'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'

import { TestDice } from './dice';
import { TileInstance } from './tile-instance';
import { TilePlacementManager } from './tile-placement-manager';

const AMBIENT_LIGHT_INTENSITY = 0.3;
const TABLE_SIZE = 0.7;

export class RiichiRenderer {
    static async create(canvas: HTMLCanvasElement) {
        const renderer = new RiichiRenderer(canvas);
        await renderer.loadScene();
        return renderer;
    }

    private constructor(private readonly canvas: HTMLCanvasElement) {
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });

        this.stats = Stats();
        document.body.append(this.stats.dom);

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.VSMShadowMap;

        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

        window.addEventListener("resize", () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        })

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#111111');

        const loader = new THREE.TextureLoader();
        const texture = loader.load('assets/table.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.LinearFilter;
        const repeats = 7; // tableSize / 100;
        texture.repeat.set(repeats, repeats);

        const planeGeo = new THREE.PlaneGeometry(TABLE_SIZE, TABLE_SIZE);
        const planeMat = new THREE.MeshPhongMaterial({
            map: texture
        });

        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.receiveShadow = true;
        mesh.rotation.x = Math.PI * -.5;
        this.scene.add(mesh);

        const ambient = new THREE.AmbientLight(0xFFFFFF, AMBIENT_LIGHT_INTENSITY);
        this.scene.add(ambient);

        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.castShadow = true;
        light.position.set(1, 1, 0.5);
        this.scene.add(light);
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.bias = -0.001; // TODO: review this value. it is needed as it prevents the striping caused by self-casting shadows
        light.shadow.radius = 3;
        light.shadow.camera.near = 1;
        light.shadow.camera.far = 2;
        light.shadow.camera.left = -0.600;
        light.shadow.camera.right = 0.600;
        light.shadow.camera.top = 0.600;
        light.shadow.camera.bottom = -0.600;

        /*
        const helper = new THREE.DirectionalLightHelper(light);
        this.scene.add(helper);

        const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
        this.scene.add(cameraHelper);
        */

        const fov = 45;
        const near = 0.001;
        const far = 1000;

        this.camera = new THREE.PerspectiveCamera(fov, canvas.clientWidth / canvas.clientHeight, near, far);
        this.camera.updateProjectionMatrix();
        this.camera.position.set(0, 0.650, 0.450);

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.target.set(0, 0, 0);
        this.controls.update();

        this.moveToSeat(0);

        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        document.addEventListener('click', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            this.performRayCast();
            if (this.hoveredOverDice) {
                this.gameService?.move.rollDice();
            }
            if (this.hoveredOverTile !== -1 && this.onClickTile) {
                this.onClickTile(this.hoveredOverTile);
            }
        })

        this.render();
    }

    private dice: TestDice | undefined;
    onClickTile?: (tileIndex: TileIndex) => void;
    gameService: GameService | undefined;

    moveToSeat(seat: PlayerIndex) {
        switch (seat) {
            case 0: this.camera.position.set(0, 0.650, 0.450); break;
            case 1: this.camera.position.set(-0.450, 0.650, 0); break;
            case 2: this.camera.position.set(0, 0.650, -0.450); break;
            case 3: this.camera.position.set(0.450, 0.650, 0); break;
        }

        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    updateTile(index: number, tileInfo: TileInfo, splits: TileIndex[]) {
        this.tiles[index].update(tileInfo, splits);
    }

    updateDice(values: readonly number[]) {
        this.dice?.roll(values);
    }

    private readonly mouse = new THREE.Vector2();
    private readonly raycaster = new THREE.Raycaster();

    onMouseMove(event: MouseEvent) {
        event.preventDefault();
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }

    private tiles: TileInstance[] = [];
    private readonly stats: Stats;

    private async loadScene() {
        const tileObj = await this.objLoader.loadAsync("assets/tile.obj");
        const tileTexture = await this.textureLoader.loadAsync('assets/tiles_texture.png');
        const tileTextureNormals = await this.textureLoader.loadAsync('assets/tiles_normals.png');

        const tilePlacementManager = new TilePlacementManager();

        this.tiles = new Array(DECK_SIZE).fill(1).map((_, i) => {
            const tile = new TileInstance(i, tileObj, tileTexture, tileTextureNormals, tilePlacementManager);
            tile.addToScene(this.scene);
            return tile;
        });
        const dieMaterials = await this.mtlLoader.loadAsync("assets/die.mtl");
        dieMaterials.preload();
        this.objLoader.setMaterials(dieMaterials)
        const dieObj = await this.objLoader.loadAsync("assets/die.obj");
        this.dice = new TestDice(this.scene, this.tiles, dieObj);

        this.normalHelper = new VertexNormalsHelper(this.dice.dice[0].object.children[0], 0.0001, 0xff8000);
        // this.scene.add(this.normalHelper);
    }

    private normalHelper?: VertexNormalsHelper;

    private readonly objLoader = new OBJLoader();
    private readonly mtlLoader = new MTLLoader();
    private readonly controls: OrbitControls;
    private readonly textureLoader = new THREE.TextureLoader();
    private readonly renderer: THREE.WebGLRenderer;
    private readonly camera: THREE.PerspectiveCamera;
    private readonly scene: THREE.Scene;

    private hoveredOverDice = false;
    private hoveredOverTile: TileIndex | -1 = -1;

    private performRayCast() {
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const tiles = this.tiles.map(t => t.tile.children[0]);
        const die = this.dice?.dice.map(d => d.object.children[0]) ?? [];
        const intersection = this.raycaster.intersectObjects(tiles.concat(die));
        this.hoveredOverDice = intersection.length > 0 && die.includes(intersection[0].object);
        this.hoveredOverTile = intersection.length > 0 ? tiles.indexOf(intersection[0].object) : -1;
        this.canvas.style.cursor = (this.hoveredOverDice || this.hoveredOverTile !== -1) ? 'pointer' : '';
    }

    private render = () => {
        requestAnimationFrame(this.render);
        this.resizeRendererToDisplaySize();

        const canvas = this.renderer.domElement;
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();

        this.performRayCast();

        for (const tile of this.tiles) {
            tile.animateIfNeeded();
        }

        this.dice?.animateIfNeeded();
        this.normalHelper?.update();

        this.renderer.render(this.scene, this.camera);

        this.stats.update();
    }

    private resizeRendererToDisplaySize() {
        // TODO: what are we comparing to here?
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const needResize = this.canvas.width !== width || this.canvas.height !== height;
        if (needResize) {
            this.renderer.setSize(width, height, false);
        }
        return needResize;
    }
}
