if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function () {
        return window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function ( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();
}

var _lineGroup,
    _lineHolder,
    camera,
    scene,
    renderer,
    _material,
    _inputImage,
    _canvas,
    context,
    _imageWidth,
    _imageHeight,
    _stageWidth,
    _stageHeight;

var imageArray = ['images/a.jpg', 'images/b.jpg', 'images/c.jpg', 'images/d.jpg', 'images/e.jpg', 'images/f.jpg'],
    imageCounter = 0;


$(document).ready(function () {

    var SCREEN_WIDTH, SCREEN_HEIGHT;
    //
    _canvas = document.createElement('canvas');
    context = _canvas.getContext('2d');

    $(window).resize(function () {
        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = window.innerHeight;

        camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
        camera.updateProjectionMatrix();

        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    });

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    //
    //camera = new THREE.PerspectiveCamera(75, 16/9, 1, 3000);
    camera.position.z = 0;
    //camera.position.x = camera.position.y = camera.position.z = 10;
    //camera.position.y = 100;
    camera.lookAt(scene.position);
    //
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    //
    document.body.appendChild(renderer.domElement);
    //
    loadImageAndReadyScene();
    animate();
});


function createLines() {
    if (_lineHolder)
        scene.remove(_lineHolder);
    
    _lineHolder = new THREE.Object3D();
    scene.add(_lineHolder);
    _lineHolder.rotation.x = Math.PI / 2;
    _lineHolder.rotation.y = 0;
    _lineHolder.rotation.z = 0;

    var x = 0,
        y = 0;

    if (_lineGroup)
        scene.remove(_lineGroup);

    _lineGroup = new THREE.Object3D();

    _material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        opacity: 1.0,
        linewidth: 0.5,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        vertexColors: true
    });

    var steps = 6,
        depth = 60;

    for (y = 0; y < _imageHeight; y += steps) {
        var geometry = new THREE.Geometry();
        for (x = 0; x < _imageWidth; x += steps) {
            var color = new THREE.Color(getColor(x, y));
            var brightness = getBrightness(color);
            var posn = new THREE.Vector3(x - _imageWidth / 2, y - _imageHeight / 2, -brightness * depth + depth / 2);
            geometry.vertices.push(posn);
            geometry.colors.push(color);
        }
        //add a line
        var line = new THREE.Line(geometry, _material);
        _lineGroup.add(line);
    }

    _lineHolder.add(_lineGroup);
}

function animate(time) {
    requestAnimationFrame(animate);
    render();
    TWEEN.update(time);
}

function render() {
    renderer.render(scene, camera);
}

function startAnimation() {
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 0;
    camera.zoom = 1;
    
    new TWEEN.Tween(camera.position).to({
        x: 10,
        y: 10,
        z: 1400
    }, 5000).start();

    new TWEEN.Tween(_lineHolder.rotation).to({
        x: Math.PI,
        y: 0,
        z: 0
    }, 2000).delay(3400).start().onComplete(function () {
        //
        
        new TWEEN.Tween(_lineHolder.rotation).to({
        x: Math.PI/2,
        y: 0,
        z: Math.PI/2
        }, 2000).delay(400).start().onComplete(function () {
            setTimeout(loadImageAndReadyScene, 3000);
        });
        
        new TWEEN.Tween(camera.position).to({
            x: 0,
            y: 0,
            z: 0
        }, 5000).delay(400).start();
        
        
    });
    
    
}

function loadImageAndReadyScene() {
    _inputImage = new Image();
    _inputImage.src = (imageArray[imageCounter]);

    _inputImage.onload = function () {
        _imageWidth = _inputImage.width;
        _imageHeight = _inputImage.height;

        _canvas.width = _imageWidth
        _canvas.height = _imageHeight;

//        var scaleWidth = (_imageWidth > window.innerWidth) ? _imageWidth/window.innerWidth : window.innerWidth/_imageWidth;
//        
//        console.log(scaleWidth);
//        context.scale(scaleWidth, scaleWidth);
        context.drawImage(_inputImage, 0, 0);
        _pixels = context.getImageData(0, 0, _imageWidth, _imageHeight).data;
        createLines();
        startAnimation();
        
        //
        $(window).trigger('resize');
        
        if (imageCounter < imageArray.length-1) {
            imageCounter++;
        } else {
            imageCounter = 0;
        }
    };
}

function getColor(x, y) {
    var base = (Math.floor(y) * _imageWidth + Math.floor(x)) * 4;
    var c = {
        r: _pixels[base + 0],
        g: _pixels[base + 1],
        b: _pixels[base + 2],
        a: _pixels[base + 3]
    };
    return (c.r << 16) + (c.g << 8) + c.b;
};

function getBrightness(c) {
    return (0.34 * c.r + 0.5 * c.g + 0.16 * c.b);
};