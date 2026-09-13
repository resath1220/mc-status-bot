const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const { truncateCanvasText, formatTime } = require('../utils/format');
const { resolveServerIcon } = require('../services/minecraft/favicon');

try {
  GlobalFonts.registerFromPath(
    path.join(__dirname, '..', '..', 'assets', 'fonts', 'Inter-Bold.ttf'),
    'Inter Bold'
  );
  GlobalFonts.registerFromPath(
    path.join(__dirname, '..', '..', 'assets', 'fonts', 'Inter-Regular.ttf'),
    'Inter Regular'
  );
} catch (_) {
  /* fonts optional — falls back to system sans-serif */
}

const FONT_BOLD = GlobalFonts.has?.('Inter Bold') ? 'Inter Bold' : 'sans-serif';
const FONT_REG = GlobalFonts.has?.('Inter Regular') ? 'Inter Regular' : 'sans-serif';

const W = 1100;
const H = 680;

// Cyberpunk / HUD glass palette
const PALETTE = {
  bgTop: '#05070d',
  bgBottom: '#0c1120',
  card: 'rgba(120,170,255,0.055)',
  cardBorder: 'rgba(120,170,255,0.16)',
  online: '#39ff9e',
  offline: '#ff3b6b',
  cyan: '#4ee8ff',
  magenta: '#c86bff',
  gold: '#ffcf5c',
  textMain: '#eef3ff',
  textSub: '#93a3c2',
  textFaint: '#57628a',
  gridLine: 'rgba(120,170,255,0.05)',
};

function roundRect(ctx, x, y, w, h, r) {
  const radius = typeof r === 'number' ? { tl: r, tr: r, br: r, bl: r } : r;
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + w - radius.tr, y);
  ctx.arcTo(x + w, y, x + w, y + radius.tr, radius.tr);
  ctx.lineTo(x + w, y + h - radius.br);
  ctx.arcTo(x + w, y + h, x + w - radius.br, y + h, radius.br);
  ctx.lineTo(x + radius.bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius.bl, radius.bl);
  ctx.lineTo(x + radius.tl, y);
  ctx.arcTo(x, y, x + radius.tl, y, radius.tl);
  ctx.closePath();
}

function glassCard(ctx, x, y, w, h, r = 16, accentGlow = null) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = PALETTE.card;
  ctx.fill();
  if (accentGlow) {
    ctx.save();
    ctx.shadowColor = accentGlow;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = accentGlow;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.restore();
  }
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = PALETTE.cardBorder;
  ctx.stroke();
}

function pingColor(ms) {
  if (ms === null || ms === undefined) return PALETTE.textFaint;
  if (ms < 60) return PALETTE.online;
  if (ms < 150) return PALETTE.gold;
  return PALETTE.offline;
}

/**
 * Renders the full premium status banner and returns a PNG Buffer.
 * @param {object} status - normalized status from mcstatus.js (getServerStatus)
 * @param {object} serverRecord - the DB row for this monitored server (name, host, port, edition, icon_url, update_interval_ms)
 */
