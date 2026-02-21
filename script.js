const root = document.documentElement;

const pulse = {
  launches: document.getElementById("pulseLaunches"),
  producerRevenue: document.getElementById("pulseProducerRevenue"),
  totalRevenue: document.getElementById("pulseTotalRevenue"),
  reach: document.getElementById("pulseReach"),
  leads: document.getElementById("pulseLeads"),
  sales: document.getElementById("pulseSales"),
  conv: document.getElementById("pulseConv")
};

const sliders = {
  reach: document.getElementById("tgReach")
};

const output = {
  reach: document.getElementById("oReach"),
  leads: document.getElementById("oLeads"),
  sales: document.getElementById("oSales"),
  per100: document.getElementById("oPer100"),
  rev: document.getElementById("oRev"),
  profit: document.getElementById("oProfit"),
  strategy: document.getElementById("strategyText")
};

const inputs = {
  reach: document.getElementById("iReach")
};

const NICHE_CONFIG = {
  soft: { label: "Мягкая ниша", per100Min: 50000, per100Max: 50000 },
  hard: { label: "Твердая ниша", per100Min: 110000, per100Max: 110000 },
  finance: { label: "Финансы", per100Min: 300000, per100Max: 400000 },
  it: { label: "IT", per100Min: 150000, per100Max: 150000 }
};

let selectedNiche = "soft";

function animatePulse() {
  if (!pulse.launches || !pulse.producerRevenue || !pulse.totalRevenue || !pulse.reach || !pulse.leads || !pulse.sales || !pulse.conv) {
    return;
  }

  const normalizeConv = (value) => {
    let result = Number(Math.max(15.1, Math.min(19.9, value)).toFixed(1));
    if (Number.isInteger(result)) {
      result = Number(Math.min(19.9, result + 0.1).toFixed(1));
    }
    return result;
  };

  const randomConv = () => normalizeConv(15 + Math.random() * 5);

  const convFromCounts = (leadsCount, salesCount) => {
    if (leadsCount <= 0) return 15.1;
    return Number(((salesCount / leadsCount) * 100).toFixed(1));
  };

  const launches = 7;
  const defaults = {
    producerRevenue: 5842000,
    totalRevenue: 34115000,
    reach: 14264,
    leads: 4841,
    sales: 853,
    targetConv: randomConv(),
    lastUpdateTs: Date.now() - (5 * 60 * 60 * 1000)
  };

  const storageKey = "launch_pulse_state_v5";

  const loadState = () => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return { ...defaults };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return { ...defaults };
      return {
        producerRevenue: Number(parsed.producerRevenue) || defaults.producerRevenue,
        totalRevenue: Number(parsed.totalRevenue) || defaults.totalRevenue,
        reach: Number(parsed.reach) || defaults.reach,
        leads: Number(parsed.leads) || defaults.leads,
        sales: Number(parsed.sales) || defaults.sales,
        targetConv: Number(parsed.targetConv) || defaults.targetConv,
        lastUpdateTs: Number(parsed.lastUpdateTs) || defaults.lastUpdateTs
      };
    } catch {
      return { ...defaults };
    }
  };

  const saveState = (state) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignore storage errors (private mode, quota, etc.) and keep live logic running.
    }
  };

  const initial = loadState();
  let producerRevenue = initial.producerRevenue;
  let totalRevenue = initial.totalRevenue;
  let reach = initial.reach;
  let leads = initial.leads;
  let sales = initial.sales;
  let targetConv = normalizeConv(initial.targetConv);
  let lastUpdateTs = initial.lastUpdateTs;
  let conv = convFromCounts(leads, sales);
  const num = new Intl.NumberFormat("ru-RU");
  const refreshMs = 5 * 60 * 60 * 1000;
  const updatesPerMonth = (30 * 24) / 5; // 144 updates at 5-hour interval
  const leadsPerUpdate = 400 / updatesPerMonth; // ~2.78 leads/update
  const schedulerCheckMs = 60 * 1000;
  let leadCarry = 0;
  let salesCarry = 0;

  const render = () => {
    pulse.launches.textContent = String(launches);
    pulse.producerRevenue.textContent = `₽${num.format(producerRevenue)}`;
    pulse.totalRevenue.textContent = `~₽${num.format(totalRevenue)}`;
    pulse.reach.textContent = num.format(reach);
    pulse.leads.textContent = num.format(leads);
    pulse.sales.textContent = num.format(sales);
    pulse.conv.textContent = `${conv.toFixed(1)}%`;
  };

  const updateData = () => {
    targetConv = normalizeConv(targetConv + (Math.random() - 0.5) * 0.6);

    const reachDelta = 4 + Math.floor(Math.random() * 10);
    leadCarry += leadsPerUpdate + (Math.random() - 0.5) * 0.5;
    const leadDelta = Math.max(0, Math.floor(leadCarry));
    leadCarry -= leadDelta;

    salesCarry += leadDelta * (targetConv / 100);
    let salesDelta = Math.max(0, Math.floor(salesCarry));
    salesCarry -= salesDelta;

    const nextLeads = leads + leadDelta;
    let nextSales = sales + salesDelta;
    let projectedConv = convFromCounts(nextLeads, nextSales);

    if (Number.isInteger(projectedConv) && nextLeads > 0) {
      const altConv = convFromCounts(nextLeads, nextSales + 1);
      if (altConv <= 19.9) {
        salesDelta += 1;
        nextSales += 1;
        projectedConv = altConv;
      }
    }

    const avgCheck = 25000 + Math.floor(Math.random() * 5001);
    const revenueDelta = salesDelta * avgCheck;
    const producerDelta = Math.round(revenueDelta * (0.43 + Math.random() * 0.1));

    reach += reachDelta;
    leads = nextLeads;
    sales = nextSales;
    totalRevenue += revenueDelta;
    producerRevenue += producerDelta;
    conv = projectedConv;
    lastUpdateTs += refreshMs;
  };

  render();

  const runMissedUpdates = () => {
    const now = Date.now();
    if (lastUpdateTs > now + refreshMs) {
      // Guard against system clock skew or corrupted storage values.
      lastUpdateTs = now;
    }
    const missedSteps = Math.max(0, Math.floor((now - lastUpdateTs) / refreshMs));
    if (missedSteps <= 0) return;
    for (let i = 0; i < missedSteps; i += 1) {
      updateData();
    }
    render();
    saveState({
      producerRevenue,
      totalRevenue,
      reach,
      leads,
      sales,
      targetConv,
      lastUpdateTs
    });
  };

  // Catch up missed 5-hour updates after page refresh/reopen.
  runMissedUpdates();

  // Reliable scheduler: checks every minute and applies all due 5-hour steps.
  window.setInterval(runMissedUpdates, schedulerCheckMs);

  // Also re-check immediately when tab becomes active again.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) runMissedUpdates();
  });

  window.addEventListener("focus", () => {
    runMissedUpdates();
  });

  // Save state even if no new step yet (keeps timestamp/state consistent).
  window.addEventListener("beforeunload", () => {
    saveState({
      producerRevenue,
      totalRevenue,
      reach,
      leads,
      sales,
      targetConv,
      lastUpdateTs
    });
  });

  saveState({
    producerRevenue,
    totalRevenue,
    reach,
    leads,
    sales,
    targetConv,
    lastUpdateTs
  });

  // Fallback for very long sessions: re-arm scheduler if browser dropped timers.
  window.addEventListener("pageshow", () => {
    runMissedUpdates();
  });
}

