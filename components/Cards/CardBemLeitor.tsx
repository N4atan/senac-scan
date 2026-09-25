"use client";

import { BemComLocal } from "@/actions/bensActions";
import { sala } from "@/app/generated/prisma/client";
import { useDataProvider } from "@/Providers/DataProvider";
import { ArrowDown, Tag } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export type CardProps = {
    bem: BemComLocal;
    salas: sala[];
}

export default function CardBemLeitor({ bem, salas }: CardProps) {
    const [novoLocal, setNovoLocal] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const { updateLocalBem } = useDataProvider();

    const handleSave = async () => {
        if (!novoLocal.trim()) {
            toast.error("Por favor, selecione ou digite o novo local.");
            return;
        }

        const salaEncontrada = salas.find(
            (s) => s.descricao.toLowerCase() === novoLocal.trim().toLowerCase() || String(s.id) === novoLocal.trim()
        );

        if (!salaEncontrada) {
            toast.error("Local não reconhecido. Escolha uma sala válida da lista.");
            return;
        }

        if (salaEncontrada.id === bem.id_local) {
            toast.error("O bem já está cadastrado nesta localização!");
            return;
        }

        if (!bem.codigo_patrimonial) {
            toast.error("Bem sem código patrimonial válido.");
            return;
        }

        setIsSaving(true);
        const sucesso = await updateLocalBem(bem.codigo_patrimonial, salaEncontrada.id);
        setIsSaving(false);

        if (sucesso) {
            setNovoLocal('');
        }
    };

    return (
        <div key={bem.id} className="card card-border max-w-md w-full">
            <div className="card-body gap-4">
                <span className="text-md font-semibold">{bem.descricao_bem}</span>

                <div className="flex gap-2 items-center justify-between">
                    <span className="badge badge-info">
                        <Tag size={12} />
                        #{bem.codigo_patrimonial}
                    </span>
                    <span className="badge badge-ghost text-xs">
                        {bem.categoria}
                    </span>
                </div>

                <div className="bg-base-200 flex flex-col justify-between items-center gap-4 p-4 rounded-box">
                    <div className="text-center">
                        <span className="text-xs text-base-content/60 block">Local Atual</span>
                        <span className="truncate text-sm font-semibold">{bem.Local?.descricao || "Sem local definido"}</span>
                    </div>

                    <ArrowDown size={18} className="text-success" />

                    <div className="w-full">
                        <input
                            type="text"
                            className="input input-bordered w-full font-bold text-center"
                            list="localizacoes"
                            placeholder="Selecione o Novo Local"
                            value={novoLocal}
                            onChange={(e) => setNovoLocal(e.target.value)}
                            disabled={isSaving}
                        />
                        <datalist id="localizacoes">
                            {salas.map((sala) => (
                                <option key={sala.id} value={sala.descricao}>
                                    {sala.descricao}
                                </option>
                            ))}
                        </datalist>
                    </div>
                </div>

                <button 
                    className="btn btn-success" 
                    onClick={handleSave}
                    disabled={isSaving || !novoLocal.trim()}
                > 
                    {isSaving ? (
                        <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Salvando...
                        </>
                    ) : (
                        "Confirmar Mudança de Local"
                    )}
                </button>
            </div>
        </div>
    );
}