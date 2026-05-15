import './index.css';

// CDN 基础路径 - 七牛云 CDN 域名（部署后替换）
const CDN_BASE = import.meta.env.VITE_CDN_BASE || '/assets';

// 视频资源映射
const VIDEO_RESOURCES: Record<string, string> = {
  'P1-开始': `${CDN_BASE}/P1-开始.mp4`,
  'P2-不理会': `${CDN_BASE}/P2-不理会.mp4`,
  'P2-问清楚': `${CDN_BASE}/P2-问清楚.mp4`,
  'P3-不信': `${CDN_BASE}/P3-不信.mp4`,
  'P3-相信': `${CDN_BASE}/P3-相信.mp4`,
  'P4-上车': `${CDN_BASE}/P4-上车.mp4`,
  'P4-不上车': `${CDN_BASE}/P4-不上车.mp4`,
  'P5-寄': `${CDN_BASE}/P5-寄.mp4`,
  'P5-得救': `${CDN_BASE}/P5-得救.mp4`,
};

const BACKGROUND_IMAGE = `${CDN_BASE}/背景图.png`;

interface AppState {
  currentPhase: string;
  userChoices: string[];
}

const appState: AppState = {
  currentPhase: 'start',
  userChoices: [],
};

let videoElement: HTMLVideoElement | null = null;

const BRANCHES: Record<string, { options?: Array<{ text: string; next: string }>; autoNext?: string }> = {
  'start': { autoNext: 'P1-开始' },
  'P1-开始': {
    options: [
      { text: '追上去问清楚', next: 'P2-问清楚' },
      { text: '不理会，继续等车', next: 'P2-不理会' },
    ],
  },
  'P2-问清楚': {
    options: [
      { text: '相信他的话', next: 'P3-相信' },
      { text: '不信他的话', next: 'P3-不信' },
    ],
  },
  'P2-不理会': { autoNext: 'P4-上车' },
  'P3-相信': { autoNext: 'P5-得救' },
  'P3-不信': {
    options: [
      { text: '上车', next: 'P4-上车' },
      { text: '不上车', next: 'P4-不上车' },
    ],
  },
  'P4-上车': { autoNext: 'P5-寄' },
  'P4-不上车': { autoNext: 'P5-得救' },
  'P5-寄': { autoNext: 'restart' },
  'P5-得救': { autoNext: 'restart' },
};

export function initApp(): void {
  const app = document.getElementById('app');

  if (!app) {
    console.error('App element not found');
    return;
  }

  app.innerHTML = `
    <div class="app-container">
      <div id="start-screen" class="start-screen">
        <img src="${BACKGROUND_IMAGE}" alt="背景图" class="background-image" />
        <div class="overlay"></div>
        <div class="start-content">
          <h1 class="title">最后一班地铁</h1>
          <button id="start-btn" class="start-button">
            <span class="button-text">进入地铁</span>
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
      <div id="video-screen" class="video-screen hidden">
        <video id="video-player" class="video-player" playsinline preload="auto"></video>
        <div id="choice-overlay" class="choice-overlay hidden">
          <div class="choice-container">
            <h2 class="choice-title">你的选择是？</h2>
            <div id="choice-buttons" class="choice-buttons"></div>
          </div>
        </div>
      </div>
      <div id="ending-screen" class="ending-screen hidden">
        <div class="ending-content">
          <h1 id="ending-title" class="ending-title"></h1>
          <p class="ending-subtitle">故事结束</p>
          <button id="restart-btn" class="restart-button">重新开始</button>
        </div>
      </div>
    </div>
  `;

  setupEventListeners();
  updateScreen();
}

function setupEventListeners(): void {
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');

  if (startBtn) {
    startBtn.addEventListener('click', handleStart);
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', handleRestart);
  }
}

function handleStart(): void {
  appState.currentPhase = 'P1-开始';
  appState.userChoices = [];
  showVideoScreen();
  playVideo('P1-开始');
}

function handleRestart(): void {
  appState.currentPhase = 'start';
  appState.userChoices = [];
  updateScreen();
}

function showVideoScreen(): void {
  const startScreen = document.getElementById('start-screen');
  const endingScreen = document.getElementById('ending-screen');
  const videoScreen = document.getElementById('video-screen');

  if (startScreen) startScreen.classList.add('hidden');
  if (endingScreen) endingScreen.classList.add('hidden');
  if (videoScreen) videoScreen.classList.remove('hidden');
}

let preloadedVideos: Map<string, HTMLVideoElement> = new Map();

function preloadVideo(videoKey: string): void {
  if (preloadedVideos.has(videoKey)) return;

  const videoUrl = VIDEO_RESOURCES[videoKey];
  if (!videoUrl) return;

  const preloader = document.createElement('video');
  preloader.preload = 'auto';
  preloader.muted = true;
  preloader.playsInline = true;
  preloader.src = videoUrl;
  preloader.load();
  preloadedVideos.set(videoKey, preloader);
}

