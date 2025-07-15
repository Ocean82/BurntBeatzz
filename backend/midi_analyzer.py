#!/usr/bin/env python3
"""
MIDI Analysis Script for Burnt Beats
Analyzes MIDI files and returns detailed musical information
"""

import sys
import json
import os
from pathlib import Path

try:
    import mido
    import numpy as np
except ImportError as e:
    print(json.dumps({
        "error": f"Missing required dependencies: {e}",
        "install_command": "pip install mido numpy"
    }))
    sys.exit(1)

def analyze_midi_file(midi_path):
    """Analyze a MIDI file and return detailed musical information"""
    try:
        # Load MIDI file
        mid = mido.MidiFile(midi_path)
        
        # Initialize analysis data
        analysis = {
            "format": mid.type,
            "tracks": len(mid.tracks),
            "ticks_per_beat": mid.ticks_per_beat,
            "duration": 0,
            "tempo": 120,  # Default BPM
            "time_signature": [4, 4],
            "key_signature": "C major",
            "instruments": [],
            "note_range": {"min": 127, "max": 0},
            "complexity_score": 0,
            "genre_hints": [],
            "track_info": [],
            "total_notes": 0,
            "has_drums": False
        }
        
        # Track analysis
        total_ticks = 0
        note_count = 0
        velocity_sum = 0
        instruments_used = set()
        drum_tracks = 0
        
        for track_idx, track in enumerate(mid.tracks):
            track_info = {
                "index": track_idx,
                "name": f"Track {track_idx + 1}",
                "instrument": None,
                "notes": 0,
                "is_drum": False,
                "channel": None
            }
            
            current_time = 0
            track_notes = 0
            
            for msg in track:
                current_time += msg.time
                
                if msg.type == 'set_tempo':
                    # Convert microseconds per beat to BPM
                    analysis["tempo"] = int(60000000 / msg.tempo)
                
                elif msg.type == 'time_signature':
                    analysis["time_signature"] = [msg.numerator, msg.denominator]
                
                elif msg.type == 'key_signature':
                    analysis["key_signature"] = get_key_signature(msg.key)
                
                elif msg.type == 'program_change':
                    instrument_name = get_instrument_name(msg.program)
                    instruments_used.add(instrument_name)
                    track_info["instrument"] = msg.program
                    track_info["channel"] = msg.channel
                
                elif msg.type == 'track_name':
                    track_info["name"] = msg.name
                
                elif msg.type == 'note_on' and msg.velocity > 0:
                    track_notes += 1
                    note_count += 1
                    velocity_sum += msg.velocity
                    
                    # Update note range
                    analysis["note_range"]["min"] = min(analysis["note_range"]["min"], msg.note)
                    analysis["note_range"]["max"] = max(analysis["note_range"]["max"], msg.note)
                    
                    # Check if it's a drum track (channel 9 in MIDI)
                    if msg.channel == 9:
                        track_info["is_drum"] = True
                        analysis["has_drums"] = True
                        drum_tracks += 1
            
            track_info["notes"] = track_notes
            total_ticks = max(total_ticks, current_time)
            analysis["track_info"].append(track_info)
        
        # Calculate duration in seconds
        if analysis["tempo"] > 0:
            analysis["duration"] = (total_ticks / analysis["ticks_per_beat"]) * (60 / analysis["tempo"])
        
        # Set instruments list
        analysis["instruments"] = list(instruments_used)
        analysis["total_notes"] = note_count
        
        # Calculate complexity score (0-10)
        complexity_factors = [
            min(len(mid.tracks) / 8, 1) * 2,  # Track complexity (max 2 points)
            min(note_count / 1000, 1) * 3,   # Note density (max 3 points)
            min(len(instruments_used) / 8, 1) * 2,  # Instrument variety (max 2 points)
            min(analysis["duration"] / 300, 1) * 1,  # Length factor (max 1 point)
            (1 if analysis["has_drums"] else 0) * 1,  # Drums present (max 1 point)
            min((analysis["note_range"]["max"] - analysis["note_range"]["min"]) / 60, 1) * 1  # Note range (max 1 point)
        ]
        analysis["complexity_score"] = sum(complexity_factors)
        
        # Genre hints based on characteristics
        genre_hints = []
        
        if analysis["tempo"] > 140:
            genre_hints.extend(["electronic", "dance", "techno"])
        elif analysis["tempo"] < 70:
            genre_hints.extend(["ballad", "ambient", "classical"])
        elif 120 <= analysis["tempo"] <= 140:
            genre_hints.extend(["pop", "rock", "folk"])
        
        if analysis["has_drums"]:
            genre_hints.extend(["pop", "rock", "electronic"])
        
        if "Acoustic Grand Piano" in analysis["instruments"]:
            genre_hints.extend(["classical", "jazz", "ballad"])
        
        if "Distortion Guitar" in analysis["instruments"] or "Overdriven Guitar" in analysis["instruments"]:
            genre_hints.extend(["rock", "metal", "blues"])
        
        if "Synth" in str(analysis["instruments"]):
            genre_hints.extend(["electronic", "synthwave", "pop"])
        
        # Remove duplicates and limit to top 5
        analysis["genre_hints"] = list(set(genre_hints))[:5]
        
        return analysis
        
    except Exception as e:
        return {
            "error": f"Failed to analyze MIDI file: {str(e)}",
            "format": 1,
            "tracks": 0,
            "duration": 0,
            "tempo": 120,
            "time_signature": [4, 4],
            "key_signature": "C major",
            "instruments": [],
            "note_range": {"min": 60, "max": 72},
            "complexity_score": 0,
            "genre_hints": [],
            "track_info": []
        }

