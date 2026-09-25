import { ArrowRight, Clock, Tag } from "lucide-react"




const dataExample = [
  {
    idTransacao: "11",
    bemPatrimonial: {
      patrimonio: "224242",
      identificacao: "-",
      descricao: "MICROCOMPUTADOR LENOVO 16GB MOD. M75S RYZEN 5",
      localizacao: "Unisinos | Depósito TI",
      categoria: "Desktop",
      status: "Funcional"
    },
    novo_local: "Unisinos | Sala 101",
    responsavel: "Natan",
    status_transacao: "Pendente",
    data_registro: "2026-09-24T11:56:47"
  },
  {
    idTransacao: "11",
    bemPatrimonial: {
      patrimonio: "224242",
      identificacao: "-",
      descricao: "MICROCOMPUTADOR LENOVO 16GB MOD. M75S RYZEN 5",
      localizacao: "Unisinos | Depósito TI",
      categoria: "Desktop",
      status: "Funcional"
    },
    novo_local: "Unisinos | Sala 101",
    responsavel: "Natan",
    status_transacao: "Pendente",
    data_registro: "2026-09-24T11:56:47"
  },
  {
    idTransacao: "11",
    bemPatrimonial: {
      patrimonio: "224242",
      identificacao: "-",
      descricao: "MICROCOMPUTADOR LENOVO 16GB MOD. M75S RYZEN 5",
      localizacao: "Unisinos | Depósito TI",
      categoria: "Desktop",
      status: "Funcional"
    },
    novo_local: "Unisinos | Sala 101",
    responsavel: "Natan",
    status_transacao: "Pendente",
    data_registro: "2026-09-24T11:56:47"
  },
  {
    idTransacao: "11",
    bemPatrimonial: {
      patrimonio: "224242",
      identificacao: "-",
      descricao: "MICROCOMPUTADOR LENOVO 16GB MOD. M75S RYZEN 5",
      localizacao: "Unisinos | Depósito TI",
      categoria: "Desktop",
      status: "Funcional"
    },
    novo_local: "Unisinos | Sala 101",
    responsavel: "Natan",
    status_transacao: "Pendente",
    data_registro: "2026-09-24T11:56:47"
  },
  {
    idTransacao: "11",
    bemPatrimonial: {
      patrimonio: "224242",
      identificacao: "-",
      descricao: "MICROCOMPUTADOR LENOVO 16GB MOD. M75S RYZEN 5",
      localizacao: "Unisinos | Depósito TI",
      categoria: "Desktop",
      status: "Funcional"
    },
    novo_local: "Unisinos | Sala 101",
    responsavel: "Natan",
    status_transacao: "Pendente",
    data_registro: "2026-09-24T11:56:47"
  },
]

export default function Home() {
  return (
    <div className="p-4">
      <div className="card card-border rounded-box flex flex-col gap-5 mx-auto mt-5 md:mt-10 max-w-[80rem]">
        <div className="card-body">
          <h1 className="card-title text-xl font-semibold text-neutral">Pendências</h1>
          <p className="text-soft">Lançamentos que estão aguardando mudança no SISPRO.</p>
          <div className="divider"></div>


          <div className="flex flex-row flex-wrap justify-center gap-5">
            {dataExample.map(transf => (
              <div key={transf.idTransacao} className="card card-border w-96">
                <div className="card-body  gap-4">
                  <span className="text-md font-semibold">{transf.bemPatrimonial.descricao}</span>

                  <div className="flex gap-2 items-center justify-between">
                    <span className="badge badge-info">
                      <Tag size={12} />
                      #{transf.bemPatrimonial.patrimonio}
                    </span>

                    <span className="badge badge-warning">
                      <Clock size={12} />
                      {transf.data_registro}
                    </span>
                  </div>

                  <div className="bg-base-200 flex flex-row justify-between items-center gap-4 p-2 rounded-box">
                    <span className="truncate max-w-[40%] text-sm">{transf.bemPatrimonial.localizacao}</span>
                    <ArrowRight size={18} className="text-success"/>
                    <span className="truncate max-w-[40%] text-sm font-bold">{transf.novo_local}</span>
                  </div>

                  <button className="btn btn-success btn-outline">SISPRO | Finalizar</button>

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}