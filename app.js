const STORAGE_KEY = "figuritas_2026";
const SYNC_URL_KEY = "figuritas_2026_sync_url";

const state = {
  owned: new Set(),
  duplicateHits: 0,
  syncUrl: "",
};

const el = {
  countOwned: document.getElementById("countOwned"),
  countDupes: document.getElementById("countDupes"),
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  albumSize: document.getElementById("albumSize"),
  stickerList: document.getElementById("stickerList"),
  manualInput: document.getElementById("manualInput"),
  addManualBtn: document.getElementById("addManualBtn"),
  chatForm: document.getElementById("chatForm"),
  chatInput: document.getElementById("chatInput"),
  imageInput: document.getElementById("imageInput"),
  chatLog: document.getElementById("chatLog"),
  resetBtn: document.getElementById("resetBtn"),
  syncUrlInput: document.getElementById("syncUrlInput"),
  connectSyncBtn: document.getElementById("connectSyncBtn"),
  pullSyncBtn: document.getElementById("pullSyncBtn"),
  pushSyncBtn: document.getElementById("pushSyncBtn"),
  syncStatus: document.getElementById("syncStatus"),
};

function addMsg(kind, text) {
  const div = document.createElement("div");
  div.className = `msg ${kind}`;
  div.textContent = text;
  el.chatLog.appendChild(div);
  el.chatLog.scrollTop = el.chatLog.scrollHeight;
}

function setSyncStatus(text) {
  el.syncStatus.textContent = text;
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    state.owned = new Set(parsed.owned || []);
    state.duplicateHits = parsed.duplicateHits || 0;
    if (parsed.albumSize) {
      el.albumSize.value = parsed.albumSize;
      el.progressBar.max = parsed.albumSize;
    }
  }

  state.syncUrl = localStorage.getItem(SYNC_URL_KEY) || "";
  el.syncUrlInput.value = state.syncUrl;
  if (state.syncUrl) {
    setSyncStatus("Sincronización remota configurada. Podés traer/subir estado compartido.");
  }
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    owned: [...state.owned],
    duplicateHits: state.duplicateHits,
    albumSize: Number(el.albumSize.value),
  }));
}

function extractStickerNumbers(text) {
  return [...new Set((text.match(/\d{1,4}/g) || []).map(Number).filter(n => n > 0))];
}

function serializeState() {
  return {
    owned: [...state.owned].sort((a, b) => a - b),
    duplicateHits: state.duplicateHits,
    albumSize: Number(el.albumSize.value),
    updatedAt: new Date().toISOString(),
  };
}

function applyState(next) {
  state.owned = new Set(next.owned || []);
  state.duplicateHits = Number(next.duplicateHits || 0);
  if (next.albumSize) {
    el.albumSize.value = Number(next.albumSize);
  }
  saveLocal();
  render();
}

async function pushRemote() {
  if (!state.syncUrl) throw new Error("No hay URL de sincronización configurada.");

  const response = await fetch(state.syncUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "save", payload: serializeState() }),
  });

  if (!response.ok) throw new Error(`Error remoto (${response.status})`);
}

async function pullRemote() {
  if (!state.syncUrl) throw new Error("No hay URL de sincronización configurada.");

  const response = await fetch(`${state.syncUrl}?action=load`, { method: "GET" });
  if (!response.ok) throw new Error(`Error remoto (${response.status})`);

  const data = await response.json();
  if (!data?.payload) throw new Error("Respuesta remota inválida");

  applyState(data.payload);
}

async function registerStickers(numbers, sourceLabel = "carga") {
  let added = 0;
  for (const n of numbers) {
    if (state.owned.has(n)) state.duplicateHits += 1;
    else {
      state.owned.add(n);
      added += 1;
    }
  }

  saveLocal();
  render();

  if (state.syncUrl) {
    try {
      await pushRemote();
      setSyncStatus(`Estado compartido sincronizado (${sourceLabel}).`);
    } catch (err) {
      setSyncStatus(`No pude sincronizar: ${err.message}`);
    }
  }

  return added;
}

function render() {
  const owned = [...state.owned].sort((a, b) => a - b);
  el.countOwned.textContent = owned.length;
  el.countDupes.textContent = state.duplicateHits;

  const albumSize = Number(el.albumSize.value) || 1;
  el.progressBar.max = albumSize;
  el.progressBar.value = owned.length;
  el.progressText.textContent = `${Math.round((owned.length / albumSize) * 100)}% completado`;

  el.stickerList.innerHTML = "";
  for (const n of owned) {
    const li = document.createElement("li");
    li.textContent = `#${n}`;
    el.stickerList.appendChild(li);
  }
}

el.addManualBtn.addEventListener("click", async () => {
  const nums = extractStickerNumbers(el.manualInput.value);
  const added = await registerStickers(nums, "carga manual");
  el.manualInput.value = "";
  addMsg("assistant", `Agregué ${added} nuevas. Revisé ${nums.length - added} duplicadas.`);
});

el.chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = el.chatInput.value.trim();
  if (!text) return;

  const image = el.imageInput.files[0];
  addMsg("user", image ? `${text} (con imagen: ${image.name})` : text);

  const numbers = extractStickerNumbers(text);
  const added = await registerStickers(numbers, "chat IA");

  addMsg("assistant", `Detecté ${numbers.length} números. Se sumaron ${added}; ${numbers.length - added} ya estaban.`);
  el.chatInput.value = "";
  el.imageInput.value = "";
});

el.connectSyncBtn.addEventListener("click", () => {
  const url = el.syncUrlInput.value.trim();
  state.syncUrl = url;
  localStorage.setItem(SYNC_URL_KEY, url);
  setSyncStatus(url ? "Conexión guardada. Usá 'Traer estado' para cargar el álbum compartido." : "Sin conexión remota.");
});

el.pullSyncBtn.addEventListener("click", async () => {
  try {
    await pullRemote();
    setSyncStatus("Estado remoto cargado correctamente.");
  } catch (err) {
    setSyncStatus(`Error al traer estado: ${err.message}`);
  }
});

el.pushSyncBtn.addEventListener("click", async () => {
  try {
    await pushRemote();
    setSyncStatus("Estado remoto actualizado correctamente.");
  } catch (err) {
    setSyncStatus(`Error al subir estado: ${err.message}`);
  }
});

el.albumSize.addEventListener("change", () => {
  saveLocal();
  render();
});

el.resetBtn.addEventListener("click", async () => {
  localStorage.removeItem(STORAGE_KEY);
  state.owned = new Set();
  state.duplicateHits = 0;
  render();
  if (state.syncUrl) {
    try {
      await pushRemote();
      setSyncStatus("Álbum reiniciado localmente y en remoto.");
    } catch (err) {
      setSyncStatus(`Álbum local reiniciado. Error remoto: ${err.message}`);
    }
  }
});

load();
render();
