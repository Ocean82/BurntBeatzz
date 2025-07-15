#!/bin/bash
set -e

echo "🚀 Starting Burnt Beats RVC Container..."

# Check CUDA availability
if command -v nvidia-smi &> /dev/null; then
    echo "✅ NVIDIA GPU detected:"
    nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader,nounits
else
    echo "⚠️ No NVIDIA GPU detected - RVC will run on CPU (very slow)"
fi

# Check Python version
echo "🐍 Python version: $(python3 --version)"

# Check PyTorch CUDA support
echo "🔥 PyTorch CUDA available: $(python3 -c 'import torch; print(torch.cuda.is_available())')"

# Test RVC service
echo "🎤 Testing RVC service..."
cd /app
python3 backend/rvc_voice_service.py test || echo "⚠️ RVC service test failed"

# Test audio mixer
echo "🎚️ Testing audio mixer..."
python3 backend/audio_mixer.py test || echo "⚠️ Audio mixer test failed"

# Check SoundFont
if [ -f "soundfonts/GeneralUser_GS.sf2" ]; then
    echo "✅ SoundFont available"
else
    echo "⚠️ SoundFont not found - using fallback synthesis"
fi

# Create necessary directories with proper permissions
mkdir -p rvc_models temp_audio output soundfonts rvc_training
chmod -R 755 rvc_models temp_audio output soundfonts rvc_training

# Set environment variables for Next.js
export NODE_ENV=development
export PORT=3000

echo "🎵 Starting Burnt Beats application..."

# Start the application
exec "$@"
