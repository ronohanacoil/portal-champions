/**
 * Personal Assistant Agent
 * Chat-first interface. Agentic. Connects to Google Calendar.
 */

(function() {
    'use strict';
    const STORAGE_KEY = 'as_state_v1';

    function loadState() {
        try {
            const s = localStorage.getItem(STORAGE_KEY);
            if (s) {
                const p = JSON.parse(s);
                if (p && p.tasks) return p;
            }
        } catch (e) {}
        return { tasks: [], events: [], calendarConnected: false };
    }
    function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE_AS)); } catch (e) {} }
    window.STATE_AS = loadState();

    // ============ HELPERS ============
    function toast(msg, type='info', dur=3500) {
        const c = document.getElementById('toastContainer'); if (!c) return;
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
        t.innerHTML = `<div>${icons[type]||''}</div><div style="flex:1">${msg}</div>`;
        c.appendChild(t);
        setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(), 300); }, dur);
    }
    function openModal(title, body, buttons=[]) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = body;
        const f = document.getElementById('modalFooter');
        f.innerHTML = '';
        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.className = `btn ${b.class||''}`;
            btn.textContent = b.label;
            btn.onclick = b.onclick;
            f.appendChild(btn);
        });
        document.getElementById('modalOverlay').classList.add('visible');
    }
    function closeModal() { document.getElementById('modalOverlay').classList.remove('visible'); }
    document.addEventListener('click', e => { if (e.target.id === 'modalOverlay') closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    function escHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function todayISO() { return new Date().toISOString().slice(0,10); }
    function fmtDate(iso) {
        if (!iso) return '-';
        const d = new Date(iso);
        const days = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
        return `${days[d.getDay()]} ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    // ============ window.AS ============
    window.AS = {
        chatHistory: [],
        toast, openModal, closeModal,

        // Sidebar render
        renderSidebar() {
            // Today's events
            const todayEl = document.getElementById('todayEvents');
            const today = todayISO();
            const todays = STATE_AS.events.filter(e => (e.start||'').slice(0,10) === today);
            if (todayEl) {
                if (todays.length === 0) {
                    todayEl.innerHTML = `<div style="font-size:11px; color:var(--muted); padding:8px;">אין אירועים היום 🌞</div>`;
                } else {
                    todayEl.innerHTML = todays.map(ev => `
                        <div class="event-item" onclick="AS.viewEvent('${ev.id}')">
                            <div class="event-item-time">${ev.start.slice(11,16)} · ${ev.duration||30} דק׳</div>
                            <div class="event-item-title">${escHtml(ev.title)}</div>
                            ${ev.context ? `<div class="event-item-meta">${escHtml(ev.context.slice(0,50))}</div>` : ''}
                        </div>
                    `).join('');
                }
            }
            // Recent tasks
            const recentEl = document.getElementById('recentTasks');
            if (recentEl) {
                const recent = STATE_AS.events.slice().sort((a,b)=>b.createdAt-a.createdAt).slice(0,5);
                if (recent.length === 0) {
                    recentEl.innerHTML = `<div style="font-size:11px; color:var(--muted); padding:8px;">אין עדיין משימות. תשלח לי מה שאתה צריך 👇</div>`;
                } else {
                    recentEl.innerHTML = recent.map(ev => `
                        <div class="event-item" onclick="AS.viewEvent('${ev.id}')">
                            <div class="event-item-title" style="margin-top:0">${escHtml(ev.title)}</div>
                            <div class="event-item-meta">${fmtDate(ev.start)}${ev.syncedToCalendar ? ' · ✅ ב-Calendar' : ' · 💾 לוקאלי'}</div>
                        </div>
                    `).join('');
                }
            }
        },

        async checkCalendarStatus() {
            const el = document.getElementById('calStatus');
            try {
                const r = await fetch('/api/calendar/status');
                if (!r.ok) throw new Error('not ok');
                const d = await r.json();
                STATE_AS.calendarConnected = d.calendar_ready;
                if (d.calendar_ready) {
                    el.className = 'cal-status connected';
                    el.innerHTML = `<span class="dot"></span><span>מחובר ל-Google Calendar ✓</span>`;
                } else if (d.drive_connected) {
                    el.className = 'cal-status disconnected';
                    el.innerHTML = `<span class="dot"></span><span>הרשאות Calendar נדרשות - לחץ לחיבור</span>`;
                } else {
                    el.className = 'cal-status disconnected';
                    el.innerHTML = `<span class="dot"></span><span>לא מחובר ל-Google - לחץ לחיבור</span>`;
                }
            } catch (e) {
                el.className = 'cal-status disconnected';
                el.innerHTML = `<span class="dot"></span><span>שגיאת חיבור</span>`;
            }
        },

        connectCalendar() {
            window.location.href = '/api/google/connect?scope=calendar';
        },

        clearChat() {
            AS.chatHistory = [];
            const ca = document.getElementById('chatArea');
            ca.innerHTML = '';
            saveState();
            toast('שיחה נוקתה', 'info');
        },

        // ============ VOICE RECORDING (Web Speech API) ============
        recognition: null,
        isRecording: false,

        toggleRecording() {
            if (AS.isRecording) {
                AS.stopRecording();
            } else {
                AS.startRecording();
            }
        },

        startRecording() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                toast('הדפדפן לא תומך בהקלטה קולית. נסה Chrome / Safari.', 'error', 5000);
                return;
            }
            try {
                AS.recognition = new SpeechRecognition();
                AS.recognition.lang = 'he-IL';
                AS.recognition.continuous = true;
                AS.recognition.interimResults = true;
                AS.recognition.maxAlternatives = 1;

                const inp = document.getElementById('chatInput');
                const micBtn = document.getElementById('micBtn');
                const micStatus = document.getElementById('micStatus');
                const micStatusText = document.getElementById('micStatusText');

                let finalTranscript = inp.value ? inp.value + ' ' : '';
                let interimTranscript = '';

                AS.recognition.onstart = () => {
                    AS.isRecording = true;
                    micBtn.classList.add('recording');
                    micStatus.style.display = 'block';
                    micStatusText.textContent = 'מקליט... דבר עכשיו. לחץ שוב על המיקרופון לעצירה.';
                };

                AS.recognition.onresult = (event) => {
                    interimTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript + ' ';
                        } else {
                            interimTranscript += transcript;
                        }
                    }
                    inp.value = finalTranscript + interimTranscript;
                    // Auto-resize
                    inp.style.height = 'auto';
                    inp.style.height = Math.min(inp.scrollHeight, 160) + 'px';
                };

                AS.recognition.onerror = (event) => {
                    console.warn('Speech error:', event.error);
                    if (event.error === 'no-speech') {
                        micStatusText.textContent = 'לא זוהה דיבור. נסה שוב.';
                    } else if (event.error === 'not-allowed') {
                        toast('אין הרשאה למיקרופון. בדוק הגדרות דפדפן.', 'error', 5000);
                        AS.stopRecording();
                    } else if (event.error === 'aborted') {
                        // user-initiated stop, ignore
                    } else {
                        toast(`שגיאת הקלטה: ${event.error}`, 'warning');
                    }
                };

                AS.recognition.onend = () => {
                    // If still recording (continuous true), restart automatically
                    if (AS.isRecording) {
                        try { AS.recognition.start(); } catch (e) { AS.stopRecording(); }
                    }
                };

                AS.recognition.start();
            } catch (e) {
                toast('שגיאה בהפעלת הקלטה: ' + e.message, 'error');
                AS.stopRecording();
            }
        },

        stopRecording() {
            AS.isRecording = false;
            const micBtn = document.getElementById('micBtn');
            const micStatus = document.getElementById('micStatus');
            const inp = document.getElementById('chatInput');

            if (micBtn) micBtn.classList.remove('recording');
            if (micStatus) micStatus.style.display = 'none';

            if (AS.recognition) {
                try { AS.recognition.stop(); } catch (e) {}
                AS.recognition = null;
            }

            // Focus input so user can edit/send
            if (inp) inp.focus();
        },

        handleKeyDown(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                AS.send();
            }
        },

        send() {
            const inp = document.getElementById('chatInput');
            const text = inp.value.trim();
            if (!text) return;
            AS.sendChatMessage(text);
            inp.value = '';
            inp.style.height = 'auto';
        },

        async sendChatMessage(text) {
            if (!text || !text.trim()) return;
            text = text.trim();

            // Stop recording if active (so we don't keep capturing while agent works)
            if (AS.isRecording) AS.stopRecording();

            AS.chatHistory.push({ role: 'user', content: text });
            AS._renderChat();
            AS._showTyping();

            try {
                // Build context snapshot
                const snapshot = {
                    today: todayISO(),
                    now_iso: new Date().toISOString(),
                    timezone: 'Asia/Jerusalem',
                    calendar_connected: STATE_AS.calendarConnected,
                    upcoming_events: STATE_AS.events.filter(e => e.start >= new Date().toISOString()).slice(0,10).map(e => ({ title: e.title, start: e.start, duration: e.duration })),
                    recent_task_count: STATE_AS.events.length,
                };
                const ctx = `\n\n## מצב נוכחי\n\`\`\`json\n${JSON.stringify(snapshot, null, 2)}\n\`\`\`\n`;
                const messages = [...AS.chatHistory.slice(0,-1), { role: 'user', content: text + ctx }];

                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages, agent_type: 'assistant' }),
                });
                AS._hideTyping();
                if (!res.ok) {
                    const err = await res.json().catch(()=>({error:'שגיאה'}));
                    AS.chatHistory.push({ role: 'assistant', content: `שגיאה: ${err.error||'לא ידוע'}` });
                    AS._renderChat();
                    return;
                }
                const data = await res.json();
                const reply = data.message || '(אין תוכן)';
                AS.chatHistory.push({ role: 'assistant', content: reply });
                AS._renderChat();
                await AS._processActions(reply);
                saveState();
            } catch (e) {
                AS._hideTyping();
                AS.chatHistory.push({ role: 'assistant', content: `שגיאת חיבור: ${e.message||'לא ידוע'}` });
                AS._renderChat();
            }
        },

        // Parse [ACTION] blocks and execute
        async _processActions(text) {
            const re = /\[ACTION\]([\s\S]*?)\[\/ACTION\]/g;
            let m, executed = 0;
            const pendingActions = [];
            while ((m = re.exec(text)) !== null) {
                try {
                    const a = JSON.parse(m[1].trim());
                    pendingActions.push(a);
                } catch (e) { console.warn('Bad action:', e); }
            }
            for (const action of pendingActions) {
                const ok = await AS._runAction(action);
                if (ok) executed++;
            }
            if (executed > 0) {
                AS.renderSidebar();
            }
        },

        async _runAction(action) {
            if (!action || !action.type) return false;
            if (action.type !== 'create_calendar_event') return false;

            // Local event
            const id = 'evt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,5);
            const localEvent = {
                id,
                title: action.title || 'משימה חדשה',
                description: action.description || '',
                context: action.context || '',
                start: action.start || new Date().toISOString(),
                end: action.end || null,
                duration: action.duration_minutes || 30,
                attendees: action.attendees || ['ronohana340@gmail.com'],
                phone: action.phone || null,
                taskType: action.task_type || 'general',
                createdAt: Date.now(),
                syncedToCalendar: false,
                calendarEventId: null,
                googleLink: null,
            };

            // Try to create real Google Calendar event
            try {
                const r = await fetch('/api/calendar/create-event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: localEvent.title,
                        description: localEvent.description + (localEvent.phone ? `\n\nטלפון: ${localEvent.phone}` : '') + (localEvent.context ? `\n\nהקשר: ${localEvent.context}` : ''),
                        start: localEvent.start,
                        end: localEvent.end,
                        duration_minutes: localEvent.duration,
                        attendees: localEvent.attendees,
                    }),
                });
                if (r.ok) {
                    const d = await r.json();
                    if (d.success) {
                        localEvent.syncedToCalendar = true;
                        localEvent.calendarEventId = d.event_id;
                        localEvent.googleLink = d.html_link;
                        toast(`📅 נוסף ל-Google Calendar: ${localEvent.title}`, 'success', 5000);
                    } else if (d.error) {
                        toast(`💾 נשמר לוקאלית: ${localEvent.title} (${d.error})`, 'warning', 5000);
                    }
                } else {
                    toast(`💾 נשמר לוקאלית: ${localEvent.title}`, 'warning', 4000);
                }
            } catch (e) {
                toast(`💾 נשמר לוקאלית: ${localEvent.title}`, 'warning', 4000);
            }

            STATE_AS.events.unshift(localEvent);
            saveState();
            AS.renderSidebar();
            return true;
        },

        // Render chat history
        _renderChat() {
            const ca = document.getElementById('chatArea');

            // Build HTML
            const msgs = AS.chatHistory.map(m => {
                if (m.role === 'user') {
                    const txt = m.content.split('## מצב נוכחי')[0].trim();
                    return `<div class="chat-msg user"><div class="bubble">${escHtml(txt)}</div></div>`;
                }
                // Bot: format message + replace [ACTION] with event cards
                let t = m.content;
                const events = [];
                t = t.replace(/\[ACTION\]([\s\S]*?)\[\/ACTION\]/g, (_, json) => {
                    try {
                        const a = JSON.parse(json.trim());
                        if (a.type === 'create_calendar_event') {
                            const cardHtml = AS._renderEventCard(a);
                            events.push(cardHtml);
                            return `__EVENT_${events.length - 1}__`;
                        }
                    } catch {}
                    return '';
                });
                t = escHtml(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
                events.forEach((card, i) => {
                    t = t.replace(`__EVENT_${i}__`, card);
                });
                return `<div class="chat-msg bot"><div class="avatar">🧠</div><div class="bubble">${t}</div></div>`;
            }).join('');

            // Remove existing messages but keep welcome if no chat yet
            const existingMsgs = ca.querySelectorAll('.chat-msg, .chat-typing');
            existingMsgs.forEach(el => el.remove());
            ca.insertAdjacentHTML('beforeend', msgs);
            ca.scrollTop = ca.scrollHeight;
        },

        _renderEventCard(a) {
            const start = a.start ? fmtDate(a.start) : '-';
            return `<div class="event-created-card">
                <div class="event-created-h">📅 ${escHtml(a.title || 'משימה')}</div>
                ${a.start ? `<div class="event-detail"><span class="label">📍 מתי:</span><span class="val">${start}</span></div>` : ''}
                ${a.duration_minutes ? `<div class="event-detail"><span class="label">⏱ משך:</span><span class="val">${a.duration_minutes} דקות</span></div>` : ''}
                ${a.phone ? `<div class="event-detail"><span class="label">📞 טלפון:</span><span class="val">${escHtml(a.phone)}</span></div>` : ''}
                ${a.context ? `<div class="event-detail"><span class="label">💬 הקשר:</span><span class="val">${escHtml(a.context)}</span></div>` : ''}
                ${a.description ? `<div class="event-detail"><span class="label">📝 פרטים:</span><span class="val">${escHtml(a.description).replace(/\n/g, '<br>')}</span></div>` : ''}
                <div class="event-detail"><span class="label">👤 משתתפים:</span><span class="val">${(a.attendees || ['ronohana340@gmail.com']).join(', ')}</span></div>
                <div class="event-actions">
                    <span style="font-size:11px; color:var(--muted)">💡 האירוע יתווסף ליומן its@ronohana.co.il אוטומטית</span>
                </div>
            </div>`;
        },

        _showTyping() {
            const ca = document.getElementById('chatArea');
            ca.insertAdjacentHTML('beforeend', `<div class="chat-typing" id="typing"><div class="avatar">🧠</div><div class="typing-dots"><span></span><span></span><span></span></div></div>`);
            ca.scrollTop = ca.scrollHeight;
        },
        _hideTyping() {
            const t = document.getElementById('typing'); if (t) t.remove();
        },

        viewEvent(id) {
            const ev = STATE_AS.events.find(e => e.id === id);
            if (!ev) return;
            openModal(ev.title, `
                <div style="font-size:13px; line-height:1.8;">
                    <div style="display:flex; gap:8px;"><strong style="color:var(--muted); min-width:80px;">📅 מתי:</strong><span>${fmtDate(ev.start)}</span></div>
                    <div style="display:flex; gap:8px;"><strong style="color:var(--muted); min-width:80px;">⏱ משך:</strong><span>${ev.duration} דקות</span></div>
                    ${ev.phone ? `<div style="display:flex; gap:8px;"><strong style="color:var(--muted); min-width:80px;">📞 טלפון:</strong><span><a href="tel:${ev.phone}" style="color:var(--accent)">${ev.phone}</a></span></div>` : ''}
                    ${ev.context ? `<div style="display:flex; gap:8px;"><strong style="color:var(--muted); min-width:80px;">💬 הקשר:</strong><span>${escHtml(ev.context)}</span></div>` : ''}
                    ${ev.description ? `<div style="display:flex; gap:8px; margin-top:8px;"><strong style="color:var(--muted); min-width:80px;">📝 פרטים:</strong><span>${escHtml(ev.description).replace(/\n/g,'<br>')}</span></div>` : ''}
                    <div style="display:flex; gap:8px; margin-top:8px;"><strong style="color:var(--muted); min-width:80px;">👤 משתתפים:</strong><span>${(ev.attendees||[]).join(', ')}</span></div>
                    <div style="margin-top:14px; padding-top:14px; border-top:1px solid var(--border); font-size:12px;">
                        ${ev.syncedToCalendar ? `✅ <strong style="color:var(--success)">נוסף ל-Google Calendar</strong>${ev.googleLink ? `<br><a href="${ev.googleLink}" target="_blank" style="color:var(--accent)">פתח ביומן Google →</a>` : ''}` : `💾 נשמר לוקאלית בלבד`}
                    </div>
                </div>
            `, [
                { label: 'מחק', class: 'danger', onclick: () => { STATE_AS.events = STATE_AS.events.filter(e => e.id !== id); saveState(); AS.renderSidebar(); closeModal(); toast('האירוע נמחק', 'info'); }},
                { label: 'סגור', onclick: closeModal },
            ]);
        },

        resetDemo() {
            if (!confirm('לאפס את כל הנתונים?')) return;
            localStorage.removeItem(STORAGE_KEY);
            window.STATE_AS = { tasks: [], events: [], calendarConnected: STATE_AS.calendarConnected };
            AS.chatHistory = [];
            AS.renderSidebar();
            location.reload();
        },
    };

    // Init
    document.addEventListener('DOMContentLoaded', () => {
        AS.checkCalendarStatus();
        AS.renderSidebar();
        // Restore chat history? No - start fresh each visit (per user preference)
        document.getElementById('chatInput').focus();
    });
    if (document.readyState !== 'loading') {
        AS.checkCalendarStatus();
        AS.renderSidebar();
        setTimeout(() => { const i = document.getElementById('chatInput'); if (i) i.focus(); }, 100);
    }

    // Auto-resize textarea
    document.addEventListener('input', e => {
        if (e.target.id === 'chatInput') {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
        }
    });

    window.addEventListener('beforeunload', saveState);
})();


