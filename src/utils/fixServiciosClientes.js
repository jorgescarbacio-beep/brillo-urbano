import { db } from "../firebase/config";
import {
    collection,
    getDocs,
    updateDoc,
    doc
} from "firebase/firestore";

export async function fixServiciosClientes() {

    console.log("🚀 Iniciando limpieza de servicios...");

    const clientesSnap = await getDocs(collection(db, "clientes"));
    const serviciosSnap = await getDocs(collection(db, "servicios"));

    const clientes = clientesSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));

    const servicios = serviciosSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));

    let actualizados = 0;

    for (const s of servicios) {

        if (s.clienteId) continue;

        // 👇 DEBUG CLAVE
        console.log("🔍 Revisando servicio:", s.nombreCliente);

        const cliente = clientes.find(c => {

            if (!c.nombre || !s.nombreCliente) return false;

            const a = c.nombre.toLowerCase().trim();
            const b = s.nombreCliente.toLowerCase().trim();

            return a.includes(b) || b.includes(a);
        });

        if (!cliente) {
            console.log("❌ NO MATCH:", s.nombreCliente);
            continue;
        }

        await updateDoc(doc(db, "servicios", s.id), {
            clienteId: cliente.id
        });

        console.log(`✔ Vinculado: ${s.nombreCliente} → ${cliente.nombre}`);

        actualizados++;
    }

    console.log(`✅ Limpieza terminada. Servicios actualizados: ${actualizados}`);
}