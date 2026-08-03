import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "./style.css";

const canvas = document.querySelector("#universe");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010207);
scene.fog = new THREE.FogExp2(0x010207, 0.000045);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.05, 70000);
camera.position.set(0, 320, 1450);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.035;
controls.enablePan = false;
controls.rotateSpeed = 0.35;
controls.zoomSpeed = 0.65;
controls.minDistance = 3;
controls.maxDistance = 18000;
controls.target.set(0, 0, 0);

const universe = new THREE.Group();
scene.add(universe);

const groups = {
  web: new THREE.Group(),
  galaxies: new THREE.Group(),
  landmarks: new THREE.Group(),
  grid: new THREE.Group()
};
Object.values(groups).forEach(g => universe.add(g));

const rand = mulberry32(42069420);
const TAU = Math.PI * 2;

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function gaussian() {
  let u = 0, v = 0;
  while (!u) u = rand();
  while (!v) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

function makePoints(count, positionFn, options = {}) {
  const pos = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const palette = options.palette || [new THREE.Color(0xffffff)];
  for (let i = 0; i < count; i++) {
    const p = positionFn(i);
    pos[i*3] = p.x; pos[i*3+1] = p.y; pos[i*3+2] = p.z;
    const c = palette[Math.floor(rand() * palette.length)];
    const lum = .65 + rand() * .55;
    colors[i*3] = Math.min(1, c.r * lum);
    colors[i*3+1] = Math.min(1, c.g * lum);
    colors[i*3+2] = Math.min(1, c.b * lum);
    sizes[i] = (options.sizeMin || .7) + rand() * (options.sizeMax || 2.4);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { uPixelRatio: { value: renderer.getPixelRatio() }, uOpacity: { value: options.opacity ?? 1 } },
    vertexShader: `
      attribute float aSize;
      varying vec3 vColor;
      uniform float uPixelRatio;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = min(8.0, aSize * uPixelRatio * (260.0 / max(1.0, -mv.z)));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      uniform float uOpacity;
      void main() {
        float d = length(gl_PointCoord - vec2(.5));
        if (d > .5) discard;
        float core = smoothstep(.5, 0.0, d);
        float glow = pow(core, 2.2);
        gl_FragColor = vec4(vColor * (1.0 + core * .7), glow * uOpacity);
      }`
  });
  return new THREE.Points(geo, mat);
}

// Deep star field
const starPalette = [
  new THREE.Color("#dbe7ff"),
  new THREE.Color("#fff4df"),
  new THREE.Color("#a8c3ff"),
  new THREE.Color("#f2d4ca")
];
const stars = makePoints(24000, () => {
  const r = 1700 + Math.pow(rand(), .42) * 12500;
  const theta = rand() * TAU;
  const phi = Math.acos(2 * rand() - 1);
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}, { palette: starPalette, sizeMin: 4, sizeMax: 14, opacity: .8 });
scene.add(stars);

// Cosmic web: clustered filaments
const nodes = Array.from({ length: 74 }, () => {
  const r = 3000 + rand() * 7000;
  const theta = rand() * TAU;
  const phi = Math.acos(2 * rand() - 1);
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi) * .72,
    r * Math.sin(phi) * Math.sin(theta)
  );
});
const webPositions = [];
nodes.forEach((n, i) => {
  const nearest = nodes
    .map((p, j) => ({ j, d: n.distanceTo(p) }))
    .filter(x => x.j !== i)
    .sort((a,b) => a.d-b.d)
    .slice(0, 2);
  nearest.forEach(({ j }) => {
    const p = nodes[j];
    const steps = 26;
    for (let s=0;s<steps;s++) {
      const t = s/(steps-1);
      const base = n.clone().lerp(p,t);
      const spread = 18 + Math.sin(t*Math.PI) * 70;
      for (let k=0;k<4;k++) {
        webPositions.push(base.clone().add(new THREE.Vector3(gaussian()*spread,gaussian()*spread,gaussian()*spread)));
      }
    }
  });
});
const webPoints = makePoints(webPositions.length, i => webPositions[i], {
  palette:[new THREE.Color("#7b88ff"), new THREE.Color("#a2b5ff"), new THREE.Color("#b38dff")],
  sizeMin: 8, sizeMax: 21, opacity:.18
});
groups.web.add(webPoints);

