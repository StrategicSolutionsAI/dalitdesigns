/* ─── DalitSite — 3D Gradient Blob ───
 *  Three.js IcosahedronGeometry with simplex noise
 *  GLSL displacement, mouse-reactive, gradient colors.
 */
(function (DS) {
    'use strict';

    var renderer, scene, camera, mesh, uniforms;
    var mouse = { x: 0.5, y: 0.5 };
    var target = { x: 0.5, y: 0.5 };
    var canvas;
    var raf;

    /* ── Simplex 3D noise (GLSL) ── */
    var noiseGLSL = [
        'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
        'vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
        'vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}',
        'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
        'float snoise(vec3 v){',
        '  const vec2 C=vec2(1.0/6.0,1.0/3.0);',
        '  const vec4 D=vec4(0.0,0.5,1.0,2.0);',
        '  vec3 i=floor(v+dot(v,C.yyy));',
        '  vec3 x0=v-i+dot(i,C.xxx);',
        '  vec3 g=step(x0.yzx,x0.xyz);',
        '  vec3 l=1.0-g;',
        '  vec3 i1=min(g.xyz,l.zxy);',
        '  vec3 i2=max(g.xyz,l.zxy);',
        '  vec3 x1=x0-i1+C.xxx;',
        '  vec3 x2=x0-i2+C.yyy;',
        '  vec3 x3=x0-D.yyy;',
        '  i=mod289(i);',
        '  vec4 p=permute(permute(permute(',
        '    i.z+vec4(0.0,i1.z,i2.z,1.0))',
        '    +i.y+vec4(0.0,i1.y,i2.y,1.0))',
        '    +i.x+vec4(0.0,i1.x,i2.x,1.0));',
        '  float n_=0.142857142857;',
        '  vec3 ns=n_*D.wyz-D.xzx;',
        '  vec4 j=p-49.0*floor(p*ns.z*ns.z);',
        '  vec4 x_=floor(j*ns.z);',
        '  vec4 y_=floor(j-7.0*x_);',
        '  vec4 x=x_*ns.x+ns.yyyy;',
        '  vec4 y=y_*ns.x+ns.yyyy;',
        '  vec4 h=1.0-abs(x)-abs(y);',
        '  vec4 b0=vec4(x.xy,y.xy);',
        '  vec4 b1=vec4(x.zw,y.zw);',
        '  vec4 s0=floor(b0)*2.0+1.0;',
        '  vec4 s1=floor(b1)*2.0+1.0;',
        '  vec4 sh=-step(h,vec4(0.0));',
        '  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;',
        '  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
        '  vec3 p0=vec3(a0.xy,h.x);',
        '  vec3 p1=vec3(a0.zw,h.y);',
        '  vec3 p2=vec3(a1.xy,h.z);',
        '  vec3 p3=vec3(a1.zw,h.w);',
        '  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
        '  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;',
        '  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);',
        '  m=m*m;',
        '  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));',
        '}'
    ].join('\n');

    var vertexShader = [
        'uniform float u_time;',
        'uniform vec2 u_mouse;',
        'uniform float u_intensity;',
        'varying vec3 vNormal;',
        'varying vec3 vPosition;',
        'varying float vDisplacement;',
        noiseGLSL,
        'void main(){',
        '  vNormal = normal;',
        '  vPosition = position;',
        '  float mouseInfluence = 1.0 + 0.3 * (1.0 - distance(uv, u_mouse));',
        '  float noise = snoise(position * 1.5 + u_time * 0.4) * u_intensity * mouseInfluence;',
        '  noise += snoise(position * 3.0 + u_time * 0.2) * u_intensity * 0.3;',
        '  vec3 newPosition = position + normal * noise;',
        '  vDisplacement = noise;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);',
        '}'
    ].join('\n');

    var fragmentShader = [
        'varying vec3 vNormal;',
        'varying vec3 vPosition;',
        'varying float vDisplacement;',
        'uniform float u_time;',
        'void main(){',
        '  vec3 color1 = vec3(0.388, 0.710, 0.773);', // #63b5c5
        '  vec3 color2 = vec3(0.114, 0.247, 0.345);', // #1d3f58
        '  vec3 color3 = vec3(0.878, 0.459, 0.533);', // warm pink
        '  vec3 color4 = vec3(0.698, 0.839, 0.882);', // pale blue
        '  float t = vDisplacement * 3.0 + 0.5;',
        '  vec3 col = mix(color2, color1, smoothstep(0.0, 0.5, t));',
        '  col = mix(col, color3, smoothstep(0.4, 0.8, t));',
        '  col = mix(col, color4, smoothstep(0.7, 1.0, t));',
        '  float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);',
        '  col = mix(col, color4, fresnel * 0.4);',
        '  float alpha = 0.82 - fresnel * 0.3;',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
    ].join('\n');

    function init() {
        if (DS.reducedMotion) return;
        if (typeof THREE === 'undefined') return;

        canvas = document.getElementById('hero-blob-canvas');
        if (!canvas) return;

        var dpr = Math.min(window.devicePixelRatio, 2);
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        renderer.setPixelRatio(dpr);
        renderer.setClearColor(0x000000, 0);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.z = 3.5;

        uniforms = {
            u_time: { value: 0 },
            u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
            u_intensity: { value: 0.22 }
        };

        var geometry = new THREE.IcosahedronGeometry(1.2, 64);
        var material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        resize();
        window.addEventListener('resize', resize);
        document.addEventListener('mousemove', onMouseMove);

        animate();
    }

    function resize() {
        if (!renderer || !canvas) return;
        var parent = canvas.parentElement;
        if (!parent) return;
        var w = parent.clientWidth;
        var h = parent.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }

    function onMouseMove(e) {
        target.x = e.clientX / window.innerWidth;
        target.y = 1.0 - (e.clientY / window.innerHeight);
    }

    function animate() {
        raf = requestAnimationFrame(animate);

        // Lerp mouse
        mouse.x += (target.x - mouse.x) * 0.05;
        mouse.y += (target.y - mouse.y) * 0.05;

        uniforms.u_time.value += 0.008;
        uniforms.u_mouse.value.set(mouse.x, mouse.y);

        mesh.rotation.y += 0.002;
        mesh.rotation.x += 0.001;

        renderer.render(scene, camera);
    }

    function destroy() {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        document.removeEventListener('mousemove', onMouseMove);
        if (renderer) renderer.dispose();
    }

    DS.Blob = { init: init, destroy: destroy };

})(window.DalitSite = window.DalitSite || {});
