uniform sampler2D tex;
out vec4 fragCol;

vec3 erot(vec3 p, vec3 ax, float ro) {
    return mix(dot(ax,p)*ax,p,cos(ro))+sin(ro)*cross(ax,p);
}

float smin(float a, float b, float k) {
    float h = max(0., k-abs(b-a))/k;
    return min(a,b) - h*h*h*k/6.;
}

float ss(vec2 p) {
  return sqrt(length(p*p));
}

float ss(vec3 p) {
  return sqrt(length(p*p));
}

float linedist(vec2 p, vec2 a, vec2 b) {
  float k = dot(p-a,b-a)/dot(b-a,b-a);
  return distance(p,mix(a,b,clamp(k,0.,1.)));
}

vec2 kink(vec2 p, vec2 c, float k) {
    p -= c;
    float ang = atan(p.x, p.y);
    float len = length(p);
    ang -= ang/sqrt(1.+ang*ang)*(1.-k);
    return vec2(sin(ang),cos(ang))*len + c;
}

float cn(vec2 p) {
  return ss(max(p,0.)) + min(0.,max(p.x,p.y));
}

//welcome to the 4 dimensional corner function how may I take your order?
float cn(vec4 p) {
    return length(max(p,0.))+min(0.,max(max(p.x,p.y),max(p.z,p.w)));
}

float cylinder(vec3 p, vec2 d) {
  return cn(vec2(length(p.xy), abs(p.z)) - d);
}

float chamfer(vec2 p, float st, float r, float f) {
  return smin(-cn(-p), dot(p,normalize(vec2(st,1)))-r, r*f);
}

float cantab(vec3 p){
    vec2 off=vec2(0,cos(p.r)/4.);
    p=erot(p,vec3(1,0,0),-.1)-vec3(0,0,.4);
    if(abs(p.r)<3.4&&p.g<0.&&p.g>-7.)p.b+=smoothstep(0.,5.,p.g+7.)*.5;
    float connector=cn(vec2(p.b+.1+.2,cn(abs(p.rg-vec2(0,-6))-vec2(3,4)+.2+2.)-2.))-.2;
    float tabprofile=linedist(p.rg+off,vec2(0,4.25),vec2(0,-4.25))-6.55;
    float tab=cn(vec2(tabprofile,abs(p.b)))-.5;
    float indent=-chamfer(vec2(tabprofile+4.,.5-p.b),.6,1.5,.5);
    float bridge=cn(vec2(p.b+.1+.8,linedist(p.rg,vec2(-10.,2.),vec2(10.,2.))-.05))-.8;
    indent=smin(min(bridge,connector),indent,1.3);
    return-smin(-indent,-tab,.5);
}

float stex(vec3 p) {
	return sin(dot(sin(p*32.),vec3(2,9,1)))*cos(dot(cos(p*43.),vec3(6,1,5)))
		+sin(dot(sin(p*52.),vec3(2,3,9)))*cos(dot(cos(p*73.),vec3(9,1,2)));
}

