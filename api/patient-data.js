const axios = require('axios');

const DEFAULT_TOKEN = "TD2xCnLqpgYaveSKxSyhFTee2NXb1GtB"; 

export default async function handler(req, res) {
    // Vercel Serverless Function entry point
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { qrCode, token } = req.query;

    if (!qrCode) {
        return res.status(400).json({ error: 'برجاء إرسال كود الـ QR' });
    }

    const cleanToken = (token && token.trim() !== "" && token !== "cen-0d-yyt") ? token.trim() : DEFAULT_TOKEN;

    const headers = {
        'cen-0d-yyt': cleanToken,
        'X-LANG': 'ar',
        'front-end-node': 'production',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Origin': 'https://ul.wasfaty.sa',
        'Referer': `https://ul.wasfaty.sa/${qrCode}`,
        'Sec-Ch-Ua': '"Google Chrome";v="153", "Not_A Brand";v="8", "Chromium";v="153"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site'
    };

    try {
        const patientUrl = `https://ul-api.wasfaty.sa/api/v1/links_generation/get_patient/${qrCode}`;
        const historyUrl = `https://ul-api.wasfaty.sa/api/v1/patient_history/get_patient_history_by_date_range?from_date=01/01/2026&to_date=28/09/2026&url_reference=${qrCode}`;

        const [patientRes, historyRes] = await Promise.allSettled([
            axios.get(patientUrl, { headers, timeout: 10000 }),
            axios.get(historyUrl, { headers, timeout: 10000 })
        ]);

        const patientData = patientRes.status === 'fulfilled' 
            ? patientRes.value.data 
            : { 
                error: 'تعذر جلب البيانات الحالية', 
                status: patientRes.reason?.response?.status || 'No Response',
                details: patientRes.reason?.response?.data || patientRes.reason?.message 
              };

        const historyData = historyRes.status === 'fulfilled' 
            ? historyRes.value.data 
            : { 
                error: 'تعذر جلب التاريخ', 
                status: historyRes.reason?.response?.status || 'No Response',
                details: historyRes.reason?.response?.data || historyRes.reason?.message 
              };

        res.status(200).json({
            success: true,
            patient: patientData,
            history: historyData
        });

    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ غير متوقع في السيرفر الوسيط',
            error: error.message
        });
    }
}
