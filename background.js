chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "openTimestamp") {
    const url = message.url;
    try {
      const urlObj = new URL(url);
      const vid = urlObj.searchParams.get('v');
      // look for an existing YouTube watch tab with same video id
      chrome.tabs.query({ url: "*://*.youtube.com/watch*" }, (tabs) => {
        if (chrome.runtime.lastError) {
          chrome.tabs.create({ url });
          return;
        }
        let found = null;
        for (const t of tabs) {
          try {
            const turl = new URL(t.url);
            if (turl.searchParams.get('v') === vid) {
              found = t;
              break;
            }
          } catch (e) {}
        }
        if (found) {
          chrome.tabs.update(found.id, { active: true, url });
        } else {
          chrome.tabs.create({ url });
        }
      });
    } catch (e) {
      chrome.tabs.create({ url });
    }
  }
});
