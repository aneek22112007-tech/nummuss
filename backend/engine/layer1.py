from typing import List, Dict, Any, Tuple
from .schemas import MarketSignal, EvidenceQuality

def validate_evidence(
    cited_symbols: List[str],
    cited_signals: List[Dict[str, Any]],
    available_signals: List[MarketSignal]
) -> Tuple[bool, EvidenceQuality, str]:
    """
    Layer 1: Evidence Consistency Gate
    Ensures that the LLM's decision is grounded in the actual available signals.
    """
    if not cited_symbols and not cited_signals:
        return True, "weak", "No evidence cited"

    available_signal_map = {sig.signal_id: sig for sig in available_signals}
    available_symbols = {sig.symbol for sig in available_signals}

    # 1. Check if cited symbols exist in available signals
    for symbol in cited_symbols:
        if symbol not in available_symbols:
            return False, "weak", f"Unsupported claim: Symbol {symbol} not found in available signals."

    # 2. Check if cited signals exist and match content loosely
    valid_citations = 0
    for citation in cited_signals:
        sig_id = citation.get("signal_id")
        if not sig_id or sig_id not in available_signal_map:
            return False, "weak", f"Unsupported claim: Signal {sig_id} not found."
        
        valid_citations += 1

    # 3. Determine Evidence Quality
    if valid_citations >= 2:
        return True, "strong", "Multiple valid sources cited."
    elif valid_citations == 1:
        return True, "medium", "Single valid source cited."
    
    return True, "weak", "Passed with weak evidence."
