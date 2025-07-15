# backend/voice_cloning_service.py
import librosa
import numpy as np
import soundfile as sf
from typing import Dict, Any, Optional
import json
import os
import sys
from datetime import datetime

class VoiceCloningService:
    def __init__(self):
        self.sample_rate = 22050
        self.hop_length = 256
        self.n_fft = 1024
        
        # Star Spangled Banner lyrics for voice model testing
        self.anthem_lyrics = [
            {"text": "Oh", "start": 0.0, "duration": 0.75},
            {"text": "say", "start": 0.75, "duration": 0.25},
            {"text": "can", "start": 1.0, "duration": 0.5},
            {"text": "you", "start": 1.5, "duration": 0.5},
            {"text": "see", "start": 2.0, "duration": 0.5},
            {"text": "by", "start": 2.5, "duration": 0.25},
            {"text": "the", "start": 2.75, "duration": 0.25},
            {"text": "dawn's", "start": 3.0, "duration": 0.5},
            {"text": "early", "start": 3.5, "duration": 0.5},
            {"text": "light", "start": 4.0, "duration": 1.0}
        ]
        
    def create_voice_model(self, audio_file_path: str, voice_name: str, make_public: bool = False) -> Dict[str, Any]:
        """
        Create a voice MODEL from audio sample - returns voice characteristics and preview
        NOT a full song, just a voice model that can be used later for singing
        """
        print(f"🎤 Creating voice model: {voice_name}")
        
        try:
            # Load and analyze audio
            y, sr = librosa.load(audio_file_path, sr=self.sample_rate)
            
            # Extract voice characteristics
            characteristics = self._extract_voice_features(y, sr)
            
            # Generate voice model preview (short Star Spangled Banner sample)
            preview_audio = self._generate_voice_preview(characteristics, voice_name)
            
            # Create voice model data structure
            voice_model = {
                'id': f"voice_{int(datetime.now().timestamp())}",
                'name': voice_name,
                'characteristics': characteristics,
                'preview_audio_path': f"/api/voice-models/{voice_name}/preview.wav",
                'quality_score': self._calculate_quality_score(characteristics),
                'voice_type': self._classify_voice_type(characteristics),
                'suitable_genres': self._get_suitable_genres(characteristics),
                'is_public': make_public,
                'created_at': datetime.now().isoformat(),
                'status': 'ready',
                'original_duration': float(len(y) / sr)
            }
            
            # Save preview audio file
            self._save_voice_preview(preview_audio, voice_name)
            
            print(f"✅ Voice model created: {voice_name}")
            print(f"📊 Quality score: {voice_model['quality_score']}/100")
            print(f"🎵 Voice type: {voice_model['voice_type']}")
            print(f"🎸 Suitable genres: {', '.join(voice_model['suitable_genres'])}")
            
            return voice_model
            
        except Exception as e:
            print(f"❌ Voice model creation failed: {str(e)}")
            raise e
    
    def _extract_voice_features(self, audio: np.ndarray, sr: int) -> Dict[str, Any]:
        """Extract detailed voice characteristics for the model"""
        
        # Fundamental frequency analysis
        pitches, magnitudes = librosa.piptrack(y=audio, sr=sr, hop_length=self.hop_length)
        pitch_values = []
        for t in range(pitches.shape[1]):
            index = magnitudes[:, t].argmax()
            pitch = pitches[index, t]
            if pitch > 0:
                pitch_values.append(pitch)
        
        f0_mean = np.mean(pitch_values) if pitch_values else 200.0
        f0_std = np.std(pitch_values) if pitch_values else 20.0
        
        # Spectral features for timbre
        spectral_centroids = librosa.feature.spectral_centroid(y=audio, sr=sr)[0]
        spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sr)[0]
        spectral_bandwidth = librosa.feature.spectral_bandwidth(y=audio, sr=sr)[0]
        zero_crossing_rate = librosa.feature.zero_crossing_rate(audio)[0]
        
        # MFCCs for voice timbre characterization
        mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
        mfcc_means = np.mean(mfccs, axis=1)
        mfcc_stds = np.std(mfccs, axis=1)
        
        # Formant estimation
        formants = self._estimate_formants(audio, sr)
        
        # Voice quality metrics
        hnr = self._calculate_hnr(audio, sr)
        jitter = self._calculate_jitter(pitch_values)
        shimmer = self._calculate_shimmer(audio)
        
        # Vocal range analysis
        vocal_range = self._analyze_vocal_range(pitch_values)
        
        return {
            'fundamental_frequency': {
                'mean': float(f0_mean),
                'std': float(f0_std),
                'range': [float(f0_mean - f0_std * 2), float(f0_mean + f0_std * 2)]
            },
            'spectral_features': {
                'centroid_mean': float(np.mean(spectral_centroids)),
                'rolloff_mean': float(np.mean(spectral_rolloff)),
                'bandwidth_mean': float(np.mean(spectral_bandwidth)),
                'zcr_mean': float(np.mean(zero_crossing_rate))
            },
            'timbre': {
                'mfcc_means': mfcc_means.tolist(),
                'mfcc_stds': mfcc_stds.tolist(),
                'brightness': float(np.mean(spectral_centroids) / sr * 2),  # Normalized brightness
                'roughness': float(np.std(spectral_centroids))
            },
            'formants': formants,
            'voice_quality': {
                'harmonics_to_noise_ratio': float(hnr),
                'jitter': float(jitter),
                'shimmer': float(shimmer),
                'stability': float(max(0, min(1, (30 - jitter - shimmer) / 30)))
            },
            'vocal_range': vocal_range,
            'duration': float(len(audio) / sr)
        }
    
    def _estimate_formants(self, audio: np.ndarray, sr: int) -> Dict[str, float]:
        """Estimate formant frequencies using LPC analysis"""
        try:
            # Pre-emphasis filter
            pre_emphasized = np.append(audio[0], audio[1:] - 0.97 * audio[:-1])
            
            # Windowing
            windowed = pre_emphasized * np.hanning(len(pre_emphasized))
            
            # LPC analysis (simplified)
            # In production, use more sophisticated formant tracking
            fft = np.fft.fft(windowed)
            magnitude = np.abs(fft)
            freqs = np.fft.fftfreq(len(fft), 1/sr)
            
            # Find peaks in the spectrum
            from scipy.signal import find_peaks
            peaks, properties = find_peaks(magnitude[:len(magnitude)//2], 
                                         height=np.max(magnitude)*0.1, 
                                         distance=int(sr/4000))  # Minimum 250Hz apart
            
            peak_freqs = freqs[peaks]
            peak_freqs = peak_freqs[peak_freqs > 200]  # Filter out very low frequencies
            peak_freqs = np.sort(peak_freqs)
            
            # Estimate first 4 formants
            formants = {
                'f1': 500.0,   # Default values
                'f2': 1500.0,
                'f3': 2500.0,
                'f4': 3500.0
            }
            
            formant_keys = ['f1', 'f2', 'f3', 'f4']
            for i, key in enumerate(formant_keys):
                if i < len(peak_freqs):
                    formants[key] = float(peak_freqs[i])
            
            return formants
            
        except Exception as e:
            print(f"Formant estimation error: {e}")
            return {'f1': 500.0, 'f2': 1500.0, 'f3': 2500.0, 'f4': 3500.0}
    
    def _calculate_hnr(self, audio: np.ndarray, sr: int) -> float:
        """Calculate Harmonics-to-Noise Ratio"""
        try:
            # Autocorrelation-based HNR calculation
            autocorr = np.correlate(audio, audio, mode='full')
            autocorr = autocorr[autocorr.size // 2:]
            
            if len(autocorr) > 1:
                # Find fundamental period
                min_period = int(sr / 500)  # 500 Hz max
                max_period = int(sr / 50)   # 50 Hz min
                
                if max_period < len(autocorr):
                    period_range = autocorr[min_period:max_period]
                    if len(period_range) > 0:
                        peak_idx = np.argmax(period_range) + min_period
                        
                        # Calculate HNR
                        signal_power = autocorr[peak_idx]
                        noise_power = np.sum(autocorr) - signal_power
                        
                        if noise_power > 0:
                            hnr = 10 * np.log10(signal_power / noise_power)
                            return max(0.0, min(30.0, hnr))
            
            return 10.0  # Default value
            
        except Exception:
            return 10.0
    
    def _calculate_jitter(self, pitch_values: list) -> float:
        """Calculate pitch jitter (period-to-period variation)"""
        if len(pitch_values) < 3:
            return 0.0
        
        try:
            periods = [1/p for p in pitch_values if p > 0]
            if len(periods) < 3:
                return 0.0
            
            # Calculate period differences
            period_diffs = []
            for i in range(len(periods) - 1):
                diff = abs(periods[i+1] - periods[i])
                period_diffs.append(diff)
            
            mean_period = np.mean(periods)
            if mean_period > 0:
                jitter = (np.mean(period_diffs) / mean_period) * 100
                return min(jitter, 10.0)  # Cap at 10%
            
            return 0.0
            
        except Exception:
            return 0.0
    
    def _calculate_shimmer(self, audio: np.ndarray) -> float:
        """Calculate amplitude shimmer (amplitude variation)"""
        try:
            # Get amplitude envelope
            amplitude_envelope = np.abs(librosa.stft(audio))
            amplitude_means = np.mean(amplitude_envelope, axis=0)
            
            if len(amplitude_means) < 3:
                return 0.0
            
            # Calculate amplitude differences
            amplitude_diffs = []
            for i in range(len(amplitude_means) - 1):
                diff = abs(amplitude_means[i+1] - amplitude_means[i])
                amplitude_diffs.append(diff)
            
            mean_amplitude = np.mean(amplitude_means)
            if mean_amplitude > 0:
                shimmer = (np.mean(amplitude_diffs) / mean_amplitude) * 100
                return min(shimmer, 20.0)  # Cap at 20%
            
            return 0.0
            
        except Exception:
            return 0.0
    
    def _analyze_vocal_range(self, pitch_values: list) -> Dict[str, float]:
        """Analyze vocal range characteristics"""
        if not pitch_values:
            return {'min': 100.0, 'max': 300.0, 'range_semitones': 12.0}
        
        try:
            min_pitch = min(pitch_values)
            max_pitch = max(pitch_values)
            
            # Convert to semitones for range calculation
            min_semitones = 12 * np.log2(min_pitch / 440) + 69  # A4 = 440Hz = MIDI 69
            max_semitones = 12 * np.log2(max_pitch / 440) + 69
            range_semitones = max_semitones - min_semitones
            
            return {
                'min': float(min_pitch),
                'max': float(max_pitch),
                'range_semitones': float(range_semitones),
                'comfortable_range': [float(np.percentile(pitch_values, 25)), 
                                    float(np.percentile(pitch_values, 75))]
            }
            
        except Exception:
            return {'min': 100.0, 'max': 300.0, 'range_semitones': 12.0}
    
    def _generate_voice_preview(self, characteristics: Dict[str, Any], voice_name: str) -> np.ndarray:
        """
        Generate a SHORT voice preview using the voice characteristics
        This creates a 5-second sample of Star Spangled Banner with the cloned voice
        NOT a full song - just a voice model demonstration
        """
        print(f"🎵 Generating voice preview for: {voice_name}")
        
        duration = 5.0  # 5 second preview
        sr = self.sample_rate
        t = np.linspace(0, duration, int(duration * sr))
        
        # Extract voice characteristics
        f0_mean = characteristics['fundamental_frequency']['mean']
        formants = characteristics['formants']
        hnr = characteristics['voice_quality']['harmonics_to_noise_ratio']
        
        # Generate Star Spangled Banner melody notes for preview
        anthem_notes = [
            {'pitch': f0_mean * 0.75, 'start': 0.0, 'duration': 0.75},    # "Oh"
            {'pitch': f0_mean * 0.84, 'start': 0.75, 'duration': 0.25},   # "say"
            {'pitch': f0_mean * 1.0, 'start': 1.0, 'duration': 0.5},     # "can"
            {'pitch': f0_mean * 1.0, 'start': 1.5, 'duration': 0.5},     # "you"
            {'pitch': f0_mean * 1.0, 'start': 2.0, 'duration': 0.5},     # "see"
            {'pitch': f0_mean * 0.94, 'start': 2.5, 'duration': 0.25},   # "by"
            {'pitch': f0_mean * 0.89, 'start': 2.75, 'duration': 0.25},  # "the"
            {'pitch': f0_mean * 0.84, 'start': 3.0, 'duration': 0.5},    # "dawn's"
            {'pitch': f0_mean * 0.84, 'start': 3.5, 'duration': 0.5},    # "early"
            {'pitch': f0_mean * 0.75, 'start': 4.0, 'duration': 1.0},    # "light"
        ]
        
        # Generate audio
        audio = np.zeros(len(t))
        
        for note in anthem_notes:
            start_idx = int(note['start'] * sr)
            end_idx = int((note['start'] + note['duration']) * sr)
            
            if end_idx > len(audio):
                end_idx = len(audio)
            
            note_t = t[start_idx:end_idx]
            note_audio = self._synthesize_note(note_t, note['pitch'], formants, hnr)
            
            # Apply envelope
            envelope = self._create_note_envelope(len(note_audio), note['duration'])
            note_audio *= envelope
            
            audio[start_idx:end_idx] += note_audio
        
        # Apply overall envelope and normalize
        overall_envelope = np.exp(-t * 0.2)  # Gentle fade
        audio *= overall_envelope
        audio = audio / np.max(np.abs(audio)) * 0.7
        
        return audio
    
    def _synthesize_note(self, t: np.ndarray, fundamental_freq: float, formants: Dict[str, float], hnr: float) -> np.ndarray:
        """Synthesize a single note with voice characteristics"""
        audio = np.zeros_like(t)
        
        # Generate harmonic series
        for harmonic in range(1, 8):  # First 7 harmonics
            freq = fundamental_freq * harmonic
            amplitude = 1.0 / harmonic  # Natural harmonic rolloff
            
            # Apply formant filtering
            for formant_freq in formants.values():
                if abs(freq - formant_freq) < 200:  # Within formant bandwidth
                    amplitude *= 2.0  # Boost harmonics near formants
            
            # Add harmonic
            audio += amplitude * np.sin(2 * np.pi * freq * t) * 0.1
        
        # Add controlled noise for breathiness
        noise_level = 1.0 / (1.0 + hnr / 10.0)
        noise = np.random.normal(0, noise_level * 0.05, len(t))
        audio += noise
        
        return audio
    
    def _create_note_envelope(self, length: int, duration: float) -> np.ndarray:
        """Create envelope for a single note"""
        envelope = np.ones(length)
        
        # Attack (10% of note)
        attack_len = int(length * 0.1)
        if attack_len > 0:
            envelope[:attack_len] = np.linspace(0, 1, attack_len)
        
        # Release (20% of note)
        release_len = int(length * 0.2)
        if release_len > 0:
            envelope[-release_len:] = np.linspace(1, 0, release_len)
        
        return envelope
    
    def _calculate_quality_score(self, characteristics: Dict[str, Any]) -> int:
        """Calculate voice quality score (0-100)"""
        score = 50  # Base score
        
        # HNR contribution (higher is better)
        hnr = characteristics['voice_quality']['harmonics_to_noise_ratio']
        score += min(25, hnr * 1.5)
        
        # Stability contribution (lower jitter/shimmer is better)
        jitter = characteristics['voice_quality']['jitter']
        shimmer = characteristics['voice_quality']['shimmer']
        stability_score = max(0, 25 - (jitter * 2.5 + shimmer * 1.25))
        score += stability_score
        
        # Duration contribution (longer samples are better)
        duration = characteristics['duration']
        if duration >= 10:
            score += 10
        elif duration >= 5:
            score += 5
        elif duration >= 2:
            score += 2
        
        return min(100, max(0, int(score)))
    
    def _classify_voice_type(self, characteristics: Dict[str, Any]) -> str:
        """Classify voice type based on fundamental frequency"""
        f0_mean = characteristics['fundamental_frequency']['mean']
        
        if f0_mean < 120:
            return 'bass'
        elif f0_mean < 165:
            return 'baritone'
        elif f0_mean < 220:
            return 'tenor'
        elif f0_mean < 330:
            return 'alto'
        else:
            return 'soprano'
    
    def _get_suitable_genres(self, characteristics: Dict[str, Any]) -> list:
        """Determine suitable genres for this voice"""
        genres = []
        
        hnr = characteristics['voice_quality']['harmonics_to_noise_ratio']
        f0_mean = characteristics['fundamental_frequency']['mean']
        jitter = characteristics['voice_quality']['jitter']
        vocal_range = characteristics['vocal_range']['range_semitones']
        
        # Clear, stable voices good for pop and classical
        if hnr > 15 and jitter < 2:
            genres.extend(['pop', 'classical', 'jazz'])
        
        # Rougher voices good for rock and blues
        if hnr < 12 or jitter > 3:
            genres.extend(['rock', 'blues', 'country'])
        
        # Wide range voices good for complex genres
        if vocal_range > 24:  # More than 2 octaves
            genres.extend(['jazz', 'classical', 'musical-theater'])
        
        # All voices can do folk and electronic (with processing)
        genres.extend(['folk', 'electronic'])
        
        # Hip-hop and R&B are forgiving of various voice types
        genres.extend(['hip-hop', 'rnb'])
        
        return list(set(genres))  # Remove duplicates
    
    def _save_voice_preview(self, audio: np.ndarray, voice_name: str):
        """Save the voice preview audio file"""
        try:
            # Create directory structure
            voice_dir = f"voice_models/{voice_name}"
            os.makedirs(voice_dir, exist_ok=True)
            
            # Save audio file
            output_path = f"{voice_dir}/preview.wav"
            sf.write(output_path, audio, self.sample_rate)
            
            print(f"💾 Voice preview saved: {output_path}")
            
        except Exception as e:
            print(f"❌ Failed to save voice preview: {e}")

# Main API function
def create_voice_model_from_audio(audio_file_path: str, voice_name: str, make_public: bool = False) -> Dict[str, Any]:
    """
    Main function to create a voice model from audio file
    Returns voice model data with characteristics and preview
    """
    service = VoiceCloningService()
    
    try:
        voice_model = service.create_voice_model(audio_file_path, voice_name, make_public)
        return voice_model
        
    except Exception as e:
        print(f"❌ Voice model creation failed: {str(e)}")
        raise e

# CLI interface
if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Command line usage
        import argparse
        parser = argparse.ArgumentParser(description='Create voice model from audio')
        parser.add_argument('audio_file', help='Path to audio file')
        parser.add_argument('--name', required=True, help='Voice model name')
        parser.add_argument('--public', action='store_true', help='Make voice model public')
        
        args = parser.parse_args()
        
        result = create_voice_model_from_audio(args.audio_file, args.name, args.public)
        print(json.dumps(result, indent=2))
    else:
        # Read from stdin for API calls
        input_data = sys.stdin.read()
        if input_data:
            try:
                data = json.loads(input_data)
                result = create_voice_model_from_audio(**data)
                print(json.dumps(result))
            except json.JSONDecodeError:
                print(json.dumps({"error": "Invalid JSON input"}))
        else:
            print("Usage: python voice_cloning_service.py <audio_file> --name <voice_name> [--public]")
