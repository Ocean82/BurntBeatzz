import os
import sys
import json
import numpy as np
import librosa
import soundfile as sf
from typing import Dict, Any, Optional, List
import subprocess
import tempfile
from datetime import datetime
import torch
import torchaudio
from pathlib import Path
import shutil
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Ocean82RVCService:
    """
    Integration service for Ocean82/RVC fork
    Handles voice model training and inference with MIDI pipeline compatibility
    """
    
    def __init__(self):
        self.sample_rate = 44100  # Match MIDI output sample rate
        self.hop_length = 512
        self.models_dir = Path("rvc_models")
        self.temp_dir = Path("temp_audio")
        self.rvc_source_dir = Path("rvc_source")
        
        # Ensure directories exist
        self.models_dir.mkdir(exist_ok=True)
        self.temp_dir.mkdir(exist_ok=True)
        
        # Check Python version
        self._check_python_version()
        
        # Check CUDA availability
        self._check_cuda()
        
        # Initialize RVC components
        self._setup_rvc_environment()
        
        # Model cache for faster inference
        self.loaded_models = {}
        
    def _check_python_version(self):
        """Ensure Python 3.9+ as required by Ocean82/RVC"""
        import sys
        if sys.version_info < (3, 9):
            raise RuntimeError(f"Python 3.9+ required for Ocean82/RVC. Current: {sys.version}")
        logger.info(f"✅ Python version check passed: {sys.version}")
    
    def _check_cuda(self):
        """Check CUDA availability for GPU acceleration"""
        if torch.cuda.is_available():
            gpu_count = torch.cuda.device_count()
            gpu_name = torch.cuda.get_device_name(0)
            logger.info(f"✅ CUDA available: {gpu_count} GPU(s), Primary: {gpu_name}")
            
            # Check VRAM
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            logger.info(f"✅ GPU Memory: {gpu_memory:.1f} GB")
            
            if gpu_memory < 6:
                logger.warning("⚠️ Less than 6GB VRAM detected. Training may be slow or fail.")
        else:
            logger.warning("⚠️ CUDA not available. RVC will run on CPU (very slow).")
    
    def _setup_rvc_environment(self):
        """Setup Ocean82/RVC environment and dependencies"""
        try:
            # Check if RVC source exists
            if not self.rvc_source_dir.exists():
                logger.info("📥 Cloning Ocean82/RVC repository...")
                subprocess.run([
                    "git", "clone", 
                    "https://github.com/Ocean82/RVC.git", 
                    str(self.rvc_source_dir)
                ], check=True)
            
            # Add RVC to Python path
            sys.path.insert(0, str(self.rvc_source_dir))
            
            # Import RVC components (handle potential import errors)
            try:
                # These imports depend on Ocean82/RVC structure
                from rvc.train import train_model
                from rvc.infer import infer_audio
                self.train_func = train_model
                self.infer_func = infer_audio
                logger.info("✅ Ocean82/RVC components loaded successfully")
            except ImportError as e:
                logger.warning(f"⚠️ Could not import RVC components: {e}")
                # Fallback to subprocess calls
                self.train_func = None
                self.infer_func = None
                
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Failed to setup RVC environment: {e}")
            raise e
    
    def train_voice_model(self, audio_files: List[str], model_name: str, 
                         epochs: int = 300, batch_size: int = 8) -> Dict[str, Any]:
        """
        Train RVC voice model using Ocean82/RVC
        """
        logger.info(f"🎤 Training RVC model: {model_name}")
        logger.info(f"📁 Audio files: {len(audio_files)}")
        logger.info(f"🔄 Epochs: {epochs}, Batch size: {batch_size}")
        
        try:
            # Prepare training directory
            model_dir = self.models_dir / model_name
            model_dir.mkdir(exist_ok=True)
            
            training_dir = model_dir / "training_data"
            training_dir.mkdir(exist_ok=True)
            
            # Preprocess audio files for RVC
            processed_files = self._preprocess_training_audio(audio_files, training_dir)
            
            # Train model using Ocean82/RVC
            if self.train_func:
                # Use direct Python API if available
                model_path = self._train_with_api(processed_files, model_name, epochs, batch_size)
            else:
                # Fallback to CLI
                model_path = self._train_with_cli(processed_files, model_name, epochs, batch_size)
            
            # Validate trained model
            validation_result = self._validate_model(model_path, model_name)
            
            # Generate test audio
            test_audio_path = self._generate_test_audio(model_path, model_name)
            
            model_info = {
                'id': f"rvc_{model_name}_{int(datetime.now().timestamp())}",
                'name': model_name,
                'model_path': str(model_path),
                'test_audio_path': str(test_audio_path),
                'training_files': len(processed_files),
                'epochs': epochs,
                'batch_size': batch_size,
                'sample_rate': self.sample_rate,
                'status': 'ready',
                'created_at': datetime.now().isoformat(),
                'validation': validation_result,
                'gpu_info': self._get_gpu_info(),
                'file_size_mb': round(model_path.stat().st_size / (1024 * 1024), 2)
            }
            
            logger.info(f"✅ RVC model trained successfully: {model_name}")
            return model_info
            
        except Exception as e:
            logger.error(f"❌ RVC training failed: {str(e)}")
            raise e
    
    def _preprocess_training_audio(self, audio_files: List[str], output_dir: Path) -> List[str]:
        """
        Preprocess audio files for RVC training
        - Ensure consistent sample rate (44100 Hz for MIDI compatibility)
        - Trim silence
        - Normalize volume
        - Split long files into segments
        """
        processed_files = []
        
        for i, audio_file in enumerate(audio_files):
            try:
                # Load audio
                audio, sr = librosa.load(audio_file, sr=self.sample_rate)
                
                # Trim silence
                audio, _ = librosa.effects.trim(audio, top_db=20)
                
                # Normalize
                audio = audio / np.max(np.abs(audio)) * 0.95
                
                # Split into segments if too long (RVC works better with 3-10 second clips)
                segment_length = 8 * self.sample_rate  # 8 seconds
                
                if len(audio) > segment_length:
                    segments = [audio[i:i + segment_length] 
                              for i in range(0, len(audio), segment_length)]
                    
                    for j, segment in enumerate(segments):
                        if len(segment) > self.sample_rate * 2:  # Minimum 2 seconds
                            output_path = output_dir / f"{Path(audio_file).stem}_{i}_{j}.wav"
                            sf.write(output_path, segment, self.sample_rate)
                            processed_files.append(str(output_path))
                else:
                    output_path = output_dir / f"{Path(audio_file).stem}_{i}.wav"
                    sf.write(output_path, audio, self.sample_rate)
                    processed_files.append(str(output_path))
                    
            except Exception as e:
                logger.warning(f"⚠️ Failed to process {audio_file}: {e}")
                continue
        
        logger.info(f"📁 Preprocessed {len(processed_files)} audio segments")
        return processed_files
    
    def _train_with_cli(self, audio_files: List[str], model_name: str, 
                       epochs: int, batch_size: int) -> Path:
        """
        Train model using Ocean82/RVC CLI interface
        """
        model_output_path = self.models_dir / model_name / f"{model_name}.pth"
        
        # Prepare training command for Ocean82/RVC
        cmd = [
            "python", str(self.rvc_source_dir / "train.py"),
            "--model_name", model_name,
            "--dataset_path", str(self.models_dir / model_name / "training_data"),
            "--output_path", str(model_output_path),
            "--epochs", str(epochs),
            "--batch_size", str(batch_size),
            "--sample_rate", str(self.sample_rate),
            "--save_every", "50",  # Save checkpoint every 50 epochs
        ]
        
        # Add GPU settings if available
        if torch.cuda.is_available():
            cmd.extend(["--gpu", "0"])
        
        logger.info(f"🚀 Starting RVC training: {' '.join(cmd)}")
        
        try:
            # Run training with timeout (4 hours max)
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                timeout=4 * 3600,  # 4 hours
                cwd=str(self.rvc_source_dir)
            )
            
            if result.returncode != 0:
                raise Exception(f"RVC training failed: {result.stderr}")
            
            logger.info("✅ RVC training completed via CLI")
            return model_output_path
            
        except subprocess.TimeoutExpired:
            raise Exception("RVC training timed out after 4 hours")
        except Exception as e:
            raise Exception(f"RVC training error: {str(e)}")
    
    def _validate_model(self, model_path: Path, model_name: str) -> Dict[str, Any]:
        """
        Validate trained RVC model
        """
        try:
            # Check if model file exists and is valid
            if not model_path.exists():
                return {'valid': False, 'error': 'Model file not found'}
            
            # Try to load the model
            try:
                model_state = torch.load(model_path, map_location='cpu')
                model_size = model_path.stat().st_size / (1024 * 1024)  # MB
                
                return {
                    'valid': True,
                    'size_mb': round(model_size, 2),
                    'parameters': len(model_state) if isinstance(model_state, dict) else 'unknown',
                    'torch_version': torch.__version__
                }
            except Exception as e:
                return {'valid': False, 'error': f'Failed to load model: {str(e)}'}
                
        except Exception as e:
            return {'valid': False, 'error': str(e)}
    
    def convert_voice(self, source_audio_path: str, model_path: str, 
                     pitch_shift: float = 0.0, index_rate: float = 0.5) -> str:
        """
        Convert voice using trained RVC model
        Compatible with MIDI-generated vocals
        """
        logger.info(f"🔄 Converting voice with RVC model...")
        
        try:
            # Load and validate source audio
            source_audio, sr = librosa.load(source_audio_path, sr=self.sample_rate)
            
            # Apply pitch shifting if needed (for MIDI compatibility)
            if pitch_shift != 0.0:
                source_audio = librosa.effects.pitch_shift(
                    source_audio, sr=sr, n_steps=pitch_shift
                )
            
            # Save preprocessed audio
            temp_source = self.temp_dir / f"source_{int(datetime.now().timestamp())}.wav"
            sf.write(temp_source, source_audio, sr)
            
            # Run RVC conversion
            if self.infer_func:
                # Use direct API if available
                output_path = self._convert_with_api(temp_source, model_path, index_rate)
            else:
                # Fallback to CLI
                output_path = self._convert_with_cli(temp_source, model_path, index_rate)
            
            # Cleanup temp files
            temp_source.unlink(missing_ok=True)
            
            logger.info(f"✅ Voice conversion completed")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"❌ Voice conversion failed: {str(e)}")
            raise e
    
    def _convert_with_cli(self, source_path: Path, model_path: str, index_rate: float) -> Path:
        """
        Convert voice using Ocean82/RVC CLI
        """
        output_path = self.temp_dir / f"converted_{int(datetime.now().timestamp())}.wav"
        
        cmd = [
            "python", str(self.rvc_source_dir / "infer.py"),
            "--input", str(source_path),
            "--model", model_path,
            "--output", str(output_path),
            "--index_rate", str(index_rate),
            "--device", "cuda:0" if torch.cuda.is_available() else "cpu"
        ]
        
        try:
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                timeout=300,  # 5 minutes
                cwd=str(self.rvc_source_dir)
            )
            
            if result.returncode != 0:
                raise Exception(f"RVC conversion failed: {result.stderr}")
            
            return output_path
            
        except subprocess.TimeoutExpired:
            raise Exception("RVC conversion timed out")
        except Exception as e:
            raise Exception(f"RVC conversion error: {str(e)}")
    
    def convert_midi_vocals_to_rvc(self, midi_vocal_path: str, rvc_model_path: str, 
                                  lyrics: str, tempo: int, key: str) -> str:
        """
        Convert MIDI vocals to RVC singing
        This is the key integration point with your MIDI pipeline
        """
        logger.info(f"🎵 Converting MIDI vocals to RVC singing...")
        
        try:
            # Step 1: Convert MIDI to monotone vocal audio
            monotone_vocal = self._midi_to_monotone_vocal(midi_vocal_path, lyrics, tempo)
            
            # Step 2: Apply RVC conversion to add expression and voice character
            expressive_vocal = self.convert_voice(monotone_vocal, rvc_model_path)
            
            # Step 3: Apply musical corrections (pitch, timing) to match key/tempo
            final_vocal = self._apply_musical_corrections(expressive_vocal, key, tempo)
            
            logger.info(f"✅ MIDI to RVC vocal conversion completed")
            return final_vocal
            
        except Exception as e:
            logger.error(f"❌ MIDI vocal conversion failed: {str(e)}")
            raise e
    
    def _midi_to_monotone_vocal(self, midi_path: str, lyrics: str, tempo: int) -> str:
        """
        Convert MIDI vocal track to monotone audio for RVC processing
        This creates the base audio that RVC will transform
        """
        try:
            import pretty_midi
            
            # Load MIDI file
            midi_data = pretty_midi.PrettyMIDI(midi_path)
            
            # Find vocal track (usually first instrument or track with most notes)
            vocal_instrument = None
            max_notes = 0
            
            for instrument in midi_data.instruments:
                if not instrument.is_drum and len(instrument.notes) > max_notes:
                    vocal_instrument = instrument
                    max_notes = len(instrument.notes)
            
            if not vocal_instrument:
                raise Exception("No vocal track found in MIDI file")
            
            # Generate monotone vocal audio
            duration = midi_data.get_end_time()
            audio = np.zeros(int(duration * self.sample_rate))
            
            # Synthesize each note with vocal-like timbre
            for note in vocal_instrument.notes:
                start_sample = int(note.start * self.sample_rate)
                end_sample = int(note.end * self.sample_rate)
                
                if start_sample >= len(audio) or end_sample <= start_sample:
                    continue
                
                end_sample = min(end_sample, len(audio))
                note_duration = (end_sample - start_sample) / self.sample_rate
                
                # Generate vocal-like synthesis
                note_audio = self._generate_vocal_synthesis(note.pitch, note_duration)
                
                # Add to main audio
                audio_slice_len = end_sample - start_sample
                note_slice_len = min(len(note_audio), audio_slice_len)
                audio[start_sample:start_sample + note_slice_len] += note_audio[:note_slice_len]
            
            # Normalize and save
            if np.max(np.abs(audio)) > 0:
                audio = audio / np.max(np.abs(audio)) * 0.8
            
            output_path = self.temp_dir / f"monotone_{int(datetime.now().timestamp())}.wav"
            sf.write(output_path, audio, self.sample_rate)
            
            return str(output_path)
            
        except Exception as e:
            raise Exception(f"MIDI to monotone conversion failed: {str(e)}")
    
    def _generate_vocal_synthesis(self, midi_pitch: int, duration: float) -> np.ndarray:
        """
        Generate vocal-like synthesis for a MIDI note
        This creates a more realistic base for RVC conversion
        """
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples)
        
        # Convert MIDI pitch to frequency
        frequency = 440 * (2 ** ((midi_pitch - 69) / 12))
        
        # Generate vocal-like waveform with formants
        fundamental = np.sin(2 * np.pi * frequency * t)
        
        # Add formants (vocal tract resonances)
        formant1 = np.sin(2 * np.pi * frequency * 2 * t) * 0.3  # 2nd harmonic
        formant2 = np.sin(2 * np.pi * frequency * 3 * t) * 0.2  # 3rd harmonic
        formant3 = np.sin(2 * np.pi * frequency * 4 * t) * 0.1  # 4th harmonic
        
        # Combine for vocal-like timbre
        vocal_audio = fundamental + formant1 + formant2 + formant3
        
        # Apply envelope (ADSR)
        envelope = np.ones_like(vocal_audio)
        fade_samples = int(0.05 * self.sample_rate)  # 50ms fade
        
        if len(envelope) > fade_samples * 2:
            # Attack
            envelope[:fade_samples] = np.linspace(0, 1, fade_samples)
            # Release
            envelope[-fade_samples:] = np.linspace(1, 0, fade_samples)
        
        return vocal_audio * envelope * 0.5
    
    def _apply_musical_corrections(self, vocal_audio_path: str, key: str, tempo: int) -> str:
        """
        Apply pitch and timing corrections to match musical context
        """
        try:
            # Load converted vocal
            audio, sr = librosa.load(vocal_audio_path, sr=self.sample_rate)
            
            # Apply pitch correction to match key (simplified)
            # In production, you'd use more sophisticated pitch correction
            corrected_audio = audio  # Placeholder for pitch correction
            
            # Apply timing corrections for tempo matching
            # This would involve beat tracking and time stretching
            
            # Save corrected audio
            output_path = self.temp_dir / f"corrected_{int(datetime.now().timestamp())}.wav"
            sf.write(output_path, corrected_audio, sr)
            
            return str(output_path)
            
        except Exception as e:
            logger.warning(f"⚠️ Musical corrections failed: {e}")
            return vocal_audio_path  # Return original if correction fails
    
    def _generate_test_audio(self, model_path: Path, model_name: str) -> str:
        """
        Generate test audio to verify model quality
        """
        try:
            # Create simple test phrase
            test_duration = 3.0  # 3 seconds
            sr = self.sample_rate
            t = np.linspace(0, test_duration, int(test_duration * sr))
            
            # Simple melody for testing
            frequencies = [220, 247, 262, 294, 330]  # A3, B3, C4, D4, E4
            test_audio = np.zeros_like(t)
            
            note_duration = test_duration / len(frequencies)
            for i, freq in enumerate(frequencies):
                start_idx = int(i * note_duration * sr)
                end_idx = int((i + 1) * note_duration * sr)
                if end_idx > len(t):
                    end_idx = len(t)
                
                note_t = t[start_idx:end_idx] - t[start_idx]
                note_audio = np.sin(2 * np.pi * freq * note_t) * 0.5
                test_audio[start_idx:end_idx] = note_audio
            
            # Save test input
            test_input_path = self.temp_dir / f"test_input_{model_name}.wav"
            sf.write(test_input_path, test_audio, sr)
            
            # Convert using the model
            test_output_path = self.convert_voice(str(test_input_path), str(model_path))
            
            return test_output_path
            
        except Exception as e:
            logger.warning(f"⚠️ Test audio generation failed: {e}")
            return str(test_input_path)
    
    def _get_gpu_info(self) -> Dict[str, Any]:
        """Get GPU information for model metadata"""
        if torch.cuda.is_available():
            return {
                'available': True,
                'device_count': torch.cuda.device_count(),
                'device_name': torch.cuda.get_device_name(0),
                'memory_gb': round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 1),
                'cuda_version': torch.version.cuda
            }
        else:
            return {'available': False}
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available RVC models"""
        models = []
        
        if self.models_dir.exists():
            for model_dir in self.models_dir.iterdir():
                if model_dir.is_dir():
                    model_file = model_dir / f"{model_dir.name}.pth"
                    if model_file.exists():
                        try:
                            stat = model_file.stat()
                            models.append({
                                'id': model_dir.name,
                                'name': model_dir.name,
                                'path': str(model_file),
                                'size_mb': round(stat.st_size / (1024 * 1024), 2),
                                'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
                            })
                        except Exception as e:
                            logger.warning(f"⚠️ Error reading model {model_dir.name}: {e}")
        
        return models

# Main API functions for integration
def train_rvc_model(audio_files: List[str], model_name: str, epochs: int = 300) -> Dict[str, Any]:
    """Train RVC model using Ocean82/RVC"""
    service = Ocean82RVCService()
    return service.train_voice_model(audio_files, model_name, epochs)

def convert_with_rvc(source_audio: str, model_path: str, pitch_shift: float = 0.0) -> str:
    """Convert voice using RVC model"""
    service = Ocean82RVCService()
    return service.convert_voice(source_audio, model_path, pitch_shift)

def convert_midi_to_rvc_vocals(midi_path: str, model_path: str, lyrics: str, 
                              tempo: int, key: str) -> str:
    """Convert MIDI vocals to RVC singing - main integration function"""
    service = Ocean82RVCService()
    return service.convert_midi_vocals_to_rvc(midi_path, model_path, lyrics, tempo, key)

def get_available_rvc_models() -> List[Dict[str, Any]]:
    """Get list of available RVC models"""
    service = Ocean82RVCService()
    return service.get_available_models()

# CLI interface
if __name__ == "__main__":
    if len(sys.argv) > 1:
        import argparse
        parser = argparse.ArgumentParser(description='Ocean82 RVC Voice Service')
        parser.add_argument('command', choices=['train', 'convert', 'midi-convert', 'list', 'test'])
        parser.add_argument('--audio-files', nargs='+', help='Audio files for training')
        parser.add_argument('--model-name', help='Model name')
        parser.add_argument('--source-audio', help='Source audio for conversion')
        parser.add_argument('--model-path', help='Path to RVC model')
        parser.add_argument('--midi-path', help='MIDI file path')
        parser.add_argument('--lyrics', help='Lyrics text')
        parser.add_argument('--tempo', type=int, default=120, help='Tempo')
        parser.add_argument('--key', default='C', help='Musical key')
        parser.add_argument('--epochs', type=int, default=300, help='Training epochs')
        parser.add_argument('--pitch-shift', type=float, default=0.0, help='Pitch shift in semitones')
        
        args = parser.parse_args()
        
        try:
            if args.command == 'train':
                result = train_rvc_model(args.audio_files, args.model_name, args.epochs)
                print(json.dumps(result, indent=2))
            elif args.command == 'convert':
                result = convert_with_rvc(args.source_audio, args.model_path, args.pitch_shift)
                print(json.dumps({'output_path': result}))
            elif args.command == 'midi-convert':
                result = convert_midi_to_rvc_vocals(args.midi_path, args.model_path, 
                                                  args.lyrics, args.tempo, args.key)
                print(json.dumps({'output_path': result}))
            elif args.command == 'list':
                models = get_available_rvc_models()
                print(json.dumps(models, indent=2))
            elif args.command == 'test':
                service = Ocean82RVCService()
                print("✅ Ocean82 RVC Service initialized successfully")
                print(f"GPU Available: {torch.cuda.is_available()}")
                print(f"Models Directory: {service.models_dir}")
                
        except Exception as e:
            print(json.dumps({"error": str(e)}), file=sys.stderr)
            sys.exit(1)
    else:
        # Read from stdin for API calls
        try:
            input_data = sys.stdin.read()
            if input_data:
                data = json.loads(input_data)
                command = data.get('command')
                
                if command == 'train':
                    result = train_rvc_model(data['audio_files'], data['model_name'], 
                                           data.get('epochs', 300))
                elif command == 'convert':
                    result = convert_with_rvc(data['source_audio'], data['model_path'], 
                                            data.get('pitch_shift', 0.0))
                elif command == 'midi-convert':
                    result = convert_midi_to_rvc_vocals(data['midi_path'], data['model_path'], 
                                                      data['lyrics'], data['tempo'], data['key'])
                elif command == 'list':
                    result = get_available_rvc_models()
                else:
                    result = {'error': 'Unknown command'}
                
                print(json.dumps(result))
        except json.JSONDecodeError:
            print(json.dumps({"error": "Invalid JSON input"}))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
</merged_code>
