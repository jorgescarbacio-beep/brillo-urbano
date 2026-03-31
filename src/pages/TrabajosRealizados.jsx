import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import { listenClientes } from "../services/clientesService";

export default function TrabajosRealizados({ onBack }) {
    const [lista, setLista] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [mesAbierto, setMesAbierto] = useState(null);

    useEffect(() => {
        const ref = collection(db, "servicios");
        const unsub = onSnapshot(ref, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const normalizados = data.map(s => {
                const clienteObj = clientes.find(c => c.id === s.clienteId) ||
                    clientes.find(c => c.nombre === s.nombreCliente);
                return {
                    ...normalizar(s),
                    cliente: s.nombreCliente || s.cliente || s.nombre || clienteObj?.nombre || "Sin cliente",
                    direccion: s.direccion || clienteObj?.direccion || "Dirección no registrada"
                };
            });
            setLista(normalizados.sort((a, b) => b.fecha - a.fecha));
        });
        return () => unsub();
    }, [clientes]);

    useEffect(() => {
        const unsub = listenClientes(setClientes);
        return () => unsub();
    }, []);

    const agrupados = agruparPorMes(lista);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button onClick={onBack} style={styles.btnBack}>
                    ← Volver
                </button>
                <h2 style={styles.title}>Historial de Trabajos</h2>
            </div>

            {Object.keys(agrupados).map((mes) => {
                const abierto = mesAbierto === mes;
                return (
                    <div key={mes} style={styles.bloqueMes}>
                        <div style={styles.mesHeader} onClick={() => setMesAbierto(abierto ? null : mes)}>
                            <span style={{ fontSize: '1.2rem' }}>{mes}</span>
                            <span style={styles.badge}>{agrupados[mes].length} trabajos</span>
                        </div>

                        {abierto && agrupados[mes].map(s => (
                            <div key={s.id} style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <div style={{ flex: 1 }}>
                                        <div style={styles.clienteName}>{s.cliente}</div>
                                        <div style={styles.direccionText}>📍 {s.direccion}</div>
                                    </div>
                                    <div style={styles.fechaBadge}>{formatearFecha(s.fecha)}</div>
                                </div>

                                <div style={styles.servicioBox}>
                                    <div style={styles.servicioTitle}>🛠️ {s.serviciosTexto}</div>
                                    {s.notas && <div style={styles.notasText}>"{s.notas}"</div>}
                                </div>

                                <div style={styles.finanzasGrid}>
                                    <div style={styles.finanzaItem}>
                                        <span style={styles.finanzaLabel}>Cobrado</span>
                                        <span style={styles.valCobrado}>$ {formatearNumero(s.importe)}</span>
                                    </div>
                                    <div style={styles.finanzaItem}>
                                        <span style={styles.finanzaLabel}>Costos</span>
                                        <span style={styles.valCosto}>$ {formatearNumero(s.costoOperario)}</span>
                                    </div>
                                    <div style={styles.finanzaItem}>
                                        <span style={styles.finanzaLabel}>Ganancia</span>
                                        <span style={styles.valGanancia}>$ {formatearNumero(s.importe - s.costoOperario)}</span>
                                    </div>
                                </div>

                                {s.operariosDetalle?.length > 0 && (
                                    <div style={styles.detalleOperarios}>
                                        {s.operariosDetalle.map((op, i) => (
                                            <div key={i} style={styles.opTag}>
                                                <span style={{ color: '#ffaa00' }}>👷</span>
                                                <span style={{ color: '#fff', fontWeight: '600' }}> {op.nombre}:</span>
                                                <span style={{ color: '#00e0ff' }}> ${formatearNumero(op.costo)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {s.fotos?.length > 0 && (
                                    <div style={styles.galeria}>
                                        {s.fotos.map((f, i) => (
                                            <img key={i} src={f} style={styles.fotoThumb} alt="Trabajo" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

function normalizar(s) {
    let detalle = [];
    const arrayCrudo = s.operariosDetalle || s.operarios || [];
    if (Array.isArray(arrayCrudo) && arrayCrudo.length > 0) {
        detalle = arrayCrudo.map(op => ({
            nombre: op.nombre || "Operario",
            costo: Number(op.costo || 0)
        }));
    } else {
        const costoUnico = Number(s.costoOperario || s.costo || 0);
        if (costoUnico > 0) detalle = [{ nombre: "Operario", costo: costoUnico }];
    }
    const totalCosto = detalle.reduce((acc, op) => acc + op.costo, 0);
    return {
        id: s.id,
        serviciosTexto: s.serviciosTexto || (Array.isArray(s.servicios) ? s.servicios.join(", ") : "Servicio general"),
        notas: s.notas || "",
        importe: Number(s.importe || s.precio || s.total || 0),
        costoOperario: totalCosto,
        operariosDetalle: detalle,
        fotos: s.fotos || s.imagenes || [],
        fecha: obtenerFecha(s)
    };
}

function obtenerFecha(s) {
    const f = s.fecha || s.fechaISO || s.createdAt;
    if (!f) return new Date(0);
    try {
        if (f.seconds) return new Date(f.seconds * 1000);
        return new Date(f);
    } catch { return new Date(0); }
}

function agruparPorMes(lista) {
    const grupos = {};
    lista.forEach(s => {
        const mes = s.fecha.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
        if (!grupos[mes]) grupos[mes] = [];
        grupos[mes].push(s);
    });
    return grupos;
}

function formatearFecha(f) { return f.toLocaleDateString("es-AR"); }
function formatearNumero(n) { return Number(n || 0).toLocaleString("es-AR"); }

const styles = {
    container: { padding: "15px", background: "#0f1115", minHeight: "100vh", fontFamily: "Arial, sans-serif" },
    header: { marginBottom: "25px", paddingTop: "10px" },
    btnBack: { background: "#fff", color: "#000", border: "none", padding: "12px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
    title: { color: "white", fontSize: "28px", marginTop: "15px", fontWeight: "800" },
    bloqueMes: { marginBottom: "20px" },
    mesHeader: {
        background: "#1c2027", color: "#00c27a", padding: "18px", borderRadius: "15px",
        display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
        fontWeight: "800", textTransform: "capitalize", border: "1px solid #262b33"
    },
    badge: { background: "#00c27a22", color: "#00c27a", padding: "6px 12px", borderRadius: "30px", fontSize: "13px", fontWeight: "bold" },
    card: {
        background: "#161a21", borderRadius: "20px", padding: "20px",
        border: "1px solid #262b33", marginTop: "12px", boxShadow: "0 6px 20px rgba(0,0,0,0.3)"
    },
    cardHeader: { display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "15px", flexWrap: "wrap" },
    clienteName: { color: "#00c27a", fontSize: "22px", fontWeight: "800", lineHeight: "1.2" },
    direccionText: { color: "#aaa", fontSize: "15px", marginTop: "6px", fontWeight: "500" },
    fechaBadge: { color: "#eee", fontSize: "13px", background: "#333", padding: "6px 12px", borderRadius: "8px", alignSelf: "flex-start" },
    servicioBox: { background: "#0a0c10", padding: "15px", borderRadius: "12px", marginBottom: "20px", borderLeft: "4px solid #00c27a" },
    servicioTitle: { color: "#fff", fontWeight: "700", fontSize: "17px" },
    notasText: { color: "#888", fontSize: "15px", fontStyle: "italic", marginTop: "8px", display: "block" },
    finanzasGrid: {
        display: "flex", justifyContent: "space-between", gap: "10px",
        padding: "20px 0", borderTop: "1px solid #262b33", flexWrap: "wrap"
    },
    finanzaItem: { minWidth: "100px", flex: "1" },
    finanzaLabel: { color: "#777", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", marginBottom: "5px", display: "block" },
    valCobrado: { color: "#00c27a", fontWeight: "800", fontSize: "20px" },
    valCosto: { color: "#ffaa00", fontWeight: "800", fontSize: "20px" },
    valGanancia: { color: "#00e0ff", fontWeight: "800", fontSize: "20px" },
    detalleOperarios: {
        display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px",
        paddingTop: "15px", borderTop: "1px dashed #333"
    },
    opTag: { background: "#1c2027", padding: "10px 15px", borderRadius: "10px", fontSize: "14px", border: "1px solid #262b33" },
    galeria: { display: "flex", gap: "12px", marginTop: "20px", overflowX: "auto", paddingBottom: "10px" },
    fotoThumb: { width: "100px", height: "100px", borderRadius: "12px", objectFit: "cover", border: "2px solid #262b33" }
};