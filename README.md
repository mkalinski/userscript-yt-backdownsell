# userscript-yt-backdownsell
Userscript that counteracts youtube's "upselling" dialogs messing with video.

It tries to prevent two effects:
1. Resetting the video's current time to 0 even if URL contains the `t`
   parameter.
2. Pausing the video just after it starts playing.

It doesn't try to insert CSS to hide the "upselling" dialogs
themselves; use an element blocker for that.

It's written to work for my circumstances. Your mileage may vary.
