// lib/performance.ts
import type { UserData, AttendanceRecord, PointLogEntry, PerformanceScore, Sanction, PrayerRecord } from '../types';

/**
 * Calculates a user's performance score based on attendance, sanctions, and manual points.
 * This function is designed to be idempotent and can be run to recalculate the entire score from scratch.
 * @param user The user object, which contains manual point history and sanctions.
 * @param attendanceRecords The complete list of attendance records.
 * @param prayerRecords The complete list of prayer records.
 * @returns An object containing the calculated score and the full, sorted point history.
 */
export const calculatePerformanceScore = (user: UserData, attendanceRecords: AttendanceRecord[], prayerRecords: PrayerRecord[]): { score: PerformanceScore, history: PointLogEntry[] } => {
    let automaticLog: PointLogEntry[] = [];
    // Each core category (Punctuality, Discipline) starts with a base of 50 points
    const STARTING_POINTS = 50; 

    // 1. Generate Punctuality Log from Attendance
    const userAttendance = attendanceRecords.filter(r => r.userId === user.uid);
    for (const record of userAttendance) {
        if (record.status === 'Hadir') {
            const clockIn = new Date(record.clockInTimestamp);
            const officialStart = new Date(record.date);
            officialStart.setHours(8, 0, 0, 0);
            const lateMinutes = (clockIn.getTime() - officialStart.getTime()) / (1000 * 60);

            if (lateMinutes > 5) { // 5-minute tolerance
                automaticLog.push({ id: `att-late-${record.id}`, date: record.date, points: -1, category: 'punctuality', reason: `Terlambat ${Math.round(lateMinutes)} menit` });
            } else {
                automaticLog.push({ id: `att-ontime-${record.id}`, date: record.date, points: 2, category: 'punctuality', reason: 'Tepat waktu' });
            }
        } else if (record.status === 'Alfa') {
            automaticLog.push({ id: `att-alfa-${record.id}`, date: record.date, points: -5, category: 'punctuality', reason: 'Alfa (tidak hadir)' });
        }
    }

    // 2. Generate Discipline Log from Sanctions and Prayer Records
    if (user.sanctions) {
        for (const sanction of user.sanctions) {
            let points = 0;
            let reason = '';
            if (sanction.type === 'warning') {
                points = -10;
                reason = 'Sanksi: Peringatan';
            } else if (sanction.type === 'suspension') {
                points = -25;
                reason = 'Sanksi: Skorsing';
            }
            if(points !== 0) {
                 automaticLog.push({ id: `san-${sanction.id}`, date: sanction.date, points, category: 'discipline', reason });
            }
        }
    }

    const userPrayers = prayerRecords.filter(p => p.userId === user.uid);
    for (const prayer of userPrayers) {
        if (prayer.status === 'on_time') {
            automaticLog.push({ id: `pray-${prayer.id}`, date: prayer.date, points: 1, category: 'discipline', reason: `Sholat ${prayer.prayerName} Tepat Waktu` });
        }
    }
    
    // 3. Combine automatic log with manually added points from user data.
    // We only preserve manual points from the existing history, as automatic ones are recalculated.
    const manualPoints = user.pointHistory?.filter(p => 
        p.category === 'initiative' || p.category === 'productivity' || p.category === 'adjustment'
    ) || [];

    const fullHistory = [...manualPoints, ...automaticLog]
        .filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i) // Remove duplicates by ID
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 4. Calculate breakdown and total from the full history
    const punctualityPoints = STARTING_POINTS + fullHistory.filter(p => p.category === 'punctuality').reduce((sum, p) => sum + p.points, 0);
    const disciplinePoints = STARTING_POINTS + fullHistory.filter(p => p.category === 'discipline').reduce((sum, p) => sum + p.points, 0);
    const productivityPoints = fullHistory.filter(p => p.category === 'productivity').reduce((sum, p) => sum + p.points, 0);
    const initiativePoints = fullHistory.filter(p => p.category === 'initiative').reduce((sum, p) => sum + p.points, 0);
    const adjustmentPoints = fullHistory.filter(p => p.category === 'adjustment' || false).reduce((sum, p) => sum + p.points, 0);

    // Total points are a sum of all categories. Productivity and Initiative are bonuses, so they start from 0.
    const totalPoints = punctualityPoints + disciplinePoints + productivityPoints + initiativePoints + adjustmentPoints;

    const score: PerformanceScore = {
        totalPoints: Math.max(0, totalPoints), // Score cannot be negative
        breakdown: {
            punctuality: Math.max(0, punctualityPoints),
            discipline: Math.max(0, disciplinePoints),
            productivity: productivityPoints,
            initiative: initiativePoints,
        },
        lastUpdated: new Date().toISOString()
    };
    
    return { score, history: fullHistory };
};