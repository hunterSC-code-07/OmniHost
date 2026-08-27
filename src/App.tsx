import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { ArrowUpRight, Copy, Check, Download, Terminal, Monitor, Cpu, MemoryStick } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Features mapping for the Capabilities section
// ----------------------------------------------------------------------
// WebGL Interactive Liquid Swirl Orb
// ----------------------------------------------------------------------
const fragmentShader = `
uniform vec2 uMouse;
uniform float uTime;
varying vec2 vUv;

void main() {
    // Center coordinates
    vec2 p = vUv - 0.5;
    float dist = length(p);
    
    // Circle mask for the orb (shrunk slightly to allow for 140% canvas bounce room)
    float alpha = smoothstep(0.36, 0.355, dist);
    if (alpha <= 0.0) discard;

    vec2 pToMouse = vUv - uMouse;
    float distToMouse = length(pToMouse);

    // Swirl distortion math (Whirlpool effect)
    float swirl = 4.0 * exp(-distToMouse * 10.0);
    float c = cos(swirl);
    float s = sin(swirl);
    mat2 rot = mat2(c, -s, s, c);
    
    // Apply twist
    vec2 twistedP = uMouse + rot * (vUv - uMouse);
    
    // Sinkhole (pull coordinates into the center of the mouse)
    float sink = exp(-distToMouse * 8.0) * 0.1;
    vec2 finalUv = twistedP + normalize(pToMouse) * sink;

    // Background colors based on finalUv distance from a bright core
    vec2 bgCenter = vec2(0.3, 0.7);
    float bgDist = length(finalUv - bgCenter);
    
    vec3 cBg = vec3(0.02, 0.02, 0.02);
    vec3 cCyan = vec3(0.0, 0.94, 1.0);
    vec3 cOrange = vec3(1.0, 0.33, 0.0);
    vec3 cWhite = vec3(1.0, 1.0, 1.0);

    vec3 col = cOrange;
    if (bgDist < 0.2) col = mix(cWhite, cOrange, bgDist / 0.2);
    else if (bgDist < 0.5) col = mix(cOrange, cCyan, (bgDist - 0.2) / 0.3);
    else col = mix(cCyan, cBg, smoothstep(0.5, 0.9, bgDist));

    // Dynamic wave animation on the gradient
    col += sin(finalUv.x * 10.0 + uTime * 0.5 + finalUv.y * 10.0) * 0.05 * cCyan;
    
    // Dent rim highlight
    float rim = smoothstep(0.015, 0.05, distToMouse) - smoothstep(0.05, 0.1, distToMouse);
    col += cWhite * rim * 0.5;

    // Sphere 3D volume (inner shadow)
    float sphereShadow = smoothstep(0.3, 0.5, dist);
    col = mix(col, vec3(0.0), sphereShadow * 0.85);

    gl_FragColor = vec4(col, alpha);
}
`;

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const OrbMesh = () => {
  const { viewport } = useThree();
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const meshRef = useRef<THREE.Mesh>(null);
  const spring = useRef({ value: 0.01, velocity: 0 });
  
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) }
    }),
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const el = document.getElementById('canvas-container');
      if (el) {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        // WebGL Y is inverted relative to DOM Y
        const y = 1.0 - ((e.clientY - rect.top) / rect.height);
        setMousePos({ x, y });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uMouse.value.x = THREE.MathUtils.lerp(uniforms.uMouse.value.x, mousePos.x, 0.08);
    uniforms.uMouse.value.y = THREE.MathUtils.lerp(uniforms.uMouse.value.y, mousePos.y, 0.08);

    // Custom entrance bouncy spring for the mesh scale
    if (meshRef.current) {
      const target = 1.0;
      const tension = 15.0;  // Lowered for a slower, floatier pull
      const friction = 3.5;  // Adjusted damping for a graceful bounce
      
      const dist = target - spring.current.value;
      const acc = dist * tension - spring.current.velocity * friction;
      
      const safeDelta = Math.min(delta, 0.05); // prevent instability on lag spikes
      spring.current.velocity += acc * safeDelta;
      spring.current.value += spring.current.velocity * safeDelta;
      
      meshRef.current.scale.set(spring.current.value, spring.current.value, 1.0);
    }
  });

  return (
    <mesh ref={meshRef} scale={[0.01, 0.01, 1.0]}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
      />
    </mesh>
  );
};

