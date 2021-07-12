/*
let myData = { woot:0 };

let state = StateProxy.new( myData );
state.$.dynamicProperties = false;
state.$
    .converter( "woot", "int" )
    .on( "wootChange", (e)=>{ console.log( "wootChange", e.detail ) } );

state.woot = "500.5";   // Converter will change data to int( 500 )
state.woot = "yo";      // Converter Prevents this from being Saved since it produces NaN value

console.log( state.woot );
*/
    
class StateProxy{

    // #region STATIC
    static new( data={} ){ return new Proxy( data, new StateProxy( data ) ); }
    // #endregion ////////////////////////////////////////////////////////////

    // #region MAIN
    emitter           = new EventTarget();
    converters        = new Map();
    dynamicProperties = false;
    data              = null;
    
    constructor( data=null ){
        this.data = data;
    }

    getData(){ return this.data; }
    // #endregion ////////////////////////////////////////////////////////////

    // #region PROXY TRAPS
    get( target, prop, receiver ){
        //console.log( "GET", "target", target, "prop", prop, "rec", receiver );    
        if( prop == "$" ) return this;
    
        return Reflect.get( target, prop, receiver ); //target[ prop ];
    }

    set( target, prop, value ){
        //console.log( "SET", "target", target, "prop", prop, "value", value );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( prop == "$" )                                    return false;
        if( !this.dynamicProperties && !( prop in target ) ) return false;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( this.converters.has( prop ) ){
            let tuple = this.converters.get( prop )( value );
            if( tuple[ 0 ] == false ) return false;
            value = tuple[ 1 ];
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Reflect.set( target, prop, value ); // Save data to Object
        this.emit( prop+"Change", value );  // Emit event that property changed
        return true;
    }
    // #endregion ////////////////////////////////////////////////////////////

    // #region CONVERTERS
    /** fn = ( v: any ) : [ boolean, any ] */
    converter( propName, fn ){
        switch( fn ){
            case "float"    : fn = this._floatConverter;   break;
            case "int"      : fn = this._intConverter;     break;
        }

        this.converters.set( propName, fn );
        return this;
    }

    _floatConverter( v ){
        v = parseFloat( v );
        return [ !isNaN( v ), v ];
    }

    _intConverter( v ){
        v = parseInt( v );
        return [ !isNaN( v ), v ];
    }
    // #endregion ////////////////////////////////////////////////////////////

    // #region EVENTS
    on( evtName, fn ){ this.emitter.addEventListener( evtName, fn ); return this; }
    off( evtName, fn ){ this.emitter.removeEventListener( evtName, fn ); return this; }
    once( evtName, fn ){ this.emitter.addEventListener( evtname, fn, { once:true } ); return this; }

    emit( evtName, data ){
        this.emitter.dispatchEvent( new CustomEvent( evtName, { detail:data, bubbles: false, cancelable:true, composed:false } ) );
        return this;
    }
    // #endregion ////////////////////////////////////////////////////////////

}

export default StateProxy;