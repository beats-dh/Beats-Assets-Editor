#!/bin/bash

# Força uso da GPU NVIDIA
export __GL_SYNC_TO_VBLANK=0
export __GL_THREADED_OPTIMIZATIONS=1
export __NV_PRIME_RENDER_OFFLOAD=1
export __GLX_VENDOR_LIBRARY_NAME=nvidia

# Flags de aceleração WebKit
export WEBKIT_DISABLE_COMPOSITING_MODE=0
export WEBKIT_DISABLE_DMABUF_RENDERER=0
export WEBKIT_FORCE_COMPOSITING_MODE=1

# Executa o Tauri com as flags
npm run tauri dev