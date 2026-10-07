

import { BensParaAtualizar } from "@/actions/importBensAction";
import { LogTransferenciaPendente } from "@/actions/logTransferenciasAction";
import { EnumStatusTransferencia } from "@/app/generated/prisma/enums";
import { useDataProvider } from "@/Providers/DataProvider";
import { ArrowDown, Clock, Tag } from "lucide-react";

export type CardProps = {
    log: BensParaAtualizar
}


export default function CardBemSincronizar({ log }: CardProps) {

    return (
        <div key={log.bem.id} className="card card-border w-96 flex flex-col">
            <div className="card-body gap-4 flex flex-col flex-1">

                <span className="text-md font-semibold">{log.bem.descricao_bem}</span>
                
                <div className="flex gap-2 items-center justify-between">
                    <span className="badge badge-info">
                        <Tag size={12} />
                        #{log.bem.codigo_patrimonial}
                    </span>
                </div>



                <div className="bg-base-200 flex-1 flex flex-col justify-center items-center gap-4 p-4 rounded-box">
                    <div className="text-center">
                        <span className="text-xs text-base-content/60 block">Local Atual</span>
                        <span className="truncate text-sm font-semibold">{log.bem.Local?.descricao || "Sem local definido"}</span>
                    </div>

                    <ArrowDown size={18} className="text-success" />

                    <div className="text-center">
                        <span className="text-xs text-base-content/60 block">Novo Local</span>
                        <span className="truncate text-sm font-semibold">{log.new_local.descricao || "Sem local definido"}</span>
                    </div>
                </div>



            </div>
        </div>
    )
}