var scene, camera, renderer, clock, controls;

var SIZE = 256; //2 , 4 , 8 , 16 , 32 , 64 , 128 , 256 , 512 , 1024
var RADIUS = 6;
var simulation;

var data, points;

var simulationUniforms = {

    dT: {
        type: "f",
        value: 0
    },
    colliderPositions: {
        type: "v3v",
        value: []
    },
    radius: {
        type: "f",
        value: RADIUS
    },

}

var renderUniforms = {

    t_pos: {
        type: "t",
        value: null
    },
    colorR: { type: "f", value: 0.0 },
    colorG: { type: "f", value: 0.0 },
    colorB: { type: "f", value: 0.0 }
}




var shaders = new ShaderLoader('../shaders');

shaders.load('ss-collisions', 'sim', 'simulation');
shaders.load('vs-lookup', 'lookup', 'vertex');
shaders.load('fs-lookup', 'lookup', 'fragment');

shaders.shaderSetLoaded = function () {
    init();
    animate();
}


document.onkeydown = checkKey;

function checkKey(e) {

    var keyPressed = String.fromCharCode(event.keyCode);
    console.log(keyPressed);

    switch(keyPressed) {
        case 'W' :
            camera.position.y+=10;
            break;
        case 'S' :
            camera.position.y-=10;
            break;
        case 'A' :
            camera.position.x+=10;
            break;
        case 'D' :
            camera.position.x-=10;
            break;
    }

}


function init() {
    
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);
    
    controls = new THREE.OrbitControls(camera,renderer.domElementw);
    clock = new THREE.Clock();

    /*
       Creating our Colliders
    */

    var geo = new THREE.IcosahedronGeometry(10, 2);
    var mat = new THREE.MeshNormalMaterial({
        transparent: true,
        opacity: 0
    });
    
    
    var width = 512, height = 512;
    data = new Float32Array( width * height * 3 );
    var textGeo = new THREE.TextGeometry('noel', {

				size: 26,
				height: 4,
				font: "helvetiker",
				weight: "bold",
				style: "normal"

			});

    textGeo.center();    
    
//    //textGeo = new THREE.BufferGeometry().fromGeometry(textGeo);

    textMesh1 = new THREE.Mesh( textGeo, mat );
    
    textGeo.rotateX(-1.06465068031618);
    textGeo.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 50, 0) );
    
    points = THREE.GeometryUtils.randomPointsInGeometry(textGeo, data.length / 3 );

    scene.add(textMesh1);   
    
    for ( var i = 0, j = 0, l = data.length/3000; i < l; i += 3, j += 1 ) {
        simulationUniforms.colliderPositions.value.push(points[ j ]);
    }
    
    camera.position.z = 100;
    camera.position.y = 100;
    camera.lookAt(textMesh1);
    
//    var numFaces = textGeo.faces.length;
//    for ( var f = 0; f < numFaces/5; f ++ ) {
//
//        var face = textGeo.faces[f];
//        var newvec = new THREE.Vector3(textGeo.vertices[face.a].clone(), 
//                                       textGeo.vertices[face.b].clone(), 
//                                       textGeo.vertices[face.c].clone() );
//        //console.log(textGeo.faces[f]);
//        simulationUniforms.colliderPositions.value.push(newvec);
//
//    }
 
    
//    for (var i = 0; i < 10; i++) {
//
//        var mesh = new THREE.Mesh(geo, mat);
//
//        scene.add(mesh);
//
//        mesh.position.x = (Math.random() - .5) * 100;
//        mesh.position.y = (Math.random() - .5) * 100;
//        mesh.position.z = (Math.random() - .5) * 100;
//
//        simulationUniforms.colliderPositions.value.push(mesh.position);
//
//    }

    var numOf = simulationUniforms.colliderPositions.value.length;
    var ss = shaders.setValue(shaders.ss.sim, 'COLLIDERS', numOf);
    simulation = new PhysicsRenderer(SIZE, ss, renderer);


    var geo = createLookupGeometry(SIZE);

    var mat = new THREE.ShaderMaterial({
        uniforms: renderUniforms,
        vertexShader: shaders.vs.lookup,
        fragmentShader: shaders.fs.lookup,
        blending: THREE.AdditiveBlending,
        transparent: true

    });

    simulation.setUniforms(simulationUniforms);

    var particles = new THREE.Points(geo, mat);

    particles.frustumCulled = false;
    scene.add(particles);


    simulation.addBoundTexture(renderUniforms.t_pos, 'output');
    simulation.resetRand(1);
    
    //simulation.addDebugScene( scene );
    
}

function animate() {

    requestAnimationFrame(animate);

    simulationUniforms.dT.value = clock.getDelta();
    simulation.update();

    controls.update();
    renderer.render(scene, camera);
    
    var time = Date.now() * 0.001;
    
    renderUniforms.colorR.value = 1.0 + Math.sin( time * 0.3 );
    renderUniforms.colorG.value = Math.sin( time * 0.2 );
    renderUniforms.colorB.value = 1.0 + Math.sin( time * 0.1 );

}

function createLookupGeometry(size) {

    var geo = new THREE.BufferGeometry();

    // geo.addAttribute( 'position', Float32Array , size * size , 3 );

    var positions = new Float32Array(size * size * 3);

    for (var i = 0, j = 0, l = positions.length / 3; i < l; i++, j += 3) {

        positions[j] = (i % size) / size;
        positions[j + 1] = Math.floor(i / size) / size;
        //positions[ j + 2 ] = Math.sin( (i / size) * Math.PI );
    }

    var posA = new THREE.BufferAttribute(positions, 3);
    geo.addAttribute('position', posA);


    return geo;

}