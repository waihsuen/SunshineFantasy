var seismograph = {
    ctx: null,
    canvasWidth: 800,
    canvasHeight: 300,

    needleHeadObjects: {},
    tempBlockObjects: {},
    tempCheckerObjects: {},

    drawType: {
        dots: 'DOTS',
        rect: 'RECT',
        blockline: 'BLOCKLINE'
    },

    compareObjects: {
        master: '',
        comparer: ''
    },

    scrollSpeed: 1,
    readyToCheck: false,
    hd: 0,
    totalPoints: 0,
    pointCounter: 0,

    dotsRadius: 5,

    init: function (elementID) {
        seismograph.ctx = document.getElementById(elementID).getContext('2d');
        seismograph.ctx.scale(0.5, 0.5);
    },

    drawDots: function (whichObject, color) {
        var whichArray = whichObject.freqArray;
        
        for (var i = 0; i < whichArray.length; i++) {
            //whichArray[i].x -= seismograph.scrollSpeed;
            whichObject.timePassedArray[i] -= seismograph.scrollSpeed;
            
            seismograph.ctx.beginPath();
            seismograph.ctx.arc(whichArray[i].x + whichObject.timePassedArray[i], 
                                whichArray[i].y, seismograph.dotsRadius, 0, 2 * Math.PI, false);
            seismograph.ctx.fillStyle = color;
            seismograph.ctx.fill();

            if (whichArray[i].x < 0) {
                // REMOVE OUT OF FRAME ELEMENTS
                whichArray.splice(i, 1);
            }
        }
    },

    // ==========================================================================================

    fireEvery500ms: function () {

        // ================================ CREATE BLOCKLINE ON 500ms
        var needlePos = {
            x: 0,
            y: 0
        };
        needlePos.x = seismograph.canvasWidth;
        needlePos.y = seismograph.canvasHeight;
        
        // ================================
        
        seismograph.readyToCheck = true;
        
        for (var key in seismograph.needleHeadObjects) {
            if (seismograph.needleHeadObjects[key].enableAvgPitch) {
                seismograph.checkDataAndMakeItABlock(key);
            }
        }
    },
    
    // ==========================================================================================

    inputFrequ: function (freq, freqName) {
        seismograph.needleHeadObjects[freqName].freqArray.push({
            x: seismograph.canvasWidth,
            y: (seismograph.canvasHeight) - (freq / 4)
        });
        
        seismograph.needleHeadObjects[freqName].timePassedArray.push(0);
    },

    clearCanvas: function () {
        seismograph.ctx.clearRect(0, 0, seismograph.canvasWidth, seismograph.canvasHeight);
    },
    canvasUpdate: function () {
        seismograph.clearCanvas();
        // =======================================================================
        for (var key in seismograph.needleHeadObjects) {
            seismograph.drawDots(seismograph.needleHeadObjects[key], seismograph.needleHeadObjects[key].color);
        }  
    },

    createNeedleHead: function (freqID, drawType, color) {
        if (seismograph.needleHeadObjects[freqID] === undefined) {
            seismograph.needleHeadObjects[freqID] = {
                freqArray: [],
                timePassedArray: [],
                display: true,
                drawType: drawType,
                color: color,
                enableAvgPitch: false
            };
        }
    },

    freqCallback: function (freq, freqID) {
        seismograph.inputFrequ(freq, freqID);
    }
};