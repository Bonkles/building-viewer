import {
    enuToGeodetic,
    geodeticToEnu,
    Viewer,
    CameraControls
} from "../node_modules/mapillary-js/dist/mapillary.module.js";

import {
  AmbientLight,
  AnimationMixer,
  Camera,
  Clock,
  PointLight,
  Scene,
  WebGLRenderer,
} from "../node_modules/three/build/three.module.js";

import { GLTFLoader }     from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { ColladaLoader }  from "../node_modules/three/examples/jsm/loaders/ColladaLoader.js";
import UnlitMaterial      from "./UnlitMaterial.js";

  class BostonBuildingRenderer {
    constructor() {
      this.id = "boston-building-renderer";
      this.geoPosition = {
        lat: 42.3605444,
        lng: -71.0644646,
        alt: -15.637,
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

      const ambientLight = new AmbientLight(0xffffff, 0.2);
      scene.add(ambientLight);

      const pointLight = new PointLight(0xffffff, 0.8);
      camera.add(pointLight);
      scene.add(camera);

      const clock = new Clock();
      const loader = new GLTFLoader();
      loader.load(
        // "../resources/collada/boston-m4/BOS3D_M4_Buildings_20180825.gltf",
        "../resources/collada/boston-l5/BOS3D_L5_Buildings_20180825.gltf",
        (gltf) => {
          const buildings = gltf.scene.children[ 0 ]; // Skip Group Object, Get Root 3D Object

          //#region Replace Material for all the meshes
          // TODO: Better to create recursion to make sure to get all meshes, but this
          // file seems to follow the pattern of each Object3D has 3 Mesh Children          
          let o, m, meshCount = 0, buildCount=0;
          let mat = UnlitMaterial( "cyan", true ); // Need to use lowpoly mode, mesh doesn't have no
          for( o of buildings.children ){
            if( o.type != "Object3D" ) continue; // There is a Line Object that I dont want to override.
            
            buildCount++;
            for( m of o.children ){
              if( m.type != "mesh" )
              m.material = mat;
              meshCount++;
            }
          }
          console.log( `Total Buildings ${buildCount}, Total Meshes : ${meshCount}` );
          //#endregion ////////////////////////////////////////////////////


//        const animations = buildings.animations;

          const [e, n, u] = geodeticToEnu(
            geoPosition.lng,
            geoPosition.lat,
            geoPosition.alt,
            reference.lng,
            reference.lat,
            reference.alt
          );
          
          buildings.position.set(e, n, u);
          // buildings.position.set(0, 0, 0);
          // buildings.rotation.set(Math.PI/2, 0, 0 );
          buildings.rotation.set( 0, 0, 0 ); // Root 3D Object already has Rotation set to make Z up, reset it so Y is up.

          scene.add(buildings);

//          const mixer = new AnimationMixer(buildings);
//          mixer.clipAction(animations[0]).play();
//          this.mixer = mixer;
        }
      );

      this.camera = camera;
      this.clock = clock;
      this.scene = scene;
      this.renderer = renderer;
    }

    onReference(viewer, reference) {
      // needs to be implemented
    }

    onRemove(viewer, context) {
      // needs to be implemented
    }

    render(context, viewMatrix, projectionMatrix) {
      const { camera, clock, scene, renderer, viewer } = this;

      const delta = clock.getDelta();

      camera.matrix.fromArray(viewMatrix).invert();
      camera.updateMatrixWorld(true);
      camera.projectionMatrix.fromArray(projectionMatrix);

      renderer.resetState();
      renderer.render(scene, camera);

      viewer.triggerRerender();
    }
  }

  function init() {
    const container = document.createElement("div");
    container.classList.add("viewer");
    document.body.appendChild(container);

    const viewer = new Viewer({
      apiClient: "QjI1NnU0aG5FZFZISE56U3R5aWN4ZzpkYzg0NzE3MDA0YTRhZjlh",
      component: {
        cover: false,
      },
      container,
    });

    const bostonBuildingRenderer = new BostonBuildingRenderer();
    viewer.addCustomRenderer(bostonBuildingRenderer);

    viewer
      .setCameraControls(CameraControls.Earth);

    viewer
      // .moveTo("xzdejInp2EaplnRoDVjJzA")
      // .moveTo("3WLVippJy93Mb5MSHFupgQ")
      .moveTo("k_cHxfn6A9a5A4WSzVfzjg")
      .catch((error) => consoler.error(error));
  }

  init();
