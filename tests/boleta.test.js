/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-13                                               */
/* Description: Boleta PDF y contrato de entrega por Resend.      */
/******************************************************************/

const test = require('node:test');
const assert = require('node:assert/strict');
const boleta_service = require('../services/boletaService');

const prestamo = {
    id_prestamo: 143,
    folio_prestamo: 'PRE-2026-0143',
    solicitante: 'Sofía Torres',
    correo: 'sofia@ducky.edu.mx',
    clave_usuario: '621234',
    titulo: 'Ingeniería de software',
    id_ejemplar: 'L000128-02',
    fecha_prestamo: '2026-10-26',
    fecha_vencimiento: '2026-11-02',
    dias_prestamo: 5,
    multa_diaria: 25
};

test('genera un PDF de una página con datos de préstamo registrado', async () =>
{
    const pdf = await boleta_service.crear_pdf(prestamo);
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.ok(pdf.length > 1500);
});

test('envía únicamente al correo registrado y adjunta el PDF', async () =>
{
    const pdf = await boleta_service.crear_pdf(prestamo);
    let llamada;
    const solicitar = async (url, opciones) =>
    {
        llamada = { url, opciones };
        return { ok: true, json: async () => ({ id: 'email_123' }) };
    };
    const respuesta = await boleta_service.enviar({ key: 'prueba', from: 'Ducky <envios@ejemplo.mx>' },
        prestamo, pdf, solicitar);
    const cuerpo = JSON.parse(llamada.opciones.body);
    assert.equal(llamada.url, 'https://api.resend.com/emails');
    assert.deepEqual(cuerpo.to, ['sofia@ducky.edu.mx']);
    assert.equal(cuerpo.attachments[0].content_type, 'application/pdf');
    assert.deepEqual(Buffer.from(cuerpo.attachments[0].content, 'base64'), pdf);
    assert.match(cuerpo.text, /02\/11\/2026/);
    assert.equal(respuesta.id, 'email_123');
});

test('un rechazo del proveedor nunca devuelve éxito', async () =>
{
    await assert.rejects(boleta_service.enviar({ key: 'prueba', from: 'Ducky <envios@ejemplo.mx>' },
        prestamo, Buffer.from('%PDF-test'), async () => ({ ok: false })),
    /ENVIO_BOLETA_FALLIDO/);
    assert.equal(boleta_service.configuracion_correo({}), null);
});
