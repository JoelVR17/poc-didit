"use client";

import { useState } from "react";

interface Session {
  sessionId: string;
  verificationUrl: string;
  status: string;
}

export default function VerificationPage() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [webhooks, setWebhooks] = useState<any[]>([]);

  // Crear sesión Didit
  const createSession = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/verification", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setSession(data);
      console.log("✅ Sesión creada:", data.sessionId);
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Ver webhooks recibidos
  const checkWebhooks = async () => {
    try {
      const res = await fetch("/api/webhook");
      const data = await res.json();
      setWebhooks(data.webhooks);
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "system-ui",
        maxWidth: "900px",
        margin: "0 auto",
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "var(--foreground)" }}>🔐 Didit KYC - Testing</h1>

      <div
        style={{
          backgroundColor: "var(--card-bg)",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
          border: "1px solid var(--card-border)",
        }}
      >
        <h2>Paso 1️⃣: Crear sesión de verificación</h2>
        <button
          onClick={createSession}
          disabled={loading}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: loading
              ? "var(--text-muted)"
              : "var(--foreground)",
            color: "var(--background)",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "opacity 0.2s",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Creando..." : "Iniciar Verificación"}
        </button>

        {session && (
          <div
            style={{
              marginTop: "20px",
              backgroundColor: "var(--background)",
              padding: "15px",
              borderRadius: "6px",
              border: "1px solid var(--card-border)",
            }}
          >
            <p>
              <strong>✅ Sesión creada</strong>
            </p>
            <p>
              Session ID: <code>{session.sessionId}</code>
            </p>
            <p>Status: {session.status}</p>
            <p style={{ marginBottom: "10px" }}>
              <strong>Haz clic aquí para verificar:</strong>
            </p>
            <a
              href={session.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Abrir Didit Verification Flow →
            </a>
            <p
              style={{
                marginTop: "10px",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              O copia y pega esta URL:{" "}
              <code
                style={{
                  backgroundColor: "var(--code-bg)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "11px",
                }}
              >
                {session.verificationUrl}
              </code>
            </p>
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: "var(--card-bg-alt)",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
          border: "1px solid var(--card-border)",
        }}
      >
        <h2>Paso 2️⃣: Después de completar verificación</h2>
        <p>Cuando completes el flujo, Didit te enviará un webhook.</p>
        <button
          onClick={checkWebhooks}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          🔄 Cargar webhooks recibidos ({webhooks.length})
        </button>

        {webhooks.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h3>Webhooks recibidos:</h3>
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                style={{
                  backgroundColor: "var(--background)",
                  padding: "15px",
                  marginBottom: "15px",
                  borderRadius: "6px",
                  border: `3px solid ${
                    webhook.status === "APPROVED"
                      ? "#4caf50"
                      : webhook.status === "DECLINED"
                      ? "#f44336"
                      : "#ff9800"
                  }`,
                }}
              >
                <p>
                  <strong>ID:</strong> {webhook.id}
                </p>
                <p>
                  <strong>Session:</strong> {webhook.sessionId}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      fontWeight: "bold",
                      color:
                        webhook.status === "APPROVED"
                          ? "#4caf50"
                          : webhook.status === "DECLINED"
                          ? "#f44336"
                          : "#ff9800",
                    }}
                  >
                    {webhook.status}
                  </span>
                </p>

                {webhook.decision && (
                  <p>
                    <strong>Decision:</strong> {webhook.decision.result}
                  </p>
                )}

                {webhook.document && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      backgroundColor: "var(--code-bg)",
                      borderRadius: "4px",
                    }}
                  >
                    <strong>Documento:</strong>
                    <ul style={{ margin: "8px 0 0 20px" }}>
                      <li>Tipo: {webhook.document.type}</li>
                      <li>País: {webhook.document.country}</li>
                      <li>
                        Nombre: {webhook.document.first_name}{" "}
                        {webhook.document.last_name}
                      </li>
                      <li>Nacimiento: {webhook.document.date_of_birth}</li>
                      <li>Expira: {webhook.document.expiry_date}</li>
                    </ul>
                  </div>
                )}

                <p
                  style={{
                    marginTop: "10px",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  {webhook.timestamp}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: "var(--card-bg-warning)",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid var(--card-border)",
        }}
      >
        <h3>📋 Próximos pasos:</h3>
        <ol>
          <li>Haz clic en "Iniciar Verificación"</li>
          <li>Abre la URL (o completa en este sitio)</li>
          <li>Sigue el flujo: sube documento + selfie + liveness check</li>
          <li>Espera resultado (inmediato o manual review)</li>
          <li>
            Recibiras webhook automáticamente en{" "}
            <code
              style={{
                backgroundColor: "var(--code-bg)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              /api/webhook
            </code>
          </li>
          <li>Haz clic en "Cargar webhooks" para verlo</li>
          <li>
            Verifica datos en{" "}
            <code
              style={{
                backgroundColor: "var(--code-bg)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              data/webhooks.json
            </code>
          </li>
        </ol>
      </div>
    </div>
  );
}
