/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Contratos de separación MVC y carga de páginas. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: responsabilidades de capas y arranque HTML. */
/* Reuse Instructions: ejecutar con npm test; no requiere BD. */
/******************************************************************/

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const raiz = path.resolve(__dirname, '..');

function fuentes(carpeta)
{
    return fs.readdirSync(path.join(raiz, carpeta))
        .filter(nombre => nombre.endsWith('.js'))
        .map(nombre => [nombre, fs.readFileSync(path.join(raiz, carpeta, nombre), 'utf8')]);
}

test('MVC: controladores sin SQL/DOM; vistas sin API y modelos cliente sin DOM', () =>
{
    for (const [nombre, codigo] of fuentes('controllers'))
    {
        assert.doesNotMatch(codigo, /\b(?:pool|client)\.query\s*\(/, nombre);
    }
    for (const [nombre, codigo] of fuentes('frontend/js/controllers'))
    {
        assert.doesNotMatch(codigo, /\bdocument\s*\./, nombre);
        assert.doesNotMatch(codigo, /\b(?:fetch\s*\(|api\.)/, nombre);
    }
    for (const [nombre, codigo] of fuentes('frontend/js/views'))
    {
        assert.doesNotMatch(codigo, /\b(?:fetch\s*\(|api\.|\w+_model\.)/, nombre);
    }
    for (const [nombre, codigo] of fuentes('frontend/js/models'))
    {
        assert.doesNotMatch(codigo, /\bdocument\s*\./, nombre);
    }
});

test('páginas: scripts locales existen, cargan juntos y exponen su controlador de inicio', () =>
{
    const carpeta = path.join(raiz, 'frontend');
    for (const nombre of fs.readdirSync(carpeta).filter(nombre => nombre.endsWith('.html')))
    {
        const html = fs.readFileSync(path.join(carpeta, nombre), 'utf8');
        const contexto = vm.createContext({ console, URLSearchParams });
        for (const script of html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g))
        {
            const archivo = path.join(carpeta, script[1]);
            assert.ok(fs.existsSync(archivo), nombre + ': ' + script[1]);
            vm.runInContext(fs.readFileSync(archivo, 'utf8'), contexto, { filename: archivo });
        }
        for (const inicio of html.matchAll(/\b([a-z_]+_controller)\.iniciar\(/g))
        {
            assert.equal(vm.runInContext('typeof ' + inicio[1] + '.iniciar', contexto), 'function', nombre);
        }
        assert.doesNotMatch(html, /\b[A-Z][A-Za-z]+Controller\.iniciar\(/, nombre);
    }
});
