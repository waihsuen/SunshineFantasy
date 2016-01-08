uniform float colorR;
uniform float colorG;
uniform float colorB;

void main(){
    const float ambient = 0.4;
    
  //gl_FragColor = vec4( 1. );
  //gl_FragColor = vec4(1.0), 0.0, 0.0, 1.0);
  gl_FragColor = vec4((colorR * 1.0), (colorG * 1.0), (colorB * 1.0), 1.0);
  
}

