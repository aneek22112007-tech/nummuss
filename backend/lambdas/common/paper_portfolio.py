"""Small, deterministic paper-portfolio helpers shared by all agents.

These helpers never submit brokerage orders. They translate the latest observed
price signal into a transparent, bounded paper position so the dashboard can
compare agents on the same market data.
"""

import re
from datetime import datetime, timezone
from typing import Any, Iterable


STARTING_CAPITAL_INR = 100_000.0
MAX_ALLOCATION_PCT = 0.05


def default_performance() -> dict[str, Any]:
    return {
        "starting_capital_inr": STARTING_CAPITAL_INR,
        "cash_inr": STARTING_CAPITAL_INR,
        "units": 0,
        "current_value_inr": STARTING_CAPITAL_INR,
        "pnl_inr": 0.0,
        "trades_taken": 0,
        "last_action": "hold",
        "last_price": None,
        "last_updated": None,
    }


def latest_price(signals: Iterable[Any], symbol: str) -> float | None:
    """Extract the latest numeric price for a symbol from normalized signals."""
    price = None
    for signal in signals:
        if getattr(signal, "symbol", "").upper() != symbol.upper():
            continue
        if getattr(signal, "type", "") != "price":
            continue
        content = getattr(signal, "content", "")
        match = re.search(r"(?:price|at|close)\s*(?:₹|\$)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)", content, re.I)
        if match:
            try:
                price = float(match.group(1).replace(",", ""))
            except ValueError:
                continue
    return price


def apply_paper_decision(
    performance: dict[str, Any] | None,
    *,
    action: str,
    price: float | None,
    timestamp: str | None = None,
) -> dict[str, Any]:
    """Mark a bounded long-only paper portfolio to the supplied market price."""
    state = default_performance()
    state.update(performance or {})
    cash = float(state.get("cash_inr", STARTING_CAPITAL_INR))
    units = int(state.get("units", 0))

    if price and price > 0:
        capital = cash + (units * price)
        if action == "buy":
            allocation = capital * MAX_ALLOCATION_PCT
            quantity = int(allocation // price)
            if quantity > 0 and cash >= quantity * price:
                cash -= quantity * price
                units += quantity
                state["trades_taken"] = int(state.get("trades_taken", 0)) + 1
        elif action == "sell" and units > 0:
            cash += units * price
            units = 0
            state["trades_taken"] = int(state.get("trades_taken", 0)) + 1

        state["last_price"] = round(price, 2)
        state["current_value_inr"] = round(cash + (units * price), 2)
    else:
        # A decision may still be recorded, but it must not invent a price/P&L.
        state["current_value_inr"] = round(cash + (units * float(state.get("last_price") or 0)), 2)

    state["cash_inr"] = round(cash, 2)
    state["units"] = units
    state["pnl_inr"] = round(state["current_value_inr"] - STARTING_CAPITAL_INR, 2)
    state["last_action"] = action
    state["last_updated"] = timestamp or datetime.now(timezone.utc).isoformat()
    return state