async function renderBanner(status, serverRecord) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const online = status.online;
  const accent = online ? PALETTE.online : PALETTE.offline;
  const serverName = serverRecord.name || 'MINECRAFT SERVER';
  const address = `${serverRecord.host}:${serverRecord.port}`;
  const edition = status.edition || serverRecord.edition;
  const maxChips = serverRecord.maxPlayerChips || 10;

  // ── Background ────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, PALETTE.bgTop);
  bg.addColorStop(1, PALETTE.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W - 100, 60, 20, W - 100, 60, 460);
  glow.addColorStop(0, online ? 'rgba(57,255,158,0.14)' : 'rgba(255,59,107,0.13)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(70, H - 40, 10, 70, H - 40, 420);
  glow2.addColorStop(0, 'rgba(78,232,255,0.08)');
  glow2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  roundRect(ctx, 0, 0, W, H, 26);
  ctx.save();
  ctx.clip();

  // HUD scanline grid
  ctx.strokeStyle = PALETTE.gridLine;
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 34) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }

  // ── Header: icon + title ─────────────────────────────────
  const iconX = 44, iconY = 40, iconSize = 72;
  const iconImg = await resolveServerIcon(status, serverRecord.icon_url);

  roundRect(ctx, iconX, iconY, iconSize, iconSize, 14);
  ctx.save();
  ctx.clip();
  if (iconImg) {
    ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);
  } else {
    ctx.fillStyle = '#111830';
    ctx.fillRect(iconX, iconY, iconSize, iconSize);
    ctx.fillStyle = PALETTE.cyan;
    ctx.font = `bold 30px ${FONT_BOLD}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⛏', iconX + iconSize / 2, iconY + iconSize / 2 + 2);
  }
  ctx.restore();
  roundRect(ctx, iconX, iconY, iconSize, iconSize, 14);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(120,170,255,0.25)';
  ctx.stroke();

  const titleX = iconX + iconSize + 22;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PALETTE.textMain;
  ctx.font = `bold 32px ${FONT_BOLD}`;
  ctx.fillText(truncateCanvasText(ctx, serverName.toUpperCase(), 430), titleX, iconY + 32);

  ctx.font = `14px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.cyan;
  const editionLabel = edition === 'bedrock' ? '🧱 BEDROCK EDITION' : edition === 'java' ? '🟩 JAVA EDITION' : '🎮 UNKNOWN EDITION';
  ctx.fillText(editionLabel, titleX, iconY + 54);

  // Status pill (top right)
  const pillLabel = online ? 'ONLINE' : 'OFFLINE';
  ctx.font = `bold 16px ${FONT_BOLD}`;
  const pillTextW = ctx.measureText(pillLabel).width;
  const pillW = pillTextW + 56;
  const pillH = 40;
  const pillX = W - 44 - pillW;
  const pillY = 44;

  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = online ? 'rgba(57,255,158,0.10)' : 'rgba(255,59,107,0.10)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = online ? 'rgba(57,255,158,0.45)' : 'rgba(255,59,107,0.45)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(pillX + 22, pillY + pillH / 2, 6, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = accent;
  ctx.textBaseline = 'middle';
  ctx.fillText(pillLabel, pillX + 40, pillY + pillH / 2 + 1);
  ctx.textBaseline = 'alphabetic';

  // MOTD
  const motdY = 138;
  ctx.font = `italic 15px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textFaint;
  const motdText = status.motd
    ? `"${truncateCanvasText(ctx, status.motd.replace(/\s+/g, ' ').trim(), W - 88)}"`
    : online
    ? '"A premium Minecraft experience."'
    : '"Server is currently unreachable."';
  ctx.fillText(motdText, 44, motdY);

  ctx.strokeStyle = 'rgba(120,170,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(44, 162);
  ctx.lineTo(W - 44, 162);
  ctx.stroke();

  // ── Stat cards row ───────────────────────────────────────
  const cardsY = 186;
  const cardsH = 96;
  const gap = 20;
  const cardW = (W - 88 - gap * 2) / 3;

  const players = online ? status.players || { online: 0, max: 0 } : { online: 0, max: 0 };
  const pct = online && players.max ? Math.min(1, players.online / players.max) : 0;

  // Card 1: Players
  glassCard(ctx, 44, cardsY, cardW, cardsH, 16);
  ctx.font = `12px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textSub;
  ctx.fillText('PLAYERS ONLINE', 44 + 22, cardsY + 28);
  ctx.font = `bold 30px ${FONT_BOLD}`;
  ctx.fillStyle = online ? PALETTE.textMain : PALETTE.textFaint;
  const playersLabel = online ? `${players.online}` : '—';
  ctx.fillText(playersLabel, 44 + 22, cardsY + 62);
  ctx.font = `15px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textFaint;
  ctx.fillText(
    online ? ` / ${players.max}` : '',
    44 + 22 + ctx.measureText(playersLabel).width + 6,
    cardsY + 62
  );
  const barX = 44 + 22, barY = cardsY + 74, barW = cardW - 44, barH = 7;
  roundRect(ctx, barX, barY, barW, barH, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fill();
  if (online) {
    roundRect(ctx, barX, barY, Math.max(6, barW * pct), barH, 4);
    const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    barGrad.addColorStop(0, PALETTE.cyan);
    barGrad.addColorStop(1, accent);
    ctx.fillStyle = barGrad;
    ctx.fill();
  }

  // Card 2: Ping
  const card2X = 44 + cardW + gap;
  glassCard(ctx, card2X, cardsY, cardW, cardsH, 16);
  ctx.font = `12px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textSub;
  ctx.fillText('LATENCY', card2X + 22, cardsY + 28);
  ctx.font = `bold 30px ${FONT_BOLD}`;
  ctx.fillStyle = online ? pingColor(status.ping) : PALETTE.textFaint;
  const pingLabel = online && status.ping !== null ? `${status.ping}` : '—';
  ctx.fillText(pingLabel, card2X + 22, cardsY + 62);
  ctx.font = `14px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textFaint;
  const pingNumW = ctx.measureText(pingLabel).width;
  ctx.fillText(online && status.ping !== null ? ' ms' : '', card2X + 22 + pingNumW + 2, cardsY + 62);
  ctx.font = `12px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textFaint;
  const quality = !online ? 'Unavailable' : status.ping === null ? 'Unknown' : status.ping < 60 ? 'Excellent' : status.ping < 150 ? 'Stable' : 'High';
  ctx.fillText(quality, card2X + 22, cardsY + 82);

  // Card 3: Version
  const card3X = card2X + cardW + gap;
  glassCard(ctx, card3X, cardsY, cardW, cardsH, 16);
  ctx.font = `12px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textSub;
  ctx.fillText('VERSION', card3X + 22, cardsY + 28);
  ctx.font = `bold 22px ${FONT_BOLD}`;
  ctx.fillStyle = online ? PALETTE.textMain : PALETTE.textFaint;
  ctx.fillText(truncateCanvasText(ctx, online ? status.version || 'Unknown' : '—', cardW - 44), card3X + 22, cardsY + 58);
  ctx.font = `12px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textFaint;
  ctx.fillText(edition === 'bedrock' ? 'Bedrock protocol' : edition === 'java' ? 'Java protocol' : 'Protocol unknown', card3X + 22, cardsY + 82);

  // ── Address row ───────────────────────────────────────────
  const ipY = cardsY + cardsH + 24;
  const ipH = 58;
  glassCard(ctx, 44, ipY, W - 88, ipH, 14);
  ctx.font = `11px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textSub;
  ctx.fillText('SERVER ADDRESS', 44 + 20, ipY + 21);
  ctx.font = `bold 18px ${FONT_BOLD}`;
  ctx.fillStyle = PALETTE.textMain;
  ctx.fillText(truncateCanvasText(ctx, address, W - 168), 44 + 20, ipY + 43);

  // ── Online players grid ──────────────────────────────────
  const gridLabelY = ipY + ipH + 36;
  ctx.font = `12px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textSub;

  const sample = online ? (players.sample || []).slice(0, maxChips) : [];
  const extra = online ? Math.max(0, (players.online || 0) - sample.length) : 0;

  let gridLabel;
  if (!online) {
    gridLabel = 'ONLINE PLAYERS';
  } else if (sample.length > 0) {
    gridLabel = `ONLINE PLAYERS — showing sample of ${sample.length} of ${players.online}`;
  } else {
    gridLabel = 'ONLINE PLAYERS';
  }
  ctx.fillText(gridLabel, 44, gridLabelY);

  const chipY0 = gridLabelY + 18;
  const chipH = 46;
  const chipGap = 12;
  const perRow = 5;
  const chipW = (W - 88 - chipGap * (perRow - 1)) / perRow;

  if (!online) {
    glassCard(ctx, 44, chipY0, W - 88, 46, 14);
    ctx.font = `13px ${FONT_REG}`;
    ctx.fillStyle = PALETTE.textFaint;
    ctx.textAlign = 'center';
    ctx.fillText('Server offline — player data unavailable.', W / 2, chipY0 + 28);
    ctx.textAlign = 'left';
  } else if (sample.length === 0) {
    glassCard(ctx, 44, chipY0, W - 88, 46, 14);
    ctx.font = `13px ${FONT_REG}`;
    ctx.fillStyle = PALETTE.textFaint;
    ctx.textAlign = 'center';
    ctx.fillText(
      players.online > 0
        ? `Player list unavailable — ${players.online} player(s) online.`
        : 'No players online right now.',
      W / 2,
      chipY0 + 28
    );
    ctx.textAlign = 'left';
  } else {
    const { loadImage } = require('@napi-rs/canvas');
    const avatars = await Promise.all(
      sample.map((name) =>
        loadImage(`https://mc-heads.net/avatar/${encodeURIComponent(name)}/48`).catch(() => null)
      )
    );

    const totalChips = sample.length + (extra > 0 ? 1 : 0);
    for (let i = 0; i < totalChips; i++) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const x = 44 + col * (chipW + chipGap);
      const y = chipY0 + row * (chipH + chipGap);
      const isExtraChip = extra > 0 && i === totalChips - 1;

      glassCard(ctx, x, y, chipW, chipH, 12);

      if (isExtraChip) {
        ctx.font = `600 14px ${FONT_REG}`;
        ctx.fillStyle = PALETTE.cyan;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${extra} more`, x + chipW / 2, y + chipH / 2 + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        continue;
      }

      const avSize = 30;
      const avX = x + 8, avY = y + (chipH - avSize) / 2;
      roundRect(ctx, avX, avY, avSize, avSize, 7);
      ctx.save();
      ctx.clip();
      if (avatars[i]) {
        ctx.drawImage(avatars[i], avX, avY, avSize, avSize);
      } else {
        ctx.fillStyle = '#151d34';
        ctx.fillRect(avX, avY, avSize, avSize);
      }
      ctx.restore();

      ctx.beginPath();
      ctx.arc(avX + avSize - 3, avY + avSize - 3, 4, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.online;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = PALETTE.bgBottom;
      ctx.stroke();

      ctx.font = `600 14px ${FONT_REG}`;
      ctx.fillStyle = PALETTE.textMain;
      const nameMaxW = chipW - avSize - 26;
      ctx.fillText(truncateCanvasText(ctx, sample[i], nameMaxW), avX + avSize + 10, y + chipH / 2 + 5);
    }
  }

  // ── Footer ───────────────────────────────────────────────
  const footerY = H - 34;
  ctx.strokeStyle = 'rgba(120,170,255,0.12)';
  ctx.beginPath();
  ctx.moveTo(44, footerY - 22);
  ctx.lineTo(W - 44, footerY - 22);
  ctx.stroke();

  ctx.font = `11px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textFaint;
  const intervalS = Math.round((serverRecord.update_interval_ms || 30000) / 1000);
  ctx.fillText(`Auto-updating every ${intervalS}s  •  Last check ${formatTime(status.checkedAt)}`, 44, footerY);

  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.magenta;
  ctx.fillText(serverName.toUpperCase(), W - 44, footerY);
  ctx.textAlign = 'left';

  ctx.restore(); // clip
  roundRect(ctx, 0, 0, W, H, 26);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(120,170,255,0.14)';
  ctx.stroke();

  return canvas.encode('png');
}

module.exports = { renderBanner };
