// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EnergyMarket
 * @author Project Flux-Agent — India AI Summit 2026
 * @notice P2P Solar Energy Trade Settlement Contract
 * @dev Hosts the full lifecycle of a bilateral energy trade:
 *      create → settle (with payment) → view history.
 *      Prices are stored in paise (₹ × 100) to avoid floats.
 *      Energy is stored in Wh (kWh × 1000) for precision.
 */
contract EnergyMarket {

    // ─── Data Structures ───────────────────────────────────────────────────────

    enum TradeStatus { Pending, Settled, Cancelled }

    struct Trade {
        string   tradeId;
        address  seller;
        address  buyer;
        uint256  energyWh;       // Wh (kWh × 1000)
        uint256  pricePerKwhPaise; // paise per kWh (₹/kWh × 100)
        uint256  totalPaise;     // energyWh/1000 * pricePerKwhPaise
        uint256  createdAt;
        uint256  settledAt;
        TradeStatus status;
        string   xaiExplanation; // Llama 3.1 XAI summary stored on-chain
    }

    // ─── State ─────────────────────────────────────────────────────────────────

    address public owner;
    uint256 public tradeCount;

    mapping(string => Trade)  public trades;           // tradeId → Trade
    string[]                  public tradeIds;         // ordered list
    mapping(address => uint256) public sellerRevenue;  // seller earn tracking
    mapping(address => uint256) public buyerSpend;     // buyer spend tracking

    // ─── Events ────────────────────────────────────────────────────────────────

    event TradeCreated(
        string indexed tradeId,
        address indexed seller,
        address indexed buyer,
        uint256 energyWh,
        uint256 pricePerKwhPaise
    );

    event TradeSettled(
        string indexed tradeId,
        address indexed seller,
        address indexed buyer,
        uint256 totalPaise,
        uint256 settledAt
    );

    event TradeCancelled(string indexed tradeId, address cancelledBy);

    // ─── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "EnergyMarket: caller is not the owner");
        _;
    }

    modifier tradeExists(string memory tradeId) {
        require(bytes(trades[tradeId].tradeId).length > 0, "EnergyMarket: trade not found");
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── Core Functions ────────────────────────────────────────────────────────

    /**
     * @notice Record and immediately settle a P2P energy trade.
     * @dev Called by the Flux-Agent backend after PyPSA validation + signing.
     * @param _tradeId   Unique trade identifier (UUID from Python backend)
     * @param _seller    Seller's Ethereum address (mapped to grid node ID)
     * @param _buyer     Buyer's Ethereum address  (mapped to grid node ID)
     * @param _energyWh  Energy in Wh  (backend sends kWh × 1000)
     * @param _pricePerKwhPaise  Price per kWh in paise (₹/kWh × 100)
     * @param _xaiExplanation    Llama 3.1 XAI explanation string
     */
    function settleTrade(
        string  memory _tradeId,
        address        _seller,
        address        _buyer,
        uint256        _energyWh,
        uint256        _pricePerKwhPaise,
        string  memory _xaiExplanation
    ) external onlyOwner {
        require(bytes(_tradeId).length > 0,   "EnergyMarket: empty tradeId");
        require(_seller != address(0),         "EnergyMarket: invalid seller");
        require(_buyer  != address(0),         "EnergyMarket: invalid buyer");
        require(_seller != _buyer,             "EnergyMarket: seller == buyer");
        require(_energyWh > 0,                 "EnergyMarket: zero energy");
        require(bytes(trades[_tradeId].tradeId).length == 0, "EnergyMarket: duplicate tradeId");

        // Calculate total: energyKwh (=Wh/1000) × pricePerKwhPaise
        uint256 total = (_energyWh * _pricePerKwhPaise) / 1000;

        Trade memory newTrade = Trade({
            tradeId:           _tradeId,
            seller:            _seller,
            buyer:             _buyer,
            energyWh:          _energyWh,
            pricePerKwhPaise:  _pricePerKwhPaise,
            totalPaise:        total,
            createdAt:         block.timestamp,
            settledAt:         block.timestamp,
            status:            TradeStatus.Settled,
            xaiExplanation:    _xaiExplanation
        });

        trades[_tradeId] = newTrade;
        tradeIds.push(_tradeId);
        tradeCount++;

        sellerRevenue[_seller] += total;
        buyerSpend[_buyer]     += total;

        emit TradeCreated(
            _tradeId, _seller, _buyer, _energyWh, _pricePerKwhPaise
        );
        emit TradeSettled(
            _tradeId, _seller, _buyer, total, block.timestamp
        );
    }

    /**
     * @notice Cancel a pending/settled trade (emergency override by owner).
     */
    function cancelTrade(string memory _tradeId)
        external
        onlyOwner
        tradeExists(_tradeId)
    {
        Trade storage t = trades[_tradeId];
        require(t.status != TradeStatus.Cancelled, "EnergyMarket: already cancelled");

        // Reverse revenue/spend accounting
        sellerRevenue[t.seller] = sellerRevenue[t.seller] >= t.totalPaise
            ? sellerRevenue[t.seller] - t.totalPaise : 0;
        buyerSpend[t.buyer] = buyerSpend[t.buyer] >= t.totalPaise
            ? buyerSpend[t.buyer] - t.totalPaise : 0;

        t.status = TradeStatus.Cancelled;
        emit TradeCancelled(_tradeId, msg.sender);
    }

    // ─── View Functions ────────────────────────────────────────────────────────

    function getTrade(string memory _tradeId)
        external
        view
        tradeExists(_tradeId)
        returns (Trade memory)
    {
        return trades[_tradeId];
    }

    function getTradeCount() external view returns (uint256) {
        return tradeCount;
    }

    function getAllTradeIds() external view returns (string[] memory) {
        return tradeIds;
    }

    /**
     * @notice Paginated trade history (newest first).
     * @param offset  Starting index (0 = most recent)
     * @param limit   Max records to return
     */
    function getTradesPaginated(uint256 offset, uint256 limit)
        external
        view
        returns (Trade[] memory result)
    {
        uint256 total = tradeIds.length;
        if (offset >= total) return new Trade[](0);

        // Newest-first order
        uint256 start = total - 1 - offset;
        uint256 count = (start + 1 < limit) ? start + 1 : limit;

        result = new Trade[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = trades[tradeIds[start - i]];
        }
    }

    /**
     * @notice Returns cumulative stats for a seller node.
     */
    function getSellerStats(address _seller)
        external
        view
        returns (uint256 totalRevenuePaise, uint256 tradesClosed)
    {
        totalRevenuePaise = sellerRevenue[_seller];
        uint256 count = 0;
        for (uint256 i = 0; i < tradeIds.length; i++) {
            if (trades[tradeIds[i]].seller == _seller &&
                trades[tradeIds[i]].status == TradeStatus.Settled) {
                count++;
            }
        }
        tradesClosed = count;
    }
}
