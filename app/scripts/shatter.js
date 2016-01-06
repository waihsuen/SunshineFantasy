if (!Detector.webgl) Detector.addGetWebGLMessage();

var renderer, scene, camera;

var mesh, uniforms;

var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;



function init() {

    camera = new THREE.PerspectiveCamera(40, WIDTH / HEIGHT, 1, 2000);
    camera.updateProjectionMatrix();
    camera.position.set(-100, 40, 240);

    controls = new THREE.TrackballControls(camera);

    scene = new THREE.Scene();

    //

    var geometry = new THREE.TextGeometry("PITCH", {
        size: 40,
        height: 5,
        curveSegments: 6,
        font: "helvetiker",
        weight: "bold",
        style: "normal",
        bevelThickness: 2,
        bevelSize: 1,
        bevelEnabled: true
    });

    geometry.center();

    var tessellateModifier = new THREE.TessellateModifier(8);

    for (var i = 0; i < 6; i++) {
        tessellateModifier.modify(geometry);
    }

    var explodeModifier = new THREE.ExplodeModifier();
    explodeModifier.modify(geometry);

    var numFaces = geometry.faces.length;
    //
    geometry = new THREE.BufferGeometry().fromGeometry(geometry);

    var colors = new Float32Array(numFaces * 3 * 3);
    var displacement = new Float32Array(numFaces * 3 * 3);

    var color = new THREE.Color();

    for (var f = 0; f < numFaces; f++) {

        var index = 9 * f;

        var h = 1.0; //0.2 * Math.random();
        var s = 1.0; //0.5 + 0.5 * Math.random();
        var l = 1.0; //0.5 + 0.5 * Math.random();

        color.setHSL(h, s, l);

        var d = 10 * (0.5 - Math.random());

        for (var i = 0; i < 3; i++) {
            
            colors[index + (3 * i)] = color.r;
            colors[index + (3 * i) + 1] = color.g;
            colors[index + (3 * i) + 2] = color.b;

            displacement[index + (3 * i)] = d;
            displacement[index + (3 * i) + 1] = d;
            displacement[index + (3 * i) + 2] = d;

        }

    }

    geometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.addAttribute('displacement', new THREE.BufferAttribute(displacement, 3));

    //

    uniforms = {

        amplitude: {
            type: "f",
            value: 0.0
        }

    };
    
    var shaderMaterial = new THREE.ShaderMaterial({

        uniforms: uniforms,
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent

    });
    
    mesh = new THREE.Mesh(geometry, shaderMaterial);

    scene.add(mesh);

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(WIDTH, HEIGHT);
    
    document.getElementById('threejs').appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    //shatter();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function explode() {
    TWEEN.removeAll();
    console.log('shatter');
    new TWEEN.Tween(uniforms.amplitude).to({
        value: 300
    }, 1000).start();
}

function animate(time) {
    requestAnimationFrame(animate);
    render();
    TWEEN.update(time);
}

function render() {
    
    //uniforms.amplitude.value = 1.0 + Math.sin(time * 0.5);
    
    if (shattervalue < 6) {
        shake(shakeLevel);
    } else {
        if (!hasExploded) {
            hasExploded = true;
            explode();
        }
    }
    
    controls.update();
    renderer.render(scene, camera);
}


function shake(power) {
    var time = Date.now() * 0.001;
    var sX = 0, 
        sY = 0, 
        sZ = 0;
    
    switch(power) {
        case 'small' :
            sX = 1;
            sY = 2; 
            sZ = 2;
            break;
        case 'mid' :
            sX = 10;
            sY = 10; 
            sZ = 10;
            break;
        case 'big' :
            sX = 30;
            sY = 100; 
            sZ = 80;
            break;
    }
    camera.position.x = -100.0 + (Math.sin(time * sX)*6);
    camera.position.y = 40.0 + (Math.sin(time * sY)*20);
    camera.position.z = 240.0 + (Math.sin(time * sZ)*20);
}