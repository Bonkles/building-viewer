import Starter, { THREE }   from "./starter.js";
import UnlitMaterial        from "./UnlitMaterial.js";
import GltfUtil             from "./lib/GltfUtil.js";

// Center Coord of the 3D City Tile
const ORIGIN = { lon:-71.06238463008704, lat:42.359632323181586 };

// Convert LatLon to XY Position, no real relation to this mapping tool, so its not 100% perfect
// or the 3d map itself isn't to proper scale for this function to work properly.
function lonLatZoomXY( zoom, lon, lat ){
    const width     = Math.pow( 2, zoom );
    const height    = Math.pow( 2, zoom );
    const latRad    = ( lat * Math.PI ) / 180;
    const x         = ~~(( width * ( lon + 180 ) ) / 360 );
    const y         = ~~((( 1 - Math.asinh( Math.tan( latRad ) ) / Math.PI ) / 2.0 ) * height );
    return { x, y };
}

class CityView{
    // #region MAIN
    constructor( container ){
        this.marker = new THREE.Group();
        this.world  = new Starter({ 
            container,
            webgl2      : true, 
            grid        : false, 
            fullscreen  : false,
        });

        //this.world.set_camera( -55, 45, 1500 );
        this.world.set_camera( 0, 90, 1500 );

        this.world.render();
        //this.world.add( new THREE.GridHelper( 1000, 50, 0x0c610c, 0x555555 ) );
        this.world.add( this.marker );

        this.init();
    }
    // #endregion //////////////////////////////////////////////////////////

    // #region STARTUP
    async init(){
       this.loadBuildings();
       this.mkMarker();
    }

    // Load up 3D Mesh
    async loadBuildings(){
        let [ json, bin ] = await GltfUtil.fetch_files( "../resources/BOS3D_L5/BOS3D_L5_OneMesh" );
    
        let mat  = UnlitMaterial( "gray", true );
        mat.side = THREE.DoubleSide; // Disable backface culling, Triangle Winding is a lil messed up on several buildings.
    
        let mesh = GltfUtil.pull_meshes( json, bin, mat );
        this.world.add( mesh );
    }

    // Create a 3D Marker to match the position/bearing of the other views
    mkMarker(){
        const SCL       = 25;
        const H         = 400;
        const S         = 8;
        const L         = 80;
        const COL       = 0x0ff00;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let mat       = new THREE.MeshBasicMaterial( { color:COL } );
        let geo       = new THREE.BoxGeometry( S, H, S );
        let mesh      = new THREE.Mesh( geo, mat );
        mesh.position.y = H * 0.5;
        this.marker.add( mesh );

        mat       = new THREE.MeshBasicMaterial( { color:COL } );
        geo       = new THREE.BoxGeometry( S, S, L );
        mesh      = new THREE.Mesh( geo, mat );
        mesh.position.y = H;
        mesh.position.z = L * 0.5 - S * 0.5;
        this.marker.add( mesh );
    }
    // #endregion //////////////////////////////////////////////////////////

    // #region METHODS
    
    moveMarkerLonLat( lon, lat ){
        const ZOOM = 24.9;

        let o   = lonLatZoomXY( ZOOM, ORIGIN.lon, ORIGIN.lat ); // TODO, CACHE RESULTS
        let p   = lonLatZoomXY( ZOOM, lon, lat );
        let dx  = p.x - o.x;
        let dy  = p.y - o.y;

        //console.log( o );
        //console.log( p );
        //console.log( dx, dy );
        
        this.moveMarkerXY( dx, dy );
    }

    moveMarkerXY( x, y ){
        this.marker.position.x = x;
        this.marker.position.z = y;
    }

    setMarkerBearing( deg ){
        let d                   = -( deg - 180 );
        this.marker.rotation.y  = d * ( Math.PI / 180 );
    }

    // Turns a canvas into a Texture, then apply it to a plane
    addTexturePlane( canvas ){    
        //const tex  = new THREE.CanvasTexture( canvas );
        const tex = new THREE.Texture(canvas);
        tex.needsUpdate = true;

        //const ctx  = canvas.getContext( "2d" );
        const size      = 980;
        const mat       = new THREE.MeshBasicMaterial( { map : tex } );
        const geo       = new THREE.PlaneGeometry( size, size, 1, 1 );
        const mesh      = new THREE.Mesh( geo, mat );
        mesh.rotation.x = -Math.PI * 0.5; //-90 * Math.PI / 180;
        mesh.position.y = 0.01;

        this.world.add( mesh );
    }

    // #endregion //////////////////////////////////////////////////////////
}

export default CityView;

