/**
 * Financial Agent - Tab Renderers
 * All UI for the 16 tabs of the Financial Agent module.
 * Uses MOCK data only (no real API calls yet) - PRD Phase 1.
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
        'תקין': 'success', 'גבוהה': 'warning',
        'מעודכן': 'success', 'ישן': 'warning',
    };
    return `<span class="pill ${map[status] || 'neutral'}">${status}</span>`;
}

function severityPill(s) {
    const map = { 'critical': 'error', 'high': 'warning', 'medium': 'info', 'low': 'neutral',
                  'קריטי': 'error', 'דחוף': 'error', 'חשוב': 'warning', 'מידע': 'info' };
    const label = { 'critical': 'קריטי', 'high': 'גבוה', 'medium': 'בינוני', 'low': 'נמוך' };
    return `<span class="pill ${map[s] || 'neutral'}">${label[s] || s}</span>`;
}

// ============ 1. DASHBOARD ============
TABS.dashboard = () => {
    const k = MOCK.kpis;
    return `
        <!-- AI insight banner -->
        <div class="ai-banner">
            <div class="ai-banner-h">סיכום AI - מה הסוכן רואה החודש</div>
            <div class="ai-insight">העסק הכניס החודש <strong>${fmt(k.revenue.value)}</strong> אבל הרווחיות ירדה ל-<strong>${fmtPct(k.margin.value)}</strong> בגלל עלייה של <strong>38%</strong> בהוצאות פרסום.</div>
            <div class="ai-insight">יש כרגע <strong>${fmt(k.openCollections.value)}</strong> שעדיין לא נגבו מ-${k.openInvoices.value} לקוחות. זה משפיע ישירות על התזרים.</div>
            <div class="ai-insight">לפי קצב ההכנסות הנוכחי העסק צפוי לסיים את החודש עם <strong>${fmt(k.forecastRevenue.value)}</strong> הכנסות ו-<strong>${fmt(k.forecastProfit.value)}</strong> רווח משוער.</div>
        </div>

        <!-- KPI Cards Row 1 - Top Level -->
        <div class="grid grid-cols-4" style="margin-bottom: 14px;">
            <div class="kpi">
                <div class="kpi-label">סך הכנסות החודש</div>
                <div class="kpi-value">${fmt(k.revenue.value)}</div>
                ${trend(k.revenue.trend)} <span class="kpi-meta">מאפריל ${fmt(k.revenue.prev)}</span>
            </div>
            <div class="kpi">
                <div class="kpi-label">סך הוצאות החודש</div>
                <div class="kpi-value">${fmt(k.expenses.value)}</div>
                ${trend(k.expenses.trend)} <span class="kpi-meta">מאפריל ${fmt(k.expenses.prev)}</span>
            </div>
            <div class="kpi">
                <div class="kpi-label">רווח נקי משוער</div>
                <div class="kpi-value" style="color: var(--success);">${fmt(k.profit.value)}</div>
                ${trend(k.profit.trend)} <span class="kpi-meta">מאפריל ${fmt(k.profit.prev)}</span>
            </div>
            <div class="kpi">
                <div class="kpi-label">אחוז רווחיות</div>
                <div class="kpi-value">${fmtPct(k.margin.value)}</div>
                ${trend(k.margin.trend)} <span class="kpi-meta">מאפריל ${fmtPct(k.margin.prev)}</span>
            </div>
        </div>

        <!-- KPI Cards Row 2 - Cash & Collections -->
        <div class="grid grid-cols-4" style="margin-bottom: 14px;">
            <div class="kpi">
                <div class="kpi-label">תזרים זמין</div>
                <div class="kpi-value">${fmt(k.cash.value)}</div>
                ${trend(k.cash.trend)} <span class="kpi-meta">יתרת בנק נטו</span>
            </div>
            <div class="kpi">
                <div class="kpi-label">גבייה פתוחה</div>
                <div class="kpi-value" style="color: var(--warning);">${fmt(k.openCollections.value)}</div>
                ${trend(k.openCollections.trend)} <span class="kpi-meta">${k.openInvoices.value} חשבוניות פתוחות</span>
            </div>
            <div class="kpi">
                <div class="kpi-label">הוצאות חריגות</div>
                <div class="kpi-value" style="color: var(--error);">${fmt(k.unusualExpenses.value)}</div>
                ${trend(k.unusualExpenses.trend)} <span class="kpi-meta">דורש בדיקה</span>
            </div>
            <div class="kpi">
                <div class="kpi-label">תקציב פרסום מול הכנסות</div>
                <div class="kpi-value">${fmtPct(k.adRatio.value)}</div>
                ${trend(k.adRatio.trend)} <span class="kpi-meta">בנצ׳מארק: 10-15%</span>
            </div>
        </div>

        <!-- KPI Cards Row 3 - Marketing & Forecast -->
        <div class="grid grid-cols-4" style="margin-bottom: 24px;">
            <div class="kpi">
                <div class="kpi-label">עלות ליד (CPL)</div>
                <div class="kpi-value">${fmt(k.cpl.value)}</div>
                ${trend(k.cpl.trend)} <span class="kpi-meta">השתפר מ-${fmt(k.cpl.prev)}</span>
            </div>
            <div class="kpi">
                <div class="kpi-label">עלות לקוח (CAC)</div>
                <div class="kpi-value">${fmt(k.cac.value)}</div>
                ${trend(k.cac.trend)} <span class="kpi-meta">מ-${fmt(k.cac.prev)}</span>
            </div>
            <div class="kpi">
                <div class="kpi-label">צפי הכנסות סוף חודש</div>
                <div class="kpi-value" style="color: var(--accent);">${fmt(k.forecastRevenue.value)}</div>
                <span class="kpi-trend flat">תרחיש ריאלי</span> <span class="kpi-meta">+ ${fmt(k.forecastRevenue.value - k.revenue.value)}</span>
            </div>
            <div class="kpi">
                <div class="kpi-label">צפי רווח סוף חודש</div>
                <div class="kpi-value" style="color: var(--success);">${fmt(k.forecastProfit.value)}</div>
                <span class="kpi-trend flat">תרחיש ריאלי</span> <span class="kpi-meta">רווחיות ${fmtPct(k.forecastProfit.value/k.forecastRevenue.value*100)}</span>
            </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-2" style="margin-bottom: 24px;">
            <div class="card">
                <div class="card-h"><div><div class="card-title">הכנסות מול הוצאות</div><div class="card-subtitle">6 חודשים אחרונים</div></div></div>
                <div class="vbar-chart">
                    ${[
                        {m: 'דצמ׳', i: 145, e: 102},
                        {m: 'ינו׳', i: 158, e: 110},
                        {m: 'פבר׳', i: 162, e: 105},
                        {m: 'מרץ', i: 175, e: 119},
                        {m: 'אפר׳', i: 170, e: 107},
                        {m: 'מאי', i: 184, e: 123},
                    ].map(d => `
                        <div class="vbar-col">
                            <div class="vbar-group">
                                <div class="vbar income" style="height: ${d.i / 2}%;" title="הכנסות ${fmt(d.i*1000)}"></div>
                                <div class="vbar expense" style="height: ${d.e / 2}%;" title="הוצאות ${fmt(d.e*1000)}"></div>
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
                <div class="card-h"><div><div class="card-title">חלוקת הוצאות לפי קטגוריה</div><div class="card-subtitle">מאי 2026</div></div></div>
                <div class="bar-chart">
                    ${[
                        {l: 'פרסום', v: 18800, c: 'var(--accent)'},
                        {l: 'פרילנסרים', v: 16500, c: 'var(--info)'},
                        {l: 'שכירות + משרד', v: 4484, c: 'var(--text-soft)'},
                        {l: 'תוכנות + AI', v: 3093, c: 'var(--warning)'},
                        {l: 'רו״ח + יעוץ', v: 2596, c: 'var(--muted)'},
                        {l: 'עמלות סליקה', v: 1156, c: 'var(--error)'},
                        {l: 'רכבים', v: 448, c: 'var(--text-soft)'},
                    ].map(item => `
                        <div class="bar-row">
                            <div class="bar-label">${item.l}</div>
                            <div class="bar-track"><div class="bar-fill" style="width: ${item.v / 200}%; background: ${item.c};"></div></div>
                            <div class="bar-value">${fmt(item.v)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Recommended Actions + Alerts -->
        <div class="grid grid-cols-2">
            <div>
                <div class="section-title">פעולות מומלצות (Top 4)</div>
                ${MOCK.lost.slice(0, 4).map((item, i) => `
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
                            <button class="btn xs primary">צור משימה</button>
                            <button class="btn xs">בדוק פרטים</button>
                            <button class="btn xs">דחה</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div>
                <div class="section-title">התראות חמות</div>
                ${MOCK.alerts.slice(0, 4).map(a => `
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
                            <button class="btn xs primary">צור משימה</button>
                            <button class="btn xs">סמן כטופל</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

// ============ 2. INCOME ============
TABS.income = () => `
    <div class="grid grid-cols-4" style="margin-bottom: 18px;">
        <div class="kpi"><div class="kpi-label">סך הכנסות החודש</div><div class="kpi-value">${fmt(184000)}</div>${trend(8)} <span class="kpi-meta">${MOCK.income.length} תנועות</span></div>
        <div class="kpi"><div class="kpi-label">שולם בפועל</div><div class="kpi-value" style="color: var(--success);">${fmt(142000)}</div><span class="kpi-meta">77% מהסכום</span></div>
        <div class="kpi"><div class="kpi-label">פתוח לגבייה</div><div class="kpi-value" style="color: var(--warning);">${fmt(42000)}</div><span class="kpi-meta">${MOCK.collections.length} חשבוניות</span></div>
        <div class="kpi"><div class="kpi-label">ממוצע לעסקה</div><div class="kpi-value">${fmt(Math.round(184000/MOCK.income.length))}</div><span class="kpi-meta">לעומת ${fmt(13500)} בחודש שעבר</span></div>
    </div>

    <div class="table-wrap">
        <div class="table-toolbar">
            <h3>הכנסות - ${MOCK.currentMonth}</h3>
            <div class="filter-row">
                <input class="filter-input" placeholder="🔍 חיפוש לקוח/חשבונית"/>
                <select class="filter-select"><option>כל הסטטוסים</option><option>שולם</option><option>ממתין</option><option>באיחור</option></select>
                <select class="filter-select"><option>כל המקורות</option><option>Google</option><option>Facebook</option><option>LinkedIn</option><option>אורגני</option></select>
                <select class="filter-select"><option>כל הנציגים</option><option>יוסי כהן</option><option>רחל לוי</option><option>דנה אבן</option></select>
                <button class="btn sm">📊 ייצא Excel</button>
                <button class="btn sm primary">+ הכנסה ידנית</button>
            </div>
        </div>
        <div style="overflow-x: auto;">
        <table>
            <thead><tr>
                <th>תאריך</th><th>לקוח</th><th>מקור</th><th>שירות</th>
                <th>לפני מע״מ</th><th>מע״מ</th><th>כולל</th>
                <th>אמצעי</th><th>סטטוס</th><th>חשבונית</th>
                <th>תאריך פירעון</th><th>נציג</th><th>קמפיין</th>
                <th>התאמה בנק</th><th>פעולות</th>
            </tr></thead>
            <tbody>
                ${MOCK.income.map(r => `
                    <tr>
                        <td>${r.date}</td>
                        <td><strong>${r.client}</strong><br><span style="font-size:10px; color:var(--muted)">${r.business}</span></td>
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
                            <button class="icon-action" title="צפייה">👁</button>
                            <button class="icon-action" title="עריכה">✎</button>
                            <button class="icon-action" title="התאמה לבנק">🔗</button>
                        </div></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        </div>
    </div>
`;

// ============ 3. EXPENSES ============
TABS.expenses = () => `
    <!-- Smart expense insights -->
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
        </div>
        <div class="action-card priority-low">
            <div class="action-card-title">📦 מנוי לא בשימוש</div>
            <div class="action-card-desc">Loom - 0 שימושים החודש</div>
            <strong>${fmt(77)}</strong>/חודש
        </div>
    </div>

    <div class="grid grid-cols-4" style="margin-bottom: 18px;">
        <div class="kpi"><div class="kpi-label">סך הוצאות</div><div class="kpi-value">${fmt(123000)}</div>${trend(15)} <span class="kpi-meta">${MOCK.expenses.length} תנועות</span></div>
        <div class="kpi"><div class="kpi-label">הוצאות קבועות</div><div class="kpi-value">${fmt(28000)}</div><span class="kpi-meta">23% מסה״כ</span></div>
        <div class="kpi"><div class="kpi-label">הוצאות פרסום</div><div class="kpi-value">${fmt(18800)}</div>${trend(38)} <span class="kpi-meta">חריג</span></div>
        <div class="kpi"><div class="kpi-label">לא מוכרות</div><div class="kpi-value">${fmt(448)}</div><span class="kpi-meta">לבדיקה עם רו״ח</span></div>
    </div>

    <div class="table-wrap">
        <div class="table-toolbar">
            <h3>הוצאות - ${MOCK.currentMonth}</h3>
            <div class="filter-row">
                <input class="filter-input" placeholder="🔍 חיפוש ספק/פרויקט"/>
                <select class="filter-select"><option>כל הקטגוריות</option><option>פרסום</option><option>פרילנסרים</option><option>תוכנות</option><option>שכירות</option></select>
                <select class="filter-select"><option>קבוע + משתנה</option><option>קבוע</option><option>משתנה</option></select>
                <select class="filter-select"><option>כל החריגות</option><option>תקין</option><option>גבוהה</option></select>
                <button class="btn sm">📊 ייצא Excel</button>
                <button class="btn sm primary">+ הוצאה ידנית</button>
            </div>
        </div>
        <div style="overflow-x: auto;">
        <table>
            <thead><tr>
                <th>תאריך</th><th>ספק</th><th>קטגוריה</th><th>תת קטגוריה</th>
                <th>לפני מע״מ</th><th>מע״מ</th><th>כולל</th>
                <th>אמצעי</th><th>חשבון</th><th>קבוע/משתנה</th>
                <th>מוכרת</th><th>מחלקה</th><th>פרויקט</th>
                <th>התאמה</th><th>חריגה</th><th>פעולות</th>
            </tr></thead>
            <tbody>
                ${MOCK.expenses.map(r => `
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
                        <td>${r.project}</td>
                        <td>${statusPill(r.reconciled)}</td>
                        <td>${r.unusual === 'גבוהה' ? '<span class="pill warning">גבוהה ⚠️</span>' : '<span class="pill success">תקין</span>'}</td>
                        <td><div class="action-icons">
                            <button class="icon-action">👁</button>
                            <button class="icon-action">✎</button>
                            <button class="icon-action">🔗</button>
                        </div></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        </div>
    </div>
`;

// ============ 4. CASHFLOW ============
TABS.cashflow = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">תובנת AI - תזרים</div>
        <div class="ai-insight">⚠️ בעוד <strong>12 יום</strong> צפוי עומס תשלומים של <strong>${fmt(47000)}</strong> בזמן שהגבייה הצפויה עד אז היא רק <strong>${fmt(28000)}</strong>. צפוי פער של ${fmt(19000)}.</div>
        <div class="ai-insight">אם לא תגבה את 3 החשבוניות הפתוחות עד ה-20 לחודש, תיכנס לפער תזרים של ${fmt(19000)}.</div>
        <div class="ai-insight">העסק <strong>רווחי על הנייר</strong> אבל התזרים חלש בגלל תשלומים דחויים וגבייה איטית.</div>
    </div>

    <div class="grid grid-cols-4" style="margin-bottom: 18px;">
        <div class="kpi"><div class="kpi-label">יתרה נוכחית</div><div class="kpi-value">${fmt(287400)}</div><span class="kpi-meta">בנק + אשראי</span></div>
        <div class="kpi"><div class="kpi-label">הכנסות צפויות 30 יום</div><div class="kpi-value" style="color: var(--success);">${fmt(78000)}</div><span class="kpi-meta">לפי גבייה + עסקאות פתוחות</span></div>
        <div class="kpi"><div class="kpi-label">הוצאות צפויות 30 יום</div><div class="kpi-value" style="color: var(--accent);">${fmt(61000)}</div><span class="kpi-meta">קבועות + ידועות</span></div>
        <div class="kpi"><div class="kpi-label">תחזית סוף 30 יום</div><div class="kpi-value">${fmt(304400)}</div><span class="kpi-meta">+${fmt(17000)} מהיום</span></div>
    </div>

    <div class="card" style="margin-bottom: 18px;">
        <div class="card-h"><div><div class="card-title">תחזית תזרים 60 יום</div><div class="card-subtitle">יתרה + הכנסות צפויות - הוצאות צפויות</div></div></div>
        <div class="bar-chart">
            ${MOCK.cashFlowForecast.map(f => `
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
            <div class="card-h"><div class="card-title">גבייה צפויה (7 ימים)</div></div>
            ${[
                {name: 'מטבחי דרור', amount: 28320, due: '15 ביוני', cat: 'צ׳ק'},
                {name: 'חברת קוסמה (יתרה)', amount: 18880, due: '30 ביוני', cat: 'העברה'},
                {name: 'עו״ד שירה ברק', amount: 5310, due: 'באיחור', cat: 'דורש דחיפה'},
                {name: 'יעקובי דיגיטל', amount: 8850, due: 'באיחור 16 ימים', cat: 'דחוף'},
            ].map(c => `
                <div class="list-item">
                    <div class="list-item-text">
                        <div class="list-item-title">${c.name}</div>
                        <div class="list-item-sub">${c.due} · ${c.cat}</div>
                    </div>
                    <div class="list-item-val" style="color: var(--success)">${fmt(c.amount)}</div>
                </div>
            `).join('')}
        </div>
    </div>
`;

// ============ 5. COLLECTIONS ============
TABS.collections = () => `
    <div class="grid grid-cols-4" style="margin-bottom: 18px;">
        <div class="kpi"><div class="kpi-label">סך פתוח לגבייה</div><div class="kpi-value" style="color: var(--warning);">${fmt(72280)}</div><span class="kpi-meta">${MOCK.collections.length} לקוחות</span></div>
        <div class="kpi"><div class="kpi-label">באיחור</div><div class="kpi-value" style="color: var(--error);">${fmt(25080)}</div><span class="kpi-meta">3 חשבוניות</span></div>
        <div class="kpi"><div class="kpi-label">צפי גבייה השבוע</div><div class="kpi-value" style="color: var(--success);">${fmt(28320)}</div><span class="kpi-meta">צ׳ק מטבחי דרור</span></div>
        <div class="kpi"><div class="kpi-label">צפי גבייה החודש</div><div class="kpi-value">${fmt(72280)}</div><span class="kpi-meta">100% אם הכל נכנס</span></div>
    </div>

    <div class="table-wrap">
        <div class="table-toolbar">
            <h3>גבייה פתוחה</h3>
            <div class="filter-row">
                <select class="filter-select"><option>כל הסטטוסים</option><option>ממתין</option><option>באיחור</option><option>קריטי</option></select>
                <select class="filter-select"><option>כל הנציגים</option><option>יוסי כהן</option><option>רחל לוי</option><option>דנה אבן</option></select>
                <button class="btn sm">📧 שלח תזכורות בכמות</button>
                <button class="btn sm primary">+ משימת גבייה</button>
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
                ${MOCK.collections.map(c => `
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
                            <button class="icon-action" title="צור משימה">+</button>
                            <button class="icon-action" title="סמן ששולם">✓</button>
                            <button class="icon-action" title="שלח תזכורת">📧</button>
                            <button class="icon-action" title="הערה">💬</button>
                        </div></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        </div>
    </div>
`;

// ============ 6. LOST MONEY ============
TABS.lost = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">סיכום AI - כסף אבוד שאותר החודש</div>
        <div class="ai-insight">סה״כ כסף אבוד שאותר: <strong style="color: var(--error)">${fmt(MOCK.lost.reduce((s, l) => s + l.amount, 0))}</strong>. רובו ניתן להחזרה.</div>
        <div class="ai-insight">המוקד הכי חשוב: <strong>${fmt(17420)}</strong> בגבייה פתוחה מעל 45 יום - הסיכון הכי גבוה לאבד אותם.</div>
        <div class="ai-insight">הזדמנות חיסכון חודשית: <strong>${fmt(2870)}</strong> במנויים מיותרים = <strong>${fmt(34440)}</strong> בשנה.</div>
    </div>

    <div class="grid grid-cols-3" style="margin-bottom: 18px;">
        <div class="kpi"><div class="kpi-label">סך כסף אבוד שאותר</div><div class="kpi-value" style="color: var(--error);">${fmt(MOCK.lost.reduce((s, l) => s + l.amount, 0))}</div><span class="kpi-meta">${MOCK.lost.length} מקורות</span></div>
        <div class="kpi"><div class="kpi-label">ניתן להחזרה</div><div class="kpi-value" style="color: var(--success);">${fmt(36511)}</div><span class="kpi-meta">76% מהסכום</span></div>
        <div class="kpi"><div class="kpi-label">חיסכון חודשי פוטנציאלי</div><div class="kpi-value">${fmt(11200)}</div><span class="kpi-meta">אם נטפל בכולם</span></div>
    </div>

    ${MOCK.lost.map(item => `
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
                <button class="btn xs primary">צור משימה</button>
                <button class="btn xs success">סמן כטופל</button>
                <button class="btn xs">בדוק פרטים</button>
                <button class="btn xs">דחה</button>
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
            <table>
                <thead><tr><th>שירות</th><th>הכנסות</th><th>עלויות</th><th>רווח</th><th>אחוז רווחיות</th><th>סטטוס</th></tr></thead>
                <tbody>
                ${MOCK.profitabilityByService.map(s => `
                    <tr>
                        <td><strong>${s.name}</strong></td>
                        <td class="num">${fmt(s.revenue)}</td>
                        <td class="num">${fmt(s.costs)}</td>
                        <td class="num pos"><strong>${fmt(s.profit)}</strong></td>
                        <td class="num">${fmtPct(s.margin)}</td>
                        <td>${s.margin >= 60 ? '<span class="pill success">מעולה</span>' : s.margin >= 35 ? '<span class="pill info">טוב</span>' : s.margin >= 20 ? '<span class="pill warning">סביר</span>' : '<span class="pill error">חלש</span>'}</td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <div id="prof-client" class="prof-view" style="display:none;">
        <div class="table-wrap">
            <table>
                <thead><tr><th>לקוח</th><th>הכנסות</th><th>עלויות</th><th>רווח</th><th>אחוז רווחיות</th><th>סטטוס</th></tr></thead>
                <tbody>
                ${MOCK.profitabilityByClient.map(c => `
                    <tr>
                        <td><strong>${c.name}</strong></td>
                        <td class="num">${fmt(c.revenue)}</td>
                        <td class="num">${fmt(c.costs)}</td>
                        <td class="num pos"><strong>${fmt(c.profit)}</strong></td>
                        <td class="num">${fmtPct(c.margin)}</td>
                        <td>${c.margin >= 60 ? '<span class="pill success">מעולה</span>' : c.margin >= 35 ? '<span class="pill info">טוב</span>' : c.margin >= 20 ? '<span class="pill warning">סביר</span>' : '<span class="pill error">לבדוק</span>'}</td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <div id="prof-campaign" class="prof-view" style="display:none;">
        <div class="table-wrap">
            <table>
                <thead><tr><th>קמפיין</th><th>הוצאה</th><th>לידים</th><th>סגירות</th><th>רווח</th><th>ROI</th><th>סטטוס</th></tr></thead>
                <tbody>
                ${MOCK.campaigns.map(c => `
                    <tr>
                        <td><strong>${c.name}</strong></td>
                        <td class="num">${fmt(c.spend)}</td>
                        <td class="num">${c.leads}</td>
                        <td class="num">${c.sales}</td>
                        <td class="num ${c.profit < 0 ? 'neg' : 'pos'}"><strong>${fmt(c.profit)}</strong></td>
                        <td class="num">${c.roi >= 200 ? '<strong style="color:var(--success)">'+c.roi+'%</strong>' : c.roi >= 0 ? c.roi+'%' : '<strong style="color:var(--error)">'+c.roi+'%</strong>'}</td>
                        <td>${statusPill(c.status)}</td>
                    </tr>
                `).join('')}
                </tbody>
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
    </div>

    <div class="grid grid-cols-4" style="margin-bottom: 18px;">
        <div class="kpi"><div class="kpi-label">סך הוצאה פרסום</div><div class="kpi-value">${fmt(31600)}</div><span class="kpi-meta">6 קמפיינים</span></div>
        <div class="kpi"><div class="kpi-label">סך הכנסות מקמפיינים</div><div class="kpi-value" style="color: var(--success);">${fmt(210500)}</div><span class="kpi-meta">23 עסקאות</span></div>
        <div class="kpi"><div class="kpi-label">ROI כולל</div><div class="kpi-value" style="color: var(--success);">566%</div><span class="kpi-meta">מעולה</span></div>
        <div class="kpi"><div class="kpi-label">CPL ממוצע</div><div class="kpi-value">${fmt(78)}</div>${trend(-12)}<span class="kpi-meta">השתפר</span></div>
    </div>

    <div class="table-wrap">
        <div class="table-toolbar">
            <h3>ביצועי קמפיינים</h3>
            <div class="filter-row">
                <button class="btn sm">📊 ייצא Excel</button>
            </div>
        </div>
        <div style="overflow-x: auto;">
        <table>
            <thead><tr>
                <th>קמפיין</th><th>הוצאה</th><th>לידים</th><th>פגישות</th><th>סגירות</th>
                <th>הכנסות</th><th>רווח</th><th>CPL</th><th>CAC</th><th>ROI</th><th>סטטוס</th><th>המלצה</th>
            </tr></thead>
            <tbody>
                ${MOCK.campaigns.map(c => `
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
TABS.reconciliation = () => `
    <div class="grid grid-cols-5" style="margin-bottom: 18px;">
        <div class="kpi"><div class="kpi-label">תנועות שיובאו</div><div class="kpi-value">${MOCK.bankTx.length}</div><span class="kpi-meta">מאי 2026</span></div>
        <div class="kpi"><div class="kpi-label">מותאם אוטומטית</div><div class="kpi-value" style="color: var(--success);">${MOCK.bankTx.filter(t=>t.status==='מותאם אוטומטית').length}</div></div>
        <div class="kpi"><div class="kpi-label">דורש בדיקה</div><div class="kpi-value" style="color: var(--warning);">${MOCK.bankTx.filter(t=>t.status==='דורש אישור').length}</div></div>
        <div class="kpi"><div class="kpi-label">חשד לכפילות</div><div class="kpi-value" style="color: var(--error);">${MOCK.bankTx.filter(t=>t.status==='חשד לכפילות').length}</div></div>
        <div class="kpi"><div class="kpi-label">לא נמצא מקור</div><div class="kpi-value" style="color: var(--error);">${MOCK.bankTx.filter(t=>t.status==='לא נמצא מקור').length}</div></div>
    </div>

    <div class="ai-banner">
        <div class="ai-banner-h">תובנות AI - התאמות</div>
        <div class="ai-insight">💡 נמצאה הכנסה של <strong>${fmt(12500)}</strong> בבנק מלקוח <strong>XYZ</strong> אבל לא נמצאה חשבונית תואמת. <strong>פעולה: יצירת חשבונית.</strong></div>
        <div class="ai-insight">⚠️ יש <strong>חיוב כפול</strong> בכרטיס אשראי מ-Anthropic באותו סכום בהפרש של יומיים.</div>
        <div class="ai-insight">📈 נמצאה הוצאה חוזרת של ${fmt(1190)} לספק חדש שלא הופיע בחודש הקודם.</div>
    </div>

    <div class="grid grid-cols-2" style="margin-bottom: 18px;">
        <div class="drop-zone">
            <div class="dz-icon">🏦</div>
            <div><strong>העלה דוח בנק</strong></div>
            <div style="font-size:11px; color:var(--muted); margin-top:4px;">PDF / CSV / XLS</div>
            <button class="btn sm primary" style="margin-top:10px;">בחר קובץ</button>
        </div>
        <div class="drop-zone">
            <div class="dz-icon">💳</div>
            <div><strong>העלה דוח אשראי</strong></div>
            <div style="font-size:11px; color:var(--muted); margin-top:4px;">PDF / CSV</div>
            <button class="btn sm primary" style="margin-top:10px;">בחר קובץ</button>
        </div>
    </div>

    <div class="table-wrap">
        <div class="table-toolbar">
            <h3>תנועות בנק ואשראי</h3>
            <div class="filter-row">
                <select class="filter-select"><option>כל הסטטוסים</option><option>מותאם</option><option>דורש בדיקה</option></select>
                <button class="btn sm">✓ אשר את כל המותאמים</button>
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
                ${MOCK.bankTx.map(t => `
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
                            <button class="icon-action" title="אשר">✓</button>
                            <button class="icon-action" title="דחה">✗</button>
                            <button class="icon-action" title="התאמה ידנית">🔗</button>
                        </div></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        </div>
    </div>
`;

// ============ 10. DOCUMENTS ============
TABS.documents = () => `
    <div class="disclaimer">הסוכן אינו מחליף ייעוץ משפטי או רואה חשבון. הוא מציף נקודות פיננסיות לבדיקה בלבד.</div>

    <div class="grid grid-cols-2" style="margin-bottom: 18px;">
        <div class="drop-zone">
            <div class="dz-icon">📄</div>
            <div><strong>העלה מסמך</strong></div>
            <div style="font-size:11px; color:var(--muted); margin-top:4px;">חשבונית, קבלה, הסכם, דוח</div>
            <button class="btn sm primary" style="margin-top:10px;">בחר קובץ</button>
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
            <h3>מסמכים פיננסיים</h3>
            <div class="filter-row">
                <input class="filter-input" placeholder="🔍 חיפוש מסמך"/>
                <select class="filter-select"><option>כל הסוגים</option><option>חשבונית מס</option><option>קבלה</option><option>הסכם</option></select>
                <select class="filter-select"><option>כל הסטטוסים</option><option>חולץ אוטומטית</option><option>דורש בדיקה</option><option>בעיבוד</option></select>
            </div>
        </div>
        <div style="overflow-x: auto;">
        <table>
            <thead><tr><th>שם מסמך</th><th>סוג</th><th>תאריך</th><th>לקוח/ספק</th><th>סכום</th><th>מע״מ</th><th>מספר</th><th>סטטוס חילוץ</th><th>ביטחון</th><th>פעולה</th></tr></thead>
            <tbody>
                ${MOCK.documents.map(d => `
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
                            <button class="icon-action" title="צפייה">👁</button>
                            <button class="icon-action" title="עריכת חילוץ">✎</button>
                            <button class="icon-action" title="אישור">✓</button>
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
        <div class="ai-insight">לפי קצב הסגירות הנוכחי בצינור המכירות, התרחיש הריאלי הוא <strong>${fmt(MOCK.scenarios.realistic.revenue)}</strong> הכנסות החודש.</div>
        <div class="ai-insight">כדי להגיע לתרחיש האופטימי (<strong>${fmt(MOCK.scenarios.optimistic.revenue)}</strong>) צריך לסגור 2 עסקאות גדולות שכרגע בשיחות אחרונות.</div>
    </div>

    <div class="grid grid-cols-3" style="margin-bottom: 24px;">
        <div class="scenario-card conservative">
            <div class="card-title">תרחיש שמרני 🛡️</div>
            <div style="font-size: 22px; font-weight: 700; color: var(--warning); margin: 12px 0;">${fmt(MOCK.scenarios.conservative.revenue)}</div>
            <div style="font-size:11px; color:var(--muted); margin-bottom: 10px;">הנחה: ${MOCK.scenarios.conservative.assumption}</div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">רווח</div></div><div class="list-item-val">${fmt(MOCK.scenarios.conservative.profit)}</div></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">תזרים סוף חודש</div></div><div class="list-item-val">${fmt(MOCK.scenarios.conservative.cash)}</div></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">סיכון</div></div>${statusPill(MOCK.scenarios.conservative.risk === 'גבוה' ? 'באיחור' : 'שולם')}</div>
            <div style="font-size:11.5px; color: var(--text-soft); margin-top: 10px;"><strong>פעולה:</strong> ${MOCK.scenarios.conservative.action}</div>
        </div>
        <div class="scenario-card realistic">
            <div class="card-title">תרחיש ריאלי 🎯</div>
            <div style="font-size: 22px; font-weight: 700; color: var(--accent); margin: 12px 0;">${fmt(MOCK.scenarios.realistic.revenue)}</div>
            <div style="font-size:11px; color:var(--muted); margin-bottom: 10px;">הנחה: ${MOCK.scenarios.realistic.assumption}</div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">רווח</div></div><div class="list-item-val">${fmt(MOCK.scenarios.realistic.profit)}</div></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">תזרים סוף חודש</div></div><div class="list-item-val">${fmt(MOCK.scenarios.realistic.cash)}</div></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">סיכון</div></div><span class="pill info">בינוני</span></div>
            <div style="font-size:11.5px; color: var(--text-soft); margin-top: 10px;"><strong>פעולה:</strong> ${MOCK.scenarios.realistic.action}</div>
        </div>
        <div class="scenario-card optimistic">
            <div class="card-title">תרחיש אופטימי 🚀</div>
            <div style="font-size: 22px; font-weight: 700; color: var(--success); margin: 12px 0;">${fmt(MOCK.scenarios.optimistic.revenue)}</div>
            <div style="font-size:11px; color:var(--muted); margin-bottom: 10px;">הנחה: ${MOCK.scenarios.optimistic.assumption}</div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">רווח</div></div><div class="list-item-val">${fmt(MOCK.scenarios.optimistic.profit)}</div></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">תזרים סוף חודש</div></div><div class="list-item-val">${fmt(MOCK.scenarios.optimistic.cash)}</div></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">סיכון</div></div><span class="pill success">נמוך</span></div>
            <div style="font-size:11.5px; color: var(--text-soft); margin-top: 10px;"><strong>פעולה:</strong> ${MOCK.scenarios.optimistic.action}</div>
        </div>
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
            <div class="card">
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
        ${MOCK.reports.map(r => `
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
                    <button class="btn xs primary">צפייה</button>
                    <button class="btn xs">📄 PDF</button>
                    <button class="btn xs">📊 Excel</button>
                </div>
            </div>
        `).join('')}
    </div>
`;

// ============ 13. CHAT ============
TABS.chat = () => `
    <div class="grid grid-cols-2" style="gap: 20px; height: calc(100vh - 180px);">
        <div style="display: flex; flex-direction: column; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
            <div style="padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <strong>💬 צ׳אט פיננסי</strong>
                <span class="pill info">דוגמה - לא מחובר ל-AI אמיתי בשלב זה</span>
            </div>
            <div style="flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 12px;">
                <div style="background: var(--bg-hover); padding: 12px 14px; border-radius: 10px; max-width: 80%; align-self: flex-start; font-size: 13px;">
                    <strong>סוכן פיננסי:</strong> שלום רון 👋 איך אני יכול לעזור היום? אתה יכול לשאול אותי כל שאלה על הכספים של העסק.
                </div>
                <div style="background: var(--accent-soft); padding: 12px 14px; border-radius: 10px; max-width: 80%; align-self: flex-end; font-size: 13px;">
                    <strong>אתה:</strong> כמה הרווחתי החודש?
                </div>
                <div style="background: var(--bg-hover); padding: 12px 14px; border-radius: 10px; max-width: 80%; align-self: flex-start; font-size: 13px; line-height: 1.6;">
                    <strong>סוכן פיננסי:</strong> החודש הרווח המשוער שלך הוא <strong>${fmt(61000)}</strong>. ההכנסות גבוהות יותר מהחודש הקודם (+8%), אבל ההוצאות על פרסום ופרילנסרים עלו בצורה משמעותית.
                    <br><br>
                    <strong>הפעולה המומלצת:</strong> לבדוק את 3 הקמפיינים הכי יקרים ולוודא שהם באמת מייצרים עסקאות רווחיות.
                    <div style="display: flex; gap: 6px; margin-top: 10px;">
                        <button class="btn xs primary">פתח ניתוח קמפיינים</button>
                        <button class="btn xs">צור משימה</button>
                    </div>
                </div>
            </div>
            <div style="padding: 12px; border-top: 1px solid var(--border); display: flex; gap: 8px;">
                <input class="filter-input" style="flex:1; padding: 10px 14px; font-size: 13px;" placeholder="שאל את הסוכן הפיננסי..."/>
                <button class="btn primary">שלח</button>
            </div>
        </div>

        <div>
            <div class="card-title" style="margin-bottom: 10px;">שאלות מוצעות</div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
                ${[
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
                    'כמה כסף הפסדתי מהנחות?',
                ].map(q => `
                    <button class="btn" style="text-align: right; justify-content: flex-start; font-weight: 400; font-size: 12.5px;">💭 ${q}</button>
                `).join('')}
            </div>
        </div>
    </div>
`;

// ============ 14. TASKS ============
TABS.tasks = () => `
    <div class="grid grid-cols-4" style="margin-bottom: 18px;">
        <div class="kpi"><div class="kpi-label">חדש</div><div class="kpi-value">${MOCK.tasks.filter(t=>t.status==='חדש').length}</div></div>
        <div class="kpi"><div class="kpi-label">בטיפול</div><div class="kpi-value" style="color:var(--accent)">${MOCK.tasks.filter(t=>t.status==='בטיפול').length}</div></div>
        <div class="kpi"><div class="kpi-label">ממתין לאישור</div><div class="kpi-value" style="color:var(--warning)">${MOCK.tasks.filter(t=>t.status==='ממתין לאישור').length}</div></div>
        <div class="kpi"><div class="kpi-label">קריטי</div><div class="kpi-value" style="color:var(--error)">${MOCK.tasks.filter(t=>t.priority==='קריטית').length}</div></div>
    </div>

    <div class="table-wrap">
        <div class="table-toolbar">
            <h3>משימות פיננסיות</h3>
            <div class="filter-row">
                <select class="filter-select"><option>כל הסטטוסים</option><option>חדש</option><option>בטיפול</option><option>הושלם</option></select>
                <select class="filter-select"><option>כל הדחיפויות</option><option>קריטית</option><option>גבוהה</option><option>בינונית</option></select>
                <button class="btn sm primary">+ משימה חדשה</button>
            </div>
        </div>
        <table>
            <thead><tr><th>משימה</th><th>דחיפות</th><th>אחראי</th><th>תאריך יעד</th><th>קשור ל</th><th>סכום</th><th>סטטוס</th><th>פעולה</th></tr></thead>
            <tbody>
                ${MOCK.tasks.map(t => `
                    <tr>
                        <td><strong>${t.title}</strong></td>
                        <td>${statusPill(t.priority)}</td>
                        <td>${t.assignee}</td>
                        <td>${t.due}</td>
                        <td style="font-size:11px; color:var(--text-soft)">${t.related}</td>
                        <td class="num">${t.amount ? fmt(t.amount) : '-'}</td>
                        <td>${statusPill(t.status)}</td>
                        <td><div class="action-icons">
                            <button class="icon-action">✓</button>
                            <button class="icon-action">✎</button>
                        </div></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
`;

// ============ 15. ALERTS ============
TABS.alerts = () => `
    <div class="grid grid-cols-4" style="margin-bottom: 18px;">
        <div class="kpi"><div class="kpi-label">קריטיות</div><div class="kpi-value" style="color:var(--error)">${MOCK.alerts.filter(a=>a.severity==='critical').length}</div></div>
        <div class="kpi"><div class="kpi-label">גבוהות</div><div class="kpi-value" style="color:var(--warning)">${MOCK.alerts.filter(a=>a.severity==='high').length}</div></div>
        <div class="kpi"><div class="kpi-label">בינוניות</div><div class="kpi-value" style="color:var(--info)">${MOCK.alerts.filter(a=>a.severity==='medium').length}</div></div>
        <div class="kpi"><div class="kpi-label">נמוכות</div><div class="kpi-value">${MOCK.alerts.filter(a=>a.severity==='low').length}</div></div>
    </div>

    ${MOCK.alerts.map(a => `
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
                <button class="btn xs primary">צור משימה</button>
                <button class="btn xs success">סמן כטופל</button>
                <button class="btn xs">פתח פרטים</button>
            </div>
        </div>
    `).join('')}
`;

// ============ 16. SETTINGS ============
TABS.settings = () => `
    <div class="disclaimer">הסוכן הפיננסי אינו מחליף רואה חשבון, יועץ מס או ייעוץ משפטי. הוא מציג תובנות עסקיות ופיננסיות לצורך קבלת החלטות ובדיקת נתונים.</div>

    <div class="grid grid-cols-2">
        <div class="card">
            <div class="card-title" style="margin-bottom: 14px;">הגדרות כלליות</div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">מטבע ברירת מחדל</div></div><strong>₪ שקל ישראלי</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">שיעור מע״מ</div></div><strong>18%</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">תחילת חודש פיסקלי</div></div><strong>1 בכל חודש</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">תקופת דיווח מע״מ</div></div><strong>דו-חודשי</strong></div>
        </div>

        <div class="card">
            <div class="card-title" style="margin-bottom: 14px;">יעדים</div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">יעד רווחיות חודשי</div></div><strong>35%</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">יעד הכנסות חודשי</div></div><strong>${fmt(200000)}</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">סף תזרים מינימלי</div></div><strong>${fmt(150000)}</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">תקרת CPL</div></div><strong>${fmt(100)}</strong></div>
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
                    <button class="btn xs">ערוך</button>
                </div>
            `).join('')}
        </div>

        <div class="card">
            <div class="card-title" style="margin-bottom: 14px;">סיכונים והתראות</div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">התראת חריגת הוצאה</div><div class="list-item-sub">מעל 25% מהממוצע</div></div><span class="pill success">פעיל</span></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">התראת איחור גבייה</div><div class="list-item-sub">מעל 7 ימים</div></div><span class="pill success">פעיל</span></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">התראת תזרים שלילי</div><div class="list-item-sub">בעוד 14 יום</div></div><span class="pill success">פעיל</span></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">התראת חיוב כפול</div></div><span class="pill success">פעיל</span></div>
        </div>
    </div>

    <!-- Success Metrics -->
    <div class="section-title" style="margin-top: 24px;">⚡ ערך שהסוכן הביא החודש</div>
    <div class="grid grid-cols-4">
        <div class="kpi"><div class="kpi-label">כסף אבוד שאותר</div><div class="kpi-value" style="color:var(--success)">${fmt(54121)}</div></div>
        <div class="kpi"><div class="kpi-label">גבייה בעקבות התראות</div><div class="kpi-value">${fmt(31200)}</div></div>
        <div class="kpi"><div class="kpi-label">הוצאות חריגות זוהו</div><div class="kpi-value">12</div></div>
        <div class="kpi"><div class="kpi-label">התאמות בנק אוטו׳</div><div class="kpi-value">${MOCK.bankTx.filter(t=>t.status.includes('אוטומטית')).length}/${MOCK.bankTx.length}</div></div>
        <div class="kpi"><div class="kpi-label">זמן שנחסך</div><div class="kpi-value">~14 שעות</div></div>
        <div class="kpi"><div class="kpi-label">דוחות הופקו</div><div class="kpi-value">${MOCK.reports.length}</div></div>
        <div class="kpi"><div class="kpi-label">משימות מתובנות</div><div class="kpi-value">${MOCK.tasks.length}</div></div>
        <div class="kpi"><div class="kpi-label">שיפור רווחיות</div><div class="kpi-value" style="color:var(--success)">+3.2%</div></div>
    </div>
`;
