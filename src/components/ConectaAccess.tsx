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
    const queryParams = new URLSearchParams(window.location.search);
    const isRecoveryReturn = queryParams.get("modo") === "nueva-clave";
    const authError = queryParams.get("error");
    let active = true;

    if (authError === "invalid_link") {
      queueMicrotask(() => { if (active) setErrorMessage("El enlace no es válido o ha vencido. Solicita uno nuevo."); });
    } else if (authError === "profile") {
      queueMicrotask(() => { if (active) setErrorMessage("Tu cuenta no tiene un perfil institucional activo. Contacta a la administración."); });
    }

    if (isRecoveryReturn) {
      void supabase.auth.getUser().then(({ data, error }) => {
        if (!active) return;
        if (error || !data.user) {
          setErrorMessage("El enlace no ha validado una sesión. Solicita una nueva recuperación.");
          return;
        }
        setMode("update");
        setSuccessMessage("Sesión verificada. Crea una nueva clave personal para CONECTA.");
      });
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("update");
        setSuccessMessage("Sesión de recuperación verificada. Define tu nueva clave.");
      }
    });

    return () => {
      active = false;
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

  const handleGoogleSignIn = async () => {
    resetMessages();
    if (!hasSupabasePublicConfig()) {
      setErrorMessage("No está disponible la configuración de acceso.");
      return;
    }
    try {
      setIsSubmitting(true);
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/mapa-vivo")}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión con Google.");
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
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/acceso?modo=nueva-clave")}`,
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
  const formTitle = mode === "recover" ? "Recuperar clave" : mode === "update" ? "Crear nueva clave" : "Bienvenido a Conecta";
  const formIntro = mode === "recover"
    ? "Enviaremos un enlace al correo registrado para que el usuario cree una nueva clave."
    : mode === "update"
      ? "Define una clave personal. Desde este punto cada usuario gobierna su propio acceso."
      : "Ingresa con tu correo registrado y continúa en tu espacio de trabajo.";

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
            <p>GRUPO AYC · PLATAFORMA CONECTA</p>
            <h1>Tu talento. Tu equipo. Un mismo propósito.</h1>
            <span>Conecta tu trabajo con lo que importa. Un espacio para conocer tu cargo, coordinar tu gestión y avanzar con tu equipo.</span>
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
                <span>Correo registrado</span>
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

          {mode === "signin" ? (
            <button
              className="conecta-access__google"
              disabled={isSubmitting}
              onClick={() => { void handleGoogleSignIn(); }}
              type="button"
            >
              Continuar con Google
            </button>
          ) : null}

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
              <button onClick={() => changeMode("recover")} type="button">
                Solicitar enlace nuevo
              </button>
            ) : null}
          </div>

          <div className="conecta-access__note">
            <LockKeyhole aria-hidden="true" size={17} />
            <p>
              Tu acceso es personal. La información disponible corresponde a tu cargo y a los permisos asignados.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