function recalc() {
  const reach = Number(sliders.reach.value);
  const niche = NICHE_CONFIG[selectedNiche];
  if (!niche) return;

  const leadsMin = Math.round(reach * 0.07);
  const leadsMax = Math.round(reach * 0.08);
  const salesMin = Math.round(leadsMin * 0.15);
  const salesMax = Math.round(leadsMax * 0.2);

  const revenueMin = Math.round((reach / 100) * niche.per100Min);
  const revenueMax = Math.round((reach / 100) * niche.per100Max);
  const profitMin = Math.round(revenueMin * 0.85);
  const profitMax = Math.round(revenueMax * 0.85);

  const salesPer100Min = 100 * 0.07 * 0.15; // 1.05 sales
  const salesPer100Max = 100 * 0.08 * 0.2; // 1.6 sales
  const avgCheckMin = Math.round(niche.per100Min / salesPer100Max);
  const avgCheckMax = Math.round(niche.per100Max / salesPer100Min);
  const leadsAvg = Math.round((leadsMin + leadsMax) / 2);
  const salesAvg = Math.round((salesMin + salesMax) / 2);
  const per100 = Math.round((niche.per100Min + niche.per100Max) / 2);
  const revenue = Math.round((revenueMin + revenueMax) / 2);
  const profit = Math.round((profitMin + profitMax) / 2);

  const num = new Intl.NumberFormat("ru-RU");
  inputs.reach.textContent = num.format(reach);

  output.reach.textContent = num.format(reach);
  output.leads.textContent = num.format(leadsAvg);
  output.sales.textContent = num.format(salesAvg);
  output.per100.textContent = num.format(per100);
  output.rev.textContent = num.format(revenue);
  output.profit.textContent = num.format(profit);
  output.strategy.textContent = `Ниша: ${niche.label}. В расчете учтены конверсии которые делает наша опытная команда и средний чек по рынку в вашей нише, обычно нам получается его увеличить за счет сильного продукта и маркетинга, но это мы берем как минимум.`;
}

