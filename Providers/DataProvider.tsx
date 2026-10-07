"use client";

import { BemComLocal, getAllBens, getAllSalas, patchLocaldoBem, patchLocaldosBens } from "@/actions/bensActions";
import { BensParaAtualizar, mainImport } from "@/actions/importBensAction";
import { getLogsTransferenciaPendente, LogTransferenciaPendente, patchStatusTransf } from "@/actions/logTransferenciasAction";
import { getAllUsers, UserSemSenha } from "@/actions/usuariosAction";
import { EnumStatusTransferencia, log_transferencia, sala, User } from "@/app/generated/prisma/client";
import { supabase } from "@/lib/supabase";
import { createContext, useContext, useState, useEffect, useRef } from "react";
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

    users: UserSemSenha[];
    setUsers: (users: UserSemSenha[]) => void;

    bensParaAtualizar: BensParaAtualizar[];
    setBensParaAtualizar: (bensParaAtualizar: BensParaAtualizar[]) => void;

    refreshBens: () => Promise<void>;
    refreshSalas: () => Promise<void>;
    refreshLogsTransferencias: () => Promise<void>;
    refreshUsers: () => Promise<void>;

    updateLocalBem: (codigo_patrimonial: string, local_id: string | number) => Promise<boolean>;

    updateManyLocalBem: (logs: BensParaAtualizar[]) => Promise<boolean>;

    updateStatusTransf: (id: string, new_status: EnumStatusTransferencia) => Promise<boolean>;

    handleTXTFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;

    isLoadingBens: boolean;
    isLoadingSalas: boolean;
    isLoadingLogsTransferencias: boolean;
    isLoadingUsers: boolean;
    isLoadingBensParaAtualizar: boolean;

}

const Context = createContext<DataProviderContext | null>(null);

export function DataProvider({ children }: DataProviderProps) {
    const [salas, setSalas] = useState<sala[]>([]);
    const [bens, setBens] = useState<BemComLocal[]>([]);
    const [logsTransferencias, setLogsTransferencias] = useState<LogTransferenciaPendente[]>([]);
    const [users, setUsers] = useState<UserSemSenha[]>([]);
    const [bensParaAtualizar, setBensParaAtualizar] = useState<BensParaAtualizar[]>([]);

    const [isLoadingBens, setIsLoadingBens] = useState<boolean>(false);
    const [isLoadingSalas, setIsLoadingSalas] = useState<boolean>(false);
    const [isLoadingLogsTransferencias, setIsLoadingLogsTransferencias] = useState<boolean>(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
    const [isLoadingBensParaAtualizar, setIsLoadingBensParaAtualizar] = useState<boolean>(false);

    useEffect(() => {
        refreshBens();
        refreshSalas();
        refreshLogsTransferencias();
        refreshUsers();
        const subscription = supabase
            .channel('schema-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public' },
                (payload) => {
                    console.log("Alteração detectada:", payload.table);
                    // Chama a versão com debounce em vez de chamar direto:
                    triggerDebouncedRefresh();
                }
            )
            .subscribe();
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
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
            if (resp.status) {
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

    const updateManyLocalBem = async (logs: BensParaAtualizar[]): Promise<boolean> => {
        const toastId = toast.loading("Atualizando localizações...");
        try {
            const resp = await patchLocaldosBens(logs);
            if (resp.status === 200 && resp.data) {
                toast.success(resp.message || "Localizações atualizadas com sucesso!", { id: toastId });
                return true;
            } else {
                toast.error(resp.message || "Erro ao atualizar localizações.", { id: toastId });
                return false;
            }
        } catch (error) {
            console.error("Erro ao atualizar localizações:", error);
            toast.error((error as string) || "Erro inesperado ao atualizar localizações.", { id: toastId });
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

    const refreshUsers = async () => {
        setIsLoadingUsers(true);
        await getAllUsers().then((res) => {
            setUsers(res.data || []);
        }).finally(() => {
            setIsLoadingUsers(false);
        });
    };

    const handleTXTFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setIsLoadingBensParaAtualizar(true);

            const file = e.target?.files?.[0]

            if (!file) {
                toast('Nenhum arquivo selecionado', {
                    icon: '⚠️'
                })

                return;
            }

            const formData = new FormData();
            formData.append('file', file);


            const result = await mainImport(formData);

            setBensParaAtualizar(result.data || [])

        } catch (error: any) {
            toast.error(error || "Houve um erro ao importar o arquivo!");
        } finally {
            setIsLoadingBensParaAtualizar(false);
        }
    }

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const triggerDebouncedRefresh = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        // Aguarda 500ms sem novos eventos antes de recarregar
        debounceTimerRef.current = setTimeout(() => {
            refreshBens();
            refreshSalas();
            refreshLogsTransferencias();
        }, 500);
    };

    return (
        <Context.Provider value={{ salas, setSalas, bens, setBens, logsTransferencias, setLogsTransferencias, users, setUsers, refreshBens, refreshSalas, refreshLogsTransferencias, refreshUsers, updateLocalBem, updateManyLocalBem, updateStatusTransf, handleTXTFileUpload, isLoadingBens, isLoadingSalas, isLoadingLogsTransferencias, isLoadingUsers, bensParaAtualizar, setBensParaAtualizar, isLoadingBensParaAtualizar }}>
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