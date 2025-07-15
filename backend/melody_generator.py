# backend/melody_generator.py
from music21 import stream, note, pitch, duration, tempo, key, meter, scale, chord
import random
import json
import sys
from datetime import datetime

class MelodyGenerator:
    def __init__(self):
        self.genre_scales = {
            'pop': ['major', 'minor'],
            'rock': ['minor', 'dorian', 'mixolydian'],
            'jazz': ['major', 'minor', 'dorian', 'mixolydian', 'lydian'],
            'classical': ['major', 'minor', 'harmonic_minor'],
            'electronic': ['minor', 'phrygian', 'locrian'],
            'country': ['major', 'mixolydian', 'pentatonic_major'],
            'blues': ['blues', 'minor_pentatonic'],
            'folk': ['major', 'dorian', 'mixolydian'],
            'hip-hop': ['minor', 'dorian', 'blues'],
            'rnb': ['minor', 'dorian', 'blues']
        }
        
        self.genre_chord_progressions = {
            'pop': [['I', 'V', 'vi', 'IV'], ['vi', 'IV', 'I', 'V'], ['I', 'vi', 'IV', 'V']],
            'rock': [['I', 'VII', 'IV', 'I'], ['vi', 'IV', 'I', 'V'], ['I', 'V', 'vi', 'IV']],
            'jazz': [['I', 'vi', 'ii', 'V'], ['I', 'VI', 'ii', 'V'], ['iii', 'vi', 'ii', 'V']],
            'classical': [['I', 'IV', 'V', 'I'], ['I', 'vi', 'IV', 'V'], ['I', 'ii', 'V', 'I']],
            'blues': [['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V']],
            'country': [['I', 'V', 'vi', 'IV'], ['I', 'IV', 'V', 'I']],
            'electronic': [['vi', 'IV', 'I', 'V'], ['i', 'VII', 'VI', 'VII']],
            'folk': [['I', 'V', 'vi', 'IV'], ['vi', 'IV', 'I', 'V']],
            'hip-hop': [['i', 'VII', 'VI', 'VII'], ['i', 'iv', 'VII', 'VI']],
            'rnb': [['i', 'VII', 'VI', 'VII'], ['vi', 'IV', 'I', 'V']]
        }

    def generate_melody(self, genre: str, mood: str, tempo_bpm: int, song_key: str = 'C', 
                       complexity: str = 'moderate', duration_bars: int = 32, lyrics: str = None):
        """
        Generate a complete melody with harmony using music21
        """
        print(f"🎵 Generating {genre} melody in {song_key} at {tempo_bpm} BPM...")
        
        # Create a new stream
        melody_stream = stream.Stream()
        
        # Set tempo
        melody_stream.append(tempo.TempoIndication(number=tempo_bpm))
        
        # Set key signature
        key_obj = key.Key(song_key)
        melody_stream.append(key_obj)
        
        # Set time signature (4/4 for most genres)
        melody_stream.append(meter.TimeSignature('4/4'))
        
        # Get scale for the genre and mood
        scale_type = self.get_scale_for_genre_mood(genre, mood)
        melody_scale = self.create_scale(song_key, scale_type)
        
        # Generate melody based on lyrics structure if provided
        if lyrics:
            melody_notes = self.generate_melody_from_lyrics(lyrics, melody_scale, genre, mood, tempo_bpm)
        else:
            melody_notes = self.generate_instrumental_melody(melody_scale, genre, mood, duration_bars)
        
        # Add notes to stream
        for note_data in melody_notes:
            melody_note = note.Note(note_data['pitch'], quarterLength=note_data['duration'])
            melody_note.volume.velocity = note_data.get('velocity', 80)
            melody_stream.append(melody_note)
        
        # Generate harmony
        harmony = self.generate_harmony(song_key, genre, duration_bars)
        
        # Create song structure
        song_structure = self.create_song_structure(genre, duration_bars)
        
        return {
            'melody': self.stream_to_dict(melody_stream),
            'harmony': harmony,
            'structure': song_structure,
            'metadata': {
                'genre': genre,
                'mood': mood,
                'tempo': tempo_bpm,
                'key': song_key,
                'complexity': complexity,
                'scale_type': scale_type,
                'generated_at': datetime.now().isoformat()
            }
        }

    def generate_melody_from_lyrics(self, lyrics: str, melody_scale, genre: str, mood: str, tempo_bpm: int):
        """Generate melody that follows lyrical phrasing"""
        words = lyrics.split()
        melody_notes = []
        current_time = 0
        
        # Analyze lyrical structure
        phrases = self.analyze_lyrical_phrases(lyrics)
        
        for phrase in phrases:
            phrase_notes = self.generate_phrase_melody(phrase, melody_scale, genre, mood, current_time)
            melody_notes.extend(phrase_notes)
            current_time += sum(note['duration'] for note in phrase_notes)
            
            # Add rest between phrases
            current_time += 0.5
        
        return melody_notes

    def analyze_lyrical_phrases(self, lyrics: str):
        """Break lyrics into musical phrases"""
        lines = [line.strip() for line in lyrics.split('\n') if line.strip()]
        phrases = []
        
        for line in lines:
            # Split long lines into phrases at punctuation or natural breaks
            if len(line.split()) > 8:
                # Split at commas, periods, or every 6-8 words
                words = line.split()
                phrase_words = []
                for i, word in enumerate(words):
                    phrase_words.append(word)
                    if (i + 1) % 6 == 0 or word.endswith((',', '.', '!', '?')):
                        phrases.append(' '.join(phrase_words))
                        phrase_words = []
                if phrase_words:
                    phrases.append(' '.join(phrase_words))
            else:
                phrases.append(line)
        
        return phrases

    def generate_phrase_melody(self, phrase: str, melody_scale, genre: str, mood: str, start_time: float):
        """Generate melody for a single phrase"""
        words = phrase.split()
        phrase_notes = []
        
        # Determine phrase contour (rising, falling, arch, valley)
        contour = random.choice(['rising', 'falling', 'arch', 'valley'])
        
        # Generate note durations based on syllable count
        syllable_durations = self.calculate_syllable_durations(words, genre)
        
        # Generate pitches following the contour
        pitches = self.generate_phrase_pitches(len(words), melody_scale, contour, mood)
        
        for i, (word, pitch_note, duration) in enumerate(zip(words, pitches, syllable_durations)):
            phrase_notes.append({
                'pitch': pitch_note,
                'duration': duration,
                'velocity': self.get_word_emphasis(word, i, len(words)),
                'word': word
            })
        
        return phrase_notes

    def calculate_syllable_durations(self, words, genre):
        """Calculate note durations based on syllables and genre"""
        base_duration = 0.5  # Half note base
        
        if genre.lower() in ['hip-hop', 'rap']:
            base_duration = 0.25  # Faster for rap
        elif genre.lower() in ['ballad', 'classical']:
            base_duration = 1.0  # Slower for ballads
        
        durations = []
        for word in words:
            syllable_count = self.count_syllables(word)
            word_duration = base_duration * max(1, syllable_count * 0.5)
            durations.append(word_duration)
        
        return durations

    def count_syllables(self, word):
        """Simple syllable counting"""
        word = word.lower()
        vowels = 'aeiouy'
        syllable_count = 0
        prev_was_vowel = False
        
        for char in word:
            if char in vowels:
                if not prev_was_vowel:
                    syllable_count += 1
                prev_was_vowel = True
            else:
                prev_was_vowel = False
        
        # Handle silent e
        if word.endswith('e') and syllable_count > 1:
            syllable_count -= 1
        
        return max(1, syllable_count)

    def generate_phrase_pitches(self, num_notes, melody_scale, contour, mood):
        """Generate pitches following a melodic contour"""
        scale_degrees = list(range(len(melody_scale)))
        pitches = []
        
        # Set starting position based on mood
        if mood.lower() in ['happy', 'upbeat', 'energetic']:
            start_degree = random.choice(scale_degrees[2:5])  # Middle-high
        elif mood.lower() in ['sad', 'melancholy', 'dark']:
            start_degree = random.choice(scale_degrees[0:3])  # Lower
        else:
            start_degree = random.choice(scale_degrees[1:4])  # Middle
        
        current_degree = start_degree
        
        for i in range(num_notes):
            # Apply contour
            if contour == 'rising':
                target_degree = min(len(scale_degrees) - 1, start_degree + (i * 2))
            elif contour == 'falling':
                target_degree = max(0, start_degree - (i * 2))
            elif contour == 'arch':
                mid_point = num_notes // 2
                if i <= mid_point:
                    target_degree = start_degree + i
                else:
                    target_degree = start_degree + (num_notes - i)
            else:  # valley
                mid_point = num_notes // 2
                if i <= mid_point:
                    target_degree = start_degree - i
                else:
                    target_degree = start_degree - (num_notes - i)
            
            # Constrain to scale
            target_degree = max(0, min(len(scale_degrees) - 1, target_degree))
            
            # Add some randomness
            if random.random() < 0.3:  # 30% chance of variation
                target_degree += random.choice([-1, 1])
                target_degree = max(0, min(len(scale_degrees) - 1, target_degree))
            
            pitches.append(melody_scale[target_degree])
            current_degree = target_degree
        
        return pitches

    def get_word_emphasis(self, word, position, total_words):
        """Determine velocity based on word importance and position"""
        base_velocity = 80
        
        # Emphasize first and last words
        if position == 0 or position == total_words - 1:
            base_velocity += 10
        
        # Emphasize longer words
        if len(word) > 6:
            base_velocity += 5
        
        # Emphasize words with punctuation
        if any(char in word for char in '!?.,;:'):
            base_velocity += 8
        
        return min(127, base_velocity)

    def generate_instrumental_melody(self, melody_scale, genre: str, mood: str, duration_bars: int):
        """Generate instrumental melody without lyrics"""
        melody_notes = []
        current_time = 0
        
        # Generate phrases of 4-8 bars each
        bars_per_phrase = random.choice([4, 6, 8])
        
        while current_time < duration_bars * 4:  # 4 beats per bar
            phrase_length = min(bars_per_phrase * 4, (duration_bars * 4) - current_time)
            phrase_notes = self.generate_instrumental_phrase(melody_scale, genre, mood, phrase_length)
            melody_notes.extend(phrase_notes)
            current_time += phrase_length
        
        return melody_notes

    def generate_instrumental_phrase(self, melody_scale, genre: str, mood: str, phrase_length: float):
        """Generate a single instrumental phrase"""
        phrase_notes = []
        current_beat = 0
        
        # Choose rhythm pattern based on genre
        rhythm_patterns = self.get_rhythm_patterns(genre)
        
        while current_beat < phrase_length:
            pattern = random.choice(rhythm_patterns)
            for duration in pattern:
                if current_beat >= phrase_length:
                    break
                
                # Choose pitch
                scale_degree = self.choose_scale_degree_weighted(mood)
                pitch_note = melody_scale[scale_degree % len(melody_scale)]
                
                phrase_notes.append({
                    'pitch': pitch_note,
                    'duration': duration,
                    'velocity': random.randint(70, 100)
                })
                
                current_beat += duration
        
        return phrase_notes

    def get_rhythm_patterns(self, genre: str):
        """Get rhythm patterns for different genres"""
        patterns = {
            'pop': [[0.5, 0.5, 0.25, 0.25, 0.5], [1.0, 0.5, 0.5], [0.25, 0.25, 0.5, 1.0]],
            'rock': [[0.25, 0.25, 0.5, 0.5, 0.5], [0.5, 0.25, 0.25, 1.0]],
            'jazz': [[0.33, 0.33, 0.33, 0.5, 0.5], [0.25, 0.75, 0.5, 0.5]],
            'blues': [[0.33, 0.33, 0.33, 1.0], [0.5, 0.5, 1.0]],
            'electronic': [[0.25, 0.25, 0.25, 0.25], [0.5, 0.5, 0.5, 0.5]],
            'hip-hop': [[0.25, 0.25, 0.5, 0.25, 0.25, 0.5], [0.125, 0.125, 0.25, 0.5, 1.0]]
        }
        
        return patterns.get(genre.lower(), patterns['pop'])

    def choose_scale_degree_weighted(self, mood: str):
        """Choose scale degree with weighting based on mood"""
        if mood.lower() in ['happy', 'upbeat', 'energetic']:
            # Favor major scale degrees (1, 3, 5)
            weights = [3, 1, 3, 1, 3, 1, 2, 1]  # I, ii, iii, IV, V, vi, vii, I
        elif mood.lower() in ['sad', 'melancholy', 'dark']:
            # Favor minor scale degrees
            weights = [2, 2, 1, 2, 1, 3, 2, 1]  # Emphasize vi, ii, IV
        else:
            # Balanced weighting
            weights = [2, 1, 2, 2, 2, 2, 1, 1]
        
        # Weighted random choice
        total_weight = sum(weights)
        r = random.uniform(0, total_weight)
        cumulative = 0
        
        for i, weight in enumerate(weights):
            cumulative += weight
            if r <= cumulative:
                return i
        
        return 0  # Fallback

    def get_scale_for_genre_mood(self, genre: str, mood: str):
        """Choose appropriate scale based on genre and mood"""
        available_scales = self.genre_scales.get(genre.lower(), ['major', 'minor'])
        
        if mood.lower() in ['happy', 'upbeat', 'energetic']:
            return 'major' if 'major' in available_scales else available_scales[0]
        elif mood.lower() in ['sad', 'melancholy', 'dark']:
            return 'minor' if 'minor' in available_scales else available_scales[-1]
        else:
            return random.choice(available_scales)

    def create_scale(self, key_name: str, scale_type: str):
        """Create a scale object"""
        key_obj = key.Key(key_name)
        
        if scale_type == 'major':
            return key_obj.getScale('major').pitches
        elif scale_type == 'minor':
            return key_obj.getScale('minor').pitches
        elif scale_type == 'dorian':
            return key_obj.getScale('dorian').pitches
        elif scale_type == 'mixolydian':
            return key_obj.getScale('mixolydian').pitches
        elif scale_type == 'blues':
            # Create blues scale manually
            tonic = pitch.Pitch(key_name)
            blues_intervals = [0, 3, 5, 6, 7, 10]  # Blues scale intervals
            return [tonic.transpose(interval) for interval in blues_intervals]
        else:
            return key_obj.getScale('major').pitches

    def generate_harmony(self, song_key: str, genre: str, duration_bars: int):
        """Generate chord progression"""
        key_obj = key.Key(song_key)
        progressions = self.genre_chord_progressions.get(genre.lower(), [['I', 'V', 'vi', 'IV']])
        chosen_progression = random.choice(progressions)
        
        chord_progression = []
        bars_per_chord = 2  # Each chord lasts 2 bars
        
        for i in range(0, duration_bars, bars_per_chord):
            roman_numeral = chosen_progression[i // bars_per_chord % len(chosen_progression)]
            
            try:
                chord_obj = key_obj.getChord(roman_numeral)
                chord_progression.append({
                    'roman': roman_numeral,
                    'pitches': [str(p) for p in chord_obj.pitches],
                    'duration': bars_per_chord * 4,  # Duration in quarter notes
                    'start_time': i * 4
                })
            except:
                # Fallback to tonic chord
                chord_obj = key_obj.getChord('I')
                chord_progression.append({
                    'roman': 'I',
                    'pitches': [str(p) for p in chord_obj.pitches],
                    'duration': bars_per_chord * 4,
                    'start_time': i * 4
                })
        
        return chord_progression

    def create_song_structure(self, genre: str, duration_bars: int):
        """Create song structure based on genre"""
        structures = {
            'pop': ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
            'rock': ['intro', 'verse', 'chorus', 'verse', 'chorus', 'solo', 'chorus', 'outro'],
            'jazz': ['head', 'solo1', 'solo2', 'head'],
            'blues': ['verse', 'verse', 'chorus', 'verse'],
            'classical': ['exposition', 'development', 'recapitulation'],
            'electronic': ['intro', 'buildup', 'drop', 'breakdown', 'buildup', 'drop', 'outro']
        }
        
        structure = structures.get(genre.lower(), structures['pop'])
        bars_per_section = duration_bars // len(structure)
        
        song_structure = []
        current_bar = 0
        
        for section in structure:
            song_structure.append({
                'name': section,
                'start_bar': current_bar,
                'duration_bars': bars_per_section,
                'start_time': current_bar * 4,  # In quarter notes
                'end_time': (current_bar + bars_per_section) * 4
            })
            current_bar += bars_per_section
        
        return song_structure

    def stream_to_dict(self, music_stream):
        """Convert music21 stream to dictionary for JSON serialization"""
        notes_data = []
        
        for element in music_stream.flat.notes:
            if isinstance(element, note.Note):
                notes_data.append({
                    'pitch': element.pitch.name,
                    'octave': element.pitch.octave,
                    'duration': float(element.quarterLength),
                    'offset': float(element.offset),
                    'velocity': element.volume.velocity if hasattr(element.volume, 'velocity') else 80
                })
        
        # Get tempo and key info
        tempo_obj = music_stream.flat.getElementsByClass(tempo.TempoIndication)
        key_obj = music_stream.flat.getElementsByClass(key.KeySignature)
        
        return {
            'notes': notes_data,
            'tempo': tempo_obj[0].number if tempo_obj else 120,
            'key': str(key_obj[0]) if key_obj else 'C major',
            'duration': float(music_stream.duration.quarterLength),
            'time_signature': '4/4'
        }

# Main API function
def generate_song_melody(genre: str, mood: str, tempo: int, song_key: str = 'C', 
                        complexity: str = 'moderate', lyrics: str = None):
    """
    Main function to be called by the API
    """
    try:
        generator = MelodyGenerator()
        
        # Generate melody with harmony
        result = generator.generate_melody(genre, mood, tempo, song_key, complexity, 32, lyrics)
        
        print(f"✅ Generated {genre} melody successfully")
        return result
        
    except Exception as e:
        print(f"❌ Melody generation failed: {str(e)}")
        raise e

# CLI interface for testing
if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Parse command line arguments
        import argparse
        parser = argparse.ArgumentParser(description='Generate melody with music21')
        parser.add_argument('--genre', default='pop', help='Music genre')
        parser.add_argument('--mood', default='happy', help='Mood/emotion')
        parser.add_argument('--tempo', type=int, default=120, help='Tempo in BPM')
        parser.add_argument('--key', default='C', help='Musical key')
        parser.add_argument('--complexity', default='moderate', help='Complexity level')
        parser.add_argument('--lyrics', help='Lyrics text file path')
        
        args = parser.parse_args()
        
        lyrics_text = None
        if args.lyrics:
            try:
                with open(args.lyrics, 'r') as f:
                    lyrics_text = f.read()
            except FileNotFoundError:
                print(f"Lyrics file not found: {args.lyrics}")
        
        result = generate_song_melody(args.genre, args.mood, args.tempo, args.key, args.complexity, lyrics_text)
        print(json.dumps(result, indent=2))
    else:
        # Read from stdin for API calls
        input_data = sys.stdin.read()
        if input_data:
            try:
                data = json.loads(input_data)
                result = generate_song_melody(**data)
                print(json.dumps(result))
            except json.JSONDecodeError:
                print(json.dumps({"error": "Invalid JSON input"}))
        else:
            # Default test
            result = generate_song_melody('pop', 'happy', 120, 'C', 'moderate')
            print(json.dumps(result, indent=2))
