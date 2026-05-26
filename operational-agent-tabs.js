/**
 * Operational Agent - Tab Renderers (all 19 tabs)
 */

function statusPill_op(s) {
    const map = {
        'חדש': 'info', 'פתוח': 'info', 'בטיפול': 'warning', 'ממתין ללקוח': 'warning',
        'ממתין לצוות': 'warning', 'ממתין לאישור': 'warning', 'באיחור': 'error',
        'הושלם': 'success', 'נדחה': 'neutral', 'בוטל': 'neutral',
        'קריטית': 'error', 'דחופה': 'error', 'גבוהה': 'warning', 'בינונית': 'info', 'נמוכה': 'neutral',
        'פעיל': 'success', 'מתוכנן': 'info', 'בוצעה': 'success', 'לא התקיימה': 'error',
        'בוצעה (חסר סיכום)': 'warning',
        'תקוע': 'error', 'מרוצה': 'success', 'דורש טיפול': 'warning', 'בסיכון': 'error',
        'באונבורדינג': 'info', 'לא מרוצה': 'error', 'הוקפא': 'neutral',
        'סיים תהליך': 'success', 'נטש': 'error',
        'נמוך': 'success', 'בינוני': 'warning', 'גבוה': 'error', 'קריטי': 'error',
        'כבוי': 'neutral',
        'מעודכן': 'success', 'מתוכנן (אינטגרציה)': 'info', 'מוכן לחיבור': 'warning',
        'מחובר בעתיד': 'success', 'לא מחובר': 'neutral',
    };
    return `<span class="pill ${map[s] || 'neutral'}">${s}</span>`;
}

function healthBadge(status) {
    const map = { 'מרוצה': 'health-happy', 'פעיל': 'health-healthy', 'דורש טיפול': 'health-attention', 'בסיכון': 'health-risk', 'לא מרוצה': 'health-risk' };
    return `<span class="health-badge ${map[status] || 'health-healthy'}">${status}</span>`;
}

