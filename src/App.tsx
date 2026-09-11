import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, X, ChevronLeft, ChevronRight, Layers, Sparkles, Terminal, Sliders, Globe, Zap, HardDrive,
  Plus, ExternalLink
} from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Features mapping for the Capabilities section
// ----------------------------------------------------------------------
// WebGL Interactive Liquid Swirl Orb
// ----------------------------------------------------------------------
const fragmentShader = `
uniform vec2 uMouse;
uniform vec2 uMouseVel;
uniform float uTime;
varying vec2 vUv;

// Smooth minimum for organic fluid droplet blending (Metaball / Surface Tension)
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

void main() {
    vec2 p = vUv - vec2(0.5);
    float baseR = 0.325;
    
    // Smooth Cartesian perimeter waves (zero polar singularities)
    float wave = (sin(p.x * 14.0 + uTime * 1.2) + cos(p.y * 14.0 - uTime * 1.4)) * 0.0035;
    float dSphere = length(p) - (baseR + wave);
    
    // Mouse attractor droplet: pulls fluid boundary smoothly towards cursor when near
    vec2 toM = vUv - uMouse;
    float distToM = length(toM);
    float dMouse = distToM - 0.045;
    
    // Elastic smin blend: boundary stretches and bulges outward towards cursor
    float dVal = smin(dSphere, dMouse, 0.16);
    
    // Smooth anti-aliased liquid boundary (dVal used strictly for clipping & alpha)
    float alpha = smoothstep(0.003, -0.003, dVal);
    if (alpha <= 0.0) discard;
    
    // Smooth Gaussian mouse influence (strictly zero derivative at center -> ZERO CREASE / ZERO SPOKES)
    float d2 = dot(toM, toM);
    float mouseInf = exp(-d2 * 32.0);
    
    // Mathematically pure 3D liquid dome normal (100% Cartesian, zero radial singularity, zero spokes)
    vec2 normXY = p * 2.8 + toM * mouseInf * 1.2;
    float domeZ = sqrt(max(0.001, 1.0 - dot(normXY, normXY) * 0.22));
    vec3 normal = normalize(vec3(normXY, domeZ));
    
    // Silky liquid displacement: fluid pushes and indents smoothly without twisting into spokes
    vec2 vel = clamp(uMouseVel * 0.15, vec2(-0.6), vec2(0.6));
    vec2 fluidUv = vUv - toM * mouseInf * 0.08 - vel * mouseInf * 0.05;
    
    // Gentle 3D normal refraction
    fluidUv += normal.xy * 0.015;
    
    // Broad, silky fluid turbulence waves (luxurious viscous flow)
    float w1 = sin(fluidUv.x * 3.2 + uTime * 0.45 + fluidUv.y * 2.6) * 0.065;
    float w2 = cos(fluidUv.y * 4.0 - uTime * 0.55 + w1 * 2.0) * 0.045;
    float turbulence = w1 + w2;
    
    // Slow drifting liquid color core (smoothed square root eliminates any color singularity)
    vec2 bgCenter = vec2(0.35, 0.65) + vec2(sin(uTime * 0.25), cos(uTime * 0.35)) * 0.035;
    vec2 dCore = fluidUv - bgCenter;
    float bgDist = sqrt(dot(dCore, dCore) + 0.001) + turbulence;
    
    vec3 cBg = vec3(0.015, 0.015, 0.02);
    vec3 cCyan = vec3(0.0, 0.94, 1.0);
    vec3 cOrange = vec3(1.0, 0.33, 0.0);
    vec3 cWhite = vec3(1.0, 1.0, 1.0);
    
    // Silky smooth color gradient transitions
    vec3 col = cOrange;
    if (bgDist < 0.20) {
        col = mix(cWhite, cOrange, smoothstep(0.0, 0.20, bgDist));
    } else if (bgDist < 0.50) {
        float t = smoothstep(0.20, 0.50, bgDist);
        col = mix(cOrange, cCyan, t);
    } else {
        float t = smoothstep(0.50, 0.82, bgDist);
        col = mix(cCyan, cBg, t);
    }
    
    // Gentle wave shimmer on the cyan gradient
    col += sin(fluidUv.x * 4.5 + uTime * 0.35 + fluidUv.y * 4.5) * 0.025 * cCyan;
    
    // Soft, smooth cursor interaction glow (Gaussian, completely uniform)
    col += cWhite * mouseInf * 0.18;
    
    // Soft Fresnel rim glow that wraps smoothly along the deforming boundary
    float fresnel = pow(1.0 - max(0.0, normal.z), 2.4);
    col = mix(col, cCyan, fresnel * 0.5);
    col += cWhite * pow(fresnel, 5.0) * 0.35;
    
    // Broad, silky specular liquid reflection
    vec3 lightDir = normalize(vec3(-0.35, 0.55, 0.75));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(0.0, dot(normal, halfVec)), 20.0);
    col += cWhite * spec * 0.45;
    
    // Volume depth gradient along outer rim (smooth Cartesian falloff)
    float volumeShadow = smoothstep(0.35, 1.1, dot(normXY, normXY));
    col = mix(col, col * 0.45, volumeShadow * 0.45);
    
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
  const { viewport, gl } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const spring = useRef({ value: 0.01, velocity: 0 });
  const targetMouse = useRef({ x: 0.5, y: 0.5 });
  const currentMouse = useRef({ x: 0.5, y: 0.5 });
  const mouseVel = useRef({ x: 0, y: 0 });
  const lastTarget = useRef({ x: 0.5, y: 0.5, time: performance.now() });
  
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseVel: { value: new THREE.Vector2(0, 0) },
    }),
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const x = (e.clientX - rect.left) / rect.width;
        // WebGL Y is inverted relative to DOM Y
        const y = 1.0 - ((e.clientY - rect.top) / rect.height);

        const now = performance.now();
        const dt = Math.max((now - lastTarget.current.time) / 1000, 0.001);

        targetMouse.current.x = x;
        targetMouse.current.y = y;

        // Smooth velocity calculation with damping
        const vx = (x - lastTarget.current.x) / dt;
        const vy = (y - lastTarget.current.y) / dt;
        mouseVel.current.x = THREE.MathUtils.lerp(mouseVel.current.x, THREE.MathUtils.clamp(vx, -2.5, 2.5), 0.25);
        mouseVel.current.y = THREE.MathUtils.lerp(mouseVel.current.y, THREE.MathUtils.clamp(vy, -2.5, 2.5), 0.25);

        lastTarget.current = { x, y, time: now };
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [gl]);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;

    // Smooth, viscous fluid tracking: responsive yet completely removes suddenness/jitter
    const lerpFactor = 1.0 - Math.exp(-16.0 * delta);
    currentMouse.current.x = THREE.MathUtils.lerp(currentMouse.current.x, targetMouse.current.x, lerpFactor);
    currentMouse.current.y = THREE.MathUtils.lerp(currentMouse.current.y, targetMouse.current.y, lerpFactor);
    uniforms.uMouse.value.set(currentMouse.current.x, currentMouse.current.y);

    // Decay velocity smoothly
    mouseVel.current.x *= 0.90;
    mouseVel.current.y *= 0.90;
    uniforms.uMouseVel.value.set(mouseVel.current.x, mouseVel.current.y);

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

interface Capability {
  id: string;
  title: string;
  category: string;
  shortDesc: string;
  description: string;
  tags: string[];
  metrics: { label: string; val: string }[];
  icon: React.ComponentType<{ className?: string }>;
}

const CAPABILITIES: Capability[] = [
  {
    id: '01',
    title: 'MULTI-LOADER SUPPORT',
    category: 'RUNTIME & ENGINES',
    shortDesc: 'Vanilla, Paper, Fabric, Forge, & NeoForge with a single click',
    description: 'Create Vanilla, Paper, Fabric, Forge, and NeoForge servers with a single click.',
    tags: ['Vanilla', 'Paper', 'Fabric', 'Forge', 'NeoForge', '1-Click Setup'],
    metrics: [
      { label: 'SUPPORTED ENGINES', val: '5 LOADERS' },
      { label: 'PROVISION TIME', val: '< 3 SEC' },
      { label: 'CUSTOM JARS', val: 'SUPPORTED' },
    ],
    icon: Layers,
  },
  {
    id: '02',
    title: 'INTEGRATED MOD MANAGEMENT',
    category: 'CONTENT ECOSYSTEM',
    shortDesc: 'Browse, search, install & update CurseForge mods in-app',
    description: 'Browse, search, install, and update mods and modpacks directly from CurseForge within the app.',
    tags: ['CurseForge API', 'Modpacks', 'Auto-Dependencies', 'Hot-Swap'],
    metrics: [
      { label: 'MOD REPOSITORY', val: 'CURSEFORGE' },
      { label: 'AUTO-UPDATE', val: 'REAL-TIME' },
      { label: 'DEPENDENCIES', val: 'AUTO-RESOLVED' },
    ],
    icon: Sparkles,
  },
  {
    id: '03',
    title: 'AUTO-JAVA MANAGEMENT',
    category: 'RUNTIME ARCHITECTURE',
    shortDesc: 'Automatic Java 8, 16, 17, 21, or 25 mapping',
    description: 'Automatically downloads and maps the correct Java version (Java 8, 16, 17, 21, or 25) depending on your selected Minecraft version.',
    tags: ['Java 8', 'Java 16', 'Java 17', 'Java 21', 'Java 25', 'Isolated JDKs'],
    metrics: [
      { label: 'RUNTIMES', val: 'JDK 8 TO 25' },
      { label: 'ISOLATION', val: 'SANDBOXED' },
      { label: 'VERSION CONFLICTS', val: 'ZERO' },
    ],
    icon: Terminal,
  },
  {
    id: '04',
    title: 'DYNAMIC HARDWARE ALLOCATION',
    category: 'RESOURCE CONTROLLER',
    shortDesc: 'Scale maximum RAM usage & CPU limits with visual sliders',
    description: "Easily scale your server's maximum RAM usage and CPU core limits using visual sliders.",
    tags: ['RAM Scaling', 'CPU Affinity', 'Visual Sliders', 'Realtime Telemetry'],
    metrics: [
      { label: 'ALLOCATION', val: 'PER-CORE / SLIDER' },
      { label: 'MEMORY LIMIT', val: 'UNLOCKED' },
      { label: 'TELEMETRY', val: 'LIVE MONITOR' },
    ],
    icon: Sliders,
  },
  {
    id: '05',
    title: 'CLOUD TUNNELING ( FRP )',
    category: 'NETWORKING & MESH',
    shortDesc: 'Secure cloud tunnel with zero router port-forwarding',
    description: 'Expose your local servers to the internet using a secure cloud tunnel—no router port-forwarding required.',
    tags: ['FRP Protocol', 'Zero Port-Forward', 'CGNAT Bypass', 'TLS Encrypted'],
    metrics: [
      { label: 'LATENCY ADD', val: '< 2MS' },
      { label: 'PORT FORWARD', val: 'NOT NEEDED' },
      { label: 'ENCRYPTION', val: 'TLS END-TO-END' },
    ],
    icon: Globe,
  },
  {
    id: '06',
    title: 'SMART AUTO-START & AUTO-STOP',
    category: 'POWER & DAEMON',
    shortDesc: 'Inactivity idle shutdown & instant WakeProxy on player join',
    description: 'Save system resources with an inactivity monitor that shuts down the server when empty, and a WakeProxy that instantly spins the server up the moment a player attempts to connect.',
    tags: ['WakeProxy', 'Inactivity Monitor', 'Sub-Second Wake', 'Zero Idle RAM'],
    metrics: [
      { label: 'IDLE USAGE', val: '0% CPU / 0MB RAM' },
      { label: 'WAKE TIME', val: 'SUB-SECOND' },
      { label: 'RESOURCE SAVED', val: 'UP TO 95%' },
    ],
    icon: Zap,
  },
  {
    id: '07',
    title: 'BUILT-IN FILE MANAGER',
    category: 'STORAGE & CONFIG',
    shortDesc: 'Rich visual explorer for server properties, worlds & configs',
    description: 'A rich visual file explorer for modifying server properties, exploring worlds, and editing configurations without leaving the app.',
    tags: ['Server Properties', 'World Browser', 'In-App Editor', 'Diff Inspector'],
    metrics: [
      { label: 'EDITOR', val: 'SYNTAX-AWARE' },
      { label: 'WORLD BROWSER', val: 'EMBEDDED' },
      { label: 'HOT RELOAD', val: 'SUPPORTED' },
    ],
    icon: HardDrive,
  },
];

interface Contributor {
  id: string;
  code: string;
  name: string;
  handle: string;
  githubUrl?: string;
  role: string;
  specialty: string;
  commits: number;
  status: string;
  accentColor: string;
  tags: string[];
  bio: string;
  systemId: string;
}

const CONTRIBUTORS: Contributor[] = [
  {
    id: '0004-HUNT',
    code: 'CORE-01',
    name: 'Hunter SC',
    handle: '@hunterSC-code-07',
    githubUrl: 'https://github.com/hunterSC-code-07',
    role: 'Core Contributor',
    specialty: 'Engine Systems & Backend Infrastructure',
    commits: 284,
    status: 'ACCESS_ACTIVE',
    accentColor: '#00F0FF',
    systemId: 'ARCH_CORE_DAEMON',
    bio: 'Lead architect of the OmniHost core engine daemon, low-level process isolation sandbox, and low-latency IPC networking primitives.',
    tags: ['Daemon Kernel', 'Low-Level IPC', 'Process Isolation', 'Memory Sandbox', 'Cross-Platform Engine']
  },
  {
    id: '0004-OSIR',
    code: 'CORE-02',
    name: "Panthera 'Osiris'",
    handle: '@OsirisREx314',
    githubUrl: 'https://github.com/OsirisREx314',
    role: 'Core Contributor',
    specialty: 'Server Orchestration & Daemon Protocols',
    commits: 197,
    status: 'ACCESS_ACTIVE',
    accentColor: '#00F0FF',
    systemId: 'ORCH_DAEMON_PROTO',
    bio: 'Designed and implemented the multi-instance server orchestration state machine, WakeProxy automated sleep/resume triggers, and daemon communication protocols.',
    tags: ['State Machine', 'Daemon IPC', 'Subprocess Lifecycle', 'FRP Mesh', 'Resource Governor']
  },
  {
    id: '0004-NIGH',
    code: 'CORE-03',
    name: 'Nightwolf',
    handle: '@cayde61406-bot',
    githubUrl: 'https://github.com/cayde61406-bot',
    role: 'Automation Engineer',
    specialty: 'CI/CD Pipelines & Bot Automation',
    commits: 143,
    status: 'ACCESS_ACTIVE',
    accentColor: '#FF5500',
    systemId: 'AUTO_PIPELINE_BOT',
    bio: 'Architect of OmniHost continuous deployment infrastructure, release matrix runners, automated verification bots, and cross-platform binary signing pipelines.',
    tags: ['CI/CD Runners', 'Bot Framework', 'Release Pipeline', 'Build Matrix', 'Artifact Attestation']
  },
  {
    id: '0004-TENN',
    code: 'CORE-04',
    name: 'Tenno',
    handle: '@UmbralGamer',
    githubUrl: 'https://github.com/UmbralGamer',
    role: 'Core Contributor',
    specialty: 'Engine Subsystems & Mod Integrations',
    commits: 156,
    status: 'ACCESS_ACTIVE',
    accentColor: '#00F0FF',
    systemId: 'MOD_SUBSYSTEM_BRIDGE',
    bio: 'Engineered the unified loader bridge supporting Fabric, Forge, Paper, NeoForge, and automated CurseForge dependency graph resolution.',
    tags: ['CurseForge Bridge', 'Mod Dependency Solver', 'Version Resolver', 'Fabric/Forge Hook', 'Auto-Java Mapping']
  },
  {
    id: '0004-AVAL',
    code: 'QA-01',
    name: 'Avalon',
    handle: 'QA TEAM',
    role: 'QA Engineer',
    specialty: 'Game Server Testing & Fault Tolerance',
    commits: 64,
    status: 'ACCESS_ACTIVE',
    accentColor: '#10B981',
    systemId: 'QA_STRESS_FAULT',
    bio: 'Leads server cluster stress testing, chaos engineering, high-load player connection simulations, and packet loss resilience audits.',
    tags: ['Chaos Testing', 'Load Simulator', 'Packet Stress', 'Fault Recovery', 'Edge Node Profiling']
  },
  {
    id: '0004-TIME',
    code: 'QA-02',
    name: 'Timecop CB',
    handle: 'QA TEAM',
    role: 'QA Engineer',
    specialty: 'Performance Regression & Build Verification',
    commits: 52,
    status: 'ACCESS_ACTIVE',
    accentColor: '#10B981',
    systemId: 'QA_REGRESSION_AUDIT',
    bio: 'Focuses on automated latency benchmarks, runtime memory profiling, JVM GC pause regressions, and cross-build verification.',
    tags: ['Regression Suite', 'Leak Detection', 'Telemetry Profiling', 'Build Sanity', 'Benchmark Matrix']
  },
  {
    id: '0004-KRUZ',
    code: 'CORE-05',
    name: 'Cassie',
    handle: '@kruz-xx',
    githubUrl: 'https://github.com/kruz-xx',
    role: 'Website Creator & Frontend Lead',
    specialty: 'Next.js, UI/UX Design & Site Architecture',
    commits: 312,
    status: 'ACCESS_ACTIVE',
    accentColor: '#00F0FF',
    systemId: 'FRONTEND_SITE_LEAD',
    bio: 'Creator of the OmniHost web ecosystem, brutalist blueprint design system, fluid real-time WebGL liquid shaders, and interactive telemetry interfaces.',
    tags: ['Design System', 'Fluid WebGL Shaders', 'Brutalist HUD', 'Motion Framework', 'Fullstack Architecture']
  }
];

const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const ContributorBioScan = ({ code }: { code: string }) => {
  if (code === 'CORE-01') {
    // Hunter SC: Hooded cybernetic operative
    return (
      <svg className="w-24 h-24 text-cyan" viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <path d="M50 12 L22 35 L28 85 L50 92 L72 85 L78 35 Z" strokeWidth="1.5" fill="rgba(0,240,255,0.04)" />
        <path d="M36 38 L50 25 L64 38 L60 62 L50 70 L40 62 Z" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M42 48 L48 50 L42 52" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" />
        <path d="M58 48 L52 50 L58 52" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="25" x2="50" y2="70" strokeWidth="1" strokeOpacity="0.4" />
        <circle cx="50" cy="50" r="32" stroke="#00F0FF" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="4 6" />
      </svg>
    );
  }
  if (code === 'CORE-02') {
    // Panthera 'Osiris': Monolithic geometric block mark
    return (
      <svg className="w-24 h-24 text-cyan" viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <rect x="25" y="25" width="50" height="50" strokeWidth="1.5" fill="rgba(0,240,255,0.03)" />
        <path d="M35 35 L65 35 L65 65 L35 65 Z" strokeWidth="1.2" />
        <line x1="25" y1="25" x2="75" y2="75" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="75" y1="25" x2="25" y2="75" strokeWidth="1" strokeOpacity="0.5" />
        <rect x="42" y="42" width="16" height="16" fill="#00F0FF" fillOpacity="0.15" stroke="#00F0FF" strokeWidth="1.5" />
      </svg>
    );
  }
  if (code === 'CORE-03') {
    // Nightwolf: Tactical mech combat visage
    return (
      <svg className="w-24 h-24 text-orange" viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <polygon points="50,15 26,38 32,75 50,88 68,75 74,38" strokeWidth="1.5" fill="rgba(255,85,0,0.04)" />
        <line x1="26" y1="38" x2="50" y2="52" strokeWidth="1.2" />
        <line x1="74" y1="38" x2="50" y2="52" strokeWidth="1.2" />
        <polygon points="40,55 50,48 60,55 50,68" stroke="#FF5500" strokeWidth="1.5" fill="rgba(255,85,0,0.15)" />
        <line x1="15" y1="50" x2="85" y2="50" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="3 3" />
        <line x1="50" y1="15" x2="50" y2="85" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="3 3" />
      </svg>
    );
  }
  if (code === 'CORE-04') {
    // Tenno: Modular isometric quantum cube
    return (
      <svg className="w-24 h-24 text-cyan" viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <path d="M50 20 L76 35 L76 65 L50 80 L24 65 L24 35 Z" strokeWidth="1.5" fill="rgba(0,240,255,0.03)" />
        <line x1="50" y1="20" x2="50" y2="50" strokeWidth="1.5" />
        <line x1="76" y1="35" x2="50" y2="50" strokeWidth="1.5" />
        <line x1="24" y1="35" x2="50" y2="50" strokeWidth="1.5" />
        <line x1="50" y1="50" x2="50" y2="80" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="6" fill="#00F0FF" />
      </svg>
    );
  }
  if (code === 'QA-01') {
    // Avalon: Angular mecha helmet
    return (
      <svg className="w-24 h-24 text-emerald-400" viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <polygon points="50,18 25,32 30,78 50,90 70,78 75,32" strokeWidth="1.5" fill="rgba(52,211,153,0.04)" />
        <path d="M35 45 L50 38 L65 45 L62 60 L50 68 L38 60 Z" strokeWidth="1.2" />
        <line x1="38" y1="52" x2="62" y2="52" stroke="#34D399" strokeWidth="2" />
        <circle cx="50" cy="52" r="2" fill="#34D399" />
      </svg>
    );
  }
  if (code === 'QA-02') {
    // Timecop CB: Temporal frequency rings
    return (
      <svg className="w-24 h-24 text-emerald-400" viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <circle cx="50" cy="50" r="34" strokeWidth="1.5" strokeDasharray="6 4" />
        <circle cx="50" cy="50" r="22" strokeWidth="1.2" fill="rgba(52,211,153,0.05)" />
        <polygon points="50,30 65,58 35,58" stroke="#34D399" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="4" fill="#34D399" />
      </svg>
    );
  }
  // Default / CORE-05 (Cassie): Cyberpunk lead architect neural node
  return (
    <svg className="w-24 h-24 text-cyan" viewBox="0 0 100 100" fill="none" stroke="currentColor">
      <circle cx="50" cy="50" r="32" strokeWidth="1.5" fill="rgba(0,240,255,0.03)" />
      <polygon points="50,22 74,40 68,76 32,76 26,40" strokeWidth="1.2" strokeDasharray="4 4" />
      <circle cx="50" cy="42" r="10" strokeWidth="1.5" />
      <path d="M36 76 C36 62 42 56 50 56 C58 56 64 62 64 76" strokeWidth="1.5" />
      <circle cx="50" cy="42" r="3" fill="#00F0FF" />
    </svg>
  );
};

const CreatorCard = ({ 
  item, 
  onSelect 
}: { 
  item: Contributor; 
  onSelect: () => void;
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-10%" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      onClick={onSelect}
      className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl border border-white/10 bg-[#0a0b0f]/85 hover:border-cyan/50 hover:bg-[#0d0f17] transition-all duration-500 cursor-pointer overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_50px_rgba(0,240,255,0.12)]"
    >
      {/* Background blueprint crosshairs at corners */}
      <svg className="absolute top-2 left-2 w-2.5 h-2.5 text-white/20 group-hover:text-cyan/50 transition-colors" viewBox="0 0 10 10" fill="none" stroke="currentColor">
        <path d="M5 0v10M0 5h10" />
      </svg>
      <svg className="absolute top-2 right-2 w-2.5 h-2.5 text-white/20 group-hover:text-cyan/50 transition-colors" viewBox="0 0 10 10" fill="none" stroke="currentColor">
        <path d="M5 0v10M0 5h10" />
      </svg>

      {/* Top telemetry bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-400 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          <span>{item.status}</span>
        </div>
        <span className="font-mono text-[10px] text-white/40 tracking-widest uppercase">
          ID: {item.id}
        </span>
      </div>

      {/* Center Visual Showcase Box (The Offbrand "Featured Work" Visual inside the card) */}
      <div className="relative aspect-[4/3] w-full my-5 rounded-xl overflow-hidden bg-black/60 border border-white/10 group-hover:border-cyan/40 transition-all duration-500 flex items-center justify-center p-4">
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '16px 16px'
          }}
        />

        {/* Ambient glow behind avatar */}
        <div 
          className="absolute w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
          style={{ backgroundColor: item.accentColor }}
        />

        {/* Avatar Graphic: GitHub avatar or stylized SVG bio-scan */}
        <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
          {!imgError && item.githubUrl ? (
            <img 
              src={`${item.githubUrl}.png`} 
              alt={item.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover rounded-lg border border-white/20 shadow-lg"
            />
          ) : (
            <ContributorBioScan code={item.code} />
          )}
        </div>

        {/* Corner HUD scan label */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div className="border border-cyan/40 bg-black/80 backdrop-blur-sm px-2 py-0.5 text-[9px] font-mono text-cyan tracking-widest flex items-center gap-1.5">
            <span className="w-1 h-1 bg-cyan rounded-full" />
            <span>BIO_SCAN: OK</span>
          </div>
          <span className="text-[9px] font-mono text-white/30 tracking-widest uppercase">
            {item.systemId}
          </span>
        </div>
      </div>

      {/* Role & Specialty information */}
      <div className="mb-4">
        <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-0.5">
          ROLE
        </div>
        <div className="text-sm font-bold text-white tracking-wide mb-2.5 flex items-center gap-2">
          {item.role}
        </div>

        <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-0.5">
          SPECIALTY
        </div>
        <div className="text-xs font-mono text-white/60 leading-relaxed line-clamp-2">
          {item.specialty}
        </div>
      </div>

      {/* Signature Offbrand Bottom Bar */}
      <div className="border-t border-white/10 pt-4 mt-auto flex items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-white group-hover:text-cyan transition-colors duration-300 leading-none mb-1">
            {item.name}
          </h3>
          <div className="flex items-center gap-2 text-[11px] font-mono text-white/40 group-hover:text-white/60 transition-colors">
            <span>{item.handle}</span>
            <span>•</span>
            <span className="text-cyan font-bold">{item.commits} COMMITS</span>
            <span>•</span>
            <span>{item.code}</span>
          </div>
        </div>

        {/* Offbrand '+' button */}
        <div className="w-10 h-10 rounded-full border border-white/20 group-hover:border-cyan group-hover:bg-cyan text-white group-hover:text-black flex items-center justify-center shrink-0 transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0)] group-hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        </div>
      </div>
    </motion.div>
  );
};

function App() {
  const heroRef = useRef<HTMLElement>(null);
  const [selectedCapability, setSelectedCapability] = useState<Capability | null>(null);
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCapability(null);
        setSelectedContributor(null);
      } else if (e.key === 'ArrowRight') {
        if (selectedCapability) {
          const idx = CAPABILITIES.findIndex(c => c.id === selectedCapability.id);
          if (idx < CAPABILITIES.length - 1) setSelectedCapability(CAPABILITIES[idx + 1]);
        } else if (selectedContributor) {
          const idx = CONTRIBUTORS.findIndex(c => c.id === selectedContributor.id);
          if (idx < CONTRIBUTORS.length - 1) setSelectedContributor(CONTRIBUTORS[idx + 1]);
        }
      } else if (e.key === 'ArrowLeft') {
        if (selectedCapability) {
          const idx = CAPABILITIES.findIndex(c => c.id === selectedCapability.id);
          if (idx > 0) setSelectedCapability(CAPABILITIES[idx - 1]);
        } else if (selectedContributor) {
          const idx = CONTRIBUTORS.findIndex(c => c.id === selectedContributor.id);
          if (idx > 0) setSelectedContributor(CONTRIBUTORS[idx - 1]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCapability, selectedContributor]);
  
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
  // Subtle initial stagger inspired by Offbrand, spaced gracefully without being too extreme
  const topTextX = useTransform(heroScroll, [0, 1], ["-6vw", "-120vw"]);
  const middleTextX = useTransform(heroScroll, [0, 1], ["7vw", "120vw"]);
  const bottomTextX = useTransform(heroScroll, [0, 1], ["-5vw", "-120vw"]);
  
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
        <a 
          href="https://github.com/hunterSC-code-07/OmniHost"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-bold uppercase text-sm border-b border-white hover:text-cyan hover:border-cyan transition-colors pointer-events-auto"
        >
          Download <ArrowUpRight className="w-4 h-4" />
        </a>
      </nav>

      {/* Hero Section */}
      <main ref={heroRef} className="relative h-[130vh]">
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center px-6 overflow-hidden">
          
          {/* Foreground Typography */}
          <motion.div 
            style={{ x: springX, y: springY }}
            className="flex flex-col items-center text-center z-10 w-full relative mix-blend-difference pointer-events-none gap-2 sm:gap-4 md:gap-6"
          >
            
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div style={{ x: topTextX, opacity: textOpacity }}>
                <div className="font-display text-[10vw] md:text-[8.8vw] lg:text-[8vw] leading-[0.9] tracking-tight uppercase m-0 text-white">
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
                <div className="font-display text-[10vw] md:text-[8.8vw] lg:text-[8vw] leading-[0.9] tracking-tight uppercase m-0 text-outline-white">
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
                <div className="font-display text-[10vw] md:text-[8.8vw] lg:text-[8vw] leading-[0.9] tracking-tight uppercase m-0 text-white">
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
        <div className="w-full md:w-3/4 grid grid-cols-2 md:grid-cols-4 relative border-l border-t border-white/10">
           {SUPPORTED_GAMES.map((game, i) => (
             <div key={game} className="relative aspect-video flex items-center justify-center border-r border-b border-white/10 group hover:bg-white/5 transition-colors cursor-default">
                <span className="font-display text-xl text-white/80 tracking-widest group-hover:text-cyan transition-colors">{game}</span>
                
                {/* Crosshair (Plus marker) at top right for top row items */}
                {i < 4 && (
                  <svg 
                    className={`absolute -top-1.5 -right-1.5 w-3 h-3 text-white/30 z-10 ${i >= 2 ? 'hidden md:block' : ''}`} 
                    viewBox="0 0 12 12" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1"
                  >
                    <path d="M6 0v12M0 6h12" />
                  </svg>
                )}

                {/* Additional crosshair at top left for the first item */}
                {i === 0 && (
                  <svg 
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 text-white/30 z-10" 
                    viewBox="0 0 12 12" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1"
                  >
                    <path d="M6 0v12M0 6h12" />
                  </svg>
                )}

                {/* Crosshair (Plus marker) at bottom right of each cell */}
                <svg className="absolute -bottom-1.5 -right-1.5 w-3 h-3 text-white/30 z-10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M6 0v12M0 6h12" />
                </svg>

                {/* Additional crosshair at bottom left for the first item in each row */}
                {(i % 4 === 0) && (
                  <svg className="absolute -bottom-1.5 -left-1.5 w-3 h-3 text-white/30 z-10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M6 0v12M0 6h12" />
                  </svg>
                )}
                {(i === 2 || i === 6) && (
                  <svg className="absolute -bottom-1.5 -left-1.5 w-3 h-3 text-white/30 z-10 block md:hidden" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M6 0v12M0 6h12" />
                  </svg>
                )}
             </div>
           ))}
        </div>
      </motion.section>

      {/* Features Hover Reveal & Interactive Inspection Section */}
      <motion.section 
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-10%" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="min-h-screen relative z-10 py-32 px-6 flex flex-col justify-center max-w-7xl mx-auto"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-orange shadow-[0_0_10px_rgba(255,85,0,0.8)] animate-pulse" />
              <p className="text-orange text-xs font-mono uppercase tracking-widest">
                /03 CORE ENGINE ARCHITECTURE
              </p>
            </div>
            <h2 className="font-display text-4xl md:text-6xl text-white uppercase tracking-tight">
              CAPABILITIES
            </h2>
          </div>
          <div className="border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-mono text-white/50 tracking-widest flex items-center gap-2 self-start md:self-auto">
            <span className="text-cyan">//</span> CLICK ANY CAPABILITY TO INSPECT
          </div>
        </div>

        <div className="flex flex-col w-full relative z-20">
          {CAPABILITIES.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-10%" }}
              onClick={() => setSelectedCapability(item)}
              className="group border-b border-white/10 py-6 sm:py-7 relative cursor-pointer hover:border-cyan/50 hover:bg-white/[0.015] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 sm:px-4"
            >
              {/* Left Side: ID, Icon, Title */}
              <div className="flex items-center gap-4 sm:gap-6">
                <span className="font-mono text-sm sm:text-base text-white/30 group-hover:text-cyan font-bold tracking-widest transition-colors duration-300">
                  {item.id}
                </span>
                <div className="p-2 border border-white/10 group-hover:border-cyan/50 group-hover:bg-cyan/10 text-white/40 group-hover:text-cyan transition-colors duration-300 hidden sm:flex items-center justify-center">
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="font-display text-[6.5vw] md:text-[3.8vw] lg:text-[3.2vw] uppercase tracking-tighter leading-none text-text-muted group-hover:text-white transition-colors duration-300 pointer-events-auto">
                  {item.title}
                </h3>
              </div>

              {/* Right Side: Category tag & stylized click cue */}
              <div className="flex items-center gap-4 self-end md:self-center">
                <span className="hidden lg:inline-block text-[11px] font-mono text-white/30 group-hover:text-cyan/70 tracking-wider transition-colors duration-300 uppercase">
                  {item.category}
                </span>
                <span className="border border-white/10 group-hover:border-cyan group-hover:bg-cyan/10 text-white/40 group-hover:text-cyan px-3 py-1.5 text-xs font-mono tracking-widest uppercase transition-all duration-300 flex items-center gap-2">
                  INSPECT <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Creators / Contributors Section (Inspired by Offbrand's Featured Work Grid) */}
      <section 
        id="creators"
        className="min-h-screen relative z-10 py-32 px-6 max-w-7xl mx-auto w-full border-t border-white/10"
      >
        <div className="flex flex-col md:flex-row gap-12 lg:gap-16 items-start">
          
          {/* Sticky Left Column */}
          <div className="w-full md:w-1/3 md:sticky md:top-28 self-start">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-cyan shadow-[0_0_10px_rgba(0,240,255,0.8)] animate-pulse" />
              <p className="text-cyan text-xs font-mono uppercase tracking-widest">
                /04 CONTRIBUTORS
              </p>
            </div>
            
            <div className="flex items-baseline gap-3 mb-6">
              <h2 className="font-display text-5xl md:text-6xl text-white uppercase tracking-tight">
                CREATORS
              </h2>
              <span className="font-mono text-sm text-cyan/70 font-bold border border-cyan/30 px-2 py-0.5 rounded-sm">
                07
              </span>
            </div>

            <p className="text-white/50 text-sm md:text-base leading-relaxed mb-8 font-sans">
              The core architects, low-level daemon engineers, and interface designers building OmniHost's next-generation bare-metal server infrastructure.
            </p>

            <a
              href="https://github.com/hunterSC-code-07/OmniHost"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 hover:border-cyan text-xs font-mono uppercase tracking-widest text-white hover:text-cyan hover:bg-cyan/10 transition-all duration-300 group"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>VIEW REPOSITORY</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* Telemetry Micro Stats */}
            <div className="grid grid-cols-2 gap-3 mt-12 pt-8 border-t border-white/10">
              <div className="border border-white/5 bg-white/[0.015] p-3">
                <div className="text-[9px] font-mono text-white/40 uppercase tracking-wider mb-1">TOTAL COMMITS</div>
                <div className="font-mono text-lg font-bold text-cyan">1,208+</div>
              </div>
              <div className="border border-white/5 bg-white/[0.015] p-3">
                <div className="text-[9px] font-mono text-white/40 uppercase tracking-wider mb-1">TEAM ROSTER</div>
                <div className="font-mono text-lg font-bold text-white">07 ACTIVE</div>
              </div>
            </div>
          </div>

          {/* Right Staggered Column Grid (2 Columns, Offset Masonry) */}
          <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {/* Column 1 */}
            <div className="flex flex-col gap-6 lg:gap-8">
              {CONTRIBUTORS.filter((_, i) => i % 2 === 0).map((item) => (
                <CreatorCard 
                  key={item.id} 
                  item={item} 
                  onSelect={() => setSelectedContributor(item)} 
                />
              ))}
            </div>

            {/* Column 2 (Staggered Down for Masonry Fluidity) */}
            <div className="flex flex-col gap-6 lg:gap-8 sm:pt-16 lg:pt-20">
              {CONTRIBUTORS.filter((_, i) => i % 2 === 1).map((item) => (
                <CreatorCard 
                  key={item.id} 
                  item={item} 
                  onSelect={() => setSelectedContributor(item)} 
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 text-center z-10 relative pointer-events-none">
        <h2 className="font-display text-[15vw] leading-none text-outline-white opacity-20">OMNIHOST</h2>
        <p className="text-text-muted mt-8">DESIGNED DIFFERENT.</p>
      </footer>

      {/* Stylized Pop Modal for Contributor Inspection */}
      <AnimatePresence>
        {selectedContributor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedContributor(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-[#090a0f] border border-cyan/40 shadow-[0_0_60px_rgba(0,240,255,0.18)] p-6 sm:p-8 md:p-10 overflow-hidden"
            >
              {/* Blueprint Corner Crosshairs */}
              <svg className="absolute -top-1.5 -left-1.5 w-3 h-3 text-cyan z-20" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 0v12M0 6h12" />
              </svg>
              <svg className="absolute -top-1.5 -right-1.5 w-3 h-3 text-cyan z-20" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 0v12M0 6h12" />
              </svg>
              <svg className="absolute -bottom-1.5 -left-1.5 w-3 h-3 text-cyan z-20" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 0v12M0 6h12" />
              </svg>
              <svg className="absolute -bottom-1.5 -right-1.5 w-3 h-3 text-cyan z-20" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 0v12M0 6h12" />
              </svg>

              {/* Ambient Glow */}
              <div 
                className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none -z-10 opacity-30" 
                style={{ backgroundColor: selectedContributor.accentColor }}
              />

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-3 font-mono text-xs text-white/50 tracking-widest uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                  <span>PERSONNEL // {selectedContributor.id}</span>
                  <span className="text-white/20">•</span>
                  <span className="text-cyan font-bold">{selectedContributor.code}</span>
                </div>
                <button
                  onClick={() => setSelectedContributor(null)}
                  className="border border-white/20 hover:border-cyan text-white/60 hover:text-cyan p-1.5 transition-colors group cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>

              {/* Profile Bar */}
              <div className="flex items-start gap-4 sm:gap-6 mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 p-2 border border-cyan/50 bg-cyan/10 text-cyan shrink-0 shadow-[0_0_20px_rgba(0,240,255,0.15)] flex items-center justify-center rounded-lg overflow-hidden">
                  <ContributorBioScan code={selectedContributor.code} />
                </div>
                <div>
                  <h3 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight text-white leading-[0.95] mb-2">
                    {selectedContributor.name}
                  </h3>
                  <div className="flex items-center gap-2 font-mono text-xs text-cyan tracking-wider">
                    <span>{selectedContributor.handle}</span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/60 font-bold">{selectedContributor.role}</span>
                  </div>
                </div>
              </div>

              {/* Specialty & Bio */}
              <div className="relative border-l-2 border-cyan bg-white/[0.02] p-5 sm:p-6 mb-6">
                <div className="text-[10px] font-mono text-cyan/70 uppercase tracking-widest mb-1.5">
                  // SPECIALTY FOCUS & DIRECTIVES
                </div>
                <p className="text-white/90 text-sm sm:text-base leading-relaxed font-sans mb-3 font-medium">
                  {selectedContributor.specialty}
                </p>
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed font-sans">
                  {selectedContributor.bio}
                </p>
              </div>

              {/* Subsystem Capabilities Tags */}
              <div className="mb-6">
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2.5">
                  SYSTEM RESPONSIBILITIES & MODULES
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedContributor.tags.map((tag) => (
                    <span key={tag} className="border border-white/15 bg-white/5 px-3 py-1 text-xs font-mono text-white/80 tracking-wide">
                      +{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 mb-8">
                <div className="border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-[9px] font-mono text-white/40 uppercase tracking-wider mb-1">VERIFIED COMMITS</div>
                  <div className="text-sm font-mono text-cyan font-bold">{selectedContributor.commits} COMMITS</div>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-[9px] font-mono text-white/40 uppercase tracking-wider mb-1">ACCESS STATUS</div>
                  <div className="text-sm font-mono text-emerald-400 font-bold">VERIFIED_ACTIVE</div>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-[9px] font-mono text-white/40 uppercase tracking-wider mb-1">SYSTEM NODE</div>
                  <div className="text-sm font-mono text-white/80 font-bold">{selectedContributor.systemId}</div>
                </div>
              </div>

              {/* Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const idx = CONTRIBUTORS.findIndex(c => c.id === selectedContributor.id);
                      if (idx > 0) setSelectedContributor(CONTRIBUTORS[idx - 1]);
                    }}
                    disabled={CONTRIBUTORS.findIndex(c => c.id === selectedContributor.id) === 0}
                    className="border border-white/15 hover:border-cyan disabled:opacity-25 disabled:pointer-events-none text-white/70 hover:text-cyan px-3 py-1.5 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> PREV
                  </button>
                  <button
                    onClick={() => {
                      const idx = CONTRIBUTORS.findIndex(c => c.id === selectedContributor.id);
                      if (idx < CONTRIBUTORS.length - 1) setSelectedContributor(CONTRIBUTORS[idx + 1]);
                    }}
                    disabled={CONTRIBUTORS.findIndex(c => c.id === selectedContributor.id) === CONTRIBUTORS.length - 1}
                    className="border border-white/15 hover:border-cyan disabled:opacity-25 disabled:pointer-events-none text-white/70 hover:text-cyan px-3 py-1.5 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    NEXT <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {selectedContributor.githubUrl && (
                    <a
                      href={selectedContributor.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-white/20 hover:border-cyan hover:bg-cyan/10 text-white hover:text-cyan px-3.5 py-1.5 text-xs font-mono uppercase tracking-widest flex items-center gap-2 transition-colors"
                    >
                      <GithubIcon className="w-3.5 h-3.5" />
                      <span>GITHUB</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedContributor(null)}
                    className="border border-cyan bg-cyan/10 hover:bg-cyan hover:text-black text-cyan px-4 py-1.5 text-xs font-mono uppercase font-bold tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    CLOSE [ESC]
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stylized Pop Modal for Capability Inspection */}
      <AnimatePresence>
        {selectedCapability && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCapability(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-[#090a0f] border border-cyan/40 shadow-[0_0_60px_rgba(0,240,255,0.18)] p-6 sm:p-8 md:p-10 overflow-hidden"
            >
              {/* Blueprint Corner Crosshairs */}
              <svg className="absolute -top-1.5 -left-1.5 w-3 h-3 text-cyan z-20" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 0v12M0 6h12" />
              </svg>
              <svg className="absolute -top-1.5 -right-1.5 w-3 h-3 text-cyan z-20" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 0v12M0 6h12" />
              </svg>
              <svg className="absolute -bottom-1.5 -left-1.5 w-3 h-3 text-cyan z-20" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 0v12M0 6h12" />
              </svg>
              <svg className="absolute -bottom-1.5 -right-1.5 w-3 h-3 text-cyan z-20" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 0v12M0 6h12" />
              </svg>

              {/* Ambient Glow */}
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan/10 rounded-full blur-3xl pointer-events-none -z-10" />

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-3 font-mono text-xs text-white/50 tracking-widest uppercase">
                  <span className="w-2 h-2 rounded-full bg-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] animate-pulse" />
                  <span>SUBSYSTEM // {selectedCapability.id} OF 07</span>
                  <span className="text-white/20">•</span>
                  <span className="text-cyan font-bold">{selectedCapability.category}</span>
                </div>
                <button
                  onClick={() => setSelectedCapability(null)}
                  className="border border-white/20 hover:border-cyan text-white/60 hover:text-cyan p-1.5 transition-colors group cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>

              {/* Icon & Title */}
              <div className="flex items-start gap-4 sm:gap-5 mb-6">
                <div className="p-3.5 sm:p-4 border border-cyan/50 bg-cyan/10 text-cyan shrink-0 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                  <selectedCapability.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h3 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight text-white leading-[0.95] mb-2">
                    {selectedCapability.title}
                  </h3>
                  <p className="text-xs font-mono text-cyan tracking-wider uppercase">
                    {selectedCapability.shortDesc}
                  </p>
                </div>
              </div>

              {/* Functional Description Box */}
              <div className="relative border-l-2 border-cyan bg-white/[0.02] p-5 sm:p-6 mb-6">
                <div className="text-[10px] font-mono text-cyan/70 uppercase tracking-widest mb-1.5">
                  // CAPABILITY SPECIFICATION
                </div>
                <p className="text-white/90 text-base sm:text-lg leading-relaxed font-sans font-normal">
                  {selectedCapability.description}
                </p>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2.5">
                  MODULE CAPABILITIES & ATTRIBUTES
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCapability.tags.map((tag) => (
                    <span key={tag} className="border border-white/15 bg-white/5 px-3 py-1 text-xs font-mono text-white/80 tracking-wide">
                      +{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 mb-8">
                {selectedCapability.metrics.map((m) => (
                  <div key={m.label} className="border border-white/10 bg-white/[0.02] p-3">
                    <div className="text-[9px] font-mono text-white/40 uppercase tracking-wider mb-1">{m.label}</div>
                    <div className="text-xs sm:text-sm font-mono text-cyan font-bold">{m.val}</div>
                  </div>
                ))}
              </div>

              {/* Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const idx = CAPABILITIES.findIndex(c => c.id === selectedCapability.id);
                      if (idx > 0) setSelectedCapability(CAPABILITIES[idx - 1]);
                    }}
                    disabled={CAPABILITIES.findIndex(c => c.id === selectedCapability.id) === 0}
                    className="border border-white/15 hover:border-cyan disabled:opacity-25 disabled:pointer-events-none text-white/70 hover:text-cyan px-3 py-1.5 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> PREV
                  </button>
                  <button
                    onClick={() => {
                      const idx = CAPABILITIES.findIndex(c => c.id === selectedCapability.id);
                      if (idx < CAPABILITIES.length - 1) setSelectedCapability(CAPABILITIES[idx + 1]);
                    }}
                    disabled={CAPABILITIES.findIndex(c => c.id === selectedCapability.id) === CAPABILITIES.length - 1}
                    className="border border-white/15 hover:border-cyan disabled:opacity-25 disabled:pointer-events-none text-white/70 hover:text-cyan px-3 py-1.5 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    NEXT <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => setSelectedCapability(null)}
                  className="border border-cyan bg-cyan/10 hover:bg-cyan hover:text-black text-cyan px-4 py-1.5 text-xs font-mono uppercase font-bold tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
                >
                  CLOSE [ESC]
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