def get_key_signature(key_number):
    """Convert MIDI key signature to readable format"""
    # MIDI key signatures: -7 to +7 (flats to sharps)
    key_map = {
        -7: "Cb major", -6: "Gb major", -5: "Db major", -4: "Ab major",
        -3: "Eb major", -2: "Bb major", -1: "F major", 0: "C major",
        1: "G major", 2: "D major", 3: "A major", 4: "E major",
        5: "B major", 6: "F# major", 7: "C# major"
    }
    return key_map.get(key_number, "C major")

def get_instrument_name(program_number):
    """Convert MIDI program number to instrument name"""
    instruments = [
        "Acoustic Grand Piano", "Bright Acoustic Piano", "Electric Grand Piano", "Honky-tonk Piano",
        "Electric Piano 1", "Electric Piano 2", "Harpsichord", "Clavi",
        "Celesta", "Glockenspiel", "Music Box", "Vibraphone",
        "Marimba", "Xylophone", "Tubular Bells", "Dulcimer",
        "Drawbar Organ", "Percussive Organ", "Rock Organ", "Church Organ",
        "Reed Organ", "Accordion", "Harmonica", "Tango Accordion",
        "Acoustic Guitar (nylon)", "Acoustic Guitar (steel)", "Electric Guitar (jazz)", "Electric Guitar (clean)",
        "Electric Guitar (muted)", "Overdriven Guitar", "Distortion Guitar", "Guitar harmonics",
        "Acoustic Bass", "Electric Bass (finger)", "Electric Bass (pick)", "Fretless Bass",
        "Slap Bass 1", "Slap Bass 2", "Synth Bass 1", "Synth Bass 2",
        "Violin", "Viola", "Cello", "Contrabass",
        "Tremolo Strings", "Pizzicato Strings", "Orchestral Harp", "Timpani",
        "String Ensemble 1", "String Ensemble 2", "SynthStrings 1", "SynthStrings 2",
        "Choir Aahs", "Voice Oohs", "Synth Voice", "Orchestra Hit",
        "Trumpet", "Trombone", "Tuba", "Muted Trumpet",
        "French Horn", "Brass Section", "SynthBrass 1", "SynthBrass 2",
        "Soprano Sax", "Alto Sax", "Tenor Sax", "Baritone Sax",
        "Oboe", "English Horn", "Bassoon", "Clarinet",
        "Piccolo", "Flute", "Recorder", "Pan Flute",
        "Blown Bottle", "Shakuhachi", "Whistle", "Ocarina",
        "Lead 1 (square)", "Lead 2 (sawtooth)", "Lead 3 (calliope)", "Lead 4 (chiff)",
        "Lead 5 (charang)", "Lead 6 (voice)", "Lead 7 (fifths)", "Lead 8 (bass + lead)",
        "Pad 1 (new age)", "Pad 2 (warm)", "Pad 3 (polysynth)", "Pad 4 (choir)",
        "Pad 5 (bowed)", "Pad 6 (metallic)", "Pad 7 (halo)", "Pad 8 (sweep)",
        "FX 1 (rain)", "FX 2 (soundtrack)", "FX 3 (crystal)", "FX 4 (atmosphere)",
        "FX 5 (brightness)", "FX 6 (goblins)", "FX 7 (echoes)", "FX 8 (sci-fi)",
        "Sitar", "Banjo", "Shamisen", "Koto",
        "Kalimba", "Bag pipe", "Fiddle", "Shanai",
        "Tinkle Bell", "Agogo", "Steel Drums", "Woodblock",
        "Taiko Drum", "Melodic Tom", "Synth Drum", "Reverse Cymbal",
        "Guitar Fret Noise", "Breath Noise", "Seashore", "Bird Tweet",
        "Telephone Ring", "Helicopter", "Applause", "Gunshot"
    ]
    
    if 0 <= program_number < len(instruments):
        return instruments[program_number]
    return f"Unknown Instrument ({program_number})"

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python midi_analyzer.py <midi_file_path>"}))
        sys.exit(1)
    
    midi_path = sys.argv[1]
    
    if not os.path.exists(midi_path):
        print(json.dumps({"error": f"MIDI file not found: {midi_path}"}))
        sys.exit(1)
    
    # Analyze the MIDI file
    analysis = analyze_midi_file(midi_path)
    
    # Output JSON result
    print(json.dumps(analysis, indent=2))

if __name__ == "__main__":
    main()
