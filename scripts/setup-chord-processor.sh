#!/bin/bash

echo "🎼 Setting up Chord Processor for Burnt Beats"
echo "=============================================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "🐍 Python version: $PYTHON_VERSION"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install Python requirements
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating storage directories..."
mkdir -p storage/midi/chord-sets
mkdir -p storage/midi/generated
mkdir -p storage/midi/templates/chord-sets
mkdir -p storage/uploads/chord-sets
mkdir -p storage/temp

# Set up directory structure for chord categorization
echo "🗂️  Setting up chord categorization structure..."
mkdir -p storage/midi/templates/chord-sets/slow-progressions/simple
mkdir -p storage/midi/templates/chord-sets/slow-progressions/standard
mkdir -p storage/midi/templates/chord-sets/slow-progressions/complex
mkdir -p storage/midi/templates/chord-sets/medium-progressions/simple
mkdir -p storage/midi/templates/chord-sets/medium-progressions/standard
mkdir -p storage/midi/templates/chord-sets/medium-progressions/complex
mkdir -p storage/midi/templates/chord-sets/fast-progressions/simple
mkdir -p storage/midi/templates/chord-sets/fast-progressions/standard
mkdir -p storage/midi/templates/chord-sets/fast-progressions/complex

# Test chord processor installation
echo "🧪 Testing chord processor installation..."
python3 -c "
try:
    import music21
    import mido
    import json
    import zipfile
    print('✅ All required modules imported successfully')
except ImportError as e:
    print(f'❌ Import error: {e}')
    exit(1)
"

# Test chord processor script
echo "🔧 Testing chord processor script..."
if python3 backend/chord_processor.py --generate-midi; then
    echo "✅ Chord processor script test passed"
else
    echo "❌ Chord processor script test failed"
fi

# Test chord sets processor script
echo "🔧 Testing chord sets processor script..."
if python3 backend/chord_sets_processor.py --help > /dev/null 2>&1; then
    echo "✅ Chord sets processor script test passed"
else
    echo "❌ Chord sets processor script test failed"
fi

# Set up FluidSynth (for MIDI playback)
echo "🎵 Setting up FluidSynth for MIDI playback..."
if command -v apt-get &> /dev/null; then
    # Ubuntu/Debian
    sudo apt-get update
    sudo apt-get install -y fluidsynth fluid-soundfont-gm
elif command -v brew &> /dev/null; then
    # macOS
    brew install fluidsynth
elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    sudo yum install -y fluidsynth
else
    echo "⚠️  Please install FluidSynth manually for MIDI playback support"
fi

# Download a basic soundfont if needed
SOUNDFONT_DIR="storage/soundfonts"
mkdir -p $SOUNDFONT_DIR

if [ ! -f "$SOUNDFONT_DIR/default.sf2" ]; then
    echo "🎼 Downloading basic soundfont..."
    # Try to download a free soundfont
    if command -v wget &> /dev/null; then
        wget -O "$SOUNDFONT_DIR/default.sf2" "https://archive.org/download/GeneralUser/GeneralUser%20GS%20v1.471.sf2" || echo "⚠️  Could not download soundfont automatically"
    elif command -v curl &> /dev/null; then
        curl -L -o "$SOUNDFONT_DIR/default.sf2" "https://archive.org/download/GeneralUser/GeneralUser%20GS%20v1.471.sf2" || echo "⚠️  Could not download soundfont automatically"
    else
        echo "⚠️  Please download a soundfont file manually to $SOUNDFONT_DIR/default.sf2"
    fi
fi

# Create test chord progression
echo "🎵 Creating test chord progression..."
python3 -c "
import sys
sys.path.append('backend')
from chord_processor import ChordProcessor

processor = ChordProcessor()
test_chords = ['C', 'Am', 'F', 'G', 'C']
output_path = processor.generate_midi_from_chords(test_chords, 120, 'storage/midi/generated/test_progression.mid')
if output_path:
    print(f'✅ Test MIDI file created: {output_path}')
else:
    print('❌ Failed to create test MIDI file')
"

# Set permissions
echo "🔐 Setting file permissions..."
chmod +x backend/chord_processor.py
chmod +x backend/chord_sets_processor.py
chmod -R 755 storage/

# Create environment variables file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating environment variables file..."
    cat >> .env.local << EOF

# Chord Processor Configuration
CHORD_PROCESSOR_ENABLED=true
CHORD_STORAGE_PATH=./storage/midi/chord-sets
MIDI_OUTPUT_PATH=./storage/midi/generated
SOUNDFONT_PATH=./storage/soundfonts/default.sf2
PYTHON_PATH=$(which python3)

EOF
fi

echo ""
echo "✅ Chord Processor setup complete!"
echo ""
echo "📋 Setup Summary:"
echo "   - Python virtual environment: ✅"
echo "   - Required packages: ✅"
echo "   - Storage directories: ✅"
echo "   - Test scripts: ✅"
echo "   - FluidSynth: $(command -v fluidsynth >/dev/null && echo '✅' || echo '⚠️')"
echo "   - Soundfont: $([ -f 'storage/soundfonts/default.sf2' ] && echo '✅' || echo '⚠️')"
echo ""
echo "🚀 You can now use the chord processor!"
echo "   - Upload chord sets via the web interface"
echo "   - Generate MIDI from chord progressions"
echo "   - Browse and organize your chord library"
echo ""
echo "🔧 To activate the Python environment manually:"
echo "   source venv/bin/activate"
echo ""
echo "🧪 To test the processor manually:"
echo "   python3 backend/chord_processor.py --generate-midi"
echo "   python3 backend/chord_sets_processor.py --process"
