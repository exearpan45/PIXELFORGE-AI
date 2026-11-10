# PIXELFORGE AI: Low-End Video Performance Audit

**Audit type:** Source-code review plus remote browser smoke test. This is not a benchmark on the user's physical laptop.

## Findings in the previous implementation

1. **The ECO delay did not reduce the cost of an individual frame.** The previous video loop still used the multi-sample WebGL enhancement shader for every frame and allowed large target resolutions. A 25 ms pause between frames could not guarantee a responsive system.
2. **The previous audio path could duplicate a large video file in memory.** When audio preservation was enabled, it read the entire source file with `file.arrayBuffer()` before decoding audio.
3. **The watchdog did not measure system CPU usage.** It measured frame-render latency and, where supported, JavaScript heap use. Those are useful signals, but they are not CPU percentage or total system RAM.
4. **The old floating monitor displayed estimated CPU percentages as if they were measured values.** Those numbers were calculated from event-loop delay and the selected preset, not from the operating system. They have been removed.

## Changes made

- Devices reporting four or fewer logical processor threads are classified as low-end for video processing.
- ECO mode uses a separate lightweight 2D canvas path instead of the multi-sample WebGL shader.
- ECO output is capped at **1280 × 720**, with a maximum enlargement factor of **2×**.
- ECO output is capped at **8 frames per second**.
- ECO captures the source audio track through Web Audio and combines it with the canvas stream, avoiding a full-file AudioBuffer decode. A synthetic WebM-with-audio test confirmed one output audio track in the remote browser.
- ECO uses a lower-bitrate VP8 WebM export path.
- Balanced and Quality presets are disabled when the hardware detector classifies the device as low-end.
- ECO-only image-effect sliders remain disabled because those shader controls are not applied by the lightweight 2D path. Audio preservation remains available through a separate Web Audio capture path.
- The UI now reports actual output dimensions and no longer labels a 1280 × 720 file as 4K.
- The workload monitor now shows frame-render timing and JavaScript heap information only. It explicitly states that browsers cannot report system-wide CPU percentage or total RAM use.

## Important trade-offs and limitations

- ECO is a compatibility/performance mode, **not neural-network super-resolution**. It uses browser 2D canvas interpolation. It can enlarge an image, but it does not invent fine detail like a trained AI upscaler.
- ECO output is limited to 720p and 8 FPS. It can preserve an audio track when the browser exposes the source audio and supports Web Audio capture. It is not intended for 4K production exports.
- These changes reduce work per frame but cannot guarantee that every low-end device will remain responsive. Browser, codec, thermal, driver, and source-file differences still matter.
- The browser cannot reliably expose the user's real system CPU percentage or total RAM consumption to this application.

## Verification status

Remote browser tests verified 2160 × 3840 portrait image output, a 1280 × 720 video with duration close to the source, and one preserved audio track from a synthetic test clip. These tests verify the deployed flow in that browser environment only. They do **not** prove that the user's Dell Inspiron 15 3558 will avoid 100% CPU or freezing. A short local test on that laptop remains necessary.
