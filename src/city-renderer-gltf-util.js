import GltfUtil from "./lib/GltfUtil.js";

import {
  Camera,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  Mesh,
  WireframeGeometry,
  Scene,
  WebGLRenderer,
} from "../node_modules/three/build/three.module.js";

import {
  enuToGeodetic,
  geodeticToEnu,
  Viewer,
  CameraControls,
  RenderPass,
} from "../node_modules/mapillary-js/dist/mapillary.module.js";

import Global from "../src/global.js";

class CityRenderer {
  constructor() {
    this.id = "city-renderer";
    this.renderPass = RenderPass.Opaque;
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

    const loadBuildings = async () => {
      const [json, bin] = await GltfUtil.fetch_files(
        "../resources/BOS3D_L5/BOS3D_L5_OneMesh"
      );
      const geometry = GltfUtil.pull_geo(json, bin)[0];
      const mesh = new Mesh(
        geometry,
        new MeshBasicMaterial({
          color: 0x000000,
          opacity: 0.5,
          transparent: true,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        })
      );
      const wireGeometry = new WireframeGeometry(mesh.geometry.clone());
      const wireframe = new LineSegments(
        wireGeometry,
        new LineBasicMaterial({
          color: 0xffffff,
          opacity: 0.2,
          transparent: true,
        })
      );
      mesh.add(wireframe);
      mesh.geometry.computeBoundingBox();
      mesh.geometry.computeBoundingSphere();

      const [e, n, u] = geodeticToEnu(
        geoPosition.lng,
        geoPosition.lat,
        reference.alt - 11,
        reference.lng,
        reference.lat,
        reference.alt
      );
      mesh.position.set(e, n, u);
      mesh.rotation.set(Math.PI / 2, 0, 0);

      scene.add(mesh);
    };

    loadBuildings();

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

  render(view, viewMatrix, projMatrix) {
    const { camera, scene, renderer, viewer } = this;

    this.camera.matrix.fromArray(viewMatrix).invert();
    this.camera.updateMatrixWorld(true);
    this.camera.projectionMatrix.fromArray(projMatrix);

    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
  }
}

(function main() {
  const container = document.createElement("div");
  container.classList.add("viewer");
  document.body.appendChild(container);

  const bostonBuildingRenderer = new CityRenderer();
  const viewer = new Viewer({
    accessToken: Global.MAPILLARY_TOKEN,
    container,
    cameraControls: CameraControls.Street,
  });
  viewer.addCustomRenderer(bostonBuildingRenderer);
  viewer.moveTo("1711913058996530").catch((error) => consoler.error(error));
})();
