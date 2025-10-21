// script.js - Gestión de Ramas Git v6 con MySQL

// -----------------------------
// Variables globales
// -----------------------------
let apps = [];
let nextAppId = 1;
let nextBranchId = 1;
let isConnectedToMySQL = false;

// -----------------------------
// Utilidades
// -----------------------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function todayYYYYMMDD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDDMMYYYY(yyyyMMdd) {
  if (!yyyyMMdd) return "";
  const [y, m, d] = yyyyMMdd.split("-");
  return `${d}/${m}/${y}`;
}

function sanitizePrefix(pref) {
  if (!pref) return "";
  const trimmed = pref.trim();
  return trimmed.endsWith("-") ? trimmed : `${trimmed}-`;
}

function generateTicket(prefijo, numero) {
  if (!prefijo) return `${numero}`;
  return `${prefijo}${numero}`;
}

function sortBranchesDescByDate(ramas) {
  return [...ramas].sort((a, b) => (b.fechaMergeo > a.fechaMergeo ? 1 : -1));
}

function showToast(msg, type = 'success') {
  const toastEl = $("#appToast");
  const toastBody = $("#toastBody");

  // Limpiar clases anteriores y añadir nueva
  toastEl.className = `toast toast-${type}`;
  toastBody.textContent = msg;

  const bsToast = bootstrap.Toast.getOrCreateInstance(toastEl, {
    delay: 3000,
  });
  bsToast.show();
}

function showLoading(show = true) {
  const buttons = $$('button:not([data-bs-dismiss])');
  buttons.forEach(btn => {
    if (show) {
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });
}

// -----------------------------
// API MySQL (simple)
// -----------------------------
async function loadDataFromMySQL() {
  try {
    const response = await fetch('api.php');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        apps = data;
        isConnectedToMySQL = true;

        // Actualizar contadores para nuevos elementos
        if (apps.length > 0) {
          nextAppId = Math.max(...apps.map(a => a.id)) + 1;
          const allBranches = apps.flatMap(a => a.ramasMergeadas || []);
          if (allBranches.length > 0) {
            nextBranchId = Math.max(...allBranches.map(b => b.id)) + 1;
          }
        }

        console.log('✅ Conectado a MySQL - Datos cargados');
        return true;
      }
    }
  } catch (error) {
    console.warn('⚠️ MySQL no disponible, modo offline:', error.message);
  }

  // Modo offline - datos de ejemplo
  isConnectedToMySQL = false;
  apps = [
    {
      id: 1,
      nombre: "Sistema Facturación",
      ramaPrincipal: "MAIN",
      prefijoJira: "DESA0248-",
      ramasMergeadas: [
        {
          id: 1,
          numeroTicket: "123",
          ticketCompleto: "DESA0248-123",
          fechaMergeo: "2025-10-15",
          fechaCreacion: "2025-10-15",
        },
        {
          id: 2,
          numeroTicket: "124",
          ticketCompleto: "DESA0248-124",
          fechaMergeo: "2025-10-16",
          fechaCreacion: "2025-10-16",
        },
      ],
    },
    {
      id: 2,
      nombre: "Portal Cliente",
      ramaPrincipal: "master",
      prefijoJira: "XPRO-",
      ramasMergeadas: [
        {
          id: 3,
          numeroTicket: "2001",
          ticketCompleto: "XPRO-2001",
          fechaMergeo: "2025-10-14",
          fechaCreacion: "2025-10-14",
        },
      ],
    },
    {
      id: 3,
      nombre: "API Servicios",
      ramaPrincipal: "develop",
      prefijoJira: "",
      ramasMergeadas: [],
    }
  ];

  nextAppId = 4;
  nextBranchId = 4;
  return false;
}

async function saveToMySQL(action, data) {
  if (!isConnectedToMySQL) return null;

  try {
    const response = await fetch('api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return result;
      } else {
        console.warn('Error MySQL:', result.error);
        showToast(result.error || 'Error en la base de datos', 'error');
      }
    }
  } catch (error) {
    console.warn('Error guardando en MySQL:', error);
  }

  return null;
}

// -----------------------------
// Renderizado
// -----------------------------
function renderApps(filterText = "") {
  const container = $("#appsContainer");
  container.innerHTML = "";

  const normalized = filterText.trim().toLowerCase();
  const filtered = normalized
    ? apps.filter((a) => a.nombre.toLowerCase().includes(normalized))
    : apps;

  $("#emptyState").classList.toggle("d-none", filtered.length > 0);

  filtered.forEach((app) => container.appendChild(renderAppCard(app)));
}

