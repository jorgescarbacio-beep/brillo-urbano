import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import {
    collection,
    deleteDoc,
    doc,
    addDoc,
    updateDoc,
    serverTimestamp,
    onSnapshot
} from "firebase/firestore";

import { listenServiciosProgramados } from "../services/serviciosService";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

export default function ServiciosProgramados({ onBack, onStartServicio }) {

    const [servicios, setServicios] = useState([]);
    const [clientes, setClientes] = useState([]);

    const [clienteSeleccionado, setClienteSeleccionado] = useState("");
    const [direccionCliente, setDireccionCliente] = useState("");
    const [telefonoCliente, setTelefonoCliente] = useState("");

    const [fechaNueva, setFechaNueva] = useState("");
    const [horaNueva, setHoraNueva] = useState("");
    const [importeNuevo, setImporteNuevo] = useState("");

    const [editando, setEditando] = useState(null);

    const [fechaServicio, setFechaServicio] = useState("");
    const [horaServicio, setHoraServicio] = useState("");
    const [importeServicio, setImporteServicio] = useState("");

    // ===============================
    // SERVICIOS PROGRAMADOS
    // ===============================

    useEffect(() => {
        const unsub = listenServiciosProgramados(setServicios);
        return () => unsub();
    }, []);

    // ===============================
    // CLIENTES
    // ===============================

    useEffect(() => {

        const q = collection(db, "clientes");

        const unsub = onSnapshot(q, (snap) => {

            const lista = snap.docs.map((d) => ({
                id: d.id,
                ...d.data()
            }));

            setClientes(lista);

        });

        return () => unsub();

    }, []);

    function seleccionarCliente(id) {

        setClienteSeleccionado(id);

        const c = clientes.find((x) => x.id === id);

        if (!c) return;

        setDireccionCliente(c.direccion || "");
        setTelefonoCliente(c.telefono || "");

    }

    // ===============================
    // CREAR SERVICIO MANUAL
    // ===============================

    async function crearServicioManual() {

        if (!clienteSeleccionado) return;
        if (!fechaNueva) return;

        const c = clientes.find((x) => x.id === clienteSeleccionado);

        if (!c) return;

        await addDoc(collection(db, "servicios_programados"), {

            clienteId: c.id,
            nombreCliente: c.nombre || "",
            telefono: c.telefono || "",
            direccion: c.direccion || "",
            fecha: fechaNueva,
            hora: horaNueva || "",
            importe: Number(importeNuevo || 0),
            servicios: [],
            serviciosTexto: "",
            notas: "",
            createdAt: serverTimestamp()

        });

        setClienteSeleccionado("");
        setDireccionCliente("");
        setTelefonoCliente("");
        setFechaNueva("");
        setHoraNueva("");
        setImporteNuevo("");

    }

    // ===============================
    // AGRUPAR SERVICIOS
    // ===============================

    const agrupados = servicios.reduce((acc, s) => {

        const key = s.fecha || "sin_fecha";

        if (!acc[key]) acc[key] = [];

        acc[key].push(s);

        return acc;

    }, {});

    // ===============================
    // CANCELAR
    // ===============================

    async function cancelar(id) {
        if (!confirm("¿Cancelar servicio programado?")) return;
        await deleteDoc(doc(db, "servicios_programados", id));
    }

    // ===============================
    // DESHACER
    // ===============================

    async function deshacer(s) {

        await addDoc(collection(db, "prospectos"), {
            nombre: s.nombreCliente || "",
            telefono: s.telefono || "",
            direccion: s.direccion || "",
            fecha: "",
            hora: "",
            contacto: "",
            contactoOtro: "",
            createdAt: serverTimestamp()
        });

        await deleteDoc(doc(db, "servicios_programados", s.id));

    }

    // ===============================
    // EDITAR
    // ===============================

    function editar(s) {

        setEditando(s.id);
        setFechaServicio(s.fecha || "");
        setHoraServicio(s.hora || "");
        setImporteServicio(String(s.importe || ""));

    }

    async function guardar(s) {

        const ref = doc(db, "servicios_programados", s.id);

        await updateDoc(ref, {
            fecha: fechaServicio || "",
            hora: horaServicio || "",
            importe: Number(importeServicio || 0)
        });

        setEditando(null);
        setFechaServicio("");
        setHoraServicio("");
        setImporteServicio("");

    }

    // ===============================
    // INICIAR SERVICIO
    // ===============================

    function agendarEnCalendario(s) {
        if (!s?.fecha) return;

        const titulo = `Servicio Brillo Urbano - ${s.nombreCliente || ""}`;
        const descripcion = `Dirección: ${s.direccion || ""}`;
        const ubicacion = s.direccion || "";

        const inicio = dayjs(`${s.fecha} ${s.hora || "00:00"}`).format("YYYYMMDDTHHmmss");
        const fin = dayjs(`${s.fecha} ${s.hora || "00:00"}`).add(1, "hour").format("YYYYMMDDTHHmmss");

        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${inicio}/${fin}&details=${encodeURIComponent(descripcion)}&location=${encodeURIComponent(ubicacion)}`;

        window.open(url, "_blank");
    }

    function enviarRecordatorioWhatsApp(s) {

        if (!s?.telefono) {
            alert("El cliente no tiene teléfono");
            return;
        }

        if (!s?.fecha) {
            alert("El servicio no tiene fecha");
            return;
        }

        const fechaServicioMsg = dayjs(s.fecha);
        const hoy = dayjs();
        const esDiaAnterior = hoy.add(1, "day").isSame(fechaServicioMsg, "day");

        let mensaje = "";

        if (esDiaAnterior) {
            mensaje = `Hola ${s.nombreCliente || ""}, te recordamos que mañana tenés programado un servicio de Brillo Urbano 🧼✨

📅 Fecha: ${fechaServicioMsg.format("DD/MM/YYYY")}
⏰ Hora: ${s.hora || "a coordinar"}
📍 Dirección: ${s.direccion || ""}

Por favor asegurarse de que el lugar esté preparado para trabajar 🙌
- Equipos desconectados
- Elementos Electricos protegidos
- Zona de limpieza despejada

¡Gracias!`;
        } else {
            mensaje = `Hola ${s.nombreCliente || ""}, te confirmamos tu servicio de Brillo Urbano 🧼✨

📅 Fecha: ${fechaServicioMsg.format("DD/MM/YYYY")}
⏰ Hora: ${s.hora || "a coordinar"}
📍 Dirección: ${s.direccion || ""}

Cualquier duda estamos en contacto 👍`;
        }

        let telefono = String(s.telefono || "").replace(/\D/g, "");

        if (!telefono) {
            alert("El teléfono del cliente no es válido");
            return;
        }

        if (telefono.startsWith("0")) {
            telefono = telefono.slice(1);
        }

        if (telefono.startsWith("15")) {
            telefono = telefono.slice(2);
        }

        if (!telefono.startsWith("54")) {
            telefono = "54" + telefono;
        }

        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, "_blank");
    }

    function iniciarServicio(s) {

        if (!onStartServicio) return;

        onStartServicio({
            programadoId: s.id,
            clienteId: s.clienteId || "",
            clienteNombre: s.nombreCliente || "",
            telefono: s.telefono || "",
            direccion: s.direccion || "",
            fechaISO: s.fecha || dayjs().format("YYYY-MM-DD"),
            importe: s.importe || "",
            servicios: s.servicios || [],
            serviciosTexto: s.serviciosTexto || "",
            notas: s.notas || ""
        });

    }

    return (

        <div style={{ padding: 24 }}>

            <button onClick={onBack} style={btnLight}>
                ← Volver
            </button>

            <h2 style={{ marginTop: 20 }}>Servicios programados</h2>

            {/* PANEL NUEVO */}

            <div style={panelNuevo}>

                <h3>Programar servicio manual</h3>

                <select
                    value={clienteSeleccionado}
                    onChange={(e) => seleccionarCliente(e.target.value)}
                    style={input}
                >
                    <option value="">Seleccionar cliente</option>

                    {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.nombre}
                        </option>
                    ))}

                </select>

                <input
                    placeholder="Dirección"
                    value={direccionCliente}
                    disabled
                    style={input}
                />

                <input
                    type="date"
                    value={fechaNueva}
                    onChange={(e) => setFechaNueva(e.target.value)}
                    style={input}
                />

                <input
                    type="time"
                    value={horaNueva}
                    onChange={(e) => setHoraNueva(e.target.value)}
                    style={input}
                />

                <input
                    type="number"
                    placeholder="Importe"
                    value={importeNuevo}
                    onChange={(e) => setImporteNuevo(e.target.value)}
                    style={input}
                />

                <button
                    onClick={crearServicioManual}
                    style={btnCrear}
                >
                    Crear servicio
                </button>

            </div>

            {/* LISTA EXISTENTE */}

            {Object.keys(agrupados).sort().map((fecha) => (

                <div key={fecha} style={{ marginTop: 30 }}>

                    <h3 style={{ textTransform: "capitalize" }}>
                        {fecha !== "sin_fecha"
                            ? dayjs(fecha).format("dddd DD MMMM YYYY")
                            : "Sin fecha"}
                    </h3>

                    {agrupados[fecha].map((s) => (

                        <div key={s.id} style={row}>

                            <div>

                                <div style={cliente}>
                                    {s.nombreCliente || "Cliente"}
                                </div>

                                <div style={detalle}>
                                    📍 {s.direccion || "-"}
                                </div>

                                {editando === s.id ? (
                                    <>
                                        <input
                                            type="date"
                                            value={fechaServicio}
                                            onChange={(e) => setFechaServicio(e.target.value)}
                                            style={input}
                                        />

                                        <input
                                            type="time"
                                            value={horaServicio}
                                            onChange={(e) => setHoraServicio(e.target.value)}
                                            style={input}
                                        />

                                        <input
                                            type="number"
                                            value={importeServicio}
                                            onChange={(e) => setImporteServicio(e.target.value)}
                                            style={input}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <div style={detalle}>
                                            📅 {s.fecha || "-"}
                                        </div>

                                        <div style={detalle}>
                                            ⏰ {s.hora || "-"}
                                        </div>

                                        <div style={detalle}>
                                            💰 {Number(s.importe || 0) > 0
                                                ? "$ " + Number(s.importe).toLocaleString("es-AR")
                                                : "-"}
                                        </div>
                                    </>
                                )}

                            </div>

                            <div style={actions}>

                                {editando === s.id ? (
                                    <button style={btnSave} onClick={() => guardar(s)}>
                                        Guardar
                                    </button>
                                ) : (
                                    <button style={btnEdit} onClick={() => editar(s)}>
                                        Editar
                                    </button>
                                )}

                                <button
                                    onClick={() => agendarEnCalendario(s)}
                                    style={{
                                        padding: 8,
                                        borderRadius: 8,
                                        border: 0,
                                        background: "#ff9800",
                                        color: "white",
                                        cursor: "pointer"
                                    }}
                                >
                                    📅 Agendar
                                </button>

                                <button
                                    onClick={() => enviarRecordatorioWhatsApp(s)}
                                    style={{
                                        padding: 8,
                                        borderRadius: 8,
                                        border: 0,
                                        background: "#25D366",
                                        color: "white",
                                        cursor: "pointer"
                                    }}
                                >
                                    📲 WhatsApp
                                </button>

                                <button
                                    style={btnPrimary}
                                    onClick={() => iniciarServicio(s)}
                                >
                                    Iniciar servicio
                                </button>

                                <button
                                    style={btnUndo}
                                    onClick={() => deshacer(s)}
                                >
                                    Deshacer
                                </button>

                                <button
                                    style={btnDelete}
                                    onClick={() => cancelar(s.id)}
                                >
                                    Cancelar
                                </button>

                            </div>

                        </div>

                    ))}

                </div>

            ))}

        </div>

    );
}

const panelNuevo = {
    marginTop: 30,
    padding: 16,
    borderRadius: 14,
    border: "1px solid #eee",
    background: "#fafafa",
    display: "grid",
    gap: 10,
    maxWidth: 400
};

const row = {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: "white",
    padding: 14,
    borderRadius: 14,
    border: "1px solid #eee",
    marginTop: 10
};

const cliente = {
    fontWeight: 700
};

const detalle = {
    fontSize: 13,
    color: "#666"
};

const input = {
    padding: 8,
    borderRadius: 8,
    border: "1px solid #ddd"
};

const actions = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 8
};

const btnPrimary = {
    padding: 8,
    borderRadius: 8,
    border: 0,
    background: "#00c27a",
    color: "white",
    cursor: "pointer"
};

const btnDelete = {
    padding: 8,
    borderRadius: 8,
    border: 0,
    background: "#ff4d4f",
    color: "white",
    cursor: "pointer"
};

const btnUndo = {
    padding: 8,
    borderRadius: 8,
    border: 0,
    background: "#1890ff",
    color: "white",
    cursor: "pointer"
};

const btnEdit = {
    padding: 8,
    borderRadius: 8,
    border: 0,
    background: "#666",
    color: "white",
    cursor: "pointer"
};

const btnSave = {
    padding: 8,
    borderRadius: 8,
    border: 0,
    background: "#00c27a",
    color: "white",
    cursor: "pointer"
};

const btnCrear = {
    padding: 10,
    borderRadius: 10,
    border: 0,
    background: "#111",
    color: "white",
    cursor: "pointer"
};

const btnLight = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer"
};