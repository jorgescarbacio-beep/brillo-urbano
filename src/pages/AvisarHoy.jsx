import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { listenClientes } from "../services/clientesService";

export default function AvisarHoy({ onBack, onNuevoServicio }) {

    const [servicios, setServicios] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [mesAbierto, setMesAbierto] = useState(null);

    useEffect(() => {

        const ref = collection(db, "servicios");

        const unsub = onSnapshot(ref, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setServicios(data);
        });

        const uClientes = listenClientes(setClientes);

        return () => {
            unsub();
            if (uClientes) uClientes();
        };

    }, []);

    const getCliente = (id) => clientes.find(c => c.id === id);

    const hoy = new Date();

    const calcularDias = (fecha) => {
        const diff = hoy - fecha;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    const getEstado = (dias, avisado) => {
        if (avisado) return "azul";
        if (dias >= 40) return "rojo";
        if (dias >= 30) return "amarillo";
        return "verde";
    };

    const getColor = (estado) => {
        if (estado === "rojo") return "#ff4d4f";
        if (estado === "amarillo") return "#ffaa00";
        if (estado === "azul") return "#00aaff";
        return "#00c27a";
    };

    const getTextoEstado = (estado, dias) => {
        if (estado === "azul") return "✔ Avisado";
        if (estado === "rojo") return `🔴 ${dias} días`;
        if (estado === "amarillo") return `⚠ ${dias} días`;
        return `Faltan ${30 - dias} días`;
    };

    // 🔥 ULTIMO SERVICIO
    const ultimos = Object.values(
        servicios.reduce((acc, s) => {

            const fecha = new Date(s.fechaISO || s.fecha);

            if (!acc[s.clienteId] || fecha > acc[s.clienteId].fecha) {
                acc[s.clienteId] = { ...s, fecha };
            }

            return acc;

        }, {})
    );

    // 🔥 AGRUPAR POR MES
    const agrupados = ultimos.reduce((acc, s) => {

        const mes = s.fecha.toLocaleDateString("es-AR", {
            month: "long",
            year: "numeric"
        });

        if (!acc[mes]) acc[mes] = [];

        acc[mes].push(s);

        return acc;

    }, {});

    const marcarAvisado = async (id) => {
        await updateDoc(doc(db, "servicios", id), {
            avisado: true,
            fechaAviso: Date.now()
        });
    };

    const generarLinkWapp = (servicio) => {

        const cliente = getCliente(servicio.clienteId);
        if (!cliente) return "#";

        const telefono = (cliente.telefono || "").replace(/\D/g, "");

        if (!telefono) {
            alert("Cliente sin teléfono");
            return "#";
        }

        const dias = calcularDias(servicio.fecha);

        const msg =
            `Hola ${cliente.nombre}, ¿cómo estás? 👋\n\n` +
            `Nos contactamos desde Brillo Urbano.\n\n` +
            `Último servicio: ${servicio.fecha.toLocaleDateString("es-AR")}\n` +
            `Pasaron ${dias} días.\n\n` +
            `Incluyó: ${servicio.serviciosTexto || "servicio general"}\n` +
            `Valor: $${Number(servicio.importe || 0).toLocaleString("es-AR")}\n\n` +
            `¿Coordinamos mantenimiento esta semana?`;

        return `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`;
    };

    return (
        <div style={container}>

            <button onClick={onBack} style={btnBack}>← Volver</button>

            <h2 style={title}>Recordatorios</h2>

            {Object.keys(agrupados).map((mes) => {

                const abierto = mesAbierto === mes;
                const lista = agrupados[mes].sort((a, b) => a.fecha - b.fecha);

                return (
                    <div key={mes} style={bloqueMes}>

                        <div
                            style={mesHeader}
                            onClick={() => setMesAbierto(abierto ? null : mes)}
                        >
                            <span>{mes}</span>
                            <span style={badge}>{lista.length} clientes</span>
                        </div>

                        {abierto && lista.map(s => {

                            const cliente = getCliente(s.clienteId);
                            const dias = calcularDias(s.fecha);
                            const estado = getEstado(dias, s.avisado);
                            const color = getColor(estado);

                            return (
                                <div key={s.id} style={{ ...card, borderLeft: `5px solid ${color}` }}>

                                    <div style={{ flex: 1 }}>

                                        <div style={clienteName}>
                                            {cliente?.nombre || "Cliente"}
                                        </div>

                                        <div style={txt}>📅 {s.fecha.toLocaleDateString("es-AR")}</div>
                                        <div style={txt}>🛠 {s.serviciosTexto || "Servicio"}</div>
                                        <div style={txt}>💰 $ {Number(s.importe || 0).toLocaleString("es-AR")}</div>

                                        <div style={{ ...estadoTxt, color }}>
                                            {getTextoEstado(estado, dias)}
                                        </div>

                                    </div>

                                    <div style={acciones}>

                                        {!s.avisado && (
                                            <a
                                                href={generarLinkWapp(s)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={btnPrimary}
                                                onClick={() => marcarAvisado(s.id)}
                                            >
                                                WhatsApp
                                            </a>
                                        )}

                                        {s.avisado && (
                                            <div style={btnAvisado}>
                                                ✔ Avisado
                                            </div>
                                        )}

                                        <button
                                            style={btnNuevo}
                                            onClick={() => onNuevoServicio(cliente)}
                                        >
                                            + Servicio
                                        </button>

                                    </div>

                                </div>
                            );
                        })}

                    </div>
                );
            })}

        </div>
    );
}

/* 🎨 ESTILOS */

const container = {
    padding: 20,
    background: "#0f1115",
    minHeight: "100vh",
    color: "white"
};

const title = {
    fontSize: 26,
    fontWeight: 800,
    marginBottom: 20
};

const bloqueMes = { marginBottom: 20 };

const mesHeader = {
    background: "#1c2027",
    color: "#00c27a",
    padding: 18,
    borderRadius: 15,
    display: "flex",
    justifyContent: "space-between",
    cursor: "pointer",
    fontWeight: 800,
    textTransform: "capitalize",
    border: "1px solid #262b33"
};

const badge = {
    background: "#00c27a22",
    color: "#00c27a",
    padding: "6px 12px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "bold"
};

const card = {
    background: "#161a21",
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #262b33"
};

const clienteName = {
    color: "#00c27a",
    fontSize: 18,
    fontWeight: 800
};

const txt = {
    fontSize: 13,
    color: "#aaa",
    marginTop: 2
};

const estadoTxt = {
    fontSize: 13,
    fontWeight: 700,
    marginTop: 6
};

const acciones = {
    display: "flex",
    gap: 8
};

const btnPrimary = {
    padding: "8px 12px",
    borderRadius: 10,
    border: 0,
    background: "#00c27a",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none"
};

const btnAvisado = {
    padding: "8px 12px",
    borderRadius: 10,
    background: "#00aaff",
    fontWeight: 700
};

const btnNuevo = {
    padding: "8px 12px",
    borderRadius: 10,
    border: 0,
    background: "#ffaa00",
    color: "#000",
    fontWeight: 700,
    cursor: "pointer"
};

const btnBack = {
    marginBottom: 12,
    padding: 8,
    background: "#16202c",
    color: "#fff",
    border: "1px solid #2a3b4f",
    borderRadius: 8,
    cursor: "pointer"
};