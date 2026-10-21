"use client";

import BarcodeScan from "@/components/BarcodeScan";
import CardBemLeitor from "@/components/Cards/CardBemLeitor";
import CardBemSincronizar from "@/components/Cards/CardBemSincronizar";
import { useDataProvider } from "@/Providers/DataProvider";
import { ArrowRightLeft, Barcode, CircleCheck, CircleDashed, CircleDashedCheck, ListTodo, LocateIcon, MapPinned, SearchX } from "lucide-react";
import { useParams } from 'next/navigation';
import { useState, useMemo, useEffect } from "react";


export default function Home() {


  const {
    bens,
    salas,
    bensLeituraPendente,
    bensLeituraOk,
    bensLeituraMovimentado,
    isLoadingListaLeitura,
    carregarListaLeitura
  } = useDataProvider();

  const params = useParams<{ id: string, salaId: string }>();
  const salaId = params.salaId;
  const auditoriaId = params.id;

  const sala = salas.find(s => s.id.toString() == salaId);

  const [scanResult, setScanResult] = useState<string>('');



  const bemEncontrado = useMemo(() => {
    if (!scanResult) return null;

    return bens.find((b) => b.codigo_patrimonial === scanResult);

  }, [scanResult, bens, salas])


  useEffect(() => {
    if (salaId && auditoriaId) {
      carregarListaLeitura(salaId, auditoriaId)
    }
  }, [salaId, auditoriaId]);



  return (
    <div className="p-4 min-h-full">

      <div className="flex flex-row flex-wrap items-start max-w-4xl mx-auto gap-4 mt-4 md:mt-8">

        <div className="card card-border w-full md:max-w-1/2 md:sticky md:top-20">
          <div className="card-body flex-col justify-start items-center">


            <h2 className="card-title">Leitor Patrimonial</h2>
            <p className="text-soft text-center">Aponte a câmera para a etiqueta do bem patrimonial.</p>

            <BarcodeScan setResult={setScanResult} />

            <div className="join w-full max-w-md my-3">
              <label className="input join-item flex-1">
                <Barcode size={14} />
                <input type="search" className="grow truncate" placeholder="Ou digite o número do patrimônio" value={scanResult || ""} onChange={(e) => setScanResult(e.target.value)} />
              </label>
              <button className="btn join-item btn-error " onClick={() => setScanResult("")}>
                <SearchX size={20} className="text-white" />
              </button>
            </div>

            {bemEncontrado ? (
              <button className="btn btn-primary w-full">
                Validar
              </button>
            ) : (
              scanResult.trim() !== "" && (
                <div className="alert alert-warning max-w-md text-sm">
                  <span>Nenhum bem patrimonial encontrado com o código <strong>"{scanResult}"</strong>.</span>
                </div>
              )
            )}

          </div>
        </div>


        <div className="card card-border flex-1 ">
          <div className="card-body">

            <span className="card-title">
              <ListTodo className="text-primary" />
              Check List da Sala
            </span>

            <details className="collapse collapse-arrow bg-base-100 border border-base-300 max-w-4xl w-full" >
              <summary className="collapse-title font-semibold">
                <div className="badge badge-soft badge-warning mr-5">
                  <CircleDashed size={14} />
                </div>
                <span>Bens Pendentes</span>
              </summary>

              <div className="collapse-content">
                <ul className="list bg-base-100 w-full gap-4">
                  {bensLeituraPendente.map((b) => (
                    <li key={b.id} className="list-row border border-base-300 rounded-sm">
                      <div className="list-col-grow">
                        <div className="text-primary">
                          {b.codigo_patrimonial}
                        </div>

                        <div className="text-xs uppercase font-semibold opacity-60">
                          {b.descricao_bem}
                        </div>
                      </div>

                      <div className="badge badge-warning self-center">
                        <CircleDashed size={14} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </details>

            <details className="collapse collapse-arrow bg-base-100 border border-base-300 max-w-4xl w-full" >
              <summary className="collapse-title font-semibold">
                <div className="badge badge-soft badge-success mr-5">
                  <CircleCheck size={14} />
                </div>
                <span>Bens Coletados</span>
              </summary>

              <div className="collapse-content">
                <ul className="list bg-base-100 w-full gap-4">
                  {bensLeituraOk.map((b) => (
                    <li key={b.id} className="list-row border border-base-300 rounded-sm">
                      <div className="list-col-grow">
                        <div className="text-primary">
                          {b.codigo_patrimonial}
                        </div>
                        <div className="text-xs uppercase font-semibold opacity-60">
                          {b.descricao_bem}
                        </div>
                      </div>
                      <div className="badge badge-success self-center">
                        <CircleDashedCheck size={14} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </details>

            <details className="collapse collapse-arrow bg-base-100 border border-base-300 max-w-4xl w-full" >
              <summary className="collapse-title font-semibold">
                <div className="badge badge-soft badge-primary mr-5">
                  <ArrowRightLeft size={14} />
                </div>
                <span>Bens Movimentados</span>
              </summary>

              <div className="collapse-content">
                <ul className="list bg-base-100 w-full gap-4">
                  {bensLeituraMovimentado.map((b) => (
                    <li key={b.id} className="list-row border border-base-300 rounded-sm">

                      <div className="list-col-grow">
                        <div className="text-primary">
                          {b.codigo_patrimonial}
                        </div>

                        <div className="text-xs uppercase font-semibold opacity-60">
                          {b.descricao_bem}
                        </div>
                      </div>

                      <div className="badge badge-primary self-center">
                        <ArrowRightLeft size={14} />
                      </div>


                    </li>
                  ))}
                </ul>
              </div>
            </details>

          </div>
        </div>
      </div>
    </div>
  );
}
