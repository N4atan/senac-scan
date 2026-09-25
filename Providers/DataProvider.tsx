"use client";

import { BemComLocal, getAllBens, getAllSalas, patchLocaldoBem } from "@/actions/bensActions";
import { sala } from "@/app/generated/prisma/client";
import { createContext, useContext, useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";


type DataProviderProps = {
    children: React.ReactNode;
}

interface DataProviderContext {
    salas: sala[];
    setSalas: (salas: sala[]) => void;

    bens: BemComLocal[];
    setBens: (bens: BemComLocal[]) => void;

    refreshBens: () => Promise<void>;
    refreshSalas: () => Promise<void>;

    updateLocalBem: (codigo_patrimonial: string, local_id: string | number) => Promise<boolean>;

    isLoadingBens: boolean;
    isLoadingSalas: boolean;
}

const Context = createContext<DataProviderContext | null>(null);

export function DataProvider({ children }: DataProviderProps) {
    const [salas         , setSalas     ] = useState<sala[]>([]);
    const [bens          , setBens      ] = useState<BemComLocal[]>([]);
    const [isLoadingBens , setIsLoadingBens ] = useState<boolean>(false);
    const [isLoadingSalas, setIsLoadingSalas] = useState<boolean>(false);

    useEffect(() => {
        refreshBens();
        refreshSalas();
    }, []);

    const refreshBens = async () => {
        setIsLoadingBens(true);
        await getAllBens().then((res) => {
            setBens(res.data);
        }).finally(() => {
            setIsLoadingBens(false);
        });
    };

    const refreshSalas = async () => {
        setIsLoadingSalas(true);
        await getAllSalas().then((res) => {
            setSalas(res.data);
        }).finally(() => {
            setIsLoadingSalas(false);
        });
    };

    const updateLocalBem = async (codigo_patrimonial: string, local_id: string | number): Promise<boolean> => {
        const toastId = toast.loading("Atualizando localização...");
        try {
            const resp = await patchLocaldoBem(codigo_patrimonial, String(local_id));
            if (resp.status === 200 && resp.data) {
                setBens((prev) =>
                    prev.map((b) => (b.codigo_patrimonial === codigo_patrimonial ? resp.data! : b))
                );
                toast.success(resp.message || "Localização atualizada com sucesso!", { id: toastId });
                return true;
            } else {
                toast.error(resp.message || "Erro ao atualizar localização.", { id: toastId });
                return false;
            }
        } catch (error) {
            console.error("Erro ao atualizar local:", error);
            toast.error("Erro inesperado ao atualizar localização.", { id: toastId });
            return false;
        }
    };

    return (
        <Context.Provider value={{ salas, setSalas, bens, setBens, refreshBens, refreshSalas, updateLocalBem, isLoadingBens, isLoadingSalas }}>
            <Toaster position="top-right" />
            {children}
        </Context.Provider>
    );
}

export const useDataProvider = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error("useDataProvider deve ser usado dentro de DataProvider");
    }
    return context;
};