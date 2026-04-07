const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnergyMarket — P2P Solar Trade Settlement", function () {
  let energyMarket;
  let owner, seller, buyer, stranger;

  // Sample trade data matching the Flux-Agent backend format
  const TRADE_ID   = "trade-test-001";
  const ENERGY_WH  = 5000n;              // 5 kWh × 1000
  const PRICE_PAISE = 850n;             // ₹8.50/kWh × 100

  beforeEach(async () => {
    [owner, seller, buyer, stranger] = await ethers.getSigners();
    const EnergyMarket = await ethers.getContractFactory("EnergyMarket");
    energyMarket = await EnergyMarket.deploy();
    await energyMarket.waitForDeployment();
  });

  // ── Deployment ─────────────────────────────────────────────────────────────

  describe("Deployment", () => {
    it("sets the deployer as owner", async () => {
      expect(await energyMarket.owner()).to.equal(owner.address);
    });

    it("starts with zero trades", async () => {
      expect(await energyMarket.getTradeCount()).to.equal(0n);
    });
  });

  // ── Trade Settlement ────────────────────────────────────────────────────────

  describe("settleTrade()", () => {
    it("settles a valid trade and emits events", async () => {
      const tx = await energyMarket.settleTrade(
        TRADE_ID,
        seller.address,
        buyer.address,
        ENERGY_WH,
        PRICE_PAISE,
        "AI decided: surplus solar at node S1, deficit at node B2"
      );

      await expect(tx)
        .to.emit(energyMarket, "TradeCreated")
        .withArgs(TRADE_ID, seller.address, buyer.address, ENERGY_WH, PRICE_PAISE);

      await expect(tx)
        .to.emit(energyMarket, "TradeSettled")
        .withArgs(TRADE_ID, seller.address, buyer.address, (ENERGY_WH * PRICE_PAISE) / 1000n, await ethers.provider.getBlock("latest").then(b => b.timestamp));
    });

    it("stores trade correctly on-chain", async () => {
      await energyMarket.settleTrade(
        TRADE_ID, seller.address, buyer.address,
        ENERGY_WH, PRICE_PAISE, "XAI: cost-optimal route"
      );

      const trade = await energyMarket.getTrade(TRADE_ID);
      expect(trade.tradeId).to.equal(TRADE_ID);
      expect(trade.seller).to.equal(seller.address);
      expect(trade.buyer).to.equal(buyer.address);
      expect(trade.energyWh).to.equal(ENERGY_WH);
      expect(trade.pricePerKwhPaise).to.equal(PRICE_PAISE);
      expect(trade.totalPaise).to.equal((ENERGY_WH * PRICE_PAISE) / 1000n);
      expect(trade.status).to.equal(1n); // Settled
    });

    it("updates tradeCount and tradeIds", async () => {
      await energyMarket.settleTrade(
        TRADE_ID, seller.address, buyer.address,
        ENERGY_WH, PRICE_PAISE, ""
      );
      expect(await energyMarket.getTradeCount()).to.equal(1n);
      const ids = await energyMarket.getAllTradeIds();
      expect(ids[0]).to.equal(TRADE_ID);
    });

    it("updates seller revenue and buyer spend", async () => {
      await energyMarket.settleTrade(
        TRADE_ID, seller.address, buyer.address,
        ENERGY_WH, PRICE_PAISE, ""
      );
      const expected = (ENERGY_WH * PRICE_PAISE) / 1000n;
      expect(await energyMarket.sellerRevenue(seller.address)).to.equal(expected);
      expect(await energyMarket.buyerSpend(buyer.address)).to.equal(expected);
    });

    it("reverts on duplicate tradeId", async () => {
      await energyMarket.settleTrade(
        TRADE_ID, seller.address, buyer.address, ENERGY_WH, PRICE_PAISE, ""
      );
      await expect(
        energyMarket.settleTrade(
          TRADE_ID, seller.address, buyer.address, ENERGY_WH, PRICE_PAISE, ""
        )
      ).to.be.revertedWith("EnergyMarket: duplicate tradeId");
    });

    it("reverts when seller == buyer", async () => {
      await expect(
        energyMarket.settleTrade(
          "t2", seller.address, seller.address, ENERGY_WH, PRICE_PAISE, ""
        )
      ).to.be.revertedWith("EnergyMarket: seller == buyer");
    });

    it("reverts on zero energy", async () => {
      await expect(
        energyMarket.settleTrade(
          "t3", seller.address, buyer.address, 0n, PRICE_PAISE, ""
        )
      ).to.be.revertedWith("EnergyMarket: zero energy");
    });

    it("reverts when called by non-owner", async () => {
      await expect(
        energyMarket.connect(stranger).settleTrade(
          "t4", seller.address, buyer.address, ENERGY_WH, PRICE_PAISE, ""
        )
      ).to.be.revertedWith("EnergyMarket: caller is not the owner");
    });
  });

  // ── Pagination ──────────────────────────────────────────────────────────────

  describe("getTradesPaginated()", () => {
    it("returns newest-first results", async () => {
      for (let i = 0; i < 5; i++) {
        await energyMarket.settleTrade(
          `trade-00${i}`, seller.address, buyer.address,
          ENERGY_WH, PRICE_PAISE, ""
        );
      }
      const page = await energyMarket.getTradesPaginated(0, 3);
      expect(page.length).to.equal(3);
      expect(page[0].tradeId).to.equal("trade-004"); // newest first
    });

    it("returns empty array if offset >= total", async () => {
      const page = await energyMarket.getTradesPaginated(99, 5);
      expect(page.length).to.equal(0);
    });
  });

  // ── Cancellation ────────────────────────────────────────────────────────────

  describe("cancelTrade()", () => {
    it("cancels a trade and reverses accounting", async () => {
      await energyMarket.settleTrade(
        TRADE_ID, seller.address, buyer.address, ENERGY_WH, PRICE_PAISE, ""
      );

      await expect(energyMarket.cancelTrade(TRADE_ID))
        .to.emit(energyMarket, "TradeCancelled")
        .withArgs(TRADE_ID, owner.address);

      const trade = await energyMarket.getTrade(TRADE_ID);
      expect(trade.status).to.equal(2n); // Cancelled

      expect(await energyMarket.sellerRevenue(seller.address)).to.equal(0n);
      expect(await energyMarket.buyerSpend(buyer.address)).to.equal(0n);
    });

    it("reverts double-cancel", async () => {
      await energyMarket.settleTrade(
        TRADE_ID, seller.address, buyer.address, ENERGY_WH, PRICE_PAISE, ""
      );
      await energyMarket.cancelTrade(TRADE_ID);
      await expect(energyMarket.cancelTrade(TRADE_ID))
        .to.be.revertedWith("EnergyMarket: already cancelled");
    });
  });

  // ── Seller Stats ────────────────────────────────────────────────────────────

  describe("getSellerStats()", () => {
    it("returns correct cumulative revenue and trade count", async () => {
      await energyMarket.settleTrade("s1", seller.address, buyer.address, 2000n, 850n, "");
      await energyMarket.settleTrade("s2", seller.address, buyer.address, 3000n, 850n, "");

      const [revenue, count] = await energyMarket.getSellerStats(seller.address);
      // (2000*850/1000) + (3000*850/1000) = 1700 + 2550 = 4250
      expect(revenue).to.equal(4250n);
      expect(count).to.equal(2n);
    });
  });
});
