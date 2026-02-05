# Research Summary

**Project:** KLO Match-3 Demo
**Researched:** 2026-02-05

---

## Key Findings

### Stack
- **Phaser 3.80+** — Built-in tweens/particles sufficient, no plugins needed
- **Vite 5** — Fast HMR, manual chunks for Phaser/Firebase
- **Firebase modular SDK** — ~180kb vs ~600kb compat

### Architecture
- **Layer separation:** Scenes (thin) → Game Logic (pure TS) → Firebase Services
- **Game logic testable** without Phaser runtime
- **State machine** for turn flow (WAITING_INPUT → PROCESSING → ...)

### Implementation Patterns
- **Match detection:** Line scan O(64), not flood fill
- **Cascade loop:** Clear → gravity → spawn → repeat (max depth 20)
- **Gravity:** Column-based, bottom-up two-pointer

### Critical Pitfalls
1. **Input during animations** → State machine blocks input
2. **Sprite pool exhaustion** → Object pooling on mobile
3. **Cascade infinite loops** → Depth limit
4. **Animation/logic desync** → Grid as source of truth

---

## Roadmap Implications

### Recommended Phase Structure

| Phase | Focus | Why This Order |
|-------|-------|----------------|
| 1 | Project setup + Boot scene | Foundation for everything |
| 2 | Core grid + match detection | Testable without rendering |
| 3 | Game scene + animations | Connect logic to visuals |
| 4 | Boosters + obstacles | Builds on core mechanics |
| 5 | Firebase + UI polish | Backend after gameplay works |

### Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Animation complexity | Use Phaser built-in tweens, not physics |
| Mobile performance | Object pooling, particle limits |
| Firebase coupling | Service layer abstraction |
| State bugs | Pure logic classes, unit tests |

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Match algorithm | Line scan | O(64), simpler than flood fill |
| State management | Phaser Registry | Built-in, sufficient for prototype |
| Animation system | Phaser Tweens | Deterministic, not physics-based |
| Firebase access | Service layer | Testable, mockable |

---

## Next Steps

1. **Define requirements** based on research findings
2. **Create roadmap** with phase dependencies
3. **Start Phase 1:** Project setup + Firebase init

---

*Research complete. Ready for requirements definition.*
