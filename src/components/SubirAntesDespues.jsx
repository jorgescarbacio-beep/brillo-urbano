import { useState } from "react";
import { subirAntesDespues } from "../services/fotosService";

export default function SubirAntesDespues() {

    const [antes, setAntes] = useState(null);
    const [despues, setDespues] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!antes || !despues) return alert("Faltan fotos");

        setLoading(true);
        await subirAntesDespues(antes, despues);
        setLoading(false);

        alert("Subido con éxito");
    };

    return (
        <div style={{ padding: 20 }}>

            <h2>Subir Antes / Después</h2>

            <input type="file" onChange={(e) => setAntes(e.target.files[0])} />
            <input type="file" onChange={(e) => setDespues(e.target.files[0])} />

            <button onClick={handleSubmit} disabled={loading}>
                {loading ? "Subiendo..." : "Subir"}
            </button>

        </div>
    );
}