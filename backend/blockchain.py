"""
blockchain.py — Hardhat-backed Blockchain Integration
======================================================
Connects the Flux-Agent Python backend to a live Hardhat local node running
EnergyMarket.sol. Every validated trade is settled as a real on-chain
transaction via Web3.py.

Architecture:
  Hardhat node (port 8545)
       ↑
  Web3.py  ←→  EnergyMarket contract
       ↑
  HardhatLedger (this module)
       ↑
  main.py simulation loop → records each TradeRecord

Fallback:
  If Hardhat is not running, the module falls back to the in-memory
  BlockchainLedger so the demo keeps working uninterrupted.

Environment variables (backend/.env):
  HARDHAT_RPC_URL          = http://127.0.0.1:8545
  ENERGY_MARKET_CONTRACT   = 0x<address from deploy script>
  DEPLOYER_PRIVATE_KEY     = 0xac0974...  (Hardhat account #0 default)
"""
from __future__ import annotations

import json
import logging
import os
import time
import hashlib
from pathlib import Path
from typing import List, Optional

# Load .env FIRST so os.getenv() sees HARDHAT_RPC_URL etc at import time
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=False)
except ImportError:
    pass

log = logging.getLogger("blockchain")

# ── Try to load Web3 (optional dependency) ────────────────────────────────────
try:
    from web3 import Web3
    from web3.middleware import ExtraDataToPOAMiddleware
    WEB3_AVAILABLE = True
except ImportError:
    WEB3_AVAILABLE = False
    log.warning("web3 not installed — falling back to in-memory ledger")

# ─────────────────────────────────────────────────────────────────────────────
# In-memory fallback ledger (unchanged from original)
# ─────────────────────────────────────────────────────────────────────────────
class Block:
    def __init__(self, index: int, trades: List[dict], previous_hash: str):
        self.index         = index
        self.timestamp     = time.time()
        self.trades        = trades
        self.previous_hash = previous_hash
        self.nonce         = 0
        self.hash          = self.calculate_hash()

    def calculate_hash(self) -> str:
        payload = json.dumps({
            "index":         self.index,
            "timestamp":     self.timestamp,
            "trades":        self.trades,
            "previous_hash": self.previous_hash,
            "nonce":         self.nonce,
        }, sort_keys=True)
        return hashlib.sha256(payload.encode()).hexdigest()

    def mine_block(self, difficulty: int):
        target = "0" * difficulty
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()
        log.info(f"⛏️  Block {self.index} mined! Hash: {self.hash[:20]}...")


class BlockchainLedger:
    """Pure-Python in-memory ledger used as fallback."""

    def __init__(self, difficulty: int = 2):
        self.chain:          List[Block] = []
        self.difficulty:     int         = difficulty
        self.pending_trades: List[dict]  = []
        self._create_genesis_block()

    def _create_genesis_block(self):
        genesis = Block(0, [{"info": "Flux-Agent Genesis"}], "0")
        genesis.mine_block(self.difficulty)
        self.chain.append(genesis)

    def record_trade(self, trade, xai_explanation: str = "") -> Optional[str]:
        trade_data = {
            "id":       trade.trade_id,
            "seller":   trade.seller_id,
            "buyer":    trade.buyer_id,
            "kwh":      trade.energy_kwh,
            "price":    trade.price_kwh,
            "sig":      trade.signature,
            "ts":       trade.timestamp,
            "contract": "in-memory-ledger",
        }
        self.pending_trades.append(trade_data)
        if len(self.pending_trades) >= 3:
            self.mine_pending_trades()
        return None  # no tx hash in memory mode

    def mine_pending_trades(self):
        if not self.pending_trades:
            return
        new_block = Block(len(self.chain), self.pending_trades, self.chain[-1].hash)
        new_block.mine_block(self.difficulty)
        self.chain.append(new_block)
        self.pending_trades = []

    def get_history(self) -> List[dict]:
        return [
            {
                "block":  b.index,
                "hash":   b.hash,
                "prev":   b.previous_hash,
                "ts":     b.timestamp,
                "trades": b.trades,
            }
            for b in self.chain
        ]

    def get_mempool(self) -> List[dict]:
        return self.pending_trades


# ─────────────────────────────────────────────────────────────────────────────
# Hardhat-backed ledger
# ─────────────────────────────────────────────────────────────────────────────