function renderAppCard(app) {
  // Ordenar ramas por fecha más reciente
  if (app.ramasMergeadas) {
    app.ramasMergeadas = sortBranchesDescByDate(app.ramasMergeadas);
  }

  const col = document.createElement("div");
  col.className = "col-12 col-md-6 col-xl-4";

  const card = document.createElement("div");
  card.className = "card app-card h-100";

  // Header de la tarjeta
  const header = document.createElement("div");
  header.className = "card-header d-flex align-items-start justify-content-between gap-2";

  const left = document.createElement("div");
  left.className = "flex-grow-1";

  const title = document.createElement("div");
  title.className = "fw-bold mb-1";
  title.innerHTML = `<span class="inline-edit" data-app="${app.id}" data-field="nombre" contenteditable="true" title="Haz clic para editar">${app.nombre}</span>`;

  const meta = document.createElement("div");
  meta.className = "text-muted small";
  meta.innerHTML = `
    <div class="mb-1">
      <strong>Rama:</strong> 
      <span class="inline-edit" data-app="${app.id}" data-field="ramaPrincipal" contenteditable="true" title="Haz clic para editar">${app.ramaPrincipal}</span>
    </div>
    <div>
      <strong>Prefijo JIRA:</strong> 
      <span class="inline-edit ${!app.prefijoJira ? 'text-muted fst-italic' : ''}" data-app="${app.id}" data-field="prefijoJira" contenteditable="true" title="Haz clic para editar">${app.prefijoJira || 'Sin prefijo'}</span>
    </div>
  `;

  left.appendChild(title);
  left.appendChild(meta);

  const right = document.createElement("div");
  right.className = "d-flex flex-column align-items-end gap-2";
  right.innerHTML = `
  <span class="badge badge-branch-count">
    ${app.ramasMergeadas?.length || 0} rama${(app.ramasMergeadas?.length || 0) !== 1 ? 's' : ''}
  </span>
  <div class="btn-group-vertical btn-group-sm">
    <button class="btn btn-outline-primary btn-sm" data-action="add-branch" data-app="${app.id}">
      <i class="bi bi-plus-lg me-1"></i>Añadir Rama
    </button>
    <button class="btn btn-warning btn-sm" data-action="pro" data-app="${app.id}">
      <i class="bi bi-upload me-1"></i>Subir a PRO
    </button>
    <button class="btn btn-outline-danger btn-sm" data-action="delete-app" data-app="${app.id}">
      <i class="bi bi-trash3 me-1"></i>Eliminar App
    </button>
  </div>
`;

  header.appendChild(left);
  header.appendChild(right);

  // Body con lista de ramas
  const body = document.createElement("div");
  body.className = "card-body";

  if (!app.ramasMergeadas || app.ramasMergeadas.length === 0) {
    body.innerHTML = `
      <div class="text-center text-muted py-3">
        <i class="bi bi-git-branch display-6 opacity-25"></i>
        <div class="small">No hay ramas mergeadas</div>
      </div>
    `;
  } else {
    const list = document.createElement("div");
    app.ramasMergeadas.forEach((r) => {
      const item = document.createElement("div");
      item.className = "branch-item d-flex align-items-center justify-content-between";

      // Añadir clase especial si tiene warning
      if (r.hasWarning) {
        item.classList.add("branch-warning");
      }

      item.innerHTML = `
    <div class="flex-grow-1">
      <div class="branch-ticket mb-1">
        ${r.ticketCompleto}
        ${r.hasWarning ? '<i class="bi bi-exclamation-triangle text-warning ms-2" title="Tiene advertencias"></i>' : ''}
      </div>
      <div class="small text-muted">
        <i class="bi bi-calendar-event me-1"></i>${formatDDMMYYYY(r.fechaMergeo)}
        ${r.hasWarning ? '<br><i class="bi bi-chat-text me-1 text-warning"></i>Con advertencia' : ''}
      </div>
    </div>
    <div class="branch-actions d-flex gap-1">
      <button class="btn btn-light btn-sm" title="Editar número de ticket" 
              data-action="edit-branch-number" data-app="${app.id}" data-branch="${r.id}">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-light btn-sm" title="Editar fecha de mergeo" 
              data-action="edit-date" data-app="${app.id}" data-branch="${r.id}">
        <i class="bi bi-calendar-event"></i>
      </button>
      <button class="btn btn-outline-danger btn-sm" title="Eliminar rama" 
              data-action="delete-branch" data-app="${app.id}" data-branch="${r.id}">
        <i class="bi bi-trash3"></i>
      </button>
    </div>
  `;
      list.appendChild(item);
    });
    body.appendChild(list);
  }

  card.appendChild(header);
  card.appendChild(body);
  col.appendChild(card);
  return col;
}

