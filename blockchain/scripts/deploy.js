/**
 * deploy.js — Hardhat deployment script for EnergyMarket.sol
 * Usage:
 *   npx hardhat run scripts/deploy.js --network localhost
 *
 * After running, copy the printed contract address into:
 *   backend/.env  →  ENERGY_MARKET_CONTRACT=0x...
 */
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ⚡ Project Flux-Agent — EnergyMarket Contract Deployment");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Get the deployer (Hardhat account[0] — the contract owner / backend wallet)
  const [deployer] = await ethers.getSigners();
  console.log(`\n🔑 Deployer (owner):  ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance:           ${ethers.formatEther(balance)} ETH\n`);

  // Compile + deploy
  console.log("🔨 Compiling EnergyMarket.sol ...");
  const EnergyMarket = await ethers.getContractFactory("EnergyMarket");

  console.log("🚀 Deploying contract ...");
  const contract = await EnergyMarket.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`\n✅ EnergyMarket deployed at: ${contractAddress}`);
  console.log(`   Network:  ${hre.network.name}`);
  console.log(`   Chain ID: ${(await ethers.provider.getNetwork()).chainId}\n`);

  // ── Write deployment info to a JSON file readable by the Python backend ──────
  const deployInfo = {
    contractAddress,
    deployerAddress: deployer.address,
    network:         hre.network.name,
    chainId:         Number((await ethers.provider.getNetwork()).chainId),
    deployedAt:      new Date().toISOString(),
    rpcUrl:          hre.network.config.url || "http://127.0.0.1:8545",
  };

  // Write to blockchain/deployment.json
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deployInfo, null, 2));
  console.log(`📄 Deployment info saved → ${deploymentPath}`);

  // Write ABI to blockchain/artifacts_export/EnergyMarket_abi.json for the backend
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "EnergyMarket.sol",
    "EnergyMarket.json"
  );
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const exportDir = path.join(__dirname, "..", "artifacts_export");
    fs.mkdirSync(exportDir, { recursive: true });
    const abiOut = path.join(exportDir, "EnergyMarket_abi.json");
    fs.writeFileSync(abiOut, JSON.stringify(artifact.abi, null, 2));
    console.log(`📄 ABI exported       → ${abiOut}`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Next steps:");
  console.log(`  1. Add to backend/.env:`);
  console.log(`       HARDHAT_RPC_URL=http://127.0.0.1:8545`);
  console.log(`       ENERGY_MARKET_CONTRACT=${contractAddress}`);
  console.log(`       DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`);
  console.log("  2. Restart the Python backend (main.py)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exitCode = 1;
});
