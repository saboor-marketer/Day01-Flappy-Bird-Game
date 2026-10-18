// Logical game world. The canvas is scaled to fit any screen while physics
// stay identical everywhere.
export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;
export const GROUND_HEIGHT = 96;
export const GROUND_Y = GAME_HEIGHT - GROUND_HEIGHT; // 544

export const PHYSICS = {
  gravity: 1500, // px / s^2
  flapVelocity: -430, // px / s
  maxFall: 560, // terminal velocity px / s
  pipeSpeed: 138, // px / s
  birdX: 112,
  birdRadius: 11,
  startY: 236,
};

export const PIPES = {
  width: 62,
  capHeight: 24,
  capOverhang: 5,
  gapStart: 176,
  gapMin: 140,
  gapShrink: 2, // gap lost per point
  spacing: 202,
  minTop: 62,
  bottomMargin: 46,
  maxDelta: 128, // max vertical change between consecutive gaps
};

export const COLORS = {
  // sky
  skyTop: "#16255c",
  skyMid: "#4a3a72",
  skyWarm: "#a4507f",
  skyCoral: "#e87a5d",
  skyGold: "#f7c489",
  sun: "#fff0c2",
  sunGlowA: "rgba(255,214,130,0.55)",
  sunGlowB: "rgba(255,170,80,0)",

  // scenery
  cloud: "rgba(255,205,180,0.5)",
  cloudFar: "rgba(190,170,215,0.4)",
  mountainFar: "#3a2f5e",
  mountainNear: "#2a2350",

  // ground
  grass: "#6aa84f",
  grassDark: "#4e7d3a",
  grassLight: "#7fc45c",
  dirt: "#e6b07a",
  dirtDark: "#cf9460",

  // pipes (complementary green against warm sky)
  pipeLight: "#7ed957",
  pipe: "#54b34c",
  pipeDark: "#3f9d43",
  pipeEdge: "#2e6e33",

  // bird
  birdBody: "#ffd23f",
  birdBodyDark: "#e9a91b",
  birdBelly: "#fff2b8",
  beak: "#ff7a2f",
  beakDark: "#e85d1c",
  wing: "#ffb62e",
  eyeWhite: "#ffffff",
  eyePupil: "#2b2b3a",

  // fx
  spark: "#ffe27a",
  sparkHot: "#fffbe6",
  feather: "#ffd23f",
  puff: "rgba(255,255,255,0.85)",
  dust: "#d8a86a",
};

export const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
