// Elliot Rippe & Ben Beyer
// 12/3/17
// football.js

var canvas;
var gl;

var modelView, projection;
var mvMatrix, pMatrix;

var texCoordsArray = [];
var texture = [];
var image = [];
var points = [];

var texCoord = [
	vec2(0, 0),
	vec2(0, 1),
	vec2(1, 1),
	vec2(1, 0)
];

var vertices = [
   	 
    vec3( -0.5, -6.125, -16.0 ), // 0
    vec3( -0.5, -5.375, -16.0 ), // 1
    vec3(  0.5, -5.375, -16.0 ), // 2
    vec3(  0.5, -6.125, -16.0 ), // 3
    vec3( -0.5, -6.125, -17.0 ), // 4
    vec3( -0.5, -5.375, -17.0 ), // 5
    vec3(  0.5, -5.375, -17.0 ), // 6
    vec3(  0.5, -6.125, -17.0 ), // 7
    vec3(  0.0,   -5.0, -16.5 ), // 8
    vec3(  0.0,   -6.5, -16.5 ), // 9
   	 
    vec3( -12.0, -12.0,  -40.0 ), // 10 -back stands
    vec3( -12.0,  12.0,  -40.0 ), // 11
    vec3(  12.0, -12.0,  -40.0 ), // 12
    vec3(  12.0,  12.0,  -40.0 ), // 13
   	
    vec3( -12.0, -12.0,	0.0 ), // 14 -front points
    vec3(  12.0, -12.0,	0.0 ), // 15
    vec3( -12.0,  12.0,	0.0 ), // 16
    vec3(  12.0,  12.0,	0.0 ), // 17
	 
 	vec3( -3.0, -9.0, -39.0 ), //18 -refbody
 	vec3( -3.0, -9.0, -38.0 ), //19
 	vec3( -2.0, -9.0, -38.0 ), //20
 	vec3( -2.0, -9.0, -39.0 ), //21
 	vec3( -3.0, -12.0, -39.0 ), //22
 	vec3( -3.0, -12.0, -38.0 ), //23
 	vec3( -2.0, -12.0, -38.0 ), //24
 	vec3( -2.0, -12.0, -39.0 ), //25
	 
 	vec3( -2.0, -9.5, -38.75 ), //26 -refleftarm
 	vec3( -2.0, -9.5, -38.25 ), //27
 	vec3( -1.5, -9.5, -38.25 ), //28
 	vec3( -1.5, -9.5, -38.75 ), //29
 	vec3( -2.0, -11.0, -38.75 ), //30
 	vec3( -2.0, -11.0, -38.25 ), //31
 	vec3( -1.5, -11.0, -38.25 ), //32
 	vec3( -1.5, -11.0, -38.75 ), //33
	 
 	vec3( -3.5, -9.5, -38.75 ), //34 -refrightarm
 	vec3( -3.5, -9.5, -38.25 ), //35
 	vec3( -3.0, -9.5, -38.25 ), //36
 	vec3( -3.0, -9.5, -38.75 ), //37
 	vec3( -3.5, -11.0, -38.75 ), //38
 	vec3( -3.5, -11.0, -38.25 ), //39
 	vec3( -3.0, -11.0, -38.25 ), //40
 	vec3( -3.0, -11.0, -38.75 ), //41
	 
 	vec3( -2.75, -8.0, -38.75 ), //42 -refhead
 	vec3( -2.75, -8.0, -38.25 ), //43
 	vec3( -2.25, -8.0, -38.25 ), //44
 	vec3( -2.25, -8.0, -38.75 ), //45
 	vec3( -2.75, -9.0, -38.75 ), //46
 	vec3( -2.75, -9.0, -38.25 ), //47
 	vec3( -2.25, -9.0, -38.25 ), //48
 	vec3( -2.25, -9.0, -38.75 )  //49
	 
	];

var xstart = 0; //amount x is incrimented for the football to change angle of kicks
var ystart = 0; //y position of football before kick
var zstart = 0; //z position of football before kick
var xmove = 0; //next 3 change translation matrix of footall when kicked
var ymove = 0;
var zmove = 0;
var movebg = -5.0; //used to change distance of kick by moving stadium

var kicked = 0; //1 when ball is kicked
var theta = [ 0, 0, 0 ];
var count = 0; //incremented as ball moves, used to control numer of transformations performed

var good = 0; //1 if the kick was successful
var hitDecider = 0; //randomized to determine if the kick will be successful

var thetaLoc;

var program;    

