import { db, storage } from "../../firebase/config";
import {
    collection,
    addDoc,
    serverTimestamp,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
} from "firebase/firestore";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "firebase/storage";

// 📌 Configuración de rutas en Storage
const BASE_PATH = "web/trabajos";

/**
 * Función interna para subir archivos
 */
async function subirArchivo(file, path) {
    if (!file) return null;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}

/**
 * Genera nombre único para evitar que se pisen archivos
 */
function generarNombre(file) {
    const timestamp = Date.now();
    const ext = file.name.split(".").pop();
    return `${timestamp}.${ext}`;
}

/**
 * =============================
 * SUBIR TRABAJO (YA LO TENÍAS)
 * =============================
 */
export async function subirTrabajoWeb({
    categoria = "general",
    titulo = "",
    descripcion = "",
    fotoAntes,
    fotoDespues,
    videoTrabajo = null
}) {
    try {
        const carpeta = `${BASE_PATH}/${categoria}`;

        const nombreAntes = generarNombre(fotoAntes);
        const nombreDespues = generarNombre(fotoDespues);

        const urlAntes = await subirArchivo(fotoAntes, `${carpeta}/antes/${nombreAntes}`);
        const urlDespues = await subirArchivo(fotoDespues, `${carpeta}/despues/${nombreDespues}`);

        let urlVideo = null;
        if (videoTrabajo) {
            const nombreVideo = generarNombre(videoTrabajo);
            urlVideo = await subirArchivo(videoTrabajo, `${carpeta}/videos/${nombreVideo}`);
        }

        const docRef = await addDoc(collection(db, "web_trabajos"), {
            categoria,
            titulo,
            descripcion,
            antes: urlAntes,
            despues: urlDespues,
            video: urlVideo,
            createdAt: serverTimestamp()
        });

        return { ok: true, id: docRef.id };

    } catch (error) {
        console.error("Error en subirTrabajoWeb:", error);
        return { ok: false, error: error.message };
    }
}

/**
 * =============================
 * OBTENER TRABAJOS
 * =============================
 */
export async function obtenerTrabajosWeb() {
    try {
        const snapshot = await getDocs(collection(db, "web_trabajos"));

        return snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data()
        }));

    } catch (error) {
        console.error("Error obteniendo trabajos:", error);
        return [];
    }
}

/**
 * =============================
 * ELIMINAR TRABAJO
 * =============================
 */
export async function eliminarTrabajoWeb(id) {
    try {
        await deleteDoc(doc(db, "web_trabajos", id));
        return { ok: true };
    } catch (error) {
        console.error("Error eliminando trabajo:", error);
        return { ok: false, error: error.message };
    }
}

/**
 * =============================
 * ACTUALIZAR TRABAJO
 * =============================
 */
export async function actualizarTrabajoWeb(id, data) {
    try {
        const carpeta = `${BASE_PATH}/${data.categoria}`;

        let urlAntes = data.trabajoActual?.antes || null;
        let urlDespues = data.trabajoActual?.despues || null;
        let urlVideo = data.trabajoActual?.video || null;

        // 🔁 Reemplazar solo si suben nuevas
        if (data.fotoAntes) {
            const nombreAntes = generarNombre(data.fotoAntes);
            urlAntes = await subirArchivo(data.fotoAntes, `${carpeta}/antes/${nombreAntes}`);
        }

        if (data.fotoDespues) {
            const nombreDespues = generarNombre(data.fotoDespues);
            urlDespues = await subirArchivo(data.fotoDespues, `${carpeta}/despues/${nombreDespues}`);
        }

        if (data.videoTrabajo) {
            const nombreVideo = generarNombre(data.videoTrabajo);
            urlVideo = await subirArchivo(data.videoTrabajo, `${carpeta}/videos/${nombreVideo}`);
        }

        await updateDoc(doc(db, "web_trabajos", id), {
            categoria: data.categoria,
            titulo: data.titulo,
            descripcion: data.descripcion,
            antes: urlAntes,
            despues: urlDespues,
            video: urlVideo
        });

        return { ok: true };

    } catch (error) {
        console.error("Error actualizando trabajo:", error);
        return { ok: false, error: error.message };
    }
}