// -----------------------------
// CRUD Operations
// -----------------------------
async function addApplication({ nombre, ramaPrincipal, prefijoJira }) {
  if (!nombre.trim() || !ramaPrincipal.trim()) {
    showToast("Nombre y rama principal son obligatorios", 'error');
    return;
  }

  // Verificar nombres únicos
  if (apps.some((a) => a.nombre.toLowerCase() === nombre.trim().toLowerCase())) {
    showToast("Ya existe una aplicación con ese nombre", 'error');
    return;
  }

  const normalizedPrefix = sanitizePrefix(prefijoJira);

  const newApp = {
    id: nextAppId++,
    nombre: nombre.trim(),
    ramaPrincipal: ramaPrincipal.trim(),
    prefijoJira: normalizedPrefix,
    ramasMergeadas: [],
  };

  // Guardar en MySQL si está disponible
  const result = await saveToMySQL('create_app', {
    nombre: newApp.nombre,
    ramaPrincipal: newApp.ramaPrincipal,
    prefijoJira: newApp.prefijoJira
  });

  if (result && result.id) {
    newApp.id = result.id;
  }

  apps.push(newApp);
  renderApps($("#inputSearch").value);
  showToast(`Aplicación "${newApp.nombre}" creada exitosamente`);
}

async function addBranch(appId, numeroTicket, fechaMergeo, hasWarning = false, warningComment = '') {
  const app = apps.find((a) => a.id === appId);
  if (!app) return;

  if (!/^\d+$/.test(numeroTicket.trim())) {
    showToast("El número de ticket debe contener solo números", 'error');
    return;
  }

  // Verificar duplicados
  if (app.ramasMergeadas.some((r) => r.numeroTicket === numeroTicket.trim())) {
    showToast("Ya existe una rama con ese número de ticket", 'error');
    return;
  }

  const ticketCompleto = generateTicket(app.prefijoJira, numeroTicket.trim());

  const newBranch = {
    id: nextBranchId++,
    numeroTicket: numeroTicket.trim(),
    ticketCompleto,
    fechaMergeo,
    hasWarning: hasWarning,
    warningComment: warningComment || '',
    fechaCreacion: todayYYYYMMDD(),
  };

  // Guardar en MySQL si está disponible
  const result = await saveToMySQL('create_branch', {
    applicationId: appId,
    numeroTicket: newBranch.numeroTicket,
    ticketCompleto: newBranch.ticketCompleto,
    fechaMergeo: newBranch.fechaMergeo,
    hasWarning: newBranch.hasWarning,
    warningComment: newBranch.warningComment
  });

  if (result && result.id) {
    newBranch.id = result.id;
  }

  app.ramasMergeadas.push(newBranch);
  renderApps($("#inputSearch").value);

  const warningText = hasWarning ? ' ⚠️ (con advertencia)' : '';
  showToast(`Rama ${ticketCompleto}${warningText} añadida exitosamente`);
}

async function updateAppField(appId, field, value) {
  const app = apps.find((a) => a.id === appId);
  if (!app) return;

  const oldValue = app[field];

  if (field === "nombre") {
    if (!value.trim()) {
      showToast("El nombre no puede estar vacío", 'error');
      return;
    }

    // Verificar unicidad
    if (apps.some((a) => a.id !== appId && a.nombre.toLowerCase() === value.trim().toLowerCase())) {
      showToast("Ya existe una aplicación con ese nombre", 'error');
      return;
    }

    app.nombre = value.trim();
  } else if (field === "ramaPrincipal") {
    app.ramaPrincipal = value.trim() || oldValue;
  } else if (field === "prefijoJira") {
    const normalized = sanitizePrefix(value);
    app.prefijoJira = normalized;

    // Recalcular tickets completos
    app.ramasMergeadas = app.ramasMergeadas.map((r) => ({
      ...r,
      ticketCompleto: generateTicket(app.prefijoJira, r.numeroTicket),
    }));
  }

  // Guardar en MySQL
  await saveToMySQL('update_app', {
    id: appId,
    nombre: app.nombre,
    ramaPrincipal: app.ramaPrincipal,
    prefijoJira: app.prefijoJira
  });

  renderApps($("#inputSearch").value);

  if (field === "prefijoJira") {
    showToast("Prefijo actualizado y tickets recalculados");
  }
}

