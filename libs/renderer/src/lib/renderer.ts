import { DECK_SIZE, PlayerIndex, TileIndex, TileInfo } from '@tenfanchombo/game-core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { TestDice } from './dice';
import { TileInstance } from './tile-instance';

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

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

        window.addEventListener("resize", () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        })

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#111111');

        const planeSize = 700;
        const loader = new THREE.TextureLoader();
        const texture = loader.load('assets/table.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = planeSize / 100;
        texture.repeat.set(repeats, repeats);

        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMat = new THREE.MeshPhongMaterial({
            map: texture
        });

        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.receiveShadow = true;
        mesh.rotation.x = Math.PI * -.5;
        this.scene.add(mesh);

        const tableGeometry = new THREE.BoxGeometry(700, 10, 700);
        const material = new THREE.MeshPhongMaterial({ color: 0x4D8F00 });

        const table = new THREE.Mesh(tableGeometry, material);
        table.position.z = 0;
        table.position.y = 0;
        table.receiveShadow = true;
        //scene.add(table);


        /*
                const light = new THREE.DirectionalLight(0xFFFFFF, 1);
                // light.position.set(100, 800, 200);
                light.position.set(200, 200, 100);
                light.castShadow = true;
        
                // Set up shadow properties for the light
                light.shadow.mapSize.width = 512; // default
                light.shadow.mapSize.height = 512; // default
                light.shadow.camera.near = 0.5; // default
                light.shadow.camera.far = 500000; // default
                scene.add(light);
        
                const helper = new THREE.CameraHelper( light.shadow.camera );
                scene.add( helper )
        */

        const ambient = new THREE.AmbientLight(0xFFFFFF, 0.2);
        this.scene.add(ambient);

        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.castShadow = true;
        // light.position.set(0, 10, 0);
        light.position.set(200, 200, 100);
        light.target.position.set(-4, 0, -4);
        this.scene.add(light);
        this.scene.add(light.target);
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.shadow.bias = -0.01; // TODO: review this value. it is needed as it prevents the striping caused by self-casting shadows
        light.shadow.camera.far = 1000;
        light.shadow.camera.left = -600;
        light.shadow.camera.right = 600;
        light.shadow.camera.top = -600;
        light.shadow.camera.bottom = 600;

        /*
        const helper = new THREE.DirectionalLightHelper(light);
        this.scene.add(helper);

        const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
        this.scene.add(cameraHelper);
        */

        const fov = 45;
        const near = 0.1;
        const far = 100000000;

        this.camera = new THREE.PerspectiveCamera(fov, canvas.clientWidth / canvas.clientHeight, near, far);
        this.camera.updateProjectionMatrix();
        this.camera.position.set(0, 650, 450);

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.target.set(0, 0, 0);
        this.controls.update();

        this.moveToSeat(0);

        this.render();
    }

    private dice: TestDice | undefined;

    moveToSeat(seat: PlayerIndex) {
        // this.controls.reset();

        // this.controls.set
        switch (seat) {
            case 0: this.camera.position.set(0, 650, 450); break;
            case 1: this.camera.position.set(-450, 650, 0); break;
            case 2: this.camera.position.set(0, 650, -450); break;
            case 3: this.camera.position.set(450, 650, 0); break;
        }
        
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
/*
        this.camera.position.set(0, 650, 450);
        this.camera.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), seat * Math.PI / -2);
        this.camera.updateProjectionMatrix();

        this.controls.target.set(0, 0, 0);
        this.controls.update();*/
    }

    updateTile(index: number, tileInfo: TileInfo, splits: TileIndex[]) {
        this.tiles[index].update(tileInfo, splits);
    }

    updateDice(values: readonly number[]) {
        this.dice?.roll(values);
    }

    private tiles: TileInstance[] = [];

    private async loadScene() {
        const tileObj = await this.objLoader.loadAsync("assets/tile.obj");
        const tileTexture = await this.textureLoader.loadAsync('assets/tiles_texture.png');
        const tileTextureNormals = await this.textureLoader.loadAsync('assets/tiles_normals.png');

        this.tiles = new Array(DECK_SIZE).fill(1).map((_, i) => {
            const tile = new TileInstance(i, tileObj, tileTexture, tileTextureNormals);
            tile.addToScene(this.scene);
            return tile;
        });
        const dieMaterials = await this.mtlLoader.loadAsync("assets/die.mtl");
        dieMaterials.preload();
        this.objLoader.setMaterials(dieMaterials)
        const dieObj = await this.objLoader.loadAsync("assets/die.obj");
        this.dice = new TestDice(this.scene, this.tiles, dieObj);
    }

    private readonly objLoader = new OBJLoader();
    private readonly mtlLoader = new MTLLoader();
    private readonly controls: OrbitControls;
    private readonly textureLoader = new THREE.TextureLoader();
    private readonly renderer: THREE.WebGLRenderer;
    private readonly camera: THREE.PerspectiveCamera;
    private readonly scene: THREE.Scene;

    private render = () => {
        this.resizeRendererToDisplaySize();

        const canvas = this.renderer.domElement;
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();

        for (const tile of this.tiles) {
            tile.animateIfNeeded();
        }

        this.dice?.animateIfNeeded();

        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(this.render);
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


