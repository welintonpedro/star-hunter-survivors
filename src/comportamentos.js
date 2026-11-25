// ============ COMPORTAMENTOS DOS INIMIGOS (RN-09, RN-11) ============
// Cada comportamento recebe (cena, inimigo, dt, k) e devolve a velocidade desejada {vx, vy},
// ou null para "perseguir a nave" (o padrão). k = { dx, dy, d } até a nave.
// O estado de cada inimigo fica em e.est (zerado quando ele nasce).
// Os números de vida/velocidade/dano ficam em src/dados/inimigos.js.

// ---- ajudas de movimento ----
function irAte(e, k, mult) { const m = (mult || 1) * e.speedV / k.d; return { vx: k.dx * m, vy: k.dy * m }; }
function fugir(e, k, mult) { const v = irAte(e, k, mult); return { vx: -v.vx, vy: -v.vy }; }
function orbitar(e, k, raio, mult, lado) {
  const s = lado || 1, m = (mult || 1) * e.speedV / k.d;
  const radial = (k.d - raio) / raio;   // positivo: longe demais, chega mais perto
  return { vx: (-k.dy * s + k.dx * radial) * m, vy: (k.dx * s + k.dy * radial) * m };
}
// Mantém uma distância entre min e max da nave, andando de lado quando está na faixa
function manterDistancia(e, k, min, max) {
  if (k.d > max) return irAte(e, k);
  if (k.d < min) return fugir(e, k);
  return orbitar(e, k, (min + max) / 2, 0.5, e.est.lado);
}
function temporizador(e, nome, dt, intervalo) {
  if (e.est[nome] === undefined) e.est[nome] = intervalo * (0.4 + Math.random() * 0.6);
  e.est[nome] -= dt;
  if (e.est[nome] <= 0) { e.est[nome] = intervalo; return true; }
  return false;
}