async function editBranchNumber(appId, branchId) {
  const app = apps.find((a) => a.id === appId);
  if (!app) return;

  const branch = app.ramasMergeadas.find((r) => r.id === branchId);
  if (!branch) return;

  const nuevo = prompt(
    "Editar número de ticket (solo números):",
    branch.numeroTicket
  );

  if (nuevo === null) return;

  if (!/^\d+$/.test(nuevo.trim())) {
    showToast("El número de ticket debe contener solo números", 'error');
    return;
  }

  // Verificar duplicados
  if (app.ramasMergeadas.some((r) => r.id !== branchId && r.numeroTicket === nuevo.trim())) {
    showToast("Ya existe una rama con ese número de ticket", 'error');
    return;
  }

  branch.numeroTicket = nuevo.trim();
  branch.ticketCompleto = generateTicket(app.prefijoJira, branch.numeroTicket);

  // Guardar en MySQL
  await saveToMySQL('update_branch', {
    id: branchId,
    numeroTicket: branch.numeroTicket,
    ticketCompleto: branch.ticketCompleto,
    fechaMergeo: branch.fechaMergeo
  });

  renderApps($("#inputSearch").value);
  showToast(`Ticket actualizado a ${branch.ticketCompleto}`);
}

async function editBranchDate(appId, branchId, nuevaFecha) {
  const app = apps.find((a) => a.id === appId);
  if (!app) return;

  const branch = app.ramasMergeadas.find((r) => r.id === branchId);
  if (!branch) return;

  if (!nuevaFecha) {
    showToast("La fecha no puede estar vacía", 'error');
    return;
  }

  branch.fechaMergeo = nuevaFecha;

  // Guardar en MySQL
  await saveToMySQL('update_branch', {
    id: branchId,
    numeroTicket: branch.numeroTicket,
    ticketCompleto: branch.ticketCompleto,
    fechaMergeo: branch.fechaMergeo
  });

  renderApps($("#inputSearch").value);
  showToast("Fecha de mergeo actualizada");
}

async function deleteBranch(appId, branchId) {
  const app = apps.find((a) => a.id === appId);
  if (!app) return;

  // Guardar en MySQL
  await saveToMySQL('delete_branch', { id: branchId });

  app.ramasMergeadas = app.ramasMergeadas.filter((r) => r.id !== branchId);
  renderApps($("#inputSearch").value);
  showToast("Rama eliminada");
}

async function resetAppToPro(appId) {
  const app = apps.find((a) => a.id === appId);
  if (!app) return;

  // Verificar si hay ramas con warnings
  const warningBranches = app.ramasMergeadas.filter(r => r.hasWarning);

  if (warningBranches.length > 0) {
    // Mostrar popup con warnings
    let warningMessages = "⚠️ ADVERTENCIAS DETECTADAS:\n\n";
    warningBranches.forEach(branch => {
      warningMessages += `• ${branch.ticketCompleto}:\n  ${branch.warningComment || 'Sin comentario específico'}\n\n`;
    });
    warningMessages += "¿Continuar subiendo a PRO de todas formas?";

    if (!confirm(warningMessages)) {
      return; // Cancelar si el usuario no confirma
    }
  }

  // Continuar con la subida a PRO normal
  await saveToMySQL('deploy_to_pro', { applicationId: appId });

  app.ramasMergeadas = [];
  renderApps($("#inputSearch").value);
  showToast(`${app.nombre} subida a PRO - Ramas eliminadas`);
}

