const STORAGE_KEY = "album_2026_tracker_v2";

const specialSections = [
  { code: "FWC-Especiales", label: "FWC - Especiales", stickers: ["00", "1", "2", "3", "4"] },
  { code: "FWC-Balon", label: "FWC - Balón y Países", stickers: ["5", "6", "7", "8"] },
  { code: "FWC-Historia", label: "FWC - Historia", stickers: Array.from({ length: 11 }, (_, i) => String(i + 9)) },
];

// Basado en listado de clasificados para 2026 (hosts + clasificados por confederación al cierre de qualy 2026).
const qualifiedCountries = [
  ["ARG", "Argentina"], ["AUS", "Australia"], ["AUT", "Austria"], ["BEL", "Bélgica"],
  ["BIH", "Bosnia y Herzegovina"], ["BRA", "Brasil"], ["CAN", "Canadá"], ["CPV", "Cabo Verde"],
  ["CMR", "Camerún"], ["COL", "Colombia"], ["CRC", "Costa Rica"], ["HRV", "Croacia"],
  ["CUW", "Curazao"], ["CZE", "Chequia"], ["DEN", "Dinamarca"], ["ECU", "Ecuador"],
  ["EGY", "Egipto"], ["ENG", "Inglaterra"], ["FRA", "Francia"], ["DEU", "Alemania"],
  ["GHA", "Ghana"], ["HTI", "Haití"], ["IRN", "Irán"], ["IRQ", "Irak"],
  ["ITA", "Italia"], ["JPN", "Japón"], ["JOR", "Jordania"], ["KOR", "Corea del Sur"],
  ["MAR", "Marruecos"], ["MEX", "México"], ["NLD", "Países Bajos"], ["NZL", "Nueva Zelanda"],
  ["NGA", "Nigeria"], ["NOR", "Noruega"], ["PAN", "Panamá"], ["PRY", "Paraguay"],
  ["PER", "Perú"], ["POL", "Polonia"], ["PRT", "Portugal"], ["QAT", "Qatar"],
  ["SAU", "Arabia Saudita"], ["SCO", "Escocia"], ["SEN", "Senegal"], ["ESP", "España"],
  ["SWE", "Suecia"], ["CHE", "Suiza"], ["TUN", "Túnez"], ["USA", "Estados Unidos"],
];

const countrySections = qualifiedCountries.map(([code, label]) => ({
  code,
  label: `${code} - ${label}`,
  stickers: Array.from({ length: 20 }, (_, i) => String(i + 1)),
}));

const allSections = [...specialSections, ...countrySections];
const model = Object.fromEntries(allSections.map((s) => [s.code, Object.fromEntries(s.stickers.map((n) => [n, { owned: false, repeated: 0 }]))]));

const state = { filter: "all", query: "", collapsed: new Set() };

const el = {
  sectionsRoot: document.getElementById("sectionsRoot"),
  searchInput: document.getElementById("searchInput"),
  resetBtn: document.getElementById("resetBtn"),
  ownedCount: document.getElementById("ownedCount"),
  totalCount: document.getElementById("totalCount"),
  collapseBtn: document.getElementById("collapseBtn"),
  expandBtn: document.getElementById("expandBtn"),
  tabs: [...document.querySelectorAll(".tab")],
};

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const parsed = JSON.parse(raw);
  for (const section of allSections) {
    const src = parsed?.album?.[section.code] || {};
    for (const key of section.stickers) {
      if (src[key]) model[section.code][key] = src[key];
    }
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ album: model }));
}

function totalStats() {
  let owned = 0; let total = 0;
  for (const s of allSections) {
    for (const key of s.stickers) {
      total += 1;
      if (model[s.code][key].owned) owned += 1;
    }
  }
  return { owned, total };
}

function stickerVisible(info) {
  if (state.filter === "missing") return !info.owned;
  if (state.filter === "repeated") return info.repeated > 0;
  return true;
}

function render() {
  const { owned, total } = totalStats();
  el.ownedCount.textContent = owned;
  el.totalCount.textContent = total;

  const q = state.query.toLowerCase();
  el.sectionsRoot.innerHTML = "";

  for (const section of allSections) {
    if (q && !section.label.toLowerCase().includes(q)) continue;

    const visibleStickers = section.stickers.filter((num) => stickerVisible(model[section.code][num]));
    if (!visibleStickers.length) continue;

    const wrapper = document.createElement("article");
    wrapper.className = "section card";

    const head = document.createElement("button");
    head.className = "section-head";
    head.innerHTML = `<strong>${section.label}</strong><span>${state.collapsed.has(section.code) ? "▾" : "▴"}</span>`;
    head.onclick = () => {
      if (state.collapsed.has(section.code)) state.collapsed.delete(section.code);
      else state.collapsed.add(section.code);
      render();
    };
    wrapper.appendChild(head);

    if (!state.collapsed.has(section.code)) {
      const grid = document.createElement("div");
      grid.className = "sticker-grid";

      for (const num of visibleStickers) {
        const info = model[section.code][num];
        const chip = document.createElement("div");
        chip.className = `chip ${info.owned ? "owned" : ""}`;

        const numberBtn = document.createElement("button");
        numberBtn.className = "chip-number";
        numberBtn.textContent = num;
        numberBtn.onclick = () => {
          info.owned = !info.owned;
          if (!info.owned) info.repeated = 0;
          save(); render();
        };

        const repeat = document.createElement("div");
        repeat.className = "repeat-controls";
        repeat.innerHTML = `<button>-</button><span>x${info.repeated}</span><button>+</button>`;
        const [minus, , plus] = repeat.querySelectorAll("button, span, button");
        minus.onclick = () => {
          info.repeated = Math.max(0, info.repeated - 1);
          if (info.repeated > 0) info.owned = true;
          save(); render();
        };
        plus.onclick = () => {
          info.repeated += 1;
          info.owned = true;
          save(); render();
        };

        chip.append(numberBtn, repeat);
        grid.appendChild(chip);
      }

      wrapper.appendChild(grid);
    }

    el.sectionsRoot.appendChild(wrapper);
  }
}

el.searchInput.addEventListener("input", () => { state.query = el.searchInput.value.trim(); render(); });
el.resetBtn.addEventListener("click", () => { localStorage.removeItem(STORAGE_KEY); location.reload(); });
el.collapseBtn.addEventListener("click", () => { state.collapsed = new Set(allSections.map((s) => s.code)); render(); });
el.expandBtn.addEventListener("click", () => { state.collapsed.clear(); render(); });

for (const tab of el.tabs) {
  tab.addEventListener("click", () => {
    el.tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    state.filter = tab.dataset.filter;
    render();
  });
}

load();
render();
