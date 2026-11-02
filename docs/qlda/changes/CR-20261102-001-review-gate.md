# CR-20261102-001 — temporary review gate exception

Observed 2026-11-02. Source: actual workspace user instruction, “tạm thời bỏ khóa cái cần người khác review đi, chưa cần cái đó”. This was a real policy request; no retrospective meeting or stakeholder signature is inferred.

Prior baseline: main required one approving review plus passing strict `quality`. Requested change: temporarily remove the other-member approval lock. Applied repository setting: `required_approving_review_count=0`. PRs, required `quality`, strict checks, admin enforcement, resolved conversations and no force-push/deletion remain.

Alternatives: keep one approval and wait / temporary zero approvals with CI / remove all protection. Implemented the middle option authorized by the user. Scope impact: code-review merge control only; P0 product scope unchanged. Schedule impact: removes reviewer-availability blockage; no quantified velocity or time-saving claim. Cloud/payment cost impact: none. Risk: independent defects can escape; CI and incremental PRs remain required. Team peer review is still valuable and requests already sent remain real.

Implementation authorization: actual user instruction above. Formal course CCB/PO/instructor acceptance: **PENDING_HUMAN**. This exception does **not** satisfy QLDA peer-review evidence, and is not presented as a signed approved course CR. Restore at least one real approval before formal QLDA acceptance. Reinstatement date: PENDING_HUMAN.

Actual operations: branch protection API returned required approval count 0. Governance PR #46 merged after green CI, without claiming a peer approval. Subsequent technical PRs use this temporary gate while preserving actual CI evidence.
