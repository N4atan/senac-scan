"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function Page() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                toast.error(res.error);
            } else {
                toast.success("Login realizado com sucesso!");
                router.push("/busca");
                router.refresh();
            }
        } catch {
            toast.error("Ocorreu um erro ao tentar entrar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen w-full flex flex-col-reverse lg:flex-row items-center justify-center p-4 sm:p-8 lg:p-12 gap-8 lg:gap-12 ">
            {/* Seção do Formulário */}
            <section className="w-full lg:w-1/2 flex justify-center items-center">
                <div className="card w-full max-w-md bg-base-100 ">
                    <div className="card-body p-6 sm:p-8">
                        <h1 className="text-center text-2xl sm:text-3xl font-bold tracking-tight">
                            Bem-vindo ao SenacScan!
                        </h1>
                        <p className="text-center text-sm text-base-content/70 mt-1 mb-6">
                            Um sistema simples e prático para gerenciamento de bens patrimoniais do SENAC
                        </p>

                        <form className="flex flex-col gap-4 w-full" onSubmit={onSubmit}>
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend font-medium">E-mail</legend>
                                <input
                                    type="email"
                                    className="input w-full"
                                    placeholder="usuario@senacrs.com.br"
                                    id="inp-email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </fieldset>

                            <fieldset className="fieldset">
                                <legend className="fieldset-legend font-medium">Senha</legend>
                                <label className="input w-full flex items-center gap-2">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="inp-password"
                                        placeholder="Digite sua senha"
                                        className="grow"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="cursor-pointer text-base-content/70 hover:text-base-content transition-colors p-1"
                                        aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                                        title={showPassword ? "Ocultar senha" : "Ver senha"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </label>
                                <p className="text-xs text-base-content/60 mt-1">
                                    Caso tenha esquecido sua senha, entre em contato com a administração.
                                </p>
                            </fieldset>

                            <button
                                type="submit"
                                className="btn btn-primary w-full mt-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    "Entrar"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Seção da Ilustração */}
            <section className="w-full lg:w-1/2 flex justify-center items-center">
                <div className="flex flex-col justify-center items-center p-2 sm:p-4">
                    <a
                        href="https://storyset.com/idea"
                        target="_blank"
                        rel="noreferrer"
                        className="transition-transform duration-300 hover:scale-[1.02]"
                    >
                        <img
                            src="/Deconstructed.gif"
                            alt="Ilustração por Storyset"
                            className="max-h-83 lg:max-h-[460px] w-auto max-w-full object-contain"
                        />
                    </a>
                </div>
            </section>
        </main>
    );
}