vec3 gcancoords;
float thecan(vec3 p){
    gcancoords = p;
    p.z += stex(p*vec3(7,.2,.1))*.0001*smoothstep(.78,.8,p.z);
    p*=80.;
    
    float outer1=cylinder(p,vec2(24.345,58.925))-2.;
    float outer2=cylinder(p-vec3(0,0,3.105),vec2(23.2,64.83))-2.;
    float rim=cylinder(p-vec3(0,0,69.63),vec2(23.88,-.75))-2.;
    float subinner=cylinder(p-vec3(0,0,69.63),vec2(22.25,3.))-2.;
    float addinner=cylinder(p-vec3(0,0,64.63),vec2(20.56,.5))-2.;
    float knob=cylinder(p-vec3(0,0,67.23),vec2(1.65,.55))-.25;
    vec3 p2=vec3(sqrt(p.r*p.r+4.),p.gb);
    float bumps=length(p2-vec3(4.,10.,66.13))-1.1;
    float hole=cn(vec2(-smin(-length(p.rg-vec2(0,-9))+8.,-length(p.rg-vec2(0,-15))+11.5,3.),-p.z));
    p2.g+=20.5;
    p2.gr=kink(p2.gr,vec2(10,0),.1);
    float ridge=length(vec2(p.b-66.73,linedist(p2.rg,vec2(2,-2),vec2(12,14))))-.5;
    float fuckery=ss(p-vec3(5,-6.5,66.73))-2.;
    float inside=cylinder(p-vec3(0,0,14.63),vec2(20.56,52.));
    // float tab=10000.;
    // p-=vec3(5,-4.,66.23);
    // p=erot(p,normalize(vec3(1.5,-.5,.4)),-1.);
    // p+=vec3(5.,-4.5,66.73);
    float main=chamfer(vec2(outer1,outer2),.4,1.4,.9);
    main=smin(-smin(-min(main,rim),subinner,1.),addinner,2.);
    main=-smin(hole,-smin(min(main,knob),bumps,1.2),.5);
    main=-smin(-smin(main,ridge,1.),fuckery,3.);
    main=max(main,-inside);
    
    if(p.b>60.)main=min(main,cantab(erot(gcancoords*80.,vec3(0,0,1),.2)-vec3(0.,5.5,68.13)));
    return main/80.;
}

float gated_sphere(vec3 p, float scale, bool gate) {
    if (!gate) {
        p = abs(p);
        if(p.x < p.y) p.xy = p.yx;
        if(p.y < p.z) p.yz = p.zy;
        if(p.x < p.y) p.xy = p.yx;
        p.x -= scale;
    }
    return length(p)-scale/4.;
}

#define FK(k) floatBitsToInt(k)^floatBitsToInt(k*k/7.)
float hash(float a, float b) {
    int x = FK(a); int y = FK(b);
    return float((x*x-y)*(y*y+x)+x)/2.14e9;
}

//help... me... the SDF functions... are taking over... AAUAHGGUGHG
float bubbleify(vec3 p, float sdf) {
    float bubbles = 1e9;
    float scale = .06;
    for (int i = 0; i < 3; i++) { //loops in an sdf function.. please forgive me!!!
        p = erot(p, normalize(vec3(i,2,5)), .7)+.2;
        scale *= .8;

        //ripe for minify
        vec3 id = round(p/scale)*scale;
        bool gated = hash(id.x, hash(id.y, id.z)) > .65;
        float holes = gated_sphere(p-id, scale, gated);
        bubbles = min(bubbles, holes);
        
    }
    
    return max(smin(-bubbles, -sdf-.002, .005), sdf);
}

float fractal(vec2 p, float k) {
    vec2 cut = normalize(vec2(k,1.));
    float scale = 1.;
    for (int i = 0; i < 4; i++) {
        p.x = sqrt(p.x*p.x+.05)-sqrt(.05);
        p.y = sqrt(p.y*p.y+.05)-sqrt(.05);
        p.x -= 1.;
        p += smin(0.,-dot(p,cut),.5)*2.*cut;
        p *= 2.;
        scale *= 2.;
    }
    return linedist(p,vec2(1,0), vec2(-2,0))/scale;   
}

float splat;
float scene(vec3 p) {
    float can = 10000.;
    if (p.y < 0.) can = thecan(erot(p-vec3(-0.2,-1.90,-1.25), vec3(0.49, 0.34, 0.8), 1.79));

    p.x += cos(p.z*4.)/25.*cos(p.y*5.);
    //p.y += 1.;
    float fr1 = fractal(p.yz, 1.8);
    vec3 p2 = erot(p,normalize(vec3(1)),.4);
    float fr2 = fractal(p2.yz, 2.4);
    //this is like, a 4 dimensional.. intersection(?) of two versions of a KIFS fractal
    splat = cn(vec4(fr1-.045, fr2-.045, abs(p.x), p2.x)/sqrt(2.))-.008+ cos(fr1*100.)*.001+ cos(fr2*200.)*.001;
    if (splat < 0.) splat = bubbleify(p, splat);
    //return can;
    //return splat;
    return min(splat, can);
}

