import React, { useEffect, useRef, useState } from 'react';

interface ShaderBackgroundProps {
  opacity?: number;
  className?: string;
}

export const ShaderBackground: React.FC<ShaderBackgroundProps> = ({
  opacity = 1,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shaderFailed, setShaderFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const gl =
        canvas.getContext('webgl') ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
      if (!gl) {
        setShaderFailed(true);
        return;
      }

      const vs = `
        attribute vec2 a_position;
        varying vec2 v_texCoord;
        void main() {
          v_texCoord = a_position * 0.5 + 0.5;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fs = `
        precision highp float;
        varying vec2 v_texCoord;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;

        void main() {
          vec2 uv = v_texCoord;
          vec2 m = u_mouse / u_resolution;
          
          // Create organic flowing noise
          float t = u_time * 0.18;
          vec2 p = uv * 3.0 - 1.5;
          
          for(float i = 1.0; i < 5.0; i++){
            p.x += 0.3 / i * sin(i * 3.0 * p.y + t + m.x * 0.5);
            p.y += 0.3 / i * cos(i * 3.0 * p.x + t + m.y * 0.5);
          }
          
          float r = 0.5 + 0.5 * sin(p.x + p.y);
          
          // Lumina Gold & Obsidian Palette
          vec3 color1 = vec3(0.066, 0.078, 0.09); // Dark surface (#111417)
          vec3 color2 = vec3(0.94, 0.725, 0.04); // Lumina Gold (#f0b90b)
          vec3 color3 = vec3(1.0, 0.85, 0.5);    // Bright highlight
          
          vec3 finalColor = mix(color1, color2, r * 0.38);
          finalColor = mix(finalColor, color3, pow(r, 7.5) * 0.28);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `;

      function createShader(type: number, source: string) {
        if (!gl) return null;
        const s = gl.createShader(type);
        if (!s) return null;
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          return null;
        }
        return s;
      }

      const vertexShader = createShader(gl.VERTEX_SHADER, vs);
      const fragmentShader = createShader(gl.FRAGMENT_SHADER, fs);
      if (!vertexShader || !fragmentShader) {
        setShaderFailed(true);
        return;
      }

      const prog = gl.createProgram();
      if (!prog) {
        setShaderFailed(true);
        return;
      }

      gl.attachShader(prog, vertexShader);
      gl.attachShader(prog, fragmentShader);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        setShaderFailed(true);
        return;
      }
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
      );

      const pos = gl.getAttribLocation(prog, 'a_position');
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

      const uTime = gl.getUniformLocation(prog, 'u_time');
      const uRes = gl.getUniformLocation(prog, 'u_resolution');
      const uMouse = gl.getUniformLocation(prog, 'u_mouse');

      let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

      const handleMouseMove = (event: MouseEvent) => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        if (rect.width && rect.height) {
          const nx = (event.clientX - rect.left) / rect.width;
          const ny = 1.0 - (event.clientY - rect.top) / rect.height;
          mouse.x = nx * canvas.width;
          mouse.y = ny * canvas.height;
        }
      };

      window.addEventListener('mousemove', handleMouseMove);

      function syncSize() {
        if (!canvas || !gl) return;
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
      }

      const resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
      syncSize();

      let animId: number;
      function render(t: number) {
        if (!gl || !canvas) return;
        if (uTime) gl.uniform1f(uTime, t * 0.001);
        if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
        if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        animId = requestAnimationFrame(render);
      }

      animId = requestAnimationFrame(render);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('mousemove', handleMouseMove);
        resizeObserver.disconnect();
        if (gl) {
          gl.deleteProgram(prog);
          gl.deleteShader(vertexShader);
          gl.deleteShader(fragmentShader);
          gl.deleteBuffer(buf);
        }
      };
    } catch {
      setShaderFailed(true);
    }
  }, []);

  return (
    <div
      id="obsidian-shader-bg"
      className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-700 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      {shaderFailed ? (
        <div className="w-full h-full bg-gradient-to-b from-[#191c1f] via-[#111417] to-[#0d0f11] opacity-90" />
      ) : (
        <canvas ref={canvasRef} className="w-full h-full block" />
      )}
    </div>
  );
};
