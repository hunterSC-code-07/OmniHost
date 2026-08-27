let animationFrameId: number;
let gl: WebGLRenderingContext | null = null;
let program: WebGLProgram | null = null;
let timeLocation: WebGLUniformLocation | null = null;
let resolutionLocation: WebGLUniformLocation | null = null;
let canvasWidth = 0;
let canvasHeight = 0;

const shaders = {
  minecraft: {
    vs: `
      attribute vec4 a_position;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = a_position;
        v_texCoord = a_position.xy * 0.5 + 0.5;
      }
    `,
    fs: `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
          vec2 uv = v_texCoord;
          
          float noise1 = sin(uv.x * 3.0 + u_time * 0.5) * 0.5 + 0.5;
          float noise2 = sin(uv.y * 2.5 - u_time * 0.4) * 0.5 + 0.5;
          float noise3 = sin((uv.x + uv.y) * 1.5 + u_time * 0.6) * 0.5 + 0.5;
          
          vec3 color1 = vec3(0.569, 0.741, 0.349); // Mossy Green
          vec3 color2 = vec3(0.314, 0.478, 0.196); // Deep Green
          vec3 bgColor = vec3(0.015, 0.09, 0.06);   // Dark Emerald Base
          
          vec3 finalColor = mix(bgColor, color2, noise1 * 0.4);
          finalColor = mix(finalColor, color1, noise2 * 0.3 * noise3);
          
          float dist = distance(uv, vec2(0.5));
          finalColor *= 1.0 - dist * 0.5;

          gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  },
  dayz: {
    vs: `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `,
    fs: `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;

      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
          dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
          vec2 uv = v_texCoord;
          float aspect = u_resolution.x / u_resolution.y;
          vec2 noiseUv = uv * vec2(aspect, 1.0);

          float n1 = snoise(noiseUv * 0.4 + u_time * 0.12) * 0.5 + 0.5;
          float n2 = snoise(noiseUv * 0.8 - u_time * 0.08) * 0.5 + 0.5;
          float n3 = snoise(noiseUv * 1.5 + vec2(u_time * 0.05, -u_time * 0.15)) * 0.5 + 0.5;
          
          vec3 deepBlack = vec3(0.005, 0.0, 0.0);
          vec3 bloodRed = vec3(0.3, 0.02, 0.02);
          vec3 brightRed = vec3(0.6, 0.05, 0.05);

          float combinedNoise = mix(n1, n2, n3 * 0.4);
          vec3 color = mix(deepBlack, bloodRed, combinedNoise);
          
          float highlightMask = pow(n1 * n2, 4.0);
          color = mix(color, brightRed, highlightMask * 0.5);

          float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv - 0.5));
          color *= vignette;

          gl_FragColor = vec4(color, 1.0);
      }
    `
  }
};

const compileShader = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

self.onmessage = (e) => {
  if (e.data.type === 'init') {
    const canvas: OffscreenCanvas = e.data.canvas;
    const theme: 'minecraft' | 'dayz' = e.data.theme;
    
    gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl' as any)) as WebGLRenderingContext | null;
    if (!gl) return;

    const vsSource = shaders[theme].vs;
    const fsSource = shaders[theme].fs;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

    program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    const positions = theme === 'minecraft' ? [
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ] : [
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    timeLocation = gl.getUniformLocation(program, "u_time");
    resolutionLocation = gl.getUniformLocation(program, "u_resolution");

    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    gl.viewport(0, 0, canvasWidth, canvasHeight);

    const drawMode = theme === 'minecraft' ? gl.TRIANGLES : gl.TRIANGLE_STRIP;
    const vertexCount = theme === 'minecraft' ? 6 : 4;

    const render = (time: number) => {
      time *= 0.001;
      
      gl!.uniform1f(timeLocation, time);
      gl!.uniform2f(resolutionLocation, canvasWidth, canvasHeight);
      
      gl!.drawArrays(drawMode, 0, vertexCount);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
  } else if (e.data.type === 'resize') {
    canvasWidth = e.data.width;
    canvasHeight = e.data.height;
    if (gl) gl.viewport(0, 0, canvasWidth, canvasHeight);
  } else if (e.data.type === 'destroy') {
    cancelAnimationFrame(animationFrameId);
    if (gl && program) {
      gl.deleteProgram(program);
    }
  }
};