function setupAttentionMode() {
  const btn = document.getElementById("attentionBtn");

  btn.addEventListener("click", () => {
    document.body.classList.toggle("attention-on");
    const enabled = document.body.classList.contains("attention-on");
    btn.textContent = enabled ? "Выключить Attention Map" : "Включить Attention Map";
  });
}

function setupReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function setupScrollFx() {
  const bar = document.getElementById("scrollProgress");
  const sections = document.querySelectorAll("main section");
  const animated = document.querySelectorAll(".scroll-pop, .scroll-slide-left, .scroll-slide-right");

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (bar) bar.style.width = `${Math.min(100, Math.max(0, ratio))}%`;
    root.style.setProperty("--scroll-y", `${window.scrollY}`);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("in-view", entry.isIntersecting);
      });
    },
    { threshold: 0.25 }
  );

  sections.forEach((section) => observer.observe(section));

  const animatedObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("on");
        } else {
          entry.target.classList.remove("on");
        }
      });
    },
    { threshold: 0.18 }
  );

  animated.forEach((el) => animatedObserver.observe(el));
}

function setupSpotlight() {
  window.addEventListener("pointermove", (event) => {
    root.style.setProperty("--glow-x", `${event.clientX}px`);
    root.style.setProperty("--glow-y", `${event.clientY}px`);
  });
}

function setupTilt() {
  const cards = document.querySelectorAll("[data-tilt]");

  cards.forEach((card) => {
    const renderTilt = (rx, ry, hovered) => {
      const lift = hovered ? -10 : 0;
      const scale = hovered ? 1.03 : 1;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(${lift}px) scale(${scale})`;
    };

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rx = ((y / rect.height) - 0.5) * -7;
      const ry = ((x / rect.width) - 0.5) * 9;
      renderTilt(rx, ry, true);
    });

    card.addEventListener("pointerenter", () => {
      card.classList.add("case-hovered");
      renderTilt(0, 0, true);
    });

    card.addEventListener("pointerleave", () => {
      card.classList.remove("case-hovered");
      card.style.transform = "";
    });

    card.addEventListener("focus", () => {
      card.classList.add("case-hovered");
      renderTilt(0, 0, true);
    });

    card.addEventListener("blur", () => {
      card.classList.remove("case-hovered");
      card.style.transform = "";
    });
  });
}

function setupCaseModal() {
  const modal = document.getElementById("caseModal");
  const modalClose = document.getElementById("caseModalClose");
  const modalKicker = document.getElementById("caseModalKicker");
  const modalTitle = document.getElementById("caseModalTitle");
  const modalBody = document.getElementById("caseModalBody");
  const cards = document.querySelectorAll(".case-click");

  if (!modal || !modalClose || !modalKicker || !modalTitle || !modalBody) return;

  const closeModal = () => {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  cards.forEach((card) => {
    const openModal = () => {
      const chip = card.querySelector(".chip");
      const title = card.querySelector("h3");
      const detail = card.querySelector(".case-detail");

      modalKicker.textContent = chip ? chip.textContent.replace(/\s+/g, " ").trim() : "Кейс";
      modalTitle.textContent = title ? title.textContent : "";
      modalBody.innerHTML = detail ? detail.innerHTML : "";

      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    };

    card.addEventListener("click", openModal);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal();
      }
    });
  });

  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("show")) closeModal();
  });
}

function setupNichePills() {
  const pills = document.querySelectorAll(".niche-pill");
  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((item) => item.classList.remove("active"));
      pill.classList.add("active");
      selectedNiche = pill.dataset.niche || "soft";
      recalc();
    });
  });
}

if (sliders.reach) sliders.reach.addEventListener("input", recalc);

setupReveal();
setupScrollFx();
setupSpotlight();
setupAttentionMode();
setupTilt();
setupCaseModal();
setupNichePills();
animatePulse();
recalc();
