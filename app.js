// Supabase Client Initialization
const SUPABASE_URL = 'https://xrapcmiewsbtnflpzueb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXBjbWlld3NidG5mbHB6dWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzg0ODgsImV4cCI6MjA4ODkxNDQ4OH0.OeZ1s0kDkRCvgQZLM9H4L7xoF3k2I6cXh-cpD1J4dBI';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentRole = null;

// State
const state = {
    scores: {}, // item_id -> points earned
    photos: {}, // item_id -> [dataUrl, ...]
    selections: {}, // item_id -> 'green'|'yellow'|'red'
    observations: {}, // item_id -> text
};

// Configuration Management
function getAuditData() {
    const saved = localStorage.getItem('lottaAuditConfig');
    if (saved) return JSON.parse(saved);
    return JSON.parse(JSON.stringify(auditData)); // fallback to data.js original structure
}

const activeData = getAuditData();

document.addEventListener('DOMContentLoaded', () => {
    checkUser();

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Users Management
    document.getElementById('manageUsersBtn').addEventListener('click', openUsersModal);
    document.getElementById('closeUsersBtn').addEventListener('click', () => {
        document.getElementById('usersModal').classList.add('hidden');
    });
    document.getElementById('createUserForm').addEventListener('submit', handleCreateUser);

    document.getElementById('finishAuditBtn').addEventListener('click', finishAudit);
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        document.getElementById('reportModal').classList.add('hidden');
    });

    const genPdfBtn = document.getElementById('generatePdfBtn');
    if (genPdfBtn) genPdfBtn.addEventListener('click', generatePDFReport);

    // Admin Event Listeners
    document.getElementById('openAdminBtn').addEventListener('click', openAdmin);
    document.getElementById('closeAdminBtn').addEventListener('click', closeAdmin);
    document.getElementById('saveAdminBtn').addEventListener('click', saveAdmin);
    document.getElementById('resetAdminBtn').addEventListener('click', resetAdmin);
});

function renderApp() {
    const container = document.getElementById('sectorsContainer');
    container.innerHTML = '';

    activeData.sectors.forEach(sector => {
        const sectorEl = document.createElement('div');
        sectorEl.className = 'sector glass-card';

        const header = document.createElement('div');
        header.className = 'sector-header';
        header.innerHTML = `
            <div class="sector-title">${sector.name}</div>
            <div class="sector-score">Max: ${sector.maxScore} pts</div>
        `;
        sectorEl.appendChild(header);

        const itemList = document.createElement('div');
        itemList.className = 'item-list';

        sector.items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card glass-card';
            itemCard.id = `item-${item.id}`;
            itemCard.dataset.maxPoints = item.points;

            const hasRegular = item.yellow !== "N/C" && item.yellow.trim() !== "";

            itemCard.innerHTML = `
                <div class="item-header">
                    <div class="item-title">${item.name}</div>
                    <div class="item-points-badge">${item.points} pts max</div>
                </div>
                <div class="options-container">
                    <button class="option-btn green" onclick="selectOption('${item.id}', 'green', ${item.points})" data-item="${item.id}" data-type="green">
                        <div class="circle-icon"></div>
                        <div class="label">Bien</div>
                        <div class="desc" title="${item.green}">${item.green}</div>
                    </button>
                    ${hasRegular ? `
                    <button class="option-btn yellow" onclick="selectOption('${item.id}', 'yellow', ${item.points / 2})" data-item="${item.id}" data-type="yellow">
                        <div class="circle-icon"></div>
                        <div class="label">Reg</div>
                        <div class="desc" title="${item.yellow}">${item.yellow}</div>
                    </button>
                    ` : `
                    <button class="option-btn" disabled title="Opción regular no aplicable.">
                        <div class="circle-icon disabled-circle"></div>
                        <div class="label">N/A</div>
                        <div class="desc">No aplica opción regular</div>
                    </button>
                    `}
                    <button class="option-btn red" onclick="selectOption('${item.id}', 'red', 0)" data-item="${item.id}" data-type="red">
                        <div class="circle-icon"></div>
                        <div class="label">Mal</div>
                        <div class="desc" title="${item.red}">${item.red}</div>
                    </button>
                </div>
                <div class="observation-section" id="obs-sec-${item.id}">
                    <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Observaciones (Requerido para Reg/Mal)</label>
                    <textarea class="obs-textarea" placeholder="Escriba el motivo de la calificación..." oninput="updateObservation('${item.id}', this.value)"></textarea>
                    
                    <div class="photo-section" style="border-top: none; margin-top: 5px; padding-top: 0;">
                        <label class="photo-label">
                            <span>📷 Tomar Foto</span>
                            <input type="file" accept="image/*" capture="environment" onchange="handlePhotoUpload(event, '${item.id}')">
                        </label>
                        <label class="photo-label" style="background: rgba(59, 130, 246, 0.05); border-color: rgba(59, 130, 246, 0.2);">
                            <span>📁 Subir Galería</span>
                            <input type="file" accept="image/*" onchange="handlePhotoUpload(event, '${item.id}')">
                        </label>
                    </div>
                    <div class="photo-preview-container" id="photos-${item.id}" style="margin-top: 10px;"></div>
                </div>
            `;
            itemList.appendChild(itemCard);
        });

        sectorEl.appendChild(itemList);
        container.appendChild(sectorEl);
    });
}

