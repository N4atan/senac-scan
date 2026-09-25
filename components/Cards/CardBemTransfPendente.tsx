
import { LogTransferenciaPendente } from "@/actions/logTransferenciasAction";
import { ArrowRight, Clock, Tag } from "lucide-react";

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

                    <span className="badge badge-warning">
                        <Clock size={12} />
                        {transf.data_transferencia.toDateString()}
                    </span>
                </div>

                <div className="bg-base-200 flex flex-row justify-between items-center gap-4 p-2 rounded-box">
                    <span className="truncate max-w-[40%] text-sm">{transf.Local_origem?.descricao}</span>
                    <ArrowRight size={18} className="text-success" />
                    <span className="truncate max-w-[40%] text-sm font-bold">{transf.Local_destino?.descricao}</span>
                </div>

                <button className="btn btn-success btn-outline">SISPRO | Finalizar</button>

            </div>
        </div>
    )
}