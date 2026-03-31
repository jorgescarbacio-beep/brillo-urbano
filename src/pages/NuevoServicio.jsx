import { useEffect, useState } from "react";
import { listenClientes } from "../services/clientesService";
import { crearServicio, subirFotosServicio } from "../services/serviciosService";
import { db } from "../firebase/config";
import { deleteDoc, doc, collection, onSnapshot } from "firebase/firestore";

const SERVICIOS = [
    { id: "campana", label: "Campana", fijo: true },
    { id: "ducto", label: "Ducto", fijo: true },
    { id: "cocina", label: "Cocina", fijo: true },

    { id: "vereda", label: "Lavado de vereda" },
    { id: "interior", label: "Lavado interior" },
    { id: "terraza", label: "Terraza" },

    { id: "mantenimiento", label: "Mantenimiento general" },
    { id: "plomeria", label: "Plomería" },
    { id: "electricidad", label: "Electricidad" },

    { id: "otro", label: "Otro" }
];

export default function NuevoServicio({ user, onBack, servicioInicial = null }) {

    const [clientes, setClientes] = useState([]);
    const [operarios, setOperarios] = useState([]);

    const [msg, setMsg] = useState("");
    const [saving, setSaving] = useState(false);

    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth <= 768 : false
    );

    const [form, setForm] = useState({
        clienteId: "",
        servicios: [],
        operarios: [],
        fechaISO: new Date().toISOString().slice(0, 10),
        importe: "",
        costoOperario: "",
        notas: "",
    });

    const [programadoId, setProgramadoId] = useState(null);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        const unsub = listenClientes(setClientes);
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

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        if (!servicioInicial) return;

        setProgramadoId(servicioInicial.programadoId || null);

        setForm((prev) => ({
            ...prev,
            clienteId: servicioInicial.clienteId || "",
            servicios: Array.isArray(servicioInicial.servicios) ? servicioInicial.servicios : [],
            fechaISO: servicioInicial.fechaISO || prev.fechaISO,
            importe: servicioInicial.importe || "",
            notas: servicioInicial.notas || ""
        }));
    }, [servicioInicial]);

    const toggleServicio = (id) => {
        setForm((prev) => {
            const existe = prev.servicios.includes(id);

            return {
                ...prev,
                servicios: existe
                    ? prev.servicios.filter((s) => s !== id)
                    : [...prev.servicios, id]
            };
        });
    };

    const toggleOperario = (id) => {
        setForm((prev) => {
            const existe = prev.operarios.includes(id);

            return {
                ...prev,
                operarios: existe
                    ? prev.operarios.filter((o) => o !== id)
                    : [...prev.operarios, id]
            };
        });
    };

    const submit = async (e) => {

        e.preventDefault();
        setMsg("");

        if (!form.clienteId) return setMsg("Elegí un cliente");
        if (form.servicios.length === 0) return setMsg("Elegí al menos un servicio");

        try {

            setSaving(true);

            const costoTotal = Number(form.costoOperario || 0);
            const cantidadOperarios = form.operarios.length || 1;
            const costoPorOperario = costoTotal / cantidadOperarios;

            // 🔥 NUEVO: generar detalle automáticamente
            const operariosDetalle = form.operarios.map((id) => ({
                id,
                costo: costoPorOperario
            }));

            const servicioLimpio = {
                ...form,
                importe: Number(form.importe || 0),
                costoOperario: costoTotal,
                operarios: form.operarios || [],
                operariosDetalle // 🔥 agregado sin romper nada
            };

            const servicioId = await crearServicio(servicioLimpio, user);

            if (files.length) {
                await subirFotosServicio({
                    servicioId,
                    clienteId: form.clienteId,
                    files
                });
            }

            if (programadoId) {
                await deleteDoc(doc(db, "servicios_programados", programadoId));
            }

            setMsg("Servicio guardado ✅");

            setFiles([]);
            setProgramadoId(null);

            setForm({
                clienteId: "",
                servicios: [],
                operarios: [],
                fechaISO: new Date().toISOString().slice(0, 10),
                importe: "",
                costoOperario: "",
                notas: "",
            });

            setTimeout(() => setMsg(""), 1500);

        } catch (err) {

            setMsg(err?.message || "Error guardando");

        } finally {

            setSaving(false);

        }
    };

    return (
        <div style={container}>

            <div style={headerBox}>
                <button onClick={onBack} style={btnLight}>← Volver</button>
                <h2 style={{ margin: 0, color: "#111" }}>Nuevo servicio</h2>
            </div>

            <div style={card}>

                <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>

                    <label style={label}>
                        Cliente
                        <select
                            value={form.clienteId}
                            onChange={(e) => setForm((p) => ({ ...p, clienteId: e.target.value }))}
                            style={input}
                        >
                            <option value="">Seleccionar…</option>
                            {clientes.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label style={label}>
                        Operarios
                        <div style={{ display: "grid", gap: 6 }}>
                            {operarios.map((o) => (
                                <label key={o.id} style={{ display: "flex", gap: 6 }}>
                                    <input
                                        type="checkbox"
                                        checked={form.operarios.includes(o.id)}
                                        onChange={() => toggleOperario(o.id)}
                                    />
                                    {o.nombre}
                                </label>
                            ))}
                        </div>
                    </label>

                    <div style={label}>
                        Servicios realizados
                        <div style={isMobile ? serviciosGridMobile : serviciosGrid}>
                            {SERVICIOS.map((s) => (
                                <label key={s.id} style={servicioItem}>
                                    <input
                                        type="checkbox"
                                        checked={form.servicios.includes(s.id)}
                                        onChange={() => toggleServicio(s.id)}
                                    />
                                    <span style={servicioTexto}>{s.label}</span>
                                    {s.fijo && <span style={badge}>35 días</span>}
                                </label>
                            ))}
                        </div>
                    </div>

                    <label style={label}>
                        Fecha
                        <input
                            type="date"
                            value={form.fechaISO}
                            onChange={(e) => setForm((p) => ({ ...p, fechaISO: e.target.value }))}
                            style={input}
                        />
                    </label>

                    <label style={label}>
                        Importe cobrado
                        <input
                            type="number"
                            value={form.importe}
                            onChange={(e) => setForm((p) => ({ ...p, importe: e.target.value }))}
                            style={input}
                        />
                    </label>

                    <label style={label}>
                        Costo operario
                        <input
                            type="number"
                            value={form.costoOperario}
                            onChange={(e) => setForm((p) => ({ ...p, costoOperario: e.target.value }))}
                            style={input}
                        />
                    </label>

                    <label style={label}>
                        Notas
                        <input
                            value={form.notas}
                            onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
                            style={input}
                        />
                    </label>

                    <label style={label}>
                        Fotos
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setFiles(Array.from(e.target.files || []))}
                            style={fileInput}
                        />
                    </label>

                    <button style={btnPrimary} type="submit" disabled={saving}>
                        {saving ? "Guardando..." : "Guardar servicio"}
                    </button>

                    {msg && <div>{msg}</div>}

                </form>

            </div>

        </div>
    );
}

const container = { padding: 24, maxWidth: 960, margin: "0 auto" };
const headerBox = { display: "flex", gap: 12 };
const serviciosGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 8 };
const serviciosGridMobile = { display: "grid", gridTemplateColumns: "1fr", gap: 8 };
const servicioItem = { display: "flex", gap: 6, background: "#f7f7f7", padding: 10, borderRadius: 8 };
const servicioTexto = {};
const badge = { fontSize: 10, background: "#111", color: "white", padding: "2px 6px" };
const card = { background: "white", padding: 16 };
const label = { display: "grid", gap: 6 };
const input = { padding: 10 };
const fileInput = {};
const btnPrimary = { padding: 12, background: "#111", color: "#fff" };
const btnLight = { padding: 10 };