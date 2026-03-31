import { useState, useEffect, useMemo } from "react";
import { crearCliente } from "../services/clientesService";
import { crearServicioProgramado } from "../services/serviciosService";
import { db } from "../firebase/config";
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc
} from "firebase/firestore";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

const COL = "prospectos";

export default function Calendarios({ user, onBack }) {

    const [prospectos, setProspectos] = useState([]);
    const [msg, setMsg] = useState("");
    const [editandoId, setEditandoId] = useState(null);
    const [tab, setTab] = useState("visitas");

    const [form, setForm] = useState({
        nombre: "",
        telefono: "",
        direccion: "",
        fecha: "",
        hora: "",
        contacto: "",
        contactoOtro: ""
    });

    useEffect(() => {

        const q = query(
            collection(db, COL),
            orderBy("createdAt", "desc")
        );

        return onSnapshot(q, (snap) => {

            const items = snap.docs.map((d) => ({
                id: d.id,
                ...d.data()
            }));

            setProspectos(items);

        });

    }, []);

    function change(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function guardar() {

        if (!form.nombre || !form.fecha) return;

        try {

            if (editandoId) {

                const actual = prospectos.find((p) => p.id === editandoId);

                const ref = doc(db, COL, editandoId);

                await updateDoc(ref, {
                    ...form,
                    estado: actual?.estado || "visita"
                });

                setMsg("Prospecto actualizado ✅");

            } else {

                await addDoc(collection(db, COL), {
                    ...form,
                    estado: "visita",
                    createdAt: serverTimestamp(),
                    createdBy: user?.uid || null
                });

                setMsg("Prospecto creado ✅");

            }

            setForm({
                nombre: "",
                telefono: "",
                direccion: "",
                fecha: "",
                hora: "",
                contacto: "",
                contactoOtro: ""
            });

            setEditandoId(null);

            setTimeout(() => setMsg(""), 2000);

        } catch {

            setMsg("Error guardando");

        }

    }

    function editar(p) {

        setForm({
            nombre: p.nombre || "",
            telefono: p.telefono || "",
            direccion: p.direccion || "",
            fecha: p.fecha || "",
            hora: p.hora || "",
            contacto: p.contacto || "",
            contactoOtro: p.contactoOtro || ""
        });

        setEditandoId(p.id);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }



    function agendarEnCalendario(p) {
        if (!p?.fecha) return;

        const titulo = `Visita Brillo Urbano - ${p.nombre || ""}`;
        const descripcion = `Dirección: ${p.direccion || ""}`;
        const ubicacion = p.direccion || "";

        const inicio = dayjs(`${p.fecha} ${p.hora || "00:00"}`).format("YYYYMMDDTHHmmss");
        const fin = dayjs(`${p.fecha} ${p.hora || "00:00"}`).add(1, "hour").format("YYYYMMDDTHHmmss");

        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${inicio}/${fin}&details=${encodeURIComponent(descripcion)}&location=${encodeURIComponent(ubicacion)}`;

        window.open(url, "_blank");
    }

    function abrirWhatsapp(telefono) {

        if (!telefono) return;

        let tel = telefono.replace(/\D/g, "");

        if (!tel.startsWith("54")) tel = "54" + tel;

        window.open(`https://wa.me/${tel}`, "_blank");

    }

    async function programar(p) {

        try {

            const clienteId = await crearCliente({
                nombre: p.nombre,
                telefono: p.telefono,
                direccion: p.direccion,
                notas: "Cliente generado desde agenda de prospectos"
            }, user);

            await crearServicioProgramado({
                clienteId: clienteId,
                nombreCliente: p.nombre,
                telefono: p.telefono,
                direccion: p.direccion,
                fecha: p.fecha,
                hora: p.hora,
                importe: Number(p.presupuesto || 0),
                servicios: [],
                serviciosTexto: "",
                notas: ""
            }, user);

            await deleteDoc(doc(db, COL, p.id));

            setMsg("Servicio programado ✅");

            setTimeout(() => setMsg(""), 2000);

        } catch {

            setMsg("Error programando servicio");

        }

    }

    async function pasarAPendientes(p) {

        try {

            const precioActual = p.presupuesto ? String(p.presupuesto) : "";
            const presupuestoIngresado = window.prompt(
                "¿Cuánto le pasaste de presupuesto? (solo número)",
                precioActual
            );

            if (presupuestoIngresado === null) return;

            const limpio = String(presupuestoIngresado).replace(/[^\d]/g, "");

            if (!limpio) {
                setMsg("Tenés que cargar un presupuesto para pasarlo a pendientes");
                setTimeout(() => setMsg(""), 2500);
                return;
            }

            const ref = doc(db, COL, p.id);

            await updateDoc(ref, {
                estado: "pendiente",
                presupuesto: Number(limpio)
            });

            setMsg("Pasado a pendientes ✅");

            setTimeout(() => setMsg(""), 2000);

        } catch {

            setMsg("Error moviendo a pendientes");

        }

    }

    async function volverAVisitas(p) {

        try {

            const ref = doc(db, COL, p.id);

            await updateDoc(ref, {
                estado: "visita"
            });

            setMsg("Volvió a visitas ✅");

            setTimeout(() => setMsg(""), 2000);

        } catch {

            setMsg("Error moviendo a visitas");

        }

    }

    const visitas = useMemo(() => {
        return prospectos.filter((p) => (p.estado || "visita") === "visita");
    }, [prospectos]);

    const pendientes = useMemo(() => {
        return prospectos.filter((p) => p.estado === "pendiente");
    }, [prospectos]);

    const visitasOrdenadas = useMemo(() => {
        return [...visitas].sort((a, b) => {
            const da = dayjs(`${a.fecha || ""} ${a.hora || "00:00"}`);
            const dbb = dayjs(`${b.fecha || ""} ${b.hora || "00:00"}`);
            return da - dbb;
        });
    }, [visitas]);

    const visitasAgrupadas = useMemo(() => {
        return visitasOrdenadas.reduce((acc, p) => {
            const key = p.fecha || "sin_fecha";
            if (!acc[key]) acc[key] = [];
            acc[key].push(p);
            return acc;
        }, {});
    }, [visitasOrdenadas]);

    function getFechaHeader(fecha) {

        if (fecha === "sin_fecha") {
            return {
                texto: "Sin fecha",
                estilo: fechaSinFecha
            };
        }

        const hoy = dayjs().startOf("day");
        const d = dayjs(fecha).startOf("day");

        if (d.isSame(hoy)) {
            return {
                texto: "HOY",
                estilo: fechaHoy
            };
        }

        if (d.isAfter(hoy)) {
            return {
                texto: d.format("dddd DD [de] MMMM"),
                estilo: fechaFutura
            };
        }

        return {
            texto: d.format("dddd DD [de] MMMM"),
            estilo: fechaPasada
        };
    }

    return (

        <div style={{ padding: 24 }}>

            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                <button onClick={onBack} style={btnLight}>← Volver</button>
                <h2 style={{ margin: 0 }}>Agenda de Prospectos</h2>
            </div>

            <div style={card}>

                <h3>
                    {editandoId ? "Editar prospecto" : "Nuevo prospecto"}
                </h3>

                <div style={{ display: "grid", gap: 10 }}>

                    <input
                        placeholder="Nombre del cliente"
                        name="nombre"
                        value={form.nombre}
                        onChange={change}
                        style={input}
                    />

                    <input
                        placeholder="Teléfono"
                        name="telefono"
                        value={form.telefono}
                        onChange={change}
                        style={input}
                    />

                    <input
                        placeholder="Dirección de la visita"
                        name="direccion"
                        value={form.direccion}
                        onChange={change}
                        style={input}
                    />

                    <input
                        type="date"
                        name="fecha"
                        value={form.fecha}
                        onChange={change}
                        style={input}
                    />

                    <input
                        type="time"
                        name="hora"
                        value={form.hora}
                        onChange={change}
                        style={input}
                    />

                    <select
                        name="contacto"
                        value={form.contacto}
                        onChange={change}
                        style={input}
                    >

                        <option value="">Cómo contactó</option>
                        <option value="telefono personal">Teléfono personal</option>
                        <option value="instagram">Instagram</option>
                        <option value="telefono empresa">Teléfono empresa</option>
                        <option value="otro">Otro</option>

                    </select>

                    {form.contacto === "otro" && (

                        <input
                            placeholder="Especificar"
                            name="contactoOtro"
                            value={form.contactoOtro}
                            onChange={change}
                            style={input}
                        />

                    )}

                    <button onClick={guardar} style={btnPrimary}>
                        {editandoId ? "Actualizar prospecto" : "Guardar visita"}
                    </button>

                </div>

            </div>

            <div style={tabsWrap}>
                <button
                    onClick={() => setTab("visitas")}
                    style={tab === "visitas" ? tabBtnActive : tabBtn}
                >
                    Visitas
                </button>

                <button
                    onClick={() => setTab("pendientes")}
                    style={tab === "pendientes" ? tabBtnActive : tabBtn}
                >
                    Pendientes
                </button>
            </div>

            {tab === "visitas" && (
                <div style={{ marginTop: 20 }}>

                    <h3>Visitas agendadas</h3>

                    <div style={{ display: "grid", gap: 10 }}>

                        {Object.keys(visitasAgrupadas).map((fechaKey) => {

                            const header = getFechaHeader(fechaKey);

                            return (
                                <div key={fechaKey}>

                                    <div style={header.estilo}>
                                        {header.texto}
                                    </div>

                                    <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                                        {visitasAgrupadas[fechaKey].map((p) => (

                                            <div key={p.id} style={row}>

                                                <div>

                                                    <div style={nombre}>
                                                        {p.nombre}
                                                    </div>

                                                    <div style={detalle}>
                                                        📞 {p.telefono}
                                                    </div>

                                                    <div style={detalle}>
                                                        📍 {p.direccion}
                                                    </div>

                                                    <div style={detalle}>
                                                        📅 {p.fecha} {p.hora ? "· " + p.hora : ""}
                                                    </div>

                                                </div>

                                                <div style={accionesBotones}>

                                                    <button
                                                        onClick={() => editar(p)}
                                                        style={btnEdit}
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        onClick={() => abrirWhatsapp(p.telefono)}
                                                        style={btnWhatsapp}
                                                    >
                                                        WhatsApp
                                                    </button>

                                                    <button
                                                        onClick={() => programar(p)}
                                                        style={btnProgramar}
                                                    >
                                                        Programar
                                                    </button>

                                                    <button
                                                        onClick={() => agendarEnCalendario(p)}
                                                        style={{ padding: 10, borderRadius: 10, border: 0, background: "#ff9800", color: "white", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
                                                    >
                                                        📅 Agendar
                                                    </button>

                                                    <button
                                                        onClick={() => pasarAPendientes(p)}
                                                        style={btnPendiente}
                                                    >
                                                        Pendiente
                                                    </button>

                                                </div>

                                            </div>

                                        ))}
                                    </div>

                                </div>
                            );
                        })}

                        {visitas.length === 0 && (
                            <div style={detalle}>
                                No hay visitas agendadas
                            </div>
                        )}

                    </div>

                </div>
            )}

            {tab === "pendientes" && (
                <div style={{ marginTop: 20 }}>

                    <h3>Pendientes de confirmación</h3>

                    <div style={{ display: "grid", gap: 10 }}>

                        {pendientes.map((p) => (

                            <div key={p.id} style={row}>

                                <div>

                                    <div style={nombre}>
                                        {p.nombre}
                                    </div>

                                    <div style={detalle}>
                                        📞 {p.telefono}
                                    </div>

                                    <div style={detalle}>
                                        📍 {p.direccion}
                                    </div>

                                    <div style={detalle}>
                                        📅 {p.fecha || "-"} {p.hora ? "· " + p.hora : ""}
                                    </div>

                                    <div style={detallePresupuesto}>
                                        💰 Presupuesto: {Number(p.presupuesto || 0) > 0
                                            ? "$ " + Number(p.presupuesto || 0).toLocaleString("es-AR")
                                            : "-"}
                                    </div>

                                </div>

                                <div style={accionesBotones}>

                                    <button
                                        onClick={() => editar(p)}
                                        style={btnEdit}
                                    >
                                        Editar
                                    </button>

                                    <button
                                        onClick={() => abrirWhatsapp(p.telefono)}
                                        style={btnWhatsapp}
                                    >
                                        WhatsApp
                                    </button>

                                    <button
                                        onClick={() => agendarEnCalendario(p)}
                                        style={{ padding: 10, borderRadius: 10, border: 0, background: "#ff9800", color: "white", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
                                    >
                                        📅 Agendar
                                    </button>

                                    <button
                                        onClick={() => volverAVisitas(p)}
                                        style={btnVolverVisita}
                                    >
                                        Volver a visitas
                                    </button>

                                    <button
                                        onClick={() => programar(p)}
                                        style={btnProgramar}
                                    >
                                        Programar
                                    </button>

                                </div>

                            </div>

                        ))}

                        {pendientes.length === 0 && (
                            <div style={detalle}>
                                No hay pendientes
                            </div>
                        )}

                    </div>

                </div>
            )}

            {msg && (
                <div style={{ marginTop: 20 }}>
                    {msg}
                </div>
            )}

        </div>

    );

}

const card = {
    background: "white",
    border: "1px solid #eee",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 8px 25px rgba(0,0,0,.05)"
};

const tabsWrap = {
    display: "flex",
    gap: 10,
    marginTop: 22,
    flexWrap: "wrap"
};

const tabBtn = {
    padding: "10px 16px",
    borderRadius: 12,
    border: "1px solid #2a2f37",
    background: "#161a21",
    color: "white",
    cursor: "pointer",
    fontWeight: 700
};

const tabBtnActive = {
    padding: "10px 16px",
    borderRadius: 12,
    border: "1px solid #00c27a",
    background: "#00c27a",
    color: "white",
    cursor: "pointer",
    fontWeight: 700
};

const row = {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 14,
    border: "1px solid #eee",
    borderRadius: 14,
    background: "white"
};

const accionesBotones = {
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: 8
};

const nombre = {
    fontWeight: 700,
    color: "#111"
};

const detalle = {
    fontSize: 13,
    color: "#555"
};

const detallePresupuesto = {
    fontSize: 13,
    color: "#111",
    fontWeight: 700,
    marginTop: 6
};

const input = {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ddd",
    outline: "none",
    width: "100%"
};

const btnPrimary = {
    padding: 10,
    borderRadius: 10,
    border: 0,
    background: "#111",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13
};

const btnProgramar = {
    padding: 10,
    borderRadius: 10,
    border: 0,
    background: "#111",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13
};

const btnEdit = {
    padding: 10,
    borderRadius: 10,
    border: 0,
    background: "#1890ff",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13
};

const btnWhatsapp = {
    padding: 10,
    borderRadius: 10,
    border: 0,
    background: "#25D366",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13
};

const btnPendiente = {
    padding: 10,
    borderRadius: 10,
    border: 0,
    background: "#f0ad00",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13
};

const btnVolverVisita = {
    padding: 10,
    borderRadius: 10,
    border: 0,
    background: "#7c4dff",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13
};

const btnLight = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer"
};

const fechaBase = {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 14,
    textTransform: "capitalize"
};

const fechaHoy = {
    ...fechaBase,
    background: "#f7c948",
    color: "#1f1f1f"
};

const fechaFutura = {
    ...fechaBase,
    background: "#22c55e",
    color: "white"
};

const fechaPasada = {
    ...fechaBase,
    background: "#ef4444",
    color: "white"
};

const fechaSinFecha = {
    ...fechaBase,
    background: "#64748b",
    color: "white"
};