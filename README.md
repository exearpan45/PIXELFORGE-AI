# PIXELFORGE AI

> **From blurry to brilliant.**  
> Free AI-Powered Photo & Video Upscaling Platform to 4K. 100% Client-Side. Zero Cloud Uploads.

---

## ⚡ Overview

**PIXELFORGE AI** is a professional-grade browser-based media enhancement studio. It upscales and enhances low-resolution images and videos up to **4K Ultra HD (3840 × 2160)** directly on your device utilizing GPU shader acceleration (WebGL 2.0 and WebGPU).

### 🔒 100% Client-Side Privacy Guarantee
> *"Your media stays on your device. PIXELFORGE AI processes your files locally and does not upload them to a processing server."*

No media files, video frames, or metadata ever leave your browser sandbox.

---

## ✨ Features

- **AI Photo Upscaler**:
  - Target resolutions: `Original`, `2x Upscale`, `4x Upscale`, `1080p (Full HD)`, `1440p (2K QHD)`, and `2160p (4K UHD)`.
  - Tunable AI controls:
    - AI Detail Restoration
    - Bilateral Noise Reduction
    - Micro-contrast Sharpening & Anti-ringing
    - Face & Portrait Contouring
    - Texture & Fiber Synthesis
    - Dynamic Range & Color Vibrancy
  - Interactive Before-and-After Comparison:
    - Split-screen draggable slider
    - Side-by-side comparison
    - Hold-to-view toggle
    - Up to 400% zoom with pan navigation
  - Lossless PNG, WEBP, and JPG export.

- **AI Video Upscaler**:
  - Frame-by-frame super-resolution processing.
  - Video formats: MP4, WebM, MOV.
  - Target resolutions: 720p, 1080p, 1440p (2K), 2160p (4K).
  - Synchronized original audio preservation via Web Audio & MediaStream capture.
  - In-browser interactive dynamic demo video clip synthesizer.
  - Real-time frame counter, elapsed time, and ETA.
  - Clean cancelation with instantaneous memory cleanup.

- **Overlapping Tile Processor**:
  - Automatically breaks massive images and 4K outputs into configurable tiles (128px, 256px, 512px).
  - Cosine boundary overlap blending prevents visible seams.
  - Prevents GPU memory faults even on mobile phones and low-memory devices.

- **My Projects (IndexedDB)**:
  - Local browser storage for project history.
  - Inspect dimensions, parameters, timestamps, and file sizes.
  - One-click deletion and history clearing.

- **Hardware Acceleration Detection**:
  - Auto-detects WebGPU and WebGL 2.0 support.
  - Displays active GPU renderer, maximum texture size, and core concurrency.
  - Low-memory mode auto-tuning for battery saving and constrained devices.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18+ or 20+ recommended)
- npm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/pixelforge-ai.git
cd pixelforge-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in any modern web browser.

### Production Build
```bash
npm run build
```
The compiled static assets will be output to the `dist/` folder.

---

## 🌐 Static Deployment

PIXELFORGE AI requires zero backend servers and can be hosted 100% free on any static host:

### Deploying to GitHub Pages
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Push the contents of the `dist` folder to your `gh-pages` branch, or configure GitHub Actions for static Pages deployment.

### Deploying to Cloudflare Pages
1. Connect your repository to Cloudflare Pages.
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Root directory: `/`

---

## 💻 Browser Compatibility Matrix

| Browser / Platform | WebGL 2.0 Acceleration | WebGPU Support | Audio-Preserving Video Export |
|---|---|---|---|
| Google Chrome (Desktop) | ✅ Full Support | ✅ Full Support | ✅ Full Support (WebM/VP9, MP4) |
| Microsoft Edge | ✅ Full Support | ✅ Full Support | ✅ Full Support |
| Mozilla Firefox | ✅ Full Support | 🔄 Experimental flag | ✅ Full Support |
| Apple Safari (macOS 14+) | ✅ Full Support | 🔄 Available in Safari 17+ | ✅ Full Support |
| Android Chrome | ✅ Full Support | ✅ Supported on Android 12+ | ✅ Full Support |
| iOS Safari (iOS 16.4+) | ✅ Full Support | 🔄 Experimental flag | ✅ Full Support |

---

## 📄 License
Apache-2.0. Free for personal and commercial creative use.
