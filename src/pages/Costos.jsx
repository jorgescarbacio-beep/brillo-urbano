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
                Nuevo gasto
            </h3>

            <form onSubmit={agregarGasto} style={form}>

                <input
                    placeholder="Concepto"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    style={input}
                />

                <input
                    type="number"
                    placeholder="Monto"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    style={input}
                />

                <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    style={input}
                />

                <select
                    value={pagoPor}
                    onChange={(e) => setPagoPor(e.target.value)}
                    style={input}
                >
                    <option value="Jorge">Pagó Jorge</option>
                    <option value="Sole">Pagó Sole</option>
                </select>

                <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    style={input}
                >
                    <option>Efectivo</option>
                    <option>Transferencia</option>
                    <option>Tarjeta</option>
                    <option>Débito</option>
                    <option>Otro</option>
                </select>

                <input
                    type="file"
                    onChange={(e) => setComprobante(e.target.files[0])}
                />

                <button style={btnPrimary}>
                    Agregar gasto
                </button>

            </form>

            <h3 style={{ marginTop: 30, color: "white" }}>
                Historial de gastos
            </h3>

            {gastos.map((g) => {

                if (editando === g.id) {

                    return (

                        <div key={g.id} style={row}>

                            <div style={rowMobile}>

                                <input
                                    value={editData.concepto}
                                    onChange={(e) =>
                                        setEditData({ ...editData, concepto: e.target.value })
                                    }
                                    style={input}
                                />

                                <input
                                    type="number"
                                    value={editData.monto}
                                    onChange={(e) =>
                                        setEditData({ ...editData, monto: e.target.value })
                                    }
                                    style={input}
                                />

                                <input
                                    type="date"
                                    value={editData.fecha}
                                    onChange={(e) =>
                                        setEditData({ ...editData, fecha: e.target.value })
                                    }
                                    style={input}
                                />

                                <select
                                    value={editData.pagoPor}
                                    onChange={(e) =>
                                        setEditData({ ...editData, pagoPor: e.target.value })
                                    }
                                    style={input}
                                >
                                    <option value="Jorge">Pagó Jorge</option>
                                    <option value="Sole">Pagó Sole</option>
                                </select>

                                <select
                                    value={editData.metodoPago}
                                    onChange={(e) =>
                                        setEditData({ ...editData, metodoPago: e.target.value })
                                    }
                                    style={input}
                                >
                                    <option>Efectivo</option>
                                    <option>Transferencia</option>
                                    <option>Tarjeta</option>
                                    <option>Débito</option>
                                    <option>Otro</option>
                                </select>

                                <input
                                    type="file"
                                    onChange={(e) => setEditComprobante(e.target.files[0])}
                                />

                                {editData.comprobanteURL && (
                                    <a
                                        href={editData.comprobanteURL}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: "#00c27a" }}
                                    >
                                        Ver comprobante actual
                                    </a>
                                )}

                                <div style={{ display: "flex", gap: 8 }}>

                                    <button
                                        style={btnPrimary}
                                        onClick={guardarEdicion}
                                    >
                                        Guardar
                                    </button>

                                    <button
                                        style={btnLight}
                                        onClick={() => {
                                            setEditando(null);
                                            setEditComprobante(null);
                                        }}
                                    >
                                        Cancelar
                                    </button>

                                </div>

                            </div>

                        </div>

                    );
                }

                return (

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

const form = {
    display: "flex",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap"
};

const input = {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ddd"
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
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer"
};

const btnPrimary = {
    padding: "10px 14px",
    borderRadius: 10,
    border: 0,
    background: "#00c27a",
    color: "white",
    cursor: "pointer"
};

const btnDelete = {
    background: "#ff4d4f",
    border: 0,
    color: "white",
    padding: "6px 10px",
    borderRadius: 8
};

const btnEdit = {
    background: "#1890ff",
    border: 0,
    color: "white",
    padding: "6px 10px",
    borderRadius: 8
};