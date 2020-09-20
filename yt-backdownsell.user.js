// ==UserScript==
// @name        yt-backdownsell
// @namespace   https://github.com/mkalinski
// @version     1.0.0
// @description Counteracts youtube's "upselling" dialogs messing with video.
// @match       https://www.youtube.com/watch
// @grant       none
// @run-at      document-end
// @inject-into auto
// @noframes
// @homepageURL https://github.com/mkalinski/userscript-yt-backdownsell
// @downloadURL https://github.com/mkalinski/userscript-yt-backdownsell/releases/latest
// ==/UserScript==
(() => {
    "use strict";
    const DOWN_SELLING_TIME_MILLISEC = 5000;

    function setUp() {
        const videos = document.getElementsByTagName("video");

        if (videos.length !== 1) {
            console.error("Assumed 1 video on page, found", videos.length);
            return;
        }

        videos[0].addEventListener("play", downSell);
    }

    function downSell(event) {
        const video = event.target;
        video.removeEventListener("play", downSell);

        preventPause(video);

        const requestedTime = new URLSearchParams(
            window.location.search
        ).get("t");

        if (requestedTime) {
            preventSeekBeforeTime(video, requestedTime);
        }
    }

    function preventPause(video) {
        video.addEventListener("pause", handlePreventingPause);
        setTimeout(
            () => video.removeEventListener("pause", handlePreventingPause),
            DOWN_SELLING_TIME_MILLISEC,
        );
    }

    function handlePreventingPause(event) {
        const video = event.target;
        video.play().catch((error) => {
            console.error("Cannot play immediately after pause", error);
        });
    }

    function preventSeekBeforeTime(video, timeString) {
        const time = parseT(timeString);

        if (Number.isNaN(time) || time <= 0) {
            return;
        }

        const handler = getPreventingSeekHandler(time);
        video.addEventListener("timeupdate", handler);
        setTimeout(
            () => video.removeEventListener("timeupdate", handler),
            DOWN_SELLING_TIME_MILLISEC
        );
    }

    function parseT(timeString) {
        const match = new RegExp(
            "^(?:(?<hours>\\d+)h)?"
            + "(?:(?<minutes>\\d+)m)?"
            + "(?<seconds>\\d+)s?$"
        ).exec(timeString);

        if (!match) {
            console.warn("Incompatible `t` value", timeString);
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

    function getPreventingSeekHandler(minSeekTime) {
        return (event) => {
            const video = event.target;

            if (video.currentTime < minSeekTime) {
                video.currentTime = minSeekTime;
            }
        };
    }

    setUp();
    // yt-navigate-finish is a custom event fired when navigating to new video
    // in the same window (URL is updated); then repeat setup for new video
    window.addEventListener("yt-navigate-finish", setUp);
})();
