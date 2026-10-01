/**
 * ARI 2026 LiveSpeech MLX TX - Embedded Web Client Engine
 * - Dynamic config.json Resolver for 5 Event Sessions
 * - Option B HTML5 Player Controls & Zero-Collision CC Architecture
 * - 2-Line High-Contrast Subtitle Display Box
 * - Supabase Realtime & Historic Captions Dual-Fetch Engine
 * - Background Matomo In-Memory Telemetry Bridge (postMessage)
 * - Dynamic AI Subtitle Disclaimer (Spanish & English)
 */

(function() {
    'use strict';

    // ==============================================================================
    // 1. URL Query Parameters & Theme Initialization
    // ==============================================================================
    const urlParams = new URLSearchParams(window.location.search);

    const sessionParam = urlParams.get('session') || urlParams.get('broadcast_id') || urlParams.get('v') || urlParams.get('id') || 'session_1';
    
    // Theme preference: URL param > localStorage > default dark
    const storedTheme = localStorage.getItem('livespeech_theme');
    const urlTheme = urlParams.get('theme');
    const effectiveTheme = urlTheme ? (urlTheme.toLowerCase() === 'light' ? 'light' : 'dark') : (storedTheme || 'dark');

    // Strictly enforce theme via data-theme attribute
    document.documentElement.setAttribute('data-theme', effectiveTheme);

    // Highlight active session pill in navigation bar if present
    const activePill = document.getElementById(`pill-${sessionParam}`);
    if (activePill) activePill.classList.add('active');

    // Dynamic Variables populated by config.json with fallback defaults
    const DEFAULT_CONFIG_FALLBACK = {
        supabase: {
            project_url: "https://kcdhrxtbylpaceeoglpq.supabase.co",
            anon_key: "sb_publishable_KvFrI2hGpyT7bm0MW17mwQ_ycsLnIav"
        },
        broadcast_id: {
            "session_1": "JVe72x6qjfo",
            "session_2": "XZ6oYuFedCk"
        }
    };

    let SUPABASE_URL = DEFAULT_CONFIG_FALLBACK.supabase.project_url;
    let SUPABASE_ANON_KEY = DEFAULT_CONFIG_FALLBACK.supabase.anon_key;
    const directBroadcastId = urlParams.get('broadcast_id') || urlParams.get('v') || urlParams.get('id');
    let resolvedBroadcastId = directBroadcastId || null;
    let isConfigLoaded = false;
    let isYouTubeApiReady = false;

    // ==============================================================================
    // 2. Application State Variables
    // ==============================================================================
    let player = null;
    let supabaseClient = null;
    let realtimeChannel = null;

    let isSubtitlesEnabled = true;
    let selectedLanguage = 'Spanish';
    let ttsEnabled = false;

    // Stream Mode & Timeline Scrubber State
    let isLiveMode = false;
    let isLiveDvr = false;
    let isUserScrubbing = false;
    let liveSeekableRange = { start: 0, end: 0 };
    let currentDuration = 0;

    // Timecode Subtitle Sync Engine & In-Memory Buffer
    let inMemoryCaptions = []; // Array of all session captions sorted by start_seconds
    let latestCaptionRecord = null;
    let syncTickerTimer = null;

    let availableLanguages = new Set(['Spanish', 'English']);
    let currentSessionCode = 'UNKNOWN';
    let currentPresentationCode = 'UNKNOWN';

    let viewerSessionId = localStorage.getItem('ls_viewer_session_id') || null;
    let heartbeatTimer = null;

    // ==============================================================================
    // 2B. Background Matomo Analytics Bridge (No on-screen display)
    // ==============================================================================
    const analyticsState = {
        impressionSent: false,
        lastPlayerState: null,
        lastProgressMessageAt: 0,
        milestonesSent: new Set()
    };

    function getPlayerSnapshot() {
        let progress = 0;
        let duration = 0;
        let muted = false;
        let volume = null;

        try {
            if (player && typeof player.getCurrentTime === 'function') progress = Number(player.getCurrentTime() || 0);
            if (player && typeof player.getDuration === 'function') duration = Number(player.getDuration() || 0);
            if (player && typeof player.isMuted === 'function') muted = !!player.isMuted();
            if (player && typeof player.getVolume === 'function') volume = Number(player.getVolume());
        } catch (e) {}

        return { progress, duration, muted, volume };
    }

    function emitAnalytics(action, extra = {}) {
        const payload = {
            type: 'livespeech:analytics',
            version: 2,
            action,
            session_key: sessionParam,
            broadcast_id: resolvedBroadcastId,
            selected_language: selectedLanguage,
            subtitles_enabled: isSubtitlesEnabled,
            tts_enabled: ttsEnabled,
            timestamp: Date.now(),
            ...extra
        };

        if (window.parent && window.parent !== window) {
            window.parent.postMessage(payload, '*');
        }
    }

    function checkAnalyticsMilestones(snapshot) {
        if (!snapshot || !snapshot.duration || snapshot.duration <= 0) return;
        const percent = (snapshot.progress / snapshot.duration) * 100;

        [25, 50, 75, 90].forEach((milestone) => {
            if (percent >= milestone && !analyticsState.milestonesSent.has(milestone)) {
                analyticsState.milestonesSent.add(milestone);
                emitAnalytics('milestone', { ...snapshot, milestone });
            }
        });
    }

    // ==============================================================================
    // 3. UI Element References
    // ==============================================================================
    const unmuteOverlay = document.getElementById('unmute-overlay');
    const btnUnmuteOverlay = document.getElementById('btn-unmute-overlay');

    // Poster Fallback Layer & Actions
    const posterLayer = document.getElementById('poster-layer');
    const posterImg = document.getElementById('poster-img');
    const btnPosterPlay = document.getElementById('btn-poster-play');
    const posterErrorNotice = document.getElementById('poster-error-notice');
    const posterErrorMsg = document.getElementById('poster-error-msg');
    const posterYtLink = document.getElementById('poster-yt-link');
    const posterStatusText = document.getElementById('poster-status-text');

    function updatePoster(videoId) {
        if (!videoId) return;
        const maxResUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
        const hqDefaultUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        if (posterImg) {
            posterImg.onerror = function() {
                if (this.src !== hqDefaultUrl) {
                    this.src = hqDefaultUrl;
                }
            };
            posterImg.src = maxResUrl;
        }

        if (posterYtLink) {
            posterYtLink.href = `https://www.youtube.com/watch?v=${videoId}`;
        }

        if (posterErrorNotice) {
            posterErrorNotice.classList.add('hidden');
        }
    }

    const btnCustomPlay = document.getElementById('btn-custom-play');
    const btnCustomMute = document.getElementById('btn-custom-mute');
    const inputCustomVolume = document.getElementById('input-custom-volume');
    const badgeLiveStatus = document.getElementById('badge-live-status');
    const displayPlayerTime = document.getElementById('display-player-time');
    const btnCustomFs = document.getElementById('btn-custom-fs');
    const timelineContainer = document.getElementById('timeline-container');
    const inputCustomSeek = document.getElementById('input-custom-seek');
    const seekFill = document.getElementById('seek-fill');

    const btnToggleSubtitles = document.getElementById('btn-toggle-subtitles');
    const subtitlesStateText = document.getElementById('subtitles-state-text');
    const btnTts = document.getElementById('btn-tts');
    const ttsStateText = document.getElementById('tts-state-text');

    const selectLanguage = document.getElementById('select-language');
    const infoTag = document.getElementById('info-tag');
    const waitingTag = document.getElementById('waiting-tag');

    const subtitleBox = document.getElementById('subtitle-box');
    const subtitleText = document.getElementById('subtitle-text');
    const aiDisclaimerText = document.getElementById('ai-disclaimer-text');

    // Dynamic AI Subtitle Disclaimer Texts (Spanish & English)
    const AI_DISCLAIMER_TEXTS = {
        Spanish: "Los subtítulos generados por IA pueden contener imprecisiones o discordancias",
        English: "AI-generated subtitles may contain inaccuracies or mismatches"
    };

    function updateAiDisclaimer(lang) {
        if (!aiDisclaimerText) return;
        const normalized = (lang || '').toLowerCase().includes('english') ? 'English' : 'Spanish';
        aiDisclaimerText.textContent = AI_DISCLAIMER_TEXTS[normalized] || AI_DISCLAIMER_TEXTS.Spanish;
    }

    // Emoji Flag Helper
    function getFlagIcon(languageName) {
        const lang = (languageName || '').toLowerCase();
        if (lang.includes('spanish') || lang.includes('español')) return '🇪🇸';
        if (lang.includes('english')) return '🇬🇧';
        return '🌐';
    }

    // Format Seconds to MM:SS or HH:MM:SS
    function formatTime(totalSeconds) {
        const sec = Math.max(0, Math.floor(totalSeconds));
        const hours = Math.floor(sec / 3600);
        const minutes = Math.floor((sec % 3600) / 60);
        const seconds = sec % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // ==============================================================================
    // 4. Config Loader (Multi-Path Fallback)
    // ==============================================================================
    async function loadConfig() {
        const candidatePaths = ['config.json', './config.json', '../config.json', '/26-09-30_BeLight/config.json', '/config.json'];
        let loaded = false;

        for (const path of candidatePaths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    const data = await response.json();
                    const cfg = Array.isArray(data) ? data[0] : data;

                    if (cfg && cfg.supabase) {
                        SUPABASE_URL = cfg.supabase.project_url || SUPABASE_URL;
                        SUPABASE_ANON_KEY = cfg.supabase.anon_key || SUPABASE_ANON_KEY;
                    }

                    if (!directBroadcastId) {
                        if (cfg && cfg.broadcast_id && cfg.broadcast_id[sessionParam]) {
                            resolvedBroadcastId = cfg.broadcast_id[sessionParam];
                        } else if (DEFAULT_CONFIG_FALLBACK.broadcast_id && DEFAULT_CONFIG_FALLBACK.broadcast_id[sessionParam]) {
                            resolvedBroadcastId = DEFAULT_CONFIG_FALLBACK.broadcast_id[sessionParam];
                        } else {
                            resolvedBroadcastId = sessionParam;
                        }
                    }
                    loaded = true;
                    console.log(`[Config] Successfully loaded configuration from: ${path}`);
                    break;
                }
            } catch (e) {
                // Try next candidate
            }
        }

        if (!loaded) {
            console.warn('[Config] Using embedded default configuration fallback.');
            if (!resolvedBroadcastId && DEFAULT_CONFIG_FALLBACK.broadcast_id) {
                resolvedBroadcastId = DEFAULT_CONFIG_FALLBACK.broadcast_id[sessionParam] || sessionParam;
            }
        }

        isConfigLoaded = true;
        console.log(`[Config] Active Session: ${sessionParam} -> YouTube ID: ${resolvedBroadcastId}`);
        updatePoster(resolvedBroadcastId);
        initSupabase();
        tryInitYouTubePlayer();
    }

    // ==============================================================================
    // 5. YouTube Player API Setup & Event Handlers
    // ==============================================================================
    function tryInitYouTubePlayer() {
        if (!isConfigLoaded || !isYouTubeApiReady || player) return;
        if (!window.YT || !window.YT.Player) return;
        if (!resolvedBroadcastId) {
            console.warn('[YouTube] Cannot init player: resolvedBroadcastId is not set.');
            return;
        }
        console.log('[YouTube] Initializing player for:', resolvedBroadcastId);

        player = new YT.Player('player', {
            videoId: resolvedBroadcastId,
            host: 'https://www.youtube.com',
            playerVars: {
                autoplay: 1,
                mute: 1,           // Autoplay muted per browser policy
                controls: 0,       // Custom HTML5 controls bar
                modestbranding: 1,
                rel: 0,
                playsinline: 1,
                enablejsapi: 1,
                origin: window.location.origin,
                iv_load_policy: 3,
                fs: 0,
                cc_load_policy: 0, // Strict Option B: YouTube native CC disabled
                cc_lang_pref: 'none',
                hl: 'es'
            },
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
                onError: onPlayerError
            }
        });
    }

    if (window.YT && window.YT.Player) {
        isYouTubeApiReady = true;
        tryInitYouTubePlayer();
    } else {
        window.onYouTubeIframeAPIReady = function() {
            isYouTubeApiReady = true;
            tryInitYouTubePlayer();
        };
    }

    // Strictly disable YouTube native CC / subtitles module and active caption tracks
    function forceYouTubeCcOff() {
        if (!player) return;
        try {
            if (typeof player.unloadModule === 'function') {
                player.unloadModule('cc');
                player.unloadModule('captions');
            }
            if (typeof player.setOption === 'function') {
                player.setOption('captions', 'track', {});
                player.setOption('cc', 'track', {});
                player.setOption('captions', 'reload', false);
                player.setOption('captions', 'fontSize', -1);
            }
        } catch (e) {}
    }

    function onPlayerReady(event) {
        console.log('[YouTube] Player ready.');

        // Force native YouTube subtitles strictly OFF
        forceYouTubeCcOff();

        // Send impression event to host
        if (!analyticsState.impressionSent) {
            analyticsState.impressionSent = true;
            emitAnalytics('impression', getPlayerSnapshot());
        }

        // Start timecode sync ticker (200ms)
        startSubtitleSyncTicker();

        // Autoplay check & Option C Unmute Overlay
        try {
            player.playVideo();
            setTimeout(() => {
                if (player && typeof player.isMuted === 'function' && player.isMuted()) {
                    if (unmuteOverlay) unmuteOverlay.classList.remove('faded');
                } else {
                    if (unmuteOverlay) unmuteOverlay.classList.add('faded');
                }
            }, 800);
        } catch (err) {}
    }

    function onPlayerStateChange(event) {
        analyticsState.lastPlayerState = event.data;

        if (event.data === YT.PlayerState.PLAYING) {
            forceYouTubeCcOff();
            if (posterLayer) posterLayer.classList.add('faded');
            if (btnCustomPlay) btnCustomPlay.textContent = '⏸ PAUSE';
            emitAnalytics('play', getPlayerSnapshot());
        } else if (event.data === YT.PlayerState.PAUSED) {
            if (btnCustomPlay) btnCustomPlay.textContent = '▶ PLAY';
            emitAnalytics('pause', getPlayerSnapshot());
        } else if (event.data === YT.PlayerState.ENDED) {
            if (btnCustomPlay) btnCustomPlay.textContent = '▶ REPLAY';
            if (posterLayer) posterLayer.classList.remove('faded');
            emitAnalytics('finish', getPlayerSnapshot());
        } else if (event.data === YT.PlayerState.BUFFERING) {
            forceYouTubeCcOff();
            emitAnalytics('buffering', getPlayerSnapshot());
        }
    }

    function onPlayerError(event) {
        console.warn('[YouTube Player Error]:', event.data);
        if (posterLayer) {
            posterLayer.classList.remove('faded');
        }
        if (posterErrorNotice) {
            posterErrorNotice.classList.remove('hidden');
            if (posterErrorMsg) {
                if (event.data === 101 || event.data === 150 || event.data === 153) {
                    posterErrorMsg.textContent = 'Esta emisión no permite reproducción externa o requiere abrirse directamente en YouTube:';
                } else if (event.data === 100) {
                    posterErrorMsg.textContent = 'Emisión o vídeo no encontrado en YouTube.';
                } else {
                    posterErrorMsg.textContent = 'No se pudo reproducir la emisión en el reproductor embebido:';
                }
            }
        }
        if (posterYtLink) {
            posterYtLink.href = `https://www.youtube.com/watch?v=${resolvedBroadcastId}`;
        }
        emitAnalytics('error', { error_code: event.data, broadcast_id: resolvedBroadcastId });
    }

    // Poster Click & Play Action
    function handlePosterPlay() {
        console.log('[Poster] Play triggered for:', resolvedBroadcastId);
        if (player) {
            try {
                if (typeof player.playVideo === 'function') {
                    player.playVideo();
                }
                triggerUnmute();
            } catch (e) {
                console.warn('[Poster] Play trigger error:', e);
            }
        }
    }

    if (btnPosterPlay) {
        btnPosterPlay.addEventListener('click', (e) => {
            e.stopPropagation();
            handlePosterPlay();
        });
    }

    if (posterLayer) {
        posterLayer.addEventListener('click', (e) => {
            if (e.target.closest('#poster-error-notice') || e.target.closest('#poster-yt-link')) {
                return;
            }
            handlePosterPlay();
        });
    }

    // Option C Central Unmute Trigger
    function triggerUnmute() {
        if (player && typeof player.unMute === 'function') {
            player.unMute();
            player.setVolume(100);
            if (btnCustomMute) btnCustomMute.textContent = '🔊 MUTE';
            if (inputCustomVolume) inputCustomVolume.value = 100;
            emitAnalytics('unmute', getPlayerSnapshot());
        }
        if (unmuteOverlay) {
            unmuteOverlay.classList.add('faded');
        }
    }

    if (unmuteOverlay) {
        unmuteOverlay.addEventListener('click', triggerUnmute);
    }
    if (btnUnmuteOverlay) {
        btnUnmuteOverlay.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerUnmute();
        });
    }

    // Full Video Surface Shield: blocks direct YouTube iframe clicks (prevents native CC/UI activation)
    // Clicking toggles play/pause or triggers Option C unmute
    const ytShieldFull = document.getElementById('yt-shield-full') || document.querySelector('.yt-shield-full');
    const shieldTop = document.querySelector('.yt-shield-top');
    const shieldBottom = document.querySelector('.yt-shield-bottom-right');

    function handleVideoShieldClick() {
        if (!player) return;
        if (typeof player.isMuted === 'function' && player.isMuted()) {
            triggerUnmute();
            return;
        }
        if (typeof player.getPlayerState === 'function') {
            const state = player.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                player.pauseVideo();
            } else {
                player.playVideo();
            }
        }
    }

    if (ytShieldFull) ytShieldFull.addEventListener('click', handleVideoShieldClick);
    if (shieldTop) shieldTop.addEventListener('click', handleVideoShieldClick);
    if (shieldBottom) shieldBottom.addEventListener('click', handleVideoShieldClick);

    // Play/Pause Button
    if (btnCustomPlay) {
        btnCustomPlay.addEventListener('click', () => {
            if (!player || typeof player.getPlayerState !== 'function') return;
            const state = player.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                player.pauseVideo();
            } else {
                player.playVideo();
            }
        });
    }

    // Mute Button
    if (btnCustomMute) {
        btnCustomMute.addEventListener('click', () => {
            if (!player || typeof player.isMuted !== 'function') return;
            if (player.isMuted()) {
                triggerUnmute();
            } else {
                player.mute();
                btnCustomMute.textContent = '🔇 UNMUTE';
                if (inputCustomVolume) inputCustomVolume.value = 0;
                emitAnalytics('mute', getPlayerSnapshot());
            }
        });
    }

    // Volume Slider
    if (inputCustomVolume) {
        inputCustomVolume.addEventListener('input', (e) => {
            const vol = parseInt(e.target.value, 10);
            if (player && typeof player.setVolume === 'function') {
                player.setVolume(vol);
                if (vol === 0) {
                    player.mute();
                    if (btnCustomMute) btnCustomMute.textContent = '🔇 UNMUTE';
                } else {
                    if (player.isMuted()) player.unMute();
                    if (btnCustomMute) btnCustomMute.textContent = '🔊 MUTE';
                    if (autoplayBanner) autoplayBanner.classList.add('hidden');
                }
            }
        });
        inputCustomVolume.addEventListener('change', (e) => {
            emitAnalytics('volume_change', { ...getPlayerSnapshot(), volume: parseInt(e.target.value, 10) });
        });
    }

    // Timeline Seek Slider (Subtle Scrubber)
    if (inputCustomSeek) {
        inputCustomSeek.addEventListener('input', (e) => {
            isUserScrubbing = true;
            const val = parseFloat(e.target.value);
            const min = parseFloat(e.target.min) || 0;
            const max = parseFloat(e.target.max) || 100;
            const pct = max > min ? Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100)) : 0;
            if (seekFill) seekFill.style.width = `${pct}%`;

            if (displayPlayerTime) {
                if (isLiveMode && isLiveDvr) {
                    const behind = Math.max(0, liveSeekableRange.end - val);
                    displayPlayerTime.textContent = behind > 5 ? `-${formatTime(behind)}` : formatTime(val);
                } else {
                    displayPlayerTime.textContent = `${formatTime(val)} / ${formatTime(currentDuration)}`;
                }
            }
        });

        inputCustomSeek.addEventListener('change', (e) => {
            const targetSeconds = parseFloat(e.target.value);
            if (player && typeof player.seekTo === 'function') {
                player.seekTo(targetSeconds, true);
            }
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            emitAnalytics('seek', { ...getPlayerSnapshot(), seek_to: targetSeconds });

            setTimeout(() => {
                isUserScrubbing = false;
            }, 150);
        });
    }

    // Interactive Live Jump Button
    if (badgeLiveStatus) {
        badgeLiveStatus.addEventListener('click', () => {
            if (isLiveMode && isLiveDvr && badgeLiveStatus.classList.contains('interactive')) {
                const targetLive = liveSeekableRange.end || currentDuration;
                if (player && typeof player.seekTo === 'function' && targetLive > 0) {
                    player.seekTo(targetLive, true);
                }
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                }
                emitAnalytics('seek', { ...getPlayerSnapshot(), seek_to: targetLive, jump_live: true });
            }
        });
    }

    // Fullscreen Toggle Handler
    if (btnCustomFs) {
        btnCustomFs.addEventListener('click', () => {
            const container = document.querySelector('.app-container') || document.documentElement;
            const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);

            if (!isFs) {
                if (container.requestFullscreen) {
                    container.requestFullscreen().catch(err => console.warn(err));
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(err => console.warn(err));
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        });
    }

    function updateFullscreenButtonIcon() {
        if (!btnCustomFs) return;
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        const container = document.querySelector('.app-container');
        if (container) {
            container.classList.toggle('is-fullscreen', isFs);
        }
        btnCustomFs.textContent = isFs ? '🗗' : '⛶';
        btnCustomFs.title = isFs ? 'Exit Fullscreen' : 'Toggle Fullscreen';
        emitAnalytics(isFs ? 'fullscreen_enter' : 'fullscreen_exit', getPlayerSnapshot());
    }

    document.addEventListener('fullscreenchange', updateFullscreenButtonIcon);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButtonIcon);

    // ==============================================================================
    // 6. Supabase Init & Dual-Fetch Sync Engine
    // ==============================================================================
    async function initSupabase() {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('[Supabase] Missing credentials URL or Anon Key.');
            return;
        }

        try {
            console.log('[Supabase] Initializing client for broadcast:', resolvedBroadcastId);
            const { createClient } = window.supabase;
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            await fetchHistoricCaptions();

            if (realtimeChannel) {
                supabaseClient.removeChannel(realtimeChannel);
            }

            realtimeChannel = supabaseClient
                .channel(`public:captions:${resolvedBroadcastId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'captions',
                    filter: `broadcast_id=eq.${resolvedBroadcastId}`
                }, (payload) => {
                    handleNewCaption(payload.new);
                })
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'captions',
                    filter: `broadcast_id=eq.${resolvedBroadcastId}`
                }, (payload) => {
                    handleNewCaption(payload.new);
                })
                .subscribe((status) => {
                    console.log('[Supabase Realtime Status]:', status);
                });

            if (heartbeatTimer) clearInterval(heartbeatTimer);
            sendHeartbeat();
            heartbeatTimer = setInterval(sendHeartbeat, 20000);

        } catch (err) {
            console.error('[Supabase Error]:', err);
        }
    }

    async function fetchHistoricCaptions() {
        if (!supabaseClient) return;

        try {
            console.log('[Dual-Fetch] Fetching historic captions for broadcast:', resolvedBroadcastId);
            const { data, error } = await supabaseClient
                .from('captions')
                .select('*')
                .eq('broadcast_id', resolvedBroadcastId)
                .order('start_seconds', { ascending: true })
                .range(0, 9999);

            if (error) {
                console.warn('[Historic Captions Error]:', error);
                return;
            }

            if (data && data.length > 0) {
                inMemoryCaptions = data;
                latestCaptionRecord = data[data.length - 1];
                if (waitingTag) waitingTag.classList.add('hidden');
                console.log(`[Historic Captions] Loaded ${data.length} captions.`);
            }
        } catch (err) {
            console.error('[Dual-Fetch Exception]:', err);
        }
    }

    function handleNewCaption(newRow) {
        if (!newRow) return;

        if (waitingTag) waitingTag.classList.add('hidden');

        const existingIndex = inMemoryCaptions.findIndex(c => c.id === newRow.id);
        if (existingIndex >= 0) {
            inMemoryCaptions[existingIndex] = newRow;
        } else {
            inMemoryCaptions.push(newRow);
            inMemoryCaptions.sort((a, b) => (a.start_seconds || 0) - (b.start_seconds || 0));
        }

        latestCaptionRecord = inMemoryCaptions[inMemoryCaptions.length - 1];
    }

    // ==============================================================================
    // 7. Timecode Subtitle Synchronization Engine
    // ==============================================================================
    function startSubtitleSyncTicker() {
        if (syncTickerTimer) clearInterval(syncTickerTimer);

        syncTickerTimer = setInterval(() => {
            tickSubtitleSync();
        }, 200);
    }

    function tickSubtitleSync() {
        if (!player || typeof player.getCurrentTime !== 'function') return;

        let currentTime = 0;
        let duration = 0;
        try {
            currentTime = player.getCurrentTime() || 0;
            duration = player.getDuration() || 0;
        } catch (e) {
            return;
        }

        currentDuration = duration;

        // Detect seekable range and stream type
        try {
            if (typeof player.getSeekableRange === 'function') {
                const seekable = player.getSeekableRange();
                if (seekable && typeof seekable.start === 'number' && typeof seekable.end === 'number') {
                    liveSeekableRange = seekable;
                    if ((seekable.end - seekable.start) > 30) {
                        isLiveDvr = true;
                    }
                }
            }
        } catch (e) {}

        try {
            if (typeof player.getVideoData === 'function') {
                const vData = player.getVideoData();
                if (vData && typeof vData.isLive === 'boolean') {
                    isLiveMode = vData.isLive;
                }
            }
        } catch (e) {}

        // If duration is positive and fixed, it is playable as VOD (even if it was a recorded live broadcast)
        if (duration > 0) {
            isLiveMode = false;
        } else if (!isLiveMode && duration === 0 && currentTime > 0) {
            isLiveMode = true;
        }

        // UI Updates for Timeline & Time Display (only if not actively dragging)
        if (!isUserScrubbing) {
            if (isLiveMode && !isLiveDvr) {
                // Active Live without DVR: hide scrubber, show LIVE badge
                if (timelineContainer) timelineContainer.classList.add('hidden');
                if (badgeLiveStatus) {
                    badgeLiveStatus.classList.remove('hidden', 'is-behind', 'interactive');
                    badgeLiveStatus.textContent = '🔴 LIVE';
                }
                if (displayPlayerTime) {
                    displayPlayerTime.textContent = formatTime(currentTime);
                }
            } else if (isLiveMode && isLiveDvr) {
                // Live with DVR: show scrubber, allow rewinding
                if (timelineContainer) timelineContainer.classList.remove('hidden');
                if (inputCustomSeek) {
                    inputCustomSeek.min = liveSeekableRange.start;
                    inputCustomSeek.max = liveSeekableRange.end;
                    inputCustomSeek.value = currentTime;
                }
                const liveRange = liveSeekableRange.end - liveSeekableRange.start;
                const livePct = liveRange > 0 ? Math.max(0, Math.min(100, ((currentTime - liveSeekableRange.start) / liveRange) * 100)) : 100;
                if (seekFill) seekFill.style.width = `${livePct}%`;

                const behindSeconds = Math.max(0, liveSeekableRange.end - currentTime);
                if (behindSeconds > 10) {
                    if (badgeLiveStatus) {
                        badgeLiveStatus.classList.remove('hidden');
                        badgeLiveStatus.classList.add('interactive', 'is-behind');
                        badgeLiveStatus.textContent = `⚪ LIVE (-${formatTime(behindSeconds)})`;
                        badgeLiveStatus.title = 'Haga clic para volver al directo';
                    }
                } else {
                    if (badgeLiveStatus) {
                        badgeLiveStatus.classList.remove('hidden', 'is-behind', 'interactive');
                        badgeLiveStatus.textContent = '🔴 LIVE';
                        badgeLiveStatus.title = 'Emisión en directo';
                    }
                }
                if (displayPlayerTime) {
                    displayPlayerTime.textContent = formatTime(currentTime);
                }
            } else {
                // VOD Mode (Standard video or archived live stream)
                if (timelineContainer) {
                    timelineContainer.classList.remove('hidden');
                }
                if (inputCustomSeek) {
                    inputCustomSeek.min = 0;
                    inputCustomSeek.max = duration > 0 ? duration : 100;
                    inputCustomSeek.value = currentTime;
                }
                const vodPct = duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0;
                if (seekFill) seekFill.style.width = `${vodPct}%`;

                if (badgeLiveStatus) {
                    badgeLiveStatus.classList.add('hidden');
                }
                if (displayPlayerTime) {
                    displayPlayerTime.textContent = duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : formatTime(currentTime);
                }
            }
        }

        const snapshot = getPlayerSnapshot();

        // Check milestones
        checkAnalyticsMilestones(snapshot);

        // Periodic Media Analytics progress ping (every 5 seconds)
        const now = Date.now();
        if (now - analyticsState.lastProgressMessageAt >= 5000) {
            analyticsState.lastProgressMessageAt = now;
            emitAnalytics('progress', snapshot);
        }

        // Periodically enforce YouTube native CC strictly OFF
        if (currentTime > 0 && Math.floor(currentTime * 5) % 10 === 0) {
            forceYouTubeCcOff();
        }

        // Subtitles rendering
        if (!isSubtitlesEnabled) {
            if (subtitleText && subtitleText.textContent !== '') {
                subtitleText.textContent = '';
            }
            return;
        }

        if (!inMemoryCaptions || inMemoryCaptions.length === 0) {
            return;
        }

        // Find active caption matching currentTime: start_seconds <= currentTime <= end_seconds + 1.2s tolerance
        let matchedRecord = null;
        for (let i = inMemoryCaptions.length - 1; i >= 0; i--) {
            const cap = inMemoryCaptions[i];
            const start = Number(cap.start_seconds || 0);
            const end = Number(cap.end_seconds || cap.start_seconds || 0) + 1.2;

            if (currentTime >= start && currentTime <= end) {
                matchedRecord = cap;
                break;
            }
        }

        // Fallback to latest record ONLY if live streaming near live edge (within 5 seconds)
        if (!matchedRecord && latestCaptionRecord && isLiveMode) {
            const edge = liveSeekableRange.end || currentTime;
            if (Math.abs(currentTime - edge) <= 5.0) {
                const latestEnd = Number(latestCaptionRecord.end_seconds || latestCaptionRecord.start_seconds || 0) + 4.0;
                if (currentTime >= latestEnd - 5.0 && currentTime <= latestEnd) {
                    matchedRecord = latestCaptionRecord;
                }
            }
        }

        renderCaptionRecord(matchedRecord);
    }

    function renderCaptionRecord(record) {
        if (!subtitleText) return;

        if (!record) {
            subtitleText.textContent = '';
            return;
        }

        const resolvedText = extractCaptionText(record, selectedLanguage);

        if (subtitleText.textContent !== resolvedText) {
            subtitleText.textContent = resolvedText;

            // Update badge (Original vs Translated)
            const isOriginal = isOriginalLanguage(record, selectedLanguage);
            if (infoTag) {
                infoTag.textContent = isOriginal ? 'Original' : 'Translated';
                infoTag.className = `info-tag ${isOriginal ? 'badge-original' : 'badge-translated'}`;
            }

            // Web Speech Synthesis (TTS) - suppressed while scrubbing
            if (ttsEnabled && resolvedText && !isUserScrubbing) {
                speakText(resolvedText, selectedLanguage);
            }
        }
    }

    function extractCaptionText(record, targetLanguage) {
        if (!record) return '';

        // Sibling captions format: record.captions[targetLanguage]
        if (record.captions && typeof record.captions === 'object') {
            const langEntry = record.captions[targetLanguage];
            if (langEntry) {
                if (typeof langEntry === 'string') return langEntry.toUpperCase();
                if (typeof langEntry === 'object' && langEntry.text) return String(langEntry.text).toUpperCase();
            }

            // Fallback to Spanish or first available
            if (record.captions['Spanish']) {
                const s = record.captions['Spanish'];
                return (typeof s === 'string' ? s : s.text || '').toUpperCase();
            }
        }

        if (record.text) {
            return String(record.text).toUpperCase();
        }

        return '';
    }

    function isOriginalLanguage(record, targetLanguage) {
        if (!record) return true;

        if (record.source_language) {
            return record.source_language.toLowerCase() === targetLanguage.toLowerCase();
        }

        if (record.captions && typeof record.captions === 'object') {
            const entry = record.captions[targetLanguage];
            if (entry && typeof entry === 'object' && entry.sourceLanguage === true) {
                return true;
            }
        }

        // By default Spanish is source language in ARI 2026
        return targetLanguage.toLowerCase() === 'spanish';
    }

    // ==============================================================================
    // 8. Web Speech Synthesis (TTS) Engine
    // ==============================================================================
    let lastSpokenText = '';

    function speakText(text, languageName) {
        if (!('speechSynthesis' in window)) return;
        if (!text || text === lastSpokenText) return;

        window.speechSynthesis.cancel(); // Stop prior utterance
        lastSpokenText = text;

        const utterance = new SpeechSynthesisUtterance(text);
        const langCode = (languageName || '').toLowerCase().includes('english') ? 'en-US' : 'es-ES';
        utterance.lang = langCode;
        utterance.rate = 1.05;

        window.speechSynthesis.speak(utterance);
    }

    // ==============================================================================
    // 9. UI Controls Interactions
    // ==============================================================================
    // Toggle Subtitles Overlay Button
    if (btnToggleSubtitles) {
        btnToggleSubtitles.addEventListener('click', () => {
            isSubtitlesEnabled = !isSubtitlesEnabled;
            btnToggleSubtitles.classList.toggle('active', isSubtitlesEnabled);
            if (subtitlesStateText) subtitlesStateText.textContent = isSubtitlesEnabled ? 'ON' : 'OFF';

            if (!isSubtitlesEnabled && subtitleText) {
                subtitleText.textContent = '';
            }

            emitAnalytics(isSubtitlesEnabled ? 'subtitles_on' : 'subtitles_off', getPlayerSnapshot());
        });
    }

    // Toggle Web Speech TTS Button
    if (btnTts) {
        btnTts.addEventListener('click', () => {
            ttsEnabled = !ttsEnabled;
            btnTts.classList.toggle('active', ttsEnabled);
            if (ttsStateText) ttsStateText.textContent = ttsEnabled ? 'ON' : 'OFF';

            if (ttsEnabled) {
                // Mute YouTube player so TTS is clear
                if (player && typeof player.mute === 'function') {
                    player.mute();
                    if (btnCustomMute) btnCustomMute.textContent = '🔇 UNMUTE';
                    if (inputCustomVolume) inputCustomVolume.value = 0;
                }
                if (subtitleText && subtitleText.textContent) {
                    speakText(subtitleText.textContent, selectedLanguage);
                }
            } else {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                // Restore YouTube audio
                if (player && typeof player.unMute === 'function') {
                    player.unMute();
                    player.setVolume(100);
                    if (btnCustomMute) btnCustomMute.textContent = '🔊 MUTE';
                    if (inputCustomVolume) inputCustomVolume.value = 100;
                }
            }

            emitAnalytics(ttsEnabled ? 'tts_on' : 'tts_off', getPlayerSnapshot());
        });
    }

    // Language Dropdown Selector
    if (selectLanguage) {
        selectLanguage.addEventListener('change', (e) => {
            selectedLanguage = e.target.value;
            console.log('[Language Changed]:', selectedLanguage);

            // Update dynamic AI disclaimer
            updateAiDisclaimer(selectedLanguage);

            // Force refresh of current displayed subtitle
            if (subtitleText) {
                tickSubtitleSync();
            }

            emitAnalytics('language_change', {
                ...getPlayerSnapshot(),
                language: selectedLanguage,
                selected_language: selectedLanguage
            });
        });
    }

    // ==============================================================================
    // 10. Heartbeat Telemetry (Supabase RPC ping_viewer_session)
    // ==============================================================================
    async function sendHeartbeat() {
        if (!supabaseClient || !resolvedBroadcastId) return;

        try {
            const { data, error } = await supabaseClient.rpc('ping_viewer_session', {
                p_session_id: viewerSessionId,
                p_broadcast_id: resolvedBroadcastId,
                p_current_presentation_code: currentPresentationCode,
                p_current_session_code: currentSessionCode
            });

            if (!error && data) {
                viewerSessionId = data;
                localStorage.setItem('ls_viewer_session_id', viewerSessionId);
            }
        } catch (e) {
            // Heartbeat fails gracefully without disrupting playback
        }
    }

    // ==============================================================================
    // 11. Light / Dark Theme Toggle Setup
    // ==============================================================================
    function setupThemeToggle() {
        const btnTheme = document.getElementById('btn-theme-toggle');
        const themeIcon = document.getElementById('theme-icon');
        const themeText = document.getElementById('theme-text');

        function updateThemeUI(currentTheme) {
            if (!btnTheme) return;
            if (currentTheme === 'dark') {
                if (themeIcon) themeIcon.textContent = '☀️';
                if (themeText) themeText.textContent = 'CLARO';
                btnTheme.title = 'Cambiar a Modo Claro';
            } else {
                if (themeIcon) themeIcon.textContent = '🌙';
                if (themeText) themeText.textContent = 'OSCURO';
                btnTheme.title = 'Cambiar a Modo Oscuro';
            }
        }

        const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        updateThemeUI(activeTheme);

        if (btnTheme) {
            btnTheme.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme') || 'dark';
                const next = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('livespeech_theme', next);
                updateThemeUI(next);
                emitAnalytics('theme_toggle', {
                    ...getPlayerSnapshot(),
                    theme: next
                });
            });
        }
    }

    // ==============================================================================
    // 12. Startup Initialization
    // ==============================================================================
    updatePoster(resolvedBroadcastId);
    updateAiDisclaimer(selectedLanguage);
    setupThemeToggle();
    loadConfig();

})();
