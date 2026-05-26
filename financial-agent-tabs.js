/**
 * Financial Agent - Tab Renderers (FULLY WIRED)
 * Every button has an onclick handler calling window.FA.*
 * Reads from STATE (which is mutable and persisted via state.js)
 * Filters actually filter. Modals open. Toasts fire. Excel exports work.
 */

// ============ HELPER FUNCTIONS ============
function statusPill(status) {
    const map = {
        'שולם': 'success', 'ממתין לתשלום': 'warning', 'ממתין': 'warning',
        'באיחור': 'error', 'באיחור קריטי': 'error',
        'תשלום חלקי': 'info', 'בוטל': 'neutral', 'זיכוי': 'neutral',
        'בהתאמה': 'info', 'לא תואם בנק': 'warning', 'דורש בדיקה': 'warning',
        'מותאם': 'success', 'מותאם אוטומטית': 'success', 'מותאם ידנית': 'success',
        'דורש אישור': 'warning', 'לא נמצא מקור': 'error', 'חשד לכפילות': 'error',
        'חולץ אוטומטית': 'success', 'בעיבוד': 'info',
        'חדש': 'info', 'בטיפול': 'warning', 'ממתין לאישור': 'warning',
        'הושלם': 'success', 'נדחה': 'neutral',
        'קריטית': 'error', 'גבוהה': 'warning', 'בינונית': 'info', 'נמוכה': 'neutral',
        'רווחי': 'success', 'רווחי מאוד': 'success', 'מצוין': 'success', 'מעולה': 'success',
        'מפסיד': 'error', 'גבולי': 'warning',
        'תקין': 'success',
        'מעודכן': 'success', 'ישן': 'warning',
    };
    return `<span class="pill ${map[status] || 'neutral'}">${status}</span>`;
}

function severityPill(s) {
    const map = { 'critical': 'error', 'high': 'warning', 'medium': 'info', 'low': 'neutral' };
    const label = { 'critical': 'קריטי', 'high': 'גבוה', 'medium': 'בינוני', 'low': 'נמוך' };
    return `<span class="pill ${map[s] || 'neutral'}">${label[s] || s}</span>`;
}

