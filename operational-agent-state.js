/**
 * Operational Agent - State + Mock Data + Actions
 * window.STATE_OP: mutable, persisted to localStorage
 * window.OA: namespace of all action handlers
 */

(function() {
    'use strict';
    const STORAGE_KEY = 'oa_state_v1';

    // ============ MOCK DATA (Israeli business) ============
    const MOCK_OP = {
        today: '2026-05-26',
        kpis: {
            tasksToday: { value: 17, trend: -2, prev: 19 },
            overdue: { value: 5, trend: +1, prev: 4 },
            activeClients: { value: 28, trend: +3, prev: 25 },
            riskClients: { value: 4, trend: 0, prev: 4 },
            meetingsToday: { value: 6, trend: +1, prev: 5 },
            openFollowups: { value: 11, trend: -3, prev: 14 },
            missingDocs: { value: 8, trend: +2, prev: 6 },
            stuckProcesses: { value: 3, trend: 0, prev: 3 },
            avgResponseHours: { value: 3.2, trend: -15, prev: 3.8 },
            taskCompletionPct: { value: 78, trend: +4, prev: 75 },
            satisfaction: { value: 4.6, trend: +3, prev: 4.4 },
            teamLoad: { value: 82, trend: +8, prev: 76 },
            agentCreatedTasks: { value: 12, trend: +20, prev: 10 },
            tasksDoneWeek: { value: 47, trend: +12, prev: 42 },
            clientsNoUpdate: { value: 3, trend: -2, prev: 5 },
            meetingsNoSummary: { value: 4, trend: 0, prev: 4 },
            activeOnboarding: { value: 5, trend: +1, prev: 4 },
            stuckOnboarding: { value: 2, trend: 0, prev: 2 },
        },
        team: [
            { name: 'רון', role: 'בעלים', tasks: 8, overdue: 1, load: 75, clients: 28, responseHours: 2.1, completionPct: 92, satisfaction: 4.8 },
            { name: 'אופק', role: 'מנהל תפעול', tasks: 17, overdue: 6, load: 95, clients: 14, responseHours: 4.5, completionPct: 71, satisfaction: 4.4 },
            { name: 'דור', role: 'CSM', tasks: 9, overdue: 0, load: 65, clients: 12, responseHours: 1.8, completionPct: 88, satisfaction: 4.7 },
            { name: 'עמית', role: 'נציג שירות', tasks: 6, overdue: 1, load: 55, clients: 8, responseHours: 2.4, completionPct: 85, satisfaction: 4.5 },
            { name: 'רחל', role: 'מזכירה', tasks: 4, overdue: 0, load: 40, clients: 0, responseHours: 0.8, completionPct: 95, satisfaction: 4.9 },
        ],
        clients: [
            { name: 'אלון משכן בע״מ', business: 'אלון משכן', service: 'ייעוץ אסטרטגי', stage: 'פעיל', startDate: '2026-01-15', csmOwner: 'דור', accountManager: 'רון', status: 'מרוצה', satisfaction: 4.8, openTasks: 2, meetings: 1, payments: 0, missingDocs: 0, lastContact: '2026-05-24', churnRisk: 'נמוך', action: '-' },
            { name: 'דנטל פלוס', business: 'דנטל פלוס מרפאה', service: 'הקמת מערכת', stage: 'באונבורדינג', startDate: '2026-05-01', csmOwner: 'אופק', accountManager: 'רחל', status: 'פעיל', satisfaction: 4.5, openTasks: 5, meetings: 2, payments: 1, missingDocs: 2, lastContact: '2026-05-23', churnRisk: 'נמוך', action: 'השלם אונבורדינג' },
            { name: 'NOA Design', business: 'סטודיו NOA', service: 'ליווי חודשי', stage: 'פעיל', startDate: '2025-09-12', csmOwner: 'דור', accountManager: 'רון', status: 'מרוצה', satisfaction: 4.9, openTasks: 1, meetings: 1, payments: 0, missingDocs: 0, lastContact: '2026-05-22', churnRisk: 'נמוך', action: 'בקש עדות' },
            { name: 'מטבחי דרור', business: 'דרור מטבחים בע״מ', service: 'קמפיין שיווקי', stage: 'דורש טיפול', startDate: '2026-04-20', csmOwner: 'אופק', accountManager: 'אופק', status: 'דורש טיפול', satisfaction: 3.8, openTasks: 4, meetings: 0, payments: 1, missingDocs: 1, lastContact: '2026-05-18', churnRisk: 'בינוני', action: 'תזמן פגישת בדיקה' },
            { name: 'משרד שירה ברק', business: 'עו״ד שירה ברק', service: 'יעוץ דיגיטלי', stage: 'בסיכון', startDate: '2026-02-08', csmOwner: 'דור', accountManager: 'רון', status: 'לא מרוצה', satisfaction: 3.2, openTasks: 3, meetings: 0, payments: 1, missingDocs: 0, lastContact: '2026-05-10', churnRisk: 'גבוה', action: 'שיחת שימור דחוף' },
            { name: 'Cosma Cosmetics', business: 'Cosma', service: 'מערך אוטומציה', stage: 'פעיל', startDate: '2025-12-01', csmOwner: 'אופק', accountManager: 'אופק', status: 'מרוצה', satisfaction: 4.7, openTasks: 2, meetings: 1, payments: 0, missingDocs: 0, lastContact: '2026-05-25', churnRisk: 'נמוך', action: 'הצע אפסייל' },
            { name: 'TechFlow Israel', business: 'TechFlow', service: 'הקמת CRM', stage: 'באונבורדינג', startDate: '2026-05-08', csmOwner: 'אופק', accountManager: 'רון', status: 'פעיל', satisfaction: 4.5, openTasks: 7, meetings: 3, payments: 0, missingDocs: 1, lastContact: '2026-05-24', churnRisk: 'נמוך', action: 'המשך אונבורדינג' },
            { name: 'יעקובי דיגיטל', business: 'יעקובי בע״מ', service: 'ייעוץ אסטרטגי', stage: 'בסיכון', startDate: '2026-03-10', csmOwner: 'אופק', accountManager: 'רון', status: 'דורש טיפול', satisfaction: 3.0, openTasks: 4, meetings: 0, payments: 1, missingDocs: 1, lastContact: '2026-05-10', churnRisk: 'קריטי', action: 'התקשר מיידית' },
            { name: 'אסיא קליניק', business: 'מרכז הריון אסיא', service: 'ניהול קמפיינים', stage: 'פעיל', startDate: '2025-11-20', csmOwner: 'דור', accountManager: 'רון', status: 'מרוצה', satisfaction: 4.8, openTasks: 1, meetings: 1, payments: 0, missingDocs: 0, lastContact: '2026-05-23', churnRisk: 'נמוך', action: '-' },
            { name: 'מודה בוטיק TLV', business: 'מודה בוטיק', service: 'ניהול מדיה', stage: 'פעיל', startDate: '2026-02-14', csmOwner: 'דור', accountManager: 'דור', status: 'פעיל', satisfaction: 4.3, openTasks: 2, meetings: 0, payments: 0, missingDocs: 0, lastContact: '2026-05-20', churnRisk: 'נמוך', action: 'תזמן שיחת CSM' },
        ],
        tasks: [
            { id: 'T-1001', title: 'התקשר ליעקובי דיגיטל - שימור דחוף', type: 'שימור', client: 'יעקובי דיגיטל', assignee: 'רון', dueDate: '2026-05-26', priority: 'קריטית', importance: 'גבוהה', status: 'חדש', source: 'הסוכן', notes: 'הסוכן זיהה סיכון נטישה אחרי 16 ימים ללא קשר' },
            { id: 'T-1002', title: 'פולואפ על הצעת מחיר - מטבחי דרור', type: 'פולואפ', client: 'מטבחי דרור', assignee: 'אופק', dueDate: '2026-05-26', priority: 'גבוהה', importance: 'גבוהה', status: 'בטיפול', source: 'אנושי', notes: 'נשלחה הצעה לפני שבוע' },
            { id: 'T-1003', title: 'השלם תהליך אונבורדינג TechFlow', type: 'אונבורדינג', client: 'TechFlow Israel', assignee: 'רחל', dueDate: '2026-05-28', priority: 'גבוהה', importance: 'גבוהה', status: 'בטיפול', source: 'אוטומציה', notes: 'שלב 3 מתוך 5' },
            { id: 'T-1004', title: 'בקש מסמכים מדנטל פלוס', type: 'בדיקת מסמך', client: 'דנטל פלוס', assignee: 'רחל', dueDate: '2026-05-27', priority: 'בינונית', importance: 'בינונית', status: 'ממתין ללקוח', source: 'אוטומציה', notes: 'הסכם + יפוי כוח' },
            { id: 'T-1005', title: 'הכן סיכום פגישת אסטרטגיה - Cosma', type: 'הכנת דוח', client: 'Cosma Cosmetics', assignee: 'אופק', dueDate: '2026-05-26', priority: 'גבוהה', importance: 'גבוהה', status: 'באיחור', source: 'הסוכן', notes: 'הפגישה הסתיימה אתמול ללא סיכום' },
            { id: 'T-1006', title: 'שלח עדכון שבועי לאלון משכן', type: 'עדכון לקוח', client: 'אלון משכן', assignee: 'דור', dueDate: '2026-05-27', priority: 'בינונית', importance: 'בינונית', status: 'חדש', source: 'אוטומציה', notes: 'תבנית עדכון שבועי' },
            { id: 'T-1007', title: 'בקש עדות מ-NOA Design', type: 'שירות לקוחות', client: 'NOA Design', assignee: 'דור', dueDate: '2026-05-30', priority: 'נמוכה', importance: 'בינונית', status: 'חדש', source: 'הסוכן', notes: 'לקוח מאוד מרוצה - הזדמנות לעדות' },
            { id: 'T-1008', title: 'תזמן שיחת CSM - מודה בוטיק', type: 'שיחת טלפון', client: 'מודה בוטיק TLV', assignee: 'דור', dueDate: '2026-05-29', priority: 'בינונית', importance: 'בינונית', status: 'חדש', source: 'הסוכן', notes: 'תקופת רבעון - שיחה תכליתית' },
            { id: 'T-1009', title: 'בדוק תלונה - משרד שירה ברק', type: 'טיפול בתלונה', client: 'משרד שירה ברק', assignee: 'אופק', dueDate: '2026-05-26', priority: 'קריטית', importance: 'גבוהה', status: 'בטיפול', source: 'אנושי', notes: 'הלקוח לא מרוצה מקצב הטיפול' },
            { id: 'T-1010', title: 'בדוק חיוב כפול Anthropic', type: 'משימה פיננסית', client: '-', assignee: 'רון', dueDate: '2026-05-27', priority: 'גבוהה', importance: 'בינונית', status: 'חדש', source: 'הסוכן', notes: '₪1,711 כפילות' },
            { id: 'T-1011', title: 'הכן דוח שבועי לסוכנות', type: 'הכנת דוח', client: '-', assignee: 'אופק', dueDate: '2026-05-30', priority: 'בינונית', importance: 'גבוהה', status: 'חדש', source: 'אוטומציה', notes: 'דוח שבועי קבוע' },
            { id: 'T-1012', title: 'עדכן SOP אונבורדינג', type: 'משימה פנימית', client: '-', assignee: 'רון', dueDate: '2026-06-02', priority: 'נמוכה', importance: 'בינונית', status: 'חדש', source: 'אנושי', notes: 'יש לעדכן את שלב 3' },
            { id: 'T-1013', title: 'התקשר לאסיא קליניק - פולואפ קמפיין', type: 'פולואפ', client: 'אסיא קליניק', assignee: 'דור', dueDate: '2026-05-27', priority: 'בינונית', importance: 'בינונית', status: 'בטיפול', source: 'אנושי', notes: 'בדיקת תוצאות אחרי שבועיים' },
            { id: 'T-1014', title: 'שלח מסמכי פתיחה למשרד שירה', type: 'העלאת מסמך', client: 'משרד שירה ברק', assignee: 'רחל', dueDate: '2026-05-25', priority: 'בינונית', importance: 'בינונית', status: 'באיחור', source: 'אוטומציה', notes: 'מסמכים סטנדרטיים' },
            { id: 'T-1015', title: 'בדוק קמפיין פייסבוק - מטבחי דרור', type: 'בדיקת קמפיין', client: 'מטבחי דרור', assignee: 'אופק', dueDate: '2026-05-29', priority: 'בינונית', importance: 'גבוהה', status: 'חדש', source: 'הסוכן', notes: 'ROI נמוך - דורש בדיקה' },
            { id: 'T-1016', title: 'סגור עסקה - דנטל פלוס (שלב הבא)', type: 'משימת מכירות', client: 'דנטל פלוס', assignee: 'רון', dueDate: '2026-06-03', priority: 'בינונית', importance: 'גבוהה', status: 'חדש', source: 'אנושי', notes: 'הצעה הוגשה, ממתין לאישור' },
            { id: 'T-1017', title: 'הכן הצעת אפסייל ל-NOA', type: 'משימת מכירות', client: 'NOA Design', assignee: 'דור', dueDate: '2026-06-05', priority: 'נמוכה', importance: 'בינונית', status: 'חדש', source: 'הסוכן', notes: 'לקוח מתאים להרחבה' },
        ],
        meetings: [
            { id: 'M-201', title: 'שיחת CSM - אלון משכן', date: '2026-05-26', time: '10:00', duration: 30, client: 'אלון משכן', owner: 'דור', type: 'פגישת CSM', status: 'מתוכנן', link: 'https://zoom.us/...', location: 'Zoom', goal: 'בדיקת מצב, איסוף פידבק', summary: null, tasks: [] },
            { id: 'M-202', title: 'פגישת אסטרטגיה - Cosma', date: '2026-05-26', time: '11:30', duration: 60, client: 'Cosma Cosmetics', owner: 'אופק', type: 'פגישת אסטרטגיה', status: 'מתוכנן', link: 'https://meet.google.com/...', location: 'Google Meet', goal: 'תכנון Q3', summary: null, tasks: [] },
            { id: 'M-203', title: 'אונבורדינג - דנטל פלוס שלב 2', date: '2026-05-26', time: '14:00', duration: 45, client: 'דנטל פלוס', owner: 'רחל', type: 'פגישת אונבורדינג', status: 'מתוכנן', link: 'https://zoom.us/...', location: 'Zoom', goal: 'הכרת המערכת', summary: null, tasks: [] },
            { id: 'M-204', title: 'פגישת שירות - יעקובי', date: '2026-05-26', time: '15:30', duration: 30, client: 'יעקובי דיגיטל', owner: 'רון', type: 'פגישת שירות', status: 'מתוכנן', link: 'https://zoom.us/...', location: 'Zoom', goal: 'שיחת שימור', summary: null, tasks: [] },
            { id: 'M-205', title: 'פגישת צוות שבועית', date: '2026-05-26', time: '17:00', duration: 60, client: '-', owner: 'רון', type: 'פגישת צוות', status: 'מתוכנן', link: 'משרד', location: 'משרד', goal: 'סינכרון שבועי', summary: null, tasks: [] },
            { id: 'M-206', title: 'אונבורדינג TechFlow שלב 3', date: '2026-05-27', time: '10:00', duration: 90, client: 'TechFlow Israel', owner: 'רחל', type: 'פגישת אונבורדינג', status: 'מתוכנן', link: 'https://zoom.us/...', location: 'Zoom', goal: 'הקמת CRM', summary: null, tasks: [] },
            { id: 'M-207', title: 'פגישה ראשונה - לקוח חדש פוטנציאלי', date: '2026-05-28', time: '11:00', duration: 30, client: '-', owner: 'רון', type: 'פגישת מכירה', status: 'מתוכנן', link: 'https://zoom.us/...', location: 'Zoom', goal: 'הצגת שירותים', summary: null, tasks: [] },
            { id: 'M-208', title: 'סגירת פרויקט - אלון משכן Q1', date: '2026-05-25', time: '14:00', duration: 60, client: 'אלון משכן', owner: 'רון', type: 'פגישת לקוח', status: 'בוצעה', link: '-', location: 'משרד', goal: 'סיכום רבעון', summary: 'התקיים סיכום מוצלח. הלקוח מרוצה מאוד מהתוצאות.', tasks: ['T-1006'] },
            { id: 'M-209', title: 'אונבורדינג Cosma - שלב סיום', date: '2026-05-24', time: '16:00', duration: 45, client: 'Cosma Cosmetics', owner: 'אופק', type: 'פגישת אונבורדינג', status: 'בוצעה (חסר סיכום)', link: '-', location: 'Zoom', goal: 'מעבר לפעולה רגילה', summary: null, tasks: [] },
            { id: 'M-210', title: 'פגישת שירות - משרד שירה', date: '2026-05-23', time: '13:00', duration: 30, client: 'משרד שירה ברק', owner: 'אופק', type: 'פגישת שירות', status: 'לא התקיימה', link: '-', location: 'Zoom', goal: 'טיפול בתלונה', summary: 'הלקוח לא הצטרף', tasks: [] },
        ],
        serviceTickets: [
            { id: 'S-301', client: 'יעקובי דיגיטל', type: 'תלונה', channel: 'מייל', desc: 'לא קיבלתי עדכון על מצב הפרויקט כבר שבוע', priority: 'גבוהה', status: 'פתוח', owner: 'אופק', opened: '2026-05-20', firstResponse: null, closed: null, suggestedReply: 'אני מתנצל על הקושי לתקשר. הנה עדכון מסודר: [פירוט]' },
            { id: 'S-302', client: 'משרד שירה ברק', type: 'בעיה', channel: 'וואטסאפ', desc: 'יש בעיה טכנית במערכת - לא מצליחה להעלות קבצים', priority: 'דחופה', status: 'בטיפול', owner: 'אופק', opened: '2026-05-22', firstResponse: '2026-05-22 14:30', closed: null, suggestedReply: 'יורד אליך מנהל IT תוך שעה לבדיקה.' },
            { id: 'S-303', client: 'מטבחי דרור', type: 'בקשת עדכון', channel: 'טלפון', desc: 'רוצים לדעת מתי ייתחיל קמפיין הקיץ', priority: 'בינונית', status: 'פתוח', owner: 'אופק', opened: '2026-05-21', firstResponse: null, closed: null, suggestedReply: 'אנחנו מתחילים את הקמפיין ב-1 ביוני. אשלח לך תוכנית מסודרת היום.' },
            { id: 'S-304', client: 'TechFlow Israel', type: 'שאלה כללית', channel: 'מייל', desc: 'איך אפשר לייצא נתונים מהמערכת?', priority: 'נמוכה', status: 'הושלם', owner: 'רחל', opened: '2026-05-19', firstResponse: '2026-05-19 09:15', closed: '2026-05-19 09:45', suggestedReply: '-' },
            { id: 'S-305', client: 'אסיא קליניק', type: 'בקשת שינוי', channel: 'וואטסאפ', desc: 'אפשר לשנות את המודעות לפיילט חדש?', priority: 'בינונית', status: 'בטיפול', owner: 'דור', opened: '2026-05-23', firstResponse: '2026-05-23 11:00', closed: null, suggestedReply: 'מאשר, אכין ואשלח לאישור עד מחר.' },
            { id: 'S-306', client: 'דנטל פלוס', type: 'בקשת מסמך', channel: 'מייל', desc: 'איפה אפשר לקבל את ההסכם המעודכן?', priority: 'נמוכה', status: 'פתוח', owner: 'רחל', opened: '2026-05-24', firstResponse: null, closed: null, suggestedReply: 'שולחת לך עכשיו. הקובץ ב-Drive המשותף שלנו.' },
        ],
        onboarding: [
            { client: 'דנטל פלוס', start: '2026-05-01', stage: 'שלב 2/5 - חתימת הסכמים', progress: 40, owner: 'רחל', deadline: '2026-06-01', status: 'פעיל', blockers: ['חסר הסכם חתום'], action: 'בקש מסמך חוזר' },
            { client: 'TechFlow Israel', start: '2026-05-08', stage: 'שלב 3/5 - הקמת מערכת', progress: 60, owner: 'רחל', deadline: '2026-06-08', status: 'פעיל', blockers: [], action: '-' },
            { client: 'לקוח חדש A', start: '2026-05-22', stage: 'שלב 1/5 - קליטה', progress: 20, owner: 'רחל', deadline: '2026-06-22', status: 'פעיל', blockers: ['ממתין למענה ראשוני'], action: 'התקשר' },
            { client: 'לקוח חדש B', start: '2026-05-15', stage: 'שלב 1/5 - קליטה', progress: 15, owner: 'אופק', deadline: '2026-06-15', status: 'תקוע', blockers: ['לא קיבלנו פרטים', 'לא נקבעה פגישת היכרות'], action: 'תזכורת + פנייה אישית' },
            { client: 'לקוח חדש C', start: '2026-05-18', stage: 'שלב 2/5 - איסוף מידע', progress: 35, owner: 'רחל', deadline: '2026-06-18', status: 'תקוע', blockers: ['חסרים 3 מסמכים'], action: 'שלח רשימת מסמכים מסודרת' },
        ],
        automations: [
            { id: 'A-501', name: 'לקוח חדש → אונבורדינג', trigger: 'עסקה נסגרה', condition: 'סטטוס=סגור', action: 'יצירת תהליך אונבורדינג + 5 משימות', status: 'פעיל', dept: 'מכירות→תפעול', biz: 'כל סוגי עסק', frequency: 'בכל אירוע', owner: 'רון', requiresApproval: false },
            { id: 'A-502', name: 'משימה באיחור → התראה', trigger: 'משימה > 24 שעות מהדדליין', condition: 'סטטוס≠הושלם', action: 'התראה לאחראי + מנהל', status: 'פעיל', dept: 'תפעול', biz: 'כל סוגי עסק', frequency: 'יומי', owner: 'אופק', requiresApproval: false },
            { id: 'A-503', name: 'לקוח לא קיבל עדכון 7 ימים', trigger: 'אין תקשורת 7 ימים', condition: 'סטטוס=פעיל', action: 'יצירת משימת CSM + דרפט הודעה', status: 'פעיל', dept: 'CSM', biz: 'שירות, ליווי', frequency: 'יומי', owner: 'דור', requiresApproval: true },
            { id: 'A-504', name: 'פגישה הסתיימה → בקש סיכום', trigger: '15 דקות אחרי פגישה', condition: 'אין סיכום', action: 'התראה לבעל הפגישה', status: 'פעיל', dept: 'תפעול', biz: 'כל סוגי עסק', frequency: 'בכל אירוע', owner: 'רחל', requiresApproval: false },
            { id: 'A-505', name: 'חשבונית פתוחה > 7 ימים', trigger: 'חוב פתוח 7 ימים', condition: '-', action: 'משימת גבייה + דרפט הודעה ללקוח', status: 'פעיל', dept: 'כספים', biz: 'כל סוגי עסק', frequency: 'יומי', owner: 'רון', requiresApproval: true },
            { id: 'A-506', name: 'לקוח בסיכון → פתח שימור', trigger: 'churn_risk=גבוה', condition: 'אין משימת שימור פתוחה', action: 'משימה ל-CSM + תזמון פגישה', status: 'פעיל', dept: 'CSM', biz: 'שירות, ליווי', frequency: 'יומי', owner: 'דור', requiresApproval: false },
            { id: 'A-507', name: 'לקוח מרוצה → בקש עדות', trigger: 'satisfaction>4.8 + 90 יום פעילות', condition: 'אין עדות עדיין', action: 'משימה + דרפט בקשה', status: 'כבוי', dept: 'שיווק', biz: 'כל סוגי עסק', frequency: 'שבועי', owner: 'דור', requiresApproval: true },
            { id: 'A-508', name: 'מסמך חסר → תזכורת ללקוח', trigger: '3 ימים ללא העלאה', condition: 'מסמך מסומן כחובה', action: 'דרפט תזכורת + משימה', status: 'פעיל', dept: 'תפעול', biz: 'כל סוגי עסק', frequency: 'יומי', owner: 'רחל', requiresApproval: true },
        ],
        processes: [
            { name: 'תהליך אונבורדינג סטנדרטי', dept: 'תפעול', biz: 'שירות, ליווי', stages: 5, activeRuns: 5, stuck: 2, avgDays: 14, target: 12 },
            { name: 'תהליך טיפול בליד', dept: 'מכירות', biz: 'כל סוגי עסק', stages: 4, activeRuns: 12, stuck: 1, avgDays: 7, target: 5 },
            { name: 'תהליך שימור לקוח', dept: 'CSM', biz: 'שירות, ליווי', stages: 3, activeRuns: 4, stuck: 0, avgDays: 5, target: 7 },
            { name: 'תהליך טיפול בתלונה', dept: 'שירות', biz: 'כל סוגי עסק', stages: 4, activeRuns: 3, stuck: 1, avgDays: 3, target: 2 },
            { name: 'תהליך אישור מסמכים', dept: 'תפעול', biz: 'משפטי, רו״ח', stages: 3, activeRuns: 8, stuck: 0, avgDays: 2, target: 3 },
            { name: 'תהליך גבייה', dept: 'כספים', biz: 'כל סוגי עסק', stages: 4, activeRuns: 6, stuck: 1, avgDays: 14, target: 10 },
            { name: 'תהליך סגירת לקוח', dept: 'CSM', biz: 'שירות, ליווי', stages: 3, activeRuns: 1, stuck: 0, avgDays: 4, target: 5 },
        ],
        documents: [
            { client: 'דנטל פלוס', name: 'הסכם שירות חתום', required: true, uploaded: false, daysWaiting: 12 },
            { client: 'דנטל פלוס', name: 'יפוי כוח', required: true, uploaded: false, daysWaiting: 5 },
            { client: 'TechFlow Israel', name: 'תרשים מערכת קיימת', required: true, uploaded: false, daysWaiting: 3 },
            { client: 'לקוח חדש C', name: 'פרטי חברה', required: true, uploaded: false, daysWaiting: 8 },
            { client: 'לקוח חדש C', name: 'תעודת התאגדות', required: true, uploaded: false, daysWaiting: 8 },
            { client: 'לקוח חדש C', name: 'הסכם שירות', required: true, uploaded: false, daysWaiting: 8 },
            { client: 'NOA Design', name: 'בריף עיצוב Q3', required: false, uploaded: false, daysWaiting: 2 },
            { client: 'מטבחי דרור', name: 'תמונות לפני/אחרי', required: false, uploaded: false, daysWaiting: 6 },
        ],
        risks: [
            { client: 'יעקובי דיגיטל', level: 'קריטי', reasons: ['לא קיבל עדכון 16 ימים', 'תלונה לא טופלה', 'תשלום פתוח'], action: 'שיחה אישית דחופה היום' },
            { client: 'משרד שירה ברק', level: 'גבוה', reasons: ['שביעות רצון 3.2', 'פגישה לא התקיימה', 'בעיה טכנית פתוחה'], action: 'פגישת שימור עם רון' },
            { client: 'מטבחי דרור', level: 'בינוני', reasons: ['רווחיות נמוכה', 'אין פגישה קרובה', 'בקשה לא נענתה'], action: 'תזמן פגישה השבוע' },
            { client: 'לקוח חדש B', level: 'בינוני', reasons: ['אונבורדינג תקוע', 'אין תקשורת', 'חסרים מסמכים'], action: 'פנייה אישית מרון' },
        ],
        reminders: [
            { for: 'רון', text: 'התקשר לאבא של אלון משכן ביום הולדת', when: '2026-05-28 10:00', priority: 'בינונית', recurring: false },
            { for: 'אופק', text: 'בדוק עם נציג המכירות אם הצעה לדנטל אושרה', when: '2026-05-27 09:00', priority: 'גבוהה', recurring: false },
            { for: 'דור', text: 'שיחת CSM שבועית עם NOA', when: '2026-05-28 14:00', priority: 'בינונית', recurring: true },
            { for: 'רחל', text: 'תזכורת לסנן את מיילי הבוקר ולסווג', when: '2026-05-27 08:30', priority: 'נמוכה', recurring: true },
            { for: 'רון', text: 'הכן רשימת עדכונים לקראת פגישת צוות', when: '2026-05-26 16:30', priority: 'גבוהה', recurring: true },
        ],
        alerts: [
            { type: 'לקוח בסיכון', severity: 'critical', title: 'יעקובי דיגיטל - 16 ימים ללא קשר', desc: 'לקוח לא קיבל עדכון, יש תלונה פתוחה, ויש תשלום פתוח. סיכון נטישה גבוה.', client: 'יעקובי דיגיטל', date: '2026-05-25' },
            { type: 'אונבורדינג תקוע', severity: 'high', title: 'לקוח חדש B - תקוע 11 ימים', desc: 'לא קיבלנו פרטים בסיסיים. סיכון שהלקוח יתחרט.', client: 'לקוח חדש B', date: '2026-05-25' },
            { type: 'פגישה ללא סיכום', severity: 'medium', title: '4 פגישות מהשבוע ללא סיכום', desc: 'אין משימות המשך מהפגישות → סיכון לעיכובים תפעוליים', client: '-', date: '2026-05-25' },
            { type: 'עומס צוות', severity: 'high', title: 'אופק עמוס ב-17 משימות (6 באיחור)', desc: 'עמית פנוי יותר היום, מומלץ להעביר 2 משימות שירות אליו.', client: '-', date: '2026-05-26' },
            { type: 'מסמכים חסרים', severity: 'medium', title: '8 מסמכים חסרים מלקוחות חדשים', desc: 'בלי המסמכים האלה תהליכי האונבורדינג תקועים.', client: '-', date: '2026-05-24' },
        ],
        reports: [
            { name: 'דוח יומי - 26 במאי', desc: 'מה בוצע, מה לא, ומה צריך טיפול דחוף', lastGen: '2026-05-26', status: 'מעודכן' },
            { name: 'דוח שבועי - שבוע 21', desc: 'סיכום שבועי של תפעול, לקוחות וצוות', lastGen: '2026-05-25', status: 'מעודכן' },
            { name: 'דוח לקוחות בסיכון', desc: '4 לקוחות שדורשים פעולה', lastGen: '2026-05-26', status: 'מעודכן' },
            { name: 'דוח שירות לקוחות', desc: 'זמני תגובה, סיווג פניות', lastGen: '2026-05-25', status: 'מעודכן' },
            { name: 'דוח CSM', desc: 'מצב health של כל לקוח פעיל', lastGen: '2026-05-25', status: 'מעודכן' },
            { name: 'דוח אונבורדינג', desc: 'התקדמות תהליכי קליטה', lastGen: '2026-05-24', status: 'מעודכן' },
            { name: 'דוח עומסים', desc: 'עומס לפי איש צוות', lastGen: '2026-05-26', status: 'מעודכן' },
            { name: 'דוח תהליכים תקועים', desc: 'איפה דברים נעצרים', lastGen: '2026-05-25', status: 'מעודכן' },
            { name: 'דוח אוטומציות', desc: 'מה אוטומטית רץ, מה צריך אישור', lastGen: '2026-05-25', status: 'מעודכן' },
            { name: 'דוח מסמכים חסרים', desc: '8 מסמכים פתוחים', lastGen: '2026-05-26', status: 'מעודכן' },
        ],
        integrations: [
            { name: 'Google Calendar', icon: '📅', cat: 'יומן', status: 'מתוכנן', purpose: 'סנכרון פגישות', dataTypes: 'פגישות, אירועים', permissions: 'קריאה+כתיבה', risk: '-' },
            { name: 'Outlook Calendar', icon: '📅', cat: 'יומן', status: 'מתוכנן', purpose: 'סנכרון פגישות (Microsoft)', dataTypes: 'פגישות', permissions: 'קריאה+כתיבה', risk: '-' },
            { name: 'WhatsApp Business', icon: '💬', cat: 'תקשורת', status: 'מתוכנן', purpose: 'שיחות עם לקוחות', dataTypes: 'הודעות, אנשי קשר', permissions: 'שליחה+קבלה', risk: 'שליחה אוטו׳ דורש אישור' },
            { name: 'Gmail', icon: '📧', cat: 'תקשורת', status: 'מתוכנן', purpose: 'ניהול מיילים', dataTypes: 'מיילים, איש קשר', permissions: 'קריאה+כתיבה', risk: 'שליחה אוטו׳ דורש אישור' },
            { name: 'Outlook Mail', icon: '📧', cat: 'תקשורת', status: 'מוכן לחיבור', purpose: 'מיילים (Microsoft)', dataTypes: 'מיילים', permissions: 'קריאה+כתיבה', risk: '-' },
            { name: 'CRM (Hubspot/Pipedrive/Salesforce)', icon: '📊', cat: 'CRM', status: 'מתוכנן', purpose: 'לידים, עסקאות, פעילות', dataTypes: 'לקוחות, עסקאות, פעילות', permissions: 'קריאה+כתיבה', risk: '-' },
            { name: 'מערכת חשבוניות (iCount/Greenvest)', icon: '🧾', cat: 'כספים', status: 'מתוכנן', purpose: 'חשבוניות, גבייה', dataTypes: 'חשבוניות, תשלומים', permissions: 'קריאה+יצירה', risk: '-' },
            { name: 'Zoom / Google Meet', icon: '🎥', cat: 'פגישות', status: 'מתוכנן', purpose: 'קישורי פגישות', dataTypes: 'קישורי פגישה', permissions: 'יצירה', risk: '-' },
            { name: 'Call Recording / Transcription', icon: '🎙️', cat: 'פגישות', status: 'מתוכנן', purpose: 'סיכומי פגישות אוטומטיים', dataTypes: 'הקלטות, תמלולים', permissions: 'קריאה', risk: 'דורש אישור פרטיות' },
            { name: 'Document Storage (Drive/Dropbox)', icon: '📁', cat: 'מסמכים', status: 'מחובר בעתיד', purpose: 'אחסון ושיתוף מסמכים', dataTypes: 'קבצים', permissions: 'קריאה+כתיבה', risk: '-' },
            { name: 'מערכת תשלומים (Tranzilla/PayPlus)', icon: '💳', cat: 'כספים', status: 'מתוכנן', purpose: 'סליקה ותשלומים', dataTypes: 'תנועות', permissions: 'קריאה', risk: '-' },
            { name: 'Instagram / Facebook DM', icon: '📱', cat: 'תקשורת', status: 'לא מחובר', purpose: 'פניות דרך רשתות חברתיות', dataTypes: 'הודעות', permissions: 'קריאה+שליחה', risk: 'דורש אישור Meta' },
        ],
        businessTypes: [
            { id: 'service', name: 'עסק שירות', icon: '🛎️', focus: 'לקוחות פעילים, פגישות, משימות, שביעות רצון, שימור, CSM', kpis: ['שביעות רצון', 'שימור', 'CSM health'], processes: ['אונבורדינג', 'שימור', 'CSM'] },
            { id: 'project', name: 'עסק פרויקטלי', icon: '🏗️', focus: 'שלבי פרויקט, דדליין, מסמכים, אישורים, חריגות', kpis: ['התקדמות פרויקט', 'דדליין', 'חריגות'], processes: ['פתיחת פרויקט', 'אבני דרך', 'מסירה'] },
            { id: 'sales', name: 'עסק עם מוקד מכירות', icon: '📞', focus: 'פולואפים, תיאומי פגישות, מעקב לידים, העברה למכירות→תפעול', kpis: ['CR', 'CAC', 'זמן סגירה'], processes: ['לידים', 'מכירות', 'העברה'] },
            { id: 'clinic', name: 'קליניקה / מרפאה', icon: '🏥', focus: 'תורים, תזכורות, מעקב מטופלים, פניות חוזרות', kpis: ['תורים שבוצעו', 'no-show', 'שביעות רצון'], processes: ['קבלת תור', 'מעקב', 'מסמכים רפואיים'] },
            { id: 'course', name: 'עסק קורסים', icon: '🎓', focus: 'תלמידים, גישה לתכנים, שאלות, שימור, קהילה, התקדמות', kpis: ['השלמת קורס', 'שביעות רצון', 'קהילה פעילה'], processes: ['רישום', 'אונבורדינג ללומד', 'מסיימים'] },
            { id: 'design', name: 'מטבחים / נגרות / עיצוב פנים', icon: '🪑', focus: 'פרויקטים, מדידות, הצעות מחיר, אישורי לקוח, התקנה, ספקים, תוכניות', kpis: ['התקדמות פרויקט', 'אישורי לקוח', 'מועד אספקה'], processes: ['מדידה', 'הצעה', 'אישור', 'ייצור', 'התקנה'] },
            { id: 'law', name: 'משרד עורכי דין', icon: '⚖️', focus: 'תיקים, מסמכים, דדליין, פגישות, סטטוס טיפול, תזכורות', kpis: ['תיקים פעילים', 'דדליין', 'זמן טיפול'], processes: ['פתיחת תיק', 'מסמכים', 'דיון', 'סגירה'] },
            { id: 'accounting', name: 'משרד רואה חשבון', icon: '🧮', focus: 'דיווחים, מסמכי לקוחות, דדליין מע״מ, פגישות, שירות לקוחות', kpis: ['דיווחים בזמן', 'מסמכים', 'לקוחות פעילים'], processes: ['קליטת לקוח', 'דיווח חודשי', 'דוח שנתי'] },
            { id: 'agency', name: 'סוכנות שיווק', icon: '📣', focus: 'קמפיינים, ROI, לקוחות פעילים, פולואפים, CSM', kpis: ['ROAS', 'CTR', 'שביעות רצון'], processes: ['קליטת לקוח', 'תכנון קמפיין', 'אופטימיזציה'] },
            { id: 'consulting', name: 'יועץ עסקי', icon: '💼', focus: 'פגישות, ליווי לטווח ארוך, תכנון אסטרטגי, מעקב יעדים', kpis: ['פגישות חודשיות', 'התקדמות יעדים', 'שביעות רצון'], processes: ['פגישת היכרות', 'בניית תוכנית', 'ביצוע', 'מדידה'] },
            { id: 'b2b', name: 'חברת B2B', icon: '🏢', focus: 'עסקאות גדולות, צוות מכירות, פגישות מרובות, החלטות מורכבות', kpis: ['Pipeline', 'Win rate', 'Deal size'], processes: ['ליד', 'הצעה', 'משא ומתן', 'חתימה'] },
            { id: 'family', name: 'עסק משפחתי', icon: '👨‍👩‍👧', focus: 'הפרדה אישי/עסקי, ניהול צוות משפחתי, פוקוס על מה שחשוב', kpis: ['רווחיות', 'איזון', 'תיעדוף'], processes: ['קבלת החלטות', 'ניהול קונפליקטים', 'תכנון'] },
        ],
    };

    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const p = JSON.parse(saved);
                if (p && p.kpis) return p;
            }
        } catch (e) {}
        return JSON.parse(JSON.stringify(MOCK_OP));
    }
    function saveState() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE_OP)); } catch (e) {}
    }
    window.STATE_OP = loadState();
    window.MOCK_OP = MOCK_OP;

    function rerender() {
        const activeBtn = document.querySelector('.nav-tab.active');
        if (!activeBtn) return;
        const tabName = activeBtn.dataset.tab;
        const renderer = TABS_OP[tabName];
        if (renderer) {
            document.getElementById('content').innerHTML = renderer();
            if (TABS_OP[tabName + '_after']) TABS_OP[tabName + '_after']();
        }
        saveState();
    }
    window.rerender_op = rerender;

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
        setTimeout(() => {
            const f = document.querySelector('#modalBody input, #modalBody select, #modalBody textarea');
            if (f) f.focus();
        }, 50);
    }
    function closeModal() {
        document.getElementById('modalOverlay').classList.remove('visible');
    }
    document.addEventListener('click', (e) => { if (e.target.id === 'modalOverlay') closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    function confirmModal(title, message, onConfirm, confirmLabel = 'אישור', danger = false) {
        openModal(title, `<p style="font-size:14px; line-height:1.6;">${message}</p>`, [
            { label: 'ביטול', onclick: closeModal },
            { label: confirmLabel, class: danger ? 'danger' : 'primary', onclick: () => { closeModal(); onConfirm(); } },
        ]);
    }

    function detailsModal(title, fields) {
        const html = fields.map(f => `<div class="detail-row"><div class="detail-label">${f.label}</div><div class="detail-value">${f.value}</div></div>`).join('');
        openModal(title, html, [{ label: 'סגור', onclick: closeModal }]);
    }

    function todayISO() { return new Date().toISOString().slice(0, 10); }
    function genId(prefix) { return prefix + '-' + Date.now().toString(36).slice(-6); }

    // ============ window.OA ============
    window.OA = {
        openModal, closeModal, toast, confirmModal, detailsModal,

        // ============ QUICK ADD ============
        quickAdd() {
            openModal('פעולה מהירה', `
                <p style="font-size:13px; color:var(--text-soft); margin-bottom:16px;">מה תרצה ליצור?</p>
                <div class="grid grid-cols-2" style="gap:10px;">
                    <button class="btn primary" style="padding:14px;" onclick="OA.closeModal(); OA.addTask();">✅ משימה</button>
                    <button class="btn" style="padding:14px;" onclick="OA.closeModal(); OA.addMeeting();">📅 פגישה</button>
                    <button class="btn" style="padding:14px;" onclick="OA.closeModal(); OA.addReminder();">🔔 תזכורת</button>
                    <button class="btn" style="padding:14px;" onclick="OA.closeModal(); OA.addClient();">👤 לקוח</button>
                </div>
            `, []);
        },

        // ============ TASKS ============
        addTask() {
            openModal('משימה חדשה', `
                <div class="form-group"><label>כותרת</label><input id="t_title" type="text" placeholder="מה צריך לעשות?"></div>
                <div class="form-row">
                    <div class="form-group"><label>סוג</label><select id="t_type">
                        ${['שיחת טלפון','פולואפ','גבייה','שירות לקוחות','אונבורדינג','העלאת מסמך','בדיקת מסמך','עדכון לקוח','משימה פנימית','משימה פיננסית','משימת מכירות','משימה טכנית','הכנת דוח','בדיקת קמפיין','בדיקת לקוח בסיכון','שימור לקוח','תיאום פגישה','סגירת טיפול'].map(t => `<option>${t}</option>`).join('')}
                    </select></div>
                    <div class="form-group"><label>לקוח (אופציונלי)</label><select id="t_client"><option value="">-</option>${STATE_OP.clients.map(c => `<option>${c.name}</option>`).join('')}</select></div>
                </div>
                <div class="form-row cols-3">
                    <div class="form-group"><label>אחראי</label><select id="t_assignee">${STATE_OP.team.map(m => `<option>${m.name}</option>`).join('')}</select></div>
                    <div class="form-group"><label>דדליין</label><input id="t_due" type="date" value="${todayISO()}"></div>
                    <div class="form-group"><label>דחיפות</label><select id="t_priority"><option>קריטית</option><option>גבוהה</option><option selected>בינונית</option><option>נמוכה</option></select></div>
                </div>
                <div class="form-group"><label>הערות</label><textarea id="t_notes" rows="2"></textarea></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'צור משימה', class: 'primary', onclick: () => {
                    const title = document.getElementById('t_title').value.trim();
                    if (!title) { toast('כותרת חייבת', 'error'); return; }
                    STATE_OP.tasks.unshift({
                        id: genId('T'),
                        title,
                        type: document.getElementById('t_type').value,
                        client: document.getElementById('t_client').value || '-',
                        assignee: document.getElementById('t_assignee').value,
                        dueDate: document.getElementById('t_due').value,
                        priority: document.getElementById('t_priority').value,
                        importance: 'בינונית',
                        status: 'חדש',
                        source: 'אנושי',
                        notes: document.getElementById('t_notes').value || '-',
                    });
                    closeModal(); rerender();
                    toast(`משימה "${title}" נוצרה`, 'success');
                }},
            ]);
        },
        viewTask(id) {
            const t = STATE_OP.tasks.find(x => x.id === id);
            if (!t) return;
            detailsModal(`משימה ${t.id}`, [
                { label: 'כותרת', value: t.title },
                { label: 'סוג', value: t.type },
                { label: 'לקוח', value: t.client },
                { label: 'אחראי', value: t.assignee },
                { label: 'דדליין', value: t.dueDate },
                { label: 'דחיפות', value: t.priority },
                { label: 'סטטוס', value: t.status },
                { label: 'מקור', value: t.source },
                { label: 'הערות', value: t.notes },
            ]);
        },
        completeTask(id) {
            const t = STATE_OP.tasks.find(x => x.id === id);
            if (!t) return;
            t.status = 'הושלם';
            rerender();
            toast(`משימה "${t.title}" הושלמה`, 'success');
        },
        editTask(id) {
            const t = STATE_OP.tasks.find(x => x.id === id);
            if (!t) return;
            openModal(`עריכת משימה ${t.id}`, `
                <div class="form-group"><label>כותרת</label><input id="e_title" type="text" value="${t.title}"></div>
                <div class="form-row cols-3">
                    <div class="form-group"><label>אחראי</label><select id="e_assignee">${STATE_OP.team.map(m => `<option ${m.name===t.assignee?'selected':''}>${m.name}</option>`).join('')}</select></div>
                    <div class="form-group"><label>דחיפות</label><select id="e_priority">${['קריטית','גבוהה','בינונית','נמוכה'].map(p => `<option ${p===t.priority?'selected':''}>${p}</option>`).join('')}</select></div>
                    <div class="form-group"><label>סטטוס</label><select id="e_status">${['חדש','פתוח','בטיפול','ממתין ללקוח','ממתין לצוות','ממתין לאישור','באיחור','הושלם','נדחה','בוטל'].map(s => `<option ${s===t.status?'selected':''}>${s}</option>`).join('')}</select></div>
                </div>
                <div class="form-group"><label>דדליין</label><input id="e_due" type="date" value="${t.dueDate}"></div>
                <div class="form-group"><label>הערות</label><textarea id="e_notes" rows="2">${t.notes}</textarea></div>
            `, [
                { label: 'מחק', class: 'danger', onclick: () => { STATE_OP.tasks = STATE_OP.tasks.filter(x => x.id !== id); closeModal(); rerender(); toast('משימה נמחקה', 'info'); } },
                { label: 'ביטול', onclick: closeModal },
                { label: 'שמור', class: 'primary', onclick: () => {
                    t.title = document.getElementById('e_title').value;
                    t.assignee = document.getElementById('e_assignee').value;
                    t.priority = document.getElementById('e_priority').value;
                    t.status = document.getElementById('e_status').value;
                    t.dueDate = document.getElementById('e_due').value;
                    t.notes = document.getElementById('e_notes').value;
                    closeModal(); rerender();
                    toast('משימה עודכנה', 'success');
                }},
            ]);
        },
        changeTaskStatus(id, newStatus) {
            const t = STATE_OP.tasks.find(x => x.id === id);
            if (!t) return;
            t.status = newStatus;
            rerender();
            toast(`סטטוס: ${newStatus}`, 'info');
        },
        reassignTask(id) {
            const t = STATE_OP.tasks.find(x => x.id === id);
            if (!t) return;
            openModal('העבר לעובד אחר', `
                <div class="form-group"><label>בחר עובד</label><select id="ra_to">${STATE_OP.team.map(m => `<option ${m.name===t.assignee?'selected':''}>${m.name}</option>`).join('')}</select></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'העבר', class: 'primary', onclick: () => {
                    const newOwner = document.getElementById('ra_to').value;
                    t.assignee = newOwner;
                    closeModal(); rerender();
                    toast(`המשימה הועברה ל-${newOwner}`, 'success');
                }},
            ]);
        },

        // ============ MEETINGS ============
        addMeeting() {
            openModal('פגישה חדשה', `
                <div class="form-group"><label>שם פגישה</label><input id="me_title" type="text"></div>
                <div class="form-row cols-3">
                    <div class="form-group"><label>תאריך</label><input id="me_date" type="date" value="${todayISO()}"></div>
                    <div class="form-group"><label>שעה</label><input id="me_time" type="time" value="10:00"></div>
                    <div class="form-group"><label>משך (דק׳)</label><input id="me_dur" type="number" value="30"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>סוג</label><select id="me_type">${['פגישת מכירה','פגישת לקוח','פגישת אונבורדינג','פגישת שירות','פגישת CSM','פגישת צוות','פגישת אסטרטגיה','פגישת כספים','פגישת תפעול','פגישת ספקים','פגישת פרויקט'].map(t => `<option>${t}</option>`).join('')}</select></div>
                    <div class="form-group"><label>לקוח</label><select id="me_client"><option value="">-</option>${STATE_OP.clients.map(c => `<option>${c.name}</option>`).join('')}</select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>אחראי</label><select id="me_owner">${STATE_OP.team.map(m => `<option>${m.name}</option>`).join('')}</select></div>
                    <div class="form-group"><label>מיקום</label><select id="me_loc"><option>Zoom</option><option>Google Meet</option><option>משרד</option><option>אצל הלקוח</option><option>טלפון</option></select></div>
                </div>
                <div class="form-group"><label>מטרת הפגישה</label><textarea id="me_goal" rows="2"></textarea></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'צור פגישה', class: 'primary', onclick: () => {
                    const title = document.getElementById('me_title').value.trim();
                    if (!title) { toast('שם פגישה חייב', 'error'); return; }
                    STATE_OP.meetings.unshift({
                        id: genId('M'),
                        title,
                        date: document.getElementById('me_date').value,
                        time: document.getElementById('me_time').value,
                        duration: +document.getElementById('me_dur').value,
                        client: document.getElementById('me_client').value || '-',
                        owner: document.getElementById('me_owner').value,
                        type: document.getElementById('me_type').value,
                        status: 'מתוכנן',
                        link: 'https://zoom.us/...',
                        location: document.getElementById('me_loc').value,
                        goal: document.getElementById('me_goal').value,
                        summary: null,
                        tasks: [],
                    });
                    closeModal(); rerender();
                    toast(`פגישה "${title}" נוצרה`, 'success');
                }},
            ]);
        },
        viewMeeting(id) {
            const m = STATE_OP.meetings.find(x => x.id === id);
            if (!m) return;
            detailsModal(`פגישה ${m.id}`, [
                { label: 'שם', value: m.title },
                { label: 'תאריך', value: `${m.date} ${m.time}` },
                { label: 'משך', value: m.duration + ' דקות' },
                { label: 'לקוח', value: m.client },
                { label: 'אחראי', value: m.owner },
                { label: 'סוג', value: m.type },
                { label: 'סטטוס', value: m.status },
                { label: 'מיקום', value: m.location },
                { label: 'מטרה', value: m.goal },
                { label: 'סיכום', value: m.summary || 'אין סיכום עדיין' },
            ]);
        },
        createMeetingSummary(id) {
            const m = STATE_OP.meetings.find(x => x.id === id);
            if (!m) return;
            openModal(`סיכום פגישה: ${m.title}`, `
                <div class="form-group"><label>סיכום</label><textarea id="ms_summary" rows="6" placeholder="מה דובר? אילו החלטות התקבלו? אילו שאלות פתוחות?">${m.summary || ''}</textarea></div>
                <p style="font-size:11px; color:var(--muted);">💡 ניתן לבקש מהסוכן AI לחלץ משימות מהסיכום אחרי השמירה.</p>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'שמור סיכום + צור משימות', class: 'primary', onclick: () => {
                    m.summary = document.getElementById('ms_summary').value;
                    m.status = 'בוצעה';
                    // Auto-create follow-up task
                    STATE_OP.tasks.unshift({
                        id: genId('T'),
                        title: `פולואפ על פגישה: ${m.title}`,
                        type: 'פולואפ',
                        client: m.client,
                        assignee: m.owner,
                        dueDate: todayISO(),
                        priority: 'בינונית',
                        importance: 'בינונית',
                        status: 'חדש',
                        source: 'הסוכן',
                        notes: 'נוצר אוטומטית מסיכום פגישה',
                    });
                    closeModal(); rerender();
                    toast('סיכום נשמר + משימת פולואפ נוצרה', 'success');
                }},
            ]);
        },
        markMeetingDone(id) {
            const m = STATE_OP.meetings.find(x => x.id === id);
            if (!m) return;
            m.status = 'בוצעה';
            rerender();
            toast('פגישה סומנה כבוצעה', 'success');
        },
        markMeetingMissed(id) {
            const m = STATE_OP.meetings.find(x => x.id === id);
            if (!m) return;
            m.status = 'לא התקיימה';
            rerender();
            toast('פגישה סומנה כלא התקיימה', 'info');
        },
        createTasksFromMeeting(id) {
            const m = STATE_OP.meetings.find(x => x.id === id);
            if (!m) return;
            const newTask = {
                id: genId('T'),
                title: `פולואפ פגישה: ${m.title}`,
                type: 'פולואפ',
                client: m.client,
                assignee: m.owner,
                dueDate: todayISO(),
                priority: 'בינונית',
                importance: 'בינונית',
                status: 'חדש',
                source: 'הסוכן',
                notes: `נוצר מפגישה ${m.id}`,
            };
            STATE_OP.tasks.unshift(newTask);
            m.tasks = m.tasks || [];
            m.tasks.push(newTask.id);
            rerender();
            toast(`משימת פולואפ נוצרה לפגישה`, 'success');
        },

        // ============ REMINDERS ============
        addReminder() {
            openModal('תזכורת חדשה', `
                <div class="form-group"><label>תזכורת</label><input id="r_text" type="text" placeholder="על מה לזכור?"></div>
                <div class="form-row cols-3">
                    <div class="form-group"><label>למי</label><select id="r_for">${STATE_OP.team.map(m => `<option>${m.name}</option>`).join('')}</select></div>
                    <div class="form-group"><label>מתי</label><input id="r_when" type="datetime-local"></div>
                    <div class="form-group"><label>דחיפות</label><select id="r_p"><option>נמוכה</option><option selected>בינונית</option><option>גבוהה</option></select></div>
                </div>
                <div class="form-group"><label><input type="checkbox" id="r_rec"> תזכורת חוזרת</label></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'צור תזכורת', class: 'primary', onclick: () => {
                    const text = document.getElementById('r_text').value.trim();
                    if (!text) { toast('טקסט חייב', 'error'); return; }
                    STATE_OP.reminders.unshift({
                        for: document.getElementById('r_for').value,
                        text,
                        when: document.getElementById('r_when').value.replace('T', ' '),
                        priority: document.getElementById('r_p').value,
                        recurring: document.getElementById('r_rec').checked,
                    });
                    closeModal(); rerender();
                    toast('תזכורת נוצרה', 'success');
                }},
            ]);
        },
        deleteReminder(idx) {
            STATE_OP.reminders.splice(idx, 1);
            rerender();
            toast('תזכורת נמחקה', 'info');
        },

        // ============ CLIENTS ============
        addClient() {
            openModal('לקוח חדש', `
                <div class="form-row">
                    <div class="form-group"><label>שם לקוח</label><input id="c_name" type="text"></div>
                    <div class="form-group"><label>שם עסק</label><input id="c_biz" type="text"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>שירות</label><input id="c_service" type="text"></div>
                    <div class="form-group"><label>שלב</label><select id="c_stage"><option>חדש</option><option selected>באונבורדינג</option><option>פעיל</option></select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>CSM</label><select id="c_csm">${STATE_OP.team.map(m => `<option>${m.name}</option>`).join('')}</select></div>
                    <div class="form-group"><label>מנהל לקוח</label><select id="c_am">${STATE_OP.team.map(m => `<option>${m.name}</option>`).join('')}</select></div>
                </div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'צור לקוח', class: 'primary', onclick: () => {
                    const name = document.getElementById('c_name').value.trim();
                    if (!name) { toast('שם חייב', 'error'); return; }
                    STATE_OP.clients.unshift({
                        name,
                        business: document.getElementById('c_biz').value || name,
                        service: document.getElementById('c_service').value || '-',
                        stage: document.getElementById('c_stage').value,
                        startDate: todayISO(),
                        csmOwner: document.getElementById('c_csm').value,
                        accountManager: document.getElementById('c_am').value,
                        status: 'פעיל',
                        satisfaction: 4.5,
                        openTasks: 0,
                        meetings: 0,
                        payments: 0,
                        missingDocs: 0,
                        lastContact: todayISO(),
                        churnRisk: 'נמוך',
                        action: 'הפעל אונבורדינג',
                    });
                    closeModal(); rerender();
                    toast(`לקוח "${name}" נוסף`, 'success');
                }},
            ]);
        },
        viewClient(name) {
            const c = STATE_OP.clients.find(x => x.name === name);
            if (!c) return;
            detailsModal(`לקוח: ${c.name}`, [
                { label: 'עסק', value: c.business },
                { label: 'שירות', value: c.service },
                { label: 'שלב', value: c.stage },
                { label: 'תאריך התחלה', value: c.startDate },
                { label: 'CSM', value: c.csmOwner },
                { label: 'מנהל לקוח', value: c.accountManager },
                { label: 'סטטוס', value: c.status },
                { label: 'שביעות רצון', value: c.satisfaction + '/5' },
                { label: 'משימות פתוחות', value: c.openTasks },
                { label: 'פגישות צפויות', value: c.meetings },
                { label: 'תשלומים פתוחים', value: c.payments },
                { label: 'מסמכים חסרים', value: c.missingDocs },
                { label: 'קשר אחרון', value: c.lastContact },
                { label: 'סיכון נטישה', value: c.churnRisk },
                { label: 'פעולה מומלצת', value: c.action },
            ]);
        },
        createClientCSMTask(name) {
            const c = STATE_OP.clients.find(x => x.name === name);
            if (!c) return;
            STATE_OP.tasks.unshift({
                id: genId('T'),
                title: `CSM: ${name} - ${c.action || 'שיחת בדיקה'}`,
                type: 'שירות לקוחות',
                client: name,
                assignee: c.csmOwner,
                dueDate: todayISO(),
                priority: c.churnRisk === 'קריטי' ? 'קריטית' : c.churnRisk === 'גבוה' ? 'גבוהה' : 'בינונית',
                importance: 'גבוהה',
                status: 'חדש',
                source: 'הסוכן',
                notes: `סיבה: ${c.action}`,
            });
            rerender();
            toast(`משימת CSM ל-${name} נוצרה`, 'success');
        },

        // ============ SERVICE TICKETS ============
        addServiceTicket() {
            openModal('פנייה חדשה', `
                <div class="form-row">
                    <div class="form-group"><label>לקוח</label><select id="st_client">${STATE_OP.clients.map(c => `<option>${c.name}</option>`).join('')}</select></div>
                    <div class="form-group"><label>סוג פנייה</label><select id="st_type">${['שאלה כללית','בעיה','בקשת עדכון','בקשת שינוי','תלונה','בקשת החזר','בקשת מסמך','בקשת פגישה','בעיה טכנית'].map(t => `<option>${t}</option>`).join('')}</select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>ערוץ</label><select id="st_ch">${['וואטסאפ','טלפון','מייל','טופס','צ׳אט באתר','אינסטגרם','ידני'].map(c => `<option>${c}</option>`).join('')}</select></div>
                    <div class="form-group"><label>דחיפות</label><select id="st_p">${['נמוכה','בינונית','גבוהה','דחופה'].map(p => `<option>${p}</option>`).join('')}</select></div>
                </div>
                <div class="form-group"><label>תיאור</label><textarea id="st_desc" rows="3"></textarea></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'צור פנייה', class: 'primary', onclick: () => {
                    STATE_OP.serviceTickets.unshift({
                        id: genId('S'),
                        client: document.getElementById('st_client').value,
                        type: document.getElementById('st_type').value,
                        channel: document.getElementById('st_ch').value,
                        desc: document.getElementById('st_desc').value,
                        priority: document.getElementById('st_p').value,
                        status: 'פתוח',
                        owner: 'אופק',
                        opened: todayISO(),
                        firstResponse: null,
                        closed: null,
                        suggestedReply: '-',
                    });
                    closeModal(); rerender();
                    toast('פנייה נוצרה', 'success');
                }},
            ]);
        },
        respondTicket(id) {
            const t = STATE_OP.serviceTickets.find(x => x.id === id);
            if (!t) return;
            openModal(`תשובה לפנייה ${id}`, `
                <p style="font-size:12px; color:var(--muted); margin-bottom:10px;">לקוח: <strong>${t.client}</strong> | ${t.desc}</p>
                <div class="form-group"><label>תשובה (הצעת הסוכן)</label><textarea id="tr_text" rows="4">${t.suggestedReply || ''}</textarea></div>
                <p style="font-size:11px; color:var(--warning);">⚠️ ההודעה תישלח דרך הערוץ ${t.channel} - דורש אישור אנושי</p>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'אשר לשליחה בעתיד', class: 'primary', onclick: () => {
                    if (!t.firstResponse) t.firstResponse = todayISO();
                    t.status = 'בטיפול';
                    closeModal(); rerender();
                    toast('תשובה הוכנה (לא נשלחת בפועל בשלב הזה)', 'info');
                }},
            ]);
        },
        closeTicket(id) {
            const t = STATE_OP.serviceTickets.find(x => x.id === id);
            if (!t) return;
            t.status = 'הושלם';
            t.closed = todayISO();
            rerender();
            toast('פנייה נסגרה', 'success');
        },
        ticketToTask(id) {
            const t = STATE_OP.serviceTickets.find(x => x.id === id);
            if (!t) return;
            STATE_OP.tasks.unshift({
                id: genId('T'),
                title: `שירות: ${t.desc.slice(0, 50)}`,
                type: 'שירות לקוחות',
                client: t.client,
                assignee: t.owner,
                dueDate: todayISO(),
                priority: t.priority === 'דחופה' ? 'קריטית' : t.priority,
                importance: 'גבוהה',
                status: 'חדש',
                source: 'הסוכן',
                notes: `פנייה ${id}: ${t.desc}`,
            });
            rerender();
            toast('משימה נוצרה מהפנייה', 'success');
        },

        // ============ AUTOMATIONS ============
        toggleAutomation(id) {
            const a = STATE_OP.automations.find(x => x.id === id);
            if (!a) return;
            a.status = a.status === 'פעיל' ? 'כבוי' : 'פעיל';
            rerender();
            toast(`אוטומציה ${a.status === 'פעיל' ? 'הופעלה' : 'כובתה'}: ${a.name}`, 'info');
        },
        addAutomation() {
            openModal('אוטומציה חדשה', `
                <div class="form-group"><label>שם</label><input id="a_name" type="text" placeholder="לדוגמה: לקוח חדש → אונבורדינג"></div>
                <div class="form-row">
                    <div class="form-group"><label>טריגר</label><select id="a_trigger"><option>עסקה נסגרה</option><option>לקוח חדש</option><option>משימה באיחור</option><option>אין תקשורת X ימים</option><option>פגישה הסתיימה</option><option>חוב פתוח</option><option>סיכון נטישה</option><option>שביעות רצון גבוהה</option><option>מסמך חסר</option></select></div>
                    <div class="form-group"><label>פעולה</label><select id="a_action"><option>יצירת משימה</option><option>פתיחת תהליך</option><option>שליחת הודעה (לאישור)</option><option>תזכורת לצוות</option><option>התראה למנהל</option></select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>תדירות</label><select id="a_freq"><option>בכל אירוע</option><option>יומי</option><option>שבועי</option><option>חודשי</option></select></div>
                    <div class="form-group"><label>אחראי</label><select id="a_owner">${STATE_OP.team.map(m => `<option>${m.name}</option>`).join('')}</select></div>
                </div>
                <div class="form-group"><label><input type="checkbox" id="a_appr" checked> דורש אישור אנושי</label></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'צור אוטומציה', class: 'primary', onclick: () => {
                    const name = document.getElementById('a_name').value.trim();
                    if (!name) { toast('שם חייב', 'error'); return; }
                    STATE_OP.automations.unshift({
                        id: genId('A'),
                        name,
                        trigger: document.getElementById('a_trigger').value,
                        condition: '-',
                        action: document.getElementById('a_action').value,
                        status: 'פעיל',
                        dept: 'תפעול',
                        biz: 'כל סוגי עסק',
                        frequency: document.getElementById('a_freq').value,
                        owner: document.getElementById('a_owner').value,
                        requiresApproval: document.getElementById('a_appr').checked,
                    });
                    closeModal(); rerender();
                    toast(`אוטומציה "${name}" נוצרה`, 'success');
                }},
            ]);
        },

        // ============ DOCUMENTS ============
        markDocReceived(idx) {
            STATE_OP.documents[idx].uploaded = true;
            rerender();
            toast('מסמך סומן כהתקבל', 'success');
        },
        remindDoc(idx) {
            const d = STATE_OP.documents[idx];
            STATE_OP.tasks.unshift({
                id: genId('T'),
                title: `שלח תזכורת ל-${d.client}: ${d.name}`,
                type: 'בדיקת מסמך',
                client: d.client,
                assignee: 'רחל',
                dueDate: todayISO(),
                priority: 'בינונית',
                importance: 'בינונית',
                status: 'חדש',
                source: 'הסוכן',
                notes: `מסמך חסר: ${d.name}`,
            });
            rerender();
            toast(`משימה: תזכורת ל-${d.client}`, 'success');
        },

        // ============ RISKS ============
        createRiskAction(idx) {
            const r = STATE_OP.risks[idx];
            STATE_OP.tasks.unshift({
                id: genId('T'),
                title: `סיכון ${r.level}: ${r.client} - ${r.action}`,
                type: 'שימור',
                client: r.client,
                assignee: 'דור',
                dueDate: todayISO(),
                priority: r.level === 'קריטי' ? 'קריטית' : 'גבוהה',
                importance: 'גבוהה',
                status: 'חדש',
                source: 'הסוכן',
                notes: `סיבות: ${r.reasons.join(', ')}`,
            });
            rerender();
            toast(`משימת סיכון ל-${r.client} נוצרה`, 'success');
        },
        resolveRisk(idx) {
            confirmModal('סמן כטופל', `האם הסיכון של ${STATE_OP.risks[idx].client} טופל?`, () => {
                STATE_OP.risks.splice(idx, 1);
                rerender();
                toast('סיכון סומן כטופל', 'success');
            });
        },

        // ============ ALERTS ============
        alertToTask(idx) {
            const a = STATE_OP.alerts[idx];
            STATE_OP.tasks.unshift({
                id: genId('T'),
                title: a.title,
                type: 'משימה פנימית',
                client: a.client,
                assignee: 'רון',
                dueDate: todayISO(),
                priority: a.severity === 'critical' ? 'קריטית' : a.severity === 'high' ? 'גבוהה' : 'בינונית',
                importance: 'גבוהה',
                status: 'חדש',
                source: 'הסוכן',
                notes: a.desc,
            });
            rerender();
            toast('משימה נוצרה מהתראה', 'success');
        },
        resolveAlert(idx) {
            STATE_OP.alerts.splice(idx, 1);
            rerender();
            toast('התראה סומנה כטופלה', 'success');
        },
        dismissAlert(idx) {
            STATE_OP.alerts.splice(idx, 1);
            rerender();
            toast('התראה נדחתה', 'info');
        },

        // ============ ONBOARDING ============
        viewOnboarding(client) {
            const o = STATE_OP.onboarding.find(x => x.client === client);
            if (!o) return;
            detailsModal(`אונבורדינג: ${o.client}`, [
                { label: 'תאריך התחלה', value: o.start },
                { label: 'שלב נוכחי', value: o.stage },
                { label: 'התקדמות', value: o.progress + '%' },
                { label: 'אחראי', value: o.owner },
                { label: 'דדליין', value: o.deadline },
                { label: 'סטטוס', value: o.status },
                { label: 'חסמים', value: (o.blockers || []).join(', ') || 'אין' },
                { label: 'פעולה מומלצת', value: o.action },
            ]);
        },
        progressOnboarding(client) {
            const o = STATE_OP.onboarding.find(x => x.client === client);
            if (!o) return;
            o.progress = Math.min(100, o.progress + 20);
            if (o.progress >= 100) { o.status = 'הושלם'; o.stage = 'סיים אונבורדינג'; }
            rerender();
            toast(`התקדמות אונבורדינג: ${o.progress}%`, 'success');
        },

        // ============ FILTERS ============
        _filters: {},
        setFilter(tab, key, val) {
            if (!this._filters[tab]) this._filters[tab] = {};
            this._filters[tab][key] = val;
            rerender();
        },
        getFilter(tab, key, def = '') {
            return (this._filters[tab] && this._filters[tab][key]) || def;
        },
        clearFilters(tab) {
            delete this._filters[tab];
            rerender();
            toast('פילטרים אופסו', 'info');
        },

        // ============ EXPORT ============
        exportToExcel(sheetName) {
            if (typeof XLSX === 'undefined') { toast('SheetJS לא נטען', 'error'); return; }
            const map = {
                'משימות': () => STATE_OP.tasks,
                'לקוחות': () => STATE_OP.clients,
                'פגישות': () => STATE_OP.meetings,
                'שירות': () => STATE_OP.serviceTickets,
                'אונבורדינג': () => STATE_OP.onboarding,
                'אוטומציות': () => STATE_OP.automations,
                'מסמכים': () => STATE_OP.documents,
                'סיכונים': () => STATE_OP.risks,
            };
            const data = map[sheetName] ? map[sheetName]() : STATE_OP.tasks;
            if (!data || !data.length) { toast('אין נתונים', 'warning'); return; }
            try {
                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Data');
                XLSX.writeFile(wb, `${sheetName || 'export'}-${todayISO()}.xlsx`);
                toast(`קובץ נורד`, 'success');
            } catch (e) { toast('שגיאה: ' + e.message, 'error'); }
        },

        // ============ TOP BAR ============
        pickDate() {
            toast('בורר תאריך - יבנה בשלב הבא', 'info');
        },
        resetDemo() {
            confirmModal('איפוס נתונים', 'לחזור לנתוני הדמו המקוריים? כל השינויים יימחקו.', () => {
                localStorage.removeItem(STORAGE_KEY);
                window.STATE_OP = JSON.parse(JSON.stringify(MOCK_OP));
                rerender();
                toast('הנתונים אופסו', 'success');
            }, 'אפס', true);
        },

        // ============ REPORTS ============
        viewReport(name) {
            openModal(name, `<p style="font-size:13px; line-height:1.7;">דוח <strong>${name}</strong> יוצג כאן עם נתונים מלאים. בשלב הבא נוסיף תוכן מלא וייצוא PDF.</p>`, [{ label: 'סגור', onclick: closeModal }]);
        },

        // ============ CHAT (agentic) ============
        chatHistory: [],
        async sendChatMessage(text) {
            if (!text || !text.trim()) return;
            text = text.trim();
            OA.chatHistory.push({ role: 'user', content: text });
            OA._renderChat();
            OA._showTyping();

            try {
                const snapshot = {
                    today: STATE_OP.today,
                    kpis: STATE_OP.kpis,
                    overdueCount: STATE_OP.tasks.filter(t => t.status === 'באיחור').length,
                    todayTasks: STATE_OP.tasks.filter(t => t.dueDate === STATE_OP.today).map(t => ({ title: t.title, priority: t.priority, assignee: t.assignee, client: t.client, status: t.status })),
                    risks: STATE_OP.risks.map(r => ({ client: r.client, level: r.level, action: r.action })),
                    todayMeetings: STATE_OP.meetings.filter(m => m.date === STATE_OP.today).map(m => ({ title: m.title, time: m.time, client: m.client })),
                    openTickets: STATE_OP.serviceTickets.filter(t => t.status !== 'הושלם').map(t => ({ id: t.id, client: t.client, type: t.type, priority: t.priority })),
                    teamLoad: STATE_OP.team.map(t => ({ name: t.name, tasks: t.tasks, overdue: t.overdue, load: t.load })),
                    stuckOnboarding: STATE_OP.onboarding.filter(o => o.status === 'תקוע').map(o => ({ client: o.client, blockers: o.blockers, action: o.action })),
                    missingDocs: STATE_OP.documents.filter(d => !d.uploaded && d.required).length,
                };
                const sysContext = `\n\n## מצב התפעול (${snapshot.today})\n\`\`\`json\n${JSON.stringify(snapshot, null, 2)}\n\`\`\`\n`;
                const messages = [...OA.chatHistory.slice(0, -1), { role: 'user', content: text + sysContext }];
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages, agent_type: 'operational' }),
                });
                OA._hideTyping();
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: 'שגיאה' }));
                    OA.chatHistory.push({ role: 'assistant', content: `שגיאה: ${err.error || 'לא ידוע'}` });
                    OA._renderChat();
                    return;
                }
                const data = await res.json();
                const reply = data.message || '(אין תוכן)';
                OA.chatHistory.push({ role: 'assistant', content: reply });
                OA._renderChat();
                OA._processActions(reply);
            } catch (e) {
                OA._hideTyping();
                OA.chatHistory.push({ role: 'assistant', content: `שגיאת חיבור: ${e.message || 'לא ידוע'}` });
                OA._renderChat();
            }
        },
        _processActions(text) {
            const re = /\[ACTION\]([\s\S]*?)\[\/ACTION\]/g;
            let m, count = 0;
            while ((m = re.exec(text)) !== null) {
                try {
                    const a = JSON.parse(m[1].trim());
                    if (OA._runAction(a)) count++;
                } catch (e) {}
            }
            if (count > 0) toast(`${count} פעולות בוצעו על ידי הסוכן`, 'success', 4000);
            rerender();
        },
        _runAction(action) {
            if (!action || !action.type) return false;
            switch (action.type) {
                case 'create_task':
                    STATE_OP.tasks.unshift({
                        id: genId('T'),
                        title: action.title || 'משימה מהסוכן',
                        type: action.task_type || 'משימה פנימית',
                        client: action.client || '-',
                        assignee: action.assignee || 'רון',
                        dueDate: action.due || todayISO(),
                        priority: action.priority || 'בינונית',
                        importance: 'בינונית',
                        status: 'חדש',
                        source: 'הסוכן',
                        notes: action.notes || 'מצוין על ידי הסוכן',
                    });
                    return true;
                case 'create_reminder':
                    STATE_OP.reminders.unshift({
                        for: action.for || 'רון',
                        text: action.text || 'תזכורת',
                        when: action.when || todayISO() + ' 09:00',
                        priority: action.priority || 'בינונית',
                        recurring: false,
                    });
                    return true;
                case 'mark_task_done':
                    const t = STATE_OP.tasks.find(x => x.id === action.task_id || x.title === action.title);
                    if (t) { t.status = 'הושלם'; return true; }
                    return false;
                case 'dismiss_alert':
                    if (typeof action.index === 'number') {
                        STATE_OP.alerts.splice(action.index, 1);
                        return true;
                    }
                    return false;
                default: return false;
            }
        },
        _renderChat() {
            const box = document.getElementById('chatMsgs');
            if (!box) return;
            box.innerHTML = OA.chatHistory.map(m => {
                if (m.role === 'user') {
                    const txt = m.content.split('## מצב התפעול')[0].trim();
                    return `<div class="chat-msg user">${OA._esc(txt)}</div>`;
                } else {
                    let t = m.content.replace(/\[ACTION\]([\s\S]*?)\[\/ACTION\]/g, (_, json) => {
                        try { const a = JSON.parse(json.trim()); return `<div class="agent-action-card"><strong>✅ ${a.type === 'create_task' ? 'משימה נוצרה' : a.type === 'create_reminder' ? 'תזכורת נוצרה' : a.type}</strong>${a.title || a.text || ''}</div>`; }
                        catch { return ''; }
                    });
                    t = OA._esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
                    return `<div class="chat-msg bot">${t}</div>`;
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
        _hideTyping() { const t = document.getElementById('chatTyping'); if (t) t.remove(); },
        _esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
        chatSuggestion(text) {
            OA.sendChatMessage(text);
        },
        async proactiveOpen() {
            if (OA.chatHistory.length > 0) { OA._renderChat(); return; }
            await OA.sendChatMessage('הבוקר טוב, אני פותח את הצ׳אט התפעולי. תן לי את 3 הדברים הכי חשובים שאני צריך לעשות היום, על פי מצב התפעול כרגע.');
        },

        // ============ BIZ TYPE ============
        selectBizType(id) {
            const bt = STATE_OP.businessTypes.find(b => b.id === id);
            if (!bt) return;
            STATE_OP._activeBizType = id;
            rerender();
            toast(`תבנית "${bt.name}" נבחרה - מודולים והמלצות יתאימו אוטומטית`, 'success', 4000);
        },
    };

    window.addEventListener('beforeunload', saveState);
    setInterval(saveState, 10000);
})();


