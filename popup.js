const saveBtn = document.getElementById("saveBtn");
const bookmarkList = document.getElementById("bookmarkList");
const statusEl = document.getElementById("status");

saveBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return showStatus("No active tab detected.");
    const tab = tabs[0];
    if (!/youtube\.com|youtu\.be/.test(tab.url)) {
      return showStatus("Please open a YouTube video page and try again.");
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const video = document.querySelector('video');
        const timestamp = video ? Math.floor(video.currentTime) : null;
        const title = document.title ? document.title.replace(' - YouTube', '') : '';
        let videoId = null;
        try {
          videoId = new URL(location.href).searchParams.get('v');
        } catch(e) { videoId = null; }
        if (!videoId) {
          const parts = location.pathname.split('/').filter(Boolean);
          videoId = parts.length ? parts[parts.length-1] : '';
        }
        return { timestamp, videoId, title };
      }
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return showStatus("Failed to read the page.");
      }
      const res = results && results[0] && results[0].result;
      if (!res || res.timestamp === null || !res.videoId) {
        return showStatus("Couldn't find a playing video.");
      }
      const bookmark = {
        videoId: res.videoId,
        timestamp: res.timestamp,
        title: res.title || "YouTube Video",
        url: `https://www.youtube.com/watch?v=${res.videoId}&t=${res.timestamp}s`,
        createdAt: Date.now()
      };

      chrome.storage.local.get({ bookmarks: [] }, (data) => {
        const bookmarks = data.bookmarks || [];
        const exists = bookmarks.some(b => b.videoId === bookmark.videoId && b.timestamp === bookmark.timestamp);
        if (!exists) {
          bookmarks.push(bookmark);
          chrome.storage.local.set({ bookmarks }, () => {
            showStatus("Saved ✓");
            renderBookmarks();
          });
        } else {
          showStatus("This timestamp is already saved.");
        }
      });
    });
  });
});

function renderBookmarks() {
  chrome.storage.local.get({ bookmarks: [] }, (data) => {
    bookmarkList.innerHTML = "";
    (data.bookmarks || []).forEach((b, i) => {
      const li = document.createElement("li");
      li.className = "bookmark-item";
      const a = document.createElement("a");
      a.href = "#";
      a.textContent = `${b.title} [${formatTime(b.timestamp)}]`;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({ type: "openTimestamp", url: b.url });
      });

      const del = document.createElement("button");
      del.className = "del-btn";
      del.title = "Delete";
      del.textContent = "✕";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        chrome.storage.local.get({ bookmarks: [] }, (d2) => {
          const arr = d2.bookmarks || [];
          arr.splice(i, 1);
          chrome.storage.local.set({ bookmarks: arr }, renderBookmarks);
        });
      });

      li.appendChild(a);
      li.appendChild(del);
      bookmarkList.appendChild(li);
    });
  });
}

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${m}:${String(s).padStart(2,"0")}`;
}

function showStatus(text, timeout = 2500) {
  statusEl.textContent = text;
  clearTimeout(statusEl._t);
  statusEl._t = setTimeout(() => { statusEl.textContent = ""; }, timeout);
}

document.addEventListener("DOMContentLoaded", renderBookmarks);
