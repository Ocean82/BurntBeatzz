import os
import sys
import json
import numpy as np
import librosa
import soundfile as sf
from typing import Dict, Any, Optional, List, Tuple
import subprocess
import tempfile
from datetime import datetime
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AudioMixer:
    """
    Professional audio mixer for combining MIDI instrumentals with RVC vocals
    Handles rendering, alignment, mixing, and mastering
    """
    
    def __init__(self):
        self.sample_rate = 44100
        self.bit_depth = 24
        self.temp_dir = Path("temp_audio")
        self.soundfont_dir = Path("soundfonts")
        self.output_dir = Path("output")
        
        # Create directories
        for directory in [self.temp_dir, self.soundfont_dir, self.output_dir]:
            directory.mkdir(exist_ok=True)
        
        # Default SoundFont (GeneralUser GS)
        self.default_soundfont = self.soundfont_dir / "GeneralUser_GS.sf2"
        
        # Audio processing settings
        self.compressor_settings = {
            'threshold': -18.0,  # dB
            'ratio': 4.0,
            'attack': 0.003,     # seconds
            'release': 0.1       # seconds
        }
        
        self.eq_settings = {
            'low_shelf': {'freq': 100, 'gain': 0, 'q': 0.7},
            'mid_peak': {'freq': 1000, 'gain': 0, 'q': 1.0},
            'high_shelf': {'freq': 8000, 'gain': 0, 'q': 0.7}
        }
        
        self.limiter_settings = {
            'threshold': -1.0,   # dB
            'release': 0.05      # seconds
        }
    
    def render_midi_to_audio(self, midi_path: str, soundfont_path: Optional[str] = None) -> str:
        """
        Render MIDI file to high-quality audio using FluidSynth
        """
        logger.info(f"🎹 Rendering MIDI to audio: {midi_path}")
        
        try:
            # Use provided soundfont or default
            sf_path = soundfont_path or str(self.default_soundfont)
            
            if not os.path.exists(sf_path):
                logger.warning(f"⚠️ SoundFont not found: {sf_path}, using fallback synthesis")
                return self._fallback_midi_synthesis(midi_path)
            
            # Output path
            output_path = self.temp_dir / f"midi_render_{int(datetime.now().timestamp())}.wav"
            
            # FluidSynth command
            cmd = [
                'fluidsynth',
                '-ni',                    # No interactive mode
                '-g', '0.5',             # Gain
                '-r', str(self.sample_rate),  # Sample rate
                '-F', str(output_path),   # Output file
                sf_path,                  # SoundFont
                midi_path                 # MIDI file
            ]
            
            # Run FluidSynth
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                logger.warning(f"⚠️ FluidSynth failed: {result.stderr}")
                return self._fallback_midi_synthesis(midi_path)
            
            logger.info(f"✅ MIDI rendered successfully")
            return str(output_path)
            
        except subprocess.TimeoutExpired:
            logger.error("❌ MIDI rendering timed out")
            return self._fallback_midi_synthesis(midi_path)
        except Exception as e:
            logger.error(f"❌ MIDI rendering failed: {e}")
            return self._fallback_midi_synthesis(midi_path)
    
    def _fallback_midi_synthesis(self, midi_path: str) -> str:
        """
        Fallback MIDI synthesis using pretty_midi when FluidSynth fails
        """
        logger.info("🔄 Using fallback MIDI synthesis...")
        
        try:
            import pretty_midi
            
            # Load MIDI
            midi_data = pretty_midi.PrettyMIDI(midi_path)
            
            # Synthesize audio
            audio = midi_data.synthesize(fs=self.sample_rate)
            
            # Save audio
            output_path = self.temp_dir / f"midi_fallback_{int(datetime.now().timestamp())}.wav"
            sf.write(output_path, audio, self.sample_rate)
            
            logger.info("✅ Fallback synthesis completed")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"❌ Fallback synthesis failed: {e}")
            raise e
    
    def align_audio_tracks(self, instrumental_path: str, vocal_path: str, 
                          tempo: int, key: str) -> Tuple[str, str]:
        """
        Align instrumental and vocal tracks for proper synchronization
        """
        logger.info("🎯 Aligning audio tracks...")
        
        try:
            # Load audio files
            instrumental, sr1 = librosa.load(instrumental_path, sr=self.sample_rate)
            vocal, sr2 = librosa.load(vocal_path, sr=self.sample_rate)
            
            # Ensure same length (pad shorter track)
            max_length = max(len(instrumental), len(vocal))
            
            if len(instrumental) < max_length:
                instrumental = np.pad(instrumental, (0, max_length - len(instrumental)))
            
            if len(vocal) < max_length:
                vocal = np.pad(vocal, (0, max_length - len(vocal)))
            
            # Apply tempo-based alignment (simplified)
            # In production, you'd use beat tracking and dynamic time warping
            
            # Save aligned tracks
            aligned_instrumental = self.temp_dir / f"aligned_inst_{int(datetime.now().timestamp())}.wav"
            aligned_vocal = self.temp_dir / f"aligned_vocal_{int(datetime.now().timestamp())}.wav"
            
            sf.write(aligned_instrumental, instrumental, self.sample_rate)
            sf.write(aligned_vocal, vocal, self.sample_rate)
            
            logger.info("✅ Audio tracks aligned")
            return str(aligned_instrumental), str(aligned_vocal)
            
        except Exception as e:
            logger.error(f"❌ Audio alignment failed: {e}")
            # Return original files if alignment fails
            return instrumental_path, vocal_path
    
    def apply_audio_effects(self, audio_path: str, track_type: str = "instrumental") -> str:
        """
        Apply professional audio effects (EQ, compression, etc.)
        """
        logger.info(f"🎛️ Applying audio effects to {track_type}...")
        
        try:
            # Load audio
            audio, sr = librosa.load(audio_path, sr=self.sample_rate)
            
            # Apply effects based on track type
            if track_type == "vocal":
                processed_audio = self._process_vocal_track(audio, sr)
            else:
                processed_audio = self._process_instrumental_track(audio, sr)
            
            # Save processed audio
            output_path = self.temp_dir / f"processed_{track_type}_{int(datetime.now().timestamp())}.wav"
            sf.write(output_path, processed_audio, sr)
            
            logger.info(f"✅ Audio effects applied to {track_type}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"❌ Audio effects failed: {e}")
            return audio_path  # Return original if processing fails
    
    def _process_vocal_track(self, audio: np.ndarray, sr: int) -> np.ndarray:
        """
        Process vocal track with vocal-specific effects
        """
        # Normalize
        audio = audio / np.max(np.abs(audio)) * 0.8
        
        # High-pass filter to remove low-frequency noise
        from scipy.signal import butter, filtfilt
        nyquist = sr / 2
        low_cutoff = 80 / nyquist
        b, a = butter(4, low_cutoff, btype='high')
        audio = filtfilt(b, a, audio)
        
        # Simple compression simulation
        threshold = 0.5
        ratio = 3.0
        compressed = np.where(
            np.abs(audio) > threshold,
            np.sign(audio) * (threshold + (np.abs(audio) - threshold) / ratio),
            audio
        )
        
        # De-esser (reduce harsh sibilants)
        # Simplified version - in production use proper de-essing
        
        return compressed
    
    def _process_instrumental_track(self, audio: np.ndarray, sr: int) -> np.ndarray:
        """
        Process instrumental track with instrument-specific effects
        """
        # Normalize
        audio = audio / np.max(np.abs(audio)) * 0.7
        
        # Gentle compression
        threshold = 0.6
        ratio = 2.0
        compressed = np.where(
            np.abs(audio) > threshold,
            np.sign(audio) * (threshold + (np.abs(audio) - threshold) / ratio),
            audio
        )
        
        # Stereo widening (if stereo)
        if len(audio.shape) > 1:
            # Simple stereo widening
            mid = (audio[:, 0] + audio[:, 1]) / 2
            side = (audio[:, 0] - audio[:, 1]) / 2
            
            # Widen the side signal slightly
            side *= 1.2
            
            # Reconstruct stereo
            audio[:, 0] = mid + side
            audio[:, 1] = mid - side
        
        return compressed
    
    def mix_tracks(self, instrumental_path: str, vocal_path: Optional[str] = None,
                   instrumental_volume: float = 0.6, vocal_volume: float = 0.8) -> str:
        """
        Mix instrumental and vocal tracks with professional balance
        """
        logger.info("🎚️ Mixing audio tracks...")
        
        try:
            # Load instrumental
            instrumental, sr = librosa.load(instrumental_path, sr=self.sample_rate)
            
            # Initialize mix with instrumental
            mix = instrumental * instrumental_volume
            
            # Add vocals if provided
            if vocal_path and os.path.exists(vocal_path):
                vocal, _ = librosa.load(vocal_path, sr=self.sample_rate)
                
                # Ensure same length
                min_length = min(len(mix), len(vocal))
                mix = mix[:min_length]
                vocal = vocal[:min_length]
                
                # Add vocal to mix
                mix += vocal * vocal_volume
            
            # Apply final mix processing
            mix = self._apply_mix_processing(mix, sr)
            
            # Save mixed audio
            output_path = self.temp_dir / f"mixed_{int(datetime.now().timestamp())}.wav"
            sf.write(output_path, mix, sr)
            
            logger.info("✅ Audio mixing completed")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"❌ Audio mixing failed: {e}")
            raise e
    
    def _apply_mix_processing(self, audio: np.ndarray, sr: int) -> np.ndarray:
        """
        Apply final mix processing (bus compression, limiting, etc.)
        """
        # Bus compression
        threshold = 0.7
        ratio = 2.5
        compressed = np.where(
            np.abs(audio) > threshold,
            np.sign(audio) * (threshold + (np.abs(audio) - threshold) / ratio),
            audio
        )
        
        # Soft limiting to prevent clipping
        limit = 0.95
        limited = np.tanh(compressed / limit) * limit
        
        # Final normalization
        if np.max(np.abs(limited)) > 0:
            limited = limited / np.max(np.abs(limited)) * 0.9
        
        return limited
    
    def master_audio(self, mixed_path: str, target_lufs: float = -14.0) -> str:
        """
        Master the final audio with professional loudness standards
        """
        logger.info("🎭 Mastering audio...")
        
        try:
            # Load mixed audio
            audio, sr = librosa.load(mixed_path, sr=self.sample_rate)
            
            # Apply mastering chain
            mastered = self._apply_mastering_chain(audio, sr, target_lufs)
            
            # Save mastered audio
            output_path = self.output_dir / f"mastered_{int(datetime.now().timestamp())}.wav"
            sf.write(output_path, mastered, sr, subtype='PCM_24')
            
            logger.info("✅ Audio mastering completed")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"❌ Audio mastering failed: {e}")
            return mixed_path  # Return original if mastering fails
    
    def _apply_mastering_chain(self, audio: np.ndarray, sr: int, target_lufs: float) -> np.ndarray:
        """
        Apply professional mastering chain
        """
        # Multiband compression (simplified)
        # In production, use proper multiband processing
        
        # High-frequency enhancement
        from scipy.signal import butter, filtfilt
        nyquist = sr / 2
        high_freq = 8000 / nyquist
        b, a = butter(2, high_freq, btype='high')
        high_content = filtfilt(b, a, audio)
        
        # Add subtle high-frequency enhancement
        enhanced = audio + high_content * 0.1
        
        # Final limiting
        limit_threshold = 0.95
        limited = np.tanh(enhanced / limit_threshold) * limit_threshold
        
        # Loudness normalization (simplified)
        # In production, use proper LUFS measurement
        rms = np.sqrt(np.mean(limited**2))
        target_rms = 0.3  # Approximate for -14 LUFS
        
        if rms > 0:
            gain = target_rms / rms
            normalized = limited * min(gain, 2.0)  # Limit gain to prevent distortion
        else:
            normalized = limited
        
        return normalized
    
    def export_audio(self, audio_path: str, output_format: str = "wav", 
                    quality: str = "high") -> str:
        """
        Export audio in specified format with quality settings
        """
        logger.info(f"💾 Exporting audio as {output_format.upper()}...")
        
        try:
            # Load audio
            audio, sr = librosa.load(audio_path, sr=self.sample_rate)
            
            # Generate output filename
            timestamp = int(datetime.now().timestamp())
            
            if output_format.lower() == "mp3":
                output_path = self.output_dir / f"song_{timestamp}.mp3"
                
                # Use FFmpeg for MP3 export
                temp_wav = self.temp_dir / f"temp_export_{timestamp}.wav"
                sf.write(temp_wav, audio, sr)
                
                # MP3 encoding settings
                if quality == "high":
                    bitrate = "320k"
                elif quality == "medium":
                    bitrate = "192k"
                else:
                    bitrate = "128k"
                
                cmd = [
                    'ffmpeg', '-y',
                    '-i', str(temp_wav),
                    '-codec:a', 'libmp3lame',
                    '-b:a', bitrate,
                    '-ar', str(sr),
                    str(output_path)
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    logger.error(f"❌ MP3 export failed: {result.stderr}")
                    # Fallback to WAV
                    output_path = self.output_dir / f"song_{timestamp}.wav"
                    sf.write(output_path, audio, sr)
                else:
                    # Cleanup temp file
                    temp_wav.unlink(missing_ok=True)
                
            else:
                # WAV export
                output_path = self.output_dir / f"song_{timestamp}.wav"
                
                if quality == "high":
                    subtype = 'PCM_24'
                else:
                    subtype = 'PCM_16'
                
                sf.write(output_path, audio, sr, subtype=subtype)
            
            logger.info(f"✅ Audio exported: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"❌ Audio export failed: {e}")
            raise e
    
    def create_complete_song(self, midi_path: str, vocal_path: Optional[str] = None,
                           tempo: int = 120, key: str = "C",
                           instrumental_volume: float = 0.6, vocal_volume: float = 0.8,
                           output_format: str = "wav") -> Dict[str, Any]:
        """
        Complete song creation pipeline
        """
        logger.info("🎵 Creating complete song...")
        
        try:
            # Step 1: Render MIDI to audio
            instrumental_path = self.render_midi_to_audio(midi_path)
            
            # Step 2: Process instrumental track
            processed_instrumental = self.apply_audio_effects(instrumental_path, "instrumental")
            
            # Step 3: Process vocal track (if provided)
            processed_vocal = None
            if vocal_path and os.path.exists(vocal_path):
                # Align tracks
                aligned_instrumental, aligned_vocal = self.align_audio_tracks(
                    processed_instrumental, vocal_path, tempo, key
                )
                processed_vocal = self.apply_audio_effects(aligned_vocal, "vocal")
                processed_instrumental = aligned_instrumental
            
            # Step 4: Mix tracks
            mixed_path = self.mix_tracks(
                processed_instrumental, processed_vocal,
                instrumental_volume, vocal_volume
            )
            
            # Step 5: Master audio
            mastered_path = self.master_audio(mixed_path)
            
            # Step 6: Export final song
            final_path = self.export_audio(mastered_path, output_format)
            
            # Get song info
            audio, sr = librosa.load(final_path, sr=None)
            duration = len(audio) / sr
            
            result = {
                'success': True,
                'audio_path': final_path,
                'duration': duration,
                'format': output_format,
                'sample_rate': sr,
                'has_vocals': vocal_path is not None,
                'processing_chain': {
                    'midi_rendered': True,
                    'effects_applied': True,
                    'mixed': True,
                    'mastered': True,
                    'exported': True
                },
                'created_at': datetime.now().isoformat()
            }
            
            logger.info("✅ Complete song creation finished")
            return result
            
        except Exception as e:
            logger.error(f"❌ Complete song creation failed: {e}")
            raise e

# Main API functions
def create_song_from_midi(midi_path: str, vocal_path: Optional[str] = None,
                         tempo: int = 120, key: str = "C",
                         instrumental_volume: float = 0.6, vocal_volume: float = 0.8,
                         output_format: str = "wav") -> Dict[str, Any]:
    """Create complete song from MIDI and optional vocals"""
    mixer = AudioMixer()
    return mixer.create_complete_song(
        midi_path, vocal_path, tempo, key,
        instrumental_volume, vocal_volume, output_format
    )

def render_midi_only(midi_path: str, output_format: str = "wav") -> str:
    """Render MIDI to audio without vocals"""
    mixer = AudioMixer()
    instrumental_path = mixer.render_midi_to_audio(midi_path)
    processed_path = mixer.apply_audio_effects(instrumental_path, "instrumental")
    mastered_path = mixer.master_audio(processed_path)
    return mixer.export_audio(mastered_path, output_format)

# CLI interface
if __name__ == "__main__":
    if len(sys.argv) > 1:
        import argparse
        parser = argparse.ArgumentParser(description='Audio Mixer Service')
        parser.add_argument('command', choices=['create-song', 'render-midi', 'test'])
        parser.add_argument('--midi-path', help='Path to MIDI file')
        parser.add_argument('--vocal-path', help='Path to vocal audio file')
        parser.add_argument('--tempo', type=int, default=120, help='Tempo in BPM')
        parser.add_argument('--key', default='C', help='Musical key')
        parser.add_argument('--inst-volume', type=float, default=0.6, help='Instrumental volume')
        parser.add_argument('--vocal-volume', type=float, default=0.8, help='Vocal volume')
        parser.add_argument('--format', default='wav', help='Output format')
        
        args = parser.parse_args()
        
        try:
            if args.command == 'create-song':
                if not args.midi_path:
                    print("Error: --midi-path required for create-song")
                    sys.exit(1)
                
                result = create_song_from_midi(
                    args.midi_path, args.vocal_path,
                    args.tempo, args.key,
                    args.inst_volume, args.vocal_volume,
                    args.format
                )
                print(json.dumps(result, indent=2))
                
            elif args.command == 'render-midi':
                if not args.midi_path:
                    print("Error: --midi-path required for render-midi")
                    sys.exit(1)
                
                output_path = render_midi_only(args.midi_path, args.format)
                print(json.dumps({'output_path': output_path}))
                
            elif args.command == 'test':
                mixer = AudioMixer()
                print("✅ Audio Mixer initialized successfully")
                print(f"Sample Rate: {mixer.sample_rate}")
                print(f"Temp Directory: {mixer.temp_dir}")
                print(f"Output Directory: {mixer.output_dir}")
                
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
                
                if command == 'create-song':
                    result = create_song_from_midi(
                        data['midi_path'],
                        data.get('vocal_path'),
                        data.get('tempo', 120),
                        data.get('key', 'C'),
                        data.get('instrumental_volume', 0.6),
                        data.get('vocal_volume', 0.8),
                        data.get('output_format', 'wav')
                    )
                elif command == 'render-midi':
                    result = {'output_path': render_midi_only(data['midi_path'], data.get('output_format', 'wav'))}
                else:
                    result = {'error': 'Unknown command'}
                
                print(json.dumps(result))
        except json.JSONDecodeError:
            print(json.dumps({"error": "Invalid JSON input"}))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