// -----------------------------
// Event Handlers
// -----------------------------
function setupEvents() {
  // Búsqueda con debounce
  let searchTimeout;
  $("#inputSearch").addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderApps(e.target.value);
    }, 300);
  });

  // Limpiar búsqueda
  $("#btnClearSearch").addEventListener("click", () => {
    $("#inputSearch").value = "";
    renderApps("");
    $("#inputSearch").focus();
  });

  // Formulario nueva aplicación
  $("#formAddApp").addEventListener("submit", async (e) => {
    e.preventDefault();
    showLoading(true);

    try {
      const nombre = $("#appNameInput").value;
      const ramaPrincipal = $("#appMainBranchInput").value;
      const prefijoJira = $("#appJiraPrefixInput").value;

      await addApplication({ nombre, ramaPrincipal, prefijoJira });

      // Cerrar modal y limpiar formulario
      const modal = bootstrap.Modal.getInstance($("#modalAddApp"));
      modal.hide();
      e.target.reset();
    } finally {
      showLoading(false);
    }

  });

  // Delegación de eventos para botones dinámicos
  $("#appsContainer").addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const appId = Number(btn.getAttribute("data-app"));
    const branchId = Number(btn.getAttribute("data-branch"));

    showLoading(true);

    try {
      switch (action) {
        case "add-branch":
          openAddBranchModal(appId);
          break;
        case "pro":
          openConfirmPro(appId);
          break;
        case "edit-branch-number":
          await editBranchNumber(appId, branchId);
          break;
        case "edit-date":
          openEditDateModal(appId, branchId);
          break;
        case "delete-branch":
          if (confirm("¿Estás seguro de eliminar esta rama?")) {
            await deleteBranch(appId, branchId);
          }
          break;
        case "delete-app":
          openConfirmDeleteApp(appId);
          break;
      }
    } finally {
      showLoading(false);
    }
  });

  // Edición inline
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches(".inline-edit")) {
      e.preventDefault();
      e.target.blur();
    }
  });

  document.addEventListener("blur", async (e) => {
    if (!e.target.matches(".inline-edit")) return;

    const appId = Number(e.target.getAttribute("data-app"));
    const field = e.target.getAttribute("data-field");
    const value = e.target.textContent;

    showLoading(true);
    try {
      await updateAppField(appId, field, value);
    } finally {
      showLoading(false);
    }
  }, true);

  // Formulario añadir rama
  $("#formAddBranch").addEventListener("submit", async (e) => {
    e.preventDefault();
    showLoading(true);

    try {
      const appId = Number($("#hiddenAddBranchAppId").value);
      const numero = $("#branchTicketNumberInput").value;
      const fecha = $("#branchMergeDateInput").value;
      const hasWarning = $("#branchWarningCheck").checked;
      const warningComment = $("#branchWarningComment").value;

      await addBranch(appId, numero, fecha, hasWarning, warningComment);

      const modal = bootstrap.Modal.getInstance($("#modalAddBranch"));
      modal.hide();
      e.target.reset();

      // Resetear warning fields
      $("#branchWarningCheck").checked = false;
      $("#warningCommentGroup").style.display = "none";
    } finally {
      showLoading(false);
    }
  });

  // Preview en añadir rama
  $("#branchTicketNumberInput").addEventListener("input", updateBranchPreview);
  $("#branchMergeDateInput").addEventListener("input", updateBranchPreview);

  // Formulario editar fecha
  $("#formEditDate").addEventListener("submit", async (e) => {
    e.preventDefault();
    showLoading(true);

    try {
      const appId = Number($("#hiddenEditDateAppId").value);
      const branchId = Number($("#hiddenEditDateBranchId").value);
      const nuevaFecha = $("#editDateInput").value;

      await editBranchDate(appId, branchId, nuevaFecha);

      const modal = bootstrap.Modal.getInstance($("#modalEditDate"));
      modal.hide();
    } finally {
      showLoading(false);
    }
  });

  // Confirmar subir a PRO
  $("#btnConfirmPro").addEventListener("click", async () => {
    showLoading(true);

    try {
      const appId = Number($("#hiddenProAppId").value);
      await resetAppToPro(appId);

      const modal = bootstrap.Modal.getInstance($("#modalConfirmPro"));
      modal.hide();
    } finally {
      showLoading(false);
    }
  });

  // Confirmar eliminar aplicación
  $("#btnConfirmDeleteApp").addEventListener("click", async () => {
    console.log("🔥 BOTÓN ELIMINAR PULSADO"); // ← AÑADIR ESTA LÍNEA
    showLoading(true);

    try {
      const appId = Number($("#hiddenDeleteAppId").value);
      console.log("🔥 App ID a eliminar:", appId); // ← AÑADIR ESTA LÍNEA
      await deleteApplication(appId);

      const modal = bootstrap.Modal.getInstance($("#modalConfirmDeleteApp"));
      modal.hide();
    } finally {
      showLoading(false);
    }
  });

  const btnDeleteApp = $("#btnConfirmDeleteApp");
  console.log("🔥 Botón eliminar encontrado:", btnDeleteApp); // ← AÑADIR
  if (!btnDeleteApp) {
    console.error("❌ No se encontró el botón #btnConfirmDeleteApp");
  }

  // Mostrar/ocultar comentario de warning
  $("#branchWarningCheck").addEventListener("change", (e) => {
    const commentGroup = $("#warningCommentGroup");
    if (e.target.checked) {
      commentGroup.style.display = "block";
      $("#branchWarningComment").focus();
    } else {
      commentGroup.style.display = "none";
      $("#branchWarningComment").value = "";
    }
  });
}

