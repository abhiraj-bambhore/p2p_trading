"""
Federated Learning Node — Flower (flwr) based privacy-preserving habit learning.
Each node trains a local model on its own energy usage; only weights are shared.
"""
from __future__ import annotations
import logging, random
from typing import List, Tuple
import numpy as np
from models import GridNode

log = logging.getLogger("federated")

# ─── Try importing Flower ─────────────────────────────────────────────────────
try:
    import flwr as fl
    FLWR_AVAILABLE = True
    log.info("Flower (flwr) available — federated learning enabled.")
except ImportError:
    FLWR_AVAILABLE = False
    log.warning("Flower not installed — using simulated weight aggregation.")


class LocalEnergyModel:
    """
    A ultra-lightweight linear model that learns:
    'At what time does this home usually have peak demand?'
    Parameters: [peak_hour, peak_magnitude, morning_start]
    """
    def __init__(self, node: GridNode):
        self.node        = node
        self.params      = np.array([19.0, 1.2, 7.5])  # defaults
        self.trained     = False
        self._history: List[Tuple[float, float]] = []  # (hour, load_kw)

    def record_observation(self, hour: float, load_kw: float):
        self._history.append((hour, load_kw))

    def train(self, rounds: int = 3) -> np.ndarray:
        """Simple SGD to fit a Gaussian load profile."""
        if len(self._history) < 5:
            return self.params

        data = np.array(self._history)
        hours = data[:, 0]
        loads = data[:, 1]

        lr = 0.01
        for _ in range(rounds * 10):
            peak_h, peak_m, morn_h = self.params
            pred = peak_m * np.exp(-0.5 * ((hours - peak_h) / 2.0) ** 2)
            err = pred - loads
            # Gradient update (very simplified)
            self.params[0] -= lr * np.mean(err * -(hours - peak_h) / 4.0 * pred)
            self.params[1] -= lr * np.mean(err * np.exp(-0.5 * ((hours - peak_h) / 2.0) ** 2))
            self.params = np.clip(self.params, [0, 0, 0], [24, 10, 12])

        self.trained = True
        log.info(f"🧬 Node {self.node.label}: trained — peak_hour={self.params[0]:.1f}h")
        return self.params

    def predict_peak_hour(self) -> float:
        return float(self.params[0])


def federated_aggregate(local_weights: List[np.ndarray]) -> np.ndarray:
    """FedAvg: average weights from all participating nodes."""
    if not local_weights:
        return np.array([19.0, 1.2, 7.5])
    stacked = np.stack(local_weights, axis=0)
    aggregated = np.mean(stacked, axis=0)
    log.info(f"🌐 FedAvg complete: global_peak_hour={aggregated[0]:.1f}h")
    return aggregated


def run_federated_round(nodes: List[GridNode], models: dict) -> dict:
    """
    Simulates one federated learning round.
    1. Each node trains locally.
    2. Only weights are aggregated (no raw data shared).
    3. Global model is redistributed.
    """
    local_weights = []
    for node in nodes:
        m = models.get(node.node_id)
        if m is None:
            m = LocalEnergyModel(node)
            models[node.node_id] = m

        # Simulate recording 10 observations
        hour_now = random.uniform(0, 24)
        for h_offset in range(-5, 5):
            h = (hour_now + h_offset) % 24
            load = max(0, random.gauss(1.0, 0.3) + (1.5 if 18 < h < 22 else 0))
            m.record_observation(h, load)

        weights = m.train()
        local_weights.append(weights)

    global_weights = federated_aggregate(local_weights)

    # Apply global intelligence back to each node (update bid strategies)
    for node in nodes:
        global_peak_hour = global_weights[0]
        # Nodes that peak late should bid higher in evening
        if abs(global_peak_hour - 19.0) < 2:
            node.bid_price = round(min(node.bid_price * 1.05, 0.15), 4)

    return models
