<div align="center">

<img src="assets/banner.png" alt="MC Status Bot - Minecraft Discord Server Status Bot" width="100%">

# MC Status Bot

### 🎮 Minecraft Server Status • Discord Bot • Java & Bedrock

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Minecraft](https://img.shields.io/badge/Minecraft-Java%20%26%20Bedrock-62B47A?style=for-the-badge&logo=minecraft&logoColor=white)](https://www.minecraft.net/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/YOUR-USERNAME/mc-status-bot?style=for-the-badge&logo=github)](https://github.com/YOUR-USERNAME/mc-status-bot/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/YOUR-USERNAME/mc-status-bot?style=for-the-badge&logo=github)](https://github.com/YOUR-USERNAME/mc-status-bot/issues)

**Monitor your Minecraft servers directly inside Discord with a clean, auto-updating status panel.**

</div>

---

## ✨ Features

- 🟢 **Live server status** — Online / Offline detection
- 👥 **Player count** — Current and maximum players
- 📶 **Ping monitoring** — Server latency
- 🎮 **Java Edition support**
- 🧱 **Bedrock Edition support**
- 🧩 **Minecraft version & MOTD**
- 🖼️ **Custom PNG status banner**
- 👤 **Player avatars** when server data provides player samples
- 🔄 **Auto-refreshing Discord panel**
- ⚡ **Slash commands** — `/status` and `/setup-status`
- 🔐 **`.env` configuration** for safer deployment
- ☁️ **Hosting-friendly** for VPS, Render, Railway, Pterodactyl and similar Node.js hosts

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime |
| **Discord.js v14** | Discord bot framework |
| **minecraft-server-util** | Minecraft server status queries |
| **@napi-rs/canvas** | Status banner rendering |
| **dotenv** | Environment configuration |

## 🚀 Quick Start

```bash
git clone https://github.com/YOUR-USERNAME/mc-status-bot.git
cd mc-status-bot
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure your Discord bot and Minecraft server in `.env`, then:

```bash
npm run register
npm start
```

## 🤖 Commands

| Command | Description |
|---|---|
| `/status` | Refresh/check the Minecraft server status |
| `/setup-status` | Create the Discord status panel |

## 🔎 SEO Keywords

`minecraft discord bot` · `minecraft server status bot` · `discord minecraft bot` · `minecraft server monitor` · `minecraft server monitoring` · `minecraft java status` · `minecraft bedrock status` · `discord server status` · `node.js discord bot` · `discord.js minecraft bot` · `minecraft player count` · `minecraft ping bot`

## 🔐 Security

**Never commit your real `.env` file or Discord bot token.**

Use `.env.example` as the public template. If a bot token is ever exposed, reset it immediately in the Discord Developer Portal.

## 📄 License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for the full license text.

<div align="center">

**⭐ Star this repository if it helps your Minecraft community!**

**Build • Monitor • Stay Connected**

</div>
