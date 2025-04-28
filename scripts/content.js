let visibleVideoLinks = new Set();
let batchQueue = new Set();
let batchTimeout = null;
let analyzedVideos = new Set();
const isWatchPage = window.location.pathname === "/watch";
let lastScrollPosition = window.scrollY;
let isLoadingBatch = false;
const BATCH_SIZE = 25;

function scheduleBatchSend(immediate = false) {
    if (immediate) {
        processBatch();
        return;
    }
    if (batchTimeout) return;
    batchTimeout = setTimeout(() => {
        processBatch();
    }, 300);
}

function processBatch() {
    const urls = Array.from(batchQueue).slice(0, BATCH_SIZE);
    for (const url of urls) {
        batchQueue.delete(url);
    }
    batchTimeout = null;
    if (urls.length > 0) {
        setTimeout(() => analyzeVideos(urls), 200);
    }
}

let intersectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const anchor = entry.target.closest('a[href*="watch?v="]');
        if (!anchor || !anchor.href) return;

        const videoUrl = anchor.href;
        const videoId = extractVideoId(videoUrl);
        if (!videoId) return;

        const cleanedUrl = cleanUrl(videoUrl);
        if (entry.isIntersecting) {
            visibleVideoLinks.add(cleanedUrl);
            if (!analyzedVideos.has(videoId)) {
                analyzedVideos.add(videoId);
                batchQueue.add(videoUrl);
                scheduleBatchSend();
            }
        } else {
            visibleVideoLinks.delete(cleanedUrl);
        }
    });
}, { threshold: 0.1 });

function extractVideoId(url) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1);
        const v = parsed.searchParams.get("v");
        if (v) return v;
        const match = url.match(/\/(embed|shorts)\/([^?&/]+)/);
        return match ? match[2] : null;
    } catch {
        return null;
    }
}

function cleanUrl(url) {
    try {
        const parsed = new URL(url);
        parsed.searchParams.delete("t");
        return parsed.origin + parsed.pathname + parsed.search;
    } catch {
        return url.split(/[?&]/)[0];
    }
}

function analyzeVideos(videoUrls) {
    try {
        chrome.storage?.local.get(["blurEnabled", "blurCategories"], (data) => {
            if (chrome.runtime.lastError) {
                console.warn("Storage error:", chrome.runtime.lastError.message);
                return;
            }

            if (data.blurEnabled === false) return;

            const allowedCategories = new Set(data.blurCategories || []);

            fetch("http://localhost:4000/analyze_batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ video_urls: videoUrls })
            })
                .then(res => res.json())
                .then(data => {
                    if (!data.results) return;

                    console.log("API response:", data.results);

                    data.results.forEach(video => {
                        const classification = video?.classification?.trim()?.toUpperCase();
                        const category = video?.category || "unknown";

                        if (classification === "HARMFUL") {
                            if (allowedCategories.has(category)) {
                                console.log(`[BLUR] Video: ${video.url}, Category: ${category}`);
                                applyBlur(video.url);
                            } else {
                                console.log(`[SKIP] Harmful video, but category '${category}' not selected by user.`);
                            }
                        } else {
                            console.log(`[SAFE] Skipped video: ${video.url}`);
                        }
                    });
                })
                .catch(err => console.error("API error:", err));
        });
    } catch (err) {
        console.warn("Extension context was invalidated:", err);
    }
}

function createBlurOverlay(target) {
    const existingOverlay = target.querySelector('.harmful-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backdropFilter = "blur(10px)";
    overlay.style.zIndex = 9999;
    overlay.style.pointerEvents = "auto";
    overlay.classList.add("harmful-overlay");

    const warningText = document.createElement("div");
    warningText.textContent = "Potentially harmful content";
    warningText.style.position = "absolute";
    warningText.style.top = "50%";
    warningText.style.left = "50%";
    warningText.style.transform = "translate(-50%, -50%)";
    warningText.style.color = "white";
    warningText.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
    warningText.style.padding = "5px 10px";
    warningText.style.borderRadius = "5px";
    warningText.style.fontWeight = "bold";
    overlay.appendChild(warningText);

    if (getComputedStyle(target).position === "static") {
        target.style.position = "relative";
    }
    target.appendChild(overlay);
    target.dataset.blurred = "true";
}

function applyBlur(originalUrl) {
    const videoId = extractVideoId(originalUrl);
    if (!videoId) return;

    if (isWatchPage) {
        const player = document.querySelector(".html5-video-player");
        if (player && !player.dataset.blurred) {
            createBlurOverlay(player);
        }

        const videoElement = document.querySelector('video.video-stream');
        if (videoElement && !videoElement.parentElement.dataset.blurred) {
            createBlurOverlay(videoElement.parentElement || videoElement);
        }
    }

    const selectors = [
        `a[href*="watch?v=${videoId}"]`,
        `ytd-video-renderer a[href*="watch?v=${videoId}"]`,
        `ytd-rich-item-renderer a[href*="watch?v=${videoId}"]`,
        `ytd-grid-video-renderer a[href*="watch?v=${videoId}"]`,
        `ytd-reel-video-renderer a[href*="watch?v=${videoId}"]`,
        `ytd-compact-video-renderer a[href*="watch?v=${videoId}"]`,
        `ytd-playlist-video-renderer a[href*="watch?v=${videoId}"]`
    ];

    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(anchor => {
            const container = anchor.closest(
                'ytd-video-renderer,ytd-rich-item-renderer,ytd-grid-video-renderer,ytd-reel-video-renderer,ytd-compact-video-renderer,ytd-playlist-video-renderer,ytd-search-pyv-renderer,ytd-watch-next-secondary-results-renderer'
            );
            if (container && !container.dataset.blurred) {
                createBlurOverlay(container);
            }
        });
    });
}

let blurTimeout = null;
const mutationObserver = new MutationObserver(() => {
    clearTimeout(blurTimeout);
    blurTimeout = setTimeout(blurElements, 100);
});
mutationObserver.observe(document.body, { childList: true, subtree: true });

function blurElements() {
    const anchors = document.querySelectorAll('a[href*="watch?v="]');
    anchors.forEach(anchor => intersectionObserver.observe(anchor));
}

blurElements();

window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    const scrollDirection = scrollPosition > lastScrollPosition ? 'down' : 'up';
    lastScrollPosition = scrollPosition;

    if (scrollDirection === 'down' &&
        !isLoadingBatch &&
        batchQueue.size > 0 &&
        (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
        scheduleBatchSend(true);
    }
});

let lastVideoUrl = null;
const urlCheckInterval = setInterval(() => {
    if (isWatchPage && window.location.href !== lastVideoUrl) {
        lastVideoUrl = window.location.href;
        const currentVideoUrl = cleanUrl(lastVideoUrl);
        analyzedVideos.delete(extractVideoId(currentVideoUrl));
        analyzeVideos([currentVideoUrl]);
    }
}, 300);
