import React, { useEffect, useRef } from 'react'

interface AnimatedBackgroundProps {
  theme?: 'green' | 'blue'
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = React.memo(({ theme = 'green' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl')
    if (!gl) return

    const vsSource = `
      attribute vec4 a_position;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = a_position;
        v_texCoord = a_position.xy * 0.5 + 0.5;
      }
    `

    const colors = theme === 'blue'
      ? {
          c1: 'vec3(0.373, 0.647, 0.98)',   // Light Blue (blue-400 equivalent)
          c2: 'vec3(0.145, 0.388, 0.843)',  // Deep Blue
          bg: 'vec3(0.02, 0.06, 0.15)'      // Dark Navy Base
        }
      : {
          c1: 'vec3(0.569, 0.741, 0.349)', // Mossy Green
          c2: 'vec3(0.314, 0.478, 0.196)', // Deep Green
          bg: 'vec3(0.015, 0.09, 0.06)'   // Dark Emerald Base
        };

    const fsSource = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
          vec2 uv = v_texCoord;
          
          // Create organic motion using layered sine waves
          float noise1 = sin(uv.x * 3.0 + u_time * 0.5) * 0.5 + 0.5;
          float noise2 = sin(uv.y * 2.5 - u_time * 0.4) * 0.5 + 0.5;
          float noise3 = sin((uv.x + uv.y) * 1.5 + u_time * 0.6) * 0.5 + 0.5;
          
          vec3 color1 = ${colors.c1};
          vec3 color2 = ${colors.c2};
          vec3 bgColor = ${colors.bg};
          
          // Mix colors based on noise for a fluid effect
          vec3 finalColor = mix(bgColor, color2, noise1 * 0.4);
          finalColor = mix(finalColor, color1, noise2 * 0.3 * noise3);
          
          // Add a subtle vignette to focus on the center
          float dist = distance(uv, vec2(0.5));
          finalColor *= 1.0 - dist * 0.5;

          gl_FragColor = vec4(finalColor, 1.0);
      }
    `

    const compileShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource)

    const program = gl.createProgram()!
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    const positions = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionAttributeLocation)
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')

    let animationFrameId: number

    const render = (time: number) => {
      time *= 0.001

      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width
          canvas.height = rect.height
          gl.viewport(0, 0, canvas.width, canvas.height)
        }
      }

      gl.uniform1f(timeLocation, time)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)

      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
})