// Galaxy cloud concentrations
const galaxyPalette = [
  new THREE.Color("#aabfff"),
  new THREE.Color("#fff0d4"),
  new THREE.Color("#cbb6ff")
];
nodes.slice(0, 52).forEach((node, idx) => {
  const count = 80 + Math.floor(rand()*130);
  const cloud = makePoints(count, () => new THREE.Vector3(
      gaussian() * (90 + rand()*100),
      gaussian() * (65 + rand()*75),
      gaussian() * (90 + rand()*100)
    ), { palette: galaxyPalette, sizeMin: 10, sizeMax: 26, opacity:.42 });
  cloud.position.copy(node);
  groups.galaxies.add(cloud);
});

// Local Group / Milky Way inspired spiral galaxy
function makeSpiralGalaxy(radius=250, count=9000, arms=4) {
  return makePoints(count, () => {
    const r = Math.pow(rand(), .62) * radius;
    const arm = Math.floor(rand()*arms);
    const a = arm * TAU/arms + r*.033 + gaussian()*.16;
    const bulge = Math.max(0, 1-r/radius);
    return new THREE.Vector3(
      Math.cos(a)*r + gaussian()*(4+bulge*9),
      gaussian()*(2 + bulge*20),
      Math.sin(a)*r + gaussian()*(4+bulge*9)
    );
  }, {
    palette:[new THREE.Color("#9dbaff"),new THREE.Color("#fff0c7"),new THREE.Color("#c8d7ff")],
    sizeMin:5,sizeMax:16,opacity:.75
  });
}
const milkyWay = makeSpiralGalaxy();
milkyWay.scale.set(1, .6, 1);
groups.landmarks.add(milkyWay);

const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: radialTexture(),
  color: 0xffe5bd,
  transparent: true,
  opacity: .55,
  blending: THREE.AdditiveBlending,
  depthWrite:false
}));
coreGlow.scale.set(110,110,1);
groups.landmarks.add(coreGlow);

function radialTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,"rgba(255,255,255,1)");
  g.addColorStop(.08,"rgba(255,235,195,.8)");
  g.addColorStop(.35,"rgba(145,160,255,.2)");
  g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
}

// CMB / observable horizon shell
const horizonMat = new THREE.MeshBasicMaterial({
  color:0x29345e, wireframe:true, transparent:true, opacity:.055, side:THREE.BackSide
});
const horizonSphere = new THREE.Mesh(new THREE.SphereGeometry(12000, 42, 28), horizonMat);
groups.grid.add(horizonSphere);

// Grid rings
for (const r of [500, 1500, 3500, 7000, 11500]) {
  const curve = new THREE.EllipseCurve(0,0,r,r,0,TAU,false,0);
  const pts = curve.getPoints(180).map(p=>new THREE.Vector3(p.x,0,p.y));
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  groups.grid.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:0x65709a,transparent:true,opacity:.11})));
}
groups.grid.visible = false;

const landmarks = [
  { id:"earth", name:"Earth", sub:"You are here", pos:[92,2,-14], distance:"0 ly", scale:"Planetary", cam:22 },
  { id:"milkyway", name:"Milky Way", sub:"Barred spiral galaxy", pos:[0,0,0], distance:"26,000 ly to center", scale:"Galactic", cam:430 },
  { id:"andromeda", name:"Andromeda", sub:"M31 · spiral galaxy", pos:[540,65,-620], distance:"2.54M ly", scale:"Local Group", cam:220 },
  { id:"virgo", name:"Virgo Cluster", sub:"Galaxy cluster", pos:[1350,-220,-1020], distance:"53.8M ly", scale:"Cluster", cam:460 },
  { id:"great-attractor", name:"Great Attractor", sub:"Gravitational anomaly", pos:[-2800,470,-1900], distance:"~150M ly", scale:"Supercluster", cam:700 },
  { id:"gn-z11", name:"GN-z11", sub:"High-redshift galaxy", pos:[4900,1550,3500], distance:"~13.4B light-travel years", scale:"Deep field", cam:700 },
  { id:"horizon", name:"Cosmic Horizon", sub:"Observable limit", pos:[0,0,-10800], distance:"~46.5B ly comoving", scale:"Cosmic horizon", cam:2300 }
];

