import * as THREE from "three";

/*
  This class computes "surface IDs" for a given mesh.

  A "surface" is defined as a set of triangles that share vertices.
  
  Inspired by Ian MacLarty, see:
    https://twitter.com/ianmaclarty/status/1499494878908403712
*/
class FindSurfaces {

    // This identifier, must be globally unique for each surface
    // across all geometry rendered on screen
    private surfaceId = 0;

    /*
     * Returns the surface Ids as a Float32Array that can be inserted as a vertex attribute
     */
    getSurfaceIdAttribute(mesh: THREE.Mesh) {

        const bufferGeometry = mesh.geometry;
        const numVertices = bufferGeometry.attributes["position"].count;
        const vertexIdToSurfaceId = this._generateSurfaceIds(mesh);

        const colors = [];
        for (let i = 0; i < numVertices; i++) {
            const vertexId = i;
            const surfaceId = vertexIdToSurfaceId[vertexId];
            // console.log({ surfaceId });
            colors.push(surfaceId ?? i, 0, 0, 1);
        }

        const colorsTypedArray = new Float32Array(colors);
        return colorsTypedArray;
    }

    /*
     * Returns a `vertexIdToSurfaceId` map
     * given a vertex, returns the surfaceId
     */
    _generateSurfaceIds(mesh: THREE.Mesh): Record<number, number> {
        const bufferGeometry = mesh.geometry;
        const numVertices = bufferGeometry.attributes["position"].count;
        if (bufferGeometry.index == null) {
            return {};
        }
        const numIndices = bufferGeometry.index.count;
        const indexBuffer = bufferGeometry.index.array;
        const vertexBuffer = bufferGeometry.attributes["position"].array;

        // For each vertex, search all its neighbors
        const vertexMap: Record<number, number[]> = {};
        for (let i = 0; i < numIndices; i += 3) {
            const i1 = indexBuffer[i + 0];
            const i2 = indexBuffer[i + 1];
            const i3 = indexBuffer[i + 2];

            add(i1, i2);
            add(i1, i3);
            add(i2, i3);
        }
        function add(a: number, b: number) {
            if (vertexMap[a] == undefined) vertexMap[a] = [];
            if (vertexMap[b] == undefined) vertexMap[b] = [];

            if (vertexMap[a].indexOf(b) == -1) vertexMap[a].push(b);
            if (vertexMap[b].indexOf(a) == -1) vertexMap[b].push(a);
        }

        // Find cycles
        const frontierNodes = Object.keys(vertexMap).map((v) => Number(v));
        const exploredNodes: Record<number, boolean> = {};
        const vertexIdToSurfaceId: Record<number, number> = {};

        while (frontierNodes.length > 0) {
            const node = frontierNodes.pop();
            if (node === undefined || exploredNodes[node]) continue;

            // Get all neighbors recursively
            const surfaceVertices = getNeighborsNonRecursive(node);
            // Mark them as explored
            for (const v of surfaceVertices) {
                exploredNodes[v] = true;
                vertexIdToSurfaceId[v] = this.surfaceId;
            }

            this.surfaceId += 1;
        }
        function getNeighbors(node: number, explored: Record<number, boolean>) {
            const neighbors = vertexMap[node];
            let result = [node];
            explored[node] = true;

            for (const n of neighbors) {
                if (explored[n]) continue;
                explored[n] = true;
                const newNeighbors = getNeighbors(n, explored);
                result = result.concat(newNeighbors);
            }

            return result;
        }

        function getNeighborsNonRecursive(node: number) {
            const frontier = [node];
            const explored: Record<number, boolean> = {};
            const result = [];

            while (frontier.length > 0) {
                const currentNode = frontier.pop();
                if (currentNode === undefined || explored[currentNode]) continue;
                const neighbors = vertexMap[currentNode];
                result.push(currentNode);

                explored[currentNode] = true;

                for (const n of neighbors) {
                    if (!explored[n]) {
                        frontier.push(n);
                    }
                }
            }

            return result;
        }

        return vertexIdToSurfaceId;
    }
}

export default FindSurfaces;

export function getSurfaceIdMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            maxSurfaceId: { value: 1 },
        },
        vertexShader: getVertexShader(),
        fragmentShader: getFragmentShader(),
        vertexColors: true,
    });
}

function getVertexShader() {
    return `
  varying vec2 v_uv;
  varying vec4 vColor;
  in vec4 surfaceIdColor;

  void main() {
     v_uv = uv;
     vColor = surfaceIdColor;

     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `;
}

function getFragmentShader() {
    return `
  varying vec2 v_uv;
  varying vec4 vColor;
  uniform float maxSurfaceId;

  void main() {
    // Normalize the surfaceId when writing to texture
    // Surface ID needs rounding as precision can be lost in perspective correct interpolation 
    // - see https://github.com/OmarShehata/webgl-outlines/issues/9 for other solutions eg. flat interpolation.
    gl_FragColor = vec4(round(vColor.r) / maxSurfaceId, round(vColor.g) / maxSurfaceId, round(vColor.b) / maxSurfaceId, 1.0);
  }
  `;
}
