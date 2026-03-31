import { useEffect, useMemo, useState } from "react";
import {
    borrarCliente,
    crearCliente,
    listenClientes
} from "../services/clientesService";

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot
} from "firebase/firestore";

import { db } from "../firebase/config";

export default function Clientes({ user, onBack }) {

    const [tab, setTab] = useState("clientes");

    const [items, setItems] = useState([]);
    const [operarios, setOperarios] = useState([]);

    const [q, setQ] = useState("");

    const [form, setForm] = useState({
        nombre: "",
        direccion: "",
        telefono: "",
        notas: ""
    });

    const [formOp, setFormOp] = useState({
        nombre: "",
        telefono: ""
    });

    const [expanded, setExpanded] = useState(null);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        const unsub = listenClientes(setItems);
        return () => unsub();
    }, []);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "operarios"), (snap) => {
            const arr = [];
            snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
            setOperarios(arr);
        });

        return () => unsub();
    }, []);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;

        return items.filter((c) =>
            [c.nombre, c.direccion, c.telefono, c.notas]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(s))
        );
    }, [items, q]);

    const submit = async (e) => {
        e.preventDefault();
        setMsg("");

        try {
            await crearCliente(form, user);
            setForm({ nombre: "", direccion: "", telefono: "", notas: "" });
            setMsg("Cliente creado ✅");
        } catch {
            setMsg("Error");
        }
    };

    const submitOp = async (e) => {
        e.preventDefault();
        if (!formOp.nombre) return;

        await addDoc(collection(db, "operarios"), {
            ...formOp,
            createdAt: Date.now()
        });

        setFormOp({ nombre: "", telefono: "" });
    };

    const del = async (id) => {
        if (!confirm("¿Borrar cliente?")) return;
        await borrarCliente(id);
    };

    const delOp = async (id) => {
        if (!confirm("¿Borrar operario?")) return;
        await deleteDoc(doc(db, "operarios", id));
    };

    return (
        <div style={container}>

            {/* TABS */}
            <div style={tabs}>
                <button
                    onClick={() => setTab("clientes")}
                    style={tab === "clientes" ? tabActive : tabBtn}
                >
                    Clientes
                </button>
                <button
                    onClick={() => setTab("operarios")}
                    style={tab === "operarios" ? tabActive : tabBtn}
                >
                    Operarios
                </button>
            </div>

            <button onClick={onBack} style={btnBack}>← Volver</button>

            {tab === "clientes" && (
                <div style={grid2}>

                    {/* FORM */}
                    <div style={card}>
                        <h3>Nuevo cliente</h3>

                        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
                            <Input label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
                            <Input label="Dirección" value={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} />
                            <Input label="Teléfono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
                            <Input label="Notas" value={form.notas} onChange={(v) => setForm({ ...form, notas: v })} />

                            <button style={btnPrimary}>Guardar</button>
                            {msg && <div>{msg}</div>}
                        </form>
                    </div>

                    {/* LISTADO */}
                    <div style={card}>
                        <h3>Clientes</h3>

                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Buscar..."
                            style={input}
                        />

                        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>

                            {filtered.map((c) => {

                                const abierto = expanded === c.id;

                                return (
                                    <div key={c.id} style={cardCliente}>

                                        <div
                                            onClick={() => setExpanded(abierto ? null : c.id)}
                                            style={clienteHeader}
                                        >
                                            <strong>{c.nombre}</strong>
                                            <span>{abierto ? "▲" : "▼"}</span>
                                        </div>

                                        {abierto && (
                                            <div style={clienteBody}>
                                                {c.direccion && <div>📍 {c.direccion}</div>}
                                                {c.telefono && <div>📞 {c.telefono}</div>}
                                                {c.notas && <div>📝 {c.notas}</div>}

                                                <button
                                                    onClick={() => del(c.id)}
                                                    style={btnDanger}
                                                >
                                                    Borrar
                                                </button>
                                            </div>
                                        )}

                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {tab === "operarios" && (
                <div style={grid2}>

                    <div style={card}>
                        <h3>Nuevo operario</h3>

                        <form onSubmit={submitOp} style={{ display: "grid", gap: 10 }}>
                            <Input label="Nombre" value={formOp.nombre} onChange={(v) => setFormOp({ ...formOp, nombre: v })} />
                            <Input label="Teléfono" value={formOp.telefono} onChange={(v) => setFormOp({ ...formOp, telefono: v })} />

                            <button style={btnPrimary}>Guardar</button>
                        </form>
                    </div>

                    <div style={card}>
                        <h3>Operarios</h3>

                        <div style={{ display: "grid", gap: 10 }}>
                            {operarios.map((o) => (
                                <div key={o.id} style={cardCliente}>
                                    <div style={clienteHeader}>
                                        <strong>{o.nombre}</strong>
                                    </div>

                                    <div style={clienteBody}>
                                        {o.telefono && <div>📞 {o.telefono}</div>}

                                        <button
                                            onClick={() => delOp(o.id)}
                                            style={btnDanger}
                                        >
                                            Borrar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Input({ label, value, onChange }) {
    return (
        <label style={{ display: "grid", gap: 6 }}>
            {label}
            <input value={value} onChange={(e) => onChange(e.target.value)} style={input} />
        </label>
    );
}

/* 🔥 ESTILOS */

const container = { padding: 24, background: "#0b1016", minHeight: "100vh" };

const grid2 = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", // 🔥 RESPONSIVE
    gap: 16
};

const card = {
    background: "#121a24",
    border: "1px solid #223041",
    borderRadius: 16,
    padding: 16,
    color: "#fff"
};

const cardCliente = {
    background: "#0e141c",
    border: "1px solid #1d2a38",
    borderRadius: 12,
    overflow: "hidden"
};

const clienteHeader = {
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    cursor: "pointer",
    background: "#16202c"
};

const clienteBody = {
    padding: 12,
    display: "grid",
    gap: 6,
    fontSize: 14
};

const input = {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #2a3b4f",
    background: "#0b1016",
    color: "#fff"
};

const tabs = { display: "flex", gap: 10, marginBottom: 16 };

const tabBtn = {
    padding: "8px 14px",
    borderRadius: 10,
    background: "#16202c",
    color: "#fff",
    border: "1px solid #2a3b4f",
    cursor: "pointer"
};

const tabActive = {
    ...tabBtn,
    background: "#00c27a",
    border: "1px solid #00c27a"
};

const btnPrimary = {
    padding: 10,
    background: "#00c27a",
    color: "#fff",
    border: 0,
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer"
};

const btnDanger = {
    marginTop: 10,
    padding: 8,
    background: "#ff4d4f",
    color: "#fff",
    border: 0,
    borderRadius: 8,
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