const COMPORTAMENTOS = {
  // ===== Galáxia 1 — Nebulosa Esmeralda =====
  perseguidor: () => null,
  rapido: () => null,
  tanque: () => null,

  // Atirador: fica a ~300 px e cospe um tiro a cada 2,2 s
  atirador(c, e, dt, k) {
    if (temporizador(e, 'tiro', dt, 2.2) && k.d < 560) c.tiroInimigo(e, Math.atan2(k.dy, k.dx), 230, 1);
    return manterDistancia(e, k, 260, 360);
  },

  // Kamikaze: perto da nave acelera piscando e explode
  kamikaze(c, e, dt, k) {
    if (k.d < 230) {
      e.est.piscar = (e.est.piscar || 0) + dt;
      if (Math.floor(e.est.piscar * 10) % 2 === 0) e.setTint(0xffffff); else e.clearTint();
      if (k.d < e.hitR + 22) { c.explosaoInimiga(e.x, e.y, 85, e.damage); e.semRecompensa = true; c.killEnemy(e); return { vx: 0, vy: 0 }; }
      return irAte(e, k, 2.3);
    }
    return null;
  },

  divisor: () => null, // ao morrer vira 2 Esporinhos (aoMorrer)

  // Enxame: nasce em grupo e voa tremendo
  enxame(c, e, dt, k) {
    const v = irAte(e, k), w = Math.sin(c.elapsed * 9 + e.est.semente) * 0.7 * e.speedV / k.d;
    return { vx: v.vx - k.dy * w, vy: v.vy + k.dx * w };
  },

  // Orbitador: circula a nave e mergulha de tempos em tempos
  orbitador(c, e, dt, k) {
    if (e.est.mergulho > 0) { e.est.mergulho -= dt; return irAte(e, k, 2.4); }
    if (k.d < 320 && temporizador(e, 'proxMergulho', dt, 3)) e.est.mergulho = 0.55;
    return k.d > 320 ? irAte(e, k) : orbitar(e, k, 220, 1, e.est.lado);
  },

  // Escudo frontal: um escudo que gira devagar para a nave; tiros de frente quase não ferem
  escudo(c, e, dt, k) {
    const alvo = Math.atan2(k.dy, k.dx);
    if (e.est.escudoAng === undefined) e.est.escudoAng = alvo;
    const diff = Phaser.Math.Angle.Wrap(alvo - e.est.escudoAng);
    e.est.escudoAng += Math.max(-1.3 * dt, Math.min(1.3 * dt, diff));
    const g = c.gfxInimigos, r = e.hitR + 7;
    g.lineStyle(4, 0xcbd5e1, e.intangivel ? 0.2 : 0.9);
    g.beginPath(); g.arc(e.x, e.y, r, e.est.escudoAng - 0.9, e.est.escudoAng + 0.9); g.strokePath();
    return null;
  },

  // Curador: fica atrás dos outros e cura quem está perto a cada 3 s
  curador(c, e, dt, k) {
    if (temporizador(e, 'cura', dt, 3)) {
      let curou = 0;
      c.enemies.children.iterate((o) => {
        if (!o || !o.active || o === e || o.isBoss) return;
        if (Math.hypot(o.x - e.x, o.y - e.y) < 170 && o.hp < o.maxHp) { o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.15); curou++; }
      });
      if (curou) e.est.pulso = 0.35;
    }
    if (e.est.pulso > 0) {
      e.est.pulso -= dt;
      c.gfxInimigos.lineStyle(3, 0x4ade80, e.est.pulso / 0.35).strokeCircle(e.x, e.y, 170 * (1 - e.est.pulso / 0.35) + 20);
    }
    return manterDistancia(e, k, 300, 380);
  },

  // ===== Galáxia 2 — Cinturão Rubro =====
  ziguezague(c, e, dt, k) {
    const v = irAte(e, k), w = Math.sin(c.elapsed * 5 + e.est.semente) * 0.95 * e.speedV / k.d;
    return { vx: v.vx - k.dy * w, vy: v.vy + k.dx * w };
  },

  // Investida: para, mira (linha vermelha) e dispara em linha reta
  investida(c, e, dt, k) {
    const s = e.est;
    s.fase = s.fase || 'chegar';
    if (s.fase === 'chegar') {
      if (k.d < 360) { s.fase = 'mirar'; s.tempo = 0.8; }
      return null;
    }
    if (s.fase === 'mirar') {
      s.tempo -= dt;
      s.ang = Math.atan2(k.dy, k.dx);
      c.gfxInimigos.lineStyle(2, 0xef4444, 0.6).lineBetween(e.x, e.y, e.x + Math.cos(s.ang) * 420, e.y + Math.sin(s.ang) * 420);
      e.setTint(0xff8888);
      if (s.tempo <= 0) { s.fase = 'investir'; s.tempo = 0.9; e.clearTint(); }
      return { vx: 0, vy: 0 };
    }
    if (s.fase === 'investir') {
      s.tempo -= dt;
      if (s.tempo <= 0) { s.fase = 'descansar'; s.tempo = 0.7; }
      return { vx: Math.cos(s.ang) * e.speedV * 3.4, vy: Math.sin(s.ang) * e.speedV * 3.4 };
    }
    s.tempo -= dt;
    if (s.tempo <= 0) s.fase = 'chegar';
    return irAte(e, k, 0.3);
  },

  // Minador: ronda a nave e larga minas que duram 8 s
  minador(c, e, dt, k) {
    if (temporizador(e, 'mina', dt, 2.8) && k.d < 600) c.criarMina(e.x, e.y, 1.8);
    return manterDistancia(e, k, 300, 440);
  },

  // Laser: para, carrega um raio (linha fina) e dispara (linha grossa)
  laser(c, e, dt, k) {
    const s = e.est;
    if (s.raio > 0) {
      s.raio -= dt;
      c.gfxInimigos.lineStyle(7, 0xfde047, 0.9).lineBetween(e.x, e.y, e.x + Math.cos(s.ang) * 900, e.y + Math.sin(s.ang) * 900);
    }
    if (s.carga > 0) {
      s.carga -= dt;
      if (s.carga > 0.35) s.ang = Math.atan2(k.dy, k.dx); // trava a mira pouco antes de disparar
      c.gfxInimigos.lineStyle(1.5, 0xf43f5e, 0.4 + 0.5 * (1 - s.carga / 1.2)).lineBetween(e.x, e.y, e.x + Math.cos(s.ang) * 900, e.y + Math.sin(s.ang) * 900);
      if (s.carga <= 0) {
        s.raio = 0.15; s.espera = 2.6;
        if (c.distanciaAoRaio(e.x, e.y, s.ang, 900) < 20) c.hurt(e.damage);
      }
      return { vx: 0, vy: 0 };
    }
    s.espera = (s.espera || 0) - dt;
    if (s.espera <= 0 && k.d < 440) { s.carga = 1.2; return { vx: 0, vy: 0 }; }
    return manterDistancia(e, k, 320, 420);
  },

  // Teleporte: some e reaparece perto da nave a cada 3,5 s
  teleporte(c, e, dt, k) {
    if (temporizador(e, 'pulo', dt, 3.5) && k.d < 900) {
      const a = Math.random() * Math.PI * 2, r = 170 + Math.random() * 60;
      c.boom(e.x, e.y, 6, 0xfda4af);
      e.body.reset(c.player.x + Math.cos(a) * r, c.player.y + Math.sin(a) * r);
      c.boom(e.x, e.y, 6, 0xfda4af);
    }
    return irAte(e, k, 0.75);
  },

  // Invocador: fica longe e chama 3 larvas a cada 5 s (no máximo 6 vivas)
  invocador(c, e, dt, k) {
    e.est.filhos = (e.est.filhos || []).filter((f) => f.active && f.est && f.est.mae === e);
    if (temporizador(e, 'chamar', dt, 5) && e.est.filhos.length < 6 && k.d < 700) {
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const f = c.spawnEnemy('g2_larva', e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40);
        if (f) { f.est.mae = e; e.est.filhos.push(f); }
      }
      c.boom(e.x, e.y, 8, 0xfb923c);
    }
    return manterDistancia(e, k, 380, 470);
  },

  // Ladrão: rouba gemas do chão e foge da nave; ao morrer devolve o que roubou
  ladrao(c, e, dt, k) {
    if (k.d < 260) return fugir(e, k, 1.1);
    let alvo = null, melhor = 600 * 600;
    c.gems.children.iterate((g) => {
      if (!g || !g.active) return;
      const d2 = (g.x - e.x) ** 2 + (g.y - e.y) ** 2;
      if (d2 < melhor) { melhor = d2; alvo = g; }
    });
    if (!alvo) return irAte(e, k, 0.6);
    const dg = Math.sqrt(melhor) || 1;
    if (dg < 18) { e.roubadas += alvo.val; alvo.setActive(false).setVisible(false); return { vx: 0, vy: 0 }; }
    return { vx: (alvo.x - e.x) / dg * e.speedV, vy: (alvo.y - e.y) / dg * e.speedV };
  },

  // Leque: atira 5 tiros abertos a cada 2,6 s
  leque(c, e, dt, k) {
    if (temporizador(e, 'tiro', dt, 2.6) && k.d < 560) {
      const base = Math.atan2(k.dy, k.dx);
      for (let i = -2; i <= 2; i++) c.tiroInimigo(e, base + i * 0.24, 210, 0.8);
    }
    return manterDistancia(e, k, 270, 350);
  },

  // Regenerador: se ficar 2 s sem levar dano, recupera 5% da vida por segundo
  regenerador(c, e, dt) {
    if (c.elapsed - (e.ultimoDano || 0) > 2 && e.hp < e.maxHp) {
      e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.05 * dt);
      c.gfxInimigos.lineStyle(2, 0x4ade80, 0.6).strokeCircle(e.x, e.y, e.hitR + 4);
    }
    return null;
  },

  // Ímã vivo: ronda a ~260 px e puxa a nave para perto
  puxador(c, e, dt, k) {
    if (k.d < 340) {
      const f = (1 - k.d / 340) * 170;
      c.player.body.velocity.x -= k.dx / k.d * f;
      c.player.body.velocity.y -= k.dy / k.d * f;
      c.gfxInimigos.lineStyle(1, 0x93c5fd, 0.35).strokeCircle(e.x, e.y, 340 - ((c.elapsed * 160) % 300));
    }
    return k.d > 300 ? irAte(e, k) : orbitar(e, k, 260, 0.5, e.est.lado);
  },

  // ===== Galáxia 3 — Abismo Violeta =====
  // Fantasma: alterna entre visível (2,6 s) e intangível (1,6 s): sem tocar, sem levar dano
  fantasma(c, e, dt) {
    e.est.ciclo = (e.est.ciclo === undefined ? Math.random() * 4.2 : e.est.ciclo) + dt;
    const fase = e.est.ciclo % 4.2;
    e.intangivel = fase > 2.6;
    e.setAlpha(e.intangivel ? 0.22 : 1);
    return null;
  },

  // Espiral: para de longe e solta tiros girando por 2 s, depois descansa 2,4 s
  espiral(c, e, dt, k) {
    const s = e.est;
    s.ciclo = (s.ciclo || 0) + dt;
    const fase = s.ciclo % 4.4;
    if (fase < 2 && k.d < 620) {
      s.ang = (s.ang || 0) + 0.45;
      if (temporizador(e, 'tiro', dt, 0.12)) c.tiroInimigo(e, s.ang, 170, 0.7);
      return { vx: 0, vy: 0 };
    }
    return manterDistancia(e, k, 300, 380);
  },

  estilhaco: () => null, // ao morrer solta 8 tiros em volta (aoMorrer)
  sanguessuga: () => null, // ao encostar cura a si mesma e fica mais rápida (aoEncostar)

  // Bomba-relógio: para perto da nave, conta 1,8 s e explode forte
  bomba(c, e, dt, k) {
    const s = e.est;
    if (s.contagem === undefined && k.d < 115) s.contagem = 1.8;
    if (s.contagem !== undefined) {
      s.contagem -= dt;
      const pisca = s.contagem < 0.6 ? 18 : 8;
      if (Math.floor(s.contagem * pisca) % 2 === 0) e.setTint(0xff4444); else e.clearTint();
      c.gfxInimigos.lineStyle(2, 0xef4444, 0.7).strokeCircle(e.x, e.y, 120 * (1 - s.contagem / 1.8));
      c.gfxInimigos.lineStyle(1, 0xef4444, 0.3).strokeCircle(e.x, e.y, 120);
      if (s.contagem <= 0) { c.explosaoInimiga(e.x, e.y, 120, e.damage); e.semRecompensa = true; c.killEnemy(e); }
      return { vx: 0, vy: 0 };
    }
    return null;
  },

  // Ricochete: anda em linha reta e quica num "quadro" invisível em volta da nave
  ricochete(c, e, dt, k) {
    const s = e.est;
    if (!s.vx) { const a = Math.atan2(k.dy, k.dx) + (Math.random() < 0.5 ? 0.6 : -0.6); s.vx = Math.cos(a); s.vy = Math.sin(a); }
    const rx = e.x - c.player.x, ry = e.y - c.player.y;
    if ((rx > 460 && s.vx > 0) || (rx < -460 && s.vx < 0)) s.vx = -s.vx;
    if ((ry > 300 && s.vy > 0) || (ry < -300 && s.vy < 0)) s.vy = -s.vy;
    if (k.d > 900) return irAte(e, k);
    return { vx: s.vx * e.speedV, vy: s.vy * e.speedV };
  },

  // Névoa: perto dela (160 px) a nave fica 45% mais lenta
  nevoa(c, e, dt, k) {
    c.gfxInimigos.fillStyle(0xa78bfa, 0.1).fillCircle(e.x, e.y, 160);
    if (k.d < 160) c.lentidao = Math.min(c.lentidao, 0.55);
    return null;
  },

  // Clonador: se ficar vivo 6 s, faz uma cópia de si (uma vez só)
  clonador(c, e, dt) {
    e.est.vivo = (e.est.vivo || 0) + dt;
    if (!e.est.clonou && e.est.vivo > 6) {
      e.est.clonou = true;
      const copia = c.spawnEnemy('g3_clone', e.x + 30, e.y + 30);
      if (copia) { copia.est.clonou = true; copia.hp = e.hp; c.boom(copia.x, copia.y, 8, 0xf0abfc); }
    }
    return null;
  },

  // Sentinela: torre parada que lança um míssil teleguiado lento a cada 3,5 s
  sentinela(c, e, dt, k) {
    e.parado = true;
    if (temporizador(e, 'missil', dt, 3.5) && k.d < 700) {
      const b = c.tiroInimigo(e, Math.atan2(k.dy, k.dx), 150, 1.2);
      if (b) { b.teleguiado = true; b.life = 5; b.setTint(0xf43f5e); }
    }
    return { vx: 0, vy: 0 };
  },

  // Coral: a cada 4 s cresce (até 4 vezes): mais vida, mais tamanho, mais dano
  coral(c, e, dt) {
    if ((e.est.cresceu || 0) < 4 && temporizador(e, 'crescer', dt, 4)) {
      e.est.cresceu = (e.est.cresceu || 0) + 1;
      e.setScale(e.scaleX * 1.12);
      e.hp *= 1.15; e.maxHp *= 1.15; e.hitR *= 1.12; e.damage *= 1.1;
    }
    return null;
  }
};

// O que acontece quando o inimigo morre
const AO_MORRER = {
  divisor(c, e) {
    for (let i = 0; i < 2; i++) {
      const f = c.spawnEnemy('g1_esporinho', e.x + (i ? 14 : -14), e.y);
      if (f) f.hp = f.maxHp = e.maxHp * 0.35;
    }
  },
  estilhaco(c, e) {
    for (let i = 0; i < 8; i++) c.tiroInimigo(e, i / 8 * Math.PI * 2, 200, 0.8);
  },
  ladrao(c, e) {
    if (e.roubadas > 0) c.dropGem(e.x, e.y, e.roubadas);
  }
};

// O que acontece quando o inimigo encosta na nave (além do dano)
const AO_ENCOSTAR = {
  sanguessuga(c, e) {
    e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.5);
    e.speedV = Math.min(e.velBase * 2, e.speedV * 1.15);
    c.floatText(e.x, e.y, '+vida', '#f0abfc');
  }
};
