// lib/prayerTimes.ts

// --- Simple Prayer Time Calculation ---
// This is a simplified implementation for demonstration purposes.
// For a production app, a more robust library like 'adhan' is recommended.
// This calculation assumes a fixed location (e.g., Bandung, Indonesia).

const COORDS = { latitude: -6.9175, longitude: 107.6191 }; // Bandung, Indonesia
const TIMEZONE = 7; // GMT+7

// Helper functions
const dtr = (d: number) => (d * Math.PI) / 180;
const rtd = (r: number) => (r * 180) / Math.PI;

const calculateSunDeclination = (julianDay: number) => {
    return 0.40954 * Math.sin(0.016906 * (julianDay - 80.086));
};

const calculateTimeEquation = (julianDay: number) => {
    const U = 0.017202 * (julianDay - 80.086);
    return -0.128 * Math.sin(U) - 0.165 * Math.sin(2 * U);
};

const getJulianDay = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day - 1524.5;
};

const getHourAngle = (latitude: number, declination: number, angle: number) => {
    const term = (Math.sin(dtr(-angle)) - Math.sin(dtr(latitude)) * Math.sin(declination)) / (Math.cos(dtr(latitude)) * Math.cos(declination));
    return rtd(Math.acos(term));
};

export const getPrayerTimes = (date: Date) => {
    const julianDay = getJulianDay(date);
    const sunDeclination = calculateSunDeclination(julianDay);
    const timeEquation = calculateTimeEquation(julianDay);

    // Dzuhur
    const dzuhurTime = 12 - timeEquation - (COORDS.longitude / 15 - TIMEZONE);
    const dzuhur = new Date(date);
    dzuhur.setHours(Math.floor(dzuhurTime), Math.floor((dzuhurTime % 1) * 60), 0, 0);

    // Ashar (Shafii)
    const asharAngle = rtd(Math.atan(1 / (1 + Math.tan(dtr(Math.abs(COORDS.latitude - rtd(sunDeclination)))))));
    const asharHourAngle = getHourAngle(COORDS.latitude, sunDeclination, asharAngle);
    const asharTime = dzuhurTime + asharHourAngle / 15;
    const ashar = new Date(date);
    ashar.setHours(Math.floor(asharTime), Math.floor((asharTime % 1) * 60), 0, 0);
    
    // Maghrib
    const maghribHourAngle = getHourAngle(COORDS.latitude, sunDeclination, 0.833);
    const maghribTime = dzuhurTime + maghribHourAngle / 15;
    const maghrib = new Date(date);
    maghrib.setHours(Math.floor(maghribTime), Math.floor((maghribTime % 1) * 60), 0, 0);

    // Isya
    const isyaHourAngle = getHourAngle(COORDS.latitude, sunDeclination, 18); // Using 18 degrees for Isya
    const isyaTime = dzuhurTime + isyaHourAngle / 15;
    const isya = new Date(date);
    isya.setHours(Math.floor(isyaTime), Math.floor((isyaTime % 1) * 60), 0, 0);

    // Subuh
    const subuhHourAngle = getHourAngle(COORDS.latitude, sunDeclination, 20); // Using 20 degrees for Fajr/Subuh
    const subuhTime = dzuhurTime - subuhHourAngle / 15;
    const subuh = new Date(date);
    subuh.setHours(Math.floor(subuhTime), Math.floor((subuhTime % 1) * 60), 0, 0);

    return {
        subuh,
        dzuhur,
        ashar,
        maghrib,
        isya,
    };
};