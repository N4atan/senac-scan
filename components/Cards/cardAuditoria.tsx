"use client"

import { Auditoria } from "@/app/generated/prisma/client"
import { ArrowDown, ChevronRight, Clock, LucideCalendarDays, Tag, Trash } from "lucide-react"

import { StatusAuditoria } from "@/app/generated/prisma/enums"
import { useDataProvider } from "@/Providers/DataProvider"
import { useRouter } from "next/navigation";
import Link from "next/link"



interface CardAuditoriaProps {
    auditoria: Auditoria,
}

export const CardAuditoria = ({ auditoria }: CardAuditoriaProps) => {

    const router = useRouter();

    return (
        <div className={`card card-border w-96 flex flex-col `}>
            <div className="card-body gap-4 flex flex-col flex-1">





                <div className="flex gap-2 items-center justify-between">
                    <span className="badge badge-soft badge-secondary badge-sm">
                        {auditoria.status}
                    </span>


                    <span className="badge badge-soft badge-sm">
                        <LucideCalendarDays size={12} />
                        {auditoria.dataInicio.toLocaleDateString('pt-BR')}
                    </span>
                </div>


                <span className="text-lg font-semibold">{auditoria.titulo}</span>

                <Link
                    className="btn btn-ghost btn-sm"
                    href={`/auditorias/${auditoria.id}/mapa`}
                >
                    Continuar Auditoria
                    <ChevronRight size={12} />
                </Link>




            </div>
        </div>
    )
}