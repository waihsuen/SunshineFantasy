
// WSAD RF for directions. Q to freeze.

"use strict";

var container, stats;
var camera, scene, renderer, group, particle, controls;

var mouseX = 0,
    mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var startTime = Date.now(),
    elapsed;

var delta;

var i, attributes, uniforms, emitterpos;


var gl;
var frameBuffer;
var uPositionsLoc;
var fboWidth = 512; //64->4K, 512-> 256K, 1024-> 1M 2048->4M pixels
var particleCount = fboWidth * fboWidth;

// 1 Program for simulating, 1 Program for rendering
var simulationProgram;
var renderProgram;

console.log('particleCount', particleCount);


var clock = new THREE.Clock();


init();
animate();

var sparksEmitter;

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    var str = shaderScript.innerHTML;

    var shader;

    if (shaderScript.type == "x-shader/x-fragment")
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    else if (shaderScript.type == "x-shader/x-vertex")
        shader = gl.createShader(gl.VERTEX_SHADER);
    else return null;
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) == 0)
        alert(gl.getShaderInfoLog(shader));
    return shader;

}





function initParticleFrameBuffer() {

    ///// Particle Frame Buffer Stuff

    if (!gl.getExtension("OES_texture_float")) {
        alert("No OES_texture_float support for float textures!");
        return;
    }

    if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) == 0) {
        alert("No support for vertex shader textures!");
        return;
    }


    // Creating the first shader
    simulationProgram = gl.createProgram();
    gl.attachShader(simulationProgram, getShader(gl, "simulation-shader-vs"));
    gl.attachShader(simulationProgram, getShader(gl, "simulation-shader-fs"));
    gl.linkProgram(simulationProgram);

    gl.useProgram(simulationProgram);
    var aPosLoc = gl.getAttribLocation(simulationProgram, "aPos");
    var aTexLoc = gl.getAttribLocation(simulationProgram, "aTexCoord");

    console.log('aPosLoc', aPosLoc, 'aTexLoc', aTexLoc);
    gl.enableVertexAttribArray(aPosLoc);
    gl.enableVertexAttribArray(aTexLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
					-1, -1, 0, 0,
					-1, 1, 0, 1,
					1, -1, 1, 0,
					1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, gl.FALSE, 16, 0);
    gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, gl.FALSE, 16, 8);

    // Create inital values
    var initialData = [];
    var bounds = 1000;
    for (var k = 0; k < particleCount; k++) {
        initialData.push(
            Math.random() * bounds,
            Math.random() * bounds,
            Math.random() * bounds);
    }


    // Building Texture
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGB, fboWidth, fboWidth, 0,
        gl.RGB, gl.FLOAT, new Float32Array(initialData));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Framebuffers
    frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, texture, 0);

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

    if (status != gl.FRAMEBUFFER_COMPLETE) {
        console.log("Framebuffer attachment not completed!");
        for (var i in gl) {
            if (typeof (gl[i]) == "number" && gl[i] == status) {
                console.log("Detailed error: " + i);
            }
        }

    }

    uPositionsLoc = gl.getUniformLocation(simulationProgram, "uPositions");


}

function updateMatrices() {
    group.updateMatrix();
    scene.updateMatrixWorld();
    camera.matrixWorldInverse.getInverse(camera.matrixWorld);


    if (!camera._viewMatrixArray) camera._viewMatrixArray = new Float32Array(16);
    camera.matrixWorldInverse.flattenToArrayOffset(camera._viewMatrixArray);
//[].concat.apply([],arr)

    if (!camera._projectionMatrixArray) camera._projectionMatrixArray = new Float32Array(16);
    camera.projectionMatrix.flattenToArrayOffset(camera._projectionMatrixArray);

    if (!group.__webglInit) {
        group._modelViewMatrix = new THREE.Matrix4();
        group._objectMatrixArray = new Float32Array(16);
        group._modelViewMatrixArray = new Float32Array(16);
    }

    group.matrixWorld.flattenToArrayOffset(group._objectMatrixArray);
    group._modelViewMatrix.multiplyToArray(camera.matrixWorldInverse, group.matrixWorld, group._modelViewMatrixArray);
}

