import earcut   from "./earcut.js";
import GeoUtil  from "../../node_modules/oito/dist/geometry/Util.js";
import Vec3     from "../../node_modules/oito/dist/Vec3.js";

class Earcut{

    static getFaces3D( flatPoints, holeIdxAry ){
        // Easier to work with if the starting indices for the holes are in order.
        holeIdxAry.sort();    
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // earcut works better with 2D points, so convert 3D Points
        // into 2D to compute the Triangle Indices
        let ary2D   = this._gen3Dto2D( flatPoints );
        let faces   = earcut( ary2D, holeIdxAry, 2 ); // 2D mode

        if( !faces || faces.length == 0 ){
            console.log( "Earcut can not created indices" );
            return null;
        }

        return faces;
    }

    static extrude3D( flatPoints, holeIdxAry, extrudeDir=[0,1,0] ){
        let faces = this.getFaces3D( flatPoints, holeIdxAry );
        if( !faces ) return null; 

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const geo = {  // GeoUtil.newGeo();
            indices  : faces,
            vertices : flatPoints,
            normals  : [],
        };

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~     
        // Extude all the edge loops available
        let end     = geo.vertices.length;  // Save End index of the starting vert loop
        let prevIdx = 0;                    // Starting Vertex Index for Edge Loop 
        holeIdxAry.push( end/3 );           // Turn Hole Index to a Edge loop boundarys by adding final Vertex Index
        
        for( let i of holeIdxAry ){
            this._extrude( geo, prevIdx, i, extrudeDir );
            prevIdx = i;    // For next Edge, start at this index
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Vec3.bufMap( geo.vertices, v=>v.add( extrudeDir ), 0, end );
        GeoUtil.appendTriangleNormals( geo );

        return geo;
    }

    static _gen3Dto2D( flatAry ){
        let i, ary = [];
        
        for( i=0; i < flatAry.length; i+=3 ){
            ary.push( flatAry[ i ], flatAry[ i+2 ] );
        }

        return ary;
    }

    static _extrude( geo, idxA, idxB, dir ){
        let idx  = geo.vertices.length / 3; // Starting Index for new vertices.
        let iTop = [];
        let iBot = [];
        let v    = new Vec3();
        let i;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Two new Edge loops out of the Edge Loop Passed in
        for( i=idxA; i < idxB; i++ ){
            v   .fromBuf( geo.vertices, i*3 )   // Read Vert From Buffer
                .pushTo( geo.vertices )         // Add Copy back as Bottom Wall Vertex
                .add( dir )                     // Shift point to extude direction
                .pushTo( geo.vertices );        // Add Extrude point back as Top Wall Vertex

            iBot.push( idx++ );                 // Save Index of both Edge Loops
            iTop.push( idx++ );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Generate Face indices that stitch together the 2 new edge loops.
        let end = iTop.length;
        let ii, a, b, c, d;
        for( i=0; i < end; i++ ){
            ii  = ( i + 1 ) % end;
            a   = iTop[ i ];
            b   = iBot[ i ];
            c   = iBot[ ii ];
            d   = iTop[ ii ];
            geo.indices.push( a, b, c, c, d, a );
        }
    }

}

export default Earcut;