function selectOption(itemId, status, points) {
    state.selections[itemId] = status;
    state.scores[itemId] = points;

    // UI Update
    const card = document.getElementById(`item-${itemId}`);
    card.dataset.status = status;

    const btns = card.querySelectorAll('.option-btn');
    btns.forEach(btn => btn.classList.remove('selected'));

    card.querySelector(`.option-btn.${status}`).classList.add('selected');

    const obsSec = document.getElementById(`obs-sec-${itemId}`);
    if (status === 'yellow' || status === 'red') {
        obsSec.classList.add('visible');
    } else {
        obsSec.classList.remove('visible');
        // Limpiamos la observación si se vuelve a verde
        state.observations[itemId] = '';
        const textarea = obsSec.querySelector('textarea');
        if (textarea) textarea.value = '';
    }

    updateTotalScore();
}

function updateObservation(itemId, text) {
    state.observations[itemId] = text;
}

function handlePhotoUpload(event, itemId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        if (!state.photos[itemId]) state.photos[itemId] = [];
        state.photos[itemId].push(e.target.result);

        renderPhotos(itemId);
    };
    reader.readAsDataURL(file);
}

function renderPhotos(itemId) {
    const container = document.getElementById(`photos-${itemId}`);
    container.innerHTML = '';

    if (state.photos[itemId]) {
        state.photos[itemId].forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.className = 'photo-thumb';
            // Click to remove or view large image could be added here
            container.appendChild(img);
        });
    }
}

function updateTotalScore() {
    let total = 0;

    let itemsEvaluated = 0;
    let totalItems = 0;
    activeData.sectors.forEach(s => totalItems += s.items.length);

    Object.values(state.scores).forEach(score => {
        total += score;
        itemsEvaluated++;
    });

    document.getElementById('totalScore').innerText = formatScore(total);

    const progress = (itemsEvaluated / totalItems) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
}

function formatScore(score) {
    return score % 1 === 0 ? score : score.toFixed(1);
}

let currentAuditId = null;

async function finishAudit() {
    let totalScore = 0;
    Object.values(state.scores).forEach(score => totalScore += score);

    const display = document.getElementById('finalScoreDisplay');
    display.innerText = `${formatScore(totalScore)}/100`;

    if (totalScore >= 80) {
        display.style.color = 'var(--green-color)';
        display.style.textShadow = '0 0 20px rgba(16, 185, 129, 0.5)';
    } else if (totalScore >= 50) {
        display.style.color = 'var(--yellow-color)';
        display.style.textShadow = '0 0 20px rgba(245, 158, 11, 0.5)';
    } else {
        display.style.color = 'var(--red-color)';
        display.style.textShadow = '0 0 20px rgba(239, 68, 68, 0.5)';
    }

    document.getElementById('reportModal').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Guardar en Supabase si hay un usuario logueado
    if (currentUser) {
        try {
            document.getElementById('reportDetails').innerText = "Guardando auditoría en el servidor...";
            const { data, error } = await supabaseClient
                .from('audits')
                .insert([
                    {
                        user_id: currentUser.id,
                        total_score: totalScore,
                        state: state
                    }
                ]).select();

            if (error) throw error;
            if (data && data.length > 0) currentAuditId = data[0].id;

            document.getElementById('reportDetails').innerText = "✅ Auditoría guardada exitosamente en el servidor.";
            document.getElementById('generatePdfBtn').style.display = 'inline-block'; // Show PDF button
        } catch (err) {
            console.error("Error al guardar:", err);
            document.getElementById('reportDetails').innerText = "❌ Error al guardar en el servidor: " + err.message;
        }
    }
}