// ============ 1. DASHBOARD ============
TABS_OP.dashboard = () => {
    const k = STATE_OP.kpis;
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">סיכום AI - מצב התפעול היום</div>
            <div class="ai-insight">יש <strong>${k.tasksToday.value}</strong> משימות פתוחות להיום, מתוכן <strong>${k.overdue.value} באיחור</strong>. <strong>${k.clientsNoUpdate.value} לקוחות</strong> לא קיבלו מענה מעל 24 שעות.</div>
            <div class="ai-insight">היום כדאי להתמקד ב-3 פעולות: סגירת משימות גבייה, עדכון לקוחות שלא קיבלו מענה, וסיכום פגישות שלא תועדו.</div>
            <div class="ai-insight"><strong>${k.activeOnboarding.value}</strong> תהליכי אונבורדינג פעילים. <strong>${k.stuckOnboarding.value} תקועים</strong> - דורשים פעולה.</div>
            <div style="margin-top:10px; display:flex; gap:8px;">
                <button class="btn xs primary" onclick="switchTab('chat')">💬 דבר עם הסוכן</button>
                <button class="btn xs" onclick="switchTab('risks')">⚠️ סיכונים</button>
                <button class="btn xs" onclick="switchTab('tasks')">✅ משימות</button>
            </div>
        </div>

        <div class="grid grid-cols-5" style="margin-bottom:14px;">
            <div class="kpi" style="cursor:pointer" onclick="switchTab('tasks')"><div class="kpi-label">משימות להיום</div><div class="kpi-value">${k.tasksToday.value}</div>${trend(k.tasksToday.trend)}</div>
            <div class="kpi"><div class="kpi-label">משימות באיחור</div><div class="kpi-value" style="color:var(--error)">${k.overdue.value}</div>${trend(k.overdue.trend)}</div>
            <div class="kpi" style="cursor:pointer" onclick="switchTab('clients')"><div class="kpi-label">לקוחות פעילים</div><div class="kpi-value">${k.activeClients.value}</div>${trend(k.activeClients.trend)}</div>
            <div class="kpi" style="cursor:pointer" onclick="switchTab('risks')"><div class="kpi-label">לקוחות בסיכון</div><div class="kpi-value" style="color:var(--error)">${k.riskClients.value}</div>${trend(k.riskClients.trend)}</div>
            <div class="kpi" style="cursor:pointer" onclick="switchTab('calendar')"><div class="kpi-label">פגישות היום</div><div class="kpi-value">${k.meetingsToday.value}</div>${trend(k.meetingsToday.trend)}</div>
        </div>

        <div class="grid grid-cols-5" style="margin-bottom:14px;">
            <div class="kpi"><div class="kpi-label">פולואפים פתוחים</div><div class="kpi-value">${k.openFollowups.value}</div>${trend(k.openFollowups.trend)}</div>
            <div class="kpi" style="cursor:pointer" onclick="switchTab('documents')"><div class="kpi-label">מסמכים חסרים</div><div class="kpi-value" style="color:var(--warning)">${k.missingDocs.value}</div>${trend(k.missingDocs.trend)}</div>
            <div class="kpi"><div class="kpi-label">תהליכים תקועים</div><div class="kpi-value" style="color:var(--error)">${k.stuckProcesses.value}</div>${trend(k.stuckProcesses.trend)}</div>
            <div class="kpi"><div class="kpi-label">זמן תגובה ממוצע</div><div class="kpi-value">${k.avgResponseHours.value}h</div>${trend(k.avgResponseHours.trend)}</div>
            <div class="kpi"><div class="kpi-label">% ביצוע משימות</div><div class="kpi-value" style="color:var(--success)">${k.taskCompletionPct.value}%</div>${trend(k.taskCompletionPct.trend)}</div>
        </div>

        <div class="grid grid-cols-5" style="margin-bottom:24px;">
            <div class="kpi"><div class="kpi-label">שביעות רצון</div><div class="kpi-value" style="color:var(--success)">${k.satisfaction.value}⭐</div>${trend(k.satisfaction.trend)}</div>
            <div class="kpi" style="cursor:pointer" onclick="switchTab('team')"><div class="kpi-label">עומס צוות</div><div class="kpi-value">${k.teamLoad.value}%</div>${trend(k.teamLoad.trend)}</div>
            <div class="kpi"><div class="kpi-label">נוצרו ע״י הסוכן</div><div class="kpi-value" style="color:var(--accent)">${k.agentCreatedTasks.value}</div>${trend(k.agentCreatedTasks.trend)}</div>
            <div class="kpi"><div class="kpi-label">הושלמו השבוע</div><div class="kpi-value">${k.tasksDoneWeek.value}</div>${trend(k.tasksDoneWeek.trend)}</div>
            <div class="kpi"><div class="kpi-label">פגישות ללא סיכום</div><div class="kpi-value" style="color:var(--warning)">${k.meetingsNoSummary.value}</div>${trend(k.meetingsNoSummary.trend)}</div>
        </div>

        <div class="grid grid-cols-2">
            <div>
                <div class="section-title" style="display:flex; justify-content:space-between; align-items:center;"><span>היום שלך - 3 הפעולות החשובות</span><button class="btn xs" onclick="switchTab('time')">פתח →</button></div>
                ${STATE_OP.tasks.filter(t => t.priority === 'קריטית' || t.priority === 'גבוהה').slice(0,4).map(t => `
                    <div class="action-card priority-${t.priority === 'קריטית' ? 'critical' : 'high'}">
                        <div class="action-card-h">
                            <div class="action-card-title">${t.title}</div>
                            ${statusPill_op(t.priority)}
                        </div>
                        <div class="action-card-meta"><span>👤 ${t.assignee}</span><span>📅 ${t.dueDate}</span>${t.client !== '-' ? `<span>🏷️ ${t.client}</span>` : ''}</div>
                        <div class="action-card-buttons">
                            <button class="btn xs primary" onclick="OA.completeTask('${t.id}')">✓ סמן כבוצע</button>
                            <button class="btn xs" onclick="OA.viewTask('${t.id}')">פרטים</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div>
                <div class="section-title" style="display:flex; justify-content:space-between; align-items:center;"><span>התראות חמות</span><button class="btn xs" onclick="switchTab('risks')">פתח →</button></div>
                ${STATE_OP.alerts.slice(0,4).map((a, i) => `
                    <div class="action-card priority-${a.severity}">
                        <div class="action-card-h"><div class="action-card-title">${a.title}</div>${statusPill_op(a.severity === 'critical' ? 'קריטית' : a.severity === 'high' ? 'גבוהה' : 'בינונית')}</div>
                        <div class="action-card-desc">${a.desc}</div>
                        <div class="action-card-meta"><span>🏷️ ${a.client}</span><span>📅 ${a.date}</span></div>
                        <div class="action-card-buttons">
                            <button class="btn xs primary" onclick="OA.alertToTask(${i})">צור משימה</button>
                            <button class="btn xs success" onclick="OA.resolveAlert(${i})">סמן כטופל</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

// ============ 2. TIME MANAGEMENT ============
TABS_OP.time = () => {
    const todayTasks = STATE_OP.tasks.filter(t => t.dueDate === STATE_OP.today && t.status !== 'הושלם');
    const urgent_important = todayTasks.filter(t => (t.priority === 'קריטית' || t.priority === 'דחופה') && t.importance === 'גבוהה');
    const important = todayTasks.filter(t => t.importance === 'גבוהה' && t.priority !== 'קריטית' && t.priority !== 'דחופה');
    const urgent = todayTasks.filter(t => (t.priority === 'קריטית' || t.priority === 'גבוהה') && t.importance !== 'גבוהה');
    const other = todayTasks.filter(t => !urgent_important.includes(t) && !important.includes(t) && !urgent.includes(t));
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">תובנת זמן AI</div>
            <div class="ai-insight">היום שלך עמוס ב-<strong>${STATE_OP.kpis.meetingsToday.value} פגישות</strong> ויש <strong>${todayTasks.length} משימות פתוחות</strong>. מומלץ לחסום שעה בין 15:00-16:00 לסגירת פולואפים.</div>
            <div class="ai-insight">יש לך <strong>${urgent_important.length} משימות דחופות+חשובות</strong>. תתחיל מהן.</div>
        </div>

        <div class="section-title">מטריצת אייזנהאואר - מה לעשות קודם</div>
        <div class="matrix-grid" style="margin-bottom: 20px;">
            <div class="matrix-quadrant matrix-q1">
                <h4>🔥 דחוף + חשוב (עשה עכשיו)</h4>
                ${urgent_important.length === 0 ? '<div style="font-size:12px; color:var(--muted)">אין משימות כרגע 🎉</div>' : urgent_important.map(t => `<div class="matrix-item">${t.title} <span style="float:left; font-size:10px; color:var(--muted)">${t.assignee}</span></div>`).join('')}
            </div>
            <div class="matrix-quadrant matrix-q2">
                <h4>📅 חשוב + לא דחוף (תזמן)</h4>
                ${important.length === 0 ? '<div style="font-size:12px; color:var(--muted)">-</div>' : important.map(t => `<div class="matrix-item">${t.title}</div>`).join('')}
            </div>
            <div class="matrix-quadrant matrix-q3">
                <h4>👥 דחוף + לא חשוב (האצל)</h4>
                ${urgent.length === 0 ? '<div style="font-size:12px; color:var(--muted)">-</div>' : urgent.map(t => `<div class="matrix-item">${t.title}</div>`).join('')}
            </div>
            <div class="matrix-quadrant matrix-q4">
                <h4>🗑️ לא דחוף + לא חשוב (דחה/בטל)</h4>
                ${other.length === 0 ? '<div style="font-size:12px; color:var(--muted)">-</div>' : other.map(t => `<div class="matrix-item">${t.title}</div>`).join('')}
            </div>
        </div>

        <div class="grid grid-cols-3">
            <div class="card">
                <div class="card-title" style="margin-bottom:10px;">📌 היום שלך</div>
                <div style="font-size:13px; color:var(--text-soft); line-height:1.7;">
                    • ${STATE_OP.kpis.meetingsToday.value} פגישות<br>
                    • ${todayTasks.length} משימות פתוחות<br>
                    • ${urgent_important.length} עדיפות עליונה<br>
                    • ${STATE_OP.kpis.openFollowups.value} פולואפים פתוחים
                </div>
            </div>
            <div class="card">
                <div class="card-title" style="margin-bottom:10px;">⏰ בלוקים מומלצים</div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">09:00-11:00 עבודה עמוקה</div><div class="list-item-sub">למשימות חשובות</div></div></div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">11:00-13:00 פגישות</div><div class="list-item-sub">בלוק פגישות מרוכז</div></div></div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">15:00-16:00 פולואפים</div><div class="list-item-sub">סגירת tickets</div></div></div>
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">16:00-17:00 צוות</div><div class="list-item-sub">סינכרון יומי</div></div></div>
            </div>
            <div class="card">
                <div class="card-title" style="margin-bottom:10px;">⚡ פעולות מהירות</div>
                <button class="btn primary" style="width:100%; margin-bottom:6px; justify-content:center;" onclick="OA.chatSuggestion('בנה לי סדר יום אופטימלי')">🤖 בנה לי סדר יום</button>
                <button class="btn" style="width:100%; margin-bottom:6px; justify-content:center;" onclick="OA.chatSuggestion('מה אפשר לדחות למחר?')">📋 מה אפשר לדחות?</button>
                <button class="btn" style="width:100%; margin-bottom:6px; justify-content:center;" onclick="OA.chatSuggestion('מי מהצוות עמוס מדי?')">⚖️ מי עמוס בצוות?</button>
                <button class="btn" style="width:100%; justify-content:center;" onclick="OA.addReminder()">🔔 צור בלוק זמן</button>
            </div>
        </div>
    `;
};

// ============ 3. TASKS (Kanban + Table) ============
TABS_OP.tasks = () => {
    const view = OA.getFilter('tasks', 'view', 'kanban');
    const fAssignee = OA.getFilter('tasks', 'assignee', '');
    const fPriority = OA.getFilter('tasks', 'priority', '');
    const filtered = STATE_OP.tasks.filter(t => {
        if (fAssignee && t.assignee !== fAssignee) return false;
        if (fPriority && t.priority !== fPriority) return false;
        return true;
    });

    const cols = ['חדש', 'בטיפול', 'ממתין ללקוח', 'באיחור', 'הושלם'];

    return `
        <div class="subtabs">
            <button class="subtab ${view==='kanban'?'active':''}" onclick="OA.setFilter('tasks','view','kanban')">Kanban</button>
            <button class="subtab ${view==='table'?'active':''}" onclick="OA.setFilter('tasks','view','table')">טבלה</button>
            <button class="subtab ${view==='mine'?'active':''}" onclick="OA.setFilter('tasks','view','mine')">המשימות שלי</button>
            <button class="subtab ${view==='agent'?'active':''}" onclick="OA.setFilter('tasks','view','agent')">נוצרו ע״י הסוכן</button>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; align-items:center;">
            <select class="filter-select" onchange="OA.setFilter('tasks','assignee',this.value)">
                <option value="">כל הצוות</option>
                ${STATE_OP.team.map(m => `<option ${m.name===fAssignee?'selected':''}>${m.name}</option>`).join('')}
            </select>
            <select class="filter-select" onchange="OA.setFilter('tasks','priority',this.value)">
                <option value="">כל הדחיפויות</option>
                ${['קריטית','גבוהה','בינונית','נמוכה'].map(p => `<option ${p===fPriority?'selected':''}>${p}</option>`).join('')}
            </select>
            ${fAssignee||fPriority ? `<button class="btn sm" onclick="OA.clearFilters('tasks')">✕ נקה</button>` : ''}
            <div style="flex:1"></div>
            <button class="btn sm" onclick="OA.exportToExcel('משימות')">📊 ייצא</button>
            <button class="btn sm primary" onclick="OA.addTask()">+ משימה חדשה</button>
        </div>

        ${view === 'kanban' ? `
            <div class="kanban">
                ${cols.map(col => {
                    const tasks = filtered.filter(t => t.status === col || (col === 'באיחור' && t.status === 'באיחור'));
                    return `
                    <div class="kanban-col">
                        <div class="kanban-col-h"><span>${col}</span><span class="kanban-col-count">${tasks.length}</span></div>
                        ${tasks.map(t => `
                            <div class="kanban-card" onclick="OA.viewTask('${t.id}')">
                                <div class="kanban-card-title">${t.title}</div>
                                <div class="kanban-card-meta">
                                    <span>${t.type}</span>
                                    ${t.client !== '-' ? `<span>· ${t.client}</span>` : ''}
                                </div>
                                <div class="kanban-card-bottom">
                                    ${statusPill_op(t.priority)}
                                    <span style="color:var(--muted)">👤 ${t.assignee}</span>
                                </div>
                            </div>
                        `).join('') || '<div style="color:var(--muted); font-size:11px; padding:6px;">אין משימות</div>'}
                    </div>`;
                }).join('')}
            </div>
        ` : `
            <div class="table-wrap">
                <table>
                    <thead><tr><th>משימה</th><th>סוג</th><th>לקוח</th><th>אחראי</th><th>דדליין</th><th>דחיפות</th><th>סטטוס</th><th>מקור</th><th>פעולות</th></tr></thead>
                    <tbody>
                        ${filtered.map(t => `
                            <tr>
                                <td><strong>${t.title}</strong></td>
                                <td>${t.type}</td>
                                <td>${t.client}</td>
                                <td>${t.assignee}</td>
                                <td>${t.dueDate}</td>
                                <td>${statusPill_op(t.priority)}</td>
                                <td>${statusPill_op(t.status)}</td>
                                <td style="font-size:10px; color:var(--muted)">${t.source}</td>
                                <td><div class="action-icons">
                                    ${t.status !== 'הושלם' ? `<button class="icon-action" title="סמן כבוצע" onclick="OA.completeTask('${t.id}')">✓</button>` : ''}
                                    <button class="icon-action" title="עריכה" onclick="OA.editTask('${t.id}')">✎</button>
                                    <button class="icon-action" title="העבר לאחראי אחר" onclick="OA.reassignTask('${t.id}')">↪</button>
                                    <button class="icon-action" title="פרטים" onclick="OA.viewTask('${t.id}')">👁</button>
                                </div></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `}
    `;
};

// ============ 4. CALENDAR ============
TABS_OP.calendar = () => {
    const today = STATE_OP.meetings.filter(m => m.date === STATE_OP.today);
    const upcoming = STATE_OP.meetings.filter(m => m.date > STATE_OP.today).slice(0, 6);
    const noSummary = STATE_OP.meetings.filter(m => m.status === 'בוצעה (חסר סיכום)' || (m.status === 'בוצעה' && !m.summary));
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">תובנת יומן</div>
            <div class="ai-insight">יש לך פגישה עם <strong>Cosma Cosmetics</strong> בעוד שעה. יש להם 2 משימות פתוחות. כדאי לסקור לפני.</div>
            <div class="ai-insight">⚠️ <strong>${noSummary.length} פגישות</strong> שהתקיימו ללא סיכום. סיכון לעיכוב בתפעול.</div>
        </div>

        <div class="grid grid-cols-4" style="margin-bottom:14px;">
            <div class="kpi"><div class="kpi-label">פגישות היום</div><div class="kpi-value">${today.length}</div></div>
            <div class="kpi"><div class="kpi-label">פגישות השבוע</div><div class="kpi-value">${STATE_OP.meetings.filter(m => m.date >= STATE_OP.today && m.date <= '2026-06-01').length}</div></div>
            <div class="kpi"><div class="kpi-label">ללא סיכום</div><div class="kpi-value" style="color:var(--warning)">${noSummary.length}</div></div>
            <div class="kpi"><div class="kpi-label">לא התקיימו</div><div class="kpi-value" style="color:var(--error)">${STATE_OP.meetings.filter(m => m.status === 'לא התקיימה').length}</div></div>
        </div>

        <div class="grid grid-cols-2">
            <div>
                <div class="section-title">היום (${STATE_OP.today})</div>
                ${today.length === 0 ? '<div class="placeholder-zone"><div class="ph-icon">📅</div><div class="ph-title">אין פגישות היום</div></div>' :
                today.map(m => `
                    <div class="action-card">
                        <div class="action-card-h">
                            <div>
                                <div class="action-card-title">${m.time} · ${m.title}</div>
                                <div style="font-size:11px; color:var(--muted); margin-top:2px;">${m.type} · ${m.duration} דק׳ · ${m.location}</div>
                            </div>
                            ${statusPill_op(m.status)}
                        </div>
                        <div class="action-card-meta">
                            ${m.client !== '-' ? `<span>🏷️ ${m.client}</span>` : ''}
                            <span>👤 ${m.owner}</span>
                            <span>🎯 ${m.goal}</span>
                        </div>
                        <div class="action-card-buttons">
                            <button class="btn xs primary" onclick="OA.createMeetingSummary('${m.id}')">📝 סיכום</button>
                            <button class="btn xs success" onclick="OA.markMeetingDone('${m.id}')">✓ בוצעה</button>
                            <button class="btn xs" onclick="OA.markMeetingMissed('${m.id}')">✗ לא התקיימה</button>
                            <button class="btn xs" onclick="OA.createTasksFromMeeting('${m.id}')">+ משימות</button>
                            <button class="btn xs" onclick="OA.viewMeeting('${m.id}')">👁 פרטים</button>
                        </div>
                    </div>
                `).join('')}

                <div class="section-title" style="margin-top:20px;">פגישות הקרובות</div>
                ${upcoming.map(m => `
                    <div class="list-item">
                        <div class="list-item-text">
                            <div class="list-item-title">${m.title}</div>
                            <div class="list-item-sub">${m.date} ${m.time} · ${m.client !== '-' ? m.client + ' · ' : ''}${m.owner}</div>
                        </div>
                        <button class="btn xs" onclick="OA.viewMeeting('${m.id}')">👁</button>
                    </div>
                `).join('')}
            </div>

            <div>
                <div class="section-title" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>פגישות שצריך לסכם</span>
                    <button class="btn sm primary" onclick="OA.addMeeting()">+ פגישה חדשה</button>
                </div>
                ${noSummary.length === 0 ? '<div class="placeholder-zone"><div class="ph-icon">✅</div><div class="ph-title">הכל מסוכם</div></div>' :
                noSummary.map(m => `
                    <div class="action-card priority-high">
                        <div class="action-card-h">
                            <div class="action-card-title">${m.title}</div>
                            <span style="font-size:11px; color:var(--muted)">${m.date}</span>
                        </div>
                        <div class="action-card-desc">פגישה הסתיימה ללא סיכום וללא משימות המשך</div>
                        <div class="action-card-buttons">
                            <button class="btn xs primary" onclick="OA.createMeetingSummary('${m.id}')">📝 צור סיכום</button>
                            <button class="btn xs" onclick="OA.createTasksFromMeeting('${m.id}')">+ משימות פולואפ</button>
                        </div>
                    </div>
                `).join('')}

                <div class="card" style="margin-top: 16px; background: var(--info-soft); border-color: var(--info);">
                    <div class="card-title" style="color:var(--info)">🔌 חיבור יומן בעתיד</div>
                    <p style="font-size:12px; color:var(--text-soft); margin-top:8px;">בעתיד תוכל לחבר את Google Calendar או Outlook לסנכרון אוטומטי. בשלב הזה הפגישות מנוהלות ידנית.</p>
                    <button class="btn sm" style="margin-top:10px;" onclick="switchTab('integrations')">פתח הגדרות אינטגרציה</button>
                </div>
            </div>
        </div>
    `;
};

// ============ 5. REMINDERS ============
TABS_OP.reminders = () => `
    <div class="grid grid-cols-3" style="margin-bottom:18px;">
        <div class="kpi"><div class="kpi-label">סך תזכורות</div><div class="kpi-value">${STATE_OP.reminders.length}</div></div>
        <div class="kpi"><div class="kpi-label">חוזרות</div><div class="kpi-value">${STATE_OP.reminders.filter(r => r.recurring).length}</div></div>
        <div class="kpi"><div class="kpi-label">היום</div><div class="kpi-value">${STATE_OP.reminders.filter(r => (r.when||'').startsWith(STATE_OP.today)).length}</div></div>
    </div>

    <div class="table-wrap">
        <div class="table-toolbar">
            <h3>תזכורות</h3>
            <button class="btn sm primary" onclick="OA.addReminder()">+ תזכורת חדשה</button>
        </div>
        <table>
            <thead><tr><th>תזכורת</th><th>למי</th><th>מתי</th><th>דחיפות</th><th>חוזרת?</th><th>פעולות</th></tr></thead>
            <tbody>
                ${STATE_OP.reminders.map((r, i) => `
                    <tr>
                        <td><strong>${r.text}</strong></td>
                        <td>${r.for}</td>
                        <td>${r.when}</td>
                        <td>${statusPill_op(r.priority)}</td>
                        <td>${r.recurring ? '🔁 כן' : '-'}</td>
                        <td><button class="icon-action" onclick="OA.deleteReminder(${i})" title="מחק">🗑</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
`;

// ============ 6. CLIENTS ============
TABS_OP.clients = () => {
    const fStatus = OA.getFilter('clients', 'status', '');
    const fRisk = OA.getFilter('clients', 'risk', '');
    const filtered = STATE_OP.clients.filter(c => {
        if (fStatus && c.status !== fStatus) return false;
        if (fRisk && c.churnRisk !== fRisk) return false;
        return true;
    });
    return `
        <div class="grid grid-cols-4" style="margin-bottom:18px;">
            <div class="kpi"><div class="kpi-label">סך לקוחות פעילים</div><div class="kpi-value">${STATE_OP.clients.length}</div></div>
            <div class="kpi"><div class="kpi-label">מרוצים</div><div class="kpi-value" style="color:var(--success)">${STATE_OP.clients.filter(c => c.status === 'מרוצה').length}</div></div>
            <div class="kpi"><div class="kpi-label">דורש טיפול</div><div class="kpi-value" style="color:var(--warning)">${STATE_OP.clients.filter(c => c.status === 'דורש טיפול').length}</div></div>
            <div class="kpi"><div class="kpi-label">בסיכון</div><div class="kpi-value" style="color:var(--error)">${STATE_OP.clients.filter(c => c.churnRisk === 'גבוה' || c.churnRisk === 'קריטי').length}</div></div>
        </div>

        <div class="table-wrap">
            <div class="table-toolbar">
                <h3>לקוחות פעילים ${filtered.length !== STATE_OP.clients.length ? `(${filtered.length}/${STATE_OP.clients.length})` : ''}</h3>
                <div class="filter-row">
                    <select class="filter-select" onchange="OA.setFilter('clients','status',this.value)"><option value="">כל הסטטוסים</option>${[...new Set(STATE_OP.clients.map(c => c.status))].map(s => `<option ${s===fStatus?'selected':''}>${s}</option>`).join('')}</select>
                    <select class="filter-select" onchange="OA.setFilter('clients','risk',this.value)"><option value="">כל הסיכונים</option>${['נמוך','בינוני','גבוה','קריטי'].map(r => `<option ${r===fRisk?'selected':''}>${r}</option>`).join('')}</select>
                    ${fStatus||fRisk?`<button class="btn sm" onclick="OA.clearFilters('clients')">✕</button>`:''}
                    <button class="btn sm" onclick="OA.exportToExcel('לקוחות')">📊 ייצא</button>
                    <button class="btn sm primary" onclick="OA.addClient()">+ לקוח חדש</button>
                </div>
            </div>
            <div style="overflow-x:auto">
            <table>
                <thead><tr><th>לקוח</th><th>שירות</th><th>שלב</th><th>CSM</th><th>מ״ל</th><th>סטטוס</th><th>⭐</th><th>משימות</th><th>פגישות</th><th>מסמכים</th><th>קשר אחרון</th><th>סיכון</th><th>פעולה</th><th>פעולות</th></tr></thead>
                <tbody>
                    ${filtered.map(c => `
                        <tr>
                            <td><strong>${c.name}</strong></td>
                            <td>${c.service}</td>
                            <td>${statusPill_op(c.stage)}</td>
                            <td>${c.csmOwner}</td>
                            <td>${c.accountManager}</td>
                            <td>${healthBadge(c.status)}</td>
                            <td>${c.satisfaction}</td>
                            <td class="num">${c.openTasks}</td>
                            <td class="num">${c.meetings}</td>
                            <td class="num ${c.missingDocs > 0 ? 'neg' : ''}">${c.missingDocs}</td>
                            <td>${c.lastContact}</td>
                            <td>${statusPill_op(c.churnRisk)}</td>
                            <td style="font-size:11px; color:var(--text-soft)">${c.action}</td>
                            <td><div class="action-icons">
                                <button class="icon-action" title="פרטים" onclick="OA.viewClient('${c.name}')">👁</button>
                                <button class="icon-action" title="צור משימת CSM" onclick="OA.createClientCSMTask('${c.name}')">+</button>
                            </div></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
        </div>
    `;
};

// ============ 7. ONBOARDING ============
TABS_OP.onboarding = () => `
    <div class="grid grid-cols-4" style="margin-bottom:18px;">
        <div class="kpi"><div class="kpi-label">תהליכים פעילים</div><div class="kpi-value">${STATE_OP.onboarding.length}</div></div>
        <div class="kpi"><div class="kpi-label">תקועים</div><div class="kpi-value" style="color:var(--error)">${STATE_OP.onboarding.filter(o => o.status === 'תקוע').length}</div></div>
        <div class="kpi"><div class="kpi-label">ממוצע ימי השלמה</div><div class="kpi-value">14</div></div>
        <div class="kpi"><div class="kpi-label">הושלמו השבוע</div><div class="kpi-value" style="color:var(--success)">3</div></div>
    </div>

    <div class="ai-banner">
        <div class="ai-banner-h">תובנות אונבורדינג</div>
        <div class="ai-insight">2 תהליכים תקועים בגלל חוסר במסמכים. מומלץ לשלוח תזכורת מסודרת ללקוחות.</div>
        <div class="ai-insight">לקוח חדש B נתקע ב-11 ימים בשלב 1 - דרושה פנייה אישית.</div>
    </div>

    <div class="grid grid-cols-2">
        ${STATE_OP.onboarding.map(o => `
            <div class="card">
                <div class="card-h">
                    <div>
                        <div class="card-title">${o.client}</div>
                        <div class="card-subtitle">${o.stage}</div>
                    </div>
                    ${statusPill_op(o.status)}
                </div>
                <div style="margin: 10px 0;">
                    <div class="progress-bar"><div class="progress-fill ${o.status === 'תקוע' ? 'error' : ''}" style="width: ${o.progress}%"></div></div>
                    <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--muted); margin-top:4px;">
                        <span>${o.progress}%</span>
                        <span>דדליין: ${o.deadline}</span>
                    </div>
                </div>
                ${(o.blockers || []).length > 0 ? `<div style="background:var(--error-soft); padding:8px 10px; border-radius:6px; font-size:11px; color:var(--error); margin-bottom:8px;">🚫 ${o.blockers.join(', ')}</div>` : ''}
                <div style="font-size:12px; color:var(--text-soft); margin-bottom:10px;">👤 ${o.owner} · התחלה: ${o.start}</div>
                <div style="display:flex; gap:6px;">
                    <button class="btn xs primary" onclick="OA.viewOnboarding('${o.client}')">פרטים</button>
                    <button class="btn xs success" onclick="OA.progressOnboarding('${o.client}')">+ קדם שלב</button>
                </div>
            </div>
        `).join('')}
    </div>
`;

// ============ 8. SERVICE ============
TABS_OP.service = () => {
    const open = STATE_OP.serviceTickets.filter(t => t.status !== 'הושלם');
    return `
        <div class="grid grid-cols-4" style="margin-bottom:18px;">
            <div class="kpi"><div class="kpi-label">פניות פתוחות</div><div class="kpi-value">${open.length}</div></div>
            <div class="kpi"><div class="kpi-label">דחופות</div><div class="kpi-value" style="color:var(--error)">${open.filter(t => t.priority === 'דחופה').length}</div></div>
            <div class="kpi"><div class="kpi-label">לא נענו</div><div class="kpi-value" style="color:var(--warning)">${open.filter(t => !t.firstResponse).length}</div></div>
            <div class="kpi"><div class="kpi-label">זמן תגובה ממ׳</div><div class="kpi-value">3.2h</div></div>
        </div>

        <div class="ai-banner">
            <div class="ai-banner-h">תובנת שירות</div>
            <div class="ai-insight">3 לקוחות פנו השבוע על אותו נושא (בעיות טכניות). זה רומז שיש פער ב-onboarding או SOP.</div>
            <div class="ai-insight">פנייה מ-יעקובי דיגיטל ממתינה <strong>6 ימים</strong> ללא מענה. סיכון שימור.</div>
        </div>

        <div class="table-wrap">
            <div class="table-toolbar">
                <h3>פניות שירות</h3>
                <button class="btn sm primary" onclick="OA.addServiceTicket()">+ פנייה חדשה</button>
            </div>
            <div style="overflow-x:auto">
            <table>
                <thead><tr><th>ID</th><th>לקוח</th><th>סוג</th><th>ערוץ</th><th>תיאור</th><th>דחיפות</th><th>סטטוס</th><th>אחראי</th><th>נפתח</th><th>פעולות</th></tr></thead>
                <tbody>
                    ${STATE_OP.serviceTickets.map(t => `
                        <tr>
                            <td>${t.id}</td>
                            <td><strong>${t.client}</strong></td>
                            <td>${t.type}</td>
                            <td>${t.channel}</td>
                            <td style="max-width:300px; font-size:12px;">${t.desc}</td>
                            <td>${statusPill_op(t.priority)}</td>
                            <td>${statusPill_op(t.status)}</td>
                            <td>${t.owner}</td>
                            <td style="font-size:11px;">${t.opened}</td>
                            <td><div class="action-icons">
                                <button class="icon-action" title="הכן תשובה" onclick="OA.respondTicket('${t.id}')">💬</button>
                                <button class="icon-action" title="צור משימה" onclick="OA.ticketToTask('${t.id}')">+</button>
                                <button class="icon-action" title="סגור" onclick="OA.closeTicket('${t.id}')">✓</button>
                            </div></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
        </div>
    `;
};

// ============ 9. CSM ============
TABS_OP.csm = () => {
    const healthy = STATE_OP.clients.filter(c => c.satisfaction >= 4.5);
    const attention = STATE_OP.clients.filter(c => c.satisfaction >= 3.5 && c.satisfaction < 4.5);
    const risk = STATE_OP.clients.filter(c => c.satisfaction < 3.5);
    const upsellCandidates = STATE_OP.clients.filter(c => c.satisfaction >= 4.7 && c.stage === 'פעיל');
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">תובנות CSM</div>
            <div class="ai-insight"><strong>${healthy.length} לקוחות בריאים</strong>, <strong>${attention.length} דורשים תשומת לב</strong>, <strong>${risk.length} בסיכון</strong>.</div>
            <div class="ai-insight">יש <strong>${upsellCandidates.length} לקוחות מתאימים לאפסייל</strong> ו-<strong>${healthy.filter(c=>c.satisfaction>=4.8).length} מתאימים לבקשת עדות</strong>.</div>
        </div>

        <div class="grid grid-cols-4" style="margin-bottom:18px;">
            <div class="kpi"><div class="kpi-label">בריאים</div><div class="kpi-value" style="color:var(--success)">${healthy.length}</div></div>
            <div class="kpi"><div class="kpi-label">דורש תשומת לב</div><div class="kpi-value" style="color:var(--warning)">${attention.length}</div></div>
            <div class="kpi"><div class="kpi-label">בסיכון</div><div class="kpi-value" style="color:var(--error)">${risk.length}</div></div>
            <div class="kpi"><div class="kpi-label">לאפסייל</div><div class="kpi-value" style="color:var(--accent)">${upsellCandidates.length}</div></div>
        </div>

        <div class="section-title">לקוחות לפי בריאות</div>
        <div class="grid grid-cols-2">
            ${STATE_OP.clients.map(c => `
                <div class="card">
                    <div class="card-h">
                        <div>
                            <div class="card-title">${c.name}</div>
                            <div class="card-subtitle">${c.service} · ${c.csmOwner}</div>
                        </div>
                        ${healthBadge(c.status)}
                    </div>
                    <div style="display:flex; gap:14px; margin: 10px 0; font-size:12px;">
                        <div><strong style="color:var(--accent)">⭐ ${c.satisfaction}</strong></div>
                        <div>${c.openTasks} משימות</div>
                        <div>${c.meetings} פגישות</div>
                    </div>
                    <div style="font-size:11px; color:var(--muted); margin-bottom:8px;">קשר אחרון: ${c.lastContact} · סיכון: ${c.churnRisk}</div>
                    <div style="display:flex; gap:6px;">
                        <button class="btn xs primary" onclick="OA.createClientCSMTask('${c.name}')">+ משימת CSM</button>
                        <button class="btn xs" onclick="OA.viewClient('${c.name}')">פרטים</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

// ============ 10. RISKS ============
TABS_OP.risks = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">סיכום סיכונים</div>
        <div class="ai-insight">סך הכל <strong>${STATE_OP.risks.length} לקוחות בסיכון</strong>, מתוכם <strong>${STATE_OP.risks.filter(r => r.level === 'קריטי').length} בסיכון קריטי</strong> - דורש פעולה היום.</div>
    </div>

    <div class="grid grid-cols-4" style="margin-bottom:18px;">
        <div class="kpi"><div class="kpi-label">קריטי</div><div class="kpi-value" style="color:var(--error)">${STATE_OP.risks.filter(r=>r.level==='קריטי').length}</div></div>
        <div class="kpi"><div class="kpi-label">גבוה</div><div class="kpi-value" style="color:var(--warning)">${STATE_OP.risks.filter(r=>r.level==='גבוה').length}</div></div>
        <div class="kpi"><div class="kpi-label">בינוני</div><div class="kpi-value" style="color:var(--info)">${STATE_OP.risks.filter(r=>r.level==='בינוני').length}</div></div>
        <div class="kpi"><div class="kpi-label">לקוחות פעילים</div><div class="kpi-value">${STATE_OP.clients.length}</div></div>
    </div>

    ${STATE_OP.risks.length === 0 ? `<div class="placeholder-zone"><div class="ph-icon">🎉</div><div class="ph-title">אין לקוחות בסיכון</div></div>` :
    STATE_OP.risks.map((r, i) => `
        <div class="action-card priority-${r.level === 'קריטי' ? 'critical' : r.level === 'גבוה' ? 'high' : ''}">
            <div class="action-card-h">
                <div>
                    <div class="action-card-title">${r.client}</div>
                    <div style="font-size:11px; color:var(--muted); margin-top:2px;">סיכון ${r.level}</div>
                </div>
                ${statusPill_op(r.level)}
            </div>
            <div class="action-card-desc">
                <strong>סיבות:</strong>
                <ul style="margin: 6px 14px 0;">${r.reasons.map(reason => `<li>${reason}</li>`).join('')}</ul>
            </div>
            <div class="action-card-meta"><span>🎯 פעולה מומלצת: <strong style="color:var(--text)">${r.action}</strong></span></div>
            <div class="action-card-buttons">
                <button class="btn xs primary" onclick="OA.createRiskAction(${i})">צור משימת שימור</button>
                <button class="btn xs" onclick="OA.viewClient('${r.client}')">פתח לקוח</button>
                <button class="btn xs success" onclick="OA.resolveRisk(${i})">סמן כטופל</button>
            </div>
        </div>
    `).join('')}
`;

// ============ 11. TEAM ============
TABS_OP.team = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">תובנת צוות</div>
        <div class="ai-insight"><strong>אופק עמוס ב-17 משימות פתוחות, 6 באיחור</strong>. עמית פנוי יותר. מומלץ להעביר 2 משימות שירות.</div>
        <div class="ai-insight">דור (CSM) עם הביצועים הכי טובים: 0 איחורים, 88% השלמה, ⭐4.7. שקול להעביר אליו עוד לקוחות.</div>
    </div>

    <div class="grid grid-cols-5" style="margin-bottom:18px;">
        ${STATE_OP.team.map(m => `
            <div class="kpi" style="cursor:pointer">
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
                    <span style="font-size:14px;">👤</span>
                    <div>
                        <div style="font-weight:700; font-size:13px;">${m.name}</div>
                        <div style="font-size:10px; color:var(--muted)">${m.role}</div>
                    </div>
                </div>
                <div style="display:flex; gap:8px; font-size:11px;">
                    <div><strong>${m.tasks}</strong> משימות</div>
                    <div style="color:var(--error)">${m.overdue} ⏰</div>
                </div>
                <div style="margin-top:8px;">
                    <div class="progress-bar"><div class="progress-fill ${m.load > 90 ? 'error' : m.load > 75 ? 'warning' : 'success'}" style="width:${m.load}%"></div></div>
                    <div style="font-size:10px; color:var(--muted); margin-top:3px;">${m.load}% עומס</div>
                </div>
            </div>
        `).join('')}
    </div>

    <div class="table-wrap">
        <div class="table-toolbar"><h3>פרטי ביצועים</h3></div>
        <table>
            <thead><tr><th>שם</th><th>תפקיד</th><th>משימות</th><th>באיחור</th><th>עומס</th><th>לקוחות</th><th>תגובה ממוצעת</th><th>% השלמה</th><th>⭐</th></tr></thead>
            <tbody>
                ${STATE_OP.team.map(m => `
                    <tr>
                        <td><strong>${m.name}</strong></td>
                        <td>${m.role}</td>
                        <td class="num">${m.tasks}</td>
                        <td class="num ${m.overdue > 3 ? 'neg' : ''}">${m.overdue}</td>
                        <td>${m.load > 90 ? '<span class="pill error">'+m.load+'%</span>' : m.load > 75 ? '<span class="pill warning">'+m.load+'%</span>' : '<span class="pill success">'+m.load+'%</span>'}</td>
                        <td class="num">${m.clients}</td>
                        <td class="num">${m.responseHours}h</td>
                        <td class="num">${m.completionPct}%</td>
                        <td class="num">${m.satisfaction}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
`;

// ============ 12. PROCESSES ============
TABS_OP.processes = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">תהליכים חיים</div>
        <div class="ai-insight">תהליך <strong>אונבורדינג</strong> רץ 14 ימים בממוצע (יעד: 12). 2 תהליכים תקועים בשלב 2.</div>
        <div class="ai-insight">תהליך <strong>גבייה</strong> חורג ב-40% מהיעד (14 ימים במקום 10). מומלץ לאוטומציה נוספת.</div>
    </div>

    <div class="grid grid-cols-2">
        ${STATE_OP.processes.map(p => `
            <div class="card">
                <div class="card-h">
                    <div>
                        <div class="card-title">${p.name}</div>
                        <div class="card-subtitle">${p.dept} · ${p.biz}</div>
                    </div>
                    ${p.stuck > 0 ? '<span class="pill warning">'+p.stuck+' תקוע</span>' : '<span class="pill success">תקין</span>'}
                </div>
                <div class="grid grid-cols-2" style="gap: 8px; margin: 12px 0;">
                    <div><div style="font-size:10px; color:var(--muted)">שלבים</div><div style="font-weight:700">${p.stages}</div></div>
                    <div><div style="font-size:10px; color:var(--muted)">פעיל כרגע</div><div style="font-weight:700">${p.activeRuns}</div></div>
                    <div><div style="font-size:10px; color:var(--muted)">ימי ביצוע</div><div style="font-weight:700">${p.avgDays} (יעד: ${p.target})</div></div>
                    <div><div style="font-size:10px; color:var(--muted)">סטטוס</div><div style="font-weight:700">${p.avgDays <= p.target ? '✅' : '⚠️'} ${p.avgDays <= p.target ? 'בזמן' : '+'+(p.avgDays-p.target)+' ימים'}</div></div>
                </div>
                <div style="display:flex; gap:6px;">
                    <button class="btn xs primary" onclick="OA.toast('עריכת תהליך - בפיתוח', 'info')">ערוך</button>
                    <button class="btn xs" onclick="OA.toast('הצגת bottlenecks - בפיתוח', 'info')">צווארי בקבוק</button>
                    <button class="btn xs" onclick="OA.toast('שיפור תהליך - בפיתוח', 'info')">שפר</button>
                </div>
            </div>
        `).join('')}
    </div>

    <div style="text-align:center; margin-top: 20px;">
        <button class="btn primary" onclick="OA.toast('יצירת תהליך חדש - בפיתוח', 'info')">+ צור תהליך חדש</button>
    </div>
`;

// ============ 13. AUTOMATIONS ============
TABS_OP.automations = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">סטטוס אוטומציות</div>
        <div class="ai-insight"><strong>${STATE_OP.automations.filter(a => a.status === 'פעיל').length} אוטומציות פעילות</strong> רצות ברקע. 5 דורשות אישור אנושי לפני שליחה.</div>
    </div>

    <div class="grid grid-cols-4" style="margin-bottom:18px;">
        <div class="kpi"><div class="kpi-label">פעילות</div><div class="kpi-value" style="color:var(--success)">${STATE_OP.automations.filter(a=>a.status==='פעיל').length}</div></div>
        <div class="kpi"><div class="kpi-label">כבויות</div><div class="kpi-value">${STATE_OP.automations.filter(a=>a.status==='כבוי').length}</div></div>
        <div class="kpi"><div class="kpi-label">דורשות אישור</div><div class="kpi-value" style="color:var(--warning)">${STATE_OP.automations.filter(a=>a.requiresApproval).length}</div></div>
        <div class="kpi"><div class="kpi-label">משימות שנוצרו</div><div class="kpi-value">${STATE_OP.kpis.agentCreatedTasks.value}</div></div>
    </div>

    <div class="table-wrap">
        <div class="table-toolbar">
            <h3>אוטומציות תפעוליות</h3>
            <button class="btn sm primary" onclick="OA.addAutomation()">+ אוטומציה חדשה</button>
        </div>
        <table>
            <thead><tr><th>ID</th><th>שם</th><th>טריגר</th><th>פעולה</th><th>סטטוס</th><th>תדירות</th><th>אחראי</th><th>אישור?</th><th>פעולות</th></tr></thead>
            <tbody>
                ${STATE_OP.automations.map(a => `
                    <tr>
                        <td style="font-size:11px;">${a.id}</td>
                        <td><strong>${a.name}</strong></td>
                        <td style="font-size:11px;">${a.trigger}</td>
                        <td style="font-size:11px;">${a.action}</td>
                        <td>${statusPill_op(a.status)}</td>
                        <td>${a.frequency}</td>
                        <td>${a.owner}</td>
                        <td>${a.requiresApproval ? '⚠️ כן' : '-'}</td>
                        <td><button class="btn xs ${a.status==='פעיל'?'danger':'success'}" onclick="OA.toggleAutomation('${a.id}')">${a.status==='פעיל'?'כבה':'הפעל'}</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
`;

// ============ 14. DOCUMENTS ============
TABS_OP.documents = () => {
    const required = STATE_OP.documents.filter(d => d.required && !d.uploaded);
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">מסמכים חסרים</div>
            <div class="ai-insight"><strong>${required.length} מסמכים נדרשים</strong> חסרים. בלעדיהם תהליכי אונבורדינג תקועים.</div>
            <div class="ai-insight">לקוח חדש C מחכה <strong>8 ימים</strong> עם 3 מסמכים פתוחים.</div>
        </div>

        <div class="table-wrap">
            <div class="table-toolbar">
                <h3>מסמכים נדרשים מלקוחות</h3>
                <button class="btn sm" onclick="OA.exportToExcel('מסמכים')">📊 ייצא</button>
            </div>
            <table>
                <thead><tr><th>לקוח</th><th>מסמך</th><th>חובה?</th><th>סטטוס</th><th>ימי המתנה</th><th>פעולות</th></tr></thead>
                <tbody>
                    ${STATE_OP.documents.map((d, i) => `
                        <tr>
                            <td><strong>${d.client}</strong></td>
                            <td>${d.name}</td>
                            <td>${d.required ? '🔴 חובה' : 'אופציונלי'}</td>
                            <td>${d.uploaded ? '<span class="pill success">התקבל</span>' : '<span class="pill warning">חסר</span>'}</td>
                            <td class="num ${d.daysWaiting > 7 ? 'neg' : ''}">${d.daysWaiting}</td>
                            <td><div class="action-icons">
                                ${!d.uploaded ? `<button class="icon-action" title="סמן כהתקבל" onclick="OA.markDocReceived(${i})">✓</button>` : ''}
                                ${!d.uploaded ? `<button class="icon-action" title="צור תזכורת" onclick="OA.remindDoc(${i})">🔔</button>` : ''}
                            </div></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
};

// ============ 15. CHAT ============
TABS_OP.chat = () => `
    <div class="chat-shell">
        <div class="chat-box">
            <div class="chat-head">
                <strong>🤖 צ׳אט תפעולי - COO דיגיטלי</strong>
                <div style="display:flex; gap:6px;">
                    <button class="btn xs" onclick="OA.chatHistory = []; OA._renderChat(); OA.toast('שיחה נוקתה','info')">🗑️ נקה</button>
                    <button class="btn xs success" onclick="OA.proactiveOpen()">✨ תובנות יומיות</button>
                </div>
            </div>
            <div class="chat-msgs" id="chatMsgs">
                ${OA.chatHistory.length === 0 ? `<div style="text-align:center; padding:30px; color:var(--muted); font-size:13px;">דבר עם הסוכן התפעולי בשפה חופשית.<br><br>הוא מכיר את כל מצב התפעול שלך - משימות, פגישות, לקוחות, צוות, סיכונים.<br><br>לחץ <strong>✨ תובנות יומיות</strong> כדי להתחיל את היום.</div>` : ''}
            </div>
            <div class="chat-input-row">
                <input id="chatInput" type="text" placeholder="שאל את הסוכן..." onkeydown="if(event.key==='Enter'){OA.sendChatMessage(this.value); this.value='';}">
                <button class="btn primary" onclick="const i=document.getElementById('chatInput'); OA.sendChatMessage(i.value); i.value='';">שלח</button>
            </div>
        </div>
        <div>
            <div class="card-title" style="margin-bottom:10px;">שאלות מוצעות</div>
            <div style="display:flex; flex-direction:column; gap:6px;">
                ${[
                    'מה הכי דחוף היום?',
                    'מי לא קיבל מענה?',
                    'איזה לקוחות בסיכון?',
                    'איזה משימות באיחור?',
                    'מי עמוס בצוות?',
                    'איזה פגישות יש לי היום?',
                    'איזה לקוח לא התקדם?',
                    'מה צריך לסגור השבוע?',
                    'איזה תהליך תקוע?',
                    'איזה מסמכים חסרים?',
                    'מי צריך לקבל תזכורת?',
                    'איפה יש צוואר בקבוק?',
                    'מה הסוכן ממליץ לי לעשות עכשיו?',
                    'בנה לי סדר יום אופטימלי',
                ].map(q => `<button class="btn" style="text-align:right; justify-content:flex-start; font-weight:400; font-size:12.5px;" onclick="OA.chatSuggestion('${q.replace(/'/g,'')}')">💭 ${q}</button>`).join('')}
            </div>
        </div>
    </div>
`;
TABS_OP.chat_after = () => {
    if (OA.chatHistory.length > 0) OA._renderChat();
    setTimeout(() => { const i = document.getElementById('chatInput'); if (i) i.focus(); }, 50);
};

// ============ 16. REPORTS ============
TABS_OP.reports = () => `
    <div class="grid grid-cols-3">
        ${STATE_OP.reports.map(r => `
            <div class="card">
                <div class="card-h">
                    <div>
                        <div class="card-title">${r.name}</div>
                        <div class="card-subtitle">${r.desc}</div>
                    </div>
                    ${statusPill_op(r.status)}
                </div>
                <div style="font-size:11px; color:var(--muted); margin: 10px 0;">עודכן: ${r.lastGen}</div>
                <div style="display:flex; gap:6px;">
                    <button class="btn xs primary" onclick="OA.viewReport('${r.name}')">צפייה</button>
                    <button class="btn xs" onclick="OA.toast('ייצוא PDF - בפיתוח','info')">📄 PDF</button>
                    <button class="btn xs" onclick="OA.exportToExcel('משימות')">📊 Excel</button>
                </div>
            </div>
        `).join('')}
    </div>
`;

// ============ 17. INTEGRATIONS ============
TABS_OP.integrations = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">אינטגרציות עתידיות</div>
        <div class="ai-insight">בשלב זה כל האינטגרציות הן <strong>תצוגה ויזואלית בלבד</strong>. בעתיד נוסיף אותן בהדרגה - כל אחת לפי הסדר הנכון.</div>
    </div>

    <div class="grid grid-cols-3">
        ${STATE_OP.integrations.map(i => `
            <div class="int-card">
                <div class="int-card-h">
                    <div class="int-card-icon">${i.icon}</div>
                    <div>
                        <div class="int-card-name">${i.name}</div>
                        <div style="font-size:10px; color:var(--muted)">${i.cat}</div>
                    </div>
                </div>
                <div class="int-card-desc">${i.purpose}</div>
                <div class="int-card-stat"><span>סטטוס</span>${statusPill_op(i.status)}</div>
                <div class="int-card-stat"><span>נתונים שיסונכרנו</span><span style="color:var(--text-soft); font-size:10px;">${i.dataTypes}</span></div>
                <div class="int-card-stat"><span>הרשאות</span><span style="color:var(--text-soft); font-size:10px;">${i.permissions}</span></div>
                ${i.risk !== '-' ? `<div style="font-size:11px; color:var(--warning); margin-top:8px;">⚠️ ${i.risk}</div>` : ''}
                <button class="btn sm" style="width:100%; margin-top:10px; justify-content:center;" onclick="OA.toast('חיבור ${i.name} - יתווסף בשלב הבא','info', 4000)">הגדר חיבור בעתיד</button>
            </div>
        `).join('')}
    </div>
`;

// ============ 18. CLIENT PORTAL ============
TABS_OP.portal = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">פורטל לקוח (בקרוב)</div>
        <div class="ai-insight">תצוגה מקדימה - מה הלקוח שלך יראה כשנפעיל פורטל לקוח. עוזר לבנות חוויית לקוח שקופה ומקצועית.</div>
    </div>

    <div class="grid grid-cols-2" style="margin-bottom: 24px;">
        <div class="card">
            <div class="card-title">תצוגת לקוח לדוגמה - אלון משכן</div>
            <p style="font-size:12px; color:var(--text-soft); margin: 8px 0;">כשפורטל הלקוח יופעל, אלון יוכל לראות:</p>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">📊 סטטוס פרויקט</div><div class="list-item-sub">"בשלב 3 מתוך 5 - תכנון אסטרטגי"</div></div></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">📅 פגישות צפויות</div><div class="list-item-sub">"שיחת CSM ב-28.5"</div></div></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">📄 מסמכים נדרשים</div><div class="list-item-sub">"הכל הועלה ✓"</div></div></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">💵 חשבוניות ותשלומים</div><div class="list-item-sub">"כל החשבוניות שולמו"</div></div></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">📈 התקדמות</div><div class="list-item-sub">"4 אבני דרך הושלמו, 1 בעבודה"</div></div></div>
        </div>

        <div class="card">
            <div class="card-title">מה הלקוח לא יראה</div>
            <p style="font-size:12px; color:var(--text-soft); margin: 8px 0;">פרטיות אבטחה - הלקוח לא יראה:</p>
            <div style="font-size:12px; color:var(--text-soft); line-height:2;">
                ❌ משימות פנימיות של הצוות<br>
                ❌ הערות פנימיות עליו<br>
                ❌ מידע על לקוחות אחרים<br>
                ❌ נתוני רווחיות שלו<br>
                ❌ עומסי הצוות<br>
                ❌ דיונים פנימיים
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-title" style="margin-bottom: 14px;">הרשאות לקוח (בעתיד)</div>
        <div class="list-item"><div class="list-item-text"><div class="list-item-title">👁 צפייה בלבד</div><div class="list-item-sub">לרוב הלקוחות</div></div><span class="pill info">ברירת מחדל</span></div>
        <div class="list-item"><div class="list-item-text"><div class="list-item-title">📤 העלאת מסמכים</div><div class="list-item-sub">הלקוח יכול להעלות הסכמים וקבצים</div></div><span class="pill success">מומלץ</span></div>
        <div class="list-item"><div class="list-item-text"><div class="list-item-title">💬 צ׳אט עם הצוות</div><div class="list-item-sub">תמיכה ושאלות</div></div><span class="pill warning">דורש החלטה</span></div>
        <div class="list-item"><div class="list-item-text"><div class="list-item-title">✅ אישור משימות</div><div class="list-item-sub">סימון אבני דרך כמושלמות מצדו</div></div><span class="pill neutral">אופציונלי</span></div>
        <button class="btn primary" style="margin-top: 14px;" onclick="OA.toast('הפעלת פורטל לקוח - יתווסף בשלב Multi-tenant', 'info', 4000)">הפעל פורטל לקוח בעתיד</button>
    </div>
`;

// ============ 19. BIZ TYPE ============
TABS_OP.biztype = () => {
    const activeId = STATE_OP._activeBizType || 'service';
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">התאמה לסוג עסק</div>
            <div class="ai-insight">המודולים והאוטומציות יסתדרו אוטומטית לפי סוג העסק שתבחר. כל סוג עסק מקבל KPIs ותהליכים שונים.</div>
        </div>

        <div class="grid grid-cols-3">
            ${STATE_OP.businessTypes.map(bt => `
                <div class="card ${bt.id === activeId ? '' : ''}" style="${bt.id === activeId ? 'border: 2px solid var(--accent);' : ''}">
                    <div class="card-h">
                        <div>
                            <div class="card-title" style="font-size: 16px;">${bt.icon} ${bt.name}</div>
                        </div>
                        ${bt.id === activeId ? '<span class="pill accent">פעיל</span>' : ''}
                    </div>
                    <p style="font-size: 11.5px; color: var(--text-soft); line-height: 1.6; margin: 10px 0; min-height: 60px;">${bt.focus}</p>
                    <div style="margin: 10px 0;">
                        <div style="font-size: 10px; color: var(--muted); font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">KPIs מומלצים</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${bt.kpis.map(k => `<span class="pill neutral" style="font-size: 10px;">${k}</span>`).join('')}
                        </div>
                    </div>
                    <div style="margin: 10px 0;">
                        <div style="font-size: 10px; color: var(--muted); font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">תהליכים</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${bt.processes.map(p => `<span class="pill info" style="font-size: 10px;">${p}</span>`).join('')}
                        </div>
                    </div>
                    <button class="btn ${bt.id === activeId ? 'success' : 'primary'} sm" style="width: 100%; margin-top: 10px; justify-content: center;" onclick="OA.selectBizType('${bt.id}')">${bt.id === activeId ? '✓ פעיל' : 'בחר תבנית'}</button>
                </div>
            `).join('')}
        </div>
    `;
};

// ============ 20. SETTINGS ============
TABS_OP.settings = () => `
    <div class="disclaimer">הסוכן התפעולי מציג המלצות ותובנות ניהוליות. פעולות מול לקוחות או שינויים קריטיים דורשים אישור אנושי.</div>

    <div class="grid grid-cols-2">
        <div class="card">
            <div class="card-title" style="margin-bottom:14px;">תצוגה והתנהגות</div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">שעת בוקר התראות</div></div><strong>08:00</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">תזכורות מהסוכן</div></div><span class="pill success">פעיל</span></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">סיכום יומי אוטומטי</div></div><span class="pill success">פעיל</span></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">סיכום שבועי בימי שישי</div></div><span class="pill success">פעיל</span></div>
        </div>

        <div class="card">
            <div class="card-title" style="margin-bottom:14px;">הרשאות (בקרוב)</div>
            ${['בעלים','מנהל תפעול','מנהל צוות','CSM','נציג שירות','נציג מכירות','מזכירה','עובד ביצוע','צופה בלבד','לקוח'].map(r => `
                <div class="list-item"><div class="list-item-text"><div class="list-item-title">${r}</div></div><button class="btn xs" onclick="OA.toast('עריכת הרשאות - יתווסף בשלב Multi-tenant','info')">ערוך</button></div>
            `).join('')}
        </div>

        <div class="card">
            <div class="card-title" style="margin-bottom:14px;">סף התראות</div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">משימה באיחור</div><div class="list-item-sub">התראה אחרי X ימים</div></div><strong>1 יום</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">לקוח ללא מענה</div><div class="list-item-sub">התראה אחרי X ימים</div></div><strong>3 ימים</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">פגישה ללא סיכום</div><div class="list-item-sub">התראה אחרי X דקות</div></div><strong>30 דקות</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">עומס צוות מקסימלי</div><div class="list-item-sub">התראה ב-X% עומס</div></div><strong>90%</strong></div>
        </div>

        <div class="card">
            <div class="card-title" style="margin-bottom:14px;">⚡ ערך שהסוכן הביא</div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">משימות שהסוכן יצר</div></div><strong style="color:var(--accent)">${STATE_OP.kpis.agentCreatedTasks.value}</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">משימות שהושלמו השבוע</div></div><strong>${STATE_OP.kpis.tasksDoneWeek.value}</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">לקוחות שזוהו בסיכון</div></div><strong>${STATE_OP.kpis.riskClients.value}</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">תהליכים שזוהו כתקועים</div></div><strong>${STATE_OP.kpis.stuckProcesses.value}</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">זמן שנחסך</div></div><strong style="color:var(--success)">~21 שעות</strong></div>
        </div>
    </div>

    <div style="text-align:center; margin-top: 24px;">
        <button class="btn danger" onclick="OA.resetDemo()">🔄 איפוס נתוני דמו</button>
    </div>
`;