const InteractiveOrb = () => {
  return (
    <div
      id="orb-container"
      className="relative w-[80vw] h-[80vw] max-w-[700px] max-h-[700px] z-0 cursor-crosshair"
    >
      <motion.div 
        id="canvas-container"
        className="absolute"
        style={{ top: '-20%', left: '-20%', right: '-20%', bottom: '-20%' }}
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Outer glow behind the canvas */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 0.4 }}
           transition={{ duration: 2 }}
           className="absolute inset-0 rounded-full pointer-events-none blur-[40px] bg-gradient-to-tr from-orange to-cyan -z-10" 
           style={{ transform: 'scale(0.7)' }}
        />
        
        {/* 3D Canvas */}
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <OrbMesh />
        </Canvas>
      </motion.div>
    </div>
  );
};


// ----------------------------------------------------------------------
// Main App Component
// ----------------------------------------------------------------------

const SUPPORTED_GAMES = [
  "MINECRAFT",
  "DAYZ",
  "PALWORLD",
  "SATISFACTORY",
  "7 DAYS TO DIE",
  "ABIOTIC FACTOR",
  "V RISING",
  "ARK: SE"
];

const ScrollingLine = ({ 
  children, 
  direction, 
  globalScroll, 
  delay 
}: { 
  children: React.ReactNode, 
  direction: 1 | -1, 
  globalScroll: any,
  delay: number 
}) => {
  // Mathematical lock:
  // delay ranges from 0.0 to 6.0
  // Enter phase: 0.20 to ~0.29
  const startIn = 0.20 + (delay * 0.005);
  const endIn = 0.26 + (delay * 0.005);
  
  // Plateau (Lock): Everyone is at 0 from 0.29 to 0.42
  
  // Exit phase: 0.42 to 0.51 (bottom lines leave first because we subtract delay)
  const startOut = 0.45 - (delay * 0.005); 
  const endOut = 0.51 - (delay * 0.005);
  
  const offsetPx = typeof window !== 'undefined' ? window.innerWidth * direction : 1920 * direction;

  const x = useTransform(
    globalScroll,
    [startIn, endIn, startOut, endOut],
    [offsetPx, 0, 0, offsetPx]
  );

  return (
    <motion.div style={{ x }}>
      {children}
    </motion.div>
  );
};

const PlatformSection = ({ globalScroll }: { globalScroll: any }) => {
  return (
    <section className="relative z-10 min-h-screen pt-48 pb-48 px-6 flex flex-col md:flex-row max-w-7xl mx-auto w-full overflow-hidden items-center">
      
      {/* Platform Title */}
      <motion.div 
        style={{
          x: useTransform(
            globalScroll, 
            [0.18, 0.26, 0.45, 0.53], 
            [typeof window !== 'undefined' ? -window.innerWidth : -1920, 0, 0, typeof window !== 'undefined' ? -window.innerWidth : -1920]
          )
        }}
        className="w-full md:w-1/3 pr-8 mb-8 md:mb-0"
      >
        <h2 className="text-sm font-bold uppercase text-cyan tracking-widest">
           /01 THE PLATFORM
        </h2>
      </motion.div>
      
      {/* Main Text Content */}
      <div className="w-full md:w-2/3 text-3xl md:text-5xl font-display uppercase tracking-tight leading-[1.1]">
        
        <div className="text-white flex flex-col gap-1">
          <ScrollingLine direction={1} globalScroll={globalScroll} delay={0.0}>
            OMNI+HOST IS A NEXT-GENERATION
          </ScrollingLine>
          <ScrollingLine direction={-1} globalScroll={globalScroll} delay={1.0}>
            GAME SERVER HOSTING PLATFORM
          </ScrollingLine>
          <ScrollingLine direction={1} globalScroll={globalScroll} delay={2.0}>
            BUILT FOR EXTREME PERFORMANCE.
          </ScrollingLine>
        </div>
        
        <div className="text-white/40 flex flex-col gap-1 mt-8">
          <ScrollingLine direction={-1} globalScroll={globalScroll} delay={3.0}>
            WE UTILIZE GLOBALLY DISTRIBUTED
          </ScrollingLine>
          <ScrollingLine direction={1} globalScroll={globalScroll} delay={4.0}>
            BARE-METAL EDGE NODES AND AUTOMATED
          </ScrollingLine>
          <ScrollingLine direction={-1} globalScroll={globalScroll} delay={5.0}>
            DEPLOYMENT TO ENSURE YOUR MULTIPLAYER
          </ScrollingLine>
          <ScrollingLine direction={1} globalScroll={globalScroll} delay={6.0}>
            WORLDS RUN FLAWLESSLY WITH ZERO LATENCY.
          </ScrollingLine>
        </div>
      </div>
    </section>
  );
};

