"use client";

import { AuditoriaComBens, getAllAuditorias, getListaParaLeitura, getMapaSalas, ListaParaLeitura, postAuditoria, registrarItemAuditado, SalaMapeada } from "@/actions/auditoriaActions";
import { BemComLocal, getAllBens, getAllSalas, patchLocaldoBem, patchLocaldosBens } from "@/actions/bensActions";
import { BensParaAtualizar, mainImport } from "@/actions/importBensAction";
import { getLogsTransferenciaPendente, LogTransferenciaPendente, patchStatusTransf } from "@/actions/logTransferenciasAction";
import { getAllUsers, UserSemSenha } from "@/actions/usuariosAction";
import { EnumStatusTransferencia, log_transferencia, sala, User, Auditoria } from "@/app/generated/prisma/client";
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
    isLoadingAuditorias: boolean;
    auditorias: AuditoriaComBens[];
    setAuditorias: (auditorias: AuditoriaComBens[]) => void;
    refreshAuditorias: () => Promise<void>;
    createAuditoria: (formData: FormData) => Promise<boolean>;

    auditoriaAtiva: AuditoriaComBens | null;
    setAuditoriaAtiva: (auditoria: AuditoriaComBens | null) => void;
    auditoriaSelecionada: AuditoriaComBens | null;
    setAuditoriaSelecionada: (auditoria: AuditoriaComBens | null) => void;
    selecionarAuditoria: (auditoriaOuId: AuditoriaComBens | string | null) => void;
    limparAuditoriaAtiva: () => void;

    salasPendentes: SalaMapeada[];
    salasConcluidas: SalaMapeada[];
    isLoadingMapaSalas: boolean;
    refreshMapaSalas: (auditoriaId?: string) => Promise<void>;

    listaLeitura: ListaParaLeitura;
    bensLeituraOk: BemComLocal[];
    bensLeituraMovimentado: BemComLocal[];
    bensLeituraPendente: BemComLocal[];
    isLoadingListaLeitura: boolean;
    carregarListaLeitura: (salaId: string, auditoriaId: string) => Promise<ListaParaLeitura | null>;
    setListaLeitura: React.Dispatch<React.SetStateAction<ListaParaLeitura>>;
    registrarLeitura: (salaId: string, auditoriaId: string, bemId: number) => Promise<boolean>;
}

const Context = createContext<DataProviderContext | null>(null);

