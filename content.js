function getCurrentTime() {
  const video = document.querySelector('video');
  if (video) return Math.floor(video.currentTime);
  return null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'getTimestamp') {
    const timestamp = getCurrentTime();
    const title = document.title ? document.title.replace(' - YouTube', '') : '';
    const videoId = new URL(window.location.href).searchParams.get('v') || '';
    sendResponse({ timestamp, videoId, title });
  }
});
