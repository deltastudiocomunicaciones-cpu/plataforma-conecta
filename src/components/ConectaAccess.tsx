"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { hasSupabasePublicConfig, requestPasswordReset, signInWithPassword, updateCurrentUserPassword } from "@/lib/conecta/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AccessMode = "signin" | "recover" | "update";

export function ConectaAccess() {
  const [mode, setMode] = useState<AccessMode>("signin");
  const [email, setEmail] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (!hasSupabasePublicConfig()) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);
    const isRecoveryLink = hashParams.get("type") === "recovery" || queryParams.get("modo") === "nueva-clave";

    if (isRecoveryLink) {
      queueMicrotask(() => {
        setMode("update");
        setSuccessMessage("Enlace validado. Crea una nueva clave personal para tu acceso Conecta.");
      });
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("update");
        setSuccessMessage("Enlace validado. Crea una nueva clave personal para tu acceso Conecta.");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const changeMode = (nextMode: AccessMode) => {
    resetMessages();
    setMode(nextMode);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if (!hasSupabasePublicConfig()) {
      setErrorMessage("Faltan las llaves de Supabase en .env.local para activar el acceso real.");
      return;
    }

    try {
      setIsSubmitting(true);
      await signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      setSuccessMessage("Acceso validado. Abriendo Mapa Vivo...");
      window.location.assign("/mapa-vivo");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido de autenticacion.";
      setErrorMessage(`No pudimos validar el acceso: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if (!hasSupabasePublicConfig()) {
      setErrorMessage("Faltan las llaves de Supabase en .env.local para activar la recuperacion de clave.");
      return;
    }

    try {
      setIsSubmitting(true);
      await requestPasswordReset({
        email: recoveryEmail.trim(),
        redirectTo: `${window.location.origin}/acceso?modo=nueva-clave`,
      });
      setSuccessMessage("Te enviamos un enlace para crear una nueva clave. Revisa el correo autorizado de ese usuario.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido de recuperacion.";
      setErrorMessage(`No pudimos enviar el enlace: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if (newPassword.length < 8) {
      setErrorMessage("La nueva clave debe tener minimo 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Las claves no coinciden. Verifica antes de continuar.");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateCurrentUserPassword(newPassword);
      setSuccessMessage("Clave actualizada. Ya puedes entrar al Mapa Vivo con tu nueva clave.");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMode("signin");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido al actualizar clave.";
      setErrorMessage(`No pudimos actualizar la clave: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSubmitHandler = mode === "recover" ? handlePasswordReset : mode === "update" ? handlePasswordUpdate : handleSubmit;
  const formTitle = mode === "recover" ? "Recuperar clave" : mode === "update" ? "Crear nueva clave" : "Ingreso Conecta";
  const formIntro = mode === "recover"
    ? "Enviaremos un enlace al correo registrado para que el usuario cree una nueva clave."
    : mode === "update"
      ? "Define una clave personal. Desde este punto cada usuario gobierna su propio acceso."
      : "Acceso protegido por correo, clave personal, rol y alcance dentro del organigrama.";

  return (
    <main className="conecta-access">
      <Link className="conecta-access__back" href="/">
        <ArrowLeft aria-hidden="true" size={17} />
        Volver a Plataforma Conecta
      </Link>

      <section className="conecta-access__shell">
        <div className="conecta-access__visual">
          <Image alt="" fill priority sizes="(max-width: 900px) 100vw, 520px" src="/method/metodo-conecta-nevado.png" />
          <div className="conecta-access__visual-copy">
            <Image alt="Cultura Conecta" height={1165} priority src="/brand/cultura-conecta-isotipo-3d.png" width={1350} />
            <p>Acceso protegido</p>
            <h1>Entrar al Mapa Vivo de Desempeño</h1>
            <span>La operación interna inicia después de validar identidad, empresa, rol y alcance.</span>
          </div>
        </div>

        <form className="conecta-access__form" onSubmit={activeSubmitHandler}>
          <div className="conecta-access__form-head">
            <ShieldCheck aria-hidden="true" size={24} />
            <div>
              <p className="eyebrow">Plataforma privada</p>
              <h2>{formTitle}</h2>
            </div>
          </div>
          <p className="conecta-access__intro">{formIntro}</p>

          {mode === "signin" ? (
            <>
              <label className="conecta-access__field">
                <span>Correo corporativo</span>
                <div>
                  <Mail aria-hidden="true" size={18} />
                  <input
                    autoComplete="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nombre@empresa.com"
                    type="email"
                    value={email}
                  />
                </div>
              </label>

              <label className="conecta-access__field">
                <span>Clave personal</span>
                <div>
                  <KeyRound aria-hidden="true" size={18} />
                  <input
                    autoComplete="current-password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Clave asignada"
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
                    className="conecta-access__password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
                  </button>
                </div>
              </label>
            </>
          ) : null}

          {mode === "recover" ? (
            <label className="conecta-access__field">
              <span>Correo registrado</span>
              <div>
                <Mail aria-hidden="true" size={18} />
                <input
                  autoComplete="email"
                  onChange={(event) => setRecoveryEmail(event.target.value)}
                  placeholder="usuario@empresa.com"
                  type="email"
                  value={recoveryEmail}
                />
              </div>
            </label>
          ) : null}

          {mode === "update" ? (
            <>
              <label className="conecta-access__field">
                <span>Nueva clave</span>
                <div>
                  <KeyRound aria-hidden="true" size={18} />
                  <input
                    autoComplete="new-password"
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Minimo 8 caracteres"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                  />
                  <button
                    aria-label={showNewPassword ? "Ocultar nueva clave" : "Mostrar nueva clave"}
                    className="conecta-access__password-toggle"
                    onClick={() => setShowNewPassword((current) => !current)}
                    type="button"
                  >
                    {showNewPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
                  </button>
                </div>
              </label>

              <label className="conecta-access__field">
                <span>Confirmar clave</span>
                <div>
                  <CheckCircle2 aria-hidden="true" size={18} />
                  <input
                    autoComplete="new-password"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repite la clave"
                    type={showNewPassword ? "text" : "password"}
                    value={confirmPassword}
                  />
                </div>
              </label>
            </>
          ) : null}

          {errorMessage ? (
            <p className="conecta-access__error" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p className="conecta-access__success" role="status">
              {successMessage}
            </p>
          ) : null}

          <button
            className="conecta-access__submit"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? mode === "recover"
                ? "Enviando enlace..."
                : mode === "update"
                  ? "Actualizando clave..."
                  : "Validando acceso..."
              : mode === "recover"
                ? "Enviar enlace seguro"
                : mode === "update"
                  ? "Guardar nueva clave"
                  : "Entrar al mapa vivo"}
            <ArrowRight aria-hidden="true" size={18} />
          </button>

          <div className="conecta-access__actions" aria-label="Acciones de acceso">
            {mode !== "signin" ? (
              <button onClick={() => changeMode("signin")} type="button">
                Volver al ingreso
              </button>
            ) : (
              <button onClick={() => {
                setRecoveryEmail(email);
                changeMode("recover");
              }} type="button">
                Olvidé mi clave
              </button>
            )}
            {mode !== "update" ? (
              <button onClick={() => changeMode("update")} type="button">
                Ya tengo enlace de recuperación
              </button>
            ) : null}
          </div>

          <div className="conecta-access__note">
            <LockKeyhole aria-hidden="true" size={17} />
            <p>
              Acceso conectado a Supabase Auth. La plataforma valida usuario, rol, empresa, permisos y auditoria de
              acceso antes de abrir la experiencia interna.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
