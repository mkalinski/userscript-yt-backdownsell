// ==UserScript==
// @name        yt-backdownsell
// @namespace   https://github.com/mkalinski
// @version     1.2.0
// @description Counteracts youtube's "upselling" dialogs messing with video.
// @match       https://www.youtube.com
// @grant       none
// @run-at      document-end
// @inject-into auto
// @noframes
// @homepageURL https://github.com/mkalinski/userscript-yt-backdownsell
// ==/UserScript==
(() => {
    "use strict";

    // These values were set using trial and error.
    // Modify them in case problems come up.
    const WATCHDOG_TIMEOUT_MILLISEC = 10000;
    const OVERLAY_POLL_INTERVAL_MILLISEC = 1000;
    const OVERLAY_CLICK_DELAY_MILLISEC = 3000;

    const THUMBNAIL_OVERLAY_CLASS = "ytp-cued-thumbnail-overlay";
    const T_PATTERN = "^(?:(?<hours>\\d+)h)?"
        + "(?:(?<minutes>\\d+)m)?"
        + "(?<seconds>\\d+)s?$";

    function setUp() {
        // There's only one video and one overlay. They never go away.
        const video = document.querySelector("video");
        const overlay = document.querySelector(`.${THUMBNAIL_OVERLAY_CLASS}`);

        if (!(video && overlay)) {
            return;
        }

        if (video.paused) {
            watchdogAfterPlay(video, overlay);
        } else {
            watchdogPlaying(video, overlay);
        }
    }

    function watchdogAfterPlay(video, overlay) {
        function onPlay() {
            video.removeEventListener("play", onPlay);
            watchdogPlaying(video, overlay);
        }

        video.addEventListener("play", onPlay);
    }

    function watchdogPlaying(video, overlay) {
        const endPause = downsellPause(video);
        const endSeek = downsellSeek(video);
        const endOverlay = downsellOverlay(overlay);

        setTimeout(
            () => {
                endPause();
                endSeek();
                endOverlay();
            },
            WATCHDOG_TIMEOUT_MILLISEC
        );
    }

    function downsellPause(video) {
        function onPause() {
            video.play();
        }

        video.addEventListener("pause", onPause);

        return () => video.removeEventListener("pause", onPause);
    }

    function downsellSeek(video) {
        const urlParams = new URLSearchParams(window.location.search);
        const timeString = urlParams.get("t");
        const time = timeString ? parseT(timeString) : 0;

        if (!time) {
            return () => {};
        }

        function onTimeUpdate() {
            if (video.currentTime < time) {
                video.currentTime = time;
            }
        }

        video.addEventListener("timeupdate", onTimeUpdate);

        return () => video.removeEventListener("timeupdate", onTimeUpdate);
    }

    function downsellOverlay(overlay) {
        const overlayPoll = setInterval(
            () => {
                if (overlay.style.display !== "none") {
                    setTimeout(
                        () => overlay.click(),
                        OVERLAY_CLICK_DELAY_MILLISEC
                    );
                    clearInterval(overlayPoll);
                }
            },
            OVERLAY_POLL_INTERVAL_MILLISEC
        );

        return () => clearInterval(overlayPoll);
    }

    function parseT(timeString) {
        const tRegExp = new RegExp(T_PATTERN);
        const match = tRegExp.exec(timeString);

        if (!match) {
            return 0;
        }

        let seconds = Number.parseInt(match.groups.seconds, 10);

        if (match.groups.minutes) {
            seconds += Number.parseInt(match.groups.minutes, 10) * 60;
        }

        if (match.groups.hours) {
            seconds += Number.parseInt(match.groups.hours, 10) * 3600;
        }

        return seconds;
    }

    window.addEventListener("yt-navigate-finish", setUp);
})();
