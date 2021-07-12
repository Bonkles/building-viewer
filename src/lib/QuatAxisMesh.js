import * as THREE from "../../node_modules/three/build/three.module.js";

function QuatAxisMesh(){
    const mat  = initMaterial();
    const geo  = new THREE.BoxGeometry( 1, 1, 1 );
    return new THREE.Mesh( geo, mat );
}

function initMaterial(){
    let mat = new THREE.ShaderMaterial({
        transparent    : true,

        uniforms : {
            zPos      : { type :'float', value:-5 },
            ndcOffset : { type :'vec2', value:[0, 0] },
            cameraPos : { type :'vec3', value:new Float32Array( [0,0,3] ) },
            quat      : { type :'vec4', value:new Float32Array( [0,0,0,1] ) },
        },
        
        vertexShader : `
        uniform float zPos;
        uniform vec2 ndcOffset;
        varying vec3 frag_lpos; // Fragment Local Space Position

        //varying vec3 frag_wpos; // Fragment World Space Position
        //varying vec3 frag_norm; // Fragment Normal
        //varying vec2 frag_uv;   // Fragment UV Coord
        
        void main() {
            vec4 wpos = vec4( position + vec3( 0.0, 0.0, zPos ), 1.0 ); // modelMatrix * 

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            frag_lpos   = position.xyz;
            //frag_wpos   = wpos.xyz;
            //frag_norm   = normalMatrix * normal;
            //frag_uv     = uv;

            gl_Position = projectionMatrix * wpos; // viewMatrix
            
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // SCREEN SPACE-ISH 
            gl_Position /= gl_Position.w;   // Convert to NDC
            gl_Position.xy += ndcOffset;    // Move things in NDC Space
        }`,
        
        fragmentShader	: `
        uniform vec3 cameraPos;
        uniform vec4 quat;

        varying vec3 frag_lpos;
        //varying vec3 frag_wpos;
        //varying vec3 frag_norm;
        //varying vec2 frag_uv;

        //-------------------------

        // QUATERNIONS
        vec3 quat_mul_vec3( vec4 q, vec3 v ){ return v + (2.0 * cross(q.xyz, cross(q.xyz, v) + (q.w * v))); }
        
        // If quat is normalized, can use conjugate in place of invert
        vec4 quat_conjugate( vec4 q ){ return vec4( -q.xyz, q.w ); }

        //-------------------------

        float sdSphere( vec3 p, float s ){ return length(p)-s; }
        float sdCapsule( vec3 p, vec3 a, vec3 b, float r ){
            vec3 pa = p - a, ba = b - a;
            float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
            return length( pa - ba*h ) - r;
        }

        //-------------------------
        // STATIC FUNCTIONS
        float map_func( vec3 p );  // Forward Decoration

        // GOOD QUALITY, BAD PERFORMANCE WHEN VERY CLOSE : TRIES 60, MIN 0.001
        // MEDIUM QUALITY, BETTER PERFORMANCE CLOSE BY   : TRIES 30, MIN 0.005
        const int   MARCH_TRIES     = 30;       // How many attempt to march ray
        const float MARCH_EPSILON   = 0.005;    // Min Distance to SDF Surface
        const float MARCH_MAX_DIST  = 20.0;     // Max Distance to Travel on March
        const float MARCH_START     = 0.0;      // Starting Distance for Ro Marching
        struct SDFResult{
            vec3   hit;
            float  ao;
            int    id;
        } SR;

        bool ray_march( vec3 ro, vec3 rd ){
            float d     = MARCH_START;  // How much distance on the ray traveled
            float rng   = 0.0;          // Distance Range to next closets object
            for( int i = 0; i < MARCH_TRIES && d < MARCH_MAX_DIST; i++ ){
                rng = map_func( ro + rd * d );  // distance to the closets object
                
                //if( rng <= MARCH_EPSILON ){
                //if( abs( rng ) <= MARCH_EPSILON ){ // Help Fix some artifacts
                if( abs( rng ) <= ( MARCH_EPSILON * d ) ){ // spend less time trying to detail long distance pixels. 
                    SR.hit = ro + rd * d;
                    //SR.ao      = 1.0 - float( i ) / float( MARCH_TRIES - 1 );
                    SR.ao      = 1.0 - d / MARCH_MAX_DIST;
                    return true;
                }
                d += rng;   // Add save distance for the next check.
            }
            return false;
        }

        // OTHER VERSION, COMPILER'S OPTIMIZATION MIGHT CAUSE ISSUES WITH LARGE SETS OF SDF OBJECTS
        uniform int iFrame;
        vec3 normal_sdf( vec3 pos ){
            #define ZERO min(iFrame,0)
            vec3 n = vec3( 0.0 );
            for( int i = ZERO; i < 4; i++ ){
                vec3 e = 0.5773 * (2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
                n += e * map_func( pos + 0.0005 * e );
            }
            return normalize( n );
        }

        //-------------------------
        float map_func( vec3 p ){
            float d     = 0.0;
            float dd    = 0.0;

            vec3 pos = quat_mul_vec3( quat_conjugate( quat ), p ); // Rotate Ray Point

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            d = sdSphere( pos, 0.08 );
            SR.id = 0;

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            dd = sdCapsule( pos, vec3(0,0,0), vec3(0,0.5,0), 0.03 );    // UP
            if( dd < d ){ d = dd; SR.id = 3; }

            //dd = sdSphere( pos - vec3(0,0.45,0), 0.1 );
            //if( dd < d ){ d = dd; SR.id = 3; }

            //dd = sdSphere( pos - vec3(0,-0.45,0), 0.1 );
            //if( dd < d ){ d = dd; SR.id = 3; }

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            dd = sdCapsule( pos, vec3(0,0,0), vec3(0.5,0,0), 0.03 );    // RIGHT
            if( dd < d ){ d = dd; SR.id = 2; }

            //dd = sdSphere( pos - vec3( 0.45, 0, 0 ), 0.1 );
            //if( dd < d ){ d = dd; SR.id = 2; }

            //dd = sdSphere( pos - vec3(-0.45,0,0), 0.1 );
            //if( dd < d ){ d = dd; SR.id = 2; }

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            dd = sdCapsule( pos, vec3(0,0,0), vec3(0,0,-0.5), 0.03 );   // FORWARD
            if( dd < d ){ d = dd; SR.id = 1; }

            //dd = sdSphere( pos - vec3( 0, 0, 0.45 ), 0.1 );
            //if( dd < d ){ d = dd; SR.id = 1; }

            //dd = sdSphere( pos - vec3( 0,0,-0.45), 0.1 );
            //if( dd < d ){ d = dd; SR.id = 1; }

            return d;
        }

        vec3 unlit( vec3 color, vec3 norm ){ 
            const vec3 color_x = vec3( 135.0/255.0, 143.0/255.0, 163.0/255.0 ); // #878FA3
            const vec3 color_y = vec3( 1.0, 1.0, 1.0 );                         // #ffffff
            const vec3 color_z = vec3( 206.0/255.0, 212.0/255.0, 224.0/255.0 ); // #CED4E0

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // From what I understand of how this works is by applying a Lighting Color for Each axis direction.
            // Then using the normal direction to blend each axis color together. From kenny's image example, he
            // setup the brightest color to come from Y, Second from Z then the darkest color at X.
            vec3 out_color;
            out_color = mix( color, color * color_x, norm.x );
            out_color = mix( out_color, color * color_y, norm.y );
            out_color = mix( out_color, color * color_z, norm.z );

            return out_color;
        }

        const vec3 colors[4] = vec3[](
            vec3( 0.0, 1.0, 1.0 ),
            vec3( 1.0, 0.0, 0.0 ),
            vec3( 0.0, 1.0, 0.0 ),
            vec3( 0.0, 0.0, 1.0 )
        );

        void main(){
            vec3 ray     = normalize( frag_lpos - cameraPos );
            gl_FragColor = vec4( 0.0, 0.0, 0.0, 0.0 );

            if( ray_march( cameraPos, ray ) ){
                vec3 norm        = normal_sdf( SR.hit );
                gl_FragColor.rgb = unlit( colors[ SR.id ], norm );
                
                //gl_FragColor.rgb = colors[ SR.id ];
                gl_FragColor.a   = 1.0;                
            }
        }`,
    });

    // If not using WebGL2.0 and Want to use dfdx or fwidth, Need to load extension
    // mat.extensions = { derivatives : true };

    return mat;
}

export default QuatAxisMesh