function configureTexture(image, id) {
	texture[id] = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture[id]);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,
              	gl.RGB, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                 	gl.NEAREST_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function initializeTexture(myImage, fileName, id) {
	myImage[id] = new Image();
	myImage[id].onload = function() {
    	configureTexture(myImage[id], id);
	}
	myImage[id].src = fileName;
}

window.onload = function init()
{
	canvas = document.getElementById( "gl-canvas" );
    
	gl = WebGLUtils.setupWebGL( canvas );
	if ( !gl ) { alert( "WebGL isn't available" ); }

	football();
    
	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
	gl.enable(gl.DEPTH_TEST);

	//
	//  Load shaders and initialize attribute buffers
	//
	var program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram( program );
	projection = gl.getUniformLocation( program, "projection" );

	var vBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

	var vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition );
    
	var tBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    
	var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
	gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vTexCoord);
    
	//Initialize textures
	initializeTexture(image, "football_skin.jpg", 0);
	initializeTexture(image, "football_laces.jpg", 1);
	initializeTexture(image, "stands.jpg", 2);
	initializeTexture(image, "stands_end.jpg", 3);
	initializeTexture(image, "field.jpg", 4);
	initializeTexture(image, "sky.jpg", 5);
	initializeTexture(image, "stands_end2.jpg", 6);
	initializeTexture(image, "ref.jpg", 7);
	initializeTexture(image, "skin.png", 8);

	thetaLoc = gl.getUniformLocation(program, "theta");
    
	//event listeners for buttons
    
	document.getElementById( "Kick!" ).onclick = function () {
    	if(count == 0){
			hitDecider = (Math.random() - 0.25);
			if( hitDecider >= 0 ){	//kick is good
				xstart = (Math.random() - 0.5) * 0.0085;
				kicked = 1; // kicks ball
				good = 1; //the kick is succeessful
			}else if( hitDecider >= -.13 && hitDecider < 0 ) {	//wide right
				xstart = (Math.random() + 1.5) * 0.009;
				kicked = 1; // kicks ball
				good = 0; //the kick is unsucceessful
			}else{	//wide left
				xstart = (Math.random() - 2.0) * 0.009;
				kicked = 1; // kicks ball
				good = 0; //the kick is unsucceessful
			}
    	}
	};
	document.getElementById( "Move Forward!" ).onclick = function () {
	if( movebg <= 2.5 && count==0){ //limits how far forward you can go
    	movebg += 0.5;
	}
    	// moves kicking position forward
	};
	document.getElementById( "Move Backward!" ).onclick = function () {
	if( movebg >= -25 && count==0){ //limits how far backward you can go  	 
		movebg -= 0.5;
	}
    	// moves kicking position backwards
	};
    
	modelView = gl.getUniformLocation( program, "modelView" );
    
	render();
}


function football()
{
	//ball
	quad( 2, 3, 7, 6 );  //normal sides of ball
	quad( 3, 0, 4, 7 );
	quad( 6, 5, 1, 2 );
	quad( 4, 5, 6, 7 );
	quad( 5, 4, 0, 1 );
	triangle( 8, 1, 2 ); //top and bottom of ball
	triangle( 8, 2, 6 );
	triangle( 8, 6, 5 );
	triangle( 8, 5, 1 );
	triangle( 9, 3, 0 );
	triangle( 9, 0, 4 );
	triangle( 9, 4, 7 );
	triangle( 9, 7, 3 );
	quad( 0, 3, 2, 1 ); //laces
    
	//stadium
	quad( 10, 11, 13, 12 );	//back stands
	quad( 14, 15, 12, 10 );	//grass
	quad( 17, 13, 11, 16 );	//sky
	quad( 12, 13, 17, 15 );	//left side
	quad( 14, 16, 11, 10 );	//right side
    
	//referee
	quad(18, 19, 20, 21); //ref body
	quad(19, 23, 24, 20);
	quad(21, 20, 24, 25);
	quad(21, 25, 22, 18);
	quad(18, 22, 23, 19);
	quad(22, 25, 24, 23);
    
	quad(26, 27, 28, 29); //ref left arm
	quad(27, 31, 32, 28);
	quad(29, 28, 32, 33);
	quad(29, 33, 30, 26);
	quad(26, 30, 31, 27);
	quad(30, 33, 32, 31);
    
	quad(34, 35, 36, 37); //ref right arm
	quad(35, 39, 40, 36);
	quad(37, 36, 40, 41);
	quad(37, 41, 38, 34);
	quad(34, 38, 39, 35);
	quad(38, 41, 40, 39);
    
	quad(42, 43, 44, 45); //ref head
	quad(43, 47, 48, 44);
	quad(45, 44, 48, 49);
	quad(45, 49, 46, 42);
	quad(42, 46, 47, 43);
	quad(46, 49, 48, 47);
}

