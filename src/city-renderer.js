import {
  Camera,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  WireframeGeometry,
  Scene,
  WebGLRenderer,
} from "../node_modules/three/build/three.module.js";

import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

import {
  enuToGeodetic,
  geodeticToEnu,
  Viewer,
  CameraControls,
} from "../node_modules/mapillary-js/dist/mapillary.module.js";

import Global from "../src/global.js";

class CityRenderer {
  constructor() {
    this.id = "city-renderer";
    this.geoPosition = {
      lat: 42.359632323181586,
      lng: -71.06238463008704,
    };
  }

  onAdd(viewer, reference, context) {
    const { geoPosition } = this;
    this.viewer = viewer;

    const canvas = viewer.getCanvas();
    const renderer = new WebGLRenderer({
      canvas,
      context,
    });
    renderer.autoClear = false;

    const scene = new Scene();
    const camera = new Camera();
    camera.matrixAutoUpdate = false;

    const loader = new GLTFLoader();
    loader.load("../resources/BOS3D_L5/BOS3D_L5_OneMesh.gltf", (gltf) => {
      const buildings = gltf.scene.children[0];

      buildings.material = new MeshBasicMaterial({
        color: 0x000000,
        opacity: 0.5,
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });

      let wireGeometry = new WireframeGeometry(buildings.geometry.clone());
      let wireframe = new LineSegments(
        wireGeometry,
        new LineBasicMaterial({
          color: 0xffffff,
          opacity: 0.2,
          transparent: true,
        })
      );
      buildings.add(wireframe);

      const [e, n, u] = geodeticToEnu(
        geoPosition.lng,
        geoPosition.lat,
        reference.alt - 11,
        reference.lng,
        reference.lat,
        reference.alt
      );

      buildings.position.set(e, n, u);
      buildings.rotation.set(Math.PI / 2, 0, 0);

      scene.add(buildings);
    });

    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
  }

  onReference(viewer, reference) {
    /* TODO */
  }

  onRemove(viewer, context) {
    /* TODO */
  }

  render(context, viewMatrix, projectionMatrix) {
    const { camera, scene, renderer, viewer } = this;

    camera.matrix.fromArray(viewMatrix).invert();
    camera.updateMatrixWorld(true);
    camera.projectionMatrix.fromArray(projectionMatrix);

    renderer.resetState();
    renderer.render(scene, camera);
  }
}

(function main() {
  const container = document.createElement("div");
  container.classList.add("viewer");
  document.body.appendChild(container);

  const cityRenderer = new CityRenderer();
  const viewer = new Viewer({
    accessToken: Global.MAPILLARY_TOKEN,
    container,
  });
  viewer.addCustomRenderer(cityRenderer);
  viewer.moveTo("1711913058996530").catch((error) => consoler.error(error));
})();