const DownloadSection = () => {
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedWinget, setCopiedWinget] = useState(false);

  const handleCopySha = () => {
    navigator.clipboard.writeText("9f82a1b7e45c38d92f838167a42b189e334a1c5d9882be1e7f62d1a3c89118b4");
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const handleCopyWinget = () => {
    navigator.clipboard.writeText("winget install OmniHost.Engine");
    setCopiedWinget(true);
    setTimeout(() => setCopiedWinget(false), 2000);
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-10%" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative z-10 py-32 px-6 max-w-5xl mx-auto w-full flex flex-col items-center"
    >
      <div className="flex flex-col items-center text-center mb-16">
        <div className="border border-white/20 text-white/50 px-4 py-1.5 rounded-sm text-xs font-mono uppercase tracking-widest mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cyan rounded-full inline-block shadow-[0_0_8px_rgba(0,240,255,0.8)]"></span> WINDOWS x64 DISTRIBUTION // v2.4.8-RELEASE
        </div>
        <h2 className="font-display text-[8vw] md:text-6xl uppercase tracking-tighter leading-[0.9] text-white mb-6">
          DOWNLOAD OMNIHOST FOR WINDOWS
        </h2>
        <p className="text-text-muted max-w-2xl text-lg">
          Native Windows x86_64 bare-metal daemon and desktop controller. Download the verified cryptographic executable or install via Windows Package Manager.
        </p>
      </div>

      <div className="w-full border border-white/10 bg-transparent flex flex-col md:flex-row overflow-hidden mb-6 relative">
        {/* Left Column - Executable */}
        <div className="w-full md:w-[55%] p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/10 flex flex-col">
          <div className="text-cyan text-xs font-bold uppercase tracking-widest mb-4">
            STABLE PRODUCTION BUILD <span className="text-white/30 mx-2">•</span> GPG SIGNED
          </div>
          <h3 className="text-3xl font-display text-white tracking-wide mb-2">OmniHost for Windows</h3>
          <div className="text-white/50 font-mono text-xs uppercase mb-8">
            ARCH: x86_64 <span className="text-white/30 mx-2">•</span> SIZE: 68.4 MB <span className="text-white/30 mx-2">•</span> VERSION: v2.4.8-RELEASE
          </div>
          
          <button className="w-full border border-cyan text-cyan hover:bg-cyan hover:text-black font-bold uppercase tracking-widest py-4 px-6 flex items-center justify-center gap-3 transition-colors duration-300 mb-6 group">
            <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" /> 
            DOWNLOAD OmniHost-Setup-v2.4.8-x64.exe
          </button>

          <div className="mt-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 bg-white/40"></span> SHA-256 CHECKSUM
              </span>
              <button onClick={handleCopySha} className="text-[10px] text-white/60 hover:text-cyan uppercase font-bold tracking-widest flex items-center gap-1 transition-colors">
                {copiedSha ? <Check className="w-3 h-3 text-cyan" /> : <Copy className="w-3 h-3" />} COPY
              </button>
            </div>
            <div className="bg-transparent border border-white/10 p-3 text-white/40 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
              9f82a1b7e45c38d92f838167a42b189e334a1c5d9882be1e7f62d1a3c89118b4
            </div>
          </div>
        </div>

        {/* Right Column - Winget */}
        <div className="w-full md:w-[45%] p-8 md:p-10 flex flex-col bg-transparent">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white/50 text-xs font-bold uppercase tracking-widest">WINDOWS PACKAGE MANAGER</span>
            <span className="text-cyan text-[10px] font-bold uppercase tracking-widest border border-cyan/30 px-2 py-0.5 bg-transparent">WINGET VERIFIED</span>
          </div>
          <p className="text-white/50 text-sm mb-6">
            Fast automated install with background auto-updates via PowerShell or CMD.
          </p>

          <div className="bg-transparent border border-white/10 p-1 pl-4 flex items-center justify-between mb-8">
            <span className="font-mono text-sm text-white/80"><span className="text-cyan mr-2">&gt;</span>winget install OmniHost.Engine</span>
            <button 
              onClick={handleCopyWinget}
              className="bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 p-2.5 transition-colors text-white/60 hover:text-white"
            >
              {copiedWinget ? <Check className="w-4 h-4 text-cyan" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <ul className="space-y-3 mt-auto">
            {[
              "Includes omnihostd background service",
              "Windows 10 / 11 64-bit compatible",
              "Auto-configures WireGuard TUN adapter"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/50 font-medium leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan mt-1.5 shadow-[0_0_8px_rgba(0,240,255,0.8)] shrink-0"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Grid Requirements */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border border-white/10 bg-transparent p-6 flex gap-4 items-start hover:border-white/20 transition-colors"
        >
          <Monitor className="w-6 h-6 text-white/30 shrink-0" />
          <div>
            <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">OPERATING SYSTEM</div>
            <div className="text-white font-bold text-sm mb-1">Windows 10 / 11 (64-bit)</div>
            <div className="text-white/40 text-xs">Build 19041 or higher</div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="border border-white/10 bg-transparent p-6 flex gap-4 items-start hover:border-white/20 transition-colors"
        >
          <Cpu className="w-6 h-6 text-cyan/50 shrink-0" />
          <div>
            <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">PROCESSOR ARCH</div>
            <div className="text-white font-bold text-sm mb-1">x86_64 / AMD64</div>
            <div className="text-white/40 text-xs">AVX2 instruction support</div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border border-white/10 bg-transparent p-6 flex gap-4 items-start hover:border-white/20 transition-colors"
        >
          <MemoryStick className="w-6 h-6 text-white/30 shrink-0" />
          <div>
            <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">SYSTEM MEMORY</div>
            <div className="text-white font-bold text-sm mb-1">4 GB RAM Minimum</div>
            <div className="text-white/40 text-xs">16 GB+ for game server hosting</div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

function App() {
  const heroRef = useRef<HTMLElement>(null);
  
  // Track scroll specifically for the hero section
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  // Global scroll for the orb's path with a spring applied for fluid, natural movement
  const { scrollYProgress: rawGlobalScroll } = useScroll();
  const globalScroll = useSpring(rawGlobalScroll, {
    stiffness: 40,
    damping: 20,
    restDelta: 0.001
  });
  const globalOrbX = useTransform(globalScroll, [0, 0.3, 0.6, 1], ["0vw", "12vw", "-12vw", "0vw"]);
  const globalOrbY = useTransform(globalScroll, [0, 0.3, 0.6, 1], ["0vh", "15vh", "30vh", "40vh"]);
  const globalOrbScale = useTransform(globalScroll, [0, 0.5, 1], [1, 0.8, 0.6]);

  // Scroll transforms for the cinematic splitting effect (Horizontal)
  const topTextX = useTransform(heroScroll, [0, 1], ["0vw", "-120vw"]);
  const middleTextX = useTransform(heroScroll, [0, 1], ["0vw", "120vw"]);
  const bottomTextX = useTransform(heroScroll, [0, 1], ["0vw", "-120vw"]);
  
  // Fade out later in the scroll to prevent dead space
  const textOpacity = useTransform(heroScroll, [0.5, 1], [1, 0]);
  
  const floatingTextY = useTransform(heroScroll, [0, 1], ["0%", "-300%"]);

  // Mouse Parallax for Typography
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Calculate normalized offset from center of screen (-1 to 1)
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      // Multiply by maximum movement distance (e.g. 20px)
      mouseX.set(x * 20);
      mouseY.set(y * 20);
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d] overflow-hidden relative">

      {/* Global Interactive 3D Orb */}
      <motion.div 
        style={{ x: globalOrbX, y: globalOrbY, scale: globalOrbScale }}
        className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none"
      >
        <InteractiveOrb />
      </motion.div>

      {/* Navbar */}
      <nav className="fixed w-full z-40 top-0 p-8 flex justify-between items-center mix-blend-difference text-white pointer-events-none">
        <div className="font-display text-2xl tracking-widest uppercase pointer-events-auto">OMNI+HOST</div>
        <button className="flex items-center gap-2 font-bold uppercase text-sm border-b border-white hover:text-cyan hover:border-cyan transition-colors pointer-events-auto">
          Download <ArrowUpRight className="w-4 h-4" />
        </button>
      </nav>

      {/* Hero Section */}
      <main ref={heroRef} className="relative h-[130vh]">
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center px-6 overflow-hidden">
          
          {/* Foreground Typography */}
          <motion.div 
            style={{ x: springX, y: springY }}
            className="flex flex-col items-center text-center z-10 w-full relative mix-blend-difference pointer-events-none"
          >
            
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div style={{ x: topTextX, opacity: textOpacity }}>
                <div className="font-display text-[14vw] leading-[0.85] tracking-tighter uppercase m-0 text-white">
                  A DIFFER<span className="text-cyan">E</span>NT
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              <motion.div style={{ x: middleTextX, opacity: textOpacity }}>
                <div className="font-display text-[14vw] leading-[0.85] tracking-tighter uppercase m-0 text-outline-white">
                  C<span className="text-cyan">R</span>EATIVE
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              <motion.div style={{ x: bottomTextX, opacity: textOpacity }}>
                <div className="font-display text-[14vw] leading-[0.85] tracking-tighter uppercase m-0 text-white">
                  APPRO<span className="text-cyan">A</span>CH
                </div>
              </motion.div>
            </motion.div>

          </motion.div>

          {/* Floating text element */}
          <motion.div
            style={{ y: floatingTextY, opacity: textOpacity }}
            className="absolute right-10 top-1/3 max-w-[200px] text-right text-text-muted font-medium z-10 hidden lg:block mix-blend-difference pointer-events-none"
          >
            WITH PERFORMANCE + INNOVATION, WE PUSH THE BOUNDARIES OF LOCAL SERVER HOSTING.
          </motion.div>
        </div>
      </main>


      {/* Marquee Section */}
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-10%" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="w-full overflow-hidden bg-cyan py-6 rotate-[-2deg] scale-110 relative z-20"
      >
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
          className="flex whitespace-nowrap font-display text-6xl text-background uppercase tracking-wider"
        >
          <span className="mx-4">YOUR SERVER. YOUR RULES.</span>
          <span className="mx-4 text-outline">YOUR SERVER. YOUR RULES.</span>
          <span className="mx-4">YOUR SERVER. YOUR RULES.</span>
          <span className="mx-4 text-outline">YOUR SERVER. YOUR RULES.</span>
          <span className="mx-4">YOUR SERVER. YOUR RULES.</span>
          <span className="mx-4 text-outline">YOUR SERVER. YOUR RULES.</span>
        </motion.div>
      </motion.div>

      {/* Introduction / Description Section */}
      <PlatformSection globalScroll={globalScroll} />

      {/* Supported Games Blueprint Grid */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-10%" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 py-32 px-6 flex flex-col md:flex-row max-w-7xl mx-auto w-full border-t border-white/10"
      >
        <div className="w-full md:w-1/4 pr-8 mb-12 md:mb-0">
           <h2 className="text-sm font-bold uppercase text-white/50 tracking-widest flex items-center gap-2">
              SUPPORTED <span className="border border-white/20 rounded-full px-3 py-1 text-xs">GAMES</span>
           </h2>
        </div>
        
        {/* Grid Container */}
        <div className="w-full md:w-3/4 grid grid-cols-2 md:grid-cols-4 relative border-l border-white/10">
           {SUPPORTED_GAMES.map((game, i) => (
             <div key={game} className="relative aspect-video flex items-center justify-center border-r border-b border-white/10 group hover:bg-white/5 transition-colors cursor-default">
                <span className="font-display text-xl text-white/80 tracking-widest group-hover:text-cyan transition-colors">{game}</span>
                
                {/* Crosshair (Plus marker) at bottom right of each cell */}
                <svg className="absolute -bottom-1.5 -right-1.5 w-3 h-3 text-white/30 z-10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M6 0v12M0 6h12" />
                </svg>

                {/* Additional crosshair at bottom left for the first item in each row */}
                {(i % 4 === 0) && (
                  <svg className="absolute -bottom-1.5 -left-1.5 w-3 h-3 text-white/30 z-10 hidden md:block" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M6 0v12M0 6h12" />
                  </svg>
                )}
             </div>
           ))}
        </div>
      </motion.section>

      {/* Features Hover Reveal Section */}
      <motion.section 
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-10%" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="min-h-screen relative z-10 py-32 px-6 flex flex-col justify-center max-w-7xl mx-auto"
      >
        <p className="text-orange font-bold uppercase tracking-widest mb-16 mix-blend-difference">Capabilities</p>

        <div className="flex flex-col gap-8 w-full relative z-20">
          {[
            { id: '01', title: 'DDOS PROTECTION', desc: 'Enterprise-grade mitigation' },
            { id: '02', title: 'NVME STORAGE', desc: 'Lightning fast load times' },
            { id: '03', title: 'GLOBAL EDGE', desc: 'Low latency worldwide' },
            { id: '04', title: 'AUTO BACKUPS', desc: 'Daily automated snapshots' },
          ].map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-10%" }}
              className="group border-b border-white/10 pb-4 relative cursor-crosshair"
            >
              <h2 className="font-display text-[8vw] md:text-[6vw] uppercase tracking-tighter leading-none text-text-muted group-hover:text-white transition-colors duration-300 pointer-events-auto">
                {item.title}
              </h2>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <DownloadSection />

      {/* Footer */}
      <footer className="py-24 text-center z-10 relative pointer-events-none">
        <h2 className="font-display text-[15vw] leading-none text-outline-white opacity-20">OMNIHOST</h2>
        <p className="text-text-muted mt-8">DESIGNED DIFFERENT.</p>
      </footer>

    </div>
  );
}

export default App;
