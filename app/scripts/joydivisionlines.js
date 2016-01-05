
if ( !window.requestAnimationFrame ) {
	window.requestAnimationFrame = ( function() {
		return window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
			window.setTimeout( callback, 1000 / 60 );
		};
	} )();
}


//var renderer = new THREE.WebGLRenderer();
//// RENDER
//renderer.setClearColor(0xdddddd);
//renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.shadowMapEnabled = true
//renderer.shadowMapSoft = true;
//document.body.appendChild(renderer.domElement);

//VARS
var _stage,
_lineGroup,
_lineHolder,
_stats,
_camera,
_scene,
_renderer,
_mouseX = 0,
_mouseY = 0,
_material,
_gui,
_inputImage,
_stageCenterX,
_stageCenterY,
_canvas,
_context,
_imageWidth,
_imageHeight,
_stageWidth,
_stageHeight,
_enableMouseMove = false,

//VARS ACCESSIBLE BY GUI
_guiOptions  = {
	stageSize:	 	0.8,
	scale:	 		2.0,
	scanStep: 		5,
	lineThickness:	3.0,
	opacity: 		1.0,
	depth: 			100,
	autoRotate: 	false
};


// Init GUI
//var datGUI = new dat.GUI();

//dat.GUI.autoPlace = false;
//var _gui = new dat.GUI();
//document.getElementById('controls-container').appendChild( _gui.domElement );
//
////_gui = new DAT.GUI();
//_gui.add(_guiOptions, 'stageSize',.2,1,.1).onChange(doLayout).name('Stage Size');
//_gui.add(_guiOptions, 'scale', 0.1, 10,0.1).listen().name('Scale');
//_gui.add(_guiOptions, 'scanStep', 1, 20,1).onChange( createLines ).name('Line Separation');
//_gui.add(_guiOptions, 'lineThickness', 0.1, 10,0.1).onChange( updateMaterial ).name('Line Thickness');
//_gui.add(_guiOptions, 'depth', 0, 300,1).onChange( createLines ).name('Max Line Depth');
//_gui.add(_guiOptions, 'opacity', 0, 1,0.1).onChange( updateMaterial ).name('Brightness');
//_gui.add(this, 'saveImage').name('Save Image');

/**
 * Init page
 */
$(document).ready( function() {

	$(window).bind('resize', doLayout);

	_inputImage = new Image();
	_inputImage.src = ("images/a.jpg");

	_inputImage.onload = function() {
		// load image into canvas pixels
        _imageWidth = _inputImage.width;
        _imageHeight = _inputImage.height;
        _canvas	= document.createElement('canvas');
        _canvas.width = _imageWidth
        _canvas.height = _imageHeight;
        _context = _canvas.getContext('2d');
        _context.drawImage(_inputImage, 0, 0);
        _pixels	= _context.getImageData(0,0,_imageWidth,_imageHeight).data;

        createLines();
	};

	// stop the user getting a text cursor
	document.onselectstart = function() {
		return false;
	};
	_stage = document.getElementById("stage");

	
	//init mouse listeners
	$("#stage").mousemove( onMouseMove);
	$(window).mousewheel( onMouseWheel);
	
	$(window).mousedown( function() {
		_enableMouseMove = true;
	});
	$(window).mouseup( function() {
		_enableMouseMove = false;
	});

	doLayout();
    
	initWebGL();

});
function initWebGL() {

	//init camera
	_camera = new THREE.Camera(75, 16/9, 1, 3000);
	_camera.position.z = -1000;
	_scene = new THREE.Scene();

	//init renderer
	_renderer = new THREE.WebGLRenderer({
		antialias: true,
		clearAlpha: 1,
		sortObjects: false,
		sortElements: false
	});
    
    _renderer.setSize(window.innerWidth, window.innerHeight);

	_lineHolder = new THREE.Object3D();
	_scene.addObject(_lineHolder);

	animate();
}

/**
 * Create Lines from image
 */