vec3 norm(vec3 p) {
    mat3 k = mat3(p,p,p)-mat3(0.0001);
    return normalize(scene(p)-vec3(scene(k[0]),scene(k[1]),scene(k[2])));
}

vec3 pixel_color( vec2 uv, float hs )
{
    vec3 cam = normalize(vec3(1.9,uv));
    vec3 init = vec3(-4,-.6,-.6);
    
    float zrot = 4.;
    // float yrot = .0;
    cam = erot(cam, vec3(1,0,0), -.6);
    //cam = erot(cam, vec3(0,1,0), yrot);
    //init = erot(init, vec3(0,1,0), yrot);
    cam = erot(cam, vec3(0,0,1), zrot);
    init = erot(init, vec3(0,0,1), zrot);
    
    vec3 p = init;
    bool bounce = false;
    float k = 1.;
    float cola = 0.;
    bool recalcK = false;
    bool escape = false;
    bool label = false;
    vec3 cancoords;
    vec3 n;
    for (int i = 0; i < 200; i++) {
        float dist = scene(p);
        if (recalcK) { k = dist < 0. ? -1. : 1.; recalcK = false; }
        p += cam*dist*k*1.1;
        if (dist < 0.) cola += abs(dist);
        if (dist*dist < 1e-9) {
            cancoords = gcancoords; //this is a nightmare of my own creation
            bool iscola = dist == splat;
            if (iscola) escape=true;
            hs = hash(hs, 9.3);
            n = norm(p)*k;
            float fres = abs(dot(n,cam))*.98;
            if (k < 0.) fres = step(.5, fres); //this is supposed to be total internal reflection lmao
            if (hs*.5+.5 > fres || !iscola) {
                cam = reflect(cam,n);
                if (length(cam)==0.)cam=n;
                if (!iscola) {
                    if (abs(cancoords.z) < .72 && length(cancoords.xy) > .31) {
                        label = true;
                    }
                }
                cam = normalize(cam);
                bounce = true;
                p += n*.0005;
            } else {
                cam = refract(cam,n, k < 0. ? 1.33 : 1./1.33);
                p -= n*.0005;
            }
            recalcK = true;
            //break;
        }
        if (distance(p, init) > 10.) { escape=true; break; }
    }
    
    
    float fact = length(sin(cam*3.9)*.5+.5);
    vec3 environ = vec3(smoothstep(1.,2.5,fact)+smoothstep(1.45,1.6,fact)*8.) + fact/8.;
    //environ = 1.;
    //environ += cola*1000.;
    environ *= mix(vec3(1), vec3(1.,0.5,0.4), smoothstep(0.,.4,cola+.1));
    vec3 col = (bounce&&escape) ? environ : vec3(0.0);
    col += cola*vec3(1.,0.5,0.4)*2.5;
    if (label) {
        //diffuse material takes too long to converge, so it's time 2 cheat :3
        vec2 texcoords = vec2(atan(cancoords.y,cancoords.x)/3.1415-.15, cancoords.z*.7+.5);
        float diff = length(sin(n*3.)*.5+.5)/sqrt(3.);
        vec4 tone = pow(texture(tex, -texcoords),vec4(2.));
        col += diff*tone.xyz*(hs*.5+.9);
    }
    return col;
}

void main() {
	fragCol = vec4(0);
	if (gl_FragCoord.x>1920||gl_FragCoord.y>1080) { discard; return; }
	vec2 uv = (gl_FragCoord.xy-vec2(960,540))/1080;
	float sd = hash(uv.x,uv.y);
	for (int i = 0; i < SAMPLES; i++) {
		sd = hash(sd, 2.6);
		vec2 h2 = tan(vec2(hash(sd, 6.7), hash(sd, 3.6)));
		vec2 uv2 = uv + h2/1080;
		fragCol += vec4(pixel_color(uv2, sd), 1);
	}

	fragCol/=fragCol.w;
	fragCol *= 1.0 - dot(uv,uv)*0.5; //vingetting lol
	fragCol = smoothstep(0.05,1.1,sqrt(fragCol)); //colour grading
}
