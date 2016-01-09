var scene, camera, renderer, clock, controls;

var SIZE = 256, //2 , 4 , 8 , 16 , 32 , 64 , 128 , [256] , 512 , 1024
    RADIUS = 6, // [6]
    simulation;

var data, points,
    textGeo,
    textMesh, 
    dataPoints = 500,
    datGUI,
    guiControls;

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
    }
}

var renderUniforms = {
    t_pos: {
        type: "t",
        value: null
    },
    colorR: {
        type: "f",
        value: 0.0
    },
    colorG: {
        type: "f",
        value: 0.0
    },
    colorB: {
        type: "f",
        value: 0.0
    }
}

/* ============================================================================================ */

var shaders = new ShaderLoader('./shaders');
shaders.load('ss-collisions', 'sim', 'simulation');
shaders.load('vs-lookup', 'lookup', 'vertex');
shaders.load('fs-lookup', 'lookup', 'fragment');
shaders.shaderSetLoaded = function () {
    init();
    windowsGUIEvent();
    
    animate();
}

/* ============================================================================================ */

function windowsGUIEvent() {
    document.onkeydown = checkKey;
    
    $(window).resize(function () {
        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = window.innerHeight;

        camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
        camera.updateProjectionMatrix();

        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    });

    
    guiControls = new function() {
        this.rotationX = 0.01;
        this.rotationY = 0.01;
        this.rotationZ = 0.01;
    }
    
    datGUI = new dat.GUI();
    var rotateX = datGUI.add(guiControls, 'rotationX', 0, 1);
    var rotateY = datGUI.add(guiControls, 'rotationY', 0, 1);
    var rotateZ = datGUI.add(guiControls, 'rotationZ', 0, 1);
    
    rotateX.onChange(function(value) {
        textGeo.rotateX(value);
    }).onFinishChange(function(value) {
        puttingPointsToCollision();
    });
    
    rotateY.onChange(function(value) {
        textGeo.rotateY(value);
    }).onFinishChange(function(value) {
        puttingPointsToCollision();
    });
    
    rotateZ.onChange(function(value) {
        textGeo.rotateZ(value);
    }).onFinishChange(function(value) {
        puttingPointsToCollision();
    });
}

function checkKey(e) {
    var keyPressed = String.fromCharCode(event.keyCode);
    //console.log(keyPressed);
    switch (keyPressed) {
    case 'W':
        camera.position.y += 10;
        break;
    case 'S':
        camera.position.y -= 10;
        break;
    case 'A':
        camera.position.x += 10;
        break;
    case 'D':
        camera.position.x -= 10;
        break;
    case 'Q':
        camera.position.x += 10;
        break;
    case 'E':
        camera.position.x -= 10;
        break;
    }
}

/* ============================================================================================ */

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
    renderer = new THREE.WebGLRenderer();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    //controls = new THREE.TrackballControls(camera);
    
    clock = new THREE.Clock();

    // Creating our Colliders
    //var geo = new THREE.IcosahedronGeometry(10, 2);
    var mat = new THREE.MeshNormalMaterial({
        transparent: true,
        //visible: false,
        opacity: 0
    });
    
    textGeo = new THREE.TextGeometry('noel', {
        size: 26,
        height: 4,
        font: "helvetiker",
        weight: "bold",
        style: "normal"

    });
    textGeo.center();
    //textGeo = new THREE.BufferGeometry().fromGeometry(textGeo);
    
    textGeo.rotateX(-1.06465068031618);
    textGeo.applyMatrix(new THREE.Matrix4().makeTranslation(0, 20, 0));
    textMesh = new THREE.Mesh(textGeo, mat);
    scene.add(textMesh);
    
    /* ====================== POINTS ====================== */
    
    puttingPointsToCollision();
    
    /* ====================== SIMULATION PARTICLES ====================== */
    
    var numOf = simulationUniforms.colliderPositions.value.length;
    var ss = shaders.setValue(shaders.ss.sim, 'COLLIDERS', numOf);
    simulation = new PhysicsRenderer(SIZE, ss, renderer);

    /* ====================== LOOKUP GEO ====================== */
    
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

    /* ====================== SIMULATION ====================== */

    simulation.addBoundTexture(renderUniforms.t_pos, 'output');
    simulation.resetRand(1);
    //simulation.addDebugScene( scene );

    /* ====================== CAMERA ====================== */

    camera.position.x = 75; //126;
    camera.position.y = 94;
    camera.position.z = 73;
    //camera.lookAt(0,50,0);
    //controls.target.set(new THREE.Vector3(0, 50, 0));
    //controls.target.set(new THREE.Vector3(0, 50, 0));   
}

function puttingPointsToCollision() {
    points = THREE.GeometryUtils.randomPointsInGeometry(textGeo, dataPoints);
    simulationUniforms.colliderPositions.value.length = 0;
    
    for (var i = 0, j = 0, l = dataPoints; i < l; i += 3, j += 1) {
        simulationUniforms.colliderPositions.value.push(points[j]);
    }
}

/* ============================================================================================ */

function render() {
//    
//    textMesh.rotation.y = guiControls.rotationY;
//    textMesh.rotation.z = guiControls.rotationZ;
    
    controls.update();
    simulation.update();
    
    renderer.render(scene, camera);
}

function animate(time) {
    var time = Date.now() * 0.001;

    renderUniforms.colorR.value = 1.0 + Math.sin(time * 0.3);
    renderUniforms.colorG.value = Math.sin(time * 0.2);
    renderUniforms.colorB.value = 1.0 + Math.sin(time * 0.1);
    
    simulationUniforms.dT.value = clock.getDelta();
    
    render();
    
    requestAnimationFrame(animate);
}

/* ============================================================================================ */

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