function createLines() {

	document.body.appendChild(_renderer.domElement);

	var x = 0, y = 0;

	if (_lineGroup)
		_scene.removeObject(_lineGroup);

	_lineGroup = new THREE.Object3D();

	_material = new THREE.LineBasicMaterial({
		color: 0xffffff,
		opacity: _guiOptions.opacity,
		linewidth: _guiOptions.lineThickness,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		vertexColors: true
	} );

	// go through the image pixels
	for(y = 0; y < _imageHeight; y+= _guiOptions.scanStep) {
		var geometry = new THREE.Geometry();
		for(x = 0; x < _imageWidth ; x+= _guiOptions.scanStep) {
			var color = new THREE.Color(getColor(x, y));
			var brightness = getBrightness(color);
			var posn = new THREE.Vector3(x -_imageWidth/2,y - _imageHeight/2, -brightness * _guiOptions.depth + _guiOptions.depth/2);
			geometry.vertices.push(new THREE.Vertex(posn));
			geometry.colors.push(color);
		}
		//add a line
		var line = new THREE.Line(geometry, _material );
		_lineGroup.addChild(line);
	}

	_lineHolder.addChild(_lineGroup);
}

function updateMaterial() {
	if (_material) {
		_material.opacity = _guiOptions.opacity;
		_material.linewidth = _guiOptions.lineThickness;
	}
}

function onMouseMove(event) {
	if (_enableMouseMove) {
		_mouseX = event.pageX - _stageCenterX;
		_mouseY = event.pageY - _stageCenterY;
	}
}

function onMouseWheel(e,delta) {
	_guiOptions.scale += delta * 0.1;
	//limit
	_guiOptions.scale = Math.max(_guiOptions.scale, .1);
	_guiOptions.scale = Math.min(_guiOptions.scale, 10);
}

function onKeyDown(evt) {
	//save on 'S' key
	if (event.keyCode == '83') {
		saveImage();
	}
}

function animate() {
	requestAnimationFrame(animate);
	render();
}

function render() {

	_lineHolder.scale = new THREE.Vector3(_guiOptions.scale,_guiOptions.scale, _guiOptions.scale);

	var xrot = _mouseX/_stageWidth * Math.PI*2 + Math.PI;
	var yrot = _mouseY/_stageHeight* Math.PI*2 + Math.PI;

	_lineHolder.rotation.x += (-yrot - _lineHolder.rotation.x) * 0.3;
	_lineHolder.rotation.y += (xrot - _lineHolder.rotation.y) * 0.3;

	_renderer.render(_scene, _camera);
}

function doLayout() {

	var winHeight, winWidth, controlsWidth, containerWidth;

	//get dims
	winHeight = window.innerHeight ? window.innerHeight : $(window).height();
	winWidth = window.innerWidth ? window.innerWidth : $(window).width();


	//set stage size as fraction of window size
	//use letterbox dimensions unless 100%
	_stageWidth = parseInt(winWidth);
	_stageHeight = parseInt(winHeight) * 9 / 16;

//	if (_guiOptions.stageSize === 1) {
//		_stageHeight = $('#container').outerHeight();
//	}
//	$('#stage').width(parseInt(winHeight));
//	$('#stage').height(parseInt(winWidth));

	//Center stage div inside window
//	$('#stage').css({
//		left: Math.max((containerWidth - _stageWidth)/2 + controlsWidth,controlsWidth),
//		top: (winHeight -_stageHeight)/2,
//		visibility:"visible"
//	});

	//set webgl size
	if (_renderer) {
		_renderer.setSize(window.innerWidth, window.innerHeight);
		_camera.aspect = window.innerWidth / window.innerHeight;
		_camera.updateProjectionMatrix();
	}

	_stageCenterX = window.innerWidth / 2;
	_stageCenterY = window.innerHeight / 2
}

// Returns a hexidecimal color for a given pixel in the pixel array.
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

//return pixel brightness between 0 and 1 based on human perceptual bias
function getBrightness(c) {
	return ( 0.34 * c.r + 0.5 * c.g + 0.16 * c.b );
};