async function generatePDFReport() {
    const btn = document.getElementById('generatePdfBtn');
    if (!btn) return;
    btn.innerText = 'Generando PDF...';
    btn.disabled = true;

    try {
        // Inicializar documento PDF puro (sin recortes de pantalla)
        const pdf = new window.jspdf.jsPDF();
        let yPos = 20;
        const margin = 15;
        const pageHeight = pdf.internal.pageSize.getHeight();

        const checkPageBreak = (spaceNeeded = 20) => {
            if (yPos + spaceNeeded > pageHeight - margin) {
                pdf.addPage();
                yPos = margin;
            }
        };

        const date = new Date().toLocaleDateString('es-AR');
        const userDisplay = (currentUser && currentUser.user_metadata && currentUser.user_metadata.name) ? currentUser.user_metadata.name : (currentUser ? currentUser.email : 'Auditador Local');

        let totalScore = 0;
        Object.values(state.scores).forEach(s => totalScore += s);

        // Header
        pdf.setFontSize(22);
        pdf.setTextColor(59, 130, 246); // Blue
        pdf.text('Reporte de Auditoría: Lotta Burgers', margin, yPos);
        yPos += 10;

        pdf.setFontSize(11);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Auditor: ${userDisplay} | Fecha: ${date}`, margin, yPos);
        yPos += 15;

        // Score Box
        pdf.setFillColor(241, 245, 249);
        pdf.roundedRect(margin, yPos, 180, 20, 3, 3, 'F');
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Puntaje Final: ${formatScore(totalScore)} / 100`, pageHeight / 4, yPos + 13);
        yPos += 30;

        pdf.setFontSize(14);
        pdf.text('Detalle de Puntos a Mejorar', margin, yPos);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos + 2, 195, yPos + 2);
        yPos += 15;

        let hasIssues = false;

        activeData.sectors.forEach(sector => {
            let sectorHeaderPrinted = false;

            sector.items.forEach(item => {
                const status = state.selections[item.id];
                if (status === 'yellow' || status === 'red') {
                    hasIssues = true;

                    if (!sectorHeaderPrinted) {
                        checkPageBreak();
                        pdf.setFontSize(12);
                        pdf.setFont(undefined, 'bold');
                        pdf.text(`Sector: ${sector.name}`, margin, yPos);
                        yPos += 10;
                        sectorHeaderPrinted = true;
                    }

                    checkPageBreak();
                    const statusText = status === 'yellow' ? '[REGULAR]' : '[MAL]';
                    const obs = state.observations[item.id] || 'Sin observaciones.';

                    pdf.setFontSize(11);
                    pdf.setFont(undefined, 'bold');
                    pdf.setTextColor(status === 'yellow' ? 217 : 220, status === 'yellow' ? 119 : 38, status === 'yellow' ? 6 : 38);
                    pdf.text(`${statusText} ${item.name}`, margin + 5, yPos);
                    yPos += 7;

                    pdf.setFontSize(10);
                    pdf.setFont(undefined, 'normal');
                    pdf.setTextColor(80, 80, 80);

                    const splitObs = pdf.splitTextToSize(`Observación: ${obs}`, 170);
                    pdf.text(splitObs, margin + 5, yPos);
                    yPos += (splitObs.length * 5) + 5;

                    // Si hay fotos, intentar agregarlas (podría fallar por CORS, lo evitamos con bloques try-catch aislados)
                    if (state.photos[item.id] && state.photos[item.id].length > 0) {
                        checkPageBreak(60);
                        let xOff = margin + 5;
                        state.photos[item.id].forEach(dataUrl => {
                            if (xOff > 150) { xOff = margin + 5; yPos += 55; }
                            try {
                                pdf.addImage(dataUrl, 'JPEG', xOff, yPos, 40, 40);
                                xOff += 45;
                            } catch (e) { console.error("Could not add image to pdf", e); }
                        });
                        yPos += 45;
                    }
                    yPos += 5;
                }
            });
        });

        if (!hasIssues) {
            pdf.setFontSize(12);
            pdf.setTextColor(6, 95, 70);
            pdf.text('¡Excelente! No se registraron puntos regulares ni malos en esta auditoría.', margin, yPos);
        }

        const filename = `Auditoria_Lotta_${new Date().getTime()}.pdf`;

        // 1. Descarga Local
        pdf.save(filename);

        // 2. Subida a Supabase
        if (currentUser && currentAuditId) {
            btn.innerText = '☁ Subiendo a la nube...';
            const pdfBlob = pdf.output('blob');
            const filePath = `${currentUser.id}/${filename}`;

            const { error: uploadError } = await supabaseClient.storage
                .from('audit_reports')
                .upload(filePath, pdfBlob, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: 'application/pdf'
                });

            if (uploadError) {
                alert("El PDF se descargó a tu computadora, pero hubo un error al guardarlo en la nube.");
            } else {
                const { data: publicUrlData } = supabaseClient.storage.from('audit_reports').getPublicUrl(filePath);
                if (publicUrlData) {
                    await supabaseClient.from('audits').update({ pdf_url: publicUrlData.publicUrl }).eq('id', currentAuditId);
                }
                document.getElementById('reportDetails').innerText = "✅ PDF descargado localmente y guardado en la nube.";
            }
        }
    } catch (e) {
        console.error("PDF engine crash:", e);
        alert("Ocurrió un error general creando el documento: " + e.message);
    } finally {
        btn.innerText = '📄 Descargar PDF';
        btn.disabled = false;
    }
}

