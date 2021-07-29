import * as THREE  from "../../node_modules/three/build/three.module.js";

class DynamicMesh{
    mesh        = null;

    vertices    = [];
    indices     = [];
    normals     = [];

    _vertCount  = 0;
    _normCount  = 0;
    _idxCount   = 0;

    constructor( mat=null ){
        this.mesh           = new THREE.Mesh();
        this.mesh.material  = mat || new THREE.MeshPhongMaterial( {color:0x00ffff, side:THREE.DoubleSide } );
    }

    rebuild( nGeo=null ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( nGeo ){
            this.vertices = nGeo.vertices;
            this.indices  = nGeo.indices;
            this.normals  = nGeo.normals;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Geometry Buffers can't not be resized in ThreeJS
        // Note : Buffers themselves in WebGL can, just a limitation of the Framework.
        // Because of this, will need to recreate the Geometry Object if size is larger.
        if( this.vertices.length > this._vertCount ||
            this.indices.length > this._idxCount ||
            this.normals.length > this._normCount ){
            
            this.mesh.geometry.dispose();
            this.mesh.geometry = null;
            this._mkGeo();

            return;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let geo = this.mesh.geometry;
        geo.index.array.set( this.indices );
        geo.index.needsUpdate = true;
        
        geo.attributes.position.array.set( this.vertices );
        geo.attributes.position.needsUpdate = true;

        geo.attributes.normal.array.set( this.normals );
        geo.attributes.normal.needsUpdate = true;

        geo.computeBoundingBox();
        geo.computeBoundingSphere();
        geo.setDrawRange( 0, this.indices.length );
    }

    reset(){
        this.vertices.length    = 0;
        this.indices.length     = 0;
        this.normals.length     = 0;
        return this;
    }

    _mkGeo(){
        //----------------------------------
        // Define Geometry Object
        const bGeo = new THREE.BufferGeometry();
        bGeo.setIndex( this.indices );
        bGeo.setAttribute( "position",  new THREE.BufferAttribute( new Float32Array( this.vertices ), 3 ) );
        bGeo.setAttribute( "normal",  new THREE.BufferAttribute( new Float32Array( this.normals ), 3 ) );

        this.mesh.geometry = bGeo;

        //----------------------------------
        if( this.vertices.length > this._vertCount )    this._vertCount     = this.vertices.length;
        if( this.indices.length > this._idxCount )      this._idxCount      = this.indices.length;
        if( this.normals.length > this._normCount )     this._normCount     = this.normals.length;

        console.log( "CREATE GEO" );
    }
}

export default DynamicMesh;