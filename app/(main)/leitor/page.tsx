"use client"

import { BemComLocal } from "@/actions/bensActions";
import BarcodeScan from "@/components/BarcodeScan";
import CardBemLeitor from "@/components/Cards/CardBemLeitor";
import { useDataProvider } from "@/Providers/DataProvider";
import { ArrowDownRightSquare, Barcode, SearchX } from "lucide-react";
import { useMemo, useState } from "react";



export default function Home() {
  const [scanResult, setScanResult] = useState<string>('');

  const { bens, salas } = useDataProvider();

  const bemEncontrado = useMemo(() => {
    if (!scanResult) return null;

    return bens.find((b) => b.codigo_patrimonial === scanResult);

  }, [scanResult, bens, salas])

  

  return (
    <div className="p-4">

      <div className="card card-border w-full max-w-4xl mx-auto my-5">
        <div className="card-body flex-col justify-center items-center">


          <h2 className="card-title">Leitor Patrimonial</h2>
          <p className="text-soft text-center">Aponte a câmera para a etiqueta do bem patrimonial.</p>

          <BarcodeScan setResult={setScanResult} />

          <div className="join w-full max-w-md my-10">
            <label className="input join-item flex-1">
              <Barcode size={14} />
              <input type="search" className="grow truncate" placeholder="Ou digite o número do patrimônio" value={scanResult || ""} onChange={(e) => setScanResult(e.target.value)} />
            </label>
            <button className="btn join-item btn-error " onClick={() => setScanResult("")}>
              <SearchX size={20} className="text-white" />
            </button>
          </div>

          {bemEncontrado ? (
            <CardBemLeitor bem={bemEncontrado} salas={salas} />
          ) : (
            scanResult.trim() !== "" && (
              <div className="alert alert-warning max-w-md text-sm">
                <span>Nenhum bem patrimonial encontrado com o código <strong>"{scanResult}"</strong>.</span>
              </div>
            )
          )}

        </div>
      </div>

    </div>
  )
}