/* =========================================
   Auth & Supabase Logic
   ========================================= */

async function checkUser() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;

        if (session) {
            currentUser = session.user;
            await fetchUserRole();
            document.getElementById('loginModal').classList.add('hidden');
            document.getElementById('logoutBtn').style.display = 'inline-flex';
            document.getElementById('sectorsContainer').style.display = 'flex';
            document.querySelector('.action-footer').style.display = 'flex';
            renderApp();
            updateTotalScore();
        } else {
            showLoginScreen();
        }
    } catch (err) {
        console.error("Auth init error:", err);
        showLoginScreen();
        const errEl = document.getElementById('loginError');
        errEl.innerText = "Error conectando con la base de datos: " + err.message;
        errEl.style.display = 'block';
    }
}

function showLoginScreen() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('manageUsersBtn').style.display = 'none';
    document.getElementById('openAdminBtn').style.display = 'none';

    // Hide main application areas so login is obvious
    document.getElementById('sectorsContainer').style.display = 'none';
    document.querySelector('.action-footer').style.display = 'none';
}

async function fetchUserRole() {
    const { data, error } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

    if (data) {
        currentRole = data.role;
        if (currentRole === 'admin') {
            document.getElementById('manageUsersBtn').style.display = 'inline-flex';
            document.getElementById('openAdminBtn').style.display = 'inline-flex';
        } else {
            document.getElementById('manageUsersBtn').style.display = 'none';
            document.getElementById('openAdminBtn').style.display = 'none';
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginSubmitBtn');
    const errorMsg = document.getElementById('loginError');

    btn.disabled = true;
    errorMsg.style.display = 'none';
    btn.innerText = 'Cargando...';

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: pass
    });

    if (error) {
        errorMsg.innerText = error.message;
        errorMsg.style.display = 'block';
        btn.disabled = false;
        btn.innerText = 'Ingresar';
    } else {
        checkUser();
        btn.disabled = false;
        btn.innerText = 'Ingresar';
    }
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    currentRole = null;

    // Clear state or reload
    window.location.reload();
}

/* =========================================
   User Management Logic
   ========================================= */

function openUsersModal() {
    document.getElementById('usersModal').classList.remove('hidden');
    document.getElementById('createUserMsg').style.display = 'none';
    document.getElementById('createUserForm').reset();
}

