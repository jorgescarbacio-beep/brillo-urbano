import { db, storage } from "../../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// 📌 carpeta base en storage
const BASE_PATH = "web/trabajos";

/* ========================= */
/* SUBIR ARCHIVO */
/* ========================= */

async function subirArchivo(file, path) {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
}

/* ========================= */
/* GENERAR NOMBRE */
/* ========================= */

function generarNombre(file) {
    const timestamp = Date.now();
    const ext = file.name.split(".").pop();
    return `${timestamp}.${ext}`;
}

/* ========================= */
/* FUNCIÓN PRINCIPAL */
/* ========================= */

export async function subirTrabajoWeb({
    categoria,
    titulo,
    descripcion,
    fotoAntes,
    fotoDespues,
    videoTrabajo
}) {

    try {

        const carpeta = `${BASE_PATH}/${categoria}`;

        // 📸 subir imágenes
        const nombreAntes = generarNombre(fotoAntes);
        const nombreDespues = generarNombre(fotoDespues);

        const urlAntes = await subirArchivo(
            fotoAntes,
            `${carpeta}/antes/${nombreAntes}`
        );

        const urlDespues = await subirArchivo(
            fotoDespues,
            `${carpeta}/despues/${nombreDespues}`
        );

        // 🎥 video (opcional)
        let urlVideo = null;

        if (videoTrabajo) {
            const nombreVideo = generarNombre(videoTrabajo);

            urlVideo = await subirArchivo(
                videoTrabajo,
                `${carpeta}/videos/${nombreVideo}`
            );
        }

        // 💾 guardar en firestore
        await addDoc(collection(db, "web_trabajos"), {
            categoria,
            titulo,
            descripcion,
            antes: urlAntes,
            despues: urlDespues,
            video: urlVideo,
            createdAt: serverTimestamp()
        });

        return { ok: true };

    } catch (error) {
        console.error("Error subiendo trabajo web:", error);
        return { ok: false, error };
    }
}