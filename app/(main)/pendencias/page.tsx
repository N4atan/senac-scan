"use client"

import CardBemTransfPendente from "@/components/Cards/CardBemTransfPendente";
import { useDataProvider } from "@/Providers/DataProvider";


export default function Home() {

  const { logsTransferencias, isLoadingLogsTransferencias } = useDataProvider();

  

  return (
    <div className="p-4">
      <div className="card card-border rounded-box flex flex-col gap-5 mx-auto mt-5 md:mt-10 max-w-[80rem]">
        <div className="card-body">
          <h1 className="card-title text-xl font-semibold text-neutral">Pendências</h1>
          <p className="text-soft">Lançamentos que estão aguardando mudança no SISPRO.</p>
          <div className="divider"></div>


          <div className="flex flex-row flex-wrap justify-center gap-5">

            {isLoadingLogsTransferencias ? (
              <div className="flex justify-center items-center py-10 bg-base-200 w-full">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : logsTransferencias?.length === 0 ? (
              <div className="flex justify-center items-center py-10 bg-base-200 w-full">
                <span className="text-soft">Nenhuma transferência encontrada.</span>
              </div>
            ) : (

              logsTransferencias?.map((logTransferencia) => (
                <CardBemTransfPendente key={logTransferencia.id} transf={logTransferencia} />
              ))

            )}
            
          </div>
        </div>
      </div>
    </div>
  )
}