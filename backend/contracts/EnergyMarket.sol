// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EnergyMarket
 * @dev Handles P2P energy trade settlement on-chain
 */
contract EnergyMarket {
    struct Trade {
        string tradeId;
        address seller;
        address buyer;
        uint256 energyKwh; // stored as kwh * 1000 for precision
        uint256 priceKwh;  // stored as wei/unit
        uint256 timestamp;
    }

    mapping(string => Trade) public trades;
    string[] public tradeIds;
    
    event TradeSettled(string tradeId, address indexed seller, address indexed buyer, uint256 amount);

    function settleTrade(
        string memory _tradeId,
        address _seller,
        address _buyer,
        uint256 _energyKwh,
        uint256 _priceKwh
    ) public {
        Trade memory newTrade = Trade({
            tradeId: _tradeId,
            seller: _seller,
            buyer: _buyer,
            energyKwh: _energyKwh,
            priceKwh: _priceKwh,
            timestamp: block.timestamp
        });

        trades[_tradeId] = newTrade;
        tradeIds.push(_tradeId);

        emit TradeSettled(_tradeId, _seller, _buyer, _energyKwh * _priceKwh);
    }

    function getTradeCount() public view returns (uint256) {
        return tradeIds.length;
    }
}
