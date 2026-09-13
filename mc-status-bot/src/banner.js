const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const config = require('./config');

// ── Optional: bundle a clean sans font so rendering is identical everywhere.
// Falls back to system sans-serif if the font file isn't present.
try {
  GlobalFonts.registerFromPath(
    path.join(__dirname, '..', 'assets', 'fonts', 'Inter-Bold.ttf'),
    'Inter Bold'
  );
  GlobalFonts.registerFromPath(
    path.join(__dirname, '..', 'assets', 'fonts', 'Inter-Regular.ttf'),
    'Inter Regular'
  );
} catch (_) {
  /* fonts optional — canvas will fall back to a default sans-serif */
}

const FONT_BOLD = GlobalFonts.has?.('Inter Bold') ? 'Inter Bold' : 'sans-serif';
const FONT_REG = GlobalFonts.has?.('Inter Regular') ? 'Inter Regular' : 'sans-serif';

const W = 1100;
const H = 640;

const PALETTE = {
  bgTop: '#0b0e14',
  bgBottom: '#12161f',
  card: 'rgba(255,255,255,0.045)',
  cardBorder: 'rgba(255,255,255,0.08)',
  online: '#3ddc84',
  offline: '#ff5c72',
  gold: '#f5c257',
  textMain: '#f2f4f8',
  textSub: '#9aa3b2',
  textFaint: '#5c6577',
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
  ctx.lineTo(x, y + radius.tl);
  ctx.arcTo(x, y, x + radius.tl, y, radius.tl);
  ctx.closePath();
}

function glassCard(ctx, x, y, w, h, r = 18) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = PALETTE.card;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = PALETTE.cardBorder;
  ctx.stroke();
}

function pingColor(ms) {
  if (ms === null || ms === undefined) return PALETTE.textFaint;
  if (ms < 60) return PALETTE.online;
  if (ms < 150) return PALETTE.gold;
  return PALETTE.offline;
}

function truncate(ctx, text, maxWidth) {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(out + '…').width > maxWidth) {
    out = out.slice(0, -1);
  }
  return out + '…';
}

async function safeLoadImage(url) {
  try {
    if (!url) return null;
    return await loadImage(url);
  } catch {
    return null;
  }
}

/**
 * Renders the full premium status banner and returns a PNG Buffer.
 * @param {object} status - normalized combined status from mcstatus.js
 */