async function handleCreateUser(e) {
    e.preventDefault();
    const email = document.getElementById('newEmail').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    const btn = document.getElementById('createUserBtn');
    const msg = document.getElementById('createUserMsg');

    btn.disabled = true;
    btn.innerText = 'Creando...';
    msg.style.display = 'none';

    try {
        if (password.length < 6) {
            throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }

        // Call our Postgres Function configured for Admin user creation
        const { data, error } = await supabaseClient.rpc('admin_create_user', {
            email: email,
            password: password,
            user_role: role
        });

        if (error) throw error;

        msg.innerText = "✅ Usuario creado exitosamente.";
        msg.style.color = "var(--green-color)";
        msg.style.display = 'block';

        document.getElementById('createUserForm').reset();
    } catch (err) {
        msg.innerText = "Error: " + err.message;
        msg.style.color = "var(--red-color)";
        msg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerText = 'Crear Usuario';
    }
}

/* =========================================
   Admin Panel Logic
   ========================================= */

let adminTempData = null; // Memory map for editing modes

function openAdmin() {
    adminTempData = JSON.parse(JSON.stringify(activeData)); // Deep copy 
    renderAdminForm();
    document.getElementById('adminModal').classList.remove('hidden');
}

function closeAdmin() {
    document.getElementById('adminModal').classList.add('hidden');
    adminTempData = null; // Clean up memory
}

function renderAdminForm() {
    const container = document.getElementById('adminFormContainer');

    // Guardar el estado de los sectores expandidos actualmente
    const expandedSectors = [];
    container.querySelectorAll('.admin-sector-form.expanded').forEach(el => {
        expandedSectors.push(el.id);
    });

    container.innerHTML = '';

    adminTempData.sectors.forEach((sector, sIdx) => {
        const sectorId = `admin-sector-${sIdx}`;
        const sectorEl = document.createElement('div');
        sectorEl.className = 'admin-sector-form';
        sectorEl.id = sectorId;

        if (expandedSectors.includes(sectorId)) {
            sectorEl.classList.add('expanded');
        }

        const header = document.createElement('div');
        header.className = 'admin-sector-header';
        header.innerHTML = `
            <div class="admin-sector-title"><span class="icon">▶</span> ${sector.name}</div>
            <div class="admin-sector-max-container" onclick="event.stopPropagation()">
                Max Pts: 
                <input type="number" step="0.5" class="admin-sector-max-input" data-sidx="${sIdx}" value="${sector.maxScore}">
            </div>
        `;
        header.onclick = () => {
            sectorEl.classList.toggle('expanded');
        };
        sectorEl.appendChild(header);

        const itemsList = document.createElement('div');
        itemsList.className = 'admin-items-list';

        sector.items.forEach((item, iIdx) => {
            const itemRow = document.createElement('div');
            itemRow.className = 'admin-item-row';
            itemRow.innerHTML = `
                <div class="admin-item-top">
                    <div class="admin-item-name" contenteditable="true" oninput="updateItemName(${sIdx}, ${iIdx}, this.innerText)" title="Haga clic para editar nombre" style="border-bottom: 1px dashed rgba(0,0,0,0.2); cursor: text;">${item.name}</div>
                    <input type="number" step="0.5" class="admin-item-input" data-sidx="${sIdx}" data-iidx="${iIdx}" value="${item.points}">
                </div>
                <div class="admin-desc-container">
                    <div class="admin-desc-box">
                        <span class="admin-desc-label">Bien</span>
                        <textarea class="admin-desc-input green" onchange="updateItemDesc(${sIdx}, ${iIdx}, 'green', this.value)">${item.green}</textarea>
                    </div>
                    <div class="admin-desc-box">
                        <span class="admin-desc-label">Reg (N/C omitir)</span>
                        <textarea class="admin-desc-input yellow" onchange="updateItemDesc(${sIdx}, ${iIdx}, 'yellow', this.value)">${item.yellow}</textarea>
                    </div>
                    <div class="admin-desc-box">
                        <span class="admin-desc-label">Mal</span>
                        <textarea class="admin-desc-input red" onchange="updateItemDesc(${sIdx}, ${iIdx}, 'red', this.value)">${item.red}</textarea>
                    </div>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-del-btn" onclick="deleteAdminItem(${sIdx}, ${iIdx})">Eliminar Ítem</button>
                </div>
            `;
            itemsList.appendChild(itemRow);
        });

        const addBtn = document.createElement('button');
        addBtn.className = 'admin-add-item-btn';
        addBtn.innerText = '+ Agregar Ítem';
        addBtn.onclick = () => addAdminItem(sIdx);
        itemsList.appendChild(addBtn);

        sectorEl.appendChild(itemsList);
        container.appendChild(sectorEl);
    });

    // Attach event listeners for inputs to trigger live validation
    container.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', validateAdminForm);
    });

    validateAdminForm(); // Trigger initial check
}

