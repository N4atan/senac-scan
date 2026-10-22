"use client"

import { Auditoria } from "@/app/generated/prisma/client"
import { ArrowDown, ChevronRight, Clock, Eye, FolderLock, LockIcon, LucideCalendarDays, Tag, Trash, Trash2 } from "lucide-react"

import { StatusAuditoria } from "@/app/generated/prisma/enums"
import { useDataProvider } from "@/Providers/DataProvider"
import { useRouter } from "next/navigation";
import Link from "next/link"



interface CardAuditoriaProps {
    auditoria: Auditoria,
}

export const CardAuditoria = ({ auditoria }: CardAuditoriaProps) => {

    const { updateAuditoria } = useDataProvider();
    const router = useRouter();

    return (
        <div className={`card card-border w-96 flex flex-col `}>
            <div className="card-body gap-4 flex flex-col flex-1">





                <div className="flex gap-2 items-center justify-between">
                    <span className={`badge badge-soft badge-sm ${auditoria.status === StatusAuditoria.FINALIZADA ? 'badge-success' :
                        auditoria.status === StatusAuditoria.CANCELADA ? 'badge-error' : 'badge-warning'
                        }`}>
                        {auditoria.status}
                    </span>


                    <span className="badge badge-soft badge-sm">
                        <LucideCalendarDays size={12} />
                        {auditoria.dataInicio ? new Date(auditoria.dataInicio).toLocaleDateString('pt-BR') : '-'}
                    </span>
                </div>


                <span className="text-lg font-semibold">{auditoria.titulo}</span>

                <div className="flex justify-between items-center mt-auto">


                    {auditoria.status == StatusAuditoria.EM_ANDAMENTO && (
                        <>
                            <button className="btn btn-sm btn-soft btn-error tooltip tooltip-top tooltip-error " data-tip="Cancelar Auditoria" onClick={() => updateAuditoria(auditoria.id, { status: StatusAuditoria.CANCELADA })}>
                                <FolderLock size={14} />
                            </button>

                            <Link
                                className="btn btn-soft btn-sm btn-primary"
                                href={`/auditorias/${auditoria.id}/mapa`}
                            >
                                Continuar Auditoria
                                <ChevronRight size={12} />
                            </Link>
                        </>
                    )}

                    {auditoria.status == StatusAuditoria.FINALIZADA && (
                        <Link
                            className="btn btn-soft btn-sm btn-success"
                            href={`/auditorias/${auditoria.id}/mapa`}
                        >
                            Visualizar Auditoria
                            <Eye size={12} />
                        </Link>
                    )}
                </div>

            </div>
        </div>
    )
}