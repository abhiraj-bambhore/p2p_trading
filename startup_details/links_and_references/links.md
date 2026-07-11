# 🔗 Project Flux-Agent — Links & References

> All important links for the P2P Energy Trading startup.

---

## 🚀 Demo & Deployed Links

| Service | URL | Status |
|---------|-----|--------|
| Frontend (PoC) | [p2p-trading.vercel.app](https://p2p-trading-nrj4iz7e0-abhirajs-projects-1d7aabae.vercel.app/) | 🟢 Live |
| Backend API | Deployed via FastAPI on local cluster (localhost:8000) | 🟡 Local Only |
| Video Demo | [Google Drive — Full Demo](https://drive.google.com/file/d/17HzW5DpCWRaoFsLILpnOXY-AOs39rTaz/view?usp=drivesdk) | 🟢 Available |

---

## 📦 Repository Links

| Repository | URL | Description |
|------------|-----|-------------|
| Main Repo | [github.com/Abhiraj-ux/p2p_trading](https://github.com/Abhiraj-ux/p2p_trading) | Full-stack P2P energy trading platform (FastAPI + Next.js + Hardhat) |
| Hardware Simulation (Wokwi) | [wokwi.com — esp_sim](https://wokwi.com/projects/new/esp32) | ESP32 + PZEM-004T + 4-CH Relay simulation (Arduino/C++) |
| Blockchain (in-repo) | [/blockchain](https://github.com/Abhiraj-ux/p2p_trading/tree/main/blockchain) | Hardhat smart contracts — local Ethereum (Chain ID: 31337) |

---

## 🏢 Competitor & Reference Companies

### 🇮🇳 India — P2P Energy Trading Players

| Company / Platform | URL | Notes |
|--------------------|-----|-------|
| **PowerXchange** | [powerxchange.io](https://powerxchange.io) | Blockchain + AI powered P2P trading platform. Authorized TSP for DISCOM pilots in Delhi-NCR & UP. Showcased at India Energy Stack Pavilion. |
| **Pulse Energy** | [pulseenergy.io](https://pulseenergy.io) | P2P energy trading tech provider. Involved in live IES (India Energy Stack) demos with AI-driven voice agents for trading. |
| **YoGrid** (Yellow Haze Sustainable) | [yogrid.in](https://yogrid.in) | Udaipur-based P2P platform built on India Energy Stack. Allows solar prosumers to sell surplus to neighbors within DISCOM networks. |
| **Trillectric** | [trillectric.com](https://trillectric.com) | DERMS (Distributed Energy Resource Management) — hardware + data infra for DISCOMs. Not a marketplace but manages renewable assets for grid integration. |
| **BSES Rajdhani (BRPL)** | [bfreathalyzer.com/brpl](https://www.bsesdelhi.com/) | Delhi DISCOM running active P2P trading pilots with authorized TSPs. |
| **Tata Power-DDL** | [tatapower-ddl.com](https://www.tatapower-ddl.com/) | Delhi DISCOM enabling P2P trading via smart meters and authorized platforms. |

### 🌍 Global — P2P Energy Trading Pioneers

| Company / Platform | URL | Notes |
|--------------------|-----|-------|
| **Powerledger** | [powerledger.io](https://www.powerledger.io/) | Australian pioneer (est. 2016). Blockchain (Solana) P2P trading deployed in Australia, India (CESC), Japan, Thailand. Dual-token model (POWR/Sparkz). Won Branson's Extreme Tech Challenge. |
| **LO3 Energy** (Brooklyn Microgrid) | [lo3energy.com](https://lo3energy.com/) | Created the famous **Brooklyn Microgrid** — one of the first real-world blockchain P2P energy projects. "Exergy" platform for microgrid transactions. |
| **WePower** | [wepower.com](https://wepower.com/) | Tokenized renewable energy on Ethereum. Piloted with Estonia's national grid operator (Elering) to tokenize energy data at national scale. |
| **SunContract** | [suncontract.org](https://suncontract.org/) | Slovenia-based P2P energy marketplace using blockchain. Focuses on direct prosumer-to-consumer trading without intermediaries. |
| **Grid+** | [gridplus.io](https://gridplus.io/) | US-based. Uses blockchain for transparent energy markets. Now focused on hardware crypto wallets (Lattice1) but originated in energy trading. |
| **Electron** | [electron.net](https://electron.net/) | UK-based. Builds flexibility trading platforms for grid operators. Focuses on behind-the-meter asset coordination. |

---

### 🆚 How We Differ From Competitors

| Feature | PowerXchange / YoGrid | Powerledger | **Flux-Agent (Ours)** |
|---------|----------------------|-------------|----------------------|
| Architecture | Cloud-based marketplace | Cloud + Solana blockchain | **Fully local edge** (no cloud) |
| Trade Latency | Day-ahead bidding | ~seconds (public chain) | **340ms** (local hash chain) |
| Privacy | Data sent to cloud/DISCOM | Partial (public ledger) | **Full** — no raw data leaves device |
| Grid Safety (OPF) | No physics validation | No | **Yes** — IEEE 33-bus via PyPSA |
| AI Agents | Rule-based matching | Automated matching | **Multi-agent negotiation** (AutoGen) |
| Explainability | No | No | **Yes** — Local LLM (LLaMA 3.1) |
| Satellite Forecasting | No | No | **Yes** — Sentinel-2 SAI |
| Hardware Cost | Smart meter required | Smart meter required | **₹4,338/home** (ESP32 + PZEM) |
| Internet Required | Yes (always) | Yes (always) | **No** (LAN only, periodic satellite sync) |

---

## 📄 Research & References

| Paper / Resource | URL | Notes |
|------------------|-----|-------|
| ESA Copernicus Sentinel-2 | [dataspace.copernicus.eu](https://dataspace.copernicus.eu/) | Free satellite imagery — Solar Availability Index input |
| IEEE 33-bus Test Network | [IEEE Standard Test Feeder](https://cmte.ieee.org/pes-testfeeders/) | Standard radial distribution test system for OPF validation |
| DPDP Act 2023 | [meity.gov.in](https://www.meity.gov.in/writereaddata/files/Digital%20Personal%20Data%20Protection%20Act%202023.pdf) | India's data privacy law — drives our no-cloud design |
| India Energy Stack (IES) | [indiaenergystack.gov.in](https://www.indiasmartgrid.org/) | Digital public infrastructure for P2P energy trading framework |
| India Smart Grid Forum (ISGF) | [indiasmartgrid.org](https://www.indiasmartgrid.org/) | Government body coordinating smart grid & P2P trading pilots |

### 🇮🇳 Indian Policies & Transaction Costs (2024–2026)

| Policy / Metric | Details | Notes |
|-----------------|---------|-------|
| **National Policy** | **Draft National Electricity Policy 2026** | Promotes P2P energy trading and the **India Energy Stack (IES)** as a Digital Public Infrastructure. |
| **State Regulations** | **UPERC (UP), DERC (Delhi), KSERC (Kerala)** | UPERC pioneered guidelines (2023) and an interstate pilot (2026). DERC issued guidelines in 2024 with Time-of-Day (ToD) metering. |
| **Platform Fees** | **~₹0.21 - ₹0.42 per unit (kWh)** | Standard transaction fee for platform providers to match and settle trades, usually shared between buyer and seller. |
| **Wheeling Charges** | **₹0.30 - ₹1.55 per unit** | Standard grid usage fees. **Crucially, these are currently WAIVED in pilot states (like Delhi/UP) to incentivize adoption.** |
| **Cross-Subsidy** | **Currently Nil (Waived)** | Surcharges meant to compensate DISCOMs are typically waived during current pilots until 2026/2027 to ensure economic viability. |

### 🌍 Global Implementation Status

| Country / Region | Status | Key Highlights |
|------------------|--------|----------------|
| **India** | **Leading Innovator** | First "Digital Energy Grid" pilot (Lucknow 2025). Interstate trading enabled via IES. |
| **Australia** | **Mature Market** | Highest rooftop solar penetration globally. P2P integrated into the National Electricity Market (NEM) via AEMO. |
| **Europe** | **Scaling** | Driven by the EU's *Clean Energy for All Europeans* directive. **Germany** leads in volume; Netherlands & Belgium active due to high retail prices. |
| **United States** | **State-level Pilots** | California, New York, and Massachusetts leading with regulatory orders for microgrids and community solar platforms. |
| **East Asia** | **Testing Phase** | South Korea mandated utility P2P platforms by 2027. Japan enabled prosumer sales in 2024. China running municipal blockchain pilots (Shenzhen, Shanghai). |

---

## 🛠️ Tech Stack Links

| Technology | URL | Used For |
|------------|-----|----------|
| Microsoft AutoGen | [github.com/microsoft/autogen](https://github.com/microsoft/autogen) | Multi-agent orchestration (Supply, Demand, Governance agents) |
| FastAPI | [fastapi.tiangolo.com](https://fastapi.tiangolo.com/) | Backend API server + WebSocket real-time communication |
| Next.js 16 | [nextjs.org](https://nextjs.org/) | Frontend framework (App Router) |
| React Flow | [reactflow.dev](https://reactflow.dev/) | Grid topology visualization — interactive node graph |
| PyPSA | [pypsa.org](https://pypsa.org/) | Power system analysis — OPF on IEEE 33-bus network |
| Hardhat | [hardhat.org](https://hardhat.org/) | Local Ethereum blockchain + smart contract deployment |
| Flower (Federated Learning) | [flower.ai](https://flower.ai/) | Federated learning — privacy-preserving demand forecasting |
| Ollama (LLaMA 3.1) | [ollama.ai](https://ollama.ai/) | Local LLM inference for XAI (explainable AI) trade reasoning |
| ESP32-WROOM-32 | [espressif.com](https://www.espressif.com/en/products/socs/esp32) | IoT microcontroller for household prosumer nodes |
| PZEM-004T v3.0 | [innovatorsguru.com](https://innovatorsguru.com/pzem-004t-v3/) | Energy metering sensor (voltage, current, power, frequency) |
| Wokwi Simulator | [wokwi.com](https://wokwi.com/) | Online ESP32 + Arduino hardware simulation platform |
| Razorpay UPI | [razorpay.com](https://razorpay.com/) | UPI payment integration for INR settlement (future) |
| Public APIs (Collection) | [github.com/public-apis/public-apis](https://github.com/public-apis/public-apis) | Curated list of free APIs for future feature integrations (weather, maps, finance, energy) |
| Antigravity IDE (Tutorial) | [YouTube — Antigravity Tutorial](https://youtu.be/mvHGl6zEA3w?si=xeuFuzSdRoV17qx3) | AI-powered coding IDE used for building this project |
| n8n (Tutorial) | [YouTube — n8n Tutorial](https://youtu.be/BWbwwO2JWVE?si=WoigegNbD9jSwWEh) | Workflow automation platform for integrating APIs and services |

---

## 🎓 Learning Resources & Tutorials

> Two curated YouTube tutorials per domain — handpicked for building this startup.

### ⛓️ Blockchain / Hardhat / Solidity

| Tutorial | URL | Notes |
|----------|-----|-------|
| Dapp University — Full Blockchain Course | [YouTube](https://www.youtube.com/watch?v=EhPeHeoKF88) | End-to-end dApp with Solidity, Hardhat, React — project-based learning |
| Cyfrin Updraft — Smart Contract Security | [YouTube](https://www.youtube.com/watch?v=pUWmJ86X_do) | Gold standard for Solidity + security patterns, covers testing & deployment |

### 🤖 AI Agents / Microsoft AutoGen

| Tutorial | URL | Notes |
|----------|-----|-------|
| AutoGen Crash Course — Multi-Agent Teams | [YouTube](https://www.youtube.com/watch?v=PUPO2tTyPOo) | Full lifecycle: installation, multi-agent teams, human-in-the-loop, capstone project |
| Build Multi-Agent Systems with AutoGen | [YouTube](https://www.youtube.com/watch?v=iAB3FElMxVk) | Practical guide to orchestration patterns, agent tools, and memory |

### 🧠 Claude AI / Agentic Coding

| Tutorial | URL | Notes |
|----------|-----|-------|
| Claude Code Full Course for Beginners (freeCodeCamp) | [YouTube](https://www.youtube.com/watch?v=N0ckP_rqQoY) | Comprehensive: setup, multi-file projects, autonomous tasks, SOLID principles |
| Claude Code Tutorial — Beginner to Pro 2026 | [YouTube](https://www.youtube.com/watch?v=BmvLexamVEo) | Plan Mode, building AI agents, deploying websites, advanced workflows |

### 🔄 n8n / Workflow Automation

| Tutorial | URL | Notes |
|----------|-----|-------|
| n8n Crash Course (already added above) | [YouTube](https://youtu.be/BWbwwO2JWVE?si=WoigegNbD9jSwWEh) | Complete n8n walkthrough for automating workflows |
| n8n AI Agent Workflows | [YouTube](https://www.youtube.com/watch?v=dOCwJQ-a1Qs) | Building AI-powered automation chains with n8n + LLMs |

### 🚀 Antigravity IDE

| Tutorial | URL | Notes |
|----------|-----|-------|
| Antigravity IDE Tutorial (already added above) | [YouTube](https://youtu.be/mvHGl6zEA3w?si=xeuFuzSdRoV17qx3) | Getting started with Antigravity AI coding assistant |
| Google Antigravity — Agentic Coding Deep Dive | [YouTube](https://www.youtube.com/watch?v=kGcHLaCJZfU) | Advanced workflows, skills, and multi-agent coding |

### ⚡ FastAPI / Backend

| Tutorial | URL | Notes |
|----------|-----|-------|
| FastAPI Full Course for Beginners | [YouTube](https://www.youtube.com/watch?v=tLKKmouUams) | Complete: routing, Pydantic, SQLAlchemy, JWT auth, Docker deployment |
| FastAPI Crash Course by Traversy Media | [YouTube](https://www.youtube.com/watch?v=cbASjoZZGIw) | Fast-paced overview: APIs, middleware, schemas, deploy to Render |

### 🌐 Next.js / Frontend

| Tutorial | URL | Notes |
|----------|-----|-------|
| Next.js 15 Full Course — ByteGrad | [YouTube](https://www.youtube.com/watch?v=JmYj0z-p0jU) | Modern App Router, Server Components, PPR, Server Actions |
| Next.js 15 Crash Course — Codevolution | [YouTube](https://www.youtube.com/watch?v=kYv9l5y4-Gk) | Structured breakdown of routing, data fetching, and SSR patterns |

### 📡 ESP32 / IoT / Hardware

| Tutorial | URL | Notes |
|----------|-----|-------|
| ESP32 & MQTT Complete Beginner's Guide | [YouTube](https://www.youtube.com/watch?v=x5A5S0hoyJ0) | MQTT fundamentals, PubSubClient library, JSON payloads, debugging |
| ESP32 IoT Smart Monitor with MQTT & Node-RED | [YouTube](https://www.youtube.com/watch?v=JlqEbmFpigw) | Full project: sensor → MQTT → dashboard visualization |

### 🔒 Federated Learning / Flower

| Tutorial | URL | Notes |
|----------|-----|-------|
| Federated AI Simulations with Flower (8-part series) | [YouTube](https://www.youtube.com/watch?v=cRebUIGB5RY) | Step-by-step FL pipeline: simulations, custom strategies, PyTorch |
| Introduction to Federated Learning & Privacy-Preserving ML | [YouTube](https://www.youtube.com/watch?v=i8pPtKfcAys) | Workshop: FL basics, Flower ecosystem, hands-on implementation |

### ⚡ P2P Energy Trading / Microgrids

| Tutorial | URL | Notes |
|----------|-----|-------|
| Blockchain for P2P Energy Trading — Explained | [YouTube](https://www.youtube.com/watch?v=jMgizgVk4gw) | Architecture overview: prosumers, smart contracts, market clearing |
| Powerledger — How P2P Energy Trading Works | [YouTube](https://www.youtube.com/watch?v=PVPMCwihpMw) | Real-world P2P trading demo from the industry leader |

---

> 📌 **Last updated:** July 2026 | **Maintained by:** Abhiraj Bambhore
