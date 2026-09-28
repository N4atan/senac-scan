
import { LogTransferenciaPendente } from "@/actions/logTransferenciasAction";
import { ArrowDown, ArrowRight, Clock, Tag } from "lucide-react";

export type CardProps = {
    transf: LogTransferenciaPendente
}


export default function CardBemTransfPendente({ transf }: CardProps) {
    return (
        <div key={transf.id} className="card card-border w-96">
            <div className="card-body  gap-4">
                <span className="text-md font-semibold">{transf.bem.descricao_bem}</span>

                <div className="flex gap-2 items-center justify-between">
                    <span className="badge badge-info">
                        <Tag size={12} />
                        #{transf.bem.codigo_patrimonial}
                    </span>

                    <div className="tooltip tooltip-warning tooltip-top" data-tip="Data da Transferência">
                        <span className="badge badge-warning">
                            <Clock size={12} />
                            {transf.data_transferencia.toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                </div>



                <div className="bg-base-200 flex flex-col justify-between items-center gap-4 p-4 rounded-box">
                    <div className="text-center">
                        <span className="text-xs text-base-content/60 block">Local Atual</span>
                        <span className="truncate text-sm font-semibold">{transf.Local_origem?.descricao || "Sem local definido"}</span>
                    </div>

                    <ArrowDown size={18} className="text-success" />

                    <div className="text-center">
                        <span className="text-xs text-base-content/60 block">Novo Local</span>
                        <span className="truncate text-sm font-semibold">{transf.Local_destino?.descricao || "Sem local definido"}</span>
                    </div>
                </div>

                <button className="btn btn-success btn-outline">SISPRO | Finalizar</button>

            </div>
        </div>
    )
}