/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-14                                               */
/* Description: PDF A4 del catálogo activo ordenado por título.   */
/******************************************************************/

/******************************************************************/
/* Listing Contents: crear_pdf(libros, generado).                  */
/* Reuse Instructions: recibir filas del modelo listado, ya      */
/* filtradas al catálogo activo. Devuelve Buffer sin escribir BD. */
/******************************************************************/

const PDFDocument = require('pdfkit');

const crear_pdf = (libros, generado = new Date()) => new Promise((resolver, rechazar) =>
{
    const documento = new PDFDocument({ size: 'A4', margin: 52, bufferPages: true,
        info: { Title: 'Listado de libros · Biblioteca Ducky' } });
    const fragmentos = [];
    documento.on('data', (fragmento) => fragmentos.push(fragmento));
    documento.on('error', rechazar);
    documento.on('end', () => resolver(Buffer.concat(fragmentos)));

    const encabezado = () =>
    {
        documento.fillColor('#142B45').font('Helvetica-Bold').fontSize(19)
            .text('UNIVERSIDAD DUCKY', 52, 52, { width: 491 });
        documento.fillColor('#172B42').font('Helvetica').fontSize(11)
            .text('Biblioteca universitaria · Listado de libros', 52, 85);
        documento.fillColor('#5C6C80').fontSize(9)
            .text(generado.toLocaleDateString('es-MX', { timeZone: 'America/Monterrey',
                day: 'numeric', month: 'long', year: 'numeric' }) +
                ' · Orden: título ascendente', 52, 105);
    };
    encabezado();
    let altura = 143;
    for (const libro of libros)
    {
        const titulo = String(libro.titulo || 'Sin título');
        const detalle = String(libro.autores || 'Sin autor') + ' · ISBN ' +
            String(libro.isbn || '—');
        const condicion = String(libro.tema || '—') + ' · ' +
            String(libro.editorial || '—') + ' · ' + String(libro.id_libro || '—') +
            ' · ' + String(libro.condicion || 'Sin ejemplares');
        documento.font('Helvetica-Bold').fontSize(11);
        const alto_titulo = documento.heightOfString(titulo, { width: 455 });
        documento.font('Helvetica').fontSize(9);
        const alto_detalle = documento.heightOfString(detalle, { width: 455 });
        const alto_condicion = documento.heightOfString(condicion, { width: 455 });
        const alto_fila = 30 + alto_titulo + alto_detalle + alto_condicion;
        if (altura + alto_fila > 745)
        {
            documento.addPage();
            encabezado();
            altura = 143;
        }
        documento.roundedRect(52, altura, 491, alto_fila, 5).fill('#F5F7FA');
        documento.fillColor('#172B42').font('Helvetica-Bold').fontSize(11)
            .text(titulo, 68, altura + 10, { width: 455 });
        documento.fillColor('#5C6C80').font('Helvetica').fontSize(9)
            .text(detalle, 68, altura + 12 + alto_titulo, { width: 455 });
        documento.text(condicion, 68, altura + 14 + alto_titulo + alto_detalle,
            { width: 455 });
        altura += alto_fila + 9;
    }
    if (altura + 30 > 755)
    {
        documento.addPage();
        encabezado();
        altura = 143;
    }
    documento.fillColor('#5C6C80').font('Helvetica').fontSize(9)
        .text(libros.length + ' registros', 52, altura + 6);
    const paginas = documento.bufferedPageRange().count;
    for (let indice = 0; indice < paginas; indice++)
    {
        documento.switchToPage(indice);
        documento.fillColor('#5C6C80').font('Helvetica').fontSize(9)
            .text('Página ' + (indice + 1) + ' de ' + paginas, 52, 768,
                { width: 491, align: 'right' });
    }
    documento.end();
});

module.exports = { crear_pdf };