# Node addresses used for Hardhat test accounts (deterministic)
# Hardhat default accounts (keep consistent with deploy.js owner = account[0])
HARDHAT_ACCOUNTS = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",  # [0] deployer / owner
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",  # [1]
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",  # [2]
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",  # [3]
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",  # [4]
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",  # [5]
    "0x976EA74026E726554dB657fA54763abd0C3a0aa9",  # [6]
    "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",  # [7]
    "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",  # [8]
    "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",  # [9]
    "0xBcd4042DE499D14e55001CcbB24a551F3b954096",  # [10]
    "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",  # [11]
    "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",  # [12]
    "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",  # [13]
    "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",  # [14]
    "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",  # [15]
    "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",  # [16]
    "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",  # [17]
    "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",  # [18]
    "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",  # [19]
]

# Deterministically map a node_id string → Hardhat test account address
def _node_to_address(node_id: str) -> str:
    idx = int(hashlib.sha256(node_id.encode()).hexdigest(), 16) % len(HARDHAT_ACCOUNTS)
    return HARDHAT_ACCOUNTS[idx]


def _load_abi() -> Optional[list]:
    """Load EnergyMarket ABI from the Hardhat export directory."""
    candidates = [
        # Relative to this file: ../blockchain/artifacts_export/
        Path(__file__).parent.parent / "blockchain" / "artifacts_export" / "EnergyMarket_abi.json",
        # Or embedded in backend/contracts/ (legacy)
        Path(__file__).parent / "contracts" / "EnergyMarket_abi.json",
    ]
    for p in candidates:
        if p.exists():
            with open(p) as f:
                return json.load(f)
    log.warning("EnergyMarket ABI not found; run: cd blockchain && npx hardhat compile")
    return None


def _load_deployment() -> Optional[dict]:
    """Load deployment.json written by the Hardhat deploy script."""
    candidates = [
        Path(__file__).parent.parent / "blockchain" / "deployment.json",
    ]
    for p in candidates:
        if p.exists():
            with open(p) as f:
                return json.load(f)
    return None


