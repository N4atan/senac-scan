"use client";
import { BarcodeIcon, Building2Icon, CheckCircle, CloudDownload, FilePenLineIcon, Filter, List, Plus, Search } from "lucide-react";


import { useDataProvider } from "@/Providers/DataProvider";

import { CardAuditoria } from "@/components/Cards/cardAuditoria";

import { useParams } from 'next/navigation';
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {

  const {
    auditorias,
    salas,
    bens,
    salasPendentes,
    salasConcluidas,
    isLoadingMapaSalas,
    refreshMapaSalas
  } = useDataProvider();

  const params = useParams<{ id: string }>();
  const id = params.id;

  const auditoriaAtiva = auditorias.find((auditoria) => auditoria.id === id);

  useEffect(() => {
    if (id) {
      refreshMapaSalas(id);
    }
  }, [id]);

  return (
    <div className="p-4 w-full flex flex-col items-center justify-center gap-8 ">

      <div className="stats border border-base-300 w-full max-w-4xl mt-4 md:mt-8">
        <div className="stat">
          <div className="stat-figure text-primary">
            <FilePenLineIcon size={32} />
          </div>
          <div className="stat-title">Auditoria Selecionada</div>
          <div className="stat-value text-primary">{auditoriaAtiva?.titulo || "Carregando..."}</div>
          <div className="stat-desc">
            {auditoriaAtiva?.dataInicio 
              ? `Iniciada em: ${new Date(auditoriaAtiva.dataInicio).toLocaleDateString('pt-BR')}`
              : "Buscando dados..."}
          </div>
        </div>

        <div className="stat">
          <div className="stat-figure text-secondary">
            <Building2Icon size={32} />
          </div>
          <div className="stat-title">Salas Cadastradas</div>
          <div className="stat-value text-secondary">{salas?.length || 0}</div>
        </div>

        <div className="stat">
          <div className="stat-title">Progresso</div>
          <div className="stat-value flex flex-col justify-center items-start mb-2">
            <span className="text-success ">
              {Math.round(((auditoriaAtiva?.itensAuditados?.length || 0) / (bens.length || 1)) * 100)} %
            </span>
            <progress 
              className="progress progress-accent w-full" 
              value={((auditoriaAtiva?.itensAuditados?.length || 0) / (bens.length || 1)) * 100} 
              max="100"
            ></progress>
          </div>
          <div className="stat-desc text-secondary">
            {auditoriaAtiva?.itensAuditados?.length || 0} Bens auditados de {bens.length}
          </div>
        </div>
      </div>


      <details className="collapse collapse-arrow bg-base-100 border border-base-300 max-w-4xl w-full" open>
        <summary className="collapse-title font-semibold">
          <div className="badge badge-soft badge-warning mr-5">
            {isLoadingMapaSalas ? (
              <span className="loading loading-bars loading-xs"></span>
            ) : (
              <span>{salasPendentes.length}</span>
            )}
          </div>
          <span>Salas não Auditadas ({salasPendentes.length})</span>
        </summary>

        <div className="collapse-content text-sm">
          {isLoadingMapaSalas ? (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-md text-warning"></span>
            </div>
          ) : salasPendentes.length === 0 ? (
            <div className="py-8 text-center text-base-content/60 bg-base-200/50 rounded-box border border-dashed border-base-300">
              <p className="font-semibold text-success">🎉 Todas as salas foram 100% auditadas!</p>
              <p className="text-xs mt-1">Nenhuma sala com pendência restante nesta auditoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {salasPendentes.map((sala) => (
                <div key={sala.salaId} className={`card card-border flex flex-col`}>
                  <div className="card-body gap-4 flex flex-col flex-1">

                    <div className="flex gap-2 items-center justify-between">
                      <span className="badge badge-soft badge-secondary badge-sm">
                        {sala.salaEscola}
                      </span>

                      <span className="text-xs font-light">
                        ({sala.totalLidosOk}/{sala.totalBens})
                      </span>
                    </div>

                    <span className="text-lg font-semibold flex-1">{sala.salaDescricao}</span>
                    <progress className="progress progress-accent w-full" value={sala.progresso} max="100"></progress>

                    <Link
                      href={`/auditorias/${id}/mapa/${sala.salaId}/leitor`}
                      className="btn btn-ghost ">
                      <BarcodeIcon size={18} />
                      Iniciar Coleta
                    </Link>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>


      <details className="collapse collapse-arrow bg-base-100 border border-base-300 max-w-4xl w-full" open>
        <summary className="collapse-title font-semibold">
          <div className="badge badge-soft badge-success mr-5">
            {isLoadingMapaSalas ? (
              <span className="loading loading-bars loading-xs"></span>
            ) : (
              <span>{salasConcluidas.length}</span>
            )}
          </div>
          <span>Salas 100% Auditadas ({salasConcluidas.length})</span>
        </summary>

        <div className="collapse-content text-sm">
          {isLoadingMapaSalas ? (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-md text-success"></span>
            </div>
          ) : salasConcluidas.length === 0 ? (
            <div className="py-8 text-center text-base-content/60 bg-base-200/50 rounded-box border border-dashed border-base-300">
              <p className="font-semibold">Nenhuma sala 100% auditada até o momento.</p>
              <p className="text-xs mt-1">Inicie a coleta de bens nas salas pendentes para acompanhar o avanço.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {salasConcluidas.map((sala) => (
                <div key={sala.salaId} className={`card card-border flex flex-col`}>
                  <div className="card-body gap-4 flex flex-col flex-1">

                    <div className="flex gap-2 items-center justify-between">
                      <span className="badge badge-soft badge-secondary badge-sm">
                        {sala.salaEscola}
                      </span>

                      <span className="text-xs font-light text-success">
                        ({sala.totalLidosOk}/{sala.totalBens})
                      </span>
                    </div>

                    <span className="text-lg font-semibold flex-1">{sala.salaDescricao}</span>
                    <progress className="progress progress-accent w-full" value={sala.progresso} max="100"></progress>

                    <button className="btn btn-ghost ">
                      <List size={18} />
                      Ver Itens
                    </button>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>

    </div>
  );
}