function validateAdminForm() {
    const inputs = document.querySelectorAll('.admin-sector-max-input');
    let totalSectors = 0;

    document.getElementById('adminErrorMsg').innerText = '';
    document.getElementById('saveAdminBtn').disabled = true;
    let allValid = true;

    inputs.forEach(input => {
        const val = parseFloat(input.value) || 0;
        totalSectors += val;

        const sIdx = input.dataset.sidx;
        const itemInputs = document.querySelectorAll(`.admin-item-input[data-sidx="${sIdx}"]`);

        let itemsSum = 0;
        itemInputs.forEach(ii => itemsSum += parseFloat(ii.value) || 0);

        // Allowed tolerance of 0.01 for floating point weirdness
        const sectorForm = document.getElementById(`admin-sector-${sIdx}`);
        if (Math.abs(itemsSum - val) > 0.01) {
            sectorForm.classList.add('error');
            itemInputs.forEach(ii => ii.classList.add('error'));
            allValid = false;
        } else {
            sectorForm.classList.remove('error');
            itemInputs.forEach(ii => ii.classList.remove('error'));
        }

        // Safely update temp data reference continuously
        adminTempData.sectors[sIdx].maxScore = val;
        itemInputs.forEach(ii => {
            adminTempData.sectors[sIdx].items[ii.dataset.iidx].points = parseFloat(ii.value) || 0;
        });
    });

    const ind = document.getElementById('adminTotalIndicator');
    document.getElementById('adminSectorsTotal').innerText = totalSectors;

    if (Math.abs(totalSectors - 100) > 0.01) {
        ind.className = 'admin-total-indicator invalid';
        allValid = false;
    } else {
        ind.className = 'admin-total-indicator valid';
    }

    if (!allValid) {
        document.getElementById('adminErrorMsg').innerText = 'El total general debe dar 100 y la suma interna de cada sector (en rojo) debe coincidir con su puntaje máximo.';
        document.getElementById('saveAdminBtn').disabled = true;
        document.getElementById('saveAdminBtn').style.opacity = '0.5';
        document.getElementById('saveAdminBtn').style.cursor = 'not-allowed';
    } else {
        document.getElementById('saveAdminBtn').disabled = false;
        document.getElementById('saveAdminBtn').style.opacity = '1';
        document.getElementById('saveAdminBtn').style.cursor = 'pointer';
    }
}

function saveAdmin() {
    if (document.getElementById('saveAdminBtn').disabled) return;

    localStorage.setItem('lottaAuditConfig', JSON.stringify(adminTempData));
    window.location.reload(); // Reloads app dynamically pulling activeData from local storage
}

function resetAdmin() {
    if (confirm('¿Seguro que querés restablecer todos los puntajes a la versión original de Excel? Vas a perder los pesos alterados.')) {
        localStorage.removeItem('lottaAuditConfig');
        window.location.reload();
    }
}

function updateItemName(sIdx, iIdx, newName) {
    adminTempData.sectors[sIdx].items[iIdx].name = newName;
}

function updateItemDesc(sIdx, iIdx, type, text) {
    adminTempData.sectors[sIdx].items[iIdx][type] = text;
}

function deleteAdminItem(sIdx, iIdx) {
    if (confirm('¿Seguro que querés eliminar este ítem? Deberás reasignar los puntos faltantes.')) {
        adminTempData.sectors[sIdx].items.splice(iIdx, 1);
        renderAdminForm();
    }
}

function addAdminItem(sIdx) {
    const defaultId = 'new_' + Date.now();
    adminTempData.sectors[sIdx].items.push({
        id: defaultId,
        points: 0,
        name: 'Nuevo Ítem',
        green: 'Descripción para bien...',
        yellow: 'N/C',
        red: 'Descripción para mal...'
    });
    renderAdminForm();
}
