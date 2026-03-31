import { useState } from "react";
import { auth } from "../firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {

        e.preventDefault();
        setError("");

        try {

            await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

        } catch (err) {

            setError("Usuario o contraseña incorrectos");

        }

    };

    return (

        <div style={page}>

            <div style={card}>

                <div style={brand}>

                    <img
                        src="/logo-brillo-urbano.png"
                        alt="Brillo Urbano"
                        style={logo}
                    />

                    <h1 style={title}>
                        BRILLO URBANO
                    </h1>

                    <p style={subtitle}>
                        Panel de gestión
                    </p>

                </div>

                <form
                    onSubmit={handleLogin}
                    style={form}
                >

                    <label style={label}>

                        Email

                        <input
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            style={input}
                        />

                    </label>

                    <label style={label}>

                        Contraseña

                        <input
                            type="password"
                            placeholder="********"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            style={input}
                        />

                    </label>

                    <button
                        type="submit"
                        style={loginBtn}
                    >
                        Ingresar
                    </button>

                    {error && (

                        <div style={errorBox}>
                            {error}
                        </div>

                    )}

                </form>

                <div style={footer}>
                    WhatsApp: +54 9 223 671 3970
                    <br />
                    IG: brillourbano.limpieza
                </div>

            </div>

        </div>

    );
}

/* ======================= */
/* estilos */
/* ======================= */

const page = {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f1115",
    padding: 20
};

const card = {
    width: "100%",
    maxWidth: 420,
    background: "white",
    borderRadius: 18,
    padding: 30,
    boxShadow: "0 20px 40px rgba(0,0,0,.35)"
};

const brand = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    marginBottom: 20
};

const logo = {
    width: 110,
    height: 110
};

const title = {
    fontSize: 26,
    margin: 0,
    color: "#111",
    letterSpacing: 1
};

const subtitle = {
    fontSize: 14,
    color: "#666"
};

const form = {
    display: "flex",
    flexDirection: "column",
    gap: 14
};

const label = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 14,
    fontWeight: 600
};

const input = {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 15
};

const loginBtn = {
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    border: 0,
    background: "#00c27a",
    color: "white",
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer"
};

const errorBox = {
    background: "#ffe9e9",
    border: "1px solid #ffb3b3",
    color: "#8a1f1f",
    padding: 10,
    borderRadius: 10,
    fontSize: 14
};

const footer = {
    marginTop: 20,
    fontSize: 12,
    color: "#777",
    textAlign: "center"
};