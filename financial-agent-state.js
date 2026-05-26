/**
 * Financial Agent - State Management + Actions + Modal + Toast
 *
 * STATE: mutable copy of MOCK, persisted to localStorage
 * window.FA: namespace of all action handlers (called from onclick)
 * Modal/Toast: generic UI helpers
 *
 * All buttons in financial-agent-tabs.js should call FA.* functions.
 * After any state mutation, call rerender() to refresh the active tab.
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'fa_state_v1';

    // Initialize STATE - load from localStorage or clone MOCK
    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.kpis) return parsed;
            }
        } catch (e) { console.warn('State load failed:', e); }
        // Clone MOCK
        return JSON.parse(JSON.stringify(MOCK));
    }

    function saveState() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); } catch (e) {}
    }

    // Make STATE global so all tab renderers can use it
    window.STATE = loadState();

    // ============ RERENDER ============
    function rerender() {
        const activeBtn = document.querySelector('.nav-tab.active');
        if (!activeBtn) return;
        const tabName = activeBtn.dataset.tab;
        const content = document.getElementById('content');
        const renderer = TABS[tabName];
        if (renderer) {
            content.innerHTML = renderer();
            if (TABS[tabName + '_after']) TABS[tabName + '_after']();
        }
        saveState();
    }
    window.rerender = rerender;

    // ============ TOAST ============
    function toast(msg, type = 'info', durationMs = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        t.innerHTML = `<div class="toast-icon">${icons[type] || ''}</div><div class="toast-msg">${msg}</div>`;
        container.appendChild(t);
        setTimeout(() => {
            t.style.transition = 'opacity 0.3s, transform 0.3s';
            t.style.opacity = '0';
            t.style.transform = 'translateX(-20px)';
            setTimeout(() => t.remove(), 300);
        }, durationMs);
    }
    window.toast = toast;

    // ============ MODAL ============
    function openModal(title, bodyHtml, footerButtons = []) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = bodyHtml;
        const footer = document.getElementById('modalFooter');
        footer.innerHTML = '';
        footerButtons.forEach(btn => {
            const b = document.createElement('button');
            b.className = `btn ${btn.class || ''}`;
            b.textContent = btn.label;
            b.onclick = btn.onclick;
            footer.appendChild(b);
        });
        document.getElementById('modalOverlay').classList.add('visible');
        // Focus first input
        setTimeout(() => {
            const f = document.querySelector('#modalBody input, #modalBody select, #modalBody textarea');
            if (f) f.focus();
        }, 50);
    }
    function closeModal() {
        document.getElementById('modalOverlay').classList.remove('visible');
    }
    // Close modal on overlay click + Escape
    document.addEventListener('click', (e) => {
        if (e.target.id === 'modalOverlay') closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // ============ CONFIRM DIALOG ============
    function confirmModal(title, message, onConfirm, confirmLabel = 'אישור', danger = false) {
        openModal(title,
            `<p style="font-size: 14px; line-height: 1.6; color: var(--text);">${message}</p>`,
            [
                { label: 'ביטול', onclick: closeModal },
                { label: confirmLabel, class: danger ? 'danger' : 'primary', onclick: () => { closeModal(); onConfirm(); } },
            ]
        );
    }

    // ============ DETAILS MODAL ============
    function detailsModal(title, fields) {
        const html = fields.map(f =>
            `<div class="detail-row"><div class="detail-label">${f.label}</div><div class="detail-value">${f.value}</div></div>`
        ).join('');
        openModal(title, html, [{ label: 'סגור', onclick: closeModal }]);
    }

    // ============ HELPERS ============
    function genId(prefix = 'id') {
        return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    }
    function todayISO() {
        return new Date().toISOString().slice(0, 10);
    }
    function recomputeKpis() {
        // Update KPIs based on current state arrays
        const totalRevenue = STATE.income.reduce((s, r) => s + r.total, 0);
        const totalExpenses = STATE.expenses.reduce((s, r) => s + r.total, 0);
        const paid = STATE.income.filter(r => r.status === 'שולם').reduce((s, r) => s + r.total, 0);
        const openCol = STATE.income.filter(r => r.status !== 'שולם').reduce((s, r) => s + r.total, 0);
        STATE.kpis.revenue.value = totalRevenue;
        STATE.kpis.expenses.value = totalExpenses;
        STATE.kpis.profit.value = totalRevenue - totalExpenses;
        STATE.kpis.margin.value = totalRevenue > 0 ? +((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1) : 0;
        STATE.kpis.openCollections.value = openCol;
        STATE.kpis.openInvoices.value = STATE.income.filter(r => r.status !== 'שולם').length;
    }
    window.recomputeKpis = recomputeKpis;

    // ============ window.FA - all action handlers ============
    window.FA = {
        // Modal & toast (for general use)
        openModal, closeModal, toast, confirmModal, detailsModal,

        // ============ INCOME ============
        addIncome() {
            const today = todayISO();
            openModal('הכנסה חדשה', `
                <div class="form-row">
                    <div class="form-group"><label>תאריך</label><input id="m_date" type="date" value="${today}"></div>
                    <div class="form-group"><label>שם לקוח</label><input id="m_client" type="text" placeholder="שם הלקוח"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>שירות/מוצר</label><input id="m_service" type="text" placeholder="לדוגמה: ייעוץ אסטרטגי"></div>
                    <div class="form-group"><label>מקור</label><select id="m_source"><option>אורגני</option><option>Facebook</option><option>Google</option><option>LinkedIn</option><option>הפנייה</option><option>Instagram</option><option>אחר</option></select></div>
                </div>
                <div class="form-row cols-3">
                    <div class="form-group"><label>סכום לפני מע״מ (₪)</label><input id="m_preVat" type="number" step="0.01" placeholder="0"></div>
                    <div class="form-group"><label>שיעור מע״מ %</label><input id="m_vatPct" type="number" value="18"></div>
                    <div class="form-group"><label>אמצעי תשלום</label><select id="m_method"><option>העברה בנקאית</option><option>אשראי</option><option>צ׳ק</option><option>מזומן</option><option>הוראת קבע</option></select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>סטטוס</label><select id="m_status"><option>שולם</option><option>ממתין לתשלום</option><option>תשלום חלקי</option><option>באיחור</option></select></div>
                    <div class="form-group"><label>נציג מכירות</label><select id="m_rep"><option>יוסי כהן</option><option>רחל לוי</option><option>דנה אבן</option><option>-</option></select></div>
                </div>
                <div class="form-group"><label>הערות</label><textarea id="m_notes" rows="2"></textarea></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'שמור הכנסה', class: 'primary', onclick: () => {
                    const preVat = +(document.getElementById('m_preVat').value || 0);
                    const vatPct = +(document.getElementById('m_vatPct').value || 18);
                    const vat = +(preVat * vatPct / 100).toFixed(2);
                    const total = +(preVat + vat).toFixed(2);
                    const client = document.getElementById('m_client').value.trim();
                    if (!client || !preVat) { toast('שם לקוח וסכום חייבים', 'error'); return; }
                    STATE.income.unshift({
                        date: document.getElementById('m_date').value,
                        client, business: client,
                        source: document.getElementById('m_source').value,
                        service: document.getElementById('m_service').value || '-',
                        preVat, vat, total,
                        method: document.getElementById('m_method').value,
                        status: document.getElementById('m_status').value,
                        invoice: 'A2026-' + String(150 + STATE.income.length).padStart(4, '0'),
                        receipt: '-', dueDate: document.getElementById('m_date').value, paidDate: '-',
                        dealId: '-', rep: document.getElementById('m_rep').value, campaign: '-',
                        notes: document.getElementById('m_notes').value || '-', files: 0, reconciled: 'דורש בדיקה',
                    });
                    recomputeKpis();
                    closeModal(); rerender();
                    toast(`הכנסה של ₪${total.toLocaleString('he-IL')} מ-${client} נשמרה`, 'success');
                }},
            ]);
        },

        viewIncome(invoiceNum) {
            const r = STATE.income.find(x => x.invoice === invoiceNum);
            if (!r) return;
            detailsModal(`חשבונית ${r.invoice}`, [
                { label: 'תאריך', value: r.date },
                { label: 'לקוח', value: r.client },
                { label: 'עסק', value: r.business },
                { label: 'שירות', value: r.service },
                { label: 'סכום לפני מע״מ', value: '₪ ' + r.preVat.toLocaleString('he-IL') },
                { label: 'מע״מ', value: '₪ ' + r.vat.toLocaleString('he-IL') },
                { label: 'סכום כולל', value: '<strong>₪ ' + r.total.toLocaleString('he-IL') + '</strong>' },
                { label: 'אמצעי תשלום', value: r.method },
                { label: 'סטטוס', value: r.status },
                { label: 'תאריך פירעון', value: r.dueDate },
                { label: 'תאריך שולם', value: r.paidDate },
                { label: 'נציג', value: r.rep },
                { label: 'קמפיין', value: r.campaign },
                { label: 'התאמת בנק', value: r.reconciled },
                { label: 'הערות', value: r.notes || '-' },
            ]);
        },

        markPaid(invoiceNum) {
            const r = STATE.income.find(x => x.invoice === invoiceNum);
            if (!r) return;
            r.status = 'שולם';
            r.paidDate = todayISO();
            r.reconciled = 'מותאם ידנית';
            recomputeKpis();
            rerender();
            toast(`חשבונית ${invoiceNum} סומנה כשולמה`, 'success');
        },

        editIncome(invoiceNum) {
            const r = STATE.income.find(x => x.invoice === invoiceNum);
            if (!r) return;
            openModal(`עריכת חשבונית ${r.invoice}`, `
                <div class="form-row">
                    <div class="form-group"><label>לקוח</label><input id="e_client" type="text" value="${r.client}"></div>
                    <div class="form-group"><label>תאריך</label><input id="e_date" type="date" value="${r.date}"></div>
                </div>
                <div class="form-row cols-3">
                    <div class="form-group"><label>לפני מע״מ</label><input id="e_preVat" type="number" value="${r.preVat}"></div>
                    <div class="form-group"><label>מע״מ</label><input id="e_vat" type="number" value="${r.vat}"></div>
                    <div class="form-group"><label>סטטוס</label><select id="e_status">
                        ${['שולם','ממתין לתשלום','תשלום חלקי','באיחור','בוטל'].map(s => `<option ${r.status===s?'selected':''}>${s}</option>`).join('')}
                    </select></div>
                </div>
                <div class="form-group"><label>הערות</label><textarea id="e_notes" rows="2">${r.notes}</textarea></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'שמור', class: 'primary', onclick: () => {
                    r.client = document.getElementById('e_client').value;
                    r.date = document.getElementById('e_date').value;
                    r.preVat = +document.getElementById('e_preVat').value;
                    r.vat = +document.getElementById('e_vat').value;
                    r.total = r.preVat + r.vat;
                    r.status = document.getElementById('e_status').value;
                    r.notes = document.getElementById('e_notes').value;
                    recomputeKpis();
                    closeModal(); rerender();
                    toast('החשבונית עודכנה', 'success');
                }},
            ]);
        },

        matchIncomeToBank(invoiceNum) {
            const r = STATE.income.find(x => x.invoice === invoiceNum);
            if (!r) return;
            r.reconciled = 'מותאם ידנית';
            rerender();
            toast(`חשבונית ${invoiceNum} מותאמה לבנק ידנית`, 'success');
        },

        // ============ EXPENSES ============
        addExpense() {
            const today = todayISO();
            openModal('הוצאה חדשה', `
                <div class="form-row">
                    <div class="form-group"><label>תאריך</label><input id="m_date" type="date" value="${today}"></div>
                    <div class="form-group"><label>ספק</label><input id="m_supplier" type="text" placeholder="שם הספק"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>קטגוריה</label><select id="m_cat">
                        ${['פרסום','שיווק','שכר עובדים','פרילנסרים','ספקים','שכירות','משרד','תוכנות','אוטומציות','סליקה','עמלות','משפטי','רו״ח','ייעוץ','רכבים','נסיעות','ציוד','אירוח','החזרי לקוחות','הלוואות','מיסים','מע״מ','ביטוחים','אחר'].map(c => `<option>${c}</option>`).join('')}
                    </select></div>
                    <div class="form-group"><label>תת קטגוריה</label><input id="m_sub" type="text"></div>
                </div>
                <div class="form-row cols-3">
                    <div class="form-group"><label>לפני מע״מ (₪)</label><input id="m_preVat" type="number" step="0.01"></div>
                    <div class="form-group"><label>מע״מ %</label><input id="m_vatPct" type="number" value="18"></div>
                    <div class="form-group"><label>אמצעי</label><select id="m_method"><option>אשראי</option><option>העברה</option><option>הוראת קבע</option><option>מזומן</option><option>צ׳ק</option></select></div>
                </div>
                <div class="form-row cols-3">
                    <div class="form-group"><label>קבוע/משתנה</label><select id="m_recurring"><option>משתנה</option><option>קבועה</option></select></div>
                    <div class="form-group"><label>מוכרת?</label><select id="m_rec"><option>מוכרת</option><option>לא מוכרת</option></select></div>
                    <div class="form-group"><label>מחלקה</label><input id="m_dept" type="text" value="-"></div>
                </div>
                <div class="form-group"><label>הערות</label><textarea id="m_notes" rows="2"></textarea></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'שמור הוצאה', class: 'primary', onclick: () => {
                    const preVat = +(document.getElementById('m_preVat').value || 0);
                    const vatPct = +(document.getElementById('m_vatPct').value || 18);
                    const vat = +(preVat * vatPct / 100).toFixed(2);
                    const total = +(preVat + vat).toFixed(2);
                    const supplier = document.getElementById('m_supplier').value.trim();
                    if (!supplier || !preVat) { toast('ספק וסכום חייבים', 'error'); return; }
                    STATE.expenses.unshift({
                        date: document.getElementById('m_date').value,
                        supplier,
                        category: document.getElementById('m_cat').value,
                        sub: document.getElementById('m_sub').value || '-',
                        preVat, vat, total,
                        method: document.getElementById('m_method').value,
                        account: 'ויזה 4521',
                        recurring: document.getElementById('m_recurring').value,
                        recognized: document.getElementById('m_rec').value,
                        invoice: 'EXP-' + Date.now().toString().slice(-6),
                        file: 0, approver: 'רון',
                        dept: document.getElementById('m_dept').value,
                        project: '-', client: '-',
                        notes: document.getElementById('m_notes').value || '-',
                        reconciled: 'דורש בדיקה', unusual: 'תקין',
                    });
                    recomputeKpis();
                    closeModal(); rerender();
                    toast(`הוצאה של ₪${total.toLocaleString('he-IL')} ל-${supplier} נשמרה`, 'success');
                }},
            ]);
        },

        viewExpense(idx) {
            const r = STATE.expenses[idx];
            if (!r) return;
            detailsModal(`הוצאה ${r.invoice}`, [
                { label: 'תאריך', value: r.date },
                { label: 'ספק', value: r.supplier },
                { label: 'קטגוריה', value: r.category + (r.sub ? ' / ' + r.sub : '') },
                { label: 'לפני מע״מ', value: '₪ ' + r.preVat.toLocaleString('he-IL') },
                { label: 'מע״מ', value: '₪ ' + r.vat.toLocaleString('he-IL') },
                { label: 'סכום כולל', value: '<strong>₪ ' + r.total.toLocaleString('he-IL') + '</strong>' },
                { label: 'אמצעי', value: r.method },
                { label: 'חשבון', value: r.account },
                { label: 'קבוע/משתנה', value: r.recurring },
                { label: 'מוכרת?', value: r.recognized },
                { label: 'מחלקה', value: r.dept },
                { label: 'התאמת בנק', value: r.reconciled },
                { label: 'חריגה', value: r.unusual },
                { label: 'הערות', value: r.notes },
            ]);
        },

        editExpense(idx) {
            const r = STATE.expenses[idx];
            if (!r) return;
            openModal(`עריכת הוצאה ${r.invoice}`, `
                <div class="form-row">
                    <div class="form-group"><label>ספק</label><input id="e_supplier" type="text" value="${r.supplier}"></div>
                    <div class="form-group"><label>תאריך</label><input id="e_date" type="date" value="${r.date}"></div>
                </div>
                <div class="form-row cols-3">
                    <div class="form-group"><label>לפני מע״מ</label><input id="e_preVat" type="number" value="${r.preVat}"></div>
                    <div class="form-group"><label>מע״מ</label><input id="e_vat" type="number" value="${r.vat}"></div>
                    <div class="form-group"><label>חריגה</label><select id="e_unusual"><option ${r.unusual==='תקין'?'selected':''}>תקין</option><option ${r.unusual==='גבוהה'?'selected':''}>גבוהה</option></select></div>
                </div>
                <div class="form-group"><label>הערות</label><textarea id="e_notes" rows="2">${r.notes}</textarea></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'שמור', class: 'primary', onclick: () => {
                    r.supplier = document.getElementById('e_supplier').value;
                    r.date = document.getElementById('e_date').value;
                    r.preVat = +document.getElementById('e_preVat').value;
                    r.vat = +document.getElementById('e_vat').value;
                    r.total = r.preVat + r.vat;
                    r.unusual = document.getElementById('e_unusual').value;
                    r.notes = document.getElementById('e_notes').value;
                    recomputeKpis();
                    closeModal(); rerender();
                    toast('ההוצאה עודכנה', 'success');
                }},
            ]);
        },

        matchExpenseToBank(idx) {
            const r = STATE.expenses[idx];
            if (!r) return;
            r.reconciled = 'מותאם ידנית';
            rerender();
            toast('ההוצאה מותאמה לבנק', 'success');
        },

        // ============ COLLECTIONS ============
        createCollectionTask(clientName) {
            const c = STATE.collections.find(x => x.client === clientName);
            if (!c) return;
            STATE.tasks.unshift({
                title: `גבייה: ${clientName}`,
                priority: c.daysLate > 14 ? 'קריטית' : c.daysLate > 0 ? 'גבוהה' : 'בינונית',
                assignee: c.rep,
                due: todayISO(),
                status: 'חדש',
                related: 'גבייה - ' + clientName,
                amount: c.amount,
            });
            toast(`משימת גבייה ל-${clientName} נוצרה`, 'success');
            rerender();
        },

        markCollectionPaid(clientName) {
            const c = STATE.collections.find(x => x.client === clientName);
            if (!c) return;
            confirmModal('סימון כשולם', `האם הלקוח <strong>${clientName}</strong> שילם ₪${c.amount.toLocaleString('he-IL')}?`, () => {
                STATE.collections = STATE.collections.filter(x => x.client !== clientName);
                // Also update income record if exists
                const inc = STATE.income.find(x => x.client === clientName && x.status !== 'שולם');
                if (inc) { inc.status = 'שולם'; inc.paidDate = todayISO(); }
                recomputeKpis();
                rerender();
                toast(`גבייה מ-${clientName} סומנה כשולמה`, 'success');
            });
        },

        sendReminder(clientName) {
            toast(`תזכורת תשלום ל-${clientName} נשלחה (דמו - לא חובר ל-email/SMS עדיין)`, 'info', 4000);
        },

        addCollectionNote(clientName) {
            openModal(`הערה - ${clientName}`, `<div class="form-group"><label>הערה</label><textarea id="cn_note" rows="3" placeholder="הקלד הערה..."></textarea></div>`, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'שמור', class: 'primary', onclick: () => {
                    const note = document.getElementById('cn_note').value.trim();
                    if (!note) { closeModal(); return; }
                    const c = STATE.collections.find(x => x.client === clientName);
                    if (c) c.action = note;
                    closeModal(); rerender();
                    toast('הערה נשמרה', 'success');
                }},
            ]);
        },

        // ============ LOST MONEY / ALERTS ============
        createTaskFromInsight(idx, source) {
            const arr = source === 'lost' ? STATE.lost : STATE.alerts;
            const item = arr[idx];
            if (!item) return;
            STATE.tasks.unshift({
                title: item.title,
                priority: item.severity === 'critical' ? 'קריטית' : item.severity === 'high' ? 'גבוהה' : 'בינונית',
                assignee: 'רון',
                due: todayISO(),
                status: 'חדש',
                related: item.type || 'תובנת AI',
                amount: item.amount || null,
            });
            rerender();
            toast(`משימה נוצרה: "${item.title}"`, 'success');
        },

        resolveInsight(idx, source) {
            const arr = source === 'lost' ? STATE.lost : STATE.alerts;
            confirmModal('סמן כטופל', 'האם לסמן את התובנה כטופלת? היא תוסר מהרשימה.', () => {
                arr.splice(idx, 1);
                rerender();
                toast('סומן כטופל', 'success');
            });
        },

        dismissInsight(idx, source) {
            const arr = source === 'lost' ? STATE.lost : STATE.alerts;
            arr.splice(idx, 1);
            rerender();
            toast('נדחה', 'info');
        },

        // ============ TASKS ============
        addTask() {
            openModal('משימה פיננסית חדשה', `
                <div class="form-group"><label>כותרת</label><input id="t_title" type="text" placeholder="מה צריך לעשות?"></div>
                <div class="form-row cols-3">
                    <div class="form-group"><label>דחיפות</label><select id="t_priority"><option>קריטית</option><option>גבוהה</option><option selected>בינונית</option><option>נמוכה</option></select></div>
                    <div class="form-group"><label>אחראי</label><select id="t_assignee"><option>רון</option><option>יוסי כהן</option><option>רחל לוי</option><option>דנה אבן</option></select></div>
                    <div class="form-group"><label>תאריך יעד</label><input id="t_due" type="date" value="${todayISO()}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>קשור ל</label><input id="t_related" type="text" placeholder="לדוגמה: חשבונית X, לקוח Y"></div>
                    <div class="form-group"><label>סכום קשור (אופציונלי)</label><input id="t_amount" type="number" placeholder="0"></div>
                </div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'צור משימה', class: 'primary', onclick: () => {
                    const title = document.getElementById('t_title').value.trim();
                    if (!title) { toast('כותרת חייבת', 'error'); return; }
                    STATE.tasks.unshift({
                        title,
                        priority: document.getElementById('t_priority').value,
                        assignee: document.getElementById('t_assignee').value,
                        due: document.getElementById('t_due').value,
                        status: 'חדש',
                        related: document.getElementById('t_related').value || '-',
                        amount: +document.getElementById('t_amount').value || null,
                    });
                    closeModal(); rerender();
                    toast(`משימה "${title}" נוצרה`, 'success');
                }},
            ]);
        },

        completeTask(idx) {
            const t = STATE.tasks[idx];
            if (!t) return;
            t.status = 'הושלם';
            rerender();
            toast(`משימה "${t.title}" הושלמה`, 'success');
        },

        editTask(idx) {
            const t = STATE.tasks[idx];
            if (!t) return;
            openModal(`עריכת משימה`, `
                <div class="form-group"><label>כותרת</label><input id="e_title" type="text" value="${t.title}"></div>
                <div class="form-row cols-3">
                    <div class="form-group"><label>דחיפות</label><select id="e_priority">
                        ${['קריטית','גבוהה','בינונית','נמוכה'].map(p => `<option ${t.priority===p?'selected':''}>${p}</option>`).join('')}
                    </select></div>
                    <div class="form-group"><label>אחראי</label><input id="e_assignee" type="text" value="${t.assignee}"></div>
                    <div class="form-group"><label>סטטוס</label><select id="e_status">
                        ${['חדש','בטיפול','ממתין לאישור','הושלם','נדחה'].map(s => `<option ${t.status===s?'selected':''}>${s}</option>`).join('')}
                    </select></div>
                </div>
                <div class="form-group"><label>תאריך יעד</label><input id="e_due" type="date" value="${t.due}"></div>
            `, [
                { label: 'מחק משימה', class: 'danger', onclick: () => { STATE.tasks.splice(idx, 1); closeModal(); rerender(); toast('משימה נמחקה', 'info'); } },
                { label: 'ביטול', onclick: closeModal },
                { label: 'שמור', class: 'primary', onclick: () => {
                    t.title = document.getElementById('e_title').value;
                    t.priority = document.getElementById('e_priority').value;
                    t.assignee = document.getElementById('e_assignee').value;
                    t.status = document.getElementById('e_status').value;
                    t.due = document.getElementById('e_due').value;
                    closeModal(); rerender();
                    toast('משימה עודכנה', 'success');
                }},
            ]);
        },

        // ============ BANK RECONCILIATION ============
        approveBankMatch(idx) {
            const t = STATE.bankTx[idx];
            if (!t) return;
            t.status = 'מותאם ידנית';
            t.action = 'אושר';
            rerender();
            toast('התאמה אושרה', 'success');
        },

        rejectBankMatch(idx) {
            const t = STATE.bankTx[idx];
            if (!t) return;
            t.status = 'דורש בדיקה';
            t.suggested = '-';
            t.confidence = 0;
            rerender();
            toast('ההתאמה נדחתה', 'info');
        },

        manualBankMatch(idx) {
            const t = STATE.bankTx[idx];
            if (!t) return;
            openModal('התאמה ידנית', `
                <p style="font-size: 13px; color: var(--text-soft); margin-bottom: 14px;">
                    תנועה: ${t.desc} - ${t.party} - <strong>₪${Math.abs(t.amount).toLocaleString('he-IL')}</strong>
                </p>
                <div class="form-group"><label>בחר חשבונית/הוצאה תואמת</label>
                    <select id="bm_match">
                        ${(t.amount > 0 ? STATE.income : STATE.expenses).map((r, i) =>
                            `<option value="${r.invoice || i}">${r.invoice || 'EXP-' + i} - ${r.client || r.supplier} - ₪${r.total}</option>`
                        ).join('')}
                    </select>
                </div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'התאם', class: 'primary', onclick: () => {
                    const sel = document.getElementById('bm_match').value;
                    t.suggested = sel;
                    t.status = 'מותאם ידנית';
                    t.confidence = 100;
                    t.action = 'אושר ידנית';
                    closeModal(); rerender();
                    toast(`תנועה הותאמה ל-${sel}`, 'success');
                }},
            ]);
        },

        approveAllAutoBank() {
            const count = STATE.bankTx.filter(t => t.status === 'מותאם אוטומטית' && t.action !== 'אושר').length;
            STATE.bankTx.forEach(t => { if (t.status === 'מותאם אוטומטית') t.action = 'אושר'; });
            rerender();
            toast(`${count} התאמות אוטומטיות אושרו`, 'success');
        },

        // ============ DOCUMENTS ============
        viewDocument(idx) {
            const d = STATE.documents[idx];
            if (!d) return;
            detailsModal(d.name, [
                { label: 'סוג', value: d.type },
                { label: 'תאריך', value: d.date },
                { label: 'לקוח/ספק', value: d.entity },
                { label: 'סכום', value: d.amount ? '₪ ' + d.amount.toLocaleString('he-IL') : '-' },
                { label: 'מע״מ', value: d.vat ? '₪ ' + d.vat.toLocaleString('he-IL') : '-' },
                { label: 'מספר מסמך', value: d.number },
                { label: 'סטטוס חילוץ', value: d.status },
                { label: 'ביטחון', value: d.confidence + '%' },
            ]);
        },

        approveDocExtraction(idx) {
            const d = STATE.documents[idx];
            if (!d) return;
            d.status = 'חולץ אוטומטית';
            d.confidence = 100;
            rerender();
            toast('חילוץ הנתונים אושר', 'success');
        },

        editDocExtraction(idx) {
            toast('עריכת חילוץ - יבנה בשלב הבא', 'info');
        },

        // ============ REPORTS ============
        viewReport(name) {
            toast(`פותח דוח: ${name}`, 'info');
            // Could open a modal with the actual report content
            openModal(name, `
                <p style="font-size: 13px; line-height: 1.7; color: var(--text);">
                    הדוח <strong>${name}</strong> מציג את הנתונים הפיננסיים הרלוונטיים לתקופה הנבחרת.
                </p>
                <p style="font-size: 12px; color: var(--muted); margin-top: 10px;">
                    בשלב הבא ניתן יהיה לפתוח דוחות מלאים עם גרפים, טבלאות מפורטות ויכולת ייצוא ל-PDF.
                </p>
            `, [{ label: 'סגור', onclick: closeModal }]);
        },

        exportReportExcel(name) {
            FA.exportToExcel(name);
        },

        exportReportPDF(name) {
            toast(`ייצוא ${name} ל-PDF (יבנה בשלב הבא)`, 'info');
        },

        // ============ EXPORT TO EXCEL (real!) ============
        exportToExcel(sheetName) {
            if (typeof XLSX === 'undefined') { toast('SheetJS לא נטען', 'error'); return; }
            let data = [];
            let filename = 'export.xlsx';
            const map = {
                'הכנסות': () => { data = STATE.income; filename = 'הכנסות-' + todayISO() + '.xlsx'; },
                'הוצאות': () => { data = STATE.expenses; filename = 'הוצאות-' + todayISO() + '.xlsx'; },
                'גבייה': () => { data = STATE.collections; filename = 'גבייה-' + todayISO() + '.xlsx'; },
                'התראות': () => { data = STATE.alerts; filename = 'התראות-' + todayISO() + '.xlsx'; },
                'משימות': () => { data = STATE.tasks; filename = 'משימות-' + todayISO() + '.xlsx'; },
                'קמפיינים': () => { data = STATE.campaigns; filename = 'קמפיינים-' + todayISO() + '.xlsx'; },
            };
            if (map[sheetName]) map[sheetName]();
            else data = STATE.income;
            if (data.length === 0) { toast('אין נתונים לייצוא', 'warning'); return; }
            try {
                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Data');
                XLSX.writeFile(wb, filename);
                toast(`${filename} הורד למחשב`, 'success');
            } catch (e) {
                toast('שגיאה בייצוא: ' + e.message, 'error');
            }
        },

        // ============ IMPORT ============
        importFile(type) {
            const inp = document.createElement('input');
            inp.type = 'file';
            inp.accept = '.csv,.xlsx,.xls,.pdf';
            inp.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                toast(`קובץ "${file.name}" התקבל (${(file.size/1024).toFixed(1)} KB). פיענוח אוטומטי יבנה בשלב הבא.`, 'info', 4500);
            };
            inp.click();
        },

        // ============ FILTERS ============
        // Active filters per tab (kept in STATE so they persist)
        _initFilters() {
            if (!STATE._filters) STATE._filters = {};
        },
        setFilter(tab, key, value) {
            this._initFilters();
            if (!STATE._filters[tab]) STATE._filters[tab] = {};
            STATE._filters[tab][key] = value;
            rerender();
        },
        getFilter(tab, key, def = '') {
            return (STATE._filters && STATE._filters[tab] && STATE._filters[tab][key]) || def;
        },
        clearFilters(tab) {
            if (STATE._filters) delete STATE._filters[tab];
            rerender();
            toast('פילטרים אופסו', 'info');
        },

        // ============ MONTH PICKER (top bar) ============
        pickMonth() {
            const months = ['ינואר 2026','פברואר 2026','מרץ 2026','אפריל 2026','מאי 2026','יוני 2026','יולי 2026','אוגוסט 2026'];
            openModal('בחר חודש', `
                <div class="form-group"><label>חודש</label><select id="mp_month">
                    ${months.map(m => `<option ${m===STATE.currentMonth?'selected':''}>${m}</option>`).join('')}
                </select></div>
                <p style="font-size:11px; color:var(--muted); margin-top:8px;">הערה: שינוי החודש בדמו לא משנה את הנתונים. בגרסה האמיתית - הנתונים יסוננו לפי החודש.</p>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'בחר', class: 'primary', onclick: () => {
                    STATE.currentMonth = document.getElementById('mp_month').value;
                    closeModal(); rerender();
                    toast(`עברנו ל-${STATE.currentMonth}`, 'success');
                }},
            ]);
        },

        // Top action: picker - income or expense?
        _addTransactionPicker() {
            openModal('הוסף תנועה', `
                <p style="font-size:13px; color:var(--text-soft); margin-bottom: 16px;">איזה סוג תנועה תרצה להוסיף?</p>
                <div style="display:flex; gap:12px;">
                    <button class="btn success" style="flex:1; padding: 16px;" onclick="FA.closeModal(); FA.addIncome();">💵 הכנסה</button>
                    <button class="btn" style="flex:1; padding: 16px; border-right: 3px solid var(--accent);" onclick="FA.closeModal(); FA.addExpense();">💸 הוצאה</button>
                </div>
            `, []);
        },

        // ============ SETTINGS ============
        editSetting(key, label, current) {
            openModal(`עריכת: ${label}`, `
                <div class="form-group"><label>${label}</label><input id="s_val" type="text" value="${current}"></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'שמור', class: 'primary', onclick: () => {
                    if (!STATE.settings) STATE.settings = {};
                    STATE.settings[key] = document.getElementById('s_val').value;
                    closeModal(); rerender();
                    toast(`${label} עודכן`, 'success');
                }},
            ]);
        },

        toggleAlert(key) {
            if (!STATE.settings) STATE.settings = {};
            if (!STATE.settings.alerts) STATE.settings.alerts = {};
            STATE.settings.alerts[key] = !STATE.settings.alerts[key];
            rerender();
            toast(`התראה ${STATE.settings.alerts[key] ? 'הופעלה' : 'הושבתה'}`, 'info');
        },

        // ============ RESET (for demo) ============
        resetDemo() {
            confirmModal('איפוס נתונים', 'האם לחזור לנתוני הדמו המקוריים? כל השינויים שעשית יימחקו.', () => {
                localStorage.removeItem(STORAGE_KEY);
                window.STATE = JSON.parse(JSON.stringify(MOCK));
                rerender();
                toast('הנתונים אופסו לדמו המקורי', 'success');
            }, 'אפס', true);
        },

        // ============ CHAT (agentic) ============
        chatHistory: [],
        async sendChatMessage(text) {
            if (!text || !text.trim()) return;
            text = text.trim();
            FA.chatHistory.push({ role: 'user', content: text });
            FA._renderChat();
            FA._showTyping();

            try {
                // Build a compact state summary to give the agent context
                const stateSnapshot = {
                    month: STATE.currentMonth,
                    kpis: {
                        revenue: STATE.kpis.revenue.value,
                        expenses: STATE.kpis.expenses.value,
                        profit: STATE.kpis.profit.value,
                        margin: STATE.kpis.margin.value,
                        openCollections: STATE.kpis.openCollections.value,
                        openInvoices: STATE.kpis.openInvoices.value,
                    },
                    openCollections: STATE.collections.map(c => ({ client: c.client, amount: c.amount, daysLate: c.daysLate, status: c.status })),
                    topAlerts: STATE.alerts.slice(0, 3).map(a => ({ title: a.title, severity: a.severity, amount: a.amount })),
                    topLost: STATE.lost.slice(0, 3).map(l => ({ title: l.title, amount: l.amount })),
                    incomeCount: STATE.income.length,
                    expenseCount: STATE.expenses.length,
                    openTaskCount: STATE.tasks.filter(t => t.status !== 'הושלם').length,
                };

                const sysContext = `\n\n## מצב הסוכן הפיננסי - ${stateSnapshot.month}\n\`\`\`json\n${JSON.stringify(stateSnapshot, null, 2)}\n\`\`\`\n`;

                const messages = [
                    ...FA.chatHistory.slice(0, -1),
                    { role: 'user', content: text + sysContext },
                ];

                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages, agent_type: 'financial' }),
                });
                FA._hideTyping();
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: 'שגיאה' }));
                    FA.chatHistory.push({ role: 'assistant', content: `שגיאה: ${err.error || 'לא ידוע'}` });
                    FA._renderChat();
                    return;
                }
                const data = await res.json();
                const reply = data.message || '(אין תוכן)';
                FA.chatHistory.push({ role: 'assistant', content: reply });
                FA._renderChat();
                FA._processActions(reply);
            } catch (e) {
                FA._hideTyping();
                FA.chatHistory.push({ role: 'assistant', content: `שגיאת חיבור: ${e.message}` });
                FA._renderChat();
            }
        },

        // Parse [ACTION] blocks and execute them
        _processActions(text) {
            const actionRegex = /\[ACTION\]([\s\S]*?)\[\/ACTION\]/g;
            let m;
            let executed = 0;
            while ((m = actionRegex.exec(text)) !== null) {
                try {
                    const action = JSON.parse(m[1].trim());
                    if (FA._runAction(action)) executed++;
                } catch (e) { console.warn('Bad action:', m[1], e); }
            }
            if (executed > 0) toast(`${executed} פעולות בוצעו על ידי הסוכן`, 'success', 4000);
        },

        _runAction(action) {
            if (!action || !action.type) return false;
            switch (action.type) {
                case 'create_task':
                    STATE.tasks.unshift({
                        title: action.title || 'משימה מהסוכן',
                        priority: action.priority || 'בינונית',
                        assignee: action.assignee || 'רון',
                        due: action.due || todayISO(),
                        status: 'חדש',
                        related: action.related || 'מצוין על ידי הסוכן',
                        amount: action.amount || null,
                    });
                    return true;
                case 'mark_paid':
                    const r = STATE.income.find(x => x.client === action.client && x.status !== 'שולם');
                    if (r) {
                        r.status = 'שולם';
                        r.paidDate = todayISO();
                        STATE.collections = STATE.collections.filter(c => c.client !== action.client);
                        recomputeKpis();
                        return true;
                    }
                    return false;
                case 'dismiss_alert':
                    if (typeof action.index === 'number') {
                        STATE.alerts.splice(action.index, 1);
                        return true;
                    }
                    return false;
                default:
                    return false;
            }
        },

        _renderChat() {
            const box = document.getElementById('chatMsgs');
            if (!box) return;
            box.innerHTML = FA.chatHistory.map(m => {
                if (m.role === 'user') {
                    return `<div class="chat-msg user">${FA._escapeHtml(m.content.split('## מצב הסוכן')[0]).trim()}</div>`;
                } else {
                    // Render markdown-lite for bot, and strip [ACTION] blocks visually but show as cards
                    let text = m.content.replace(/\[ACTION\]([\s\S]*?)\[\/ACTION\]/g, (_, json) => {
                        try {
                            const a = JSON.parse(json.trim());
                            return `<div class="agent-action-card"><strong>✅ פעולה בוצעה: ${a.type === 'create_task' ? 'משימה חדשה' : a.type === 'mark_paid' ? 'סימון כשולם' : a.type}</strong>${a.title || a.client || ''}</div>`;
                        } catch { return ''; }
                    });
                    // Simple markdown
                    text = FA._escapeHtml(text);
                    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                    text = text.replace(/\n/g, '<br>');
                    return `<div class="chat-msg bot">${text}</div>`;
                }
            }).join('');
            box.scrollTop = box.scrollHeight;
        },

        _showTyping() {
            const box = document.getElementById('chatMsgs');
            if (!box) return;
            const t = document.createElement('div');
            t.className = 'chat-typing';
            t.id = 'chatTyping';
            t.innerHTML = '<span></span><span></span><span></span>';
            box.appendChild(t);
            box.scrollTop = box.scrollHeight;
        },
        _hideTyping() {
            const t = document.getElementById('chatTyping');
            if (t) t.remove();
        },
        _escapeHtml(s) {
            return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        },

        // Called when chat tab opens - proactive insights
        async proactiveOpen() {
            if (FA.chatHistory.length > 0) {
                FA._renderChat();
                return;
            }
            // Initial proactive message - run on first open
            await FA.sendChatMessage('פתחתי עכשיו את הצ׳אט הפיננסי. תן לי את 3 הדברים הכי חשובים שאני צריך לעשות היום על פי המצב.');
        },

        chatSuggestion(text) {
            document.getElementById('chatInput').value = text;
            FA.sendChatMessage(text);
            document.getElementById('chatInput').value = '';
        },
    };

    // Save on page hide
    window.addEventListener('beforeunload', saveState);
    setInterval(saveState, 10000); // periodic save

})();