export function DataProvider({ children }: DataProviderProps) {
    const [salas, setSalas] = useState<sala[]>([]);
    const [bens, setBens] = useState<BemComLocal[]>([]);
    const [logsTransferencias, setLogsTransferencias] = useState<LogTransferenciaPendente[]>([]);
    const [users, setUsers] = useState<UserSemSenha[]>([]);
    const [bensParaAtualizar, setBensParaAtualizar] = useState<BensParaAtualizar[]>([]);
    const [auditorias, setAuditorias] = useState<AuditoriaComBens[]>([]);
    const [auditoriaAtiva, setAuditoriaAtiva] = useState<AuditoriaComBens | null>(null);

    const [salasPendentes, setSalasPendentes] = useState<SalaMapeada[]>([]);
    const [salasConcluidas, setSalasConcluidas] = useState<SalaMapeada[]>([]);
    const [isLoadingMapaSalas, setIsLoadingMapaSalas] = useState<boolean>(false);

    const [listaLeitura, setListaLeitura] = useState<ListaParaLeitura>({
        bensLeituraOk: [],
        bensLeituraMovimentado: [],
        bensLeituraPendente: []
    });
    const [isLoadingListaLeitura, setIsLoadingListaLeitura] = useState<boolean>(false);

    const [isLoadingBens, setIsLoadingBens] = useState<boolean>(false);
    const [isLoadingSalas, setIsLoadingSalas] = useState<boolean>(false);
    const [isLoadingLogsTransferencias, setIsLoadingLogsTransferencias] = useState<boolean>(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
    const [isLoadingBensParaAtualizar, setIsLoadingBensParaAtualizar] = useState<boolean>(false);
    const [isLoadingAuditorias, setIsLoadingAuditorias] = useState<boolean>(false);

    useEffect(() => {
        refreshBens();
        refreshSalas();
        refreshLogsTransferencias();
        refreshUsers();
        refreshAuditorias();
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

    useEffect(() => {
        const savedId = typeof window !== "undefined" ? localStorage.getItem("senac_scan_auditoria_ativa_id") : null;
        if (savedId && auditorias.length > 0 && !auditoriaAtiva) {
            const encontrada = auditorias.find((a) => a.id === savedId);
            if (encontrada) setAuditoriaAtiva(encontrada);
        }
    }, [auditorias, auditoriaAtiva]);

    useEffect(() => {
        if (auditoriaAtiva?.id) {
            refreshMapaSalas(auditoriaAtiva.id);
        } else {
            setSalasPendentes([]);
            setSalasConcluidas([]);
        }
    }, [auditoriaAtiva?.id]);

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

    const refreshAuditorias = async () => {
        setIsLoadingAuditorias(true);
        await getAllAuditorias().then((res) => {
            setAuditorias(res);
            setAuditoriaAtiva((prev) => {
                if (!prev) return null;
                return res.find((a: AuditoriaComBens) => a.id === prev.id) || null;
            });
        }).finally(() => {
            setIsLoadingAuditorias(false);
        });
    };

    const selecionarAuditoria = (auditoriaOuId: AuditoriaComBens | string | null) => {
        if (!auditoriaOuId) {
            setAuditoriaAtiva(null);
            if (typeof window !== "undefined") {
                localStorage.removeItem("senac_scan_auditoria_ativa_id");
            }
            return;
        }

        if (typeof auditoriaOuId === "string") {
            const encontrada = auditorias.find((a) => a.id === auditoriaOuId) || null;
            setAuditoriaAtiva(encontrada);
            if (typeof window !== "undefined" && encontrada) {
                localStorage.setItem("senac_scan_auditoria_ativa_id", encontrada.id);
            }
        } else {
            setAuditoriaAtiva(auditoriaOuId);
            if (typeof window !== "undefined") {
                localStorage.setItem("senac_scan_auditoria_ativa_id", auditoriaOuId.id);
            }
        }
    };

    const limparAuditoriaAtiva = () => {
        setAuditoriaAtiva(null);
        setSalasPendentes([]);
        setSalasConcluidas([]);
        if (typeof window !== "undefined") {
            localStorage.removeItem("senac_scan_auditoria_ativa_id");
        }
    };

    const refreshMapaSalas = async (auditoriaId?: string) => {
        const id = auditoriaId || auditoriaAtiva?.id;
        if (!id) {
            setSalasPendentes([]);
            setSalasConcluidas([]);
            return;
        }

        setIsLoadingMapaSalas(true);
        try {
            const resp = await getMapaSalas(id);
            if (resp.status === 200 && resp.data) {
                setSalasPendentes(resp.data.salasPendentes);
                setSalasConcluidas(resp.data.salasConcluidas);
            }
        } catch (error) {
            console.error("Erro ao carregar mapa de salas:", error);
        } finally {
            setIsLoadingMapaSalas(false);
        }
    };

    const carregarListaLeitura = async (salaId: string, auditoriaId: string): Promise<ListaParaLeitura | null> => {
        setIsLoadingListaLeitura(true);
        try {
            const resp = await getListaParaLeitura(salaId, auditoriaId);
            if (resp.status === 200 && resp.data) {
                setListaLeitura(resp.data);
                return resp.data;
            } else {
                setListaLeitura({
                    bensLeituraOk: [],
                    bensLeituraMovimentado: [],
                    bensLeituraPendente: []
                });
                if (resp.status === 404) {
                    toast(resp.message || "Nenhum bem cadastrado nesta sala.", { icon: "ℹ️" });
                } else {
                    toast.error(resp.message || "Erro ao carregar bens da sala.");
                }
                return null;
            }
        } catch (error) {
            console.error("Erro ao carregar lista para leitura:", error);
            toast.error("Erro inesperado ao carregar bens da sala.");
            return null;
        } finally {
            setIsLoadingListaLeitura(false);
        }
    };

    const registrarLeitura = async (salaId: string, auditoriaId: string, bemId: number): Promise<boolean> => {
        const toastId = toast.loading("Registrando conferência...");
        try {
            const resp = await registrarItemAuditado(auditoriaId, parseInt(salaId), bemId);
            if (resp.status === 200 && resp.data) {
                toast.success(resp.message || "Conferência registrada com sucesso!", { id: toastId });
                await carregarListaLeitura(salaId, auditoriaId);
                await refreshAuditorias();
                return true;
            } else {
                toast.error(resp.message || "Erro ao registrar conferência.", { id: toastId });
                return false;
            }
        } catch (error) {
            console.error("Erro ao registrar conferência:", error);
            toast.error("Erro inesperado ao registrar conferência.", { id: toastId });
            return false;
        }
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
            refreshAuditorias();
            if (auditoriaAtiva?.id) {
                refreshMapaSalas(auditoriaAtiva.id);
            }
        }, 500);
    };

    

    const createAuditoria = async (formData: FormData): Promise<boolean> => {
        const toastId = toast.loading("Criando Auditoria...");
        try {
            const titulo = formData.get("titulo") as string | null;

            if (!titulo || !titulo.trim()) {
                toast.error("O título da auditoria é obrigatório.", { id: toastId });
                return false;
            }

            const resp = await postAuditoria(titulo.trim());
            if (resp.status === 200 && resp.data) {
                toast.success(resp.message || "Auditoria criada com sucesso!", { id: toastId });
                await refreshAuditorias();
                return true;
            } else {
                toast.error(resp.message || "Erro ao criar auditoria.", { id: toastId });
                return false;
            }
        } catch (error) {
            console.error("Erro ao criar auditoria:", error);
            toast.error("Erro inesperado ao criar auditoria.", { id: toastId });
            return false;
        }
    };

    return (
        <Context.Provider value={{
            salas,
            setSalas,
            bens,
            setBens,
            logsTransferencias,
            setLogsTransferencias,
            users,
            setUsers,
            refreshBens,
            refreshSalas,
            refreshLogsTransferencias,
            refreshUsers,
            updateLocalBem,
            updateManyLocalBem,
            updateStatusTransf,
            handleTXTFileUpload,
            isLoadingBens,
            isLoadingSalas,
            isLoadingLogsTransferencias,
            isLoadingUsers,
            bensParaAtualizar,
            setBensParaAtualizar,
            isLoadingBensParaAtualizar,
            auditorias,
            setAuditorias,
            refreshAuditorias,
            isLoadingAuditorias,
            createAuditoria,
            auditoriaAtiva,
            setAuditoriaAtiva,
            auditoriaSelecionada: auditoriaAtiva,
            setAuditoriaSelecionada: setAuditoriaAtiva,
            selecionarAuditoria,
            limparAuditoriaAtiva,
            salasPendentes,
            salasConcluidas,
            isLoadingMapaSalas,
            refreshMapaSalas,
            listaLeitura,
            bensLeituraOk: listaLeitura.bensLeituraOk,
            bensLeituraMovimentado: listaLeitura.bensLeituraMovimentado,
            bensLeituraPendente: listaLeitura.bensLeituraPendente,
            isLoadingListaLeitura,
            carregarListaLeitura,
            setListaLeitura,
            registrarLeitura
        }}>
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