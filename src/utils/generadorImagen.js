import html2canvas from "html2canvas";

export async function generarJPGRecordatorio({ cliente, servicio }) {
    // Creamos un “flyer” invisible en el DOM, lo renderizamos y devolvemos JPG dataURL
    const wrap = document.createElement("div");
    wrap.style.position = "fixed";
    wrap.style.left = "-9999px";
    wrap.style.top = "0";
    wrap.style.width = "800px";
    wrap.style.padding = "28px";
    wrap.style.background = "white";
    wrap.style.fontFamily = "Arial, Helvetica, sans-serif";
    wrap.innerHTML = `
    <div style="display:flex;gap:18px;align-items:center;border:1px solid #eee;border-radius:18px;padding:22px">
      <img src="/logo-brillo-urbano.png" style="width:120px;height:120px;object-fit:contain" />
      <div style="flex:1">
        <div style="font-size:28px;font-weight:800;margin-bottom:6px">Brillo Urbano</div>
        <div style="color:#444;font-size:14px;margin-bottom:14px">Recordatorio de mantenimiento (35 días)</div>

        <div style="display:grid;gap:6px">
          <div><b>Cliente:</b> ${escapeHtml(cliente.nombre || "")}</div>
          <div><b>Dirección:</b> ${escapeHtml(cliente.direccion || "")}</div>
          <div><b>Servicio a repetir:</b> ${escapeHtml(servicio.tipo || "")}</div>
          <div><b>Último servicio:</b> ${escapeHtml(servicio.fechaISO || "")}</div>
          <div><b>Importe último:</b> $${Number(servicio.importe || 0).toLocaleString("es-AR")}</div>
        </div>

        <div style="margin-top:14px;color:#111;font-size:14px">
          Hola ${escapeHtml(cliente.nombre || "")}, ¿cómo estás? Soy Jorge de Brillo Urbano 👋<br/>
          Te escribo para coordinar el mantenimiento programado, ya pasaron 35 días desde el último servicio.
        </div>

        <div style="margin-top:16px;font-size:13px;color:#333">
          WhatsApp: +54 9 223 671 3970 · IG: brillourbano.limpieza
        </div>
      </div>
    </div>
  `;

    document.body.appendChild(wrap);

    const canvas = await html2canvas(wrap, { scale: 2, useCORS: true });
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

    document.body.removeChild(wrap);
    return dataUrl;
}

function escapeHtml(s) {
    return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}