class HardhatLedger:
    """
    Wraps the EnergyMarket smart contract on a local Hardhat node.
    Each call to record_trade() sends a real eth_sendTransaction.
    """

    def __init__(self):
        self.w3:         Optional[Web3]   = None
        self.contract                     = None
        self.owner_addr: str              = ""
        self.connected:  bool             = False
        self._tx_history: List[dict]      = []
        self._connect()

    # ── Connection ─────────────────────────────────────────────────────────────

    def _connect(self):
        if not WEB3_AVAILABLE:
            log.warning("web3 not installed — Hardhat integration disabled")
            return

        rpc_url   = os.getenv("HARDHAT_RPC_URL", "http://127.0.0.1:8545")
        pk        = os.getenv("DEPLOYER_PRIVATE_KEY",
                              "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
        contract_addr = os.getenv("ENERGY_MARKET_CONTRACT", "")

        # If not in env, try deployment.json
        if not contract_addr:
            info = _load_deployment()
            if info:
                contract_addr = info.get("contractAddress", "")
                log.info(f"📁 Loaded contract address from deployment.json: {contract_addr}")

        log.info(f"🔍 Hardhat Connection Debug: RPC={rpc_url}, Contract={contract_addr}, PK_len={len(pk) if pk else 0}")

        if not contract_addr:
            log.warning("ENERGY_MARKET_CONTRACT not set and deployment.json not found.")
            return

        log.info(f"🔗 HardhatLedger: Connecting to contract at {contract_addr} ...")

        try:
            self.w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": 5}))
            # POA middleware needed for clique/PoA chains; harmless on Hardhat
            self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

            if not self.w3.is_connected():
                log.warning(f"❌ Cannot reach Hardhat node at {rpc_url} — is 'npx hardhat node' running and reachable?")
                self.w3 = None
                return
            
            log.info(f"✅ Web3 connected to {rpc_url}")

            abi = _load_abi()
            if abi is None:
                log.warning("ABI not found — compile the Hardhat project first")
                self.w3 = None
                return

            checksum_addr = Web3.to_checksum_address(contract_addr)
            self.contract = self.w3.eth.contract(address=checksum_addr, abi=abi)
            self.owner_addr = self.w3.eth.account.from_key(pk).address
            self._pk = pk

            chain_id = self.w3.eth.chain_id
            balance  = self.w3.eth.get_balance(self.owner_addr)
            log.info(
                f"⛓️  Hardhat node connected | chain={chain_id} | "
                f"owner={self.owner_addr[:10]}... | "
                f"balance={Web3.from_wei(balance, 'ether'):.1f} ETH | "
                f"contract={checksum_addr[:10]}..."
            )
            self.connected = True

        except Exception as exc:
            log.error(f"Hardhat connection error: {exc} — using in-memory fallback")
            self.w3 = None

    # ── Trade Settlement ───────────────────────────────────────────────────────

    def record_trade(self, trade, xai_explanation: str = "") -> Optional[str]:
        """
        Submit a TradeRecord to EnergyMarket.settleTrade() on Hardhat.
        Returns the transaction hash (str) or None on failure.
        """
        if not self.connected or self.w3 is None:
            return None

        try:
            seller_addr = Web3.to_checksum_address(_node_to_address(trade.seller_id))
            buyer_addr  = Web3.to_checksum_address(_node_to_address(trade.buyer_id))

            # Convert Python float kWh → int Wh (×1000) and ₹/kWh → paise (×100)
            energy_wh        = int(round(trade.energy_kwh * 1000))
            price_per_kwh_ps = int(round(trade.price_kwh * 100))

            if energy_wh <= 0:
                log.debug(f"Skipping zero-energy trade {trade.trade_id}")
                return None

            # Build transaction
            nonce = self.w3.eth.get_transaction_count(self.owner_addr)
            txn   = self.contract.functions.settleTrade(
                trade.trade_id,
                seller_addr,
                buyer_addr,
                energy_wh,
                price_per_kwh_ps,
                xai_explanation or "",
            ).build_transaction({
                "from":     self.owner_addr,
                "nonce":    nonce,
                "gas":      300_000,
                "gasPrice": self.w3.to_wei("1", "gwei"),
            })

            # Sign and send
            signed = self.w3.eth.account.sign_transaction(txn, private_key=self._pk)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=15)

            tx_hash_hex = tx_hash.hex()
            status = "✅ SUCCESS" if receipt.status == 1 else "❌ REVERTED"

            log.info(
                f"⛓️  {status} | trade={trade.trade_id[:12]}... | "
                f"gas={receipt.gasUsed} | tx={tx_hash_hex[:18]}..."
            )

            record = {
                "trade_id":    trade.trade_id,
                "seller":      seller_addr,
                "buyer":       buyer_addr,
                "energy_wh":   energy_wh,
                "price_paise": price_per_kwh_ps,
                "tx_hash":     tx_hash_hex,
                "block":       receipt.blockNumber,
                "gas":         receipt.gasUsed,
                "status":      "settled" if receipt.status == 1 else "failed",
                "ts":          time.time(),
            }
            self._tx_history.append(record)
            self._tx_history = self._tx_history[-500:]  # keep last 500

            return tx_hash_hex if receipt.status == 1 else None

        except Exception as exc:
            log.error(f"Hardhat settleTrade failed for {trade.trade_id}: {exc}")
            return None

    # ── Query Helpers ──────────────────────────────────────────────────────────

    def get_on_chain_trade(self, trade_id: str) -> Optional[dict]:
        """Fetch a single trade from the contract."""
        if not self.connected:
            return None
        try:
            t = self.contract.functions.getTrade(trade_id).call()
            return {
                "tradeId":          t[0],
                "seller":           t[1],
                "buyer":            t[2],
                "energyWh":         t[3],
                "pricePerKwhPaise": t[4],
                "totalPaise":       t[5],
                "createdAt":        t[6],
                "settledAt":        t[7],
                "status":           ["Pending", "Settled", "Cancelled"][t[8]],
                "xaiExplanation":   t[9],
            }
        except Exception as exc:
            log.error(f"getTrade({trade_id}) failed: {exc}")
            return None

    def get_on_chain_count(self) -> int:
        """Number of trades settled on-chain."""
        if not self.connected:
            return 0
        try:
            return self.contract.functions.getTradeCount().call()
        except Exception:
            return 0

    def get_history(self) -> List[dict]:
        """Return tx history maintained in-process (not re-queried from chain)."""
        return self._tx_history

    def get_mempool(self) -> List[dict]:
        return []  # Hardhat auto-mines; no pending pool

    def is_connected(self) -> bool:
        return self.connected


# ─────────────────────────────────────────────────────────────────────────────
# Module-level: instantiate the best available ledger
# ─────────────────────────────────────────────────────────────────────────────

def _build_ledger():
    """
    Try Hardhat first; fall back to in-memory BlockchainLedger.
    This is called once at import time.
    """
    if WEB3_AVAILABLE:
        hl = HardhatLedger()
        if hl.connected:
            log.info("🟢 Using HARDHAT on-chain ledger")
            return hl
        else:
            log.info("🟡 Hardhat not reachable — using in-memory ledger (demo mode)")
    return BlockchainLedger()


ledger = _build_ledger()
