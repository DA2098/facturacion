import type { Factura } from '../types/index.ts';

function money(v: number) { return `USD ${v.toFixed(2)}`; }

export default function printFactura(f: Factura) {
  if (!f) return;
  const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Factura ${f.numero}</title>
    <style>
      @page { margin: 20mm }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#222; }
      .wrap { max-width:800px; margin:0 auto; padding:20px; }
      header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px }
      .brand { font-weight:700; font-size:22px; color:#0b5fff }
      .small { font-size:12px; color:#666 }
      h1 { margin:0; font-size:18px }
      table { width:100%; border-collapse:collapse; margin-top:12px }
      th,td { padding:8px 6px; border-bottom:1px solid #eee; text-align:left }
      th { background:#fafafa; font-weight:600 }
      .totals { margin-top:12px; float:right; width:300px }
      .totals .row { display:flex; justify-content:space-between; padding:6px 0 }
      .signature { margin-top:80px; text-align:right }
      .sig-name { font-family: 'Brush Script MT', cursive; font-size:28px; color:#222 }
      .sig-company { font-weight:700; color:#0b5fff }
      /* Print friendly */
      @media print { button.print-btn { display:none } }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        <div>
          <div class="brand">FACTS</div>
          <div class="small">Facturación Electrónica</div>
        </div>
        <div style="text-align:right">
          <h1>Factura N° ${f.numero}</h1>
          <div class="small">Fecha: ${f.fecha}</div>
          <div class="small">Estado: ${f.estado}</div>
        </div>
      </header>

      <section>
        <div style="display:flex;justify-content:space-between">
          <div>
            <div class="small">Facturado a</div>
            <div style="font-weight:600">${f.cliente_nombre}</div>
            <div class="small">RUC: ${f.cliente_ruc || ''}</div>
          </div>
          <div>
            <div class="small">Vendedor</div>
            <div style="font-weight:600">${f.vendedor_nombre}</div>
            <div class="small">Método: ${f.metodo_pago}</div>
          </div>
        </div>
      </section>

      <table>
        <thead><tr><th>Código</th><th>Producto</th><th style="width:80px">Cant</th><th style="width:120px">P.Unit</th><th style="width:80px">Imp%</th><th style="width:120px">Subtotal</th></tr></thead>
        <tbody>
          ${f.detalles.map(d => `
            <tr>
              <td class="mono">${d.producto_codigo || ''}</td>
              <td>${d.producto_nombre}</td>
              <td>${d.cantidad}</td>
              <td>${money(d.precio_unitario)}</td>
              <td>${d.impuesto}%</td>
              <td>${money(d.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="row"><span>Subtotal</span><span>${money(f.subtotal)}</span></div>
        <div class="row"><span>Impuesto</span><span>${money(f.impuesto_total)}</span></div>
        <div class="row" style="font-weight:700;font-size:16px"><span>TOTAL</span><span>${money(f.total)}</span></div>
      </div>

      <div style="clear:both"></div>

      <div class="signature">
        <div class="sig-name">FACTS</div>
        <div class="sig-company">Firma autorizada</div>
      </div>

    </div>
    <script>
      setTimeout(() => { window.print(); }, 250);
    </script>
  </body>
  </html>`;

  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) { alert('No se pudo abrir la ventana de impresión. Revisa el bloqueador de pop-ups.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