const landmarkSprites = new Map();
landmarks.filter(l => l.id !== "earth").forEach((l) => {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map:radialTexture(), color:0xb7c6ff,
    transparent:true, opacity:.8, blending:THREE.AdditiveBlending, depthWrite:false
  }));
  sprite.position.set(...l.pos);
  sprite.scale.set(36,36,1);
  groups.landmarks.add(sprite);
  landmarkSprites.set(l.id, sprite);
});

// Detailed procedural Earth: terrain, oceans, city lights, clouds, and atmosphere.
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
function smoothNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, u), THREE.MathUtils.lerp(c, d, u), v);
}
function fbm(x, y, octaves=6) {
  let value = 0, amp = .5, freq = 1;
  for (let i=0; i<octaves; i++) {
    value += smoothNoise(x*freq, y*freq) * amp;
    freq *= 2.03; amp *= .5;
  }
  return value;
}
function buildEarthTexture(width=1024, height=512, mode="surface") {
  const c = document.createElement("canvas");
  c.width = width; c.height = height;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(width, height);
  for (let y=0; y<height; y++) {
    const lat = (y/height-.5)*Math.PI;
    for (let x=0; x<width; x++) {
      const lon = (x/width)*TAU-Math.PI;
      const nx = x/width*5.3, ny = y/height*2.7;
      const continental =
        fbm(nx, ny, 6) +
        .22*Math.sin(lon*1.7 + Math.sin(lat*2.4)) +
        .12*Math.cos(lon*3.1-lat*1.6) -
        .10*Math.abs(Math.sin(lat*2.8));
      const ice = Math.pow(Math.max(0,(Math.abs(lat)-1.12)/.45), .65);
      const coast = continental - .55;
      const i=(y*width+x)*4;
      if (mode === "clouds") {
        const cloud = fbm(nx*2.1+12, ny*2.1+8, 5) + .18*Math.sin(lon*5+lat*3);
        const alpha = Math.max(0, Math.min(1, (cloud-.54)*4.2)) * (1-ice*.35);
        img.data[i]=245; img.data[i+1]=249; img.data[i+2]=255; img.data[i+3]=Math.round(alpha*190);
      } else if (mode === "lights") {
        const inhabited = Math.max(0, coast) * (1-ice) * Math.max(0, 1-Math.abs(lat)/1.15);
        const lights = inhabited * Math.pow(hash2(x*.31,y*.31), 8) * 7;
        img.data[i]=255; img.data[i+1]=155; img.data[i+2]=65; img.data[i+3]=Math.round(Math.min(1,lights)*255);
      } else {
        let r,g,b;
        if (coast > 0) {
          const elev = Math.min(1, coast*4.7);
          const dry = Math.max(0, Math.sin(lon*2.2-lat*3.7)*.5+.5) * Math.max(0,1-Math.abs(lat)/1.3);
          r = 38 + elev*62 + dry*48;
          g = 82 + elev*72 + dry*24;
          b = 38 + elev*30;
        } else {
          const depth = Math.min(1,-coast*3.2);
          r = 4 + depth*3; g = 34 + depth*11; b = 72 + depth*48;
        }
        r = THREE.MathUtils.lerp(r,235,ice); g=THREE.MathUtils.lerp(g,242,ice); b=THREE.MathUtils.lerp(b,248,ice);
        img.data[i]=r; img.data[i+1]=g; img.data[i+2]=b; img.data[i+3]=255;
      }
    }
  }
  ctx.putImageData(img,0,0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}
const earthPosition = new THREE.Vector3(...landmarks.find(l=>l.id==="earth").pos);
const earthGroup = new THREE.Group();
earthGroup.position.copy(earthPosition);
earthGroup.rotation.z = THREE.MathUtils.degToRad(-23.4);
groups.landmarks.add(earthGroup);

const earthSurface = new THREE.Mesh(
  new THREE.SphereGeometry(5, 96, 64),
  new THREE.MeshPhongMaterial({
    map: buildEarthTexture(),
    specular: new THREE.Color(0x6d8fb2),
    shininess: 42,
    emissiveMap: buildEarthTexture(1024,512,"lights"),
    emissive: new THREE.Color(0xffa24a),
    emissiveIntensity: .65
  })
);
earthGroup.add(earthSurface);

const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(5.075, 96, 64),
  new THREE.MeshPhongMaterial({
    map: buildEarthTexture(1024,512,"clouds"),
    transparent:true, opacity:.82, depthWrite:false,
    blending:THREE.NormalBlending
  })
);
earthGroup.add(clouds);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(5.22, 96, 64),
  new THREE.ShaderMaterial({
    transparent:true, side:THREE.BackSide, depthWrite:false,
    blending:THREE.AdditiveBlending,
    uniforms:{ glowColor:{value:new THREE.Color(0x4aa8ff)} },
    vertexShader:`varying vec3 vNormal; varying vec3 vWorldPosition;
      void main(){ vNormal=normalize(normalMatrix*normal); vec4 wp=modelMatrix*vec4(position,1.0);
      vWorldPosition=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader:`varying vec3 vNormal; varying vec3 vWorldPosition; uniform vec3 glowColor;
      void main(){ vec3 viewDir=normalize(cameraPosition-vWorldPosition);
      float rim=pow(1.0-max(0.0,dot(vNormal,viewDir)),2.8);
      gl_FragColor=vec4(glowColor, rim*.7); }`
  })
);
earthGroup.add(atmosphere);

const sun = new THREE.DirectionalLight(0xfff4dc, 3.1);
sun.position.set(35,18,28);
earthGroup.add(sun);
earthGroup.add(new THREE.HemisphereLight(0x4d70a8,0x02040a,.4));

// Andromeda visual
const andromeda = makeSpiralGalaxy(120, 3500, 2);
andromeda.position.set(540,65,-620);
andromeda.rotation.set(.45,.6,.2);
andromeda.scale.set(1.4,.55,1.4);
groups.landmarks.add(andromeda);

// Label DOM
const labelRoot = document.querySelector("#labels");
landmarks.filter(l=>l.id!=="milkyway").forEach(l => {
  const el = document.createElement("div");
  el.className = "world-label";
  el.dataset.id = l.id;
  el.innerHTML = `<strong>${l.name}</strong><small>${l.sub}</small>`;
  labelRoot.appendChild(el);
});

const locationName = document.querySelector("#locationName");
const locationSub = document.querySelector("#locationSub");
const distanceValue = document.querySelector("#distanceValue");
const scaleValue = document.querySelector("#scaleValue");
const heroCopy = document.querySelector("#heroCopy");
const fovValue = document.querySelector("#fovValue");
const objectCount = document.querySelector("#objectCount");
objectCount.textContent = (24000 + webPositions.length + 9000 + 3500 + 52*130).toLocaleString() + "+";

let journeyStarted = false;
let flight = null;

function focusLandmark(id) {
  const l = landmarks.find(x=>x.id===id);
  if (!l) return;
  journeyStarted = true;
  heroCopy.classList.add("hidden");
  locationName.textContent = l.name;
  locationSub.textContent = l.sub;
  distanceValue.textContent = l.distance;
  scaleValue.textContent = l.scale;

  const target = new THREE.Vector3(...l.pos);
  const dir = camera.position.clone().sub(controls.target).normalize();
  if (dir.lengthSq() < .1) dir.set(.6,.3,1);
  const destination = target.clone().add(dir.multiplyScalar(l.cam));
  flight = {
    startCam: camera.position.clone(),
    startTarget: controls.target.clone(),
    endCam: destination,
    endTarget: target,
    t: 0
  };
}

function goOverview() {
  journeyStarted = false;
  heroCopy.classList.remove("hidden");
  locationName.textContent = "Observable Universe";
  locationSub.textContent = "A procedural, scale-inspired map of our cosmic horizon.";
  distanceValue.textContent = "0 ly";
  scaleValue.textContent = "Cosmic horizon";
  flight = {
    startCam:camera.position.clone(),startTarget:controls.target.clone(),
    endCam:new THREE.Vector3(0,320,1450),endTarget:new THREE.Vector3(),t:0
  };
}

document.querySelectorAll("[data-target]").forEach(b=>b.addEventListener("click",()=>focusLandmark(b.dataset.target)));
document.querySelector("#beginBtn").addEventListener("click",()=>focusLandmark("milkyway"));
document.querySelector("#homeBtn").addEventListener("click",goOverview);

document.querySelector("#webToggle").addEventListener("change",e=>groups.web.visible=e.target.checked);
document.querySelector("#galaxyToggle").addEventListener("change",e=>groups.galaxies.visible=e.target.checked);
document.querySelector("#gridToggle").addEventListener("change",e=>groups.grid.visible=e.target.checked);
document.querySelector("#labelToggle").addEventListener("change",e=>labelRoot.style.display=e.target.checked?"block":"none");

const timeSlider = document.querySelector("#timeSlider");
const timeLabel = document.querySelector("#timeLabel");
timeSlider.addEventListener("input", () => {
  const age = +timeSlider.value;
  timeLabel.textContent = `${age.toFixed(1)} BY`;
  const maturity = THREE.MathUtils.clamp((age-0.4)/13.4,0,1);
  groups.galaxies.scale.setScalar(.5 + maturity*.5);
  groups.web.scale.setScalar(.72 + maturity*.28);
  webPoints.material.uniforms.uOpacity.value = .06 + maturity*.12;
  showToast(age < 1 ? "Recombination era → first structures" : age < 5 ? "Young universe" : age < 10 ? "Galaxy growth era" : "Mature cosmic web");
});

const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");
function updateSearch() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { searchResults.classList.remove("visible"); searchResults.innerHTML=""; return; }
  const matches = landmarks.filter(l=>`${l.name} ${l.sub}`.toLowerCase().includes(q)).slice(0,5);
  searchResults.innerHTML = matches.length
    ? matches.map(l=>`<button class="search-result" data-search-id="${l.id}"><span>${l.name}</span><small>${l.distance}</small></button>`).join("")
    : `<button class="search-result"><span>No catalog match</span><small>Try Earth, Virgo…</small></button>`;
  searchResults.classList.add("visible");
  searchResults.querySelectorAll("[data-search-id]").forEach(b=>b.onclick=()=>{focusLandmark(b.dataset.searchId);searchResults.classList.remove("visible");searchInput.blur();});
}
searchInput.addEventListener("input",updateSearch);
searchInput.addEventListener("keydown",e=>{
  if (e.key==="Enter") {
    const first=searchResults.querySelector("[data-search-id]");
    if (first) first.click();
  }
});

const helpModal = document.querySelector("#helpModal");
document.querySelector("#helpBtn").onclick=()=>{helpModal.classList.add("open");helpModal.setAttribute("aria-hidden","false")};
document.querySelector("#closeHelp").onclick=closeHelp;
helpModal.addEventListener("click",e=>{if(e.target===helpModal)closeHelp()});
function closeHelp(){helpModal.classList.remove("open");helpModal.setAttribute("aria-hidden","true")}

document.querySelector("#collapseLayers").onclick=()=>{
  const p=document.querySelector(".right-panel");
  const rows=[...p.querySelectorAll(".toggle-row,.divider,.time-control")];
  const hidden=rows[0].style.display==="none";
  rows.forEach(r=>r.style.display=hidden?"":"none");
  document.querySelector("#collapseLayers").textContent=hidden?"−":"+";
};

let audioCtx;
let ambientMaster;
let ambientEnabled = false;
const soundButton = document.querySelector("#soundBtn");

function createAmbientSoundscape() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  ambientMaster = audioCtx.createGain();
  ambientMaster.gain.value = 0;
  ambientMaster.connect(audioCtx.destination);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 520;
  filter.Q.value = .45;
  filter.connect(ambientMaster);

  // Warm layered drone.
  [43.65, 65.41, 87.31].forEach((frequency, index) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = index === 0 ? "sine" : "triangle";
    osc.frequency.value = frequency;
    gain.gain.value = [.16,.055,.025][index];
    osc.connect(gain).connect(filter);
    osc.start();
  });

  // Slowly moving filtered noise gives the ambience audible texture.
  const seconds = 4;
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * seconds, audioCtx.sampleRate);
  const channel = buffer.getChannelData(0);
  let last = 0;
  for (let i=0; i<channel.length; i++) {
    const white = Math.random()*2-1;
    last = last*.985 + white*.015;
    channel[i] = last*.7;
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer; noise.loop = true;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = .22;
  noise.connect(noiseGain).connect(filter);
  noise.start();

  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = .055;
  lfoGain.gain.value = 90;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();
}

async function setAmbient(enabled) {
  if (!audioCtx) createAmbientSoundscape();
  if (audioCtx.state === "suspended") await audioCtx.resume();
  ambientEnabled = enabled;
  const now = audioCtx.currentTime;
  ambientMaster.gain.cancelScheduledValues(now);
  ambientMaster.gain.setValueAtTime(ambientMaster.gain.value, now);
  ambientMaster.gain.linearRampToValueAtTime(enabled ? .075 : 0, now + .55);
  soundButton.classList.toggle("is-on", enabled);
  soundButton.setAttribute("aria-pressed", String(enabled));
  showToast(enabled ? "Ambient sound on" : "Ambient sound off");
}

soundButton.setAttribute("aria-pressed","false");
soundButton.addEventListener("click", async () => {
  try {
    await setAmbient(!ambientEnabled);
  } catch (error) {
    console.error("Unable to start ambient audio:", error);
    showToast("Audio was blocked by the browser");
  }
});

let toastTimer;
function showToast(text){
  const t=document.querySelector("#toast");
  t.textContent=text;t.classList.add("show");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),1700);
}

const pressed = new Set();
addEventListener("keydown",e=>{
  if (document.activeElement===searchInput) return;
  pressed.add(e.key.toLowerCase());
  if(e.key==="Escape"){closeHelp();goOverview();}
  if(e.key.toLowerCase()==="f"){
    let best=null, d=Infinity;
    landmarks.forEach(l=>{const x=camera.position.distanceTo(new THREE.Vector3(...l.pos));if(x<d){d=x;best=l;}});
    if(best)focusLandmark(best.id);
  }
});
addEventListener("keyup",e=>pressed.delete(e.key.toLowerCase()));

function handleKeyboard(dt){
  const speed=(pressed.has("shift")?900:240)*dt*(camera.position.length()/1800+1);
  const forward=new THREE.Vector3(); camera.getWorldDirection(forward);
  const right=new THREE.Vector3().crossVectors(forward,camera.up).normalize();
  const delta=new THREE.Vector3();
  if(pressed.has("w"))delta.add(forward);
  if(pressed.has("s"))delta.sub(forward);
  if(pressed.has("d"))delta.add(right);
  if(pressed.has("a"))delta.sub(right);
  if(delta.lengthSq()){delta.normalize().multiplyScalar(speed);camera.position.add(delta);controls.target.add(delta);journeyStarted=true;heroCopy.classList.add("hidden");}
}

function updateLabels(){
  const width=innerWidth,height=innerHeight;
  document.querySelectorAll(".world-label").forEach(el=>{
    const l=landmarks.find(x=>x.id===el.dataset.id);
    const v=new THREE.Vector3(...l.pos).project(camera);
    const behind=v.z>1;
    el.style.display=behind?"none":"block";
    el.style.left=`${(v.x*.5+.5)*width}px`;
    el.style.top=`${(-v.y*.5+.5)*height}px`;
    const dist=camera.position.distanceTo(new THREE.Vector3(...l.pos));
    el.style.opacity=String(THREE.MathUtils.clamp(1-dist/7500,.12,.85));
  });
}

let prev=performance.now(), frames=0, fpsTime=prev;
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min(.05,(now-prev)/1000); prev=now;

  handleKeyboard(dt);
  controls.update();

  if(flight){
    flight.t=Math.min(1,flight.t+dt*.72);
    const t=1-Math.pow(1-flight.t,3);
    camera.position.lerpVectors(flight.startCam,flight.endCam,t);
    controls.target.lerpVectors(flight.startTarget,flight.endTarget,t);
    if(flight.t>=1)flight=null;
  }

  stars.rotation.y += dt*.002;
  groups.web.rotation.y += dt*.00055;
  milkyWay.rotation.y += dt*.006;
  andromeda.rotation.y -= dt*.004;
  earthSurface.rotation.y += dt*.055;
  clouds.rotation.y += dt*.067;
  coreGlow.material.opacity=.48+Math.sin(now*.001)*.07;

  updateLabels();

  const dist=camera.position.distanceTo(controls.target);
  camera.fov=THREE.MathUtils.clamp(48+Math.log10(Math.max(1,dist))*2.2,48,62);
  camera.updateProjectionMatrix();
  fovValue.textContent=`${Math.round(camera.fov)}°`;

  frames++;
  if(now-fpsTime>700){
    document.querySelector("#fps").textContent=`${Math.round(frames*1000/(now-fpsTime))} FPS`;
    frames=0;fpsTime=now;
  }

  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
  renderer.setSize(innerWidth,innerHeight);
  webPoints.material.uniforms.uPixelRatio.value=renderer.getPixelRatio();
});

showToast("Universe simulation initialized");
