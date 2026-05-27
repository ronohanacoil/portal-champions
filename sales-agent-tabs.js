/**
 * Sales Agent - All 23 Tab Renderers
 */

function statusPill_sa(s) {
    const map = {
        'חדש':'info','לא ענה':'warning','ניסיון שני':'warning','ניסיון שלישי':'warning',
        'ענה':'info','נקבעה פגישה':'success','הגיע לפגישה':'success','לא הגיע':'error',
        'הצעה נשלחה':'accent','בפולואפ':'warning','בהתנגדות':'warning','התנגדות':'warning',
        'נעלם':'neutral','אבוד':'error','סגור':'success','החייאה':'info','חימום ארוך':'neutral',
        'לא מתאים':'neutral','מתאים':'success','חם':'hot','רותח':'fire','קר':'info','VIP':'accent','בינוני':'warning',
        'פעיל':'success','כבוי':'neutral','מפסיד':'error','גבולי':'warning','מצוין':'success','רווחי':'success',
        'קריטית':'error','גבוהה':'warning','בינונית':'info','נמוכה':'neutral','דחופה':'error',
        'פתוח':'info','לא נפתח':'warning','נשלח עכשיו':'info','ממתין לתשלום':'warning','פגישה נקבעה':'success',
        'ממתין לאישור':'warning','אושר לשליחה':'success','בוצע':'success','משימה':'info',
        'מעודכן':'success','מתוכנן':'info','מוכן לחיבור':'warning','מחובר בעתיד':'success','לא מחובר':'neutral',
    };
    return `<span class="pill ${map[s]||'neutral'}">${s}</span>`;
}

function heatBadge(h) {
    const m = { 'קר':'heat-cold', 'בינוני':'heat-warm', 'חם':'heat-hot', 'רותח':'heat-fire', 'VIP':'heat-vip', 'לא מתאים':'heat-bad' };
    const icon = { 'קר':'❄️', 'בינוני':'🌤️', 'חם':'🔥', 'רותח':'🌋', 'VIP':'💎', 'לא מתאים':'⊘' };
    return `<span class="heat-badge ${m[h]||'heat-cold'}">${icon[h]||''} ${h}</span>`;
}

