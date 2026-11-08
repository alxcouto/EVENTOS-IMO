/**
 * TIR 2026 (Trends in Retina) LiveSpeech MLX TX - Embedded Web Client Engine
 * - Dynamic config.json Resolver for 10 TIR 2026 Event Sessions
 * - Option B HTML5 Player Controls & Zero-Collision CC Architecture
 * - 2-Line High-Contrast Subtitle Display Box
 * - Supabase Realtime & Historic Captions Dual-Fetch Engine (broadcast_id based)
 * - Nested JSON captions parser (record.captions[Language].text) & Multi-Format Fallback
 * - Background Matomo In-Memory Telemetry Bridge (postMessage)
 * - Dynamic AI Subtitle Disclaimer (Spanish & English)
 * - Hairline Timeline Scrubber with Live / VOD Dynamic Sync
 * - Dual Navigation: Compact Session Dropdown & Smooth-Scroll Pills
 */

(function() {
    'use strict';

    // ==============================================================================
    // 1. URL Query Parameters & Theme Initialization
    // ==============================================================================
    const urlParams = new URLSearchParams(window.location.search);

    const rawSession = urlParams.get('session') || urlParams.get('broadcast_id') || urlParams.get('v') || urlParams.get('id');
    // If opened directly without a session parameter, redirect back to the event agenda
    if (!rawSession && window.location.pathname.includes('/player')) {
        window.location.href = '../';
        return;
    }
    const sessionParam = rawSession || 'SESSION_1';
    
    // Theme preference: URL param > localStorage > default dark
    const storedTheme = localStorage.getItem('livespeech_theme');
    const urlTheme = urlParams.get('theme');
    const effectiveTheme = urlTheme ? (urlTheme.toLowerCase() === 'light' ? 'light' : 'dark') : (storedTheme || 'dark');

    // Strictly enforce theme via data-theme attribute
    document.documentElement.setAttribute('data-theme', effectiveTheme);

    // Sync active session pill and dropdown selector
    const activePill = document.getElementById(`pill-${sessionParam}`);
    if (activePill) {
        activePill.classList.add('active');
        setTimeout(() => {
            activePill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }, 100);
    }

    const sessionSelect = document.getElementById('player-session-select');
    if (sessionSelect) {
        sessionSelect.value = sessionParam;
        sessionSelect.addEventListener('change', (e) => {
            const nextSession = e.target.value;
            if (nextSession && nextSession !== sessionParam) {
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('session', nextSession);
                window.location.href = newUrl.toString();
            }
        });
    }

    // Default configuration for TIR 2026 (Trends in Retina)
    const DEFAULT_CONFIG_FALLBACK = {
        supabase: {
            project_url: "https://kcdhrxtbylpaceeoglpq.supabase.co",
            anon_key: "sb_publishable_KvFrI2hGpyT7bm0MW17mwQ_ycsLnIav"
        },
        broadcast_id: {
            "SESSION_1": "9MtaD5_oPL0",
            "WORKSHOP": "1YjwN27pi-4",
            "SESSION_2": "OZDtmw2Gxno",
            "SESSION_3": "9ZktoWvqvC4",
            "KEYNOTE_LECTURE": "BlBzdjhzTys",
            "SESSION_4": "-0yLICazZRU",
            "SESSION_5": "c4RzexTbrYA",
            "SESSION_6": "P4QpSE959QY",
            "SESSION_7": "y3fQcCz-7oY",
            "SESSION_8": "Sb6ppJMYaY0"
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
    let streamDuration = 0;
    let isUserSeeking = false;
    let timeUpdateInterval = null;

    // Dedicated VOD tracking state
    let isVodDurationStable = false;
    let lastPolledVodDuration = 0;
    let consecutiveDurationMatches = 0;

    // Caption State
    let inMemoryCaptions = []; // Array of all session captions sorted by start_seconds
    let latestCaptionRecord = null;
    let lastMatchedCaptionIndex = -1;
    let currentRenderedRecord = null;
    let detectedSourceLanguage = null;

    let lastEmittedText = '';
    let lastEmittedTimestamp = 0;
    const DEDUPLICATION_WINDOW_MS = 1500;

    // DOM Element References
    const subtitleBox = document.getElementById('subtitle-box');
    const subtitleTextEl = document.getElementById('subtitle-text');
    const selectLanguage = document.getElementById('select-language');
    const waitingTag = document.getElementById('waiting-tag');
    const infoTag = document.getElementById('info-tag');
    const btnToggleSubtitles = document.getElementById('btn-toggle-subtitles');
    const subtitlesStateText = document.getElementById('subtitles-state-text');
    const btnTts = document.getElementById('btn-tts');
    const ttsStateText = document.getElementById('tts-state-text');
    const aiDisclaimer = document.getElementById('ai-disclaimer');
    const aiDisclaimerText = document.getElementById('ai-disclaimer-text');
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    // Option B Custom Controls DOM References
    const btnCustomPlay = document.getElementById('btn-custom-play');
    const btnCustomMute = document.getElementById('btn-custom-mute');
    const inputCustomVolume = document.getElementById('input-custom-volume');
    const btnCustomFs = document.getElementById('btn-custom-fs');
    const ytShieldFull = document.getElementById('yt-shield-full');
    const unmuteOverlay = document.getElementById('unmute-overlay');
    const btnUnmuteOverlay = document.getElementById('btn-unmute-overlay');
    const posterLayer = document.getElementById('poster-layer');
    const posterImg = document.getElementById('poster-img');
    const btnPosterPlay = document.getElementById('btn-poster-play');
    const posterErrorNotice = document.getElementById('poster-error-notice');
    const posterErrorMsg = document.getElementById('poster-error-msg');
    const posterYtLink = document.getElementById('poster-yt-link');

    // Timeline Scrubber DOM References
    const timelineContainer = document.getElementById('timeline-container');
    const inputCustomSeek = document.getElementById('input-custom-seek');
    const seekFill = document.getElementById('seek-fill');
    const displayPlayerTime = document.getElementById('display-player-time');
    const badgeLiveStatus = document.getElementById('badge-live-status');

    // Matomo Telemetry Session Tracking
    let viewerSessionId = localStorage.getItem('ls_viewer_session_id') || null;
    let heartbeatTimer = null;
    let lastTrackedState = -1;

    // Matomo Telemetry Bridge (Parent Window Communication)
    function sendMatomoTelemetry(action, payload = {}) {
        const message = {
            source: 'livespeech-player',
            type: 'livespeech:analytics',
            version: 2,
            action: action,
            session_key: sessionParam,
            broadcast_id: resolvedBroadcastId,
            timestamp: new Date().toISOString(),
            ...payload
        };
        try {
            window.parent.postMessage(message, '*');
        } catch (e) {
            console.debug('[Matomo Bridge] Failed sending postMessage:', e);
        }
    }

    // ==============================================================================
    // 3. Theme Toggle & UI Initialization
    // ==============================================================================
    function updateThemeUI(theme) {
        if (themeText && themeIcon) {
            if (theme === 'light') {
                themeText.textContent = 'OSCURO';
                themeIcon.textContent = '🌙';
            } else {
                themeText.textContent = 'CLARO';
                themeIcon.textContent = '☀️';
            }
        }
    }

    updateThemeUI(effectiveTheme);

    if (btnThemeToggle) {
        btnThemeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('livespeech_theme', newTheme);
            updateThemeUI(newTheme);
        });
    }

    function formatTime(totalSeconds) {
        if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // ==============================================================================
    // 4. Config Loader (Multi-Path Fallback)
    // ==============================================================================
    async function loadConfig() {
        const candidatePaths = ['config.json', './config.json', '../config.json', '/26-11-12_TIR26/config.json', '/config.json'];
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
        console.log(`[Config] Active Session: ${sessionParam} -> YouTube Broadcast ID: ${resolvedBroadcastId}`);
        console.log(`[Config] Supabase Project: ${SUPABASE_URL}`);
        
        updatePoster(resolvedBroadcastId);
        initSupabase();
        tryInitYouTubePlayer();
    }

    function updatePoster(videoId) {
        if (!posterImg || !videoId) return;
        posterImg.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        posterImg.onerror = () => {
            posterImg.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        };
        if (posterYtLink) {
            posterYtLink.href = `https://www.youtube.com/watch?v=${videoId}`;
        }
    }

    // ==============================================================================
    // 5. YouTube IFrame Player & Option B Controls Integration
    // ==============================================================================
    window.onYouTubeIframeAPIReady = function() {
        console.log('[YouTube API] IFrame API ready.');
        isYouTubeApiReady = true;
        tryInitYouTubePlayer();
    };

    function tryInitYouTubePlayer() {
        if (!isConfigLoaded || !isYouTubeApiReady) {
            return;
        }

        if (!resolvedBroadcastId) {
            console.error('[YouTube API] No resolved broadcast ID available.');
            return;
        }

        console.log(`[YouTube API] Initializing player for video: ${resolvedBroadcastId}`);

        player = new YT.Player('player', {
            videoId: resolvedBroadcastId,
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                playsinline: 1,
                enablejsapi: 1,
                origin: window.location.origin,
                widget_referrer: window.location.href
            },
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
                onError: onPlayerError
            }
        });
    }

    function onPlayerReady(event) {
        console.log('[YouTube API] Player ready.');
        initOptionBControls();
        startTimeTracker();
        sendMatomoTelemetry('impression');
    }

    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            hidePoster();
            updatePlayButtonState(true);

            if (player.isMuted && player.isMuted()) {
                showUnmuteOverlay();
            } else {
                hideUnmuteOverlay();
            }

            if (lastTrackedState !== YT.PlayerState.PLAYING) {
                sendMatomoTelemetry('play', { progress: player.getCurrentTime(), duration: player.getDuration() });
                lastTrackedState = YT.PlayerState.PLAYING;
            }
        } else if (event.data === YT.PlayerState.PAUSED) {
            updatePlayButtonState(false);
            if (lastTrackedState !== YT.PlayerState.PAUSED) {
                sendMatomoTelemetry('pause', { progress: player.getCurrentTime(), duration: player.getDuration() });
                lastTrackedState = YT.PlayerState.PAUSED;
            }
        } else if (event.data === YT.PlayerState.ENDED) {
            updatePlayButtonState(false);
            sendMatomoTelemetry('finish', { progress: player.getCurrentTime(), duration: player.getDuration() });
            lastTrackedState = YT.PlayerState.ENDED;
        }
    }

    function onPlayerError(event) {
        console.warn(`[YouTube API Error] Code: ${event.data}`);
        showPoster();
        if (posterErrorNotice) {
            posterErrorNotice.classList.remove('hidden');
            if (posterErrorMsg) {
                if (event.data === 150 || event.data === 101) {
                    posterErrorMsg.textContent = 'Este vídeo tiene restringida la reproducción externa por su titular.';
                } else if (event.data === 100) {
                    posterErrorMsg.textContent = 'Vídeo no encontrado o retirado.';
                } else {
                    posterErrorMsg.textContent = 'Emisión aún no disponible o protegida.';
                }
            }
        }
    }

    function hidePoster() {
        if (posterLayer) posterLayer.classList.add('faded');
    }

    function showPoster() {
        if (posterLayer) posterLayer.classList.remove('faded');
    }

    function showUnmuteOverlay() {
        if (unmuteOverlay) unmuteOverlay.classList.remove('faded');
    }

    function hideUnmuteOverlay() {
        if (unmuteOverlay) unmuteOverlay.classList.add('faded');
    }

    function updatePlayButtonState(isPlaying) {
        if (!btnCustomPlay) return;
        btnCustomPlay.innerHTML = isPlaying ? '⏸ PAUSE' : '▶ PLAY';
    }

    function updateMuteButtonState(isMuted) {
        if (!btnCustomMute) return;
        btnCustomMute.innerHTML = isMuted ? '🔇 UNMUTE' : '🔊 MUTE';
    }

    // ==============================================================================
    // 6. Option B Controls & Hairline Timeline Scrubber
    // ==============================================================================
    function initOptionBControls() {
        if (btnCustomPlay) {
            btnCustomPlay.addEventListener('click', () => {
                if (!player) return;
                const state = player.getPlayerState();
                if (state === YT.PlayerState.PLAYING) {
                    player.pauseVideo();
                } else {
                    player.playVideo();
                }
            });
        }

        if (ytShieldFull) {
            ytShieldFull.addEventListener('click', () => {
                if (!player) return;
                const state = player.getPlayerState();
                if (state === YT.PlayerState.PLAYING) {
                    player.pauseVideo();
                } else {
                    player.playVideo();
                }
            });
        }

        if (btnPosterPlay) {
            btnPosterPlay.addEventListener('click', () => {
                if (player && typeof player.playVideo === 'function') {
                    player.playVideo();
                }
            });
        }

        if (btnUnmuteOverlay) {
            btnUnmuteOverlay.addEventListener('click', () => {
                if (player) {
                    player.unMute();
                    player.setVolume(100);
                    hideUnmuteOverlay();
                    updateMuteButtonState(false);
                    if (inputCustomVolume) inputCustomVolume.value = 100;
                    sendMatomoTelemetry('unmute');
                }
            });
        }

        if (btnCustomMute) {
            btnCustomMute.addEventListener('click', () => {
                if (!player) return;
                if (player.isMuted()) {
                    player.unMute();
                    updateMuteButtonState(false);
                    hideUnmuteOverlay();
                    sendMatomoTelemetry('unmute');
                } else {
                    player.mute();
                    updateMuteButtonState(true);
                    sendMatomoTelemetry('mute');
                }
            });
        }

        if (inputCustomVolume) {
            inputCustomVolume.addEventListener('input', (e) => {
                if (!player) return;
                const val = parseInt(e.target.value, 10);
                player.setVolume(val);
                if (val === 0) {
                    player.mute();
                    updateMuteButtonState(true);
                } else if (player.isMuted()) {
                    player.unMute();
                    updateMuteButtonState(false);
                    hideUnmuteOverlay();
                }
            });
        }

        if (btnCustomFs) {
            btnCustomFs.addEventListener('click', () => {
                const wrapper = document.getElementById('player-wrapper');
                if (!wrapper) return;
                if (!document.fullscreenElement) {
                    wrapper.requestFullscreen().catch(err => {
                        console.warn('[Fullscreen] Request failed:', err);
                    });
                } else {
                    document.exitFullscreen();
                }
            });
        }

        // Timeline Scrubber Input Handlers
        if (inputCustomSeek) {
            inputCustomSeek.addEventListener('mousedown', () => { isUserSeeking = true; });
            inputCustomSeek.addEventListener('touchstart', () => { isUserSeeking = true; }, { passive: true });

            inputCustomSeek.addEventListener('input', (e) => {
                const percent = parseFloat(e.target.value);
                if (seekFill) seekFill.style.width = `${percent}%`;

                if (!isLiveMode && streamDuration > 0) {
                    const seekTargetTime = (percent / 100) * streamDuration;
                    if (displayPlayerTime) displayPlayerTime.textContent = formatTime(seekTargetTime);
                    syncCaptionsToVideoTime(seekTargetTime);
                }
            });

            inputCustomSeek.addEventListener('change', (e) => {
                isUserSeeking = false;
                const percent = parseFloat(e.target.value);

                if (isLiveMode) {
                    if (percent >= 98) {
                        player.seekTo(player.getDuration(), true);
                        if (badgeLiveStatus) {
                            badgeLiveStatus.textContent = '🔴 LIVE';
                            badgeLiveStatus.classList.remove('is-behind');
                        }
                    } else {
                        const targetTime = (percent / 100) * player.getDuration();
                        player.seekTo(targetTime, true);
                        if (badgeLiveStatus) {
                            badgeLiveStatus.textContent = '⏮ DVR';
                            badgeLiveStatus.classList.add('is-behind');
                        }
                    }
                } else if (streamDuration > 0) {
                    const seekTargetTime = (percent / 100) * streamDuration;
                    player.seekTo(seekTargetTime, true);
                    syncCaptionsToVideoTime(seekTargetTime);
                    sendMatomoTelemetry('seek', { seek_to: seekTargetTime });
                }
            });

            window.addEventListener('mouseup', () => { isUserSeeking = false; });
            window.addEventListener('touchend', () => { isUserSeeking = false; });
        }

        if (badgeLiveStatus) {
            badgeLiveStatus.addEventListener('click', () => {
                if (isLiveMode && player && typeof player.seekTo === 'function') {
                    player.seekTo(player.getDuration(), true);
                    badgeLiveStatus.textContent = '🔴 LIVE';
                    badgeLiveStatus.classList.remove('is-behind');
                }
            });
        }
    }

    function startTimeTracker() {
        if (timeUpdateInterval) clearInterval(timeUpdateInterval);

        timeUpdateInterval = setInterval(() => {
            if (!player || typeof player.getCurrentTime !== 'function') return;

            const currentTime = player.getCurrentTime();
            const currentDuration = player.getDuration();

            // Dynamic VOD vs Live detection
            if (currentDuration > 0) {
                isLiveMode = false;
                if (!isVodDurationStable) {
                    if (Math.abs(currentDuration - lastPolledVodDuration) < 0.5) {
                        consecutiveDurationMatches++;
                        if (consecutiveDurationMatches >= 3) {
                            isVodDurationStable = true;
                            streamDuration = currentDuration;
                            console.log(`[Player VOD] Duration stabilized at: ${streamDuration.toFixed(1)}s`);
                        }
                    } else {
                        consecutiveDurationMatches = 0;
                    }
                    lastPolledVodDuration = currentDuration;
                }
                streamDuration = currentDuration;

                if (!isUserSeeking && streamDuration > 0) {
                    const percent = Math.min(100, Math.max(0, (currentTime / streamDuration) * 100));
                    if (inputCustomSeek) inputCustomSeek.value = percent;
                    if (seekFill) seekFill.style.width = `${percent}%`;
                    if (displayPlayerTime) {
                        displayPlayerTime.textContent = `${formatTime(currentTime)} / ${formatTime(streamDuration)}`;
                    }
                }

                if (badgeLiveStatus) {
                    badgeLiveStatus.textContent = '▶ VOD';
                    badgeLiveStatus.classList.remove('is-behind');
                }
            } else if (currentTime > 0) {
                isLiveMode = true;
                const liveDuration = player.getDuration();
                if (!isUserSeeking && liveDuration > 0) {
                    const percent = Math.min(100, Math.max(0, (currentTime / liveDuration) * 100));
                    if (inputCustomSeek) inputCustomSeek.value = percent;
                    if (seekFill) seekFill.style.width = `${percent}%`;
                    if (displayPlayerTime) displayPlayerTime.textContent = formatTime(currentTime);

                    if (badgeLiveStatus) {
                        if (liveDuration - currentTime > 15) {
                            badgeLiveStatus.textContent = '⏮ DVR';
                            badgeLiveStatus.classList.add('is-behind');
                            badgeLiveStatus.classList.add('interactive');
                        } else {
                            badgeLiveStatus.textContent = '🔴 LIVE';
                            badgeLiveStatus.classList.remove('is-behind');
                        }
                    }
                }
            }

            // Sync captions on EVERY tick regardless of VOD or live mode
            syncCaptionsToVideoTime(currentTime);

        }, 250);
    }

    // ==============================================================================
    // 7. Supabase Realtime & Subtitle Synchronization Engine
    // ==============================================================================
    function initSupabase() {
        if (!window.supabase) {
            console.error('[Supabase] Supabase JS Client library is not loaded.');
            return;
        }

        console.log(`[Supabase] Initializing client for ${SUPABASE_URL}`);
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        fetchHistoricCaptions();
        subscribeToRealtimeCaptions();
    }

    async function fetchHistoricCaptions() {
        if (!supabaseClient || !resolvedBroadcastId) return;

        try {
            console.log(`[Captions] Fetching historic captions for broadcast_id: ${resolvedBroadcastId} (Session: ${sessionParam})...`);
            
            const { data, error } = await supabaseClient
                .from('captions')
                .select('*')
                .eq('broadcast_id', resolvedBroadcastId)
                .order('start_seconds', { ascending: true })
                .range(0, 9999);

            if (error) {
                console.warn('[Captions Error]:', error.message);
                if (waitingTag) waitingTag.textContent = 'Error al cargar subtítulos';
                return;
            }

            if (data && data.length > 0) {
                console.log(`[Captions] Successfully loaded ${data.length} captions for broadcast_id: ${resolvedBroadcastId}.`);
                inMemoryCaptions = data;
                latestCaptionRecord = data[data.length - 1];
                if (waitingTag) waitingTag.classList.add('hidden');

                detectSourceLanguageFromData(data);

                // Initial display
                if (player && typeof player.getCurrentTime === 'function' && player.getCurrentTime() > 0) {
                    syncCaptionsToVideoTime(player.getCurrentTime());
                } else {
                    const firstRecord = data[0];
                    const firstInfo = extractCaptionInfo(firstRecord, selectedLanguage);
                    if (firstInfo.text && subtitleTextEl) {
                        subtitleTextEl.textContent = firstInfo.text;
                        updateOriginalTranslatedBadge(firstInfo.isOriginal);
                    }
                }
            } else {
                console.log(`[Captions] No existing captions found in database for broadcast_id: ${resolvedBroadcastId}`);
                if (waitingTag) {
                    waitingTag.textContent = 'Sin subtítulos previos';
                    waitingTag.classList.remove('hidden');
                }
                if (subtitleTextEl) {
                    subtitleTextEl.textContent = 'ESPERANDO SUBTÍTULOS EN DIRECTO...';
                }
            }
        } catch (err) {
            console.error('[Captions Exception]:', err);
        }
    }

    function subscribeToRealtimeCaptions() {
        if (!supabaseClient || !resolvedBroadcastId) return;

        if (realtimeChannel) {
            try {
                supabaseClient.removeChannel(realtimeChannel);
            } catch (e) {}
        }

        const channelName = `public:captions:${resolvedBroadcastId}`;
        console.log(`[Supabase Realtime] Subscribing to channel: ${channelName} (filter: broadcast_id=eq.${resolvedBroadcastId})`);

        realtimeChannel = supabaseClient
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'captions',
                    filter: `broadcast_id=eq.${resolvedBroadcastId}`
                },
                (payload) => {
                    handleIncomingCaption(payload.new);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'captions',
                    filter: `broadcast_id=eq.${resolvedBroadcastId}`
                },
                (payload) => {
                    handleIncomingCaption(payload.new);
                }
            )
            .subscribe((status) => {
                console.log(`[Supabase Realtime Status]: ${status}`);
                if (status === 'SUBSCRIBED') {
                    if (waitingTag && inMemoryCaptions.length === 0) {
                        waitingTag.textContent = 'Conectado (esperando directo)';
                    }
                }
            });
    }

    function handleIncomingCaption(row) {
        if (!row) return;

        if (waitingTag) waitingTag.classList.add('hidden');

        const existingIndex = inMemoryCaptions.findIndex(c => c.id === row.id);
        if (existingIndex >= 0) {
            inMemoryCaptions[existingIndex] = row;
        } else {
            inMemoryCaptions.push(row);
            inMemoryCaptions.sort((a, b) => (Number(a.start_seconds) || 0) - (Number(b.start_seconds) || 0));
        }

        latestCaptionRecord = inMemoryCaptions[inMemoryCaptions.length - 1];

        const rowSource = getRecordSourceLanguage(row);
        if (rowSource && rowSource !== detectedSourceLanguage) {
            detectedSourceLanguage = rowSource;
        }

        // Live playback immediate render
        if (isLiveMode) {
            renderCaptionRecord(row);
        }
    }

    // ==============================================================================
    // 8. Caption Extraction & Timecode Synchronization
    // ==============================================================================
    function extractCaptionInfo(record, targetLanguage) {
        if (!record) return { text: '', isOriginal: true };

        const lang = targetLanguage || 'Spanish';
        let text = '';
        let isOriginal = true;

        // 1. Nested record.captions JSON object
        if (record.captions && typeof record.captions === 'object') {
            const langEntry = record.captions[lang] || 
                              record.captions[lang.toLowerCase()] || 
                              (lang === 'Spanish' ? (record.captions['es'] || record.captions['ES']) : (record.captions['en'] || record.captions['EN']));

            if (langEntry) {
                if (typeof langEntry === 'string') {
                    text = langEntry;
                } else if (typeof langEntry === 'object' && langEntry.text) {
                    text = langEntry.text;
                    if (typeof langEntry.sourceLanguage === 'boolean') {
                        isOriginal = langEntry.sourceLanguage;
                    }
                }
            }

            // Fallback to Spanish or first available key if target was missing
            if (!text) {
                if (record.captions['Spanish']) {
                    const sp = record.captions['Spanish'];
                    text = typeof sp === 'string' ? sp : (sp.text || '');
                    if (typeof sp === 'object' && typeof sp.sourceLanguage === 'boolean') isOriginal = sp.sourceLanguage;
                } else {
                    const firstKey = Object.keys(record.captions)[0];
                    if (firstKey && record.captions[firstKey]) {
                        const fb = record.captions[firstKey];
                        text = typeof fb === 'string' ? fb : (fb.text || '');
                        if (typeof fb === 'object' && typeof fb.sourceLanguage === 'boolean') isOriginal = fb.sourceLanguage;
                    }
                }
            }
        }

        // 2. Flat columns fallback (text_es / text_en / text)
        if (!text) {
            if (lang === 'English') {
                text = record.text_en || record.text || record.text_es || '';
                isOriginal = (record.source_language === 'en' || record.source_language === 'English');
            } else {
                text = record.text_es || record.text || record.text_en || '';
                isOriginal = (record.source_language === 'es' || record.source_language === 'Spanish');
            }
        }

        return {
            text: (text || '').trim(),
            isOriginal: isOriginal
        };
    }

    function getRecordSourceLanguage(record) {
        if (!record) return null;
        if (record.source_language) return record.source_language;
        if (record.sourceLanguage) return record.sourceLanguage;

        if (record.captions && typeof record.captions === 'object') {
            for (const [k, v] of Object.entries(record.captions)) {
                if (v && typeof v === 'object' && v.sourceLanguage === true) {
                    return k;
                }
            }
        }
        return null;
    }

    function detectSourceLanguageFromData(records) {
        if (!Array.isArray(records)) return;
        for (let i = records.length - 1; i >= 0; i--) {
            const src = getRecordSourceLanguage(records[i]);
            if (src) {
                detectedSourceLanguage = src;
                return;
            }
        }
    }

    function updateOriginalTranslatedBadge(isOriginal) {
        if (!infoTag) return;
        if (isOriginal) {
            infoTag.textContent = 'Original';
            infoTag.className = 'info-tag badge-original';
        } else {
            infoTag.textContent = 'Traducido';
            infoTag.className = 'info-tag badge-translated';
        }
    }

    function syncCaptionsToVideoTime(currentTime) {
        if (!isSubtitlesEnabled) {
            if (subtitleTextEl && subtitleTextEl.textContent !== '') {
                subtitleTextEl.textContent = '';
            }
            return;
        }

        if (!inMemoryCaptions || inMemoryCaptions.length === 0) return;

        // Find active caption matching currentTime: start_seconds <= currentTime <= end_seconds + 1.2s tolerance
        let matchedRecord = null;
        let matchedIndex = -1;

        for (let i = inMemoryCaptions.length - 1; i >= 0; i--) {
            const cap = inMemoryCaptions[i];
            const start = Number(cap.start_seconds || 0);
            const end = Number(cap.end_seconds || cap.start_seconds || 0) + 1.2;

            if (currentTime >= start && currentTime <= end) {
                matchedRecord = cap;
                matchedIndex = i;
                break;
            }
        }

        // Live fallback to latest record if near the live edge
        if (!matchedRecord && latestCaptionRecord && isLiveMode) {
            matchedRecord = latestCaptionRecord;
        }

        if (matchedRecord) {
            if (matchedIndex !== lastMatchedCaptionIndex) {
                lastMatchedCaptionIndex = matchedIndex;
                renderCaptionRecord(matchedRecord);
            }
        }
    }

    function renderCaptionRecord(record) {
        if (!subtitleTextEl || !record) return;

        currentRenderedRecord = record;
        const info = extractCaptionInfo(record, selectedLanguage);
        const resolvedText = info.text;

        updateOriginalTranslatedBadge(info.isOriginal);

        if (!resolvedText) return;

        // Deduplication check
        const now = Date.now();
        if (resolvedText === lastEmittedText && (now - lastEmittedTimestamp) < DEDUPLICATION_WINDOW_MS) {
            return;
        }

        lastEmittedText = resolvedText;
        lastEmittedTimestamp = now;

        subtitleTextEl.textContent = resolvedText;

        // TTS Speech Synthesis if active
        if (ttsEnabled && 'speechSynthesis' in window) {
            speakSubtitle(resolvedText, selectedLanguage);
        }
    }

    function speakSubtitle(text, lang) {
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang === 'English' ? 'en-US' : 'es-ES';
            utterance.rate = 1.05;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.debug('[TTS] Speech synthesis error:', e);
        }
    }

    // ==============================================================================
    // 9. Subtitle UI Controls & Language Selector
    // ==============================================================================
    if (btnToggleSubtitles) {
        btnToggleSubtitles.addEventListener('click', () => {
            isSubtitlesEnabled = !isSubtitlesEnabled;
            if (subtitlesStateText) {
                subtitlesStateText.textContent = isSubtitlesEnabled ? 'ON' : 'OFF';
            }
            btnToggleSubtitles.classList.toggle('active', isSubtitlesEnabled);
            btnToggleSubtitles.setAttribute('aria-pressed', String(isSubtitlesEnabled));
            if (subtitleBox) {
                subtitleBox.style.visibility = isSubtitlesEnabled ? 'visible' : 'hidden';
            }
            sendMatomoTelemetry(isSubtitlesEnabled ? 'subtitles_on' : 'subtitles_off');
        });
    }

    if (btnTts) {
        btnTts.addEventListener('click', () => {
            ttsEnabled = !ttsEnabled;
            if (ttsStateText) {
                ttsStateText.textContent = ttsEnabled ? 'ON' : 'OFF';
            }
            btnTts.classList.toggle('active', ttsEnabled);
            btnTts.setAttribute('aria-pressed', String(ttsEnabled));

            if (!ttsEnabled && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            sendMatomoTelemetry(ttsEnabled ? 'tts_on' : 'tts_off');
        });
    }

    if (selectLanguage) {
        selectLanguage.addEventListener('change', (e) => {
            selectedLanguage = e.target.value;
            console.log(`[Language] Selected language changed to: ${selectedLanguage}`);
            sendMatomoTelemetry('language_change', { language: selectedLanguage });

            // Update AI Disclaimer based on language
            if (aiDisclaimerText) {
                if (selectedLanguage === 'English') {
                    aiDisclaimerText.textContent = 'AI-generated subtitles may contain inaccuracies';
                } else {
                    aiDisclaimerText.textContent = 'Los subtítulos generados por IA pueden contener imprecisiones';
                }
            }

            // Re-render current caption in selected language
            if (currentRenderedRecord) {
                const info = extractCaptionInfo(currentRenderedRecord, selectedLanguage);
                if (subtitleTextEl && info.text) {
                    subtitleTextEl.textContent = info.text;
                    updateOriginalTranslatedBadge(info.isOriginal);
                }
            } else if (inMemoryCaptions && inMemoryCaptions.length > 0) {
                const targetIdx = lastMatchedCaptionIndex >= 0 ? lastMatchedCaptionIndex : 0;
                renderCaptionRecord(inMemoryCaptions[targetIdx]);
            }
        });
    }

    // ==============================================================================
    // 10. Heartbeat Telemetry (Supabase RPC ping_viewer_session)
    // ==============================================================================
    async function sendHeartbeat() {
        if (!supabaseClient) return;

        try {
            const { data, error } = await supabaseClient.rpc('ping_viewer_session', {
                p_session_id: viewerSessionId,
                p_user_agent: navigator.userAgent,
                p_referrer: document.referrer || window.location.href,
                p_current_session_code: sessionParam
            });

            if (!error && data) {
                viewerSessionId = data;
                localStorage.setItem('ls_viewer_session_id', viewerSessionId);
            }
        } catch (e) {
            // Heartbeat non-fatal
        }
    }

    heartbeatTimer = setInterval(sendHeartbeat, 60000);
    setTimeout(sendHeartbeat, 5000);

    // ==============================================================================
    // 11. Bootstrap Application
    // ==============================================================================
    loadConfig();

})();
