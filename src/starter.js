import * as THREE        from "../node_modules/three/build/three.module.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";

// #region STARTUP
const mod_path = import.meta.url.substring( 0, import.meta.url.lastIndexOf("/") + 1 );
const css_path = mod_path + "starter.css";
const css_link = `<link href="${css_path}" rel="stylesheet" type="text/css">`;

(function(){
	let link    = document.createElement( "link" );
	link.rel	= "stylesheet";
	link.type	= "text/css";
	link.media	= "all";
	link.href	= css_path;
	document.getElementsByTagName( "head" )[0].appendChild( link );
})();
// #endregion /////////////////////////////////////////////////////////////////////////


// Boiler Plate Starter for ThreeJS
class Starter{
	// #region MAIN
	scene			= null;
	camera			= null;
	renderer		= null;
	orbit			= null;
	render_bind		= this.render.bind( this );

	constructor( config={} ){ // { webgl2:true, grid:true }
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// MAIN
		this.scene				= new THREE.Scene();
		this.camera				= new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
		this.camera.position.set( 0, 10, 20 );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// LIGHTING
		let light = new THREE.DirectionalLight( 0xffffff, 0.8 );
		light.position.set( 4, 10, 1 );

		this.scene.add( light );
		this.scene.add( new THREE.AmbientLight( 0x404040 ) );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // RENDERER
        let options = { antialias:true, alpha:true };
        if( config.webgl2 ){
            let canvas      = document.createElement( "canvas" );
            options.canvas  = canvas;
            options.context = canvas.getContext( "webgl2" );
        }

        this.renderer = new THREE.WebGLRenderer( options );
        this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setClearColor( 0x3a3a3a, 1 );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( this.renderer.domElement );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// MISC
		this.orbit = new OrbitControls( this.camera, this.renderer.domElement );
        if( config.grid ) this.scene.add( new THREE.GridHelper( 20, 20, 0x0c610c, 0x444444 ) );
	}

	render(){
		requestAnimationFrame( this.render_bind );
		this.renderer.render( this.scene, this.camera );
	}
	// #endregion ////////////////////////////////////////////////////////////////////////////////////////

	// #region METHODS
	add( o ){ this.scene.add( o ); return this; }
	remove( o ){ this.scene.remove( o ); return this; }

	set_camera( lon, lat, radius ){
		let phi 	= ( 90 - lat ) * Math.PI / 180,
			theta 	= ( lon + 180 ) * Math.PI / 180;

		this.camera.position.set(
			-(radius * Math.sin( phi ) * Math.sin(theta)),
			radius * Math.cos( phi ),
			-(radius * Math.sin( phi ) * Math.cos(theta))
		);

		this.orbit.update();
		return this;
	}
	// #endregion ////////////////////////////////////////////////////////////////////////////////////////

	static ImgBlobPromise( blob ){
		let img 		= new Image();
		img.crossOrigin	= "anonymous";
		img.src 		= window.URL.createObjectURL( blob );
		return new Promise( ( resolve, reject )=>{
			img.onload	= _ => resolve( img );
			img.onerror	= reject;
		});
	}
}

export default Starter;
export { THREE };