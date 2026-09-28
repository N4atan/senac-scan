"use client";

import { BemComLocal, getAllBens, getAllSalas, patchLocaldoBem } from "@/actions/bensActions";
import { getLogsTransferenciaPendente, LogTransferenciaPendente, patchStatusTransf } from "@/actions/logTransferenciasAction";
import { EnumStatusTransferencia, log_transferencia, sala } from "@/app/generated/prisma/client";
import { supabase } from "@/lib/supabase";
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

    logsTransferencias: LogTransferenciaPendente[];
    setLogsTransferencias: (logsTransferenciaPendente: LogTransferenciaPendente[]) => void;

    refreshBens: () => Promise<void>;
    refreshSalas: () => Promise<void>;
    refreshLogsTransferencias: () => Promise<void>;

    updateLocalBem: (codigo_patrimonial: string, local_id: string | number) => Promise<boolean>;

    updateStatusTransf: (id: string, new_status: EnumStatusTransferencia) => Promise<boolean>;

    isLoadingBens: boolean;
    isLoadingSalas: boolean;
    isLoadingLogsTransferencias: boolean;
}

const Context = createContext<DataProviderContext | null>(null);

export function DataProvider({ children }: DataProviderProps) {
    const [salas, setSalas] = useState<sala[]>([]);
    const [bens, setBens] = useState<BemComLocal[]>([]);
    const [logsTransferencias, setLogsTransferencias] = useState<LogTransferenciaPendente[]>([]);

    const [isLoadingBens, setIsLoadingBens] = useState<boolean>(false);
    const [isLoadingSalas, setIsLoadingSalas] = useState<boolean>(false);
    const [isLoadingLogsTransferencias, setIsLoadingLogsTransferencias] = useState<boolean>(false);

    useEffect(() => {
        refreshBens();
        refreshSalas();
        refreshLogsTransferencias();

        const subscription = supabase
            .channel('schema-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public' },
                (payload) => {
                    console.log("Alterações no banco detectadas.", payload)

                    refreshBens();
                    refreshSalas();
                    refreshLogsTransferencias();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
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

    const refreshLogsTransferencias = async () => {
        setIsLoadingLogsTransferencias(true);
        await getLogsTransferenciaPendente().then((res) => {
            setLogsTransferencias(res.data);
        }).finally(() => {
            setIsLoadingLogsTransferencias(false);
        });
    };

    const updateLocalBem = async (codigo_patrimonial: string, local_id: string | number): Promise<boolean> => {
        const toastId = toast.loading("Atualizando localização...");
        try {
            const resp = await patchLocaldoBem(codigo_patrimonial, String(local_id));
            if (resp.status === 200 && resp.data) {
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

    const updateStatusTransf = async (id: string, new_status: EnumStatusTransferencia): Promise<boolean> => {
        const toastId = toast.loading("Atualizando status...");
        try {
            const resp = await patchStatusTransf(id, new_status);
            if (resp.status === 200 && resp.data) {
                toast.success(resp.message || "Status atualizado com sucesso!", { id: toastId });
                return true;
            } else {
                toast.error(resp.message || "Erro ao atualizar status.", { id: toastId });
                return false;
            }
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            toast.error("Erro inesperado ao atualizar status.", { id: toastId });
            return false;
        }
    }

    return (
        <Context.Provider value={{ salas, setSalas, bens, setBens, logsTransferencias, setLogsTransferencias, refreshBens, refreshSalas, refreshLogsTransferencias, updateLocalBem, updateStatusTransf, isLoadingBens, isLoadingSalas, isLoadingLogsTransferencias }}>
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