// ============ 1. DASHBOARD ============
TABS.dashboard = () => {
    recomputeKpis();
    const k = STATE.kpis;
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">סיכום AI - מה הסוכן רואה החודש</div>
            <div class="ai-insight">העסק הכניס החודש <strong>${fmt(k.revenue.value)}</strong> אבל הרווחיות עומדת על <strong>${fmtPct(k.margin.value)}</strong>. ההוצאות עלו ב-${k.expenses.trend > 0 ? '+' : ''}${k.expenses.trend}% מהחודש הקודם.</div>
            <div class="ai-insight">יש כרגע <strong>${fmt(k.openCollections.value)}</strong> שעדיין לא נגבו מ-${k.openInvoices.value} לקוחות. זה משפיע ישירות על התזרים.</div>
            <div class="ai-insight">לפי קצב ההכנסות הנוכחי העסק צפוי לסיים את החודש עם <strong>${fmt(k.forecastRevenue.value)}</strong> הכנסות ו-<strong>${fmt(k.forecastProfit.value)}</strong> רווח משוער.</div>
            <div style="margin-top: 12px; display: flex; gap: 8px;">
                <button class="btn xs primary" onclick="switchTab('chat')">💬 דבר עם הסוכן</button>
                <button class="btn xs" onclick="switchTab('alerts')">🔔 צפה בהתראות</button>
                <button class="btn xs" onclick="switchTab('lost')">🔍 כסף אבוד</button>
            </div>
        </div>

        <div class="grid grid-cols-4" style="margin-bottom: 14px;">
            <div class="kpi" onclick="switchTab('income')" style="cursor:pointer">
                <div class="kpi-label">סך הכנסות החודש</div>
                <div class="kpi-value">${fmt(k.revenue.value)}</div>
                ${trend(k.revenue.trend)} <span class="kpi-meta">מאפריל ${fmt(k.revenue.prev)}</span>
            </div>
            <div class="kpi" onclick="switchTab('expenses')" style="cursor:pointer">
                <div class="kpi-label">סך הוצאות החודש</div>
                <div class="kpi-value">${fmt(k.expenses.value)}</div>
                ${trend(k.expenses.trend)} <span class="kpi-meta">מאפריל ${fmt(k.expenses.prev)}</span>
            </div>
            <div class="kpi">
                <div class="kpi-label">רווח נקי משוער</div>
                <div class="kpi-value" style="color: ${k.profit.value >= 0 ? 'var(--success)' : 'var(--error)'};">${fmt(k.profit.value)}</div>
                ${trend(k.profit.trend)} <span class="kpi-meta">מאפריל ${fmt(k.profit.prev)}</span>
            </div>
            <div class="kpi">
                <div class="kpi-label">אחוז רווחיות</div>
                <div class="kpi-value">${fmtPct(k.margin.value)}</div>
                ${trend(k.margin.trend)} <span class="kpi-meta">מאפריל ${fmtPct(k.margin.prev)}</span>
            </div>
        </div>

        <div class="grid grid-cols-4" style="margin-bottom: 14px;">
            <div class="kpi"><div class="kpi-label">תזרים זמין</div><div class="kpi-value">${fmt(k.cash.value)}</div>${trend(k.cash.trend)} <span class="kpi-meta">יתרת בנק נטו</span></div>
            <div class="kpi" onclick="switchTab('collections')" style="cursor:pointer"><div class="kpi-label">גבייה פתוחה</div><div class="kpi-value" style="color: var(--warning);">${fmt(k.openCollections.value)}</div>${trend(k.openCollections.trend)} <span class="kpi-meta">${k.openInvoices.value} חשבוניות פתוחות</span></div>
            <div class="kpi"><div class="kpi-label">הוצאות חריגות</div><div class="kpi-value" style="color: var(--error);">${fmt(k.unusualExpenses.value)}</div>${trend(k.unusualExpenses.trend)} <span class="kpi-meta">דורש בדיקה</span></div>
            <div class="kpi"><div class="kpi-label">תקציב פרסום מול הכנסות</div><div class="kpi-value">${fmtPct(k.adRatio.value)}</div>${trend(k.adRatio.trend)} <span class="kpi-meta">בנצ׳מארק: 10-15%</span></div>
        </div>

        <div class="grid grid-cols-4" style="margin-bottom: 24px;">
            <div class="kpi"><div class="kpi-label">עלות ליד (CPL)</div><div class="kpi-value">${fmt(k.cpl.value)}</div>${trend(k.cpl.trend)} <span class="kpi-meta">השתפר מ-${fmt(k.cpl.prev)}</span></div>
            <div class="kpi"><div class="kpi-label">עלות לקוח (CAC)</div><div class="kpi-value">${fmt(k.cac.value)}</div>${trend(k.cac.trend)} <span class="kpi-meta">מ-${fmt(k.cac.prev)}</span></div>
            <div class="kpi"><div class="kpi-label">צפי הכנסות סוף חודש</div><div class="kpi-value" style="color: var(--accent);">${fmt(k.forecastRevenue.value)}</div><span class="kpi-trend flat">תרחיש ריאלי</span></div>
            <div class="kpi"><div class="kpi-label">צפי רווח סוף חודש</div><div class="kpi-value" style="color: var(--success);">${fmt(k.forecastProfit.value)}</div><span class="kpi-trend flat">תרחיש ריאלי</span></div>
        </div>

        <div class="grid grid-cols-2" style="margin-bottom: 24px;">
            <div class="card">
                <div class="card-h"><div><div class="card-title">הכנסות מול הוצאות</div><div class="card-subtitle">6 חודשים אחרונים</div></div></div>
                <div class="vbar-chart">
                    ${[{m:'דצמ׳',i:145,e:102},{m:'ינו׳',i:158,e:110},{m:'פבר׳',i:162,e:105},{m:'מרץ',i:175,e:119},{m:'אפר׳',i:170,e:107},{m:'מאי',i:Math.round(k.revenue.value/1000),e:Math.round(k.expenses.value/1000)}].map(d => `
                        <div class="vbar-col">
                            <div class="vbar-group">
                                <div class="vbar income" style="height: ${d.i / 2}%;" title="הכנסות ₪${(d.i*1000).toLocaleString('he-IL')}"></div>
                                <div class="vbar expense" style="height: ${d.e / 2}%;" title="הוצאות ₪${(d.e*1000).toLocaleString('he-IL')}"></div>
                            </div>
                            <div class="vbar-label">${d.m}</div>
                        </div>
                    `).join('')}
                </div>
                <div style="display: flex; gap: 16px; margin-top: 12px; font-size: 11px;">
                    <span><span style="display:inline-block; width:10px; height:10px; background:var(--success); border-radius:2px; margin-left:5px;"></span>הכנסות</span>
                    <span><span style="display:inline-block; width:10px; height:10px; background:var(--accent); border-radius:2px; margin-left:5px;"></span>הוצאות</span>
                </div>
            </div>

            <div class="card">
                <div class="card-h"><div><div class="card-title">חלוקת הוצאות לפי קטגוריה</div><div class="card-subtitle">${STATE.currentMonth}</div></div></div>
                <div class="bar-chart">
                    ${(function() {
                        const byCat = {};
                        STATE.expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.total; });
                        const sorted = Object.entries(byCat).sort((a,b) => b[1]-a[1]).slice(0,8);
                        const max = sorted[0] ? sorted[0][1] : 1;
                        const colors = ['var(--accent)','var(--info)','var(--success)','var(--warning)','var(--text-soft)','var(--muted)','var(--error)','var(--text-soft)'];
                        return sorted.map((it, i) => `
                            <div class="bar-row">
                                <div class="bar-label">${it[0]}</div>
                                <div class="bar-track"><div class="bar-fill" style="width: ${it[1]/max*100}%; background: ${colors[i]};"></div></div>
                                <div class="bar-value">${fmt(Math.round(it[1]))}</div>
                            </div>
                        `).join('');
                    })()}
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2">
            <div>
                <div class="section-title" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>פעולות מומלצות</span>
                    <button class="btn xs" onclick="switchTab('lost')">צפה בכל →</button>
                </div>
                ${STATE.lost.slice(0, 4).map((item, i) => `
                    <div class="action-card priority-${item.severity}">
                        <div class="action-card-h">
                            <div class="action-card-title">${item.title}</div>
                            <strong style="color: var(--error); font-variant-numeric: tabular-nums;">${fmt(item.amount)}</strong>
                        </div>
                        <div class="action-card-desc">${item.action}</div>
                        <div class="action-card-meta">
                            <span>📊 ${item.type}</span>
                            <span>🎯 ביטחון ${item.confidence}%</span>
                        </div>
                        <div class="action-card-buttons">
                            <button class="btn xs primary" onclick="FA.createTaskFromInsight(${i},'lost')">צור משימה</button>
                            <button class="btn xs success" onclick="FA.resolveInsight(${i},'lost')">סמן כטופל</button>
                            <button class="btn xs" onclick="FA.dismissInsight(${i},'lost')">דחה</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div>
                <div class="section-title" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>התראות חמות</span>
                    <button class="btn xs" onclick="switchTab('alerts')">צפה בכל →</button>
                </div>
                ${STATE.alerts.slice(0, 4).map((a, i) => `
                    <div class="action-card priority-${a.severity}">
                        <div class="action-card-h">
                            <div class="action-card-title">${a.title}</div>
                            ${severityPill(a.severity)}
                        </div>
                        <div class="action-card-desc">${a.desc}</div>
                        <div class="action-card-meta">
                            <span>💰 ${fmt(a.amount)}</span>
                            <span>🏷️ ${a.entity}</span>
                            <span>📅 ${a.date}</span>
                        </div>
                        <div class="action-card-buttons">
                            <button class="btn xs primary" onclick="FA.createTaskFromInsight(${i},'alerts')">צור משימה</button>
                            <button class="btn xs success" onclick="FA.resolveInsight(${i},'alerts')">סמן כטופל</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

// ============ 2. INCOME ============
TABS.income = () => {
    const fSearch = FA.getFilter('income', 'search', '').toLowerCase();
    const fStatus = FA.getFilter('income', 'status', '');
    const fSource = FA.getFilter('income', 'source', '');
    const fRep = FA.getFilter('income', 'rep', '');

    const filtered = STATE.income.filter(r => {
        if (fSearch && !(r.client.toLowerCase().includes(fSearch) || r.invoice.toLowerCase().includes(fSearch) || (r.service||'').toLowerCase().includes(fSearch))) return false;
        if (fStatus && r.status !== fStatus) return false;
        if (fSource && r.source !== fSource) return false;
        if (fRep && r.rep !== fRep) return false;
        return true;
    });

    const totalAll = STATE.income.reduce((s, r) => s + r.total, 0);
    const totalPaid = STATE.income.filter(r => r.status === 'שולם').reduce((s, r) => s + r.total, 0);
    const totalOpen = STATE.income.filter(r => r.status !== 'שולם').reduce((s, r) => s + r.total, 0);
    const avg = STATE.income.length ? Math.round(totalAll / STATE.income.length) : 0;

    return `
        <div class="grid grid-cols-4" style="margin-bottom: 18px;">
            <div class="kpi"><div class="kpi-label">סך הכנסות</div><div class="kpi-value">${fmt(totalAll)}</div><span class="kpi-meta">${STATE.income.length} תנועות</span></div>
            <div class="kpi"><div class="kpi-label">שולם בפועל</div><div class="kpi-value" style="color: var(--success);">${fmt(totalPaid)}</div><span class="kpi-meta">${totalAll>0?Math.round(totalPaid/totalAll*100):0}% מהסכום</span></div>
            <div class="kpi"><div class="kpi-label">פתוח לגבייה</div><div class="kpi-value" style="color: var(--warning);">${fmt(totalOpen)}</div><span class="kpi-meta">${STATE.income.filter(r=>r.status!=='שולם').length} חשבוניות</span></div>
            <div class="kpi"><div class="kpi-label">ממוצע לעסקה</div><div class="kpi-value">${fmt(avg)}</div><span class="kpi-meta">חודש נוכחי</span></div>
        </div>

        <div class="table-wrap">
            <div class="table-toolbar">
                <h3>הכנסות - ${STATE.currentMonth} ${filtered.length !== STATE.income.length ? `(מסונן: ${filtered.length}/${STATE.income.length})` : ''}</h3>
                <div class="filter-row">
                    <input class="filter-input" placeholder="🔍 חיפוש לקוח/חשבונית" value="${fSearch}" oninput="FA.setFilter('income','search',this.value)"/>
                    <select class="filter-select" onchange="FA.setFilter('income','status',this.value)">
                        <option value="">כל הסטטוסים</option>
                        ${['שולם','ממתין לתשלום','תשלום חלקי','באיחור','בוטל'].map(s => `<option ${s===fStatus?'selected':''}>${s}</option>`).join('')}
                    </select>
                    <select class="filter-select" onchange="FA.setFilter('income','source',this.value)">
                        <option value="">כל המקורות</option>
                        ${[...new Set(STATE.income.map(r=>r.source))].map(s => `<option ${s===fSource?'selected':''}>${s}</option>`).join('')}
                    </select>
                    <select class="filter-select" onchange="FA.setFilter('income','rep',this.value)">
                        <option value="">כל הנציגים</option>
                        ${[...new Set(STATE.income.map(r=>r.rep))].map(s => `<option ${s===fRep?'selected':''}>${s}</option>`).join('')}
                    </select>
                    ${fSearch||fStatus||fSource||fRep ? `<button class="btn sm" onclick="FA.clearFilters('income')">✕ נקה</button>` : ''}
                    <button class="btn sm" onclick="FA.exportToExcel('הכנסות')">📊 ייצא Excel</button>
                    <button class="btn sm primary" onclick="FA.addIncome()">+ הכנסה ידנית</button>
                </div>
            </div>
            <div style="overflow-x: auto;">
            <table>
                <thead><tr>
                    <th>תאריך</th><th>לקוח</th><th>מקור</th><th>שירות</th>
                    <th>לפני מע״מ</th><th>מע״מ</th><th>כולל</th>
                    <th>אמצעי</th><th>סטטוס</th><th>חשבונית</th>
                    <th>פירעון</th><th>נציג</th><th>קמפיין</th>
                    <th>התאמת בנק</th><th>פעולות</th>
                </tr></thead>
                <tbody>
                    ${filtered.length === 0 ? `<tr><td colspan="15" style="text-align:center; padding:30px; color:var(--muted);">אין תוצאות לפילטרים האלה</td></tr>` : filtered.map(r => `
                        <tr>
                            <td>${r.date}</td>
                            <td><strong>${r.client}</strong><br><span style="font-size:10px; color:var(--muted)">${r.business||''}</span></td>
                            <td>${r.source}</td>
                            <td>${r.service}</td>
                            <td class="num">${fmt(r.preVat)}</td>
                            <td class="num">${fmt(r.vat)}</td>
                            <td class="num"><strong>${fmt(r.total)}</strong></td>
                            <td>${r.method}</td>
                            <td>${statusPill(r.status)}</td>
                            <td>${r.invoice}</td>
                            <td>${r.dueDate}</td>
                            <td>${r.rep}</td>
                            <td>${r.campaign}</td>
                            <td>${statusPill(r.reconciled)}</td>
                            <td><div class="action-icons">
                                <button class="icon-action" title="צפייה" onclick="FA.viewIncome('${r.invoice}')">👁</button>
                                <button class="icon-action" title="עריכה" onclick="FA.editIncome('${r.invoice}')">✎</button>
                                ${r.status !== 'שולם' ? `<button class="icon-action" title="סמן ששולם" onclick="FA.markPaid('${r.invoice}')">✓</button>` : ''}
                                <button class="icon-action" title="התאמה לבנק" onclick="FA.matchIncomeToBank('${r.invoice}')">🔗</button>
                            </div></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
        </div>
    `;
};

// ============ 3. EXPENSES ============
TABS.expenses = () => {
    const fSearch = FA.getFilter('expenses', 'search', '').toLowerCase();
    const fCat = FA.getFilter('expenses', 'category', '');
    const fRecurring = FA.getFilter('expenses', 'recurring', '');
    const fUnusual = FA.getFilter('expenses', 'unusual', '');

    const filtered = STATE.expenses.filter(r => {
        if (fSearch && !(r.supplier.toLowerCase().includes(fSearch) || (r.project||'').toLowerCase().includes(fSearch))) return false;
        if (fCat && r.category !== fCat) return false;
        if (fRecurring && r.recurring !== fRecurring) return false;
        if (fUnusual && r.unusual !== fUnusual) return false;
        return true;
    });

    const totalAll = STATE.expenses.reduce((s, r) => s + r.total, 0);
    const totalFixed = STATE.expenses.filter(r => r.recurring === 'קבועה').reduce((s, r) => s + r.total, 0);
    const totalAds = STATE.expenses.filter(r => r.category === 'פרסום').reduce((s, r) => s + r.total, 0);
    const totalUnrecognized = STATE.expenses.filter(r => r.recognized === 'לא מוכרת').reduce((s, r) => s + r.total, 0);

    return `
        <div class="grid grid-cols-3" style="margin-bottom: 14px;">
            <div class="action-card priority-high">
                <div class="action-card-title">⚠️ הוצאה חריגה</div>
                <div class="action-card-desc">פרסום Meta עלה ב-38% החודש</div>
                <strong style="color:var(--error)">+${fmt(3500)}</strong>
            </div>
            <div class="action-card priority-critical">
                <div class="action-card-title">🔁 חיוב כפול</div>
                <div class="action-card-desc">Anthropic - 1,711 ₪ פעמיים תוך יומיים</div>
                <strong style="color:var(--error)">${fmt(1711)}</strong>
                <div class="action-card-buttons" style="margin-top:8px"><button class="btn xs primary" onclick="FA.openModal('פעולה לחיוב כפול','<p>לפנות ל-Anthropic ולבקש זיכוי על החיוב הכפול מ-14.5.</p>',[{label:'סגור',onclick:FA.closeModal},{label:'צור משימה',class:'primary',onclick:()=>{STATE.tasks.unshift({title:'פנה ל-Anthropic לזיכוי כפילות',priority:'גבוהה',assignee:'רון',due:new Date().toISOString().slice(0,10),status:'חדש',related:'Anthropic',amount:1711}); FA.closeModal(); rerender(); FA.toast('משימה נוצרה','success');}}])">צור משימה</button></div>
            </div>
            <div class="action-card priority-low">
                <div class="action-card-title">📦 מנוי לא בשימוש</div>
                <div class="action-card-desc">Loom - 0 שימושים החודש</div>
                <strong>${fmt(77)}</strong>/חודש
                <div class="action-card-buttons" style="margin-top:8px"><button class="btn xs" onclick="FA.openModal('ביטול מנוי','<p>בטל את המנוי של Loom (₪77/חודש). חוסך ₪924 בשנה.</p>',[{label:'סגור',onclick:FA.closeModal},{label:'צור משימת ביטול',class:'primary',onclick:()=>{STATE.tasks.unshift({title:'בטל מנוי Loom',priority:'נמוכה',assignee:'רון',due:new Date().toISOString().slice(0,10),status:'חדש',related:'Loom',amount:77}); FA.closeModal(); rerender(); FA.toast('משימה נוצרה','success');}}])">בדוק</button></div>
            </div>
        </div>

        <div class="grid grid-cols-4" style="margin-bottom: 18px;">
            <div class="kpi"><div class="kpi-label">סך הוצאות</div><div class="kpi-value">${fmt(totalAll)}</div><span class="kpi-meta">${STATE.expenses.length} תנועות</span></div>
            <div class="kpi"><div class="kpi-label">הוצאות קבועות</div><div class="kpi-value">${fmt(totalFixed)}</div><span class="kpi-meta">${totalAll>0?Math.round(totalFixed/totalAll*100):0}% מסה״כ</span></div>
            <div class="kpi"><div class="kpi-label">הוצאות פרסום</div><div class="kpi-value">${fmt(totalAds)}</div>${trend(38)} <span class="kpi-meta">חריג</span></div>
            <div class="kpi"><div class="kpi-label">לא מוכרות</div><div class="kpi-value">${fmt(totalUnrecognized)}</div><span class="kpi-meta">לבדיקה עם רו״ח</span></div>
        </div>

        <div class="table-wrap">
            <div class="table-toolbar">
                <h3>הוצאות - ${STATE.currentMonth} ${filtered.length !== STATE.expenses.length ? `(מסונן: ${filtered.length}/${STATE.expenses.length})` : ''}</h3>
                <div class="filter-row">
                    <input class="filter-input" placeholder="🔍 חיפוש ספק/פרויקט" value="${fSearch}" oninput="FA.setFilter('expenses','search',this.value)"/>
                    <select class="filter-select" onchange="FA.setFilter('expenses','category',this.value)">
                        <option value="">כל הקטגוריות</option>
                        ${[...new Set(STATE.expenses.map(r=>r.category))].map(s => `<option ${s===fCat?'selected':''}>${s}</option>`).join('')}
                    </select>
                    <select class="filter-select" onchange="FA.setFilter('expenses','recurring',this.value)">
                        <option value="">קבוע + משתנה</option>
                        <option ${fRecurring==='קבועה'?'selected':''}>קבועה</option>
                        <option ${fRecurring==='משתנה'?'selected':''}>משתנה</option>
                    </select>
                    <select class="filter-select" onchange="FA.setFilter('expenses','unusual',this.value)">
                        <option value="">כל החריגות</option>
                        <option ${fUnusual==='תקין'?'selected':''}>תקין</option>
                        <option ${fUnusual==='גבוהה'?'selected':''}>גבוהה</option>
                    </select>
                    ${fSearch||fCat||fRecurring||fUnusual ? `<button class="btn sm" onclick="FA.clearFilters('expenses')">✕ נקה</button>` : ''}
                    <button class="btn sm" onclick="FA.exportToExcel('הוצאות')">📊 ייצא Excel</button>
                    <button class="btn sm" onclick="FA.importFile('expenses')">📥 ייבא</button>
                    <button class="btn sm primary" onclick="FA.addExpense()">+ הוצאה ידנית</button>
                </div>
            </div>
            <div style="overflow-x: auto;">
            <table>
                <thead><tr>
                    <th>תאריך</th><th>ספק</th><th>קטגוריה</th><th>תת</th>
                    <th>לפני מע״מ</th><th>מע״מ</th><th>כולל</th>
                    <th>אמצעי</th><th>חשבון</th><th>קבוע</th>
                    <th>מוכרת</th><th>מחלקה</th>
                    <th>התאמה</th><th>חריגה</th><th>פעולות</th>
                </tr></thead>
                <tbody>
                    ${filtered.length === 0 ? `<tr><td colspan="15" style="text-align:center; padding:30px; color:var(--muted);">אין תוצאות לפילטרים</td></tr>` : filtered.map((r, idx) => {
                        const realIdx = STATE.expenses.indexOf(r);
                        return `
                        <tr>
                            <td>${r.date}</td>
                            <td><strong>${r.supplier}</strong></td>
                            <td>${r.category}</td>
                            <td>${r.sub}</td>
                            <td class="num">${fmt(r.preVat)}</td>
                            <td class="num">${fmt(r.vat)}</td>
                            <td class="num"><strong>${fmt(r.total)}</strong></td>
                            <td>${r.method}</td>
                            <td>${r.account}</td>
                            <td>${r.recurring}</td>
                            <td>${r.recognized}</td>
                            <td>${r.dept}</td>
                            <td>${statusPill(r.reconciled)}</td>
                            <td>${r.unusual === 'גבוהה' ? '<span class="pill warning">גבוהה ⚠️</span>' : '<span class="pill success">תקין</span>'}</td>
                            <td><div class="action-icons">
                                <button class="icon-action" title="צפייה" onclick="FA.viewExpense(${realIdx})">👁</button>
                                <button class="icon-action" title="עריכה" onclick="FA.editExpense(${realIdx})">✎</button>
                                <button class="icon-action" title="התאמה" onclick="FA.matchExpenseToBank(${realIdx})">🔗</button>
                            </div></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
            </div>
        </div>
    `;
};

// ============ 4. CASHFLOW ============
TABS.cashflow = () => {
    const k = STATE.kpis;
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">תובנת AI - תזרים</div>
            <div class="ai-insight">⚠️ בעוד <strong>12 יום</strong> צפוי עומס תשלומים של <strong>${fmt(47000)}</strong> בזמן שהגבייה הצפויה עד אז היא רק <strong>${fmt(28000)}</strong>. צפוי פער של ${fmt(19000)}.</div>
            <div class="ai-insight">אם לא תגבה את ${STATE.collections.length} החשבוניות הפתוחות עד ה-20 לחודש, תיכנס לפער תזרים של ${fmt(19000)}.</div>
            <div class="ai-insight">העסק <strong>רווחי על הנייר</strong> אבל התזרים חלש בגלל תשלומים דחויים וגבייה איטית.</div>
            <div style="margin-top:10px;"><button class="btn xs primary" onclick="switchTab('collections')">פתח גבייה →</button></div>
        </div>

        <div class="grid grid-cols-4" style="margin-bottom: 18px;">
            <div class="kpi"><div class="kpi-label">יתרה נוכחית</div><div class="kpi-value">${fmt(k.cash.value)}</div><span class="kpi-meta">בנק + אשראי</span></div>
            <div class="kpi"><div class="kpi-label">הכנסות צפויות 30 יום</div><div class="kpi-value" style="color: var(--success);">${fmt(78000)}</div><span class="kpi-meta">לפי גבייה + עסקאות</span></div>
            <div class="kpi"><div class="kpi-label">הוצאות צפויות 30 יום</div><div class="kpi-value" style="color: var(--accent);">${fmt(61000)}</div><span class="kpi-meta">קבועות + ידועות</span></div>
            <div class="kpi"><div class="kpi-label">תחזית סוף 30 יום</div><div class="kpi-value">${fmt(304400)}</div><span class="kpi-meta">+${fmt(17000)} מהיום</span></div>
        </div>

        <div class="card" style="margin-bottom: 18px;">
            <div class="card-h"><div><div class="card-title">תחזית תזרים 60 יום</div><div class="card-subtitle">יתרה + הכנסות צפויות - הוצאות צפויות</div></div></div>
            <div class="bar-chart">
                ${STATE.cashFlowForecast.map(f => `
                    <div class="bar-row">
                        <div class="bar-label">${f.day}</div>
                        <div class="bar-track"><div class="bar-fill" style="width: ${f.balance / 4000}%; background: var(--accent);"></div></div>
                        <div class="bar-value">${fmt(f.balance)}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="grid grid-cols-2">
            <div class="card">
                <div class="card-h"><div class="card-title">תשלומים קרובים (7 ימים)</div></div>
                ${[
                    {name: 'WeWork - שכירות', amount: 4484, due: '1 ביוני', cat: 'קבוע'},
                    {name: 'משה לוי רו״ח', amount: 2596, due: '10 ביוני', cat: 'קבוע'},
                    {name: 'Meta - Facebook Ads', amount: 8000, due: '12 ביוני', cat: 'משתנה'},
                    {name: 'דוד כהן פרילנס', amount: 12000, due: '15 ביוני', cat: 'פרויקט'},
                ].map(p => `
                    <div class="list-item">
                        <div class="list-item-text">
                            <div class="list-item-title">${p.name}</div>
                            <div class="list-item-sub">${p.due} · ${p.cat}</div>
                        </div>
                        <div class="list-item-val" style="color: var(--error)">${fmt(p.amount)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="card">
                <div class="card-h">
                    <div class="card-title">גבייה צפויה (7 ימים)</div>
                    <button class="btn xs" onclick="switchTab('collections')">פתח →</button>
                </div>
                ${STATE.collections.slice(0,4).map(c => `
                    <div class="list-item">
                        <div class="list-item-text">
                            <div class="list-item-title">${c.client}</div>
                            <div class="list-item-sub">${c.dueDate} · ${c.daysLate > 0 ? c.daysLate + ' ימי איחור' : 'בזמן'}</div>
                        </div>
                        <div class="list-item-val" style="color: var(--success)">${fmt(c.amount)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

// ============ 5. COLLECTIONS ============
TABS.collections = () => {
    const fStatus = FA.getFilter('collections', 'status', '');
    const fRep = FA.getFilter('collections', 'rep', '');
    const filtered = STATE.collections.filter(c => {
        if (fStatus && c.status !== fStatus) return false;
        if (fRep && c.rep !== fRep) return false;
        return true;
    });
    const totalOpen = STATE.collections.reduce((s,c) => s + c.amount, 0);
    const totalLate = STATE.collections.filter(c => c.daysLate > 0).reduce((s,c) => s + c.amount, 0);
    return `
        <div class="grid grid-cols-4" style="margin-bottom: 18px;">
            <div class="kpi"><div class="kpi-label">סך פתוח לגבייה</div><div class="kpi-value" style="color: var(--warning);">${fmt(totalOpen)}</div><span class="kpi-meta">${STATE.collections.length} לקוחות</span></div>
            <div class="kpi"><div class="kpi-label">באיחור</div><div class="kpi-value" style="color: var(--error);">${fmt(totalLate)}</div><span class="kpi-meta">${STATE.collections.filter(c=>c.daysLate>0).length} חשבוניות</span></div>
            <div class="kpi"><div class="kpi-label">צפי גבייה השבוע</div><div class="kpi-value" style="color: var(--success);">${fmt(28320)}</div><span class="kpi-meta">צ׳ק מטבחי דרור</span></div>
            <div class="kpi"><div class="kpi-label">צפי גבייה החודש</div><div class="kpi-value">${fmt(totalOpen)}</div><span class="kpi-meta">100% אם הכל נכנס</span></div>
        </div>

        <div class="table-wrap">
            <div class="table-toolbar">
                <h3>גבייה פתוחה ${filtered.length !== STATE.collections.length ? `(${filtered.length}/${STATE.collections.length})` : ''}</h3>
                <div class="filter-row">
                    <select class="filter-select" onchange="FA.setFilter('collections','status',this.value)">
                        <option value="">כל הסטטוסים</option>
                        ${[...new Set(STATE.collections.map(c=>c.status))].map(s => `<option ${s===fStatus?'selected':''}>${s}</option>`).join('')}
                    </select>
                    <select class="filter-select" onchange="FA.setFilter('collections','rep',this.value)">
                        <option value="">כל הנציגים</option>
                        ${[...new Set(STATE.collections.map(c=>c.rep))].map(s => `<option ${s===fRep?'selected':''}>${s}</option>`).join('')}
                    </select>
                    ${fStatus||fRep ? `<button class="btn sm" onclick="FA.clearFilters('collections')">✕ נקה</button>` : ''}
                    <button class="btn sm" onclick="FA.exportToExcel('גבייה')">📊 ייצא</button>
                </div>
            </div>
            <div style="overflow-x: auto;">
            <table>
                <thead><tr>
                    <th>לקוח</th><th>סכום פתוח</th><th>תאריך חשבונית</th><th>תאריך פירעון</th>
                    <th>ימי איחור</th><th>סטטוס</th><th>נציג</th><th>אמצעי</th>
                    <th>פעולה מומלצת</th><th>פעולות</th>
                </tr></thead>
                <tbody>
                    ${filtered.length === 0 ? `<tr><td colspan="10" style="text-align:center; padding:30px; color:var(--muted);">אין גבייה פתוחה תואמת 🎉</td></tr>` : filtered.map(c => `
                        <tr>
                            <td><strong>${c.client}</strong></td>
                            <td class="num"><strong>${fmt(c.amount)}</strong></td>
                            <td>${c.invoiceDate}</td>
                            <td>${c.dueDate}</td>
                            <td class="num ${c.daysLate > 0 ? 'neg' : ''}">${c.daysLate > 0 ? c.daysLate + ' ימים' : '-'}</td>
                            <td>${statusPill(c.status)}</td>
                            <td>${c.rep}</td>
                            <td>${c.method}</td>
                            <td style="color: var(--text-soft); font-size: 12px;">${c.action}</td>
                            <td><div class="action-icons">
                                <button class="icon-action" title="צור משימה" onclick="FA.createCollectionTask('${c.client}')">+</button>
                                <button class="icon-action" title="סמן ששולם" onclick="FA.markCollectionPaid('${c.client}')">✓</button>
                                <button class="icon-action" title="שלח תזכורת" onclick="FA.sendReminder('${c.client}')">📧</button>
                                <button class="icon-action" title="הערה" onclick="FA.addCollectionNote('${c.client}')">💬</button>
                            </div></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
        </div>
    `;
};

// ============ 6. LOST MONEY ============
TABS.lost = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">סיכום AI - כסף אבוד שאותר החודש</div>
        <div class="ai-insight">סה״כ כסף אבוד שאותר: <strong style="color: var(--error)">${fmt(STATE.lost.reduce((s, l) => s + l.amount, 0))}</strong>. רובו ניתן להחזרה.</div>
        <div class="ai-insight">המוקד הכי חשוב: <strong>${fmt(17420)}</strong> בגבייה פתוחה מעל 45 יום - הסיכון הכי גבוה לאבד אותם.</div>
        <div class="ai-insight">הזדמנות חיסכון חודשית: <strong>${fmt(2870)}</strong> במנויים מיותרים = <strong>${fmt(34440)}</strong> בשנה.</div>
    </div>

    <div class="grid grid-cols-3" style="margin-bottom: 18px;">
        <div class="kpi"><div class="kpi-label">סך כסף אבוד</div><div class="kpi-value" style="color: var(--error);">${fmt(STATE.lost.reduce((s, l) => s + l.amount, 0))}</div><span class="kpi-meta">${STATE.lost.length} מקורות</span></div>
        <div class="kpi"><div class="kpi-label">ניתן להחזרה</div><div class="kpi-value" style="color: var(--success);">${fmt(36511)}</div><span class="kpi-meta">76% מהסכום</span></div>
        <div class="kpi"><div class="kpi-label">חיסכון חודשי פוטנציאלי</div><div class="kpi-value">${fmt(11200)}</div><span class="kpi-meta">אם נטפל בכולם</span></div>
    </div>

    ${STATE.lost.length === 0 ? `<div class="placeholder-zone"><div class="ph-icon">🎉</div><div class="ph-title">אין כסף אבוד שזוהה</div><div class="ph-sub">הסוכן יעדכן ברגע שיזהה הזדמנויות</div></div>` :
    STATE.lost.map((item, i) => `
        <div class="action-card priority-${item.severity}">
            <div class="action-card-h">
                <div>
                    <div class="action-card-title">${item.title}</div>
                    <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">${item.type}</div>
                </div>
                <strong style="color: var(--error); font-size: 18px; font-variant-numeric: tabular-nums;">${fmt(item.amount)}</strong>
            </div>
            <div class="action-card-desc"><strong>פעולה מומלצת:</strong> ${item.action}</div>
            <div class="action-card-meta">
                <span>🎯 ביטחון: ${item.confidence}%</span>
                <span>⚡ דחיפות: ${item.severity === 'critical' ? 'קריטית' : item.severity === 'high' ? 'גבוהה' : 'בינונית'}</span>
            </div>
            <div class="action-card-buttons">
                <button class="btn xs primary" onclick="FA.createTaskFromInsight(${i},'lost')">צור משימה</button>
                <button class="btn xs success" onclick="FA.resolveInsight(${i},'lost')">סמן כטופל</button>
                <button class="btn xs" onclick="FA.detailsModal('פרטי תובנה',[{label:'תיאור',value:'${item.title.replace(/'/g,'')}'},{label:'סכום',value:'${fmt(item.amount)}'},{label:'פעולה מומלצת',value:'${item.action.replace(/'/g,'')}'},{label:'ביטחון',value:'${item.confidence}%'}])">בדוק פרטים</button>
                <button class="btn xs" onclick="FA.dismissInsight(${i},'lost')">דחה</button>
            </div>
        </div>
    `).join('')}
`;

// ============ 7. PROFITABILITY ============
TABS.profitability = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">תובנת רווחיות</div>
        <div class="ai-insight">השירות הכי רווחי שלך: <strong>ייעוץ אסטרטגי</strong> עם <strong>84.7%</strong> רווחיות. השירות הכי חלש: <strong>קמפיין שיווקי</strong> עם רק <strong>19.2%</strong> רווחיות.</div>
        <div class="ai-insight">לקוח המספר 1 שלך: <strong>אלון משכן</strong> עם <strong>87.3%</strong> רווחיות. הכי פחות רווחי: <strong>יעקובי דיגיטל</strong> עם רק <strong>8.5%</strong>.</div>
    </div>

    <div class="subtabs">
        <button class="subtab active" onclick="document.querySelectorAll('.prof-view').forEach(v=>v.style.display='none'); document.getElementById('prof-service').style.display='block'; document.querySelectorAll('.subtab').forEach(s=>s.classList.remove('active')); this.classList.add('active');">לפי שירות</button>
        <button class="subtab" onclick="document.querySelectorAll('.prof-view').forEach(v=>v.style.display='none'); document.getElementById('prof-client').style.display='block'; document.querySelectorAll('.subtab').forEach(s=>s.classList.remove('active')); this.classList.add('active');">לפי לקוח</button>
        <button class="subtab" onclick="document.querySelectorAll('.prof-view').forEach(v=>v.style.display='none'); document.getElementById('prof-campaign').style.display='block'; document.querySelectorAll('.subtab').forEach(s=>s.classList.remove('active')); this.classList.add('active');">לפי קמפיין</button>
    </div>

    <div id="prof-service" class="prof-view">
        <div class="table-wrap">
            <div class="table-toolbar"><h3>רווחיות לפי שירות</h3><div class="filter-row"><button class="btn sm" onclick="FA.exportToExcel('רווחיות שירות')">📊 ייצא</button></div></div>
            <table>
                <thead><tr><th>שירות</th><th>הכנסות</th><th>עלויות</th><th>רווח</th><th>אחוז רווחיות</th><th>סטטוס</th></tr></thead>
                <tbody>${STATE.profitabilityByService.map(s => `<tr><td><strong>${s.name}</strong></td><td class="num">${fmt(s.revenue)}</td><td class="num">${fmt(s.costs)}</td><td class="num pos"><strong>${fmt(s.profit)}</strong></td><td class="num">${fmtPct(s.margin)}</td><td>${s.margin >= 60 ? '<span class="pill success">מעולה</span>' : s.margin >= 35 ? '<span class="pill info">טוב</span>' : s.margin >= 20 ? '<span class="pill warning">סביר</span>' : '<span class="pill error">חלש</span>'}</td></tr>`).join('')}</tbody>
            </table>
        </div>
    </div>

    <div id="prof-client" class="prof-view" style="display:none;">
        <div class="table-wrap">
            <div class="table-toolbar"><h3>רווחיות לפי לקוח</h3><div class="filter-row"><button class="btn sm" onclick="FA.exportToExcel('רווחיות לקוחות')">📊 ייצא</button></div></div>
            <table>
                <thead><tr><th>לקוח</th><th>הכנסות</th><th>עלויות</th><th>רווח</th><th>אחוז רווחיות</th><th>סטטוס</th></tr></thead>
                <tbody>${STATE.profitabilityByClient.map(c => `<tr><td><strong>${c.name}</strong></td><td class="num">${fmt(c.revenue)}</td><td class="num">${fmt(c.costs)}</td><td class="num pos"><strong>${fmt(c.profit)}</strong></td><td class="num">${fmtPct(c.margin)}</td><td>${c.margin >= 60 ? '<span class="pill success">מעולה</span>' : c.margin >= 35 ? '<span class="pill info">טוב</span>' : c.margin >= 20 ? '<span class="pill warning">סביר</span>' : '<span class="pill error">לבדוק</span>'}</td></tr>`).join('')}</tbody>
            </table>
        </div>
    </div>

    <div id="prof-campaign" class="prof-view" style="display:none;">
        <div class="table-wrap">
            <div class="table-toolbar"><h3>רווחיות לפי קמפיין</h3><div class="filter-row"><button class="btn sm" onclick="FA.exportToExcel('קמפיינים')">📊 ייצא</button></div></div>
            <table>
                <thead><tr><th>קמפיין</th><th>הוצאה</th><th>לידים</th><th>סגירות</th><th>רווח</th><th>ROI</th><th>סטטוס</th></tr></thead>
                <tbody>${STATE.campaigns.map(c => `<tr><td><strong>${c.name}</strong></td><td class="num">${fmt(c.spend)}</td><td class="num">${c.leads}</td><td class="num">${c.sales}</td><td class="num ${c.profit < 0 ? 'neg' : 'pos'}"><strong>${fmt(c.profit)}</strong></td><td class="num">${c.roi >= 200 ? '<strong style="color:var(--success)">'+c.roi+'%</strong>' : c.roi >= 0 ? c.roi+'%' : '<strong style="color:var(--error)">'+c.roi+'%</strong>'}</td><td>${statusPill(c.status)}</td></tr>`).join('')}</tbody>
            </table>
        </div>
    </div>
`;

// ============ 8. ADS ROI ============
TABS.adsroi = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">תובנת פרסום</div>
        <div class="ai-insight">קמפיין <strong>LinkedIn</strong> הוא הכי רווחי: ROI של <strong>941%</strong>. כל ₪ של פרסום מחזיר ₪9.4.</div>
        <div class="ai-insight">⚠️ <strong>Instagram Q2</strong> מפסיד כסף: ${fmt(12400)} הוצאה הביאה רק ${fmt(8000)} הכנסות. <strong>המלצה: עצור מיידית.</strong></div>
        <div style="margin-top:10px;">
            <button class="btn xs primary" onclick="STATE.tasks.unshift({title:'עצור קמפיין Instagram Q2',priority:'גבוהה',assignee:'רון',due:new Date().toISOString().slice(0,10),status:'חדש',related:'Instagram Q2',amount:12400}); rerender(); FA.toast('משימה: עצור Instagram','success');">צור משימה: עצור Instagram</button>
        </div>
    </div>

    <div class="grid grid-cols-4" style="margin-bottom: 18px;">
        <div class="kpi"><div class="kpi-label">סך הוצאה פרסום</div><div class="kpi-value">${fmt(31600)}</div><span class="kpi-meta">${STATE.campaigns.length} קמפיינים</span></div>
        <div class="kpi"><div class="kpi-label">סך הכנסות מקמפיינים</div><div class="kpi-value" style="color: var(--success);">${fmt(210500)}</div><span class="kpi-meta">23 עסקאות</span></div>
        <div class="kpi"><div class="kpi-label">ROI כולל</div><div class="kpi-value" style="color: var(--success);">566%</div><span class="kpi-meta">מעולה</span></div>
        <div class="kpi"><div class="kpi-label">CPL ממוצע</div><div class="kpi-value">${fmt(78)}</div>${trend(-12)}<span class="kpi-meta">השתפר</span></div>
    </div>

    <div class="table-wrap">
        <div class="table-toolbar">
            <h3>ביצועי קמפיינים</h3>
            <div class="filter-row">
                <button class="btn sm" onclick="FA.exportToExcel('קמפיינים')">📊 ייצא Excel</button>
            </div>
        </div>
        <div style="overflow-x: auto;">
        <table>
            <thead><tr>
                <th>קמפיין</th><th>הוצאה</th><th>לידים</th><th>פגישות</th><th>סגירות</th>
                <th>הכנסות</th><th>רווח</th><th>CPL</th><th>CAC</th><th>ROI</th><th>סטטוס</th><th>המלצה</th>
            </tr></thead>
            <tbody>
                ${STATE.campaigns.map(c => `
                    <tr>
                        <td><strong>${c.name}</strong></td>
                        <td class="num">${fmt(c.spend)}</td>
                        <td class="num">${c.leads}</td>
                        <td class="num">${c.meetings}</td>
                        <td class="num">${c.sales}</td>
                        <td class="num">${fmt(c.revenue)}</td>
                        <td class="num ${c.profit < 0 ? 'neg' : 'pos'}"><strong>${fmt(c.profit)}</strong></td>
                        <td class="num">${c.cpl > 0 ? fmt(c.cpl) : '-'}</td>
                        <td class="num">${c.cac > 0 ? fmt(c.cac) : '-'}</td>
                        <td class="num">${c.roi === 9999 ? '∞' : c.roi+'%'}</td>
                        <td>${statusPill(c.status)}</td>
                        <td style="font-size:11px; color:var(--text-soft)">${c.recommendation}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        </div>
    </div>
`;

// ============ 9. RECONCILIATION ============
TABS.reconciliation = () => {
    const counts = {
        auto: STATE.bankTx.filter(t=>t.status==='מותאם אוטומטית').length,
        review: STATE.bankTx.filter(t=>t.status==='דורש אישור').length,
        dup: STATE.bankTx.filter(t=>t.status==='חשד לכפילות').length,
        notfound: STATE.bankTx.filter(t=>t.status==='לא נמצא מקור').length,
    };
    return `
        <div class="grid grid-cols-5" style="margin-bottom: 18px;">
            <div class="kpi"><div class="kpi-label">תנועות שיובאו</div><div class="kpi-value">${STATE.bankTx.length}</div><span class="kpi-meta">${STATE.currentMonth}</span></div>
            <div class="kpi"><div class="kpi-label">מותאם אוטומטית</div><div class="kpi-value" style="color: var(--success);">${counts.auto}</div></div>
            <div class="kpi"><div class="kpi-label">דורש בדיקה</div><div class="kpi-value" style="color: var(--warning);">${counts.review}</div></div>
            <div class="kpi"><div class="kpi-label">חשד לכפילות</div><div class="kpi-value" style="color: var(--error);">${counts.dup}</div></div>
            <div class="kpi"><div class="kpi-label">לא נמצא מקור</div><div class="kpi-value" style="color: var(--error);">${counts.notfound}</div></div>
        </div>

        <div class="ai-banner">
            <div class="ai-banner-h">תובנות AI - התאמות</div>
            <div class="ai-insight">💡 נמצאה הכנסה של <strong>${fmt(12500)}</strong> בבנק מלקוח <strong>XYZ</strong> אבל לא נמצאה חשבונית תואמת. <strong>פעולה: יצירת חשבונית.</strong></div>
            <div class="ai-insight">⚠️ יש <strong>חיוב כפול</strong> בכרטיס אשראי מ-Anthropic באותו סכום בהפרש של יומיים.</div>
            <div class="ai-insight">📈 נמצאה הוצאה חוזרת של ${fmt(1190)} לספק חדש שלא הופיע בחודש הקודם.</div>
        </div>

        <div class="grid grid-cols-2" style="margin-bottom: 18px;">
            <div class="drop-zone" onclick="FA.importFile('bank')">
                <div class="dz-icon">🏦</div>
                <div><strong>העלה דוח בנק</strong></div>
                <div style="font-size:11px; color:var(--muted); margin-top:4px;">PDF / CSV / XLS</div>
                <button class="btn sm primary" style="margin-top:10px;" onclick="event.stopPropagation(); FA.importFile('bank')">בחר קובץ</button>
            </div>
            <div class="drop-zone" onclick="FA.importFile('credit')">
                <div class="dz-icon">💳</div>
                <div><strong>העלה דוח אשראי</strong></div>
                <div style="font-size:11px; color:var(--muted); margin-top:4px;">PDF / CSV</div>
                <button class="btn sm primary" style="margin-top:10px;" onclick="event.stopPropagation(); FA.importFile('credit')">בחר קובץ</button>
            </div>
        </div>

        <div class="table-wrap">
            <div class="table-toolbar">
                <h3>תנועות בנק ואשראי</h3>
                <div class="filter-row">
                    <button class="btn sm success" onclick="FA.approveAllAutoBank()">✓ אשר את כל המותאמים</button>
                </div>
            </div>
            <div style="overflow-x: auto;">
            <table>
                <thead><tr>
                    <th>תאריך</th><th>מקור</th><th>תיאור</th><th>מוטב</th>
                    <th>סכום</th><th>סוג</th><th>התאמה מוצעת</th>
                    <th>ביטחון</th><th>סטטוס</th><th>פעולה</th>
                </tr></thead>
                <tbody>
                    ${STATE.bankTx.map((t, i) => `
                        <tr>
                            <td>${t.date}</td>
                            <td>${t.source}</td>
                            <td>${t.desc}</td>
                            <td><strong>${t.party}</strong></td>
                            <td class="num ${t.amount < 0 ? 'neg' : 'pos'}"><strong>${fmt(Math.abs(t.amount))}</strong></td>
                            <td>${t.type}</td>
                            <td>${t.suggested}</td>
                            <td class="num">${t.confidence}%</td>
                            <td>${statusPill(t.status)}</td>
                            <td><div class="action-icons">
                                <button class="icon-action" title="אשר" onclick="FA.approveBankMatch(${i})">✓</button>
                                <button class="icon-action" title="דחה" onclick="FA.rejectBankMatch(${i})">✗</button>
                                <button class="icon-action" title="התאמה ידנית" onclick="FA.manualBankMatch(${i})">🔗</button>
                            </div></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
        </div>
    `;
};

// ============ 10. DOCUMENTS ============
TABS.documents = () => `
    <div class="disclaimer">הסוכן אינו מחליף ייעוץ משפטי או רואה חשבון. הוא מציף נקודות פיננסיות לבדיקה בלבד.</div>

    <div class="grid grid-cols-2" style="margin-bottom: 18px;">
        <div class="drop-zone" onclick="FA.importFile('document')">
            <div class="dz-icon">📄</div>
            <div><strong>העלה מסמך</strong></div>
            <div style="font-size:11px; color:var(--muted); margin-top:4px;">חשבונית, קבלה, הסכם, דוח</div>
            <button class="btn sm primary" style="margin-top:10px;" onclick="event.stopPropagation(); FA.importFile('document')">בחר קובץ</button>
        </div>
        <div class="card">
            <div class="card-title" style="margin-bottom:10px;">סוגי מסמכים נתמכים</div>
            <div style="font-size: 11px; color: var(--text-soft); line-height: 1.8;">
                חשבונית מס · קבלה · חשבונית מס/קבלה · חשבונית ספק · דוח סליקה · דוח בנק · דוח אשראי · הסכם לקוח · הסכם ספק · הצעת מחיר · הזמנת עבודה · דוח רו״ח · דוח מע״מ · דוח רווח והפסד
            </div>
        </div>
    </div>

    <div class="table-wrap">
        <div class="table-toolbar">
            <h3>מסמכים פיננסיים (${STATE.documents.length})</h3>
            <div class="filter-row">
                <input class="filter-input" placeholder="🔍 חיפוש מסמך"/>
                <select class="filter-select"><option>כל הסוגים</option>${[...new Set(STATE.documents.map(d=>d.type))].map(t => `<option>${t}</option>`).join('')}</select>
            </div>
        </div>
        <div style="overflow-x: auto;">
        <table>
            <thead><tr><th>שם מסמך</th><th>סוג</th><th>תאריך</th><th>לקוח/ספק</th><th>סכום</th><th>מע״מ</th><th>מספר</th><th>סטטוס חילוץ</th><th>ביטחון</th><th>פעולה</th></tr></thead>
            <tbody>
                ${STATE.documents.map((d, i) => `
                    <tr>
                        <td>📄 ${d.name}</td>
                        <td>${d.type}</td>
                        <td>${d.date}</td>
                        <td><strong>${d.entity}</strong></td>
                        <td class="num">${d.amount ? fmt(d.amount) : '-'}</td>
                        <td class="num">${d.vat ? fmt(d.vat) : '-'}</td>
                        <td>${d.number}</td>
                        <td>${statusPill(d.status)}</td>
                        <td class="num">${d.confidence}%</td>
                        <td><div class="action-icons">
                            <button class="icon-action" title="צפייה" onclick="FA.viewDocument(${i})">👁</button>
                            <button class="icon-action" title="עריכת חילוץ" onclick="FA.editDocExtraction(${i})">✎</button>
                            <button class="icon-action" title="אישור" onclick="FA.approveDocExtraction(${i})">✓</button>
                        </div></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        </div>
    </div>
`;

// ============ 11. FORECASTS ============
TABS.forecasts = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">תחזיות AI</div>
        <div class="ai-insight">לפי קצב הסגירות הנוכחי בצינור המכירות, התרחיש הריאלי הוא <strong>${fmt(STATE.scenarios.realistic.revenue)}</strong> הכנסות החודש.</div>
        <div class="ai-insight">כדי להגיע לתרחיש האופטימי (<strong>${fmt(STATE.scenarios.optimistic.revenue)}</strong>) צריך לסגור 2 עסקאות גדולות שכרגע בשיחות אחרונות.</div>
    </div>

    <div class="grid grid-cols-3" style="margin-bottom: 24px;">
        ${['conservative','realistic','optimistic'].map(key => {
            const s = STATE.scenarios[key];
            const labels = {conservative:{title:'תרחיש שמרני 🛡️',color:'var(--warning)',pill:'warning'},realistic:{title:'תרחיש ריאלי 🎯',color:'var(--accent)',pill:'info'},optimistic:{title:'תרחיש אופטימי 🚀',color:'var(--success)',pill:'success'}};
            const l = labels[key];
            return `
            <div class="scenario-card ${key}">
                <div class="card-title">${l.title}</div>
                <div style="font-size: 22px; font-weight: 700; color: ${l.color}; margin: 12px 0;">${fmt(s.revenue)}</div>
                <div style="font-size:11px; color:var(--muted); margin-bottom: 10px;">הנחה: ${s.assumption}</div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">רווח</div></div><div class="list-item-val">${fmt(s.profit)}</div></div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">תזרים סוף חודש</div></div><div class="list-item-val">${fmt(s.cash)}</div></div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">סיכון</div></div><span class="pill ${l.pill}">${s.risk}</span></div>
                <div style="font-size:11.5px; color: var(--text-soft); margin-top: 10px;"><strong>פעולה:</strong> ${s.action}</div>
            </div>`;
        }).join('')}
    </div>

    <div class="section-title">סימולציות "מה אם"</div>
    <div class="grid grid-cols-2">
        ${[
            {q: 'אם תקציב פרסום יעלה ב-20%', a: '+₪32,000 הכנסות, +₪8,500 רווח. ROI חיובי.', icon: '📈'},
            {q: 'אם גבייה תתעכב בשבועיים', a: '-₪19,000 בתזרים, אבל הרווח לא נפגע.', icon: '⏱️'},
            {q: 'אם נציג מכירות חדש יצטרף', a: '+₪35,000 פוטנציאל, עלות ₪12,000 שכר.', icon: '👥'},
            {q: 'אם לקוח גדול עוזב (-₪50K)', a: '-15% בהכנסות. רווחיות יורדת ל-22%.', icon: '⚠️'},
            {q: 'אם נעלה מחירים ב-10%', a: '+₪18,400 רווח, סיכון לאיבוד 2 לקוחות גבוליים.', icon: '💵'},
            {q: 'אם נחתוך 30% מהוצאות הפרסום', a: '-₪40,000 הכנסות, +₪9,000 רווח נטו.', icon: '✂️'},
        ].map(s => `
            <div class="card" style="cursor:pointer" onclick="FA.openModal('${s.icon} ${s.q}','<p style=\\'font-size:14px; line-height:1.7;\\'>${s.a}</p><p style=\\'font-size:11px; color:var(--muted); margin-top:12px;\\'>הסימולציה משתמשת בנתונים הנוכחיים. בגרסה הבאה תוכל לשנות פרמטרים ולראות תוצאה מיידית.</p>',[{label:'סגור',onclick:FA.closeModal}])">
                <div class="action-card-h">
                    <div class="action-card-title">${s.icon} ${s.q}</div>
                </div>
                <div class="action-card-desc" style="margin-top: 8px;">${s.a}</div>
            </div>
        `).join('')}
    </div>
`;

// ============ 12. REPORTS ============
TABS.reports = () => `
    <div class="grid grid-cols-3">
        ${STATE.reports.map(r => `
            <div class="card">
                <div class="card-h">
                    <div>
                        <div class="card-title">${r.name}</div>
                        <div class="card-subtitle">${r.desc}</div>
                    </div>
                    ${statusPill(r.status)}
                </div>
                <div style="font-size: 11px; color: var(--muted); margin: 10px 0;">עודכן: ${r.lastGen}</div>
                <div style="display: flex; gap: 6px;">
                    <button class="btn xs primary" onclick="FA.viewReport('${r.name}')">צפייה</button>
                    <button class="btn xs" onclick="FA.exportReportPDF('${r.name}')">📄 PDF</button>
                    <button class="btn xs" onclick="FA.exportReportExcel('${r.name}')">📊 Excel</button>
                </div>
            </div>
        `).join('')}
    </div>
`;

// ============ 13. CHAT (agentic) ============
TABS.chat = () => `
    <div class="chat-shell">
        <div class="chat-box">
            <div class="chat-head">
                <strong>💬 צ׳אט פיננסי</strong>
                <div style="display:flex; gap:6px;">
                    <button class="btn xs" onclick="FA.chatHistory = []; FA._renderChat(); FA.toast('שיחה נוקתה','info')">🗑️ נקה</button>
                    <button class="btn xs success" onclick="FA.proactiveOpen()">✨ תובנות יומיות</button>
                </div>
            </div>
            <div class="chat-msgs" id="chatMsgs">
                ${FA.chatHistory.length === 0 ? `<div style="text-align:center; padding:30px; color:var(--muted); font-size:13px;">דבר עם הסוכן הפיננסי בשפה חופשית.<br><br>הוא מכיר את כל הנתונים שלך ויכול לבצע פעולות אמיתיות.<br><br>לחץ <strong>✨ תובנות יומיות</strong> למעלה כדי להתחיל.</div>` : ''}
            </div>
            <div class="chat-input-row">
                <input id="chatInput" type="text" placeholder="שאל את הסוכן..." onkeydown="if(event.key==='Enter'){FA.sendChatMessage(this.value); this.value='';}">
                <button class="btn primary" onclick="const i=document.getElementById('chatInput'); FA.sendChatMessage(i.value); i.value='';">שלח</button>
            </div>
        </div>

        <div>
            <div class="card-title" style="margin-bottom: 10px;">שאלות מוצעות</div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
                ${[
                    'מה הדברים הכי חשובים שאני צריך לעשות היום?',
                    'כמה הרווחתי החודש?',
                    'כמה כסף פתוח יש לי?',
                    'מי לא שילם לי?',
                    'איפה אני מוציא יותר מדי?',
                    'מה ההוצאה הכי גדולה שלי?',
                    'איזה שירות הכי רווחי?',
                    'מה התחזית לסוף החודש?',
                    'איזה לקוחות לא משתלמים?',
                    'מה הקמפיין הכי רווחי?',
                    'איפה אני יכול לחסוך 10,000 ₪ החודש?',
                    'מה מצב התזרים שלי?',
                ].map(q => `
                    <button class="btn" style="text-align: right; justify-content: flex-start; font-weight: 400; font-size: 12.5px;" onclick="FA.chatSuggestion('${q.replace(/'/g,'')}')">💭 ${q}</button>
                `).join('')}
            </div>
        </div>
    </div>
`;

TABS.chat_after = () => {
    // Re-render messages if there's history
    if (FA.chatHistory.length > 0) FA._renderChat();
    // Focus input
    setTimeout(() => { const i = document.getElementById('chatInput'); if (i) i.focus(); }, 50);
};

// ============ 14. TASKS ============
TABS.tasks = () => {
    const fStatus = FA.getFilter('tasks', 'status', '');
    const fPriority = FA.getFilter('tasks', 'priority', '');
    const filtered = STATE.tasks.filter(t => {
        if (fStatus && t.status !== fStatus) return false;
        if (fPriority && t.priority !== fPriority) return false;
        return true;
    });
    return `
        <div class="grid grid-cols-4" style="margin-bottom: 18px;">
            <div class="kpi"><div class="kpi-label">חדש</div><div class="kpi-value">${STATE.tasks.filter(t=>t.status==='חדש').length}</div></div>
            <div class="kpi"><div class="kpi-label">בטיפול</div><div class="kpi-value" style="color:var(--accent)">${STATE.tasks.filter(t=>t.status==='בטיפול').length}</div></div>
            <div class="kpi"><div class="kpi-label">ממתין לאישור</div><div class="kpi-value" style="color:var(--warning)">${STATE.tasks.filter(t=>t.status==='ממתין לאישור').length}</div></div>
            <div class="kpi"><div class="kpi-label">קריטי</div><div class="kpi-value" style="color:var(--error)">${STATE.tasks.filter(t=>t.priority==='קריטית').length}</div></div>
        </div>

        <div class="table-wrap">
            <div class="table-toolbar">
                <h3>משימות פיננסיות ${filtered.length !== STATE.tasks.length ? `(${filtered.length}/${STATE.tasks.length})` : ''}</h3>
                <div class="filter-row">
                    <select class="filter-select" onchange="FA.setFilter('tasks','status',this.value)">
                        <option value="">כל הסטטוסים</option>
                        ${['חדש','בטיפול','ממתין לאישור','הושלם','נדחה'].map(s => `<option ${s===fStatus?'selected':''}>${s}</option>`).join('')}
                    </select>
                    <select class="filter-select" onchange="FA.setFilter('tasks','priority',this.value)">
                        <option value="">כל הדחיפויות</option>
                        ${['קריטית','גבוהה','בינונית','נמוכה'].map(p => `<option ${p===fPriority?'selected':''}>${p}</option>`).join('')}
                    </select>
                    ${fStatus||fPriority ? `<button class="btn sm" onclick="FA.clearFilters('tasks')">✕ נקה</button>` : ''}
                    <button class="btn sm" onclick="FA.exportToExcel('משימות')">📊 ייצא</button>
                    <button class="btn sm primary" onclick="FA.addTask()">+ משימה חדשה</button>
                </div>
            </div>
            <table>
                <thead><tr><th>משימה</th><th>דחיפות</th><th>אחראי</th><th>תאריך יעד</th><th>קשור ל</th><th>סכום</th><th>סטטוס</th><th>פעולה</th></tr></thead>
                <tbody>
                    ${filtered.length === 0 ? `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--muted);">אין משימות תואמות</td></tr>` : filtered.map(t => {
                        const idx = STATE.tasks.indexOf(t);
                        return `
                        <tr>
                            <td><strong>${t.title}</strong></td>
                            <td>${statusPill(t.priority)}</td>
                            <td>${t.assignee}</td>
                            <td>${t.due}</td>
                            <td style="font-size:11px; color:var(--text-soft)">${t.related}</td>
                            <td class="num">${t.amount ? fmt(t.amount) : '-'}</td>
                            <td>${statusPill(t.status)}</td>
                            <td><div class="action-icons">
                                ${t.status !== 'הושלם' ? `<button class="icon-action" title="סמן כהושלם" onclick="FA.completeTask(${idx})">✓</button>` : ''}
                                <button class="icon-action" title="עריכה" onclick="FA.editTask(${idx})">✎</button>
                            </div></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
};

// ============ 15. ALERTS ============
TABS.alerts = () => `
    <div class="grid grid-cols-4" style="margin-bottom: 18px;">
        <div class="kpi"><div class="kpi-label">קריטיות</div><div class="kpi-value" style="color:var(--error)">${STATE.alerts.filter(a=>a.severity==='critical').length}</div></div>
        <div class="kpi"><div class="kpi-label">גבוהות</div><div class="kpi-value" style="color:var(--warning)">${STATE.alerts.filter(a=>a.severity==='high').length}</div></div>
        <div class="kpi"><div class="kpi-label">בינוניות</div><div class="kpi-value" style="color:var(--info)">${STATE.alerts.filter(a=>a.severity==='medium').length}</div></div>
        <div class="kpi"><div class="kpi-label">נמוכות</div><div class="kpi-value">${STATE.alerts.filter(a=>a.severity==='low').length}</div></div>
    </div>

    ${STATE.alerts.length === 0 ? `<div class="placeholder-zone"><div class="ph-icon">🎉</div><div class="ph-title">אין התראות פתוחות</div><div class="ph-sub">כל המצב נקי</div></div>` :
    STATE.alerts.map((a, i) => `
        <div class="action-card priority-${a.severity}">
            <div class="action-card-h">
                <div>
                    <div class="action-card-title">${a.title}</div>
                    <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">${a.type}</div>
                </div>
                ${severityPill(a.severity)}
            </div>
            <div class="action-card-desc">${a.desc}</div>
            <div class="action-card-meta">
                <span>💰 ${fmt(a.amount)}</span>
                <span>🏷️ ${a.entity}</span>
                <span>📅 ${a.date}</span>
            </div>
            <div class="action-card-buttons">
                <button class="btn xs primary" onclick="FA.createTaskFromInsight(${i},'alerts')">צור משימה</button>
                <button class="btn xs success" onclick="FA.resolveInsight(${i},'alerts')">סמן כטופל</button>
                <button class="btn xs" onclick="FA.openModal('${a.title.replace(/'/g,'')}', '<p>${a.desc.replace(/'/g,'')}</p><p style=\\'margin-top:10px; font-size:11px; color:var(--muted)\\'>סכום: ₪${a.amount.toLocaleString('he-IL')} · ${a.entity} · ${a.date}</p>', [{label:'סגור',onclick:FA.closeModal}])">פתח פרטים</button>
            </div>
        </div>
    `).join('')}
`;

// ============ 16. SETTINGS ============
TABS.settings = () => {
    const s = STATE.settings || {};
    const alerts = (s.alerts || {});
    return `
        <div class="disclaimer">הסוכן הפיננסי אינו מחליף רואה חשבון, יועץ מס או ייעוץ משפטי. הוא מציג תובנות עסקיות ופיננסיות לצורך קבלת החלטות ובדיקת נתונים.</div>

        <div class="grid grid-cols-2">
            <div class="card">
                <div class="card-title" style="margin-bottom: 14px;">הגדרות כלליות</div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">מטבע ברירת מחדל</div></div><strong>₪ שקל</strong></div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">שיעור מע״מ</div></div><strong>${s.vatRate || '18'}%</strong> <button class="btn xs" onclick="FA.editSetting('vatRate','שיעור מע״מ','${s.vatRate || 18}')">ערוך</button></div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">תחילת חודש פיסקלי</div></div><strong>1 בכל חודש</strong></div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">תקופת דיווח מע״מ</div></div><strong>${s.vatPeriod || 'דו-חודשי'}</strong> <button class="btn xs" onclick="FA.editSetting('vatPeriod','תקופת דיווח','${s.vatPeriod || 'דו-חודשי'}')">ערוך</button></div>
            </div>

            <div class="card">
                <div class="card-title" style="margin-bottom: 14px;">יעדים</div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">יעד רווחיות חודשי</div></div><strong>${s.profitTarget || 35}%</strong> <button class="btn xs" onclick="FA.editSetting('profitTarget','יעד רווחיות %','${s.profitTarget || 35}')">ערוך</button></div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">יעד הכנסות חודשי</div></div><strong>${fmt(s.revenueTarget || 200000)}</strong> <button class="btn xs" onclick="FA.editSetting('revenueTarget','יעד הכנסות','${s.revenueTarget || 200000}')">ערוך</button></div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">סף תזרים מינימלי</div></div><strong>${fmt(s.minCash || 150000)}</strong> <button class="btn xs" onclick="FA.editSetting('minCash','סף תזרים','${s.minCash || 150000}')">ערוך</button></div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">תקרת CPL</div></div><strong>${fmt(s.cplCap || 100)}</strong> <button class="btn xs" onclick="FA.editSetting('cplCap','תקרת CPL','${s.cplCap || 100}')">ערוך</button></div>
            </div>

            <div class="card">
                <div class="card-title" style="margin-bottom: 14px;">הרשאות וטיפול</div>
                ${[
                    {role: 'בעלים', users: 1, perm: 'הכל'},
                    {role: 'מנהל כספים', users: 0, perm: 'כל הפיננסי'},
                    {role: 'רו״ח', users: 1, perm: 'מסמכים + דוחות'},
                    {role: 'מנהל תפעול', users: 0, perm: 'תפעול בלבד'},
                    {role: 'נציג מכירות', users: 3, perm: 'עסקאות שלו'},
                    {role: 'צופה בלבד', users: 0, perm: 'דוחות בלבד'},
                ].map(r => `
                    <div class="list-item">
                        <div class="list-item-text">
                            <div class="list-item-title">${r.role}</div>
                            <div class="list-item-sub">${r.perm} · ${r.users} משתמשים</div>
                        </div>
                        <button class="btn xs" onclick="FA.toast('עריכת הרשאות תיבנה בשלב Multi-tenant','info')">ערוך</button>
                    </div>
                `).join('')}
            </div>

            <div class="card">
                <div class="card-title" style="margin-bottom: 14px;">סיכונים והתראות</div>
                ${[
                    {key:'unusualExpense', label:'התראת חריגת הוצאה', sub:'מעל 25% מהממוצע'},
                    {key:'lateCollection', label:'התראת איחור גבייה', sub:'מעל 7 ימים'},
                    {key:'negCashflow', label:'התראת תזרים שלילי', sub:'בעוד 14 יום'},
                    {key:'duplicateCharge', label:'התראת חיוב כפול', sub:'אוטומטי'},
                ].map(a => {
                    const active = alerts[a.key] !== false; // default true
                    return `<div class="list-item">
                        <div class="list-item-text"><div class="list-item-title">${a.label}</div><div class="list-item-sub">${a.sub}</div></div>
                        <button class="btn xs ${active?'success':''}" onclick="FA.toggleAlert('${a.key}')">${active ? '✓ פעיל' : '○ כבוי'}</button>
                    </div>`;
                }).join('')}
            </div>
        </div>

        <div class="section-title" style="margin-top: 24px; display:flex; justify-content:space-between; align-items:center;">
            <span>⚡ ערך שהסוכן הביא החודש</span>
            <button class="btn xs danger" onclick="FA.resetDemo()">🔄 איפוס נתוני דמו</button>
        </div>
        <div class="grid grid-cols-4">
            <div class="kpi"><div class="kpi-label">כסף אבוד שאותר</div><div class="kpi-value" style="color:var(--success)">${fmt(54121)}</div></div>
            <div class="kpi"><div class="kpi-label">גבייה בעקבות התראות</div><div class="kpi-value">${fmt(31200)}</div></div>
            <div class="kpi"><div class="kpi-label">הוצאות חריגות זוהו</div><div class="kpi-value">12</div></div>
            <div class="kpi"><div class="kpi-label">התאמות בנק אוטו׳</div><div class="kpi-value">${STATE.bankTx.filter(t=>t.status.includes('אוטומטית')).length}/${STATE.bankTx.length}</div></div>
            <div class="kpi"><div class="kpi-label">זמן שנחסך</div><div class="kpi-value">~14 שעות</div></div>
            <div class="kpi"><div class="kpi-label">דוחות הופקו</div><div class="kpi-value">${STATE.reports.length}</div></div>
            <div class="kpi"><div class="kpi-label">משימות מתובנות</div><div class="kpi-value">${STATE.tasks.length}</div></div>
            <div class="kpi"><div class="kpi-label">שיפור רווחיות</div><div class="kpi-value" style="color:var(--success)">+3.2%</div></div>
        </div>
    `;
};