function playVideo(videoKey: string): void {
  const videoPlayer = document.getElementById('video-player') as HTMLVideoElement;
  const choiceOverlay = document.getElementById('choice-overlay');

  if (!videoPlayer || !VIDEO_RESOURCES[videoKey]) {
    console.error('Video element or resource not found');
    return;
  }

  videoElement = videoPlayer;

  if (choiceOverlay) {
    choiceOverlay.classList.add('hidden');
  }

  videoPlayer.oncanplaythrough = null;

  const videoUrl = VIDEO_RESOURCES[videoKey];

  videoPlayer.src = videoUrl;
  videoPlayer.load();

  videoPlayer.play().then(() => {
    console.log('Video playing:', videoKey);
  }).catch(() => {
    console.warn('Autoplay prevented, waiting for user interaction');
    const resumePlay = () => {
      videoPlayer.play().catch(console.error);
      document.removeEventListener('click', resumePlay);
      document.removeEventListener('touchstart', resumePlay);
    };
    document.addEventListener('click', resumePlay, { once: true });
    document.addEventListener('touchstart', resumePlay, { once: true });
  });

  const branch = BRANCHES[videoKey];
  if (branch) {
    if (branch.autoNext && branch.autoNext !== 'restart') {
      preloadVideo(branch.autoNext);
    }
    if (branch.options) {
      branch.options.forEach(opt => preloadVideo(opt.next));
    }
  }

  videoPlayer.onended = () => {
    handleVideoEnd(videoKey);
  };

  videoPlayer.ontimeupdate = () => {
    if (videoPlayer.duration > 0 && !videoPlayer.paused) {
      const timeLeft = videoPlayer.duration - videoPlayer.currentTime;
      if (timeLeft <= 0.3 && timeLeft > 0) {
        videoPlayer.ontimeupdate = null;
        handleVideoEnd(videoKey);
      }
    }
  };

  videoPlayer.onerror = (e) => {
    console.error('Video load error:', videoKey, e);
  };
}

function handleVideoEnd(videoKey: string): void {
  const branch = BRANCHES[videoKey];

  if (!branch) {
    console.error('Branch not found for:', videoKey);
    return;
  }

  if (branch.autoNext) {
    if (branch.autoNext === 'restart') {
      showEndingScreen(videoKey);
    } else if (videoKey === 'P1-开始') {
      appState.currentPhase = videoKey;
      showChoiceOverlay(branch.options || []);
    } else if (videoKey === 'P2-问清楚') {
      appState.currentPhase = videoKey;
      showChoiceOverlay(branch.options || []);
    } else if (videoKey === 'P3-不信') {
      appState.currentPhase = videoKey;
      showChoiceOverlay(branch.options || []);
    } else {
      playVideo(branch.autoNext);
    }
  } else if (branch.options) {
    appState.currentPhase = videoKey;
    showChoiceOverlay(branch.options);
  }
}

function showChoiceOverlay(options: Array<{ text: string; next: string }>): void {
  const choiceOverlay = document.getElementById('choice-overlay');
  const choiceButtons = document.getElementById('choice-buttons');

  if (!choiceOverlay || !choiceButtons) return;

  choiceButtons.innerHTML = '';

  options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = 'choice-button';
    button.innerHTML = `
      <span class="choice-letter">${String.fromCharCode(65 + index)}</span>
      <span class="choice-text">${option.text}</span>
    `;
    button.addEventListener('click', () => handleChoice(option.next));
    choiceButtons.appendChild(button);
  });

  choiceOverlay.classList.remove('hidden');
}

function handleChoice(nextPhase: string): void {
  appState.userChoices.push(nextPhase);
  appState.currentPhase = nextPhase;
  playVideo(nextPhase);
}

function showEndingScreen(videoKey: string): void {
  const videoScreen = document.getElementById('video-screen');
  const endingScreen = document.getElementById('ending-screen');
  const endingTitle = document.getElementById('ending-title');

  if (videoScreen) videoScreen.classList.add('hidden');
  if (endingScreen) endingScreen?.classList.remove('hidden');

  if (endingTitle) {
    if (videoKey === 'P5-寄') {
      endingTitle.textContent = '结局：寄';
      endingTitle.className = 'ending-title ending-bad';
    } else if (videoKey === 'P5-得救') {
      endingTitle.textContent = '结局：得救';
      endingTitle.className = 'ending-title ending-good';
    }
  }
}

function updateScreen(): void {
  const startScreen = document.getElementById('start-screen');
  const videoScreen = document.getElementById('video-screen');
  const endingScreen = document.getElementById('ending-screen');

  if (appState.currentPhase === 'start') {
    if (startScreen) startScreen.classList.remove('hidden');
    if (videoScreen) videoScreen.classList.add('hidden');
    if (endingScreen) endingScreen?.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', initApp);