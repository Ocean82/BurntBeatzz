#!/usr/bin/env bash
###############################################################################
# Burnt Beats – RVC (Retrieval-based Voice Conversion) local setup script
# ---------------------------------------------------------------------------
# This script installs all dependencies needed to run the Ocean82/RVC pipeline
# in a self-contained Python virtual environment on Linux or macOS.
#
# Usage:
#   chmod +x scripts/setup-rvc.sh
#   ./scripts/setup-rvc.sh
###############################################################################

set -euo pipefail

# ---------- Helper functions -------------------------------------------------
info()  { printf "\033[1;34m%s\033[0m\n" "ℹ️  $*"; }
warn()  { printf "\033[1;33m%s\033[0m\n" "⚠️  $*"; }
error() { printf "\033[1;31m%s\033[0m\n" "❌ $*"; exit 1; }

# ---------- Python checks ----------------------------------------------------
required_py="3.9"
info "Checking for Python ${required_py}+ …"

py_version=$(python3 -c "import sys,platform,os; v=sys.version_info; print(f'{v.major}.{v.minor}')") || \
  error "Python 3 not found. Please install Python ${required_py} or newer."

if [[ "$(printf '%s\n' "$required_py" "$py_version" | sort -V | head -n1)" != "$required_py" ]]; then
  error "Detected Python $py_version, but ${required_py}+ is required."
fi
info "Python $py_version detected ✅"

# ---------- CUDA / GPU checks -------------------------------------------------
if command -v nvidia-smi &>/dev/null; then
  info "NVIDIA GPU detected:"
  nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits
  cuda_flag=true
else
  warn "No NVIDIA GPU detected. RVC will fall back to CPU (much slower)."
  read -rp "Continue with CPU-only install? (y/N): " ans
  [[ "${ans,,}" == "y" ]] || error "Aborted by user."
  cuda_flag=false
fi

# ---------- Create virtual environment ---------------------------------------
info "Creating virtual environment …"
python3 -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate

pip install --upgrade pip setuptools wheel

# ---------- Install PyTorch ---------------------------------------------------
info "Installing PyTorch …"
if $cuda_flag; then
  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
else
  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
fi

python - <<'PY'
import torch, sys
print(f"PyTorch {torch.__version__} – CUDA available: {torch.cuda.is_available()}")
PY

# ---------- Install project Python deps --------------------------------------
info "Installing Python dependencies from backend/requirements.txt …"
if [[ -f requirements.txt ]]; then
  pip install -r requirements.txt
fi

# ---------- Clone RVC source --------------------------------------------------
if [[ ! -d rvc_source ]]; then
  info "Cloning Ocean82/RVC …"
  git clone --depth=1 https://github.com/Ocean82/RVC.git rvc_source
  if [[ -f rvc_source/requirements.txt ]]; then
    info "Installing RVC requirements …"
    pip install -r rvc_source/requirements.txt
  fi
else
  info "RVC source already present, skipping clone."
fi

# ---------- Assets & directories ---------------------------------------------
mkdir -p rvc_models temp_audio temp_mixing generated_songs soundfonts

sf2_path="soundfonts/GeneralUser_GS_v1.471.sf2"
if [[ ! -f "$sf2_path" ]]; then
  info "Downloading GeneralUser GS SoundFont …"
  curl -Lfso "$sf2_path" \
    https://www.schristiancollins.com/generaluser/GeneralUser_GS_v1.471.sf2 || \
  curl -Lfso "$sf2_path" \
    https://musical-artifacts.com/artifacts/1176/GeneralUser_GS_v1.471.sf2 || \
  warn "Automatic download failed. Please place the SoundFont manually at $sf2_path."
else
  info "SoundFont already present."
fi

# ---------- System packages ---------------------------------------------------
info "Installing system packages (FFmpeg, FluidSynth, etc.) …"
os_pkg_installed=false
if command -v apt-get &>/dev/null; then
  sudo apt-get update
  sudo apt-get install -y ffmpeg fluidsynth libsndfile1-dev portaudio19-dev
  os_pkg_installed=true
elif command -v brew &>/dev/null; then
  brew install ffmpeg fluidsynth libsndfile portaudio
  os_pkg_installed=true
fi
$os_pkg_installed || warn "Please ensure FFmpeg, FluidSynth, and PortAudio are installed."

# ---------- Smoke test --------------------------------------------------------
info "Running smoke test …"
python backend/rvc_voice_service.py test || \
  warn "Smoke test failed – investigate backend configuration."

# ---------- .env template -----------------------------------------------------
info "Creating .env.local template …"
cat > .env.local <<'ENV'
# ------ RVC configuration ------
RVC_MODELS_DIR=./rvc_models
RVC_TEMP_DIR=./temp_audio
RVC_SAMPLE_RATE=44100

# ------ Audio configuration ------
SOUNDFONT_PATH=./soundfonts/GeneralUser_GS_v1.471.sf2
ENV

info "Setup complete! Activate the venv with 'source .venv/bin/activate' and enjoy 🎵"
