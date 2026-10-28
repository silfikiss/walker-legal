// Приём заявок с сайта walkerlegal.ru в Yandex Cloud Functions (Node.js 22).
// 1) сохраняет заявку с отметкой о согласии в приватный бакет-архив (Object Storage);
// 2) отправляет письмо через Yandex Cloud Postbox.
// Доступ — через сервисный аккаунт функции (роли storage.uploader и postbox.sender), ключей в коде нет.
//
// Переменные окружения функции:
//   MAIL_TO        — куда слать заявки, например walkerlegal@yandex.ru
//   MAIL_FROM      — подтверждённый в Postbox адрес, например site@walkerlegal.ru
//   ARCHIVE_BUCKET — имя приватного бакета-архива
//   ALLOWED_ORIGIN — https://walkerlegal.ru

const MAX_BODY = 20000;

exports.handler = async function (event, context) {
    const origin = process.env.ALLOWED_ORIGIN || 'https://walkerlegal.ru';
    const cors = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json; charset=utf-8'
    };
    const reply = (statusCode, obj) => ({ statusCode, headers: cors, body: JSON.stringify(obj) });

    if (event.httpMethod === 'OPTIONS') return reply(204, {});
    if (event.httpMethod !== 'POST') return reply(405, { success: false });

    let raw = event.body || '';
    if (event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');
    if (raw.length > MAX_BODY) return reply(413, { success: false });

    let data;
    try { data = JSON.parse(raw); } catch { return reply(400, { success: false }); }
    if (!data || typeof data !== 'object') return reply(400, { success: false });

    // Ловушка для ботов: скрытая галочка на форме.
    if (data.botcheck === true) return reply(200, { success: true });

    const consent = data['Согласие на обработку ПД'];
    if (!consent) return reply(400, { success: false, message: 'Нет согласия на обработку ПД' });

    const skip = new Set(['access_key', 'botcheck', 'subject', 'from_name', 'replyto']);
    const fields = Object.entries(data)
        .filter(([k, v]) => !skip.has(k) && v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [String(k).slice(0, 200), String(v).slice(0, 4000)]);

    const token = context && context.token && context.token.access_token;
    if (!token) return reply(500, { success: false });

    const now = new Date();
    const id = now.toISOString().replace(/[:.]/g, '-') + '-' + Math.random().toString(36).slice(2, 8);
    const record = {
        id,
        received_at: now.toISOString(),
        ip: (event.requestContext && event.requestContext.identity && event.requestContext.identity.sourceIp) || null,
        user_agent: (event.headers && (event.headers['User-Agent'] || event.headers['user-agent'])) || null,
        fields: Object.fromEntries(fields)
    };

    // 1. Архив заявки (вместе с отметкой о согласии) — в России, в приватном бакете.
    const bucket = process.env.ARCHIVE_BUCKET;
    if (bucket) {
        const put = await fetch(`https://storage.yandexcloud.net/${bucket}/requests/${now.toISOString().slice(0, 7)}/${id}.json`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(record, null, 2)
        });
        if (!put.ok) {
            console.error('archive failed', put.status, await put.text());
            return reply(502, { success: false });
        }
    }

    // 2. Письмо через Postbox.
    const subject = (data.subject || 'Новая заявка с сайта Walker Legal').toString().slice(0, 200);
    const text = fields.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nНомер заявки: ${id}`;
    const email = {
        FromEmailAddress: `Walker Legal <${process.env.MAIL_FROM}>`,
        Destination: { ToAddresses: [process.env.MAIL_TO] },
        Content: {
            Simple: {
                Subject: { Data: subject, Charset: 'UTF-8' },
                Body: { Text: { Data: text, Charset: 'UTF-8' } }
            }
        }
    };
    const replyTo = (data.replyto || '').toString();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) email.ReplyToAddresses = [replyTo];

    const sent = await fetch('https://postbox.cloud.yandex.net/v2/email/outbound-emails', {
        method: 'POST',
        headers: { 'X-YaCloud-SubjectToken': token, 'Content-Type': 'application/json' },
        body: JSON.stringify(email)
    });
    if (!sent.ok) {
        // Заявка уже в архиве, поэтому клиенту отвечаем успехом, а сбой видно в логах функции.
        console.error('postbox failed', sent.status, await sent.text());
    }

    return reply(200, { success: true, id });
};