function initParticleSystem() {
    group = new THREE.Object3D();
    group.position.set(0, 0, 0);
    scene.add(group);
    camera.lookAt(group);


    // Camera projection matrix 

    updateMatrices();

    // Shader program for particle renderer

    renderProgram = gl.createProgram();
    gl.attachShader(renderProgram, getShader(gl, "render-shader-vs"));
    gl.attachShader(renderProgram, getShader(gl, "render-shader-fs"));

    var aParticleXYLoc = 2;
    gl.bindAttribLocation(renderProgram, aParticleXYLoc, "aParticleXY");
    // Can't use attrb location

    gl.linkProgram(renderProgram);
    gl.useProgram(renderProgram);

    var positionIndex = [],
        d = 1 / fboWidth;

    // pixels are located in the midway of pixels
    for (var y = d / 2; y < 1; y += d) {
        for (var x = d / 2; x < 1; x += d) {
            positionIndex.push(x, y);
        }
    }

    // We push each particle as a attribute
    gl.enableVertexAttribArray(aParticleXYLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionIndex), gl.STATIC_DRAW);
    gl.vertexAttribPointer(aParticleXYLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(gl.getUniformLocation(renderProgram, "uFboData"), 0);

    // Pass matrix in as a uniform
    gl.uniformMatrix4fv(
        gl.getUniformLocation(renderProgram, "projectionMatrix"),
        false, camera._projectionMatrixArray);

    gl.uniformMatrix4fv(
        gl.getUniformLocation(renderProgram, "modelViewMatrix"),
        false, group._modelViewMatrixArray);


    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 1);


}

// Run simulation passes and render
function runSimulation() {

    updateMatrices();



    // Run simulation
    gl.viewport(0, 0, fboWidth, fboWidth);

    gl.useProgram(simulationProgram);
    gl.uniform1i(uPositionsLoc, 0);

    gl.uniform1f(gl.getUniformLocation(simulationProgram, "time"), elapsed);
    gl.uniform2f(gl.getUniformLocation(simulationProgram, "mouse"), mouseX, mouseY);


    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.flush();


    // Run Particle Rendering
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(renderProgram);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(
        gl.getUniformLocation(renderProgram, "projectionMatrix"),
        false, camera._projectionMatrixArray);
    gl.uniformMatrix4fv(
        gl.getUniformLocation(renderProgram, "modelViewMatrix"),
        false, group._modelViewMatrixArray); // group._objectMatrixArray

    gl.enable(gl.BLEND);
    gl.drawArrays(gl.POINTS, 0, particleCount);
    gl.disable(gl.BLEND);
    gl.flush();

}


function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
    // camera.position.set(-20, 180, 300) ;
    camera.position.set(270, 437, 800);

    controls = new THREE.FirstPersonControls(camera);
    controls.lookSpeed = 0.0125;
    controls.movementSpeed = 500;
    controls.noFly = false;
    controls.lookVertical = true;
    controls.constrainVertical = true;
    controls.verticalMin = 1.5;
    controls.verticalMax = 2.0;

    controls.lon = -110;


    scene = new THREE.Scene();
    scene.add(camera);

    // Create REnderer


    var canvas = document.createElement('canvas');
    gl = canvas.getContext('experimental-webgl');

    if (!gl) {
        alert('gl failed.')
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    container.appendChild(canvas);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild(stats.domElement);

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('touchmove', onDocumentTouchMove, false);


    initParticleFrameBuffer();
    initParticleSystem();

} // End init

function onDocumentMouseMove(event) {

    mouseX = (event.clientX - windowHalfX) / windowHalfX;
    mouseY = (event.clientY - windowHalfY) / windowHalfY;

    // console.log(mouseX, mouseY);
}

function onDocumentTouchStart(event) {

    if (event.touches.length == 1) {

        event.preventDefault();

        mouseX = event.touches[0].pageX - windowHalfX;
        mouseY = event.touches[0].pageY - windowHalfY;
        mouseX /= windowHalfX;
        mouseY /= windowHalfY;
    }
}

function onDocumentTouchMove(event) {

    if (event.touches.length == 1) {

        event.preventDefault();

        mouseX = event.touches[0].pageX - windowHalfX;
        mouseY = event.touches[0].pageY - windowHalfY;
        mouseX /= windowHalfX;
        mouseY /= windowHalfY;
    }
}

//



function animate() {

    requestAnimationFrame(animate);

    render();
    stats.update();

}

function render() {


    delta = clock.getDelta();
    controls.update(delta);

    elapsed = (Date.now() - startTime) / 1000;


    runSimulation();

}