async function renderBanner(status) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const online = status.online;
  const accent = online ? PALETTE.online : PALETTE.offline;

  // ── Background ────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, PALETTE.bgTop);
  bg.addColorStop(1, PALETTE.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Ambient glow, colored by status
  const glow = ctx.createRadialGradient(W - 120, 60, 20, W - 120, 60, 420);
  glow.addColorStop(0, online ? 'rgba(61,220,132,0.16)' : 'rgba(255,92,114,0.14)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(80, H - 40, 10, 80, H - 40, 380);
  glow2.addColorStop(0, 'rgba(245,194,87,0.08)');
  glow2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Outer frame
  roundRect(ctx, 0, 0, W, H, 28);
  ctx.save();
  ctx.clip();

  // Subtle dot-grid texture
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let gx = 20; gx < W; gx += 28) {
    for (let gy = 20; gy < H; gy += 28) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Header: icon + title ─────────────────────────────────
  const iconX = 44, iconY = 40, iconSize = 72;
  const iconImg = await safeLoadImage(
    config.serverIconUrl || (status.favicon ? status.favicon : null)
  );

  roundRect(ctx, iconX, iconY, iconSize, iconSize, 16);
  ctx.save();
  ctx.clip();
  if (iconImg) {
    ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);
  } else {
    ctx.fillStyle = '#1b2029';
    ctx.fillRect(iconX, iconY, iconSize, iconSize);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 30px ${FONT_BOLD}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⛏', iconX + iconSize / 2, iconY + iconSize / 2 + 2);
  }
  ctx.restore();
  roundRect(ctx, iconX, iconY, iconSize, iconSize, 16);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.stroke();

  const titleX = iconX + iconSize + 22;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PALETTE.textMain;
  ctx.font = `bold 34px ${FONT_BOLD}`;
  ctx.fillText(config.serverName, titleX, iconY + 34);

  ctx.font = `16px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textSub;
  ctx.fillText(config.serverSubtitle.toUpperCase(), titleX, iconY + 58);

  // Status pill (top right)
  const pillLabel = online ? 'ONLINE' : 'OFFLINE';
  ctx.font = `bold 16px ${FONT_BOLD}`;
  const pillTextW = ctx.measureText(pillLabel).width;
  const pillW = pillTextW + 56;
  const pillH = 40;
  const pillX = W - 44 - pillW;
  const pillY = 44;

  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = online ? 'rgba(61,220,132,0.12)' : 'rgba(255,92,114,0.12)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = online ? 'rgba(61,220,132,0.4)' : 'rgba(255,92,114,0.4)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(pillX + 22, pillY + pillH / 2, 6, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = accent;
  ctx.textBaseline = 'middle';
  ctx.fillText(pillLabel, pillX + 40, pillY + pillH / 2 + 1);
  ctx.textBaseline = 'alphabetic';

  // MOTD
  const motdY = 138;
  ctx.font = `italic 16px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textFaint;
  const motdText = status.motd
    ? `"${truncate(ctx, status.motd.replace(/\s+/g, ' ').trim(), W - 88)}"`
    : online
    ? '"A premium Minecraft experience."'
    : '"Server is currently unreachable."';
  ctx.fillText(motdText, 44, motdY);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
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

  const players = status.players || { online: 0, max: 0 };
  const pct = players.max ? Math.min(1, players.online / players.max) : 0;

  // Card 1: Players
  glassCard(ctx, 44, cardsY, cardW, cardsH, 18);
  ctx.font = `13px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textSub;
  ctx.fillText('PLAYERS ONLINE', 44 + 22, cardsY + 28);
  ctx.font = `bold 30px ${FONT_BOLD}`;
  ctx.fillStyle = PALETTE.textMain;
  ctx.fillText(`${players.online}`, 44 + 22, cardsY + 62);
  ctx.font = `16px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textFaint;
  ctx.fillText(` / ${players.max}`, 44 + 22 + ctx.measureText(`${players.online}`).width + 30, cardsY + 62);
  // mini bar
  const barX = 44 + 22, barY = cardsY + 74, barW = cardW - 44, barH = 8;
  roundRect(ctx, barX, barY, barW, barH, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  roundRect(ctx, barX, barY, Math.max(6, barW * pct), barH, 4);
  const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  barGrad.addColorStop(0, PALETTE.gold);
  barGrad.addColorStop(1, accent);
  ctx.fillStyle = barGrad;
  ctx.fill();

  // Card 2: Ping
  const card2X = 44 + cardW + gap;
  glassCard(ctx, card2X, cardsY, cardW, cardsH, 18);
  ctx.font = `13px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textSub;
  ctx.fillText('LATENCY', card2X + 22, cardsY + 28);
  ctx.font = `bold 30px ${FONT_BOLD}`;
  ctx.fillStyle = pingColor(status.ping);
  ctx.fillText(status.ping !== null ? `${status.ping}` : '—', card2X + 22, cardsY + 62);
  ctx.font = `15px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textFaint;
  const pingNumW = ctx.measureText(status.ping !== null ? `${status.ping}` : '—').width;
  ctx.fillText(status.ping !== null ? ' ms' : '', card2X + 22 + pingNumW + 2, cardsY + 62);
  ctx.font = `13px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textFaint;
  const quality = status.ping === null ? 'Unavailable' : status.ping < 60 ? 'Excellent' : status.ping < 150 ? 'Stable' : 'High';
  ctx.fillText(quality, card2X + 22, cardsY + 82);

  // Card 3: Version
  const card3X = card2X + cardW + gap;
  glassCard(ctx, card3X, cardsY, cardW, cardsH, 18);
  ctx.font = `13px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textSub;
  ctx.fillText('VERSION', card3X + 22, cardsY + 28);
  ctx.font = `bold 24px ${FONT_BOLD}`;
  ctx.fillStyle = PALETTE.textMain;
  ctx.fillText(truncate(ctx, status.version || 'Unknown', cardW - 44), card3X + 22, cardsY + 60);
  ctx.font = `13px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textFaint;
  ctx.fillText('Java & Bedrock', card3X + 22, cardsY + 82);

  // ── IP row ────────────────────────────────────────────────
  const ipY = cardsY + cardsH + 24;
  const ipH = 62;
  const ipW = (W - 88 - gap) / 2;

  glassCard(ctx, 44, ipY, ipW, ipH, 16);
  ctx.font = `12px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textSub;
  ctx.fillText('🟩  JAVA EDITION', 44 + 20, ipY + 22);
  ctx.font = `bold 18px ${FONT_BOLD}`;
  ctx.fillStyle = PALETTE.textMain;
  ctx.fillText(truncate(ctx, `${config.javaHost}`, ipW - 40), 44 + 20, ipY + 46);

  const ipX2 = 44 + ipW + gap;
  glassCard(ctx, ipX2, ipY, ipW, ipH, 16);
  ctx.font = `12px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textSub;
  ctx.fillText('🟦  BEDROCK EDITION', ipX2 + 20, ipY + 22);
  ctx.font = `bold 18px ${FONT_BOLD}`;
  ctx.fillStyle = PALETTE.textMain;
  ctx.fillText(
    truncate(ctx, `${config.bedrockHost}  :  ${config.bedrockPort}`, ipW - 40),
    ipX2 + 20,
    ipY + 46
  );

  // ── Online players grid ──────────────────────────────────
  const gridLabelY = ipY + ipH + 38;
  ctx.font = `13px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textSub;
  const sample = (players.sample || []).slice(0, config.maxPlayerChips);
  ctx.fillText(
    `ONLINE NOW${sample.length ? ` — showing ${sample.length} of ${players.online}` : ''}`,
    44,
    gridLabelY
  );

  const chipY0 = gridLabelY + 18;
  const chipH = 46;
  const chipGap = 12;
  const perRow = 5;
  const chipW = (W - 88 - chipGap * (perRow - 1)) / perRow;

  if (sample.length === 0) {
    glassCard(ctx, 44, chipY0, W - 88, 46, 14);
    ctx.font = `14px ${FONT_REG}`;
    ctx.fillStyle = PALETTE.textFaint;
    ctx.textAlign = 'center';
    ctx.fillText(
      online ? 'Player list is private on this server.' : 'No players — server offline.',
      W / 2,
      chipY0 + 28
    );
    ctx.textAlign = 'left';
  } else {
    // preload avatars in parallel
    const avatars = await Promise.all(
      sample.map((name) => safeLoadImage(`https://mc-heads.net/avatar/${encodeURIComponent(name)}/48`))
    );

    for (let i = 0; i < sample.length; i++) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const x = 44 + col * (chipW + chipGap);
      const y = chipY0 + row * (chipH + chipGap);

      glassCard(ctx, x, y, chipW, chipH, 12);

      const avSize = 30;
      const avX = x + 8, avY = y + (chipH - avSize) / 2;
      roundRect(ctx, avX, avY, avSize, avSize, 7);
      ctx.save();
      ctx.clip();
      if (avatars[i]) {
        ctx.drawImage(avatars[i], avX, avY, avSize, avSize);
      } else {
        ctx.fillStyle = '#232838';
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
      ctx.fillText(truncate(ctx, sample[i], nameMaxW), avX + avSize + 10, y + chipH / 2 + 5);
    }
  }

  // ── Footer ───────────────────────────────────────────────
  const footerY = H - 34;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(44, footerY - 22);
  ctx.lineTo(W - 44, footerY - 22);
  ctx.stroke();

  ctx.font = `12px ${FONT_REG}`;
  ctx.fillStyle = PALETTE.textFaint;
  const time = status.checkedAt.toLocaleTimeString('en-US', { hour12: true });
  ctx.fillText(`Auto-updating every 30s  •  Last check ${time}`, 44, footerY);

  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.textFaint;
  ctx.fillText(config.serverName, W - 44, footerY);
  ctx.textAlign = 'left';

  ctx.restore(); // clip
  roundRect(ctx, 0, 0, W, H, 28);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.stroke();

  return canvas.encode('png');
}

module.exports = { renderBanner };
