# FilmTrack Taste DNA v1

Issue: #86
Parent roadmap: #83

## Goal
Turn FilmTrack first-party watch history into a deterministic, explainable Persian cinephile identity layer that can later power Recommendation v2 and Taste Match.

## Signals
- personal rating
- diary/re-watch frequency
- movie vs TV preference
- title genres
- directors / principal cast
- countries / languages
- release decade

## Principles
- zero paid-AI dependency
- deterministic and testable
- private by default
- sparse-data safe
- no Production DB schema change required for v1 computation
- designed to become the common vector/profile contract for #87 Taste Match

## Primary outputs
- top genres
- top people
- top countries
- top languages
- preferred decades
- average rating and rating strictness
- rewatch rate
- movie/TV split
- sample size / confidence signal