function quad(a, b, c, d)
{
	points.push(vertices[a]);
	texCoordsArray.push(texCoord[0]);
	points.push(vertices[b]);
	texCoordsArray.push(texCoord[1]);
	points.push(vertices[c]);
	texCoordsArray.push(texCoord[2]);
	points.push(vertices[a]);
	texCoordsArray.push(texCoord[0]);
	points.push(vertices[c]);
	texCoordsArray.push(texCoord[2]);
	points.push(vertices[d]);
	texCoordsArray.push(texCoord[3]);
}

function triangle(a, b, c) {
	points.push(vertices[a]);
	texCoordsArray.push(texCoord[1]);
	points.push(vertices[b]);
	texCoordsArray.push(texCoord[2]);
	points.push(vertices[c]);
	texCoordsArray.push(texCoord[0]);
}

var sinFrac = 0.0; //used to create part of a sin curve for the motion of the ball

function render()
{
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   var pMatrix = perspective(50.0, 1.0, 1.0, 500.0);
    
	if(kicked == 1 && count < 500){ //moves all through air
    	xmove += xstart;
    	sinFrac += 0.01;
    	ymove += Math.sin( sinFrac )/15;
    	zmove -= .045;
    	count ++;
	}else if( count >= 500 && count < 600){ //resets ball
    	xstart = 0;
    	xmove = xstart;
    	sinFrac = 0.0;
    	ymove = ystart;
    	zmove = zstart;
    	kicked = 0;
    	count ++;
	}else if( count >= 600){ //resets count (official stops signalling)
   	 count = 0;
	}
    
	//draw football
	mvMatrix = mat4( );
	mvMatrix = mult(mvMatrix, translate(xmove, ymove, zmove));

	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
    
	gl.uniform3fv(thetaLoc, theta);
	gl.bindTexture(gl.TEXTURE_2D, texture[0]);    
	gl.drawArrays( gl.TRIANGLES, 0, 54 );
	
	//laces
	mvMatrix = mat4( );
	mvMatrix = mult(mvMatrix, translate(xmove, ymove, zmove));

	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
    
	gl.uniform3fv(thetaLoc, theta);
	gl.bindTexture(gl.TEXTURE_2D, texture[1]);    
	gl.drawArrays( gl.TRIANGLES, 54, 6);
    
	//backdrop
	mvMatrix = mat4( );
	mvMatrix = mult(mvMatrix, translate(0.0, 0.0, movebg));
    
	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
    
	gl.bindTexture(gl.TEXTURE_2D, texture[6]);
	gl.drawArrays( gl.TRIANGLES, 60,  6);
    
	//grass
	mvMatrix = mat4( );
	mvMatrix = mult(mvMatrix, translate(0.0, 0.0, movebg));
    
	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
    
	gl.bindTexture(gl.TEXTURE_2D, texture[4]);
	gl.drawArrays( gl.TRIANGLES, 66,  6);
    
	//sky
	mvMatrix = mat4( );
	mvMatrix = mult(mvMatrix, translate(0.0, 0.0, movebg));
    
	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
    
	gl.bindTexture(gl.TEXTURE_2D, texture[5]);
	gl.drawArrays( gl.TRIANGLES, 72,  6);
   	 
	//sides
	mvMatrix = mat4( );
	mvMatrix = mult(mvMatrix, translate(0.0, 0.0, movebg));
    
	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
    
	gl.bindTexture(gl.TEXTURE_2D, texture[2]);
	gl.drawArrays( gl.TRIANGLES, 78,  12);

	//refbody
	mvMatrix = mat4( );
	mvMatrix = mult(mvMatrix, translate(0.0, 0.0, movebg));
    
	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
    
	gl.bindTexture(gl.TEXTURE_2D, texture[7]);
	gl.drawArrays( gl.TRIANGLES, 90,  36);
    
	//refarms
	mvMatrix = mat4( );
	mvMatrix = mult(mvMatrix, translate(0.0, 0.0, movebg));
    if( count > 500 && good == 1){
		mvMatrix = mult(mvMatrix, translate(0.0, 1.0, 0.0));
	}
	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
	
	gl.drawArrays( gl.TRIANGLES, 126,  72);
    
	//refhead
	mvMatrix = mat4( );
	mvMatrix = mult(mvMatrix, translate(0.0, 0.0, movebg));
    
	gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
    
	gl.bindTexture(gl.TEXTURE_2D, texture[8]);
	gl.drawArrays( gl.TRIANGLES, 198,  36);
    
	requestAnimFrame( render );
}

