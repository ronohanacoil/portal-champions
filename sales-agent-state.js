/**
 * Sales Agent - State + Mock Data + Actions
 * window.STATE_SA: mutable, persisted to localStorage
 * window.SA: namespace of all action handlers
 */

(function() {
    'use strict';
    const STORAGE_KEY = 'sa_state_v1';

    const MOCK_SA = {
        today: '2026-05-26',
        kpis: {
            newLeadsToday: { value: 14, trend: +12, prev: 12 },
            newLeadsMonth: { value: 312, trend: +8, prev: 289 },
            untreated: { value: 47, trend: +15, prev: 41 },
            hotLeads: { value: 38, trend: +6, prev: 36 },
            fireLeads: { value: 9, trend: 0, prev: 9 },
            meetingsBooked: { value: 64, trend: +18, prev: 54 },
            meetingsHeld: { value: 51, trend: +14, prev: 45 },
            noShows: { value: 13, trend: -3, prev: 14 },
            openProposals: { value: 11, trend: +2, prev: 9 },
            openDeals: { value: 47, trend: +5, prev: 45 },
            closedDeals: { value: 18, trend: +12, prev: 16 },
            lostDeals: { value: 24, trend: -8, prev: 26 },
            monthRevenue: { value: 286000, trend: +14, prev: 251000 },
            forecastRevenue: { value: 412000, trend: 0, prev: null },
            closeRate: { value: 18.2, trend: +2, prev: 16.4 },
            avgResponseHours: { value: 4.2, trend: -25, prev: 5.6 },
            cpl: { value: 78, trend: -12, prev: 88 },
            pipelineValue: { value: 740000, trend: +9, prev: 678000 },
            openFollowupMoney: { value: 312000, trend: +5, prev: 297000 },
            warmingNeeded: { value: 28, trend: +18, prev: 24 },
            revivalCandidates: { value: 24, trend: 0, prev: 24 },
        },
        reps: [
            { name: 'רון', role: 'מנהל מכירות', leads: 28, responseHours: 1.2, calls: 87, meetings: 14, shows: 12, closes: 6, revenue: 142000, avgDeal: 23700, followups: 42, lost: 4, mainLostReason: 'יקר לי', closeRate: 50, openFupValue: 38000 },
            { name: 'עמית', role: 'נציג מכירות', leads: 64, responseHours: 4.5, calls: 156, meetings: 22, shows: 17, closes: 7, revenue: 98000, avgDeal: 14000, followups: 31, lost: 8, mainLostReason: 'צריך לחשוב', closeRate: 41, openFupValue: 84000 },
            { name: 'מתאם פגישות', role: 'Appointment Setter', leads: 145, responseHours: 1.8, calls: 312, meetings: 38, shows: null, closes: null, revenue: null, avgDeal: null, followups: 84, lost: null, mainLostReason: '-', closeRate: null, openFupValue: 0 },
            { name: 'אופק', role: 'נציג מכירות בכיר', leads: 22, responseHours: 2.1, calls: 64, meetings: 18, shows: 16, closes: 5, revenue: 86000, avgDeal: 17200, followups: 28, lost: 6, mainLostReason: 'תזמון', closeRate: 31, openFupValue: 124000 },
            { name: 'דנה', role: 'נציג מכירות', leads: 38, responseHours: 5.8, calls: 98, meetings: 12, shows: 9, closes: 3, revenue: 42000, avgDeal: 14000, followups: 19, lost: 7, mainLostReason: 'נעלם', closeRate: 33, openFupValue: 66000 },
        ],
        campaigns: [
            { name: 'Facebook Q2', spend: 8500, leads: 109, cpl: 78, meetings: 18, closes: 4, revenue: 38000, roi: 347, avgDealValue: 9500, status: 'פעיל' },
            { name: 'Google Ads', spend: 5200, leads: 64, cpl: 81, meetings: 12, closes: 5, revenue: 42000, roi: 708, avgDealValue: 8400, status: 'פעיל' },
            { name: 'LinkedIn', spend: 3400, leads: 22, cpl: 155, meetings: 9, closes: 3, revenue: 51000, roi: 1400, avgDealValue: 17000, status: 'פעיל' },
            { name: 'Instagram Q2', spend: 12400, leads: 145, cpl: 86, meetings: 11, closes: 2, revenue: 8000, roi: -35, avgDealValue: 4000, status: 'מפסיד' },
            { name: 'TikTok', spend: 2100, leads: 38, cpl: 55, meetings: 4, closes: 1, revenue: 4500, roi: 114, avgDealValue: 4500, status: 'גבולי' },
            { name: 'אורגני (אתר+SEO)', spend: 0, leads: 28, cpl: 0, meetings: 14, closes: 8, revenue: 67000, roi: 9999, avgDealValue: 8375, status: 'מצוין' },
            { name: 'הפניות מלקוחות', spend: 0, leads: 18, cpl: 0, meetings: 16, closes: 9, revenue: 89000, roi: 9999, avgDealValue: 9889, status: 'מצוין' },
        ],
        leads: [
            { id: 'L-101', name: 'יעל כהן', phone: '054-1234567', email: 'yael@example.com', business: 'יעל קוסמטיקה', industry: 'יופי', source: 'Facebook', campaign: 'Facebook Q2', created: '2026-05-26 09:15', status: 'חדש', heat: 'חם', score: 78, rep: 'עמית', firstResponseHours: null, attempts: 0, lastCall: null, lastMessage: null, journeyStage: 'ליד חדש נכנס', pain: 'מאבדת לקוחות', desire: 'להגדיל מחזור פי 2', budget: 'מעל 5K לחודש', revenue: '50-80K/חודש', urgency: 'גבוהה', expectedObjection: 'יקר לי', nextAction: 'התקשרות ראשונה', followupDate: '2026-05-26', closeProbability: 65, notes: '-' },
            { id: 'L-102', name: 'משה אברהמי', phone: '052-9876543', email: 'moshe@kitchen.co.il', business: 'מטבחי אברהמי', industry: 'מטבחים', source: 'Google', campaign: 'Google Ads', created: '2026-05-26 08:30', status: 'ניסיון שני', heat: 'רותח', score: 92, rep: 'רון', firstResponseHours: 0.5, attempts: 2, lastCall: '2026-05-26 10:00', lastMessage: '2026-05-26 11:30', journeyStage: 'הצגת פתרון', pain: 'מעצב לבד, לא מתקדם', desire: 'צוות מקצועי שיעצב מטבחים', budget: '8-15K', revenue: '120K/חודש', urgency: 'מיידית', expectedObjection: 'תזמון', nextAction: 'קביעת פגישה', followupDate: '2026-05-26', closeProbability: 80, notes: 'מתקדם, מוכן לסגירה' },
            { id: 'L-103', name: 'ד״ר רחל לוי', phone: '050-1112233', email: 'dr.rachel@dental.co.il', business: 'מרפאת שיניים לוי', industry: 'רפואה', source: 'LinkedIn', campaign: 'LinkedIn', created: '2026-05-25 14:20', status: 'נקבעה פגישה', heat: 'רותח', score: 88, rep: 'רון', firstResponseHours: 1.0, attempts: 1, lastCall: '2026-05-25 15:30', lastMessage: '2026-05-26 08:00', journeyStage: 'הכנה לפגישה', pain: 'אין מערכת לתורים', desire: 'אוטומציה מלאה', budget: 'גמיש', revenue: '180K/חודש', urgency: 'בינונית', expectedObjection: 'אישור שותף', nextAction: 'פגישה ב-28.5', followupDate: '2026-05-28', closeProbability: 70, notes: 'דורש אישור שותף' },
            { id: 'L-104', name: 'אבי שפירא', phone: '054-7778899', email: 'avi@startup.co.il', business: 'StartupAvi', industry: 'B2B SaaS', source: 'אורגני', campaign: 'אורגני', created: '2026-05-25 11:00', status: 'הצעה נשלחה', heat: 'חם', score: 85, rep: 'אופק', firstResponseHours: 1.5, attempts: 3, lastCall: '2026-05-25 16:00', lastMessage: '2026-05-26 09:00', journeyStage: 'פולואפ אחרי הצעה', pain: 'מעט לידים איכותיים', desire: 'תהליך מכירה אוטומטי', budget: '15K/חודש', revenue: '300K/חודש', urgency: 'גבוהה', expectedObjection: 'יקר לי', nextAction: 'שיחת סגירה', followupDate: '2026-05-27', closeProbability: 75, notes: 'הצעה של 32K נשלחה' },
            { id: 'L-105', name: 'שירה כהן', phone: '050-2223344', email: 'shira@design.co.il', business: 'שירה עיצוב פנים', industry: 'עיצוב', source: 'Instagram', campaign: 'Instagram Q2', created: '2026-05-24 16:00', status: 'לא ענה', heat: 'בינוני', score: 55, rep: 'דנה', firstResponseHours: null, attempts: 4, lastCall: '2026-05-26 11:00', lastMessage: '2026-05-25 12:00', journeyStage: 'ניסיון שלישי', pain: 'לא ברור', desire: 'לא ברור', budget: '?', revenue: '?', urgency: 'נמוכה', expectedObjection: '?', nextAction: 'הודעת ערך', followupDate: '2026-05-27', closeProbability: 25, notes: 'מתקרר - שווה הודעת ערך' },
            { id: 'L-106', name: 'יוסי שטרן', phone: '054-3334455', email: 'yossi@consult.co.il', business: 'שטרן ייעוץ עסקי', industry: 'ייעוץ', source: 'הפניות', campaign: 'הפניות מלקוחות', created: '2026-05-24 09:00', status: 'הגיע לפגישה', heat: 'רותח', score: 95, rep: 'רון', firstResponseHours: 0.3, attempts: 2, lastCall: '2026-05-25 14:00', lastMessage: '2026-05-26 08:30', journeyStage: 'טיפול בהתנגדות', pain: 'תלוי בלקוח אחד גדול', desire: 'גיוון לקוחות', budget: '30K לפרויקט', revenue: '600K/שנה', urgency: 'מיידית', expectedObjection: 'אדבר עם אשתי', nextAction: 'שיחת סגירה היום', followupDate: '2026-05-26', closeProbability: 88, notes: 'VIP - הפניה מלקוח טוב' },
            { id: 'L-107', name: 'דנה ברוך', phone: '052-5556677', email: 'dana@law.co.il', business: 'משרד עו״ד ברוך', industry: 'משפט', source: 'Google', campaign: 'Google Ads', created: '2026-05-23 13:00', status: 'בפולואפ', heat: 'חם', score: 72, rep: 'עמית', firstResponseHours: 2.0, attempts: 5, lastCall: '2026-05-26 10:30', lastMessage: '2026-05-26 11:00', journeyStage: 'אחרי הצעה', pain: 'הצעות יקרות מהמתחרים', desire: 'תוצאות מובטחות', budget: '12K', revenue: '200K/חודש', urgency: 'בינונית', expectedObjection: 'יקר לי', nextAction: 'שיחת מחיר', followupDate: '2026-05-27', closeProbability: 60, notes: 'מתמקח על מחיר' },
            { id: 'L-108', name: 'אורן בן-דוד', phone: '050-8889900', email: 'oren@accounting.co.il', business: 'בן-דוד רו״ח', industry: 'חשבונאות', source: 'אורגני', campaign: 'אורגני', created: '2026-05-22 10:00', status: 'נעלם', heat: 'קר', score: 35, rep: 'דנה', firstResponseHours: 12.0, attempts: 6, lastCall: '2026-05-25 09:00', lastMessage: '2026-05-23 14:00', journeyStage: 'מסע חימום', pain: 'לקוחות עוזבים', desire: 'אוטומציה', budget: '?', revenue: '?', urgency: 'נמוכה', expectedObjection: '?', nextAction: 'הודעת תובנה', followupDate: '2026-05-30', closeProbability: 15, notes: 'מועמד להחייאה' },
            { id: 'L-109', name: 'גלית פרץ', phone: '054-1112222', email: 'galit@beauty.co.il', business: 'גלית טיפוח', industry: 'יופי', source: 'Facebook', campaign: 'Facebook Q2', created: '2026-05-26 11:00', status: 'חדש', heat: 'חם', score: 80, rep: 'עמית', firstResponseHours: null, attempts: 0, lastCall: null, lastMessage: null, journeyStage: 'ליד חדש נכנס', pain: 'מאבדת תורים', desire: 'מערכת לתורים', budget: '500-1000', revenue: '40K/חודש', urgency: 'גבוהה', expectedObjection: 'יקר לי', nextAction: 'התקשרות ראשונה', followupDate: '2026-05-26', closeProbability: 55, notes: '-' },
            { id: 'L-110', name: 'אסף לוי', phone: '052-3334455', email: 'asaf@architect.co.il', business: 'לוי אדריכלים', industry: 'אדריכלות', source: 'הפניות', campaign: 'הפניות מלקוחות', created: '2026-05-21 08:00', status: 'אבוד', heat: 'בינוני', score: 60, rep: 'אופק', firstResponseHours: 1.0, attempts: 4, lastCall: '2026-05-24 11:00', lastMessage: '2026-05-25 10:00', journeyStage: 'אבוד', pain: 'מערך לידים חלש', desire: 'הגדלת פרויקטים', budget: '10K', revenue: '250K/חודש', urgency: 'נמוכה', expectedObjection: 'תזמון', nextAction: '-', followupDate: null, closeProbability: 0, notes: 'אבוד: תזמון - בודק בעוד 3 חודשים' },
            { id: 'L-111', name: 'נעמה מילר', phone: '050-7778888', email: 'naama@coach.co.il', business: 'נעמה אימון עסקי', industry: 'ייעוץ', source: 'LinkedIn', campaign: 'LinkedIn', created: '2026-05-26 10:30', status: 'ענה', heat: 'חם', score: 82, rep: 'רון', firstResponseHours: 0.8, attempts: 1, lastCall: '2026-05-26 11:30', lastMessage: '2026-05-26 12:00', journeyStage: 'בדיקת התאמה', pain: 'מסעות לידים ארוכים', desire: 'תהליך קצר ויעיל', budget: '20K', revenue: '500K/שנה', urgency: 'גבוהה', expectedObjection: 'יקר לי', nextAction: 'קביעת פגישה', followupDate: '2026-05-26', closeProbability: 70, notes: 'מתאימה מאוד' },
            { id: 'L-112', name: 'תומר אבני', phone: '054-9990011', email: 'tomer@b2b.co.il', business: 'אבני B2B', industry: 'B2B', source: 'Google', campaign: 'Google Ads', created: '2026-05-25 17:00', status: 'נקבעה פגישה', heat: 'רותח', score: 90, rep: 'אופק', firstResponseHours: 1.5, attempts: 2, lastCall: '2026-05-26 09:00', lastMessage: '2026-05-26 10:00', journeyStage: 'הכנה לפגישה', pain: 'תהליך מכירה ארוך מדי', desire: 'קיצור מחזור מכירה', budget: '25K/חודש', revenue: '800K/שנה', urgency: 'גבוהה', expectedObjection: 'תהליך החלטות', nextAction: 'פגישה ב-27.5', followupDate: '2026-05-27', closeProbability: 75, notes: 'מנכ״ל. עוצמתי' },
        ],
        proposals: [
            { id: 'P-201', client: 'אבי שפירא', deal: 32000, sent: '2026-05-23', opened: true, openedAt: '2026-05-23 18:00', validUntil: '2026-06-05', status: 'פתוח', rep: 'אופק', daysOpen: 3, lastFollowup: '2026-05-24', objection: '-', nextAction: 'שיחת סגירה' },
            { id: 'P-202', client: 'יוסי שטרן', deal: 28500, sent: '2026-05-24', opened: true, openedAt: '2026-05-24 14:30', validUntil: '2026-06-07', status: 'בהתנגדות', rep: 'רון', daysOpen: 2, lastFollowup: '2026-05-25', objection: 'אדבר עם אשתי', nextAction: 'הודעת ערך' },
            { id: 'P-203', client: 'דנה ברוך', deal: 14400, sent: '2026-05-22', opened: true, openedAt: '2026-05-22 19:00', validUntil: '2026-06-05', status: 'בהתנגדות', rep: 'עמית', daysOpen: 4, lastFollowup: '2026-05-23', objection: 'יקר לי', nextAction: 'שיחת מחיר' },
            { id: 'P-204', client: 'TechFlow Israel', deal: 53100, sent: '2026-05-21', opened: true, openedAt: '2026-05-21 15:00', validUntil: '2026-06-04', status: 'ממתין לתשלום', rep: 'רון', daysOpen: 5, lastFollowup: '2026-05-25', objection: '-', nextAction: 'תזכורת תשלום' },
            { id: 'P-205', client: 'גלית פרץ', deal: 8500, sent: '2026-05-25', opened: false, openedAt: null, validUntil: '2026-06-08', status: 'לא נפתח', rep: 'עמית', daysOpen: 1, lastFollowup: null, objection: '-', nextAction: 'הודעת תזכורת' },
            { id: 'P-206', client: 'נעמה מילר', deal: 19800, sent: '2026-05-24', opened: true, openedAt: '2026-05-24 21:00', validUntil: '2026-06-07', status: 'פתוח', rep: 'רון', daysOpen: 2, lastFollowup: '2026-05-25', objection: '-', nextAction: 'בדיקה' },
            { id: 'P-207', client: 'תומר אבני', deal: 38000, sent: '2026-05-26', opened: false, openedAt: null, validUntil: '2026-06-09', status: 'נשלח עכשיו', rep: 'אופק', daysOpen: 0, lastFollowup: null, objection: '-', nextAction: 'מעקב פתיחה' },
            { id: 'P-208', client: 'ד״ר רחל לוי', deal: 24000, sent: '2026-05-25', opened: true, openedAt: '2026-05-25 22:00', validUntil: '2026-06-08', status: 'פגישה נקבעה', rep: 'רון', daysOpen: 1, lastFollowup: null, objection: '-', nextAction: 'הכנה לפגישה' },
            { id: 'P-209', client: 'משה אברהמי', deal: 12500, sent: '2026-05-26', opened: false, openedAt: null, validUntil: '2026-06-09', status: 'נשלח עכשיו', rep: 'רון', daysOpen: 0, lastFollowup: null, objection: '-', nextAction: 'מעקב פתיחה' },
            { id: 'P-210', client: 'קליניקה X', deal: 18000, sent: '2026-05-20', opened: true, openedAt: '2026-05-20 17:00', validUntil: '2026-06-03', status: 'בפולואפ', rep: 'דנה', daysOpen: 6, lastFollowup: '2026-05-22', objection: 'נעלם', nextAction: 'מסע החייאה' },
            { id: 'P-211', client: 'מועדון Y', deal: 9500, sent: '2026-05-19', opened: true, openedAt: '2026-05-19 11:00', validUntil: '2026-06-02', status: 'בהתנגדות', rep: 'עמית', daysOpen: 7, lastFollowup: '2026-05-24', objection: 'צריך לחשוב', nextAction: 'שאלת התנגדות' },
        ],
        followups: [
            { id: 'F-301', leadId: 'L-101', client: 'יעל כהן', type: 'פולואפ אחרי ליד חדש שלא ענה', dueDate: '2026-05-26', priority: 'גבוהה', rep: 'עמית', message: 'היי יעל, ניסיתי לתפוס אותך אחרי שהשארת פרטים. כדי לא לבזבז לך זמן רוצה ש-2 שאלות קצרות יקבעו אם זה רלוונטי?', status: 'ממתין לאישור' },
            { id: 'F-302', leadId: 'L-102', client: 'משה אברהמי', type: 'פולואפ אחרי שיחה', dueDate: '2026-05-26', priority: 'גבוהה', rep: 'רון', message: 'משה, אחרי שדיברנו אני רוצה לוודא שזה הזמן הנכון לקבוע פגישה אצלך במטבח לבדיקה אישית.', status: 'ממתין לאישור' },
            { id: 'F-303', leadId: 'L-104', client: 'אבי שפירא', type: 'פולואפ אחרי הצעה', dueDate: '2026-05-27', priority: 'קריטית', rep: 'אופק', message: 'אבי, ההצעה שאצלך עכשיו תקפה עד 5 ביוני. אם יש משהו שעוצר אותך, בוא נדבר עליו ישירות.', status: 'ממתין לאישור' },
            { id: 'F-304', leadId: 'L-107', client: 'דנה ברוך', type: 'פולואפ אחרי יקר לי', dueDate: '2026-05-27', priority: 'גבוהה', rep: 'עמית', message: 'דנה, חשבתי על מה שאמרת. השאלה היא לא כמה ההצעה עולה אלא כמה עולה לך להישאר באותו מצב עוד 3 חודשים. בואי נדבר.', status: 'ממתין לאישור' },
            { id: 'F-305', leadId: 'L-108', client: 'אורן בן-דוד', type: 'פולואפ אחרי שתיקה', dueDate: '2026-05-30', priority: 'בינונית', rep: 'דנה', message: 'אורן, ראיתי שעדיין לא פתחת. אני לא יודע אם זה הזמן או לא, אבל אם הבעיה ש-discussions עליה עדיין קיימת, יש פה הזדמנות לפתור.', status: 'ממתין לאישור' },
            { id: 'F-306', leadId: 'L-105', client: 'שירה כהן', type: 'פולואפ אחרי 3 ימים', dueDate: '2026-05-27', priority: 'בינונית', rep: 'דנה', message: 'שירה, אני לא רוצה להציק. אם זה לא הזמן הנכון תגידי ואשאיר לך מקום בעוד חודש.', status: 'ממתין לאישור' },
            { id: 'F-307', leadId: 'L-111', client: 'נעמה מילר', type: 'פולואפ אחרי שיחה', dueDate: '2026-05-26', priority: 'גבוהה', rep: 'רון', message: 'נעמה, מצוין שדיברנו. ביום שלישי יש לי חלון של 30 דקות לפגישה אישית. נסגור?', status: 'ממתין לאישור' },
        ],
        objections: [
            { type: 'יקר לי', realReason: 'לא רואה את הערך / אין כסף / מנסה למקח', shortResp: 'יקר ביחס למה? בוא נראה מה זה אמור לפתור לך.', longResp: 'יקר זה ביחס למה. אם אתה מסתכל על הסכום זה דבר אחד. אם אתה מסתכל על מה שזה אמור לפתור לך בעסק זה דבר אחר. השאלה האמיתית היא לא כמה זה עולה, אלא כמה עולה לך להישאר באותו מצב.', assertive: 'אני מבין שזה יקר. השאלה היא כמה יקר לך להישאר במצב הנוכחי עוד חצי שנה.', soft: 'אני מבין שזה השקעה משמעותית. בוא נעבור יחד על מה שאתה מקבל ותראה אם זה משתלם.', question: 'יקר ביחס למה אתה משווה את זה?', whatsapp: 'חשבתי על מה שאמרת. השאלה היא לא כמה זה עולה אלא כמה עולה לך להישאר במצב הנוכחי.', whenToRelease: 'אחרי 3 ניסיונות שונים לטפל בהתנגדות' },
            { type: 'צריך לחשוב', realReason: 'יש משהו אחד שלא ברור: מחיר, אמון או תזמון', shortResp: 'בדרך כלל יש משהו אחד שעוצר. מה אצלך?', longResp: 'ברור לי. בדרך כלל כשמישהו אומר צריך לחשוב, יש משהו אחד שלא יושב לו עד הסוף. או המחיר, או האמון שזה יעבוד, או התזמון. מה מהם יותר נכון אצלך?', assertive: 'מה שאתה אומר זה שאתה לא בטוח במשהו. בוא נגיד את האמת - מה זה?', soft: 'קח את הזמן שאתה צריך. רק תגיד לי - יש משהו ספציפי שעוצר?', question: 'מה הדבר היחיד שאם הוא היה ברור היית סוגר עכשיו?', whatsapp: 'תהיתי - מה הכי לא יושב לך מהמה שדיברנו? אם אענה על זה - נוכל להחליט.', whenToRelease: 'אחרי שאלה ישירה + 24 שעות בלי מענה' },
            { type: 'לא עכשיו', realReason: 'אין דחיפות / נוח לדחות / לא בטוח', shortResp: 'מתי כן? מה צריך לקרות עד אז?', longResp: 'אני מבין. השאלה היא אם לא עכשיו זה באמת לא הזמן, או שזה פשוט נוח לדחות. כי הבעיה שאתה רוצה לפתור קיימת כבר חודשים, ועוד 3 חודשים לא יפתרו אותה לבד.', assertive: 'אם לא עכשיו, אז מתי בדיוק? אם אין לזה תאריך זה לא קורה.', soft: 'הבנתי. תגיד לי איזה תאריך כן ואתאם איתך מחדש.', question: 'מה צריך להשתנות כדי שיהיה הזמן הנכון?', whatsapp: 'אני מכבד את ההחלטה לדחות. רק תזכור: הבעיה שאתה רוצה לפתור לא תפתור את עצמה.', whenToRelease: 'תיאום מחדש לעוד חודש' },
            { type: 'אדבר עם אשתי / שותף', realReason: 'דחיית החלטה / באמת צריך אישור', shortResp: 'מעולה. מה אתה צריך כדי שזה ילך?', longResp: 'מצוין שאתם מחליטים יחד. השאלה היא מה אתה צריך ממני כדי שהשיחה איתה תהיה ברורה? אני יכול להכין סיכום של מה שדיברנו עליו.', assertive: 'בסדר. מתי שלושתנו מדברים יחד? כי דרך השיחה הזו זה לא יסגר.', soft: 'בהחלט. אכין לכם סיכום ברור עם כל המספרים.', question: 'מה היא שואלת שאתה לא בטוח איך לענות?', whatsapp: 'הכנתי לכם סיכום של מה שדיברנו. תוכל לשתף עם בת הזוג ונדבר אחרי.', whenToRelease: 'תיאום שיחה משולשת או סגירה תוך 5 ימים' },
            { type: 'שלח לי פרטים', realReason: 'דחיית החלטה / לא מעוניין בהמשך שיחה', shortResp: 'אשלח. רק תגיד לי מה הכי חשוב לך לראות?', longResp: 'אני אשלח. רק תגיד לי מה הכי חשוב לך לראות בחומר - שאוכל להדגיש את זה. כי חומר כללי בדרך כלל לא משכנע.', assertive: 'אני יכול לשלוח חומר, אבל אתה והו יודעים שזה בדרך כלל נגמר בלי תגובה. בוא נדבר 5 דקות במקום.', soft: 'בטח. אשלח ונדבר אחר כך.', question: 'מה הדבר הספציפי שאתה רוצה לראות בחומר?', whatsapp: 'הנה הסיכום שביקשת. רוצה לקבוע 10 דקות לעבור עליו יחד?', whenToRelease: 'מסע פולואפ של 7 ימים' },
            { type: 'אני אחזור אליך', realReason: 'נימוס / לא מעוניין / רוצה להיפטר', shortResp: 'מצוין. מה התאריך הספציפי?', longResp: 'הבנתי. כדי שזה לא יישכח - בוא נסכם על תאריך ספציפי. מתי טוב לך?', assertive: 'יותר טוב שאני אחזור אליך ביום שלישי בבוקר. אחרת זה הופך לקיר שתיקה.', soft: 'בסדר גמור. אם זה ייקח שבוע ולא אצליח להגיע אליך - מותר לי לחזור?', question: 'מה התאריך שאתה יודע שתחזיר?', whatsapp: 'דיברנו שתחזור אלי. רק רציתי לוודא שעדיין רלוונטי לך.', whenToRelease: 'מקסימום 5 ימים בלי מענה → מסע פולואפ' },
            { type: 'ניסיתי בעבר ולא עבד', realReason: 'אכזבה ישנה / אמון נמוך', shortResp: 'מובן. מה לא עבד שם?', longResp: 'ברור שזה מציק. הרבה אנשים ניסו ונפלו, ובדרך כלל לא בגלל שזה לא עובד אלא בגלל שמה שהם עשו לא היה הדבר הנכון להם. בוא נראה מה בדיוק לא עבד.', assertive: 'מה שלא עבד שם הוא לא מה שאנחנו עושים. בוא אסביר.', soft: 'אני מבין שזה מאכזב. תספר לי מה ניסית?', question: 'מה הכי תיסכל אותך מהניסיון ההוא?', whatsapp: 'הסיפור שסיפרת לי על הניסיון הקודם זה בדיוק הסיבה שאנחנו עובדים אחרת. בוא נדבר.', whenToRelease: 'תיאום שיחה לבחינה מחדש' },
        ],
        lostDeals: [
            { client: 'אסף לוי', deal: 18000, reason: 'תזמון', stage: 'אחרי פגישה', rep: 'אופק', source: 'הפניות', date: '2026-05-25', notes: 'בודק בעוד 3 חודשים', recoverable: 'אולי' },
            { client: 'מועדון Y', deal: 9500, reason: 'יקר לי', stage: 'הצעה', rep: 'עמית', source: 'Facebook', date: '2026-05-23', notes: 'לא היה טיפול בהתנגדות', recoverable: 'כן' },
            { client: 'קליניקה X', deal: 18000, reason: 'נעלם', stage: 'פולואפ', rep: 'דנה', source: 'אורגני', date: '2026-05-22', notes: 'הפסיק לענות אחרי הצעה', recoverable: 'כן' },
            { client: 'יזם A', deal: 24000, reason: 'אין אמון', stage: 'פגישה', rep: 'דנה', source: 'Facebook', date: '2026-05-20', notes: 'לא קיבל הוכחה חברתית', recoverable: 'כן' },
            { client: 'חברה B', deal: 42000, reason: 'מתחרה', stage: 'הצעה', rep: 'אופק', source: 'LinkedIn', date: '2026-05-19', notes: 'בחר במתחרה זול יותר', recoverable: 'לא' },
            { client: 'יועץ C', deal: 8500, reason: 'צריך לחשוב', stage: 'אחרי פגישה', rep: 'עמית', source: 'Google', date: '2026-05-18', notes: 'אמר חוזר ולא חזר', recoverable: 'כן' },
            { client: 'משרד D', deal: 15000, reason: 'תקציב', stage: 'הצעה', rep: 'דנה', source: 'Google', date: '2026-05-17', notes: 'אמר אין תקציב', recoverable: 'אולי' },
            { client: 'סטודנט E', deal: 6000, reason: 'לא מתאים', stage: 'שיחה ראשונה', rep: 'עמית', source: 'TikTok', date: '2026-05-15', notes: 'לא קהל יעד', recoverable: 'לא' },
            { client: 'עסק F', deal: 22000, reason: 'נציג לא עשה פולואפ', stage: 'הצעה', rep: 'עמית', source: 'Facebook', date: '2026-05-14', notes: 'נשכח 2 שבועות', recoverable: 'כן' },
            { client: 'לקוח G', deal: 12000, reason: 'לא נסגר צעד ברור', stage: 'אחרי פגישה', rep: 'דנה', source: 'Instagram', date: '2026-05-12', notes: 'לא היה Next step ברור', recoverable: 'כן' },
        ],
        messagesByStatus: [
            { status: 'ליד חדש', tone: 'אסרטיבי', text: 'היי {שם}, ראיתי שהשארת פרטים. אני {שם הנציג}. כדי שלא נבזבז זמן אחד של השני - יש לי 2 שאלות קצרות, ואז נחליט אם יש פה התאמה.' },
            { status: 'לא ענה', tone: 'אסרטיבי', text: 'ניסיתי לתפוס אותך כי השארת פרטים. כדי לא לבזבז זמן - רוצה שאשלח לך 2 שאלות קצרות ונבין אם זה רלוונטי?' },
            { status: 'אחרי פגישה', tone: 'מקצועי', text: 'אחרי הפגישה שלנו הדבר הכי חשוב הוא לא לתת לזה להתקרר. ראינו שיש פה פער ברור בין איפה שאתה לבין לאן שאתה רוצה להגיע. השאלה היא אם אתה רוצה לפתור את זה עכשיו או להמשיך לדחות.' },
            { status: 'יקר לי', tone: 'אסרטיבי', text: 'יקר ביחס למה. אם אתה מסתכל על הסכום זה דבר אחד. אם אתה מסתכל על מה שזה אמור לפתור לך זה דבר אחר. כמה עולה לך להישאר במצב הנוכחי?' },
            { status: 'צריך לחשוב', tone: 'חכם', text: 'בדרך כלל כשמישהו אומר צריך לחשוב, יש משהו אחד שעוצר. או המחיר, או האמון, או התזמון. מה מהם הכי קרוב למה שאתה מרגיש?' },
            { status: 'לא עכשיו', tone: 'גבול', text: 'אני מכבד את ההחלטה. רק תזכור - הבעיה שאתה רוצה לפתור לא תיפתר מעצמה. נתאם מחדש לעוד חודש?' },
            { status: 'נעלם', tone: 'תובנה', text: 'עבר זמן מאז שדיברנו ואני לא יודע איפה זה עומד אצלך היום. אבל אם המטרה עדיין קיימת והבעיה עדיין לא נפתרה, יכול להיות שעכשיו זה דווקא הזמן.' },
            { status: 'אדבר עם אשתי', tone: 'מקצועי', text: 'מצוין. כדי שהשיחה תהיה ברורה, הכנתי לכם סיכום קצר עם כל המספרים. תוכל לשתף ונקבע שיחה משולשת.' },
            { status: 'תזכורת לפני פגישה', tone: 'מקצועי', text: 'תזכורת לפגישה שלנו מחר ב-{שעה}. שלחתי לך את כל מה שצריך להכין מראש. אם משהו לא ברור - תגיד לפני, לא אחרי.' },
            { status: 'לא הגיע לפגישה', tone: 'גבול', text: 'חיכיתי לפגישה היום ולא הגעת. דברים קורים, אני מבין. השאלה היא אם זה תזמון או שזה כבר לא הצמית. תגיד את האמת ונחליט.' },
            { status: 'קיבל הצעה', tone: 'מקצועי', text: 'ההצעה שאצלך תקפה עד {תאריך}. אם יש שאלה - אני כאן. אם משהו לא ברור - בוא נדבר עליו במקום שזה ישב פתוח.' },
            { status: 'החייאה', tone: 'תובנה', text: 'אני יודע שעבר זמן. ראיתי שעדיין לא פתרת את {הבעיה}. אם עכשיו זה הזמן הנכון - יש לי הצעה חדשה שיכולה להתאים לך טוב יותר ממה שהיה.' },
        ],
        automations: [
            { id: 'AS-1', name: 'ליד חדש נכנס → הודעת פתיחה לאישור', trigger: 'lead.created', action: 'create_message_for_approval', status: 'פעיל', requiresApproval: true },
            { id: 'AS-2', name: 'ליד לא ענה 24 שעות → פולואפ', trigger: 'no_response_24h', action: 'create_followup', status: 'פעיל', requiresApproval: true },
            { id: 'AS-3', name: 'ליד חם → התראה לנציג', trigger: 'heat=hot', action: 'notify_rep', status: 'פעיל', requiresApproval: false },
            { id: 'AS-4', name: 'ליד רותח → התראה למנהל', trigger: 'heat=fire', action: 'notify_manager', status: 'פעיל', requiresApproval: false },
            { id: 'AS-5', name: 'נקבעה פגישה → תזכורת 24h לפני', trigger: 'meeting_24h_before', action: 'create_reminder_msg', status: 'פעיל', requiresApproval: true },
            { id: 'AS-6', name: 'לא הגיע לפגישה → הודעת החזרה', trigger: 'meeting_no_show', action: 'create_recovery_msg', status: 'פעיל', requiresApproval: true },
            { id: 'AS-7', name: 'פגישה הסתיימה → משימת פולואפ', trigger: 'meeting_ended', action: 'create_followup_task', status: 'פעיל', requiresApproval: false },
            { id: 'AS-8', name: 'הצעה נשלחה → תזכורת 24h', trigger: 'proposal_sent_24h', action: 'create_followup', status: 'פעיל', requiresApproval: true },
            { id: 'AS-9', name: 'הצעה לא נפתחה 48h → הודעה', trigger: 'proposal_not_opened_48h', action: 'create_smart_msg', status: 'פעיל', requiresApproval: true },
            { id: 'AS-10', name: 'התנגדות יקר לי → תבנית טיפול', trigger: 'objection=price', action: 'suggest_response', status: 'פעיל', requiresApproval: false },
            { id: 'AS-11', name: 'לא נסגר 30 ימים → מסע החייאה', trigger: 'lost_30d', action: 'enter_revival_journey', status: 'כבוי', requiresApproval: true },
            { id: 'AS-12', name: 'נציג לא טיפל ב-4h → התראה למנהל', trigger: 'rep_no_action_4h', action: 'notify_manager', status: 'פעיל', requiresApproval: false },
        ],
        bizTypes: [
            { id: 'consulting', name: 'ייעוץ / אימון', icon: '💼', focus: 'אבחון, פער, פגישת עומק, סגירה לתהליך, טיפול בהשקעה', stages: ['ליד','אבחון','שיחת התאמה','פגישה','סגירה','אונבורדינג'] },
            { id: 'kitchens', name: 'מטבחים / נגרות / עיצוב פנים', icon: '🪑', focus: 'פרויקט, מדידות, הצעה, פגישת showroom, סגירה במקדמה', stages: ['ליד','שאלון','תמונות+מדידות','פגישה','הצעה','אישור','מקדמה'] },
            { id: 'clinic', name: 'קליניקה / מרפאה', icon: '🏥', focus: 'תור, דחיפות, אמון, הגעה, טיפול בפחד+מחיר', stages: ['ליד','אבחון בעיה','קביעת תור','תזכורת','בדיקה','תוכנית טיפול','סגירה'] },
            { id: 'law', name: 'משרד עו״ד', icon: '⚖️', focus: 'אמון, דחיפות, תיק, פגישה, הצעה, שירות', stages: ['ליד','שיחת התאמה','פגישה','הצעה','חתימה','פתיחת תיק'] },
            { id: 'accounting', name: 'משרד רואה חשבון', icon: '🧮', focus: 'אמון, דיווח חודשי, פגישה, הצעה, שירות שוטף', stages: ['ליד','שיחה','פגישה','הצעה','מעבר רו״ח','קליטה'] },
            { id: 'agency', name: 'סוכנות שיווק', icon: '📣', focus: 'תוצאות, הוכחה, ROI, פגישה אסטרטגית, הצעה, פולואפ ארוך', stages: ['ליד','אבחון','פגישת אסטרטגיה','הצעה','התנגדות','סגירה'] },
            { id: 'course', name: 'קורסים דיגיטליים', icon: '🎓', focus: 'חלום, שייכות, תוצאה, עדויות, פחד מהתחייבות, סגירה מהירה', stages: ['ליד','שיחה קצרה','הצעה','סגירה מיידית','גישה לתכנים'] },
            { id: 'b2b', name: 'חברת B2B', icon: '🏢', focus: 'מקבל החלטה, תקציב, אישור פנימי, ROI, פולואפ ארוך', stages: ['ליד','גילוי','פגישה','הצעה','משא ומתן','חתימה','קליטה'] },
            { id: 'service', name: 'עסק שירות כללי', icon: '🛎️', focus: 'אבחון, פתרון, הצעה, התחלת שירות', stages: ['ליד','שיחה','פגישה','הצעה','סגירה','אונבורדינג'] },
            { id: 'project', name: 'עסק פרויקטים', icon: '🏗️', focus: 'אבני דרך, אישורים, מקדמות, מסירה', stages: ['ליד','אבחון','הצעה','חתימה','מקדמה','ביצוע'] },
            { id: 'family', name: 'עסק משפחתי', icon: '👨‍👩‍👧', focus: 'אישי, אמון, גמישות, החלטות זוגיות', stages: ['ליד','שיחה','פגישה','הצעה','החלטה','סגירה'] },
            { id: 'highticket', name: 'High-Ticket (10K+)', icon: '💎', focus: 'אבחון עמוק, פגישת עומק, ROI, סגירה אישית', stages: ['ליד','שיחת סינון','פגישת אבחון','פגישת אסטרטגיה','הצעה','סגירה'] },
        ],
        reports: [
            { name: 'דוח יומי - 26 במאי', desc: 'לידים שנכנסו, טופלו, פולואפים, סגירות', lastGen: '2026-05-26', status: 'מעודכן' },
            { name: 'דוח שבועי', desc: 'תמונת מצב מכירות שבועית', lastGen: '2026-05-25', status: 'מעודכן' },
            { name: 'דוח חודשי', desc: 'KPIs מלאים + ניתוח חודש', lastGen: '2026-05-25', status: 'מעודכן' },
            { name: 'דוח לידים', desc: 'מקור, איכות, סטטוסים', lastGen: '2026-05-26', status: 'מעודכן' },
            { name: 'דוח פגישות', desc: 'נקבעו, הגיעו, סגרו', lastGen: '2026-05-25', status: 'מעודכן' },
            { name: 'דוח סגירות', desc: 'כמה, מי, איך, מאיזה מקור', lastGen: '2026-05-25', status: 'מעודכן' },
            { name: 'דוח עסקאות אבודות', desc: 'סיבות, נציג, שלב', lastGen: '2026-05-25', status: 'מעודכן' },
            { name: 'דוח התנגדויות', desc: 'איזה התנגדויות הכי שכיחות', lastGen: '2026-05-24', status: 'מעודכן' },
            { name: 'דוח פולואפים', desc: 'בוצעו, פתוחים, כסף שתקוע', lastGen: '2026-05-26', status: 'מעודכן' },
            { name: 'דוח נציגים', desc: 'ביצועים, אחוז סגירה, מחזור', lastGen: '2026-05-25', status: 'מעודכן' },
            { name: 'דוח קמפיינים מול סגירות', desc: 'איזה קמפיין מייצר עסקאות', lastGen: '2026-05-25', status: 'מעודכן' },
            { name: 'דוח פייפליין', desc: 'שווי + סיכוי לפי שלב', lastGen: '2026-05-26', status: 'מעודכן' },
            { name: 'דוח הצעות מחיר', desc: 'נשלחו, נפתחו, נסגרו', lastGen: '2026-05-26', status: 'מעודכן' },
            { name: 'דוח כסף פתוח', desc: 'כמה כסף תקוע בפולואפים', lastGen: '2026-05-26', status: 'מעודכן' },
            { name: 'דוח החייאת לידים', desc: 'הזדמנויות מלידים ישנים', lastGen: '2026-05-25', status: 'מעודכן' },
            { name: 'דוח זמן תגובה', desc: 'מי עונה מהר, מי איטי', lastGen: '2026-05-26', status: 'מעודכן' },
            { name: 'דוח מה לעשות מחר', desc: 'תכנון מבוסס נתונים ליום הבא', lastGen: '2026-05-26', status: 'מעודכן' },
        ],
        integrations: [
            { name: 'CRM (Hubspot/Pipedrive/Salesforce)', icon: '📊', cat: 'CRM', status: 'מתוכנן', purpose: 'סנכרון לידים, עסקאות, פעילות' },
            { name: 'WhatsApp Business', icon: '💬', cat: 'תקשורת', status: 'מתוכנן', purpose: 'שליחה+קבלה של הודעות מכירה' },
            { name: 'טלפוניה', icon: '📞', cat: 'תקשורת', status: 'מתוכנן', purpose: 'יומן שיחות + הקלטות' },
            { name: 'הקלטות שיחה', icon: '🎙️', cat: 'תקשורת', status: 'מתוכנן', purpose: 'תמלול אוטומטי + ניתוח' },
            { name: 'ניתוח שיחה', icon: '🧠', cat: 'AI', status: 'מתוכנן', purpose: 'זיהוי טון לקוח + המלצות לנציג' },
            { name: 'מערכת הצעות מחיר', icon: '📄', cat: 'הצעות', status: 'מוכן לחיבור', purpose: 'יצירה ומעקב הצעות' },
            { name: 'מערכת תשלומים', icon: '💳', cat: 'תשלומים', status: 'מתוכנן', purpose: 'גבייה דיגיטלית' },
            { name: 'Meta Ads', icon: '📱', cat: 'קמפיינים', status: 'מתוכנן', purpose: 'סנכרון נתוני קמפיין' },
            { name: 'Google Ads', icon: '🌐', cat: 'קמפיינים', status: 'מתוכנן', purpose: 'סנכרון נתוני קמפיין' },
            { name: 'מייל (Gmail/Outlook)', icon: '📧', cat: 'תקשורת', status: 'מוכן לחיבור', purpose: 'שליחת מיילים' },
            { name: 'יומן (Google/Outlook)', icon: '📅', cat: 'יומן', status: 'מתוכנן', purpose: 'קביעת פגישות אוטומטית' },
            { name: 'סוכן פיננסי', icon: '💰', cat: 'פנימי', status: 'מחובר בעתיד', purpose: 'רווחיות לפי לקוח' },
            { name: 'סוכן תפעול', icon: '⚙️', cat: 'פנימי', status: 'מחובר בעתיד', purpose: 'מעבר אונבורדינג אחרי סגירה' },
            { name: 'סוכן שיווק', icon: '📣', cat: 'פנימי', status: 'מחובר בעתיד', purpose: 'סנכרון קמפיינים+לידים' },
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
        return JSON.parse(JSON.stringify(MOCK_SA));
    }
    function saveState() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE_SA)); } catch (e) {}
    }
    window.STATE_SA = loadState();
    window.MOCK_SA = MOCK_SA;

    function rerender() {
        const active = document.querySelector('.nav-tab.active');
        if (!active) return;
        const tabName = active.dataset.tab;
        const r = TABS_SA[tabName];
        if (r) {
            document.getElementById('content').innerHTML = r();
            if (TABS_SA[tabName + '_after']) TABS_SA[tabName + '_after']();
        }
        saveState();
    }
    window.rerender_sa = rerender;

    function toast(msg, type='info', dur=3000) {
        const c = document.getElementById('toastContainer'); if (!c) return;
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
        t.innerHTML = `<div>${icons[type]||''}</div><div>${msg}</div>`;
        c.appendChild(t);
        setTimeout(() => { t.style.opacity='0'; setTimeout(() => t.remove(), 300); }, dur);
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
        setTimeout(() => { const i = document.querySelector('#modalBody input,#modalBody select,#modalBody textarea'); if (i) i.focus(); }, 50);
    }
    function closeModal() { document.getElementById('modalOverlay').classList.remove('visible'); }
    document.addEventListener('click', e => { if (e.target.id === 'modalOverlay') closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
    function confirmModal(t, m, cb, label='אישור', danger=false) {
        openModal(t, `<p style="font-size:14px; line-height:1.6;">${m}</p>`, [
            { label: 'ביטול', onclick: closeModal },
            { label, class: danger ? 'danger' : 'primary', onclick: () => { closeModal(); cb(); } },
        ]);
    }
    function detailsModal(title, fields) {
        const html = fields.map(f => `<div class="detail-row"><div class="detail-label">${f.label}</div><div class="detail-value">${f.value}</div></div>`).join('');
        openModal(title, html, [{ label: 'סגור', onclick: closeModal }]);
    }
    function todayISO() { return new Date().toISOString().slice(0,10); }
    function genId(p) { return p + '-' + Date.now().toString(36).slice(-6); }

    window.SA = {
        openModal, closeModal, toast, confirmModal, detailsModal,

        quickAdd() {
            openModal('הוסף פעולה', `
                <p style="font-size:13px; color:var(--text-soft); margin-bottom:16px;">מה תרצה להוסיף?</p>
                <div class="grid grid-cols-2" style="gap:10px;">
                    <button class="btn primary" style="padding:14px;" onclick="SA.closeModal(); SA.addLead();">👤 ליד חדש</button>
                    <button class="btn" style="padding:14px;" onclick="SA.closeModal(); SA.addProposal();">📄 הצעת מחיר</button>
                    <button class="btn" style="padding:14px;" onclick="SA.closeModal(); SA.addFollowup();">🔁 פולואפ</button>
                    <button class="btn" style="padding:14px;" onclick="SA.closeModal(); SA.addAutomation();">⚡ אוטומציה</button>
                </div>
            `, []);
        },

        // ============ LEADS ============
        addLead() {
            openModal('ליד חדש', `
                <div class="form-row">
                    <div class="form-group"><label>שם</label><input id="l_name" type="text"></div>
                    <div class="form-group"><label>טלפון</label><input id="l_phone" type="tel" placeholder="054-..."></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>אימייל</label><input id="l_email" type="email"></div>
                    <div class="form-group"><label>שם עסק</label><input id="l_biz" type="text"></div>
                </div>
                <div class="form-row cols-3">
                    <div class="form-group"><label>מקור</label><select id="l_source"><option>Facebook</option><option>Google</option><option>LinkedIn</option><option>Instagram</option><option>TikTok</option><option>אורגני</option><option>הפניות</option><option>ידני</option></select></div>
                    <div class="form-group"><label>נציג</label><select id="l_rep">${STATE_SA.reps.map(r => `<option>${r.name}</option>`).join('')}</select></div>
                    <div class="form-group"><label>חום</label><select id="l_heat"><option>קר</option><option selected>חם</option><option>רותח</option><option>VIP</option></select></div>
                </div>
                <div class="form-group"><label>הערות</label><textarea id="l_notes" rows="2"></textarea></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'צור ליד', class: 'primary', onclick: () => {
                    const name = document.getElementById('l_name').value.trim();
                    if (!name) { toast('שם חייב', 'error'); return; }
                    STATE_SA.leads.unshift({
                        id: genId('L'), name,
                        phone: document.getElementById('l_phone').value,
                        email: document.getElementById('l_email').value,
                        business: document.getElementById('l_biz').value || name,
                        industry: '-',
                        source: document.getElementById('l_source').value,
                        campaign: '-',
                        created: new Date().toISOString().replace('T', ' ').slice(0, 16),
                        status: 'חדש',
                        heat: document.getElementById('l_heat').value,
                        score: 60, rep: document.getElementById('l_rep').value,
                        firstResponseHours: null, attempts: 0, lastCall: null, lastMessage: null,
                        journeyStage: 'ליד חדש נכנס',
                        pain: '?', desire: '?', budget: '?', revenue: '?', urgency: 'בינונית',
                        expectedObjection: '?', nextAction: 'התקשרות ראשונה',
                        followupDate: todayISO(), closeProbability: 50,
                        notes: document.getElementById('l_notes').value || '-',
                    });
                    closeModal(); rerender();
                    toast(`ליד ${name} נוסף`, 'success');
                }},
            ]);
        },
        viewLead(id) {
            const l = STATE_SA.leads.find(x => x.id === id);
            if (!l) return;
            detailsModal(`ליד ${l.id}`, [
                { label: 'שם', value: l.name },
                { label: 'עסק', value: l.business },
                { label: 'תחום', value: l.industry },
                { label: 'טלפון', value: l.phone },
                { label: 'אימייל', value: l.email },
                { label: 'מקור', value: l.source + ' / ' + l.campaign },
                { label: 'סטטוס', value: l.status },
                { label: 'חום', value: l.heat },
                { label: 'ציון', value: l.score + '/100' },
                { label: 'נציג', value: l.rep },
                { label: 'שלב מסע', value: l.journeyStage },
                { label: 'כאב', value: l.pain },
                { label: 'רצון', value: l.desire },
                { label: 'תקציב', value: l.budget },
                { label: 'מחזור', value: l.revenue },
                { label: 'דחיפות', value: l.urgency },
                { label: 'התנגדות צפויה', value: l.expectedObjection },
                { label: 'פעולה הבאה', value: l.nextAction },
                { label: 'תאריך פולואפ', value: l.followupDate || '-' },
                { label: 'סיכוי סגירה', value: l.closeProbability + '%' },
                { label: 'הערות', value: l.notes },
            ]);
        },
        changeLeadStatus(id, status) {
            const l = STATE_SA.leads.find(x => x.id === id);
            if (!l) return;
            l.status = status;
            if (status === 'אבוד') l.closeProbability = 0;
            rerender();
            toast(`סטטוס: ${status}`, 'info');
        },
        callLead(id) { toast('כפתור חיוג ישולב עם טלפוניה בעתיד', 'info'); },
        whatsappLead(id) {
            const l = STATE_SA.leads.find(x => x.id === id);
            if (!l) return;
            openModal(`הודעת וואטסאפ ל-${l.name}`, `
                <p style="font-size:12px; color:var(--muted); margin-bottom:8px;">⚠️ דורש אישור אנושי לפני שליחה (כשנחבר וואטסאפ)</p>
                <div class="form-group"><label>הודעה</label><textarea id="wa_msg" rows="5">היי ${l.name}, ראיתי שהשארת פרטים. אני רוצה לבדוק אם זה רלוונטי לך - יש לי 2 שאלות קצרות.</textarea></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'אשר לשליחה בעתיד', class: 'primary', onclick: () => { closeModal(); toast(`הודעה הוכנה ל-${l.name} - תישלח כשיחובר וואטסאפ`, 'info', 4000); } },
            ]);
        },
        bookMeetingLead(id) {
            const l = STATE_SA.leads.find(x => x.id === id);
            if (!l) return;
            l.status = 'נקבעה פגישה';
            l.journeyStage = 'הכנה לפגישה';
            rerender();
            toast(`פגישה עם ${l.name} נקבעה`, 'success');
        },
        leadToProposal(id) {
            const l = STATE_SA.leads.find(x => x.id === id);
            if (!l) return;
            STATE_SA.proposals.unshift({
                id: genId('P'), client: l.name, deal: 15000, sent: todayISO(),
                opened: false, openedAt: null, validUntil: '2026-06-10', status: 'נשלח עכשיו',
                rep: l.rep, daysOpen: 0, lastFollowup: null, objection: '-', nextAction: 'מעקב פתיחה',
            });
            l.status = 'הצעה נשלחה';
            l.journeyStage = 'פולואפ אחרי הצעה';
            rerender();
            toast(`הצעת מחיר נוצרה ל-${l.name}`, 'success');
        },
        markLeadLost(id) {
            const l = STATE_SA.leads.find(x => x.id === id);
            if (!l) return;
            openModal(`סמן כאבוד: ${l.name}`, `
                <div class="form-group"><label>סיבה</label><select id="lost_reason">${['יקר לי','תזמון','אין אמון','אין דחיפות','לא הבין את הערך','אדבר עם אשתי','אין תקציב','קיבל הצעה ממתחרה','נציג לא עשה פולואפ','הלקוח נעלם','לא מתאים','אחר'].map(r => `<option>${r}</option>`).join('')}</select></div>
                <div class="form-group"><label>הערה</label><textarea id="lost_note" rows="2"></textarea></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'סמן כאבוד', class: 'danger', onclick: () => {
                    const reason = document.getElementById('lost_reason').value;
                    l.status = 'אבוד';
                    l.closeProbability = 0;
                    STATE_SA.lostDeals.unshift({
                        client: l.name, deal: 15000, reason, stage: l.journeyStage, rep: l.rep,
                        source: l.source, date: todayISO(), notes: document.getElementById('lost_note').value || '-',
                        recoverable: ['יקר לי','תזמון','אדבר עם אשתי','נציג לא עשה פולואפ','הלקוח נעלם'].includes(reason) ? 'כן' : 'לא',
                    });
                    closeModal(); rerender();
                    toast(`${l.name} סומן כאבוד - הוסף ל-lost deals`, 'info');
                }},
            ]);
        },
        startRevival(id) {
            const l = STATE_SA.leads.find(x => x.id === id);
            if (!l) return;
            l.status = 'החייאה';
            l.journeyStage = 'מסע החייאה';
            STATE_SA.followups.unshift({
                id: genId('F'), leadId: l.id, client: l.name, type: 'החייאה - הודעת תובנה',
                dueDate: todayISO(), priority: 'בינונית', rep: l.rep,
                message: `עבר זמן מאז שדיברנו ואני לא יודע איפה זה עומד אצלך היום. אבל אם המטרה עדיין קיימת והבעיה עדיין לא נפתרה, יכול להיות שעכשיו זה דווקא הזמן.`,
                status: 'ממתין לאישור',
            });
            rerender();
            toast(`${l.name} נכנס למסע החייאה`, 'success');
        },

        // ============ PROPOSALS ============
        addProposal() {
            openModal('הצעת מחיר חדשה', `
                <div class="form-row">
                    <div class="form-group"><label>לקוח</label><input id="p_client" type="text"></div>
                    <div class="form-group"><label>סכום ₪</label><input id="p_deal" type="number" placeholder="15000"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>נציג</label><select id="p_rep">${STATE_SA.reps.map(r => `<option>${r.name}</option>`).join('')}</select></div>
                    <div class="form-group"><label>תקף עד</label><input id="p_valid" type="date"></div>
                </div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'צור הצעה', class: 'primary', onclick: () => {
                    const c = document.getElementById('p_client').value.trim();
                    const d = +document.getElementById('p_deal').value;
                    if (!c || !d) { toast('שם וסכום חייבים', 'error'); return; }
                    STATE_SA.proposals.unshift({
                        id: genId('P'), client: c, deal: d, sent: todayISO(), opened: false, openedAt: null,
                        validUntil: document.getElementById('p_valid').value || '2026-06-10',
                        status: 'נשלח עכשיו', rep: document.getElementById('p_rep').value,
                        daysOpen: 0, lastFollowup: null, objection: '-', nextAction: 'מעקב פתיחה',
                    });
                    closeModal(); rerender();
                    toast(`הצעה ל-${c} נוצרה`, 'success');
                }},
            ]);
        },
        viewProposal(id) {
            const p = STATE_SA.proposals.find(x => x.id === id);
            if (!p) return;
            detailsModal(`הצעה ${p.id}`, [
                { label: 'לקוח', value: p.client },
                { label: 'סכום', value: '₪ ' + p.deal.toLocaleString('he-IL') },
                { label: 'נשלחה', value: p.sent },
                { label: 'נפתחה?', value: p.opened ? '✅ ' + p.openedAt : '❌ לא נפתחה' },
                { label: 'תקף עד', value: p.validUntil },
                { label: 'סטטוס', value: p.status },
                { label: 'נציג', value: p.rep },
                { label: 'ימים פתוחה', value: p.daysOpen },
                { label: 'פולואפ אחרון', value: p.lastFollowup || 'אין' },
                { label: 'התנגדות', value: p.objection },
                { label: 'פעולה הבאה', value: p.nextAction },
            ]);
        },
        closeProposal(id) {
            const p = STATE_SA.proposals.find(x => x.id === id);
            if (!p) return;
            confirmModal('סגירת עסקה', `האם הלקוח ${p.client} סגר על הצעה של ₪${p.deal.toLocaleString('he-IL')}?`, () => {
                STATE_SA.proposals = STATE_SA.proposals.filter(x => x.id !== id);
                STATE_SA.kpis.closedDeals.value++;
                STATE_SA.kpis.monthRevenue.value += p.deal;
                rerender();
                toast(`עסקה נסגרה: ${p.client} - ₪${p.deal.toLocaleString('he-IL')}`, 'success');
            }, 'סגור עסקה');
        },
        lostProposal(id) {
            const p = STATE_SA.proposals.find(x => x.id === id);
            if (!p) return;
            STATE_SA.proposals = STATE_SA.proposals.filter(x => x.id !== id);
            STATE_SA.lostDeals.unshift({ client: p.client, deal: p.deal, reason: p.objection || 'לא צוין', stage: 'הצעה', rep: p.rep, source: '-', date: todayISO(), notes: '-', recoverable: 'אולי' });
            rerender();
            toast(`הצעה סומנה כאבודה`, 'info');
        },

        // ============ FOLLOWUPS ============
        addFollowup() {
            openModal('פולואפ חדש', `
                <div class="form-row">
                    <div class="form-group"><label>לקוח</label><input id="f_client" type="text"></div>
                    <div class="form-group"><label>סוג</label><select id="f_type">${['פולואפ אחרי שיחה','פולואפ אחרי פגישה','פולואפ אחרי הצעה','פולואפ אחרי יקר לי','פולואפ אחרי צריך לחשוב','פולואפ אחרי שתיקה','החייאה','אחר'].map(t => `<option>${t}</option>`).join('')}</select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>תאריך</label><input id="f_date" type="date" value="${todayISO()}"></div>
                    <div class="form-group"><label>דחיפות</label><select id="f_p"><option>נמוכה</option><option selected>בינונית</option><option>גבוהה</option><option>קריטית</option></select></div>
                </div>
                <div class="form-group"><label>הודעה (דורש אישור לפני שליחה)</label><textarea id="f_msg" rows="3"></textarea></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'צור פולואפ', class: 'primary', onclick: () => {
                    STATE_SA.followups.unshift({
                        id: genId('F'), leadId: '-',
                        client: document.getElementById('f_client').value,
                        type: document.getElementById('f_type').value,
                        dueDate: document.getElementById('f_date').value,
                        priority: document.getElementById('f_p').value,
                        rep: 'רון',
                        message: document.getElementById('f_msg').value,
                        status: 'ממתין לאישור',
                    });
                    closeModal(); rerender();
                    toast('פולואפ נוצר', 'success');
                }},
            ]);
        },
        approveFollowup(id) {
            const f = STATE_SA.followups.find(x => x.id === id);
            if (!f) return;
            f.status = 'אושר לשליחה';
            rerender();
            toast(`פולואפ אושר - יישלח כשיחובר וואטסאפ/מייל`, 'info', 4000);
        },
        completeFollowup(id) {
            const f = STATE_SA.followups.find(x => x.id === id);
            if (!f) return;
            f.status = 'בוצע';
            rerender();
            toast('פולואפ סומן כבוצע', 'success');
        },
        deleteFollowup(id) {
            STATE_SA.followups = STATE_SA.followups.filter(x => x.id !== id);
            rerender();
            toast('פולואפ נמחק', 'info');
        },

        // ============ AUTOMATIONS ============
        addAutomation() {
            openModal('אוטומציה חדשה', `
                <div class="form-group"><label>שם</label><input id="a_name" type="text" placeholder="ליד חדש → הודעת פתיחה"></div>
                <div class="form-row">
                    <div class="form-group"><label>טריגר</label><select id="a_trig"><option>ליד חדש נכנס</option><option>אין מענה X שעות</option><option>הצעה נשלחה</option><option>פגישה הסתיימה</option><option>התנגדות זוהתה</option></select></div>
                    <div class="form-group"><label>פעולה</label><select id="a_act"><option>יצירת הודעה לאישור</option><option>יצירת פולואפ</option><option>התראה לנציג</option><option>התראה למנהל</option></select></div>
                </div>
                <div class="form-group"><label><input type="checkbox" id="a_appr" checked> דורש אישור אנושי</label></div>
            `, [
                { label: 'ביטול', onclick: closeModal },
                { label: 'צור', class: 'primary', onclick: () => {
                    const name = document.getElementById('a_name').value.trim();
                    if (!name) { toast('שם חייב', 'error'); return; }
                    STATE_SA.automations.unshift({
                        id: genId('AS'), name,
                        trigger: document.getElementById('a_trig').value,
                        action: document.getElementById('a_act').value,
                        status: 'פעיל',
                        requiresApproval: document.getElementById('a_appr').checked,
                    });
                    closeModal(); rerender();
                    toast(`אוטומציה "${name}" נוצרה`, 'success');
                }},
            ]);
        },
        toggleAutomation(id) {
            const a = STATE_SA.automations.find(x => x.id === id);
            if (!a) return;
            a.status = a.status === 'פעיל' ? 'כבוי' : 'פעיל';
            rerender();
            toast(`${a.status === 'פעיל' ? 'הופעלה' : 'כובתה'}: ${a.name}`, 'info');
        },

        // ============ FILTERS ============
        _filters: {},
        setFilter(tab, key, val) {
            if (!this._filters[tab]) this._filters[tab] = {};
            this._filters[tab][key] = val;
            rerender();
        },
        getFilter(tab, key, def='') {
            return (this._filters[tab] && this._filters[tab][key]) || def;
        },
        clearFilters(tab) {
            delete this._filters[tab];
            rerender();
            toast('פילטרים אופסו', 'info');
        },

        // ============ EXPORT ============
        exportToExcel(name) {
            if (typeof XLSX === 'undefined') { toast('SheetJS לא נטען', 'error'); return; }
            const map = {
                'לידים': () => STATE_SA.leads,
                'הצעות': () => STATE_SA.proposals,
                'פולואפים': () => STATE_SA.followups,
                'נציגים': () => STATE_SA.reps,
                'אבודות': () => STATE_SA.lostDeals,
                'אוטומציות': () => STATE_SA.automations,
            };
            const data = map[name] ? map[name]() : STATE_SA.leads;
            try {
                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, name || 'Data');
                XLSX.writeFile(wb, `${name || 'export'}-${todayISO()}.xlsx`);
                toast(`קובץ נורד`, 'success');
            } catch (e) { toast(e.message, 'error'); }
        },

        // ============ MESSAGE OPS ============
        copyMessage(text) {
            navigator.clipboard.writeText(text).then(() => toast('הועתק', 'success')).catch(() => toast('לא ניתן להעתיק', 'error'));
        },

        // ============ RESET ============
        resetDemo() {
            confirmModal('איפוס', 'לחזור לנתוני הדמו? כל השינויים יימחקו.', () => {
                localStorage.removeItem(STORAGE_KEY);
                window.STATE_SA = JSON.parse(JSON.stringify(MOCK_SA));
                rerender();
                toast('אופס לדמו', 'success');
            }, 'אפס', true);
        },

        // ============ REPORTS ============
        viewReport(name) {
            openModal(name, `<p style="font-size:13px; line-height:1.7;"><strong>${name}</strong> - תוכן הדוח יוצג כאן עם נתונים ויזואלים.</p>`, [{ label: 'סגור', onclick: closeModal }]);
        },

        // ============ BIZ TYPE ============
        selectBizType(id) {
            const bt = STATE_SA.bizTypes.find(b => b.id === id);
            if (!bt) return;
            STATE_SA._activeBizType = id;
            rerender();
            toast(`תבנית "${bt.name}" נבחרה`, 'success');
        },

        // ============ CHAT (agentic) ============
        chatHistory: [],
        async sendChatMessage(text) {
            if (!text || !text.trim()) return;
            text = text.trim();
            SA.chatHistory.push({ role: 'user', content: text });
            SA._renderChat();
            SA._showTyping();
            try {
                const snapshot = {
                    today: STATE_SA.today,
                    kpis: { newLeads: STATE_SA.kpis.newLeadsMonth.value, hot: STATE_SA.kpis.hotLeads.value, fire: STATE_SA.kpis.fireLeads.value, untreated: STATE_SA.kpis.untreated.value, openProposals: STATE_SA.kpis.openProposals.value, openFupMoney: STATE_SA.kpis.openFollowupMoney.value, closeRate: STATE_SA.kpis.closeRate.value, monthRevenue: STATE_SA.kpis.monthRevenue.value, pipelineValue: STATE_SA.kpis.pipelineValue.value },
                    hotLeads: STATE_SA.leads.filter(l => l.heat === 'רותח' || l.heat === 'חם').slice(0,10).map(l => ({ id: l.id, name: l.name, status: l.status, score: l.score, rep: l.rep, nextAction: l.nextAction, daysAgo: '?' })),
                    untreated: STATE_SA.leads.filter(l => l.status === 'חדש' || l.status === 'לא ענה').length,
                    openProposals: STATE_SA.proposals.length,
                    overdueFollowups: STATE_SA.followups.filter(f => f.status === 'ממתין לאישור').length,
                    topReps: STATE_SA.reps.slice(0,3).map(r => ({ name: r.name, leads: r.leads, closes: r.closes, closeRate: r.closeRate })),
                    topLostReasons: [...new Set(STATE_SA.lostDeals.map(d => d.reason))].slice(0,3),
                };
                const ctx = `\n\n## מצב מכירות (${snapshot.today})\n\`\`\`json\n${JSON.stringify(snapshot, null, 2)}\n\`\`\`\n`;
                const messages = [...SA.chatHistory.slice(0,-1), { role: 'user', content: text + ctx }];
                const res = await fetch('/api/chat', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages, agent_type: 'sales' }),
                });
                SA._hideTyping();
                if (!res.ok) {
                    SA.chatHistory.push({ role: 'assistant', content: 'שגיאה' });
                    SA._renderChat();
                    return;
                }
                const data = await res.json();
                SA.chatHistory.push({ role: 'assistant', content: data.message || '(אין תוכן)' });
                SA._renderChat();
                SA._processActions(data.message || '');
            } catch (e) {
                SA._hideTyping();
                SA.chatHistory.push({ role: 'assistant', content: `שגיאה: ${e.message}` });
                SA._renderChat();
            }
        },
        _processActions(text) {
            const re = /\[ACTION\]([\s\S]*?)\[\/ACTION\]/g;
            let m, count = 0;
            while ((m = re.exec(text)) !== null) {
                try { const a = JSON.parse(m[1].trim()); if (SA._runAction(a)) count++; } catch (e) {}
            }
            if (count > 0) toast(`${count} פעולות בוצעו על ידי הסוכן`, 'success', 4000);
            rerender();
        },
        _runAction(a) {
            if (!a || !a.type) return false;
            switch (a.type) {
                case 'create_followup':
                    STATE_SA.followups.unshift({
                        id: genId('F'), leadId: a.lead_id || '-', client: a.client || 'לקוח',
                        type: a.followup_type || 'פולואפ',
                        dueDate: a.due || todayISO(),
                        priority: a.priority || 'בינונית',
                        rep: a.assignee || 'רון',
                        message: a.message || '-',
                        status: 'ממתין לאישור',
                    });
                    return true;
                case 'create_task':
                    STATE_SA.followups.unshift({
                        id: genId('F'), leadId: '-', client: a.client || '-',
                        type: a.title || 'משימה',
                        dueDate: a.due || todayISO(),
                        priority: a.priority || 'בינונית',
                        rep: a.assignee || 'רון',
                        message: a.notes || '-',
                        status: 'משימה',
                    });
                    return true;
                case 'mark_lead_lost':
                    const l = STATE_SA.leads.find(x => x.name === a.client || x.id === a.lead_id);
                    if (l) { l.status = 'אבוד'; l.closeProbability = 0; return true; }
                    return false;
                case 'change_lead_status':
                    const lead = STATE_SA.leads.find(x => x.id === a.lead_id || x.name === a.client);
                    if (lead) { lead.status = a.status; return true; }
                    return false;
                default: return false;
            }
        },
        _renderChat() {
            const box = document.getElementById('chatMsgs'); if (!box) return;
            box.innerHTML = SA.chatHistory.map(m => {
                if (m.role === 'user') {
                    const t = m.content.split('## מצב מכירות')[0].trim();
                    return `<div class="chat-msg user">${SA._esc(t)}</div>`;
                }
                let t = m.content.replace(/\[ACTION\]([\s\S]*?)\[\/ACTION\]/g, (_, j) => {
                    try { const a = JSON.parse(j.trim()); return `<div class="agent-action-card"><strong>✅ ${a.type === 'create_followup' ? 'פולואפ נוצר' : a.type === 'create_task' ? 'משימה נוצרה' : a.type}</strong>${a.client || a.title || ''}</div>`; }
                    catch { return ''; }
                });
                t = SA._esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
                return `<div class="chat-msg bot">${t}</div>`;
            }).join('');
            box.scrollTop = box.scrollHeight;
        },
        _showTyping() {
            const box = document.getElementById('chatMsgs'); if (!box) return;
            const t = document.createElement('div');
            t.className = 'chat-typing'; t.id = 'chatTyping';
            t.innerHTML = '<span></span><span></span><span></span>';
            box.appendChild(t); box.scrollTop = box.scrollHeight;
        },
        _hideTyping() { const t = document.getElementById('chatTyping'); if (t) t.remove(); },
        _esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },
        chatSuggestion(text) { SA.sendChatMessage(text); },
        async proactiveOpen() {
            if (SA.chatHistory.length > 0) { SA._renderChat(); return; }
            await SA.sendChatMessage('פתחתי את הצ׳אט. מה 3 הדברים הכי חשובים שאני צריך לעשות היום כדי לסגור יותר?');
        },
    };

    window.addEventListener('beforeunload', saveState);
    setInterval(saveState, 10000);
})();


