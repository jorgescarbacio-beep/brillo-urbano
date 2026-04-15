import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/config";
import { storage } from "../firebase/config";

import {
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    updateDoc
} from "firebase/firestore";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "firebase/storage";

export default function Costos({ onBack }) {

    const [gastos, setGastos] = useState([]);

    const [concepto, setConcepto] = useState("");
    const [monto, setMonto] = useState("");
    const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
    const [pagoPor, setPagoPor] = useState("Jorge");

    const [metodoPago, setMetodoPago] = useState("Efectivo");
    const [comprobante, setComprobante] = useState(null);

    const [mensajeOk, setMensajeOk] = useState("");

    const [editando, setEditando] = useState(null);
    const [editData, setEditData] = useState({});
    const [editComprobante, setEditComprobante] = useState(null);

    const [mesAbierto, setMesAbierto] = useState(null);

    useEffect(() => {

        const unsub = onSnapshot(collection(db, "gastos"), (snap) => {

            const arr = [];

            snap.forEach((doc) => {
                arr.push({ id: doc.id, ...doc.data() });
            });

            setGastos(arr);

        });

        return () => unsub();

    }, []);

    const subirComprobante = async (file, id) => {

        if (!file) return "";

        const storageRef = ref(storage, `comprobantes/${id}_${file.name}`);

        await uploadBytes(storageRef, file);

        const url = await getDownloadURL(storageRef);

        return url;

    };

    const agregarGasto = async (e) => {

        e.preventDefault();

        if (!concepto || !monto) return;

        const docRef = await addDoc(collection(db, "gastos"), {
            concepto,
            monto: Number(monto),
            fecha,
            pagoPor,
            metodoPago,
            comprobanteURL: ""
        });

        let url = "";

        if (comprobante) {

            url = await subirComprobante(comprobante, docRef.id);

            await updateDoc(doc(db, "gastos", docRef.id), {
                comprobanteURL: url
            });

        }

        setConcepto("");
        setMonto("");
        setPagoPor("Jorge");
        setMetodoPago("Efectivo");
        setComprobante(null);
        setFecha(new Date().toISOString().slice(0, 10));

        setMensajeOk("Comprobante cargado con éxito");

        setTimeout(() => {
            setMensajeOk("");
        }, 3000);

    };

    const eliminarGasto = async (id) => {

        if (!confirm("Eliminar gasto?")) return;

        await deleteDoc(doc(db, "gastos", id));

    };

    const iniciarEdicion = (g) => {
        setEditando(g.id);

        setEditData({
            concepto: g.concepto,
            monto: g.monto,
            fecha: g.fecha,
            pagoPor: g.pagoPor || "Jorge",
            metodoPago: g.metodoPago || "Efectivo",
            comprobanteURL: g.comprobanteURL || ""
        });

        // Esta línea hace que suba al principio suavemente
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const guardarEdicion = async () => {

        let url = editData.comprobanteURL;

        if (editComprobante) {
            url = await subirComprobante(editComprobante, editando);
        }

        await updateDoc(doc(db, "gastos", editando), {
            concepto: editData.concepto,
            monto: Number(editData.monto),
            fecha: editData.fecha,
            pagoPor: editData.pagoPor,
            metodoPago: editData.metodoPago,
            comprobanteURL: url
        });

        setEditando(null);
        setEditComprobante(null);

    };

    // 🔥 ordenar por fecha
    const gastosOrdenados = useMemo(() => {
        return [...gastos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }, [gastos]);

    // 🔥 agrupar por mes
    const gastosPorMes = useMemo(() => {

        const grupos = {};

        gastosOrdenados.forEach(g => {

            const fecha = new Date(g.fecha);

            const key = fecha.toLocaleString("es-AR", {
                month: "long",
                year: "numeric"
            });

            if (!grupos[key]) grupos[key] = [];

            grupos[key].push(g);

        });

        return grupos;

    }, [gastosOrdenados]);

    const totalGastos = useMemo(() => {
        return gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);
    }, [gastos]);

    const totalJorge = useMemo(() => {
        return gastos
            .filter(g => g.pagoPor === "Jorge")
            .reduce((acc, g) => acc + Number(g.monto || 0), 0);
    }, [gastos]);

    const totalSole = useMemo(() => {
        return gastos
            .filter(g => g.pagoPor === "Sole")
            .reduce((acc, g) => acc + Number(g.monto || 0), 0);
    }, [gastos]);

    const saldo = useMemo(() => {
        const diferencia = totalJorge - totalSole;
        return diferencia / 2;
    }, [totalJorge, totalSole]);

    return (

        <div style={{ padding: 24 }}>

            <button onClick={onBack} style={btnLight}>
                ← Volver
            </button>

            <h2 style={{ marginTop: 20, color: "white" }}>
                Costos / Gastos
            </h2>

            {mensajeOk && (
                <div style={mensajeExito}>
                    {mensajeOk}
                </div>
            )}

            {/* --- BLOQUE DE CARGA DE NUEVOS GASTOS --- */}
            {/* --- BLOQUE DE CARGA / EDICIÓN MEJORADO --- */}
            <div style={{
                background: "#1e1e1e",
                padding: "20px",
                borderRadius: "16px",
                marginTop: "20px",
                marginBottom: "20px",
                border: editando ? "2px solid #1890ff" : "1px solid #333", // Resalta si está editando
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
            }}>
                <h3 style={{ color: "white", marginTop: 0, marginBottom: 15 }}>
                    {editando ? "📝 Editando Gasto" : "➕ Nuevo Gasto"}
                </h3>

                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                }}>
                    {/* Concepto y Monto - Se adaptan solos */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <div style={{ flex: "1 1 200px" }}>
                            <label style={labelStyle}>Concepto</label>
                            <input
                                type="text"
                                placeholder="Ej: Supermercado"
                                value={editando ? editData.concepto : concepto}
                                onChange={(e) => editando ? setEditData({ ...editData, concepto: e.target.value }) : setConcepto(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ flex: "1 1 120px" }}>
                            <label style={labelStyle}>Monto ($)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={editando ? editData.monto : monto}
                                onChange={(e) => editando ? setEditData({ ...editData, monto: e.target.value }) : setMonto(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Fecha, Pago y Método */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <div style={{ flex: "1 1 140px" }}>
                            <label style={labelStyle}>Fecha</label>
                            <input
                                type="date"
                                value={editando ? editData.fecha : fecha}
                                onChange={(e) => editando ? setEditData({ ...editData, fecha: e.target.value }) : setFecha(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ flex: "1 1 100px" }}>
                            <label style={labelStyle}>Pagó</label>
                            <select
                                value={editando ? editData.pagoPor : pagoPor}
                                onChange={(e) => editando ? setEditData({ ...editData, pagoPor: e.target.value }) : setPagoPor(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="Jorge">Jorge</option>
                                <option value="Sole">Sole</option>
                            </select>
                        </div>
                        <div style={{ flex: "1 1 120px" }}>
                            <label style={labelStyle}>Método</label>
                            <select
                                value={editando ? editData.metodoPago : metodoPago}
                                onChange={(e) => editando ? setEditData({ ...editData, metodoPago: e.target.value }) : setMetodoPago(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="Efectivo">Efectivo</option>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Tarjeta">Tarjeta</option>
                            </select>
                        </div>
                    </div>

                    {/* Comprobante */}
                    <div>
                        <label style={labelStyle}>Comprobante (opcional)</label>
                        <input
                            type="file"
                            onChange={(e) => editando ? setEditComprobante(e.target.files[0]) : setComprobante(e.target.files[0])}
                            style={{ ...inputStyle, padding: "8px" }}
                        />
                    </div>

                    {/* Botones */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button
                            onClick={editando ? guardarEdicion : agregarGasto}
                            style={{
                                ...btnEdit,
                                background: editando ? "#1890ff" : "#00c27a",
                                color: editando ? "white" : "black",
                                flex: 2,
                                padding: "15px",
                                fontSize: "16px"
                            }}
                        >
                            {editando ? "Actualizar Gasto" : "Guardar Gasto"}
                        </button>

                        {editando && (
                            <button
                                onClick={() => setEditando(null)}
                                style={{ ...btnLight, flex: 1 }}
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {/* --- FIN DEL BLOQUE --- */}

            <div style={grid}>

                <Card title="Total gastos">
                    <strong style={{ fontSize: 22 }}>
                        $ {totalGastos.toLocaleString("es-AR")}
                    </strong>
                </Card>

                <Card title="Pagó Jorge">
                    $ {totalJorge.toLocaleString("es-AR")}
                </Card>

                <Card title="Pagó Sole">
                    $ {totalSole.toLocaleString("es-AR")}
                </Card>

                <Card title="Saldo">
                    {saldo > 0 && (
                        <span>Sole le debe $ {Math.abs(saldo).toLocaleString("es-AR")} a Jorge</span>
                    )}
                    {saldo < 0 && (
                        <span>Jorge le debe $ {Math.abs(saldo).toLocaleString("es-AR")} a Sole</span>
                    )}
                    {saldo === 0 && (
                        <span>Están empatados</span>
                    )}
                </Card>

            </div>

            <h3 style={{ marginTop: 30, color: "white" }}>
                Historial de gastos
            </h3>

            {Object.entries(gastosPorMes).map(([mes, items]) => {

                const abierto = mesAbierto === mes;

                return (

                    <div key={mes} style={accordion}>

                        <div
                            style={accordionHeader}
                            onClick={() =>
                                setMesAbierto(abierto ? null : mes)
                            }
                        >
                            <span>{mes.toUpperCase()}</span>
                            <span>{items.length} gastos</span>
                        </div>

                        {abierto && (

                            <div>

                                {items.map((g) => (

                                    <div key={g.id} style={row}>

                                        <div style={rowMobile}>

                                            <div style={{ fontWeight: 600, color: "white" }}>
                                                {g.concepto}
                                            </div>

                                            <div style={{ color: "#bbb" }}>
                                                {g.fecha}
                                            </div>

                                            <div style={{ color: "#ddd" }}>
                                                Pagó: {g.pagoPor || "—"}
                                            </div>

                                            <div style={{ color: "#ddd" }}>
                                                Método: {g.metodoPago || "—"}
                                            </div>

                                            <div style={{ fontWeight: 600, color: "white" }}>
                                                $ {Number(g.monto).toLocaleString("es-AR")}
                                            </div>

                                            {g.comprobanteURL && (
                                                <a
                                                    href={g.comprobanteURL}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ color: "#00c27a" }}
                                                >
                                                    Ver comprobante
                                                </a>
                                            )}

                                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>

                                                <button
                                                    style={btnEdit}
                                                    onClick={() => iniciarEdicion(g)}
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    style={btnDelete}
                                                    onClick={() => eliminarGasto(g.id)}
                                                >
                                                    Eliminar
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        )}

                    </div>

                );

            })}

        </div>

    );

}

function Card({ title, children }) {

    return (
        <div style={card}>
            <div style={{ fontSize: 14, color: "#666" }}>
                {title}
            </div>
            <div style={{ marginTop: 8 }}>
                {children}
            </div>
        </div>
    );

}

// --- BLOQUE DE ESTILOS FINAL ---

// --- BLOQUE DE ESTILOS FINAL (CORREGIDO) ---

const labelStyle = {
    color: "#888",
    fontSize: "12px",
    marginBottom: "5px",
    display: "block",
    marginLeft: "5px"
};

const inputStyle = {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #444",
    background: "#2a2a2a",
    color: "white",
    fontSize: "16px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box"
};

const mensajeExito = {
    background: "#16a34a",
    color: "white",
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    width: "fit-content"
};

const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
    gap: 20,
    marginTop: 20
};

const card = {
    background: "white",
    borderRadius: 16,
    padding: 16
};

const row = {
    borderBottom: "1px solid #444",
    padding: 12
};

const rowMobile = {
    display: "flex",
    flexDirection: "column",
    gap: 4
};

const btnLight = {
    padding: "10px 15px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
    color: "black",
    fontWeight: "600"
};

const btnDelete = {
    background: "#ff4d4f",
    border: 0,
    color: "white",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600"
};

const btnEdit = {
    background: "#1890ff",
    border: 0,
    color: "white",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600"
};

const accordion = {
    marginTop: 10,
    border: "1px solid #333",
    borderRadius: 12,
    overflow: "hidden"
};

const accordionHeader = {
    background: "#111",
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    cursor: "pointer",
    color: "#00c27a",
    fontWeight: 600
};