// ============ 1. DASHBOARD ============
TABS_SA.dashboard = () => {
    const k = STATE_SA.kpis;
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">סיכום AI - מצב המכירות היום</div>
            <div class="ai-insight">נכנסו החודש <strong>${k.newLeadsMonth.value} לידים</strong> אבל <strong>${k.untreated.value} לא קיבלו מענה בזמן</strong>. יש כאן כסף שנופל בגלל זמן תגובה.</div>
            <div class="ai-insight">יש <strong>${k.fireLeads.value} לידים רותחים</strong> ועוד <strong>${k.hotLeads.value} חמים</strong> שדורשים פעולה. <strong>₪${k.openFollowupMoney.value.toLocaleString('he-IL')}</strong> תקועים בפולואפים.</div>
            <div class="ai-insight">מתוך ${k.meetingsHeld.value} פגישות שהתקיימו החודש, ${k.openProposals.value} הצעות פתוחות בערך <strong>${fmtCur(186000)}</strong>. 6 לא קיבלו פולואפ מעל 48 שעות.</div>
            <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn xs primary" onclick="switchTab('chat')">💬 דבר עם הסוכן</button>
                <button class="btn xs fire" onclick="switchTab('leads')">🌋 לידים רותחים</button>
                <button class="btn xs warning" onclick="switchTab('followups')">🔁 פולואפים</button>
                <button class="btn xs" onclick="switchTab('proposals')">📄 הצעות פתוחות</button>
            </div>
        </div>

        <div class="grid grid-cols-5" style="margin-bottom:14px;">
            <div class="kpi" onclick="switchTab('leads')" style="cursor:pointer"><div class="kpi-label">לידים חדשים היום</div><div class="kpi-value">${k.newLeadsToday.value}</div>${trend(k.newLeadsToday.trend)}</div>
            <div class="kpi"><div class="kpi-label">לידים החודש</div><div class="kpi-value">${k.newLeadsMonth.value}</div>${trend(k.newLeadsMonth.trend)}</div>
            <div class="kpi" onclick="switchTab('leads')" style="cursor:pointer"><div class="kpi-label">לא טופלו ⚠️</div><div class="kpi-value" style="color:var(--error)">${k.untreated.value}</div>${trend(k.untreated.trend)}</div>
            <div class="kpi"><div class="kpi-label">חמים 🔥</div><div class="kpi-value" style="color:var(--hot)">${k.hotLeads.value}</div>${trend(k.hotLeads.trend)}</div>
            <div class="kpi"><div class="kpi-label">רותחים 🌋</div><div class="kpi-value" style="color:var(--fire)">${k.fireLeads.value}</div>${trend(k.fireLeads.trend)}</div>
        </div>

        <div class="grid grid-cols-5" style="margin-bottom:14px;">
            <div class="kpi"><div class="kpi-label">פגישות שנקבעו</div><div class="kpi-value">${k.meetingsBooked.value}</div>${trend(k.meetingsBooked.trend)}</div>
            <div class="kpi"><div class="kpi-label">פגישות שהתקיימו</div><div class="kpi-value" style="color:var(--success)">${k.meetingsHeld.value}</div>${trend(k.meetingsHeld.trend)}</div>
            <div class="kpi"><div class="kpi-label">No-Shows</div><div class="kpi-value" style="color:var(--error)">${k.noShows.value}</div>${trend(k.noShows.trend)}</div>
            <div class="kpi" onclick="switchTab('proposals')" style="cursor:pointer"><div class="kpi-label">הצעות פתוחות</div><div class="kpi-value">${k.openProposals.value}</div>${trend(k.openProposals.trend)}</div>
            <div class="kpi"><div class="kpi-label">עסקאות פתוחות</div><div class="kpi-value">${k.openDeals.value}</div>${trend(k.openDeals.trend)}</div>
        </div>

        <div class="grid grid-cols-5" style="margin-bottom:14px;">
            <div class="kpi"><div class="kpi-label">נסגרו החודש</div><div class="kpi-value" style="color:var(--success)">${k.closedDeals.value}</div>${trend(k.closedDeals.trend)}</div>
            <div class="kpi"><div class="kpi-label">אבדו</div><div class="kpi-value" style="color:var(--error)">${k.lostDeals.value}</div>${trend(k.lostDeals.trend)}</div>
            <div class="kpi"><div class="kpi-label">מחזור החודש</div><div class="kpi-value" style="color:var(--success)">${fmtCur(k.monthRevenue.value)}</div>${trend(k.monthRevenue.trend)}</div>
            <div class="kpi"><div class="kpi-label">צפי חודש</div><div class="kpi-value" style="color:var(--accent)">${fmtCur(k.forecastRevenue.value)}</div><span class="kpi-trend flat">ריאלי</span></div>
            <div class="kpi"><div class="kpi-label">אחוז סגירה</div><div class="kpi-value">${fmtPct(k.closeRate.value)}</div>${trend(k.closeRate.trend)}</div>
        </div>

        <div class="grid grid-cols-5" style="margin-bottom:24px;">
            <div class="kpi"><div class="kpi-label">זמן תגובה ממ׳</div><div class="kpi-value">${k.avgResponseHours.value}h</div>${trend(k.avgResponseHours.trend)}</div>
            <div class="kpi"><div class="kpi-label">CPL</div><div class="kpi-value">${fmtCur(k.cpl.value)}</div>${trend(k.cpl.trend)}</div>
            <div class="kpi"><div class="kpi-label">שווי פייפליין</div><div class="kpi-value" style="color:var(--accent)">${fmtCur(k.pipelineValue.value)}</div>${trend(k.pipelineValue.trend)}</div>
            <div class="kpi"><div class="kpi-label">כסף בפולואפים</div><div class="kpi-value" style="color:var(--warning)">${fmtCur(k.openFollowupMoney.value)}</div>${trend(k.openFollowupMoney.trend)}</div>
            <div class="kpi" onclick="switchTab('revival')" style="cursor:pointer"><div class="kpi-label">החייאה</div><div class="kpi-value">${k.revivalCandidates.value}</div><span class="kpi-meta">לידים ישנים</span></div>
        </div>

        <div class="grid grid-cols-2">
            <div>
                <div class="section-title" style="display:flex; justify-content:space-between; align-items:center;"><span>🌋 לידים רותחים שצריכים פעולה עכשיו</span><button class="btn xs" onclick="switchTab('leads')">פתח כל →</button></div>
                ${STATE_SA.leads.filter(l => l.heat === 'רותח').slice(0,4).map(l => `
                    <div class="action-card heat-fire">
                        <div class="action-card-h">
                            <div>
                                <div class="action-card-title">${l.name}</div>
                                <div style="font-size:11px; color:var(--muted); margin-top:2px;">${l.business} · ${l.source}</div>
                            </div>
                            ${heatBadge(l.heat)}
                        </div>
                        <div class="action-card-desc">${l.nextAction} · ציון ${l.score}/100 · סיכוי ${l.closeProbability}%</div>
                        <div class="action-card-meta"><span>👤 ${l.rep}</span><span>📅 ${l.followupDate}</span></div>
                        <div class="action-card-buttons">
                            <button class="btn xs primary" onclick="SA.viewLead('${l.id}')">פתח</button>
                            <button class="btn xs" onclick="SA.callLead('${l.id}')">📞</button>
                            <button class="btn xs" onclick="SA.whatsappLead('${l.id}')">💬</button>
                            <button class="btn xs success" onclick="SA.bookMeetingLead('${l.id}')">✓ פגישה</button>
                        </div>
                    </div>
                `).join('') || '<div style="color:var(--muted); padding:14px;">אין לידים רותחים כרגע</div>'}
            </div>

            <div>
                <div class="section-title" style="display:flex; justify-content:space-between; align-items:center;"><span>📄 הצעות שדורשות פולואפ</span><button class="btn xs" onclick="switchTab('proposals')">פתח כל →</button></div>
                ${STATE_SA.proposals.filter(p => p.status !== 'נסגר').slice(0,4).map(p => `
                    <div class="action-card priority-${p.daysOpen > 4 ? 'critical' : p.daysOpen > 2 ? 'high' : ''}">
                        <div class="action-card-h">
                            <div>
                                <div class="action-card-title">${p.client}</div>
                                <div style="font-size:11px; color:var(--muted); margin-top:2px;">${p.status} · ${p.daysOpen} ימים פתוחה</div>
                            </div>
                            <strong style="color:var(--success); font-variant-numeric:tabular-nums;">${fmtCur(p.deal)}</strong>
                        </div>
                        <div class="action-card-desc">${p.nextAction}${p.objection !== '-' ? ' · התנגדות: ' + p.objection : ''}</div>
                        <div class="action-card-buttons">
                            <button class="btn xs primary" onclick="SA.viewProposal('${p.id}')">פרטים</button>
                            <button class="btn xs success" onclick="SA.closeProposal('${p.id}')">✓ נסגרה</button>
                            <button class="btn xs danger" onclick="SA.lostProposal('${p.id}')">✗ אבדה</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

// ============ 2. LEADS ============
TABS_SA.leads = () => {
    const fHeat = SA.getFilter('leads', 'heat', '');
    const fStatus = SA.getFilter('leads', 'status', '');
    const fSource = SA.getFilter('leads', 'source', '');
    const fRep = SA.getFilter('leads', 'rep', '');
    const fSearch = SA.getFilter('leads', 'search', '').toLowerCase();
    const filtered = STATE_SA.leads.filter(l => {
        if (fHeat && l.heat !== fHeat) return false;
        if (fStatus && l.status !== fStatus) return false;
        if (fSource && l.source !== fSource) return false;
        if (fRep && l.rep !== fRep) return false;
        if (fSearch && !(l.name.toLowerCase().includes(fSearch) || (l.business||'').toLowerCase().includes(fSearch) || (l.phone||'').includes(fSearch))) return false;
        return true;
    });
    return `
        <div class="grid grid-cols-5" style="margin-bottom:14px;">
            <div class="kpi"><div class="kpi-label">סך לידים</div><div class="kpi-value">${STATE_SA.leads.length}</div></div>
            <div class="kpi"><div class="kpi-label">חמים</div><div class="kpi-value" style="color:var(--hot)">${STATE_SA.leads.filter(l=>l.heat==='חם').length}</div></div>
            <div class="kpi"><div class="kpi-label">רותחים</div><div class="kpi-value" style="color:var(--fire)">${STATE_SA.leads.filter(l=>l.heat==='רותח').length}</div></div>
            <div class="kpi"><div class="kpi-label">לא ענו</div><div class="kpi-value" style="color:var(--warning)">${STATE_SA.leads.filter(l=>l.status==='לא ענה'||l.status==='נעלם').length}</div></div>
            <div class="kpi"><div class="kpi-label">סיכוי סגירה ממ׳</div><div class="kpi-value">${Math.round(STATE_SA.leads.reduce((s,l)=>s+l.closeProbability,0)/Math.max(STATE_SA.leads.length,1))}%</div></div>
        </div>

        <div class="table-wrap">
            <div class="table-toolbar">
                <h3>לידים ${filtered.length !== STATE_SA.leads.length ? `(${filtered.length}/${STATE_SA.leads.length})` : ''}</h3>
                <div class="filter-row">
                    <input class="filter-input" placeholder="🔍 חיפוש שם/עסק/טלפון" value="${fSearch}" oninput="SA.setFilter('leads','search',this.value)">
                    <select class="filter-select" onchange="SA.setFilter('leads','heat',this.value)"><option value="">כל החום</option>${['קר','בינוני','חם','רותח','VIP','לא מתאים'].map(h=>`<option ${h===fHeat?'selected':''}>${h}</option>`).join('')}</select>
                    <select class="filter-select" onchange="SA.setFilter('leads','status',this.value)"><option value="">כל הסטטוסים</option>${[...new Set(STATE_SA.leads.map(l=>l.status))].map(s=>`<option ${s===fStatus?'selected':''}>${s}</option>`).join('')}</select>
                    <select class="filter-select" onchange="SA.setFilter('leads','source',this.value)"><option value="">כל המקורות</option>${[...new Set(STATE_SA.leads.map(l=>l.source))].map(s=>`<option ${s===fSource?'selected':''}>${s}</option>`).join('')}</select>
                    <select class="filter-select" onchange="SA.setFilter('leads','rep',this.value)"><option value="">כל הנציגים</option>${STATE_SA.reps.map(r=>`<option ${r.name===fRep?'selected':''}>${r.name}</option>`).join('')}</select>
                    ${fHeat||fStatus||fSource||fRep||fSearch?`<button class="btn sm" onclick="SA.clearFilters('leads')">✕ נקה</button>`:''}
                    <button class="btn sm" onclick="SA.exportToExcel('לידים')">📊 ייצא</button>
                    <button class="btn sm primary" onclick="SA.addLead()">+ ליד חדש</button>
                </div>
            </div>
            <div style="overflow-x:auto">
            <table>
                <thead><tr><th>שם</th><th>עסק</th><th>מקור</th><th>סטטוס</th><th>חום</th><th>ציון</th><th>נציג</th><th>פעולה</th><th>סיכוי</th><th>פעולות</th></tr></thead>
                <tbody>
                    ${filtered.length === 0 ? `<tr><td colspan="10" style="text-align:center; padding:30px; color:var(--muted)">אין לידים תואמים</td></tr>` : filtered.map(l => `
                        <tr>
                            <td><strong>${l.name}</strong><br><span style="font-size:10px; color:var(--muted)">${l.phone}</span></td>
                            <td>${l.business}<br><span style="font-size:10px; color:var(--muted)">${l.industry}</span></td>
                            <td style="font-size:11px;">${l.source}</td>
                            <td>${statusPill_sa(l.status)}</td>
                            <td>${heatBadge(l.heat)}</td>
                            <td class="num"><strong>${l.score}</strong></td>
                            <td>${l.rep}</td>
                            <td style="font-size:11px; color:var(--text-soft)">${l.nextAction}</td>
                            <td class="num">${l.closeProbability}%</td>
                            <td><div class="action-icons">
                                <button class="icon-action" title="פתח" onclick="SA.viewLead('${l.id}')">👁</button>
                                <button class="icon-action" title="חיוג" onclick="SA.callLead('${l.id}')">📞</button>
                                <button class="icon-action" title="וואטסאפ" onclick="SA.whatsappLead('${l.id}')">💬</button>
                                <button class="icon-action" title="קבע פגישה" onclick="SA.bookMeetingLead('${l.id}')">📅</button>
                                <button class="icon-action" title="צור הצעה" onclick="SA.leadToProposal('${l.id}')">📄</button>
                                <button class="icon-action" title="סמן אבוד" onclick="SA.markLeadLost('${l.id}')">✗</button>
                            </div></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
        </div>
    `;
};

// ============ 3. SCORING ============
TABS_SA.scoring = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">תובנת ציון</div>
        <div class="ai-insight">המנוע מעדיף לידים עם <strong>ציון 80+</strong> - שם הסיכוי לסגירה הכי גבוה. יש לך כרגע <strong>${STATE_SA.leads.filter(l=>l.score>=80).length} לידים</strong> בקטגוריה הזו.</div>
    </div>

    <div class="grid grid-cols-4" style="margin-bottom:18px;">
        <div class="kpi"><div class="kpi-label">VIP (90+)</div><div class="kpi-value" style="color:var(--accent)">${STATE_SA.leads.filter(l=>l.score>=90).length}</div></div>
        <div class="kpi"><div class="kpi-label">חמים (80-89)</div><div class="kpi-value" style="color:var(--hot)">${STATE_SA.leads.filter(l=>l.score>=80&&l.score<90).length}</div></div>
        <div class="kpi"><div class="kpi-label">בינוניים (60-79)</div><div class="kpi-value">${STATE_SA.leads.filter(l=>l.score>=60&&l.score<80).length}</div></div>
        <div class="kpi"><div class="kpi-label">חלשים (<60)</div><div class="kpi-value" style="color:var(--muted)">${STATE_SA.leads.filter(l=>l.score<60).length}</div></div>
    </div>

    <div class="section-title">לידים לפי ציון (גבוה → נמוך)</div>
    <div class="table-wrap">
        <table>
            <thead><tr><th>ציון</th><th>חום</th><th>שם</th><th>עסק</th><th>סטטוס</th><th>נציג</th><th>הסבר ציון</th><th>פעולות</th></tr></thead>
            <tbody>
                ${[...STATE_SA.leads].sort((a,b)=>b.score-a.score).slice(0,20).map(l => `
                    <tr>
                        <td class="num"><strong style="font-size:14px; color:${l.score>=80?'var(--accent)':l.score>=60?'var(--warning)':'var(--muted)'}">${l.score}</strong></td>
                        <td>${heatBadge(l.heat)}</td>
                        <td><strong>${l.name}</strong></td>
                        <td>${l.business}</td>
                        <td>${statusPill_sa(l.status)}</td>
                        <td>${l.rep}</td>
                        <td style="font-size:11px; color:var(--text-soft)">${l.score>=85 ? 'מחזור גבוה, דחיפות, כאב ברור' : l.score>=70 ? 'נתונים טובים, דורש פיתוח' : l.score>=50 ? 'נתונים חלקיים' : 'מעט נתונים'}</td>
                        <td><div class="action-icons">
                            <button class="icon-action" onclick="SA.viewLead('${l.id}')">👁</button>
                            <button class="icon-action" onclick="SA.callLead('${l.id}')">📞</button>
                        </div></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
`;

// ============ 4. LEAD JOURNEY ============
TABS_SA.leadjourney = () => {
    const stages = [
        { num: 1, title: 'ליד נכנס', desc: 'הליד השאיר פרטים. המערכת מוסיפה אותו אוטומטית.' },
        { num: 2, title: 'סינון ראשוני', desc: 'שאלון או שיחה קצרה לוודא התאמה.' },
        { num: 3, title: 'ציון ליד', desc: 'הסוכן מחשב ציון 0-100 לפי הנתונים.' },
        { num: 4, title: 'הודעת פתיחה', desc: 'הודעה אסרטיבית-מקצועית מהנציג (דורש אישור).' },
        { num: 5, title: 'שיחה ראשונה', desc: 'נסיון טלפוני + פולואפ וואטסאפ אם לא ענה.' },
        { num: 6, title: 'אבחון + שאלון', desc: 'כאב, רצון, תקציב, דחיפות.' },
        { num: 7, title: 'קביעת פגישה', desc: 'כשהליד מתאים - קביעת פגישת עומק.' },
        { num: 8, title: 'תזכורת לפגישה', desc: '24h + 2h לפני הפגישה.' },
        { num: 9, title: 'פגישה', desc: 'מבנה: אבחון → פתרון → מחיר → סגירה.' },
        { num: 10, title: 'פולואפ אחרי', desc: 'תוך 24 שעות אחרי הפגישה.' },
        { num: 11, title: 'הצעת מחיר', desc: 'נשלחת + מעקב פתיחה אוטומטי.' },
        { num: 12, title: 'טיפול בהתנגדות', desc: 'מענה ספציפי לכל התנגדות.' },
        { num: 13, title: 'סגירה', desc: 'הצעד הברור הבא - חתימה ותשלום.' },
        { num: 14, title: 'אם לא נסגר', desc: 'מסע חימום לטווח ארוך.' },
    ];
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">מסע הליד שלך</div>
            <div class="ai-insight">זה המסע ש<strong>כל ליד</strong> עובר במערכת שלך. ניתן להתאים אותו לפי <strong>סוג עסק, מוצר, סוג ליד, וגודל עסקה</strong>.</div>
            <div style="margin-top:10px;"><button class="btn xs primary" onclick="switchTab('biztype')">התאם לסוג העסק שלי →</button></div>
        </div>

        <div class="section-title">המסע השלם</div>
        <div class="journey">
            ${stages.map(s => `
                <div class="journey-stage">
                    <div class="journey-num">${s.num}</div>
                    <div class="journey-title">${s.title}</div>
                    <div class="journey-desc">${s.desc}</div>
                </div>
            `).join('')}
        </div>

        <div class="section-title" style="margin-top:24px;">דוגמאות מסעות מובנים</div>
        <div class="grid grid-cols-2">
            ${STATE_SA.bizTypes.slice(0,4).map(bt => `
                <div class="card">
                    <div class="card-title">${bt.icon} ${bt.name}</div>
                    <div class="card-subtitle">${bt.focus}</div>
                    <div style="margin-top:10px;">
                        ${bt.stages.map((st, i) => `<span class="pill neutral" style="margin:2px; font-size:10px;">${i+1}. ${st}</span>`).join('')}
                    </div>
                    <button class="btn xs primary" style="margin-top:10px;" onclick="SA.selectBizType('${bt.id}')">השתמש</button>
                </div>
            `).join('')}
        </div>
    `;
};

// ============ 5. CUSTOMER JOURNEY ============
TABS_SA.custjourney = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">מסע הלקוח (אחרי שלב מכירה ראשוני)</div>
        <div class="ai-insight">מה קורה <strong>אחרי</strong> שיש פגישה / הצעה - כאן ה-money is made.</div>
        <div class="ai-insight">⚠️ הערה: הסוכן לא יוצר הודעות מתחננות. הוא שומר על <strong>סמכות, מקצועיות וצעד ברור הבא</strong>.</div>
    </div>

    <div class="grid grid-cols-2">
        ${[
            { stage: 'נקבעה פגישה', risk: 'בינוני', next: 'תזכורת 24h+2h לפני', msg: 'יום לפני הפגישה - לוודא הגעה ולשלוח חומר קצר לקריאה.' },
            { stage: 'הגיע לפגישה', risk: 'נמוך', next: 'פולואפ תוך 24h', msg: 'אחרי הפגישה: סיכום + הצעה + צעד הבא ברור.' },
            { stage: 'לא הגיע לפגישה', risk: 'גבוה', next: 'הודעת החזרה תוך שעה', msg: 'אסרטיבי-מכבד: "תגיד את האמת - תזמון לא טוב או כבר לא רלוונטי?"' },
            { stage: 'הצעה נשלחה', risk: 'בינוני', next: 'מעקב פתיחה + פולואפ 24h', msg: 'מעקב אם נפתחה. אם לא - הודעה ספציפית.' },
            { stage: 'הצעה לא נפתחה', risk: 'גבוה', next: 'הודעה ממוקדת', msg: '"שלחתי לך הצעה. רוצה לעבור עליה ביחד 10 דקות במקום שתסתכל לבד?"' },
            { stage: 'ביקש לחשוב', risk: 'גבוה', next: 'שאלת התנגדות בתוך 48h', msg: '"מה הדבר האחד שלא יושב לך - מחיר, אמון או תזמון?"' },
            { stage: 'ביקש מחיר', risk: 'בינוני', next: 'שיחת עומק', msg: '"יקר ביחס למה? בוא נראה מה זה אמור לפתור לך."' },
            { stage: 'ביקש לדבר עם בן זוג', risk: 'בינוני', next: 'הכנת סיכום לשניהם', msg: 'הכן סיכום ברור עם מספרים שיוכל להראות.' },
            { stage: 'נעלם', risk: 'קריטי', next: 'מסע חימום אסרטיבי', msg: 'הודעת תובנה: "אם הבעיה עדיין קיימת ולא פתרת - אולי עכשיו הזמן."' },
            { stage: 'סגר', risk: 'נמוך', next: 'מעבר לאונבורדינג', msg: 'העברה חלקה לסוכן התפעול - אונבורדינג מוכן.' },
        ].map(s => `
            <div class="card">
                <div class="card-h">
                    <div>
                        <div class="card-title">${s.stage}</div>
                        <div class="card-subtitle">סיכון: ${s.risk}</div>
                    </div>
                    <span class="pill ${s.risk==='קריטי'?'error':s.risk==='גבוה'?'warning':s.risk==='בינוני'?'info':'success'}">${s.risk}</span>
                </div>
                <div style="font-size:12px; color:var(--text-soft); margin:8px 0;"><strong>פעולה:</strong> ${s.next}</div>
                <div class="msg-preview"><div class="msg-preview-h">📝 הודעה מומלצת</div>${s.msg}</div>
            </div>
        `).join('')}
    </div>
`;

// ============ 6. REVIVAL ============
TABS_SA.revival = () => {
    const candidates = STATE_SA.leads.filter(l => l.status === 'נעלם' || l.status === 'אבוד' || l.heat === 'קר');
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">החייאת לידים - הכסף שכבר במערכת</div>
            <div class="ai-insight">יש <strong>${STATE_SA.kpis.revivalCandidates.value} לידים</strong> מתאימים להחייאה. הם כבר הראו עניין פעם אחת - הכי קל להחזיר אותם.</div>
            <div class="ai-insight">הזדמנות שווי: אם 10% מהם יסגרו = <strong>₪${(STATE_SA.kpis.revivalCandidates.value * 0.1 * 15000).toLocaleString('he-IL')}</strong> תוספת מחזור.</div>
        </div>

        <div class="grid grid-cols-4" style="margin-bottom:18px;">
            <div class="kpi"><div class="kpi-label">לידים להחייאה</div><div class="kpi-value">${candidates.length}</div></div>
            <div class="kpi"><div class="kpi-label">לקוחות עבר</div><div class="kpi-value">18</div></div>
            <div class="kpi"><div class="kpi-label">פגישות שלא נסגרו</div><div class="kpi-value">${STATE_SA.lostDeals.filter(d => d.stage.includes('פגישה')).length}</div></div>
            <div class="kpi"><div class="kpi-label">פוטנציאל</div><div class="kpi-value" style="color:var(--success)">${fmtCur(candidates.length * 15000)}</div></div>
        </div>

        <div class="section-title">מסעות החייאה מוצעים</div>
        ${[
            { name: 'מסע תובנה חדשה', desc: 'שלח תובנה חדשה רלוונטית למה שדיברתם עליו', candidates: 8 },
            { name: 'מסע הזדמנות חדשה', desc: 'מוצר/שירות חדש שיכול להתאים יותר', candidates: 5 },
            { name: 'מסע עדות לקוח', desc: 'הראה תוצאה של לקוח דומה שכן סגר', candidates: 6 },
            { name: 'מסע שינוי מחיר/תנאים', desc: 'הצעה חדשה בתנאי תשלום שונים', candidates: 4 },
        ].map(j => `
            <div class="action-card">
                <div class="action-card-h">
                    <div>
                        <div class="action-card-title">${j.name}</div>
                        <div style="font-size:11px; color:var(--muted); margin-top:2px;">${j.desc}</div>
                    </div>
                    <strong>${j.candidates} לידים מתאימים</strong>
                </div>
                <div class="action-card-buttons">
                    <button class="btn xs primary" onclick="SA.toast('מסע התחיל - הודעות בהמתנה לאישור', 'success')">התחל מסע</button>
                </div>
            </div>
        `).join('')}

        <div class="section-title" style="margin-top:24px;">לידים מועמדים</div>
        <div class="table-wrap">
            <table>
                <thead><tr><th>שם</th><th>סטטוס נוכחי</th><th>חום</th><th>קשר אחרון</th><th>סיבת אבדן</th><th>פעולה</th></tr></thead>
                <tbody>
                    ${candidates.slice(0,8).map(l => `
                        <tr>
                            <td><strong>${l.name}</strong></td>
                            <td>${statusPill_sa(l.status)}</td>
                            <td>${heatBadge(l.heat)}</td>
                            <td style="font-size:11px;">${l.lastCall || '-'}</td>
                            <td style="font-size:11px;">${l.notes}</td>
                            <td><button class="btn xs primary" onclick="SA.startRevival('${l.id}')">💫 התחל החייאה</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
};

// ============ 7. CALL SCRIPTS ============
TABS_SA.callscripts = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">תסריטי שיחה - לא רובוטי, חכם</div>
        <div class="ai-insight">הרעיון: <strong>לא לקרוא מסקריפט</strong>. הרעיון: לדעת בדיוק לאן מנהלים את השיחה.</div>
    </div>

    <div class="subtabs">
        <button class="subtab active">פתיחה</button>
        <button class="subtab">אבחון</button>
        <button class="subtab">הצגת פתרון</button>
        <button class="subtab">סגירה</button>
        <button class="subtab">התנגדויות</button>
    </div>

    <div class="grid grid-cols-2">
        <div class="card">
            <div class="card-title">📞 פתיחת שיחה (אסרטיבית-מקצועית)</div>
            <div class="msg-preview" style="margin-top:10px;">
                <div class="msg-preview-h">✓ דוגמה טובה</div>
                "היי {שם}, אני {שם נציג} מ-{שם עסק}. ראיתי שהשארת פרטים על {נושא}. יש לי 2 שאלות קצרות לבדוק אם זה רלוונטי - יש לך 5 דקות?"
            </div>
            <div class="msg-preview bad">
                <div class="msg-preview-h">✗ דוגמה רעה</div>
                "שלום, האם זה זמן נוח? רציתי לדבר איתך אם זה אפשרי..."
            </div>
            <button class="btn xs" onclick="SA.copyMessage('היי, אני {שם נציג} מ-{שם עסק}. ראיתי שהשארת פרטים. יש לי 2 שאלות קצרות לבדוק אם זה רלוונטי.')">📋 העתק</button>
        </div>

        <div class="card">
            <div class="card-title">🎯 שאלות אבחון מפתח</div>
            <div style="font-size:13px; line-height:1.9; padding:10px 0;">
                <div>• מה גרם לך להשאיר פרטים?</div>
                <div>• מה העסק שלך עושה?</div>
                <div>• איפה אתה נמצא היום? לאן אתה רוצה להגיע?</div>
                <div>• מה ניסית עד היום? מה עבד / לא עבד?</div>
                <div>• מה הכי תקוע כרגע?</div>
                <div>• כמה זמן זה כבר ככה?</div>
                <div>• מי מקבל החלטה?</div>
                <div>• כמה אתה מוכן להשקיע לפתור את זה?</div>
                <div>• מתי אתה רוצה להתחיל?</div>
            </div>
        </div>

        <div class="card">
            <div class="card-title">💡 הצגת פתרון</div>
            <div class="msg-preview" style="margin-top:10px;">
                <div class="msg-preview-h">✓ מבנה</div>
                "אם הבנתי אותך נכון - {שיקוף הכאב}. מה שאני יכול לעשות זה {פתרון}. בעבר עזרנו ל-{דוגמה דומה} להגיע ל-{תוצאה}. אם תרצה - הצעד הבא הוא {פגישה/הצעה}."
            </div>
            <button class="btn xs" onclick="SA.toast('הועתק', 'success')">📋 העתק</button>
        </div>

        <div class="card">
            <div class="card-title">🤝 סגירה לצעד הבא</div>
            <div class="msg-preview">
                <div class="msg-preview-h">✓ סגירה</div>
                "בסדר, אז הצעד הבא: אני שולח לך הצעה היום בערב, אנחנו מדברים מחר ב-12:00 ואז סוגרים. נשמע סגור?"
            </div>
            <div class="msg-preview bad">
                <div class="msg-preview-h">✗ סגירה רכה (לא מסכם)</div>
                "אז... אם תרצה תחזור אלי..."
            </div>
        </div>
    </div>
`;

// ============ 8. MEETING SCRIPTS ============
TABS_SA.meetingscripts = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">תסריטי פגישה - מבנה שמוביל לסגירה</div>
        <div class="ai-insight">מבנה הפגישה הוא ההבדל בין סגירה לבין "אני אחזור אליך".</div>
    </div>

    <div class="section-title">המבנה המנצח (60 דקות)</div>
    <div class="journey" style="margin-bottom:24px;">
        ${[
            { num: 1, title: 'פתיחה + סמכות (3min)', desc: 'מסגרת הפגישה, מי אתה, מה ה-flow' },
            { num: 2, title: 'חיבור קצר (3min)', desc: 'אבל לא יותר מדי' },
            { num: 3, title: 'אבחון מצב (10min)', desc: 'איפה אתה היום?' },
            { num: 4, title: 'הבנת יעד (5min)', desc: 'איפה אתה רוצה להיות?' },
            { num: 5, title: 'הגדלת כאב (5min)', desc: 'מה עולה לך להישאר ככה?' },
            { num: 6, title: 'הצגת פתרון (10min)', desc: 'איך אנחנו פותרים בדיוק' },
            { num: 7, title: 'הצגת הוכחה (5min)', desc: 'מי עוד עבד עם זה והצליח' },
            { num: 8, title: 'הצגת מחיר (5min)', desc: 'ישיר, ברור, בטוח' },
            { num: 9, title: 'טיפול בהתנגדות (10min)', desc: 'אם יש' },
            { num: 10, title: 'סגירה (4min)', desc: 'צעד ברור הבא' },
        ].map(s => `
            <div class="journey-stage" style="min-width:160px;">
                <div class="journey-num">${s.num}</div>
                <div class="journey-title">${s.title}</div>
                <div class="journey-desc">${s.desc}</div>
            </div>
        `).join('')}
    </div>

    <div class="grid grid-cols-2">
        <div class="card">
            <div class="card-title">📋 הכנה לפני הפגישה (5 דק׳)</div>
            <div style="font-size:12px; line-height:1.9; padding:8px 0;">
                ✓ מה הליד כתב?<br>
                ✓ ממה הוא הגיע (מקור)?<br>
                ✓ ציון + חום<br>
                ✓ מחזור/תחום<br>
                ✓ התנגדות צפויה<br>
                ✓ מה לא להגיד<br>
                ✓ הצעה ומחיר מומלצים
            </div>
            <button class="btn xs primary" onclick="SA.toast('פתח את כרטיס הליד וצור הכנה', 'info')">צור הכנה לליד</button>
        </div>
        <div class="card">
            <div class="card-title">📝 אחרי הפגישה (תוך 24h)</div>
            <div style="font-size:12px; line-height:1.9; padding:8px 0;">
                ✓ סיכום פגישה<br>
                ✓ הצעת מחיר<br>
                ✓ הודעת פולואפ<br>
                ✓ משימת מעקב<br>
                ✓ עדכון סטטוס במערכת<br>
                ✓ העברה למסע הבא
            </div>
        </div>
    </div>
`;

// ============ 9. MESSAGES ============
TABS_SA.messages = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">ספריית הודעות - לפי כל סטטוס</div>
        <div class="ai-insight">הודעות חכמות, לא מתחננות, שעובדות. כל אחת עם <strong>4 גרסאות</strong>: אסרטיבי / רך / מקצועי / חכם.</div>
    </div>

    <div class="grid grid-cols-2">
        ${STATE_SA.messagesByStatus.map(m => `
            <div class="card">
                <div class="card-h">
                    <div>
                        <div class="card-title">${m.status}</div>
                        <div class="card-subtitle">טון: ${m.tone}</div>
                    </div>
                    <button class="btn xs" onclick="SA.copyMessage('${m.text.replace(/'/g, '')}')">📋</button>
                </div>
                <div class="msg-preview">${m.text}</div>
            </div>
        `).join('')}
    </div>
`;

// ============ 10. PIPELINE ============
TABS_SA.pipeline = () => {
    const stages = ['ליד חדש', 'בשיחה', 'מתאים', 'נקבעה פגישה', 'הגיע לפגישה', 'הצעה נשלחה', 'סגור'];
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">פייפליין מכירות</div>
            <div class="ai-insight">שווי פייפליין כולל: <strong>${fmtCur(STATE_SA.kpis.pipelineValue.value)}</strong>. הצפי החודש (ריאלי): <strong>${fmtCur(STATE_SA.kpis.forecastRevenue.value)}</strong>.</div>
        </div>

        <div class="pipeline">
            ${stages.map(stage => {
                const dealsInStage = STATE_SA.leads.filter(l => {
                    if (stage === 'ליד חדש') return l.status === 'חדש' || l.status === 'ניסיון שני';
                    if (stage === 'בשיחה') return l.status === 'ענה';
                    if (stage === 'מתאים') return l.status === 'מתאים' || l.heat === 'חם' || l.heat === 'רותח';
                    if (stage === 'נקבעה פגישה') return l.status === 'נקבעה פגישה';
                    if (stage === 'הגיע לפגישה') return l.status === 'הגיע לפגישה';
                    if (stage === 'הצעה נשלחה') return l.status === 'הצעה נשלחה' || l.status === 'בפולואפ';
                    if (stage === 'סגור') return l.status === 'סגור';
                    return false;
                });
                const value = dealsInStage.length * 15000;
                return `
                    <div class="pipe-col">
                        <div class="pipe-col-h">
                            <span>${stage}</span>
                            <div>
                                <span class="pipe-col-count">${dealsInStage.length}</span>
                                <div class="pipe-col-value">${fmtCur(value)}</div>
                            </div>
                        </div>
                        ${dealsInStage.slice(0, 6).map(l => `
                            <div class="pipe-card" onclick="SA.viewLead('${l.id}')">
                                <div class="pipe-card-name">${l.name}</div>
                                <div class="pipe-card-val">${fmtCur(15000)}</div>
                                <div class="pipe-card-meta">
                                    <span>${heatBadge(l.heat)}</span>
                                    <span>${l.closeProbability}%</span>
                                </div>
                            </div>
                        `).join('') || '<div style="color:var(--muted); font-size:11px; padding:6px; text-align:center;">ריק</div>'}
                    </div>`;
            }).join('')}
        </div>
    `;
};

// ============ 11. PROPOSALS ============
TABS_SA.proposals = () => {
    const open = STATE_SA.proposals;
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">הצעות מחיר פתוחות</div>
            <div class="ai-insight">יש <strong>${open.length} הצעות פתוחות</strong> בשווי <strong>${fmtCur(open.reduce((s,p)=>s+p.deal,0))}</strong>. <strong>${open.filter(p=>p.daysOpen>2 && !p.lastFollowup).length}</strong> לא קיבלו פולואפ.</div>
        </div>

        <div class="grid grid-cols-4" style="margin-bottom:18px;">
            <div class="kpi"><div class="kpi-label">סה״כ פתוחות</div><div class="kpi-value">${open.length}</div></div>
            <div class="kpi"><div class="kpi-label">שווי כולל</div><div class="kpi-value" style="color:var(--success)">${fmtCur(open.reduce((s,p)=>s+p.deal,0))}</div></div>
            <div class="kpi"><div class="kpi-label">לא נפתחו</div><div class="kpi-value" style="color:var(--warning)">${open.filter(p=>!p.opened).length}</div></div>
            <div class="kpi"><div class="kpi-label">דורש פולואפ</div><div class="kpi-value" style="color:var(--error)">${open.filter(p=>p.daysOpen>2&&!p.lastFollowup).length}</div></div>
        </div>

        <div class="table-wrap">
            <div class="table-toolbar">
                <h3>הצעות מחיר</h3>
                <div class="filter-row">
                    <button class="btn sm" onclick="SA.exportToExcel('הצעות')">📊 ייצא</button>
                    <button class="btn sm primary" onclick="SA.addProposal()">+ הצעה חדשה</button>
                </div>
            </div>
            <table>
                <thead><tr><th>ID</th><th>לקוח</th><th>סכום</th><th>נשלחה</th><th>נפתחה?</th><th>ימים פתוחה</th><th>סטטוס</th><th>נציג</th><th>התנגדות</th><th>פעולה הבאה</th><th>פעולות</th></tr></thead>
                <tbody>
                    ${open.map(p => `
                        <tr>
                            <td style="font-size:11px;">${p.id}</td>
                            <td><strong>${p.client}</strong></td>
                            <td class="num"><strong>${fmtCur(p.deal)}</strong></td>
                            <td>${p.sent}</td>
                            <td>${p.opened ? '✅' : '❌'}</td>
                            <td class="num ${p.daysOpen>3?'neg':''}">${p.daysOpen}</td>
                            <td>${statusPill_sa(p.status)}</td>
                            <td>${p.rep}</td>
                            <td style="font-size:11px;">${p.objection}</td>
                            <td style="font-size:11px;">${p.nextAction}</td>
                            <td><div class="action-icons">
                                <button class="icon-action" onclick="SA.viewProposal('${p.id}')">👁</button>
                                <button class="icon-action" title="נסגרה" onclick="SA.closeProposal('${p.id}')">✓</button>
                                <button class="icon-action" title="אבדה" onclick="SA.lostProposal('${p.id}')">✗</button>
                            </div></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
};

// ============ 12. FOLLOWUPS ============
TABS_SA.followups = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">פולואפים - לא להישמע מתחנן</div>
        <div class="ai-insight">${STATE_SA.followups.filter(f=>f.status==='ממתין לאישור').length} פולואפים ממתינים לאישור. <strong>${fmtCur(STATE_SA.kpis.openFollowupMoney.value)}</strong> כסף תקוע שיכול להיגבות.</div>
        <div class="ai-insight">⚠️ אף הודעה לא נשלחת אוטומטית. כל הודעה דורשת <strong>אישור אנושי</strong>.</div>
    </div>

    <div class="grid grid-cols-4" style="margin-bottom:18px;">
        <div class="kpi"><div class="kpi-label">ממתינים לאישור</div><div class="kpi-value" style="color:var(--warning)">${STATE_SA.followups.filter(f=>f.status==='ממתין לאישור').length}</div></div>
        <div class="kpi"><div class="kpi-label">אושרו לשליחה</div><div class="kpi-value" style="color:var(--success)">${STATE_SA.followups.filter(f=>f.status==='אושר לשליחה').length}</div></div>
        <div class="kpi"><div class="kpi-label">היום</div><div class="kpi-value">${STATE_SA.followups.filter(f=>f.dueDate===STATE_SA.today).length}</div></div>
        <div class="kpi"><div class="kpi-label">קריטיים</div><div class="kpi-value" style="color:var(--error)">${STATE_SA.followups.filter(f=>f.priority==='קריטית').length}</div></div>
    </div>

    ${STATE_SA.followups.map(f => `
        <div class="action-card priority-${f.priority==='קריטית'?'critical':f.priority==='גבוהה'?'high':''}">
            <div class="action-card-h">
                <div>
                    <div class="action-card-title">${f.client}</div>
                    <div style="font-size:11px; color:var(--muted); margin-top:2px;">${f.type} · ${f.rep}</div>
                </div>
                <div>${statusPill_sa(f.priority)} ${statusPill_sa(f.status)}</div>
            </div>
            <div class="msg-preview">${f.message}</div>
            <div class="action-card-meta"><span>📅 ${f.dueDate}</span></div>
            <div class="action-card-buttons">
                ${f.status === 'ממתין לאישור' ? `<button class="btn xs primary" onclick="SA.approveFollowup('${f.id}')">✓ אשר לשליחה</button>` : ''}
                <button class="btn xs success" onclick="SA.completeFollowup('${f.id}')">סמן כבוצע</button>
                <button class="btn xs" onclick="SA.copyMessage('${f.message.replace(/'/g, '')}')">📋 העתק</button>
                <button class="btn xs danger" onclick="SA.deleteFollowup('${f.id}')">🗑</button>
            </div>
        </div>
    `).join('') || '<div class="placeholder-zone"><div class="ph-icon">✅</div><div class="ph-title">אין פולואפים פתוחים</div></div>'}

    <div style="text-align:center; margin-top:20px;">
        <button class="btn primary" onclick="SA.addFollowup()">+ פולואפ חדש</button>
    </div>
`;

// ============ 13. OBJECTIONS ============
TABS_SA.objections = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">איך לענות על התנגדויות</div>
        <div class="ai-insight">לכל התנגדות יש <strong>4 גרסאות תשובה</strong>: קצרה / ארוכה / אסרטיבית / רכה.</div>
    </div>

    ${STATE_SA.objections.map(o => `
        <div class="card" style="margin-bottom:14px;">
            <div class="card-h">
                <div>
                    <div class="card-title">"${o.type}"</div>
                    <div class="card-subtitle">סיבה אמיתית: ${o.realReason}</div>
                </div>
            </div>

            <div class="grid grid-cols-2" style="margin-top:12px;">
                <div>
                    <div style="font-size:11px; color:var(--accent); font-weight:700; text-transform:uppercase; margin-bottom:4px;">✓ תשובה אסרטיבית</div>
                    <div class="msg-preview">${o.assertive}</div>
                </div>
                <div>
                    <div style="font-size:11px; color:var(--accent); font-weight:700; text-transform:uppercase; margin-bottom:4px;">✓ תשובה רכה</div>
                    <div class="msg-preview">${o.soft}</div>
                </div>
            </div>

            <div style="margin-top:10px;">
                <div style="font-size:11px; color:var(--text-soft); font-weight:700; text-transform:uppercase; margin-bottom:4px;">📞 שאלה חכמה לשאול</div>
                <div class="msg-preview" style="background:#fef3c7; border-color:#fcd34d; border-right-color:var(--warning);"><div class="msg-preview-h" style="color:var(--warning)">שאלה</div>${o.question}</div>
            </div>

            <div style="margin-top:10px;">
                <div style="font-size:11px; color:var(--text-soft); font-weight:700; text-transform:uppercase; margin-bottom:4px;">💬 הודעת וואטסאפ מוכנה</div>
                <div class="msg-preview">${o.whatsapp}<div style="margin-top:6px;"><button class="btn xs" onclick="SA.copyMessage('${o.whatsapp.replace(/'/g, '')}')">📋 העתק</button></div></div>
            </div>

            <div style="font-size:11px; color:var(--muted); margin-top:10px;"><strong>מתי לשחרר:</strong> ${o.whenToRelease}</div>
        </div>
    `).join('')}
`;

// ============ 14. LOST DEALS ============
TABS_SA.lost = () => {
    const byReason = {};
    STATE_SA.lostDeals.forEach(d => { byReason[d.reason] = (byReason[d.reason] || 0) + 1; });
    const sorted = Object.entries(byReason).sort((a,b)=>b[1]-a[1]);
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">למה עסקאות לא נסגרות</div>
            <div class="ai-insight"><strong>${sorted[0]?.[1] || 0} עסקאות</strong> אבדו השבוע בגלל "${sorted[0]?.[0] || ''}". מתוכן <strong>${STATE_SA.lostDeals.filter(d=>d.recoverable==='כן').length} ניתנות להחייאה</strong>.</div>
            <div class="ai-insight">סך כסף שאבד החודש: <strong style="color:var(--error)">${fmtCur(STATE_SA.lostDeals.reduce((s,d)=>s+d.deal,0))}</strong>.</div>
        </div>

        <div class="grid grid-cols-4" style="margin-bottom:18px;">
            <div class="kpi"><div class="kpi-label">סך אבודות החודש</div><div class="kpi-value" style="color:var(--error)">${STATE_SA.lostDeals.length}</div></div>
            <div class="kpi"><div class="kpi-label">שווי שאבד</div><div class="kpi-value" style="color:var(--error)">${fmtCur(STATE_SA.lostDeals.reduce((s,d)=>s+d.deal,0))}</div></div>
            <div class="kpi"><div class="kpi-label">ניתנות להחייאה</div><div class="kpi-value" style="color:var(--success)">${STATE_SA.lostDeals.filter(d=>d.recoverable==='כן').length}</div></div>
            <div class="kpi"><div class="kpi-label">פוטנציאל להחזרה</div><div class="kpi-value">${fmtCur(STATE_SA.lostDeals.filter(d=>d.recoverable==='כן').reduce((s,d)=>s+d.deal,0))}</div></div>
        </div>

        <div class="section-title">סיבות אבדן (Top)</div>
        <div class="card" style="margin-bottom:18px;">
            ${sorted.map(([reason, count]) => `
                <div class="list-item">
                    <div class="list-item-text">
                        <div class="list-item-title">${reason}</div>
                    </div>
                    <div style="display:flex; gap:14px; align-items:center;">
                        <div style="width:200px;"><div class="progress-bar"><div class="progress-fill" style="width:${count/sorted[0][1]*100}%"></div></div></div>
                        <strong>${count}</strong>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="section-title">עסקאות אבודות מפורט</div>
        <div class="table-wrap">
            <div class="table-toolbar"><h3>עסקאות אבודות</h3><button class="btn sm" onclick="SA.exportToExcel('אבודות')">📊 ייצא</button></div>
            <table>
                <thead><tr><th>לקוח</th><th>שווי</th><th>סיבה</th><th>שלב</th><th>נציג</th><th>תאריך</th><th>ניתן להחיות?</th><th>הערות</th></tr></thead>
                <tbody>
                    ${STATE_SA.lostDeals.map(d => `
                        <tr>
                            <td><strong>${d.client}</strong></td>
                            <td class="num neg">${fmtCur(d.deal)}</td>
                            <td>${d.reason}</td>
                            <td style="font-size:11px;">${d.stage}</td>
                            <td>${d.rep}</td>
                            <td>${d.date}</td>
                            <td>${d.recoverable === 'כן' ? '<span class="pill success">כן</span>' : d.recoverable === 'אולי' ? '<span class="pill warning">אולי</span>' : '<span class="pill neutral">לא</span>'}</td>
                            <td style="font-size:11px;">${d.notes}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
};

// ============ 15. REPS ============
TABS_SA.reps = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">תובנת צוות מכירות</div>
        <div class="ai-insight"><strong>רון</strong> הכי טוב באחוז סגירה (50%) אבל מוגבל בכמות לידים. <strong>עמית</strong> מטפל בהרבה לידים אבל זמן תגובה איטי (4.5h).</div>
        <div class="ai-insight">המלצה: <strong>אופק</strong> פנוי לקבל עוד 5-7 לידים חמים שעמית לא מספיק לטפל בהם.</div>
    </div>

    <div class="table-wrap">
        <div class="table-toolbar"><h3>ביצועי נציגים</h3><button class="btn sm" onclick="SA.exportToExcel('נציגים')">📊 ייצא</button></div>
        <table>
            <thead><tr><th>נציג</th><th>תפקיד</th><th>לידים</th><th>זמן תגובה</th><th>שיחות</th><th>פגישות</th><th>הגיעו</th><th>סגירות</th><th>מחזור</th><th>שווי עסקה ממ׳</th><th>אחוז סגירה</th><th>סיבת אבדן ראשית</th><th>כסף תקוע</th></tr></thead>
            <tbody>
                ${STATE_SA.reps.map(r => `
                    <tr>
                        <td><strong>${r.name}</strong></td>
                        <td style="font-size:11px;">${r.role}</td>
                        <td class="num">${r.leads}</td>
                        <td class="num ${r.responseHours>3?'neg':''}">${r.responseHours}h</td>
                        <td class="num">${r.calls}</td>
                        <td class="num">${r.meetings}</td>
                        <td class="num">${r.shows ?? '-'}</td>
                        <td class="num">${r.closes ?? '-'}</td>
                        <td class="num">${r.revenue ? fmtCur(r.revenue) : '-'}</td>
                        <td class="num">${r.avgDeal ? fmtCur(r.avgDeal) : '-'}</td>
                        <td>${r.closeRate ? `<strong style="color:${r.closeRate>=40?'var(--success)':'var(--warning)'}">${r.closeRate}%</strong>` : '-'}</td>
                        <td style="font-size:11px;">${r.mainLostReason}</td>
                        <td class="num ${r.openFupValue>50000?'neg':''}">${fmtCur(r.openFupValue)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
`;

// ============ 16. AUTOMATIONS ============
TABS_SA.automations = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">אוטומציות מכירה</div>
        <div class="ai-insight"><strong>${STATE_SA.automations.filter(a=>a.status==='פעיל').length} אוטומציות פעילות</strong>. כל אוטומציה ששולחת ללקוח דורשת אישור אנושי.</div>
    </div>

    <div class="table-wrap">
        <div class="table-toolbar"><h3>אוטומציות</h3><button class="btn sm primary" onclick="SA.addAutomation()">+ אוטומציה חדשה</button></div>
        <table>
            <thead><tr><th>שם</th><th>טריגר</th><th>פעולה</th><th>סטטוס</th><th>דורש אישור</th><th>פעולה</th></tr></thead>
            <tbody>
                ${STATE_SA.automations.map(a => `
                    <tr>
                        <td><strong>${a.name}</strong></td>
                        <td style="font-size:11px;">${a.trigger}</td>
                        <td style="font-size:11px;">${a.action}</td>
                        <td>${statusPill_sa(a.status)}</td>
                        <td>${a.requiresApproval ? '⚠️ כן' : '-'}</td>
                        <td><button class="btn xs ${a.status==='פעיל'?'danger':'success'}" onclick="SA.toggleAutomation('${a.id}')">${a.status==='פעיל'?'כבה':'הפעל'}</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
`;

// ============ 17. PLAYBOOK ============
TABS_SA.playbook = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">ספר המכירות שלך</div>
        <div class="ai-insight">כל מה שהצוות צריך לדעת כדי למכור - במקום אחד.</div>
    </div>

    <div class="grid grid-cols-2">
        ${[
            { sec: '🎯 הלקוח האידיאלי', content: 'עסק עם 3+ עובדים, מחזור 80K+/חודש, מבין שצריך לתפעל מערכת מכירות' },
            { sec: '🚫 לקוח לא מתאים', content: 'מחפש פתרון חד-פעמי, אין תקציב מעל 1000₪, מצפה ל"קסם"' },
            { sec: '💔 כאבים מרכזיים', content: 'לידים נופלים, פולואפים נשכחים, עסקאות סוגרות לאט, אין שליטה במכירות' },
            { sec: '🌟 חלומות', content: 'מערכת מכירה שעובדת בלעדיהם, צוות שיודע בדיוק מה לעשות, צמיחה צפויה' },
            { sec: '💼 ההצעה', content: 'מערכת+תהליך+סוכן AI שמנהל מסעות אוטומטית עם פיקוח אנושי' },
            { sec: '🎯 הערך', content: 'X3 בהמרות, חיסכון של 20+ שעות שבועיות, עלייה של 30% במחזור' },
            { sec: '❓ שאלות מפתח', content: 'מה גרם לך לחפש פתרון? כמה לידים אתה מקבל בחודש? איזה אחוז מהם נסגר? מה התקציב שלך?' },
            { sec: '🚫 מה לא להגיד', content: 'לא "אנחנו הכי טובים", לא "אנחנו זולים", לא "תנסה ותראה", לא "אם זה לא יעבוד תוכל לבטל"' },
            { sec: '✅ איך לסגור', content: 'תמיד צעד הבא ברור עם תאריך. תמיד מסכמים בכתב. תמיד לא משאירים שאלות פתוחות.' },
            { sec: '⛔ גבולות', content: 'לא להתחיל ללא חוזה. לא להוריד מחיר ביותר מ-10%. לא לתת ניסיון בחינם.' },
        ].map(p => `
            <div class="card">
                <div class="card-title">${p.sec}</div>
                <div style="font-size:13px; color:var(--text-soft); line-height:1.7; margin-top:8px;">${p.content}</div>
            </div>
        `).join('')}
    </div>
`;

// ============ 18. CHAT ============
TABS_SA.chat = () => `
    <div class="chat-shell">
        <div class="chat-box">
            <div class="chat-head">
                <strong>🎯 צ׳אט מכירות</strong>
                <div style="display:flex; gap:6px;">
                    <button class="btn xs" onclick="SA.chatHistory=[]; SA._renderChat(); SA.toast('נוקה','info')">🗑</button>
                    <button class="btn xs success" onclick="SA.proactiveOpen()">✨ תובנות יומיות</button>
                </div>
            </div>
            <div class="chat-msgs" id="chatMsgs">
                ${SA.chatHistory.length === 0 ? `<div style="text-align:center; padding:30px; color:var(--muted); font-size:13px;">דבר עם הסוכן.<br><br>הוא מכיר את כל הלידים, ההצעות, הצוות והפייפליין שלך.<br><br>לחץ <strong>✨ תובנות יומיות</strong> כדי להתחיל.</div>` : ''}
            </div>
            <div class="chat-input-row">
                <input id="chatInput" type="text" placeholder="שאל..." onkeydown="if(event.key==='Enter'){SA.sendChatMessage(this.value); this.value='';}">
                <button class="btn primary" onclick="const i=document.getElementById('chatInput'); SA.sendChatMessage(i.value); i.value='';">שלח</button>
            </div>
        </div>
        <div>
            <div class="card-title" style="margin-bottom:10px;">שאלות מוצעות</div>
            <div style="display:flex; flex-direction:column; gap:6px;">
                ${['מי הלידים הכי חמים עכשיו?','איזה פולואפ לשלוח עכשיו?','איך לענות ליקר לי?','איך לענות לצריך לחשוב?','איזה עסקאות בסיכון?','איזה נציג צריך עזרה?','איפה המכירות נופלות?','כמה כסף פתוח בפולואפים?','איזה לידים להחיות היום?','איזה הצעות דורשות טיפול?','מה הפעולה הכי חשובה היום?','מי לא קיבל מענה?','בנה לי תוכנית סגירה ל-3 הצעות הכי גדולות'].map(q => `<button class="btn" style="text-align:right; justify-content:flex-start; font-size:12.5px; font-weight:400;" onclick="SA.chatSuggestion('${q.replace(/'/g,'')}')">💭 ${q}</button>`).join('')}
            </div>
        </div>
    </div>
`;
TABS_SA.chat_after = () => { if (SA.chatHistory.length>0) SA._renderChat(); setTimeout(()=>{const i=document.getElementById('chatInput'); if(i)i.focus();},50); };

// ============ 19. REPORTS ============
TABS_SA.reports = () => `
    <div class="grid grid-cols-3">
        ${STATE_SA.reports.map(r => `
            <div class="card">
                <div class="card-h"><div><div class="card-title">${r.name}</div><div class="card-subtitle">${r.desc}</div></div>${statusPill_sa(r.status)}</div>
                <div style="font-size:11px; color:var(--muted); margin:10px 0;">עודכן: ${r.lastGen}</div>
                <div style="display:flex; gap:6px;">
                    <button class="btn xs primary" onclick="SA.viewReport('${r.name}')">צפייה</button>
                    <button class="btn xs" onclick="SA.toast('PDF - בפיתוח', 'info')">📄 PDF</button>
                    <button class="btn xs" onclick="SA.exportToExcel('לידים')">📊 Excel</button>
                </div>
            </div>
        `).join('')}
    </div>
`;

// ============ 20. BIZ TYPE ============
TABS_SA.biztype = () => {
    const active = STATE_SA._activeBizType || 'consulting';
    return `
        <div class="ai-banner">
            <div class="ai-banner-h">התאמה לסוג עסק</div>
            <div class="ai-insight">מסעות, תסריטים, התנגדויות - הכל מסתדר אוטומטית לפי סוג העסק.</div>
        </div>

        <div class="grid grid-cols-3">
            ${STATE_SA.bizTypes.map(bt => `
                <div class="card" style="${bt.id === active ? 'border:2px solid var(--accent);' : ''}">
                    <div class="card-h">
                        <div>
                            <div class="card-title" style="font-size:15px;">${bt.icon} ${bt.name}</div>
                        </div>
                        ${bt.id === active ? '<span class="pill accent">פעיל</span>' : ''}
                    </div>
                    <p style="font-size:11.5px; color:var(--text-soft); line-height:1.6; margin:10px 0; min-height:60px;">${bt.focus}</p>
                    <div style="margin:10px 0;">
                        <div style="font-size:10px; color:var(--muted); font-weight:600; text-transform:uppercase; margin-bottom:4px;">שלבי מסע</div>
                        <div style="display:flex; flex-wrap:wrap; gap:3px;">
                            ${bt.stages.map((s,i) => `<span class="pill neutral" style="font-size:9px;">${i+1}. ${s}</span>`).join('')}
                        </div>
                    </div>
                    <button class="btn ${bt.id === active ? 'success' : 'primary'} sm" style="width:100%; margin-top:10px; justify-content:center;" onclick="SA.selectBizType('${bt.id}')">${bt.id === active ? '✓ פעיל' : 'בחר תבנית'}</button>
                </div>
            `).join('')}
        </div>
    `;
};

// ============ 21. INTEGRATIONS ============
TABS_SA.integrations = () => `
    <div class="ai-banner">
        <div class="ai-banner-h">אינטגרציות עתידיות</div>
        <div class="ai-insight">בשלב זה - תצוגה ויזואלית בלבד. בעתיד כל אינטגרציה תוסיף יכולת אמיתית.</div>
    </div>

    <div class="grid grid-cols-3">
        ${STATE_SA.integrations.map(i => `
            <div class="int-card">
                <div class="int-card-h">
                    <div class="int-card-icon">${i.icon}</div>
                    <div>
                        <div class="int-card-name">${i.name}</div>
                        <div style="font-size:10px; color:var(--muted)">${i.cat}</div>
                    </div>
                </div>
                <div style="font-size:12px; color:var(--text-soft);">${i.purpose}</div>
                <div class="int-card-stat"><span>סטטוס</span>${statusPill_sa(i.status)}</div>
                <button class="btn sm" style="width:100%; margin-top:10px; justify-content:center;" onclick="SA.toast('יחובר בשלב הבא', 'info')">הגדר בעתיד</button>
            </div>
        `).join('')}
    </div>
`;

// ============ 22. SETTINGS ============
TABS_SA.settings = () => `
    <div class="disclaimer">הסוכן מציג המלצות מכירה ותסריטים לשימוש הצוות. שליחה ללקוחות ושינויים קריטיים דורשים אישור אנושי.</div>

    <div class="grid grid-cols-2">
        <div class="card">
            <div class="card-title" style="margin-bottom:14px;">הגדרות מכירה</div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">מחזור מכירה ברירת מחדל</div></div><strong>14 ימים</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">תקרת הנחה לנציג</div></div><strong>10%</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">דורש אישור מעל</div></div><strong>₪ 25,000</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">סף ליד חם (ציון)</div></div><strong>75</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">סף ליד רותח (ציון)</div></div><strong>85</strong></div>
        </div>

        <div class="card">
            <div class="card-title" style="margin-bottom:14px;">סף התראות</div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">ליד ללא מענה</div><div class="list-item-sub">התראה אחרי</div></div><strong>2 שעות</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">הצעה ללא פולואפ</div><div class="list-item-sub">התראה אחרי</div></div><strong>48 שעות</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">ליד מתקרר</div><div class="list-item-sub">התראה אחרי</div></div><strong>5 ימים</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">סף החייאה</div><div class="list-item-sub">לידים מעל</div></div><strong>30 ימים</strong></div>
        </div>

        <div class="card">
            <div class="card-title" style="margin-bottom:14px;">הרשאות צוות</div>
            ${['בעלים','מנהל מכירות','נציג מכירות','מתאם פגישות','CSM','מנהל תפעול','צופה בלבד'].map(r => `<div class="list-item"><div class="list-item-text"><div class="list-item-title">${r}</div></div><button class="btn xs" onclick="SA.toast('יבנה בשלב Multi-tenant','info')">ערוך</button></div>`).join('')}
        </div>

        <div class="card">
            <div class="card-title" style="margin-bottom:14px;">⚡ ערך שהסוכן הביא</div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">פולואפים שנוצרו</div></div><strong style="color:var(--accent)">${STATE_SA.followups.length}</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">לידים שטופלו השבוע</div></div><strong>168</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">סגירות מתוזמנות</div></div><strong>${STATE_SA.kpis.closedDeals.value}</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">לידים שזוהו להחייאה</div></div><strong>${STATE_SA.kpis.revivalCandidates.value}</strong></div>
            <div class="list-item"><div class="list-item-text"><div class="list-item-title">זמן שנחסך לצוות</div></div><strong style="color:var(--success)">~28 שעות</strong></div>
        </div>
    </div>

    <div style="text-align:center; margin-top:24px;">
        <button class="btn danger" onclick="SA.resetDemo()">🔄 איפוס נתוני דמו</button>
    </div>
`;


