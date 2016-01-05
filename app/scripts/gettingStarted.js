var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
var renderer = new THREE.WebGLRenderer();



// RENDER
renderer.setClearColor(0xdddddd);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMapEnabled = true
renderer.shadowMapSoft = true;
document.body.appendChild(renderer.domElement);

/* ********************************************** */

var axis = new THREE.AxisHelper(10);
scene.add(axis);

var grid = new THREE.GridHelper(60, 5);
var color = new THREE.Color("rgb(255, 0, 0)");
//scene.add(grid);

/* ********************************************** */

var cubeGeo = new THREE.BoxGeometry(5, 5, 5);
var cubeMaterial = new THREE.MeshLambertMaterial({color: 0xff3300});
var cube = new THREE.Mesh(cubeGeo, cubeMaterial);

var planeGeo = new THREE.PlaneGeometry(30,30,30);
var planeMat = new THREE.MeshLambertMaterial({color: 0xffffff});
var plane = new THREE.Mesh(planeGeo, planeMat);

plane.rotation.x = -0.5 * Math.PI;
plane.receiveShadow = true;

scene.add(plane);

cube.position.x = cube.position.y = cube.position.z = 2.5;
cube.castShadow = true;
cube.receiveShadow = false;

scene.add(cube);

/* ********************************************** */

var spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set (15, 30, 50);
spotLight.castShadow = true;
spotLight.shadowDarkness = 0.5;


scene.add(spotLight);

//spotLight.shadowCameraFov = 60;
//var spotLightHelper = new THREE.SpotLightHelper(spotLight, 50); // 50 is sphere size
//scene.add(spotLightHelper);


var guiControls = new function() {
    this.rotationX = 0.01;
    this.rotationY = 0.01;
    this.rotationZ = 0.01;
}

var datGUI = new dat.GUI();
datGUI.add(guiControls, 'rotationX', 0, 1);
datGUI.add(guiControls, 'rotationY', 0, 1);
datGUI.add(guiControls, 'rotationZ', 0, 1);

/* ********************************************** */

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.addEventListener('change', render);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

/* ********************************************** */

camera.position.x = camera.position.y = camera.position.z = 40;
//camera.position.y = 100;
camera.lookAt(scene.position);

/* ********************************************** */


function render() {
    cube.rotation.x = guiControls.rotationX;
    cube.rotation.y = guiControls.rotationY;
    cube.rotation.z = guiControls.rotationZ;
    
    //requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function animate() {
    
}

render();