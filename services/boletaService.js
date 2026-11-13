/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-13                                               */
/* Description: PDF y entrega por correo de boletas de préstamo.  */
/******************************************************************/

/******************************************************************/
/* Listing Contents: crear_pdf, configuracion_correo, enviar.      */
/* Reuse Instructions: recibir solo detalle consultado en BD.     */
/* crear_pdf devuelve Buffer; enviar usa el correo registrado.    */
/* No registrar la llave, el correo ni el PDF en bitácoras.       */
/******************************************************************/

const PDFDocument = require('pdfkit');
const crypto = require('node:crypto');

const fecha = (valor) =>
{
    const partes = String(valor || '').slice(0, 10).split('-');
    return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : String(valor || '');
};

const crear_pdf = (prestamo) => new Promise((resolver, rechazar) =>
{
    const documento = new PDFDocument({ size: 'A4', margin: 52, info:
        { Title: 'Boleta de préstamo ' + prestamo.folio_prestamo } });
    const fragmentos = [];
    documento.on('data', (fragmento) => fragmentos.push(fragmento));
    documento.on('error', rechazar);
    documento.on('end', () => resolver(Buffer.concat(fragmentos)));

    documento.rect(0, 0, 595, 132).fill('#142B45');
    documento.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22)
        .text('Universidad Ducky', 52, 49);
    documento.font('Helvetica').fontSize(11).text('Biblioteca universitaria', 52, 81);
    documento.fillColor('#172B42').font('Helvetica-Bold').fontSize(21)
        .text('Boleta de préstamo', 52, 166);
    documento.font('Helvetica').fontSize(11).fillColor('#5C6C80')
        .text('Conserva este comprobante y revisa la fecha de vencimiento.', 52, 197);

    const campos = [
        ['Folio', prestamo.folio_prestamo],
        ['Solicitante', prestamo.solicitante],
        ['Matrícula o nómina', prestamo.clave_usuario],
        ['Libro', prestamo.titulo],
        ['Ejemplar', prestamo.id_ejemplar],
        ['Fecha de préstamo', fecha(prestamo.fecha_prestamo)],
        ['Vencimiento', fecha(prestamo.fecha_vencimiento) + ' · ' +
            prestamo.dias_prestamo + ' días hábiles']
    ];
    let altura = 247;
    for (const [etiqueta, valor] of campos)
    {
        documento.roundedRect(52, altura, 491, 55, 5).fill('#F5F7FA');
        documento.fillColor('#5C6C80').font('Helvetica-Bold').fontSize(9)
            .text(etiqueta, 66, altura + 8, { width: 465 });
        documento.fillColor('#172B42').font('Helvetica').fontSize(11)
            .text(String(valor || ''), 66, altura + 25, { width: 465, height: 25, ellipsis: true });
        altura += 64;
    }
    documento.fillColor('#142B45').font('Helvetica-Bold').fontSize(10)
        .text('Recuerda la fecha de vencimiento', 52, 715);
    documento.font('Helvetica').fontSize(9).text(
        'Cada día natural de atraso genera una multa de $' +
        Number(prestamo.multa_diaria || 0).toFixed(2) +
        '. Puedes renovar el préstamo antes de que venza.',
        52, 735, { width: 491 });
    documento.end();
});

const configuracion_correo = (entorno = process.env) =>
{
    if (!entorno.RESEND_API_KEY || !entorno.RECOVERY_FROM) return null;
    return { key: entorno.RESEND_API_KEY, from: entorno.RECOVERY_FROM };
};

const enviar = async (configuracion, prestamo, pdf, solicitar = fetch) =>
{
    const respuesta = await solicitar('https://api.resend.com/emails', {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: {
            Authorization: 'Bearer ' + configuracion.key,
            'Content-Type': 'application/json',
            'Idempotency-Key': 'boleta/' + prestamo.id_prestamo + '/' +
                crypto.createHash('sha256').update(prestamo.correo + '/' +
                    prestamo.fecha_vencimiento).digest('hex')
        },
        body: JSON.stringify({
            from: configuracion.from,
            to: [prestamo.correo],
            subject: 'Boleta de préstamo · Biblioteca Ducky',
            text: 'Tu préstamo ' + prestamo.folio_prestamo + ' vence el ' +
                fecha(prestamo.fecha_vencimiento) + '. La boleta está adjunta en PDF.',
            attachments: [{ filename: 'Boleta-' + prestamo.folio_prestamo + '.pdf',
                content: pdf.toString('base64'), content_type: 'application/pdf' }]
        })
    });
    if (!respuesta.ok) throw new Error('ENVIO_BOLETA_FALLIDO');
    return respuesta.json();
};

module.exports = { crear_pdf, configuracion_correo, enviar };
