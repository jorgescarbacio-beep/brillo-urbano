import { useEffect, useState } from "react";
import { auth } from "../firebase/config"; // Importamos auth para el logout
import { listenServiciosProgramados } from "../services/serviciosService";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

export default function AgendaOperarios() {
    const [servicios, setServicios] = useState([]);

    useEffect(() => {
        const unsub = listenServiciosProgramados(setServicios);
        return () => unsub();
    }, []);

    // 1. Ordenar datos
    const ordenados = [...servicios].sort((a, b) => {
        const f1 = dayjs(`${a.fecha || ""} ${a.hora || "00:00"}`);
        const f2 = dayjs(`${b.fecha || ""} ${b.hora || "00:00"}`);
        return f1 - f2;
    });

    // 2. Agrupar por fecha
    const agrupados = ordenados.reduce((acc, s) => {
        const key = s.fecha || "sin_fecha";
        if (!acc[key]) acc[key] = [];
        acc[key].push(s);
        return acc;
    }, {});

    const abrirWhatsapp = (telefono) => {
        if (!telefono) return;
        let tel = telefono.replace(/\D/g, "");
        if (!tel.startsWith("54")) tel = "54" + tel;
        window.open(`https://wa.me/${tel}`, "_blank");
    };

    // Función para cerrar sesión
    const cerrarSesion = () => {
        auth.signOut();
    };

    return (
        <div style={container}>
            {/* Header con Botón de Salir */}
            <div style={headerTop}>
                <div>
                    <h2 style={titulo}>Mi Agenda</h2>
                    <p style={subtitulo}>Servicios programados</p>
                </div>
                <button onClick={cerrarSesion} style={btnSalir}>
                    Cerrar Sesión
                </button>
            </div>

            {Object.keys(agrupados).map((fecha) => (
                <div key={fecha} style={bloqueDia}>
                    <div style={fechaHeader}>
                        {fecha === "sin_fecha"
                            ? "Sin fecha"
                            : dayjs(fecha).format("dddd DD [de] MMMM")}
                    </div>

                    {agrupados[fecha].map((s) => (
                        <div key={s.id} style={card}>
                            <div style={colHora}>
                                <div style={hora}>{s.hora || "--:--"}</div>
                            </div>

                            <div style={colInfo}>
                                <div style={cliente}>{s.nombreCliente || "Cliente"}</div>
                                <div style={direccion}>📍 {s.direccion || "Ver dirección"}</div>
                                <div style={telefonoStyle}>📞 {s.telefono || "-"}</div>
                            </div>

                            <div style={colDerecha}>
                                {s.telefono && (
                                    <button
                                        style={btnWhatsapp}
                                        onClick={() => abrirWhatsapp(s.telefono)}
                                    >
                                        Contactar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            {servicios.length === 0 && (
                <div style={sinDatos}>No hay trabajos asignados por el momento.</div>
            )}
        </div>
    );
}

// --- ESTILOS ---
const container = {
    padding: "15px",
    maxWidth: "600px",
    margin: "auto",
    minHeight: "100vh",
    backgroundColor: "#121212"
};

const headerTop = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px"
};

const btnSalir = {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #444",
    background: "transparent",
    color: "#ff4d4d",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer"
};

const titulo = { color: "#fff", margin: 0, fontSize: "22px" };
const subtitulo = { color: "#aaa", margin: 0, fontSize: "13px" };
const bloqueDia = { marginBottom: "30px" };

const fechaHeader = {
    fontWeight: 700,
    fontSize: "15px",
    textTransform: "uppercase",
    marginBottom: "12px",
    color: "#00c27a",
    borderBottom: "1px solid #333",
    paddingBottom: "5px"
};

const card = {
    display: "flex",
    gap: "12px",
    background: "#1e1e1e",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "12px",
    alignItems: "center",
    border: "1px solid #333"
};

const colHora = { minWidth: "65px" };
const hora = { fontSize: "18px", fontWeight: 700, color: "#fff" };

const colInfo = { flex: 1 };
const cliente = { fontWeight: 700, fontSize: "16px", color: "#fff", marginBottom: "4px" };
const direccion = { fontSize: "13px", color: "#bbb", marginBottom: "2px" };
const telefonoStyle = { fontSize: "13px", color: "#bbb" };

const colDerecha = { display: "flex", flexDirection: "column", alignItems: "flex-end" };

const btnWhatsapp = {
    padding: "10px 14px",
    borderRadius: "8px",
    border: 0,
    background: "#25D366",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "12px"
};

const sinDatos = { textAlign: "center", marginTop: "50px", color: "#666" };