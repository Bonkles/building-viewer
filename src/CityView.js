import Starter, { THREE }   from "./starter.js";
import UnlitMaterial        from "./UnlitMaterial.js";
import GltfUtil             from "./lib/GltfUtil.js";
import PointsMesh           from "./lib/PointsMesh.js";

// Center Coord of the 3D City Tile
const ORIGIN = { lng:-71.06238463008704, lat:42.359632323181586 };

// Convert LatLng to XY Position, no real relation to this mapping tool, so its not 100% perfect
// or the 3d map itself isn't to proper scale for this function to work properly.
function lngLatZoomXY( zoom, lng, lat ){
    const width     = Math.pow( 2, zoom );
    const height    = Math.pow( 2, zoom );
    const latRad    = ( lat * Math.PI ) / 180;
    const x         = ~~(( width * ( lng + 180 ) ) / 360 );
    const y         = ~~((( 1 - Math.asinh( Math.tan( latRad ) ) / Math.PI ) / 2.0 ) * height );
    return { x, y };
}

class CityView{
    // #region MAIN
    constructor( container, fullScreen=false ){
        this.geo    = null; // Geometry Buffer of the City;

        this.marker = new THREE.Group();
        this.world  = new Starter({ 
            container,
            webgl2      : true, 
            grid        : false, 
            fullscreen  : fullScreen,
        });

        //this.world.set_camera( -55, 45, 1500 );
        this.world.set_camera( 0, 90, 1900 );

        this.world.render();
        //this.world.add( new THREE.GridHelper( 1000, 50, 0x0c610c, 0x555555 ) );
        this.world.add( this.marker );

        //this.init();
    }
    // #endregion //////////////////////////////////////////////////////////

    // #region STARTUP
    async init(){
        await this.loadBuildings();
        this.mkMarker();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Axis Reference Points
        const D = 450;
        const H = 250;
        const S = 1200;
        const P = 2;
        let pnt = new PointsMesh( 5 );

        pnt.add( [ 0,H,D ],     0xff0000, S, P );
        pnt.add( [ D,H,0 ],     0x00ff00, S, P );
        pnt.add( [ 0,H,-D ],    0xffffff, S, P );
        pnt.add( [ -D,H,0 ],    0x00ffff, S, P );

        this.world.add( pnt.mesh );
    }

    // Load up 3D Mesh
    async loadBuildings(){
        let [ json, bin ] = await GltfUtil.fetch_files( "../resources/BOS3D_L5/BOS3D_L5_OneMesh" );
    
        let mat  = UnlitMaterial( "gray", true );
        mat.side = THREE.DoubleSide; // Disable backface culling, Triangle Winding is a lil messed up on several buildings.
        
        //let mesh = GltfUtil.pull_meshes( json, bin, mat );

        // Build mesh manually instead, want ot make Geometry available publically for reuse
        let geo     = GltfUtil.pull_geo( json, bin )[ 0 ];
        let mesh    = new THREE.Mesh( geo, mat );
        mesh.name   = geo.name;

        this.world.add( mesh );
        this.geo = geo;         // Save it so it can be used by another renderer
    }

    // Create a 3D Marker to match the position/bearing of the other views
    mkMarker(){
        // eslint-disable-next-line no-unused-vars
        const CSCL      = 70;
        const SCL       = 25;
        const H         = 400;
        const S         = 8;
        const L         = 100;
        const COL       = 0x0ffff;

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

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        mesh = Starter.facedCube();
        mesh.position.y = H;
        mesh.scale.set( CSCL, CSCL, CSCL );
        this.marker.add( mesh );
    }
    // #endregion //////////////////////////////////////////////////////////

    // #region METHODS
    
    getPosFromLngLat( lng, lat ){
        const ZOOM = 24.9;

        let o   = lngLatZoomXY( ZOOM, ORIGIN.lng, ORIGIN.lat ); // TODO, CACHE RESULTS
        let p   = lngLatZoomXY( ZOOM, lng, lat );
        let dx  = p.x - o.x;
        let dy  = p.y - o.y;

        //console.log( o );
        //console.log( p );
        //console.log( dx, dy );

        return [ dx, dy ];
    }

    /** Convert Mapillary Bearing angle into Y rotation */
    getBearing( deg ){
        let d = -( deg - 180 );
        return d * ( Math.PI / 180 ); // toRadians
    }

    moveMarkerLngLat( lng, lat ){
        //const ZOOM = 24.9;
        //let o   = lngLatZoomXY( ZOOM, ORIGIN.lng, ORIGIN.lat ); // TODO, CACHE RESULTS
        //let p   = lngLatZoomXY( ZOOM, lng, lat );
        //let dx  = p.x - o.x;
        //let dy  = p.y - o.y;

        let pos = this.getPosFromLngLat( lng, lat );
        this.moveMarkerXY( pos[ 0 ], pos[ 1 ] );
    }

    moveMarkerXY( x, y ){
        this.marker.position.x = x;
        this.marker.position.z = y;
    }

    setMarkerBearing( deg ){
        //let d                   = -( deg - 180 );
        //this.marker.rotation.y  = d * ( Math.PI / 180 );
        this.marker.rotation.y = this.getBearing( deg );
    }

    getMarkerRotation(){ return this.marker.rotation; }

    getOriginLngLat(){ return ORIGIN; }

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
export { THREE };