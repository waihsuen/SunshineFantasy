uniform sampler2D t_pos;

void main(){

  vec4 pos = texture2D( t_pos , position.xy );

  vec3 dif = cameraPosition - pos.xyz;
  
  gl_PointSize = min( 1. ,  200. / length( dif ));
  gl_Position = projectionMatrix * modelViewMatrix * vec4( pos.xyz , 1. );
}