// -----------------------------
// Modal Functions
// -----------------------------
function openAddBranchModal(appId) {
  const app = apps.find((a) => a.id === appId);
  if (!app) return;

  $("#addBranchAppName").textContent = app.nombre;
  $("#addBranchPrefix").textContent = app.prefijoJira || "(sin prefijo)";
  $("#branchTicketNumberInput").value = "";
  $("#branchMergeDateInput").value = todayYYYYMMDD();
  $("#hiddenAddBranchAppId").value = String(app.id);

  updateBranchPreview();

  const modal = new bootstrap.Modal("#modalAddBranch");
  modal.show();

  // Focus en el campo de ticket
  setTimeout(() => $("#branchTicketNumberInput").focus(), 500);
}

function updateBranchPreview() {
  const appId = Number($("#hiddenAddBranchAppId").value || 0);
  const app = apps.find((a) => a.id === appId);
  const numero = $("#branchTicketNumberInput").value.trim();
  const fecha = $("#branchMergeDateInput").value;

  if (!numero) {
    $("#branchPreviewText").textContent = "Se creará: (introduce un número de ticket)";
    return;
  }

  const ticket = generateTicket(app?.prefijoJira || "", numero);
  const fechaTxt = fecha ? ` (${formatDDMMYYYY(fecha)})` : "";
  $("#branchPreviewText").textContent = `Se creará: ${ticket}${fechaTxt}`;
}

function openEditDateModal(appId, branchId) {
  const app = apps.find((a) => a.id === appId);
  if (!app) return;

  const branch = app.ramasMergeadas?.find((r) => r.id === branchId);
  if (!branch) return;

  $("#hiddenEditDateAppId").value = String(appId);
  $("#hiddenEditDateBranchId").value = String(branchId);
  $("#editDateInput").value = branch.fechaMergeo || todayYYYYMMDD();

  const modal = new bootstrap.Modal("#modalEditDate");
  modal.show();
}

function openConfirmPro(appId) {
  const app = apps.find((a) => a.id === appId);
  if (!app) return;

  $("#hiddenProAppId").value = String(appId);
  $("#confirmProText").textContent =
    `¿Estás seguro de subir "${app.nombre}" a PRO? Esto eliminará TODAS las ramas mergeadas de esta aplicación.`;

  const modal = new bootstrap.Modal("#modalConfirmPro");
  modal.show();
}

// Función para abrir el modal de confirmación
function openConfirmDeleteApp(appId) {
  const app = apps.find((a) => a.id === appId);
  if (!app) return;

  $("#hiddenDeleteAppId").value = String(appId);
  $("#confirmDeleteAppText").textContent =
    `¿Estás seguro de eliminar la aplicación "${app.nombre}"?`;

  const modal = new bootstrap.Modal("#modalConfirmDeleteApp");
  modal.show();
}

// Función para eliminar la aplicación
async function deleteApplication(appId) {
  const app = apps.find((a) => a.id === appId);
  if (!app) return;

  // Guardar en MySQL si está disponible
  await saveToMySQL('delete_app', { id: appId });

  // Eliminar del array local
  apps = apps.filter((a) => a.id !== appId);
  renderApps($("#inputSearch").value);
  showToast(`Aplicación "${app.nombre}" eliminada correctamente`);
}


// -----------------------------
// Initialization
// -----------------------------
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Iniciando Gestión de Ramas Git v6...");

  showLoading(true);

  try {
    // Intentar cargar datos desde MySQL
    const connected = await loadDataFromMySQL();

    if (connected) {
      showToast("✅ Conectado a MySQL - Datos sincronizados");
    } else {
      showToast("⚠️ Modo offline - Los cambios no se guardarán", 'error');
    }

    // Renderizar aplicaciones
    await renderApps("");

    // Configurar eventos
    setupEvents();

    console.log(`✅ Aplicación iniciada ${isConnectedToMySQL ? 'con MySQL' : 'en modo offline'}`);
    console.log(`📊 ${apps.length} aplicaciones cargadas`);

  } catch (error) {
    console.error("❌ Error iniciando aplicación:", error);
    showToast("Error al iniciar la aplicación", 'error');
  } finally {
    showLoading(false);
  }
});