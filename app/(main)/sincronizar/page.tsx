"use client";
import { CheckCircle, CloudDownload, CloudUpload, Filter, LayoutDashboard, List, Plus, Search, TableCellsMerge, TableIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { EnumCategoriaBem } from "@/app/generated/prisma/enums";
import { useDataProvider } from "@/Providers/DataProvider";
import { Table } from "@/components/Tables/Table";
import { mainImport } from "@/actions/importBensAction";
import toast from "react-hot-toast";
import CardBemSincronizar from "@/components/Cards/CardBemSincronizar";

export default function Home() {
  const { bensParaAtualizar, isLoadingBensParaAtualizar, handleTXTFileUpload, salas, isLoadingSalas, updateManyLocalBem } = useDataProvider();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showLocation, setShowLocation] = useState(false);




  const bensFiltrados = useMemo(() => {

    let lista = bensParaAtualizar;

    if (selectedLocation && showLocation) {
      lista = lista.filter((log) => selectedLocation?.includes(log.new_local?.descricao));
    }

    const termo = searchTerm.trim().toLowerCase();
    if (termo) {
      lista = lista.filter((log) => {
        const matchPatrimonio = log.bem.codigo_patrimonial?.toLowerCase().includes(termo);
        const matchDescricao = log.bem.descricao_bem?.toLowerCase().includes(termo);
        const matchInterna = log.bem.identificacao_interna?.toLowerCase().includes(termo);
        return matchPatrimonio || matchDescricao || matchInterna;
      });
    }
    return lista;
  }, [bensParaAtualizar, searchTerm, selectedLocation]);


  

  return (
    <div className="p-4">
      <div className="card card-border rounded-box flex flex-col gap-5 mx-auto mt-5 md:mt-10 max-w-[80rem]">
        <div className="card-body">
          <h1 className="card-title text-xl font-semibold text-neutral">Sincronização com o Coletor</h1>
          <p className="text-soft">Importe o arquivo <span className="badge badge-ghost">Invent.txt</span> retirado do coletor para apontar bens com divergência de local.</p>

          <div className="divider"></div>

          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row gap-2 item-center w-full">



            <label className="input flex-grow">
              <Search size={14} />
              <input
                type="search"
                className="grow"
                defaultValue={searchTerm || ""}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquise por patrimônio, descrição ou identificação interna..." />
            </label>

            <input
              type="text"
              className={`input ${showLocation ? "" : "hidden"}`}
              placeholder={isLoadingSalas ? "Carregando Salas..." : "Localização"}
              disabled={isLoadingSalas}
              list="localizacoes"
              value={selectedLocation || ""}
              onChange={(e) => setSelectedLocation(e.target.value === "" ? null : e.target.value)}
            />
            <datalist id="localizacoes">
              {salas.map((sala) => (
                <option key={sala.id}>{sala.descricao}</option>
              ))}
            </datalist>





            <div className="flex flex-row gap-2 justify-between md:justify-start md:ml-auto ">
              <details className="dropdown sm:dropdown-start md:dropdown-center">
                <summary className="btn btn-accent btn-soft ">
                  <Filter size={14} />
                  Filtros
                </summary>

                <ul className="menu dropdown-content bg-base-100 rounded-box z-1 p-2 mt-1 shadow-md border border-base-300">
                  
                  <li>
                    <label className="label cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={showLocation}
                        onChange={(e) => setShowLocation(e.target.checked)}
                      />
                      Localização
                    </label>
                  </li>

                </ul>
              </details>

              <button className="btn btn-ghost ">
                <CloudDownload size={14} />
                Exportar
              </button>

              <details className="dropdown dropdown-end dropdown-hover">
                <summary className="btn btn-ghost btn-soft ">
                  <CloudUpload size={14} />
                  Importar
                </summary>

                <div className="menu dropdown-content bg-base-100 rounded-box z-1 p-2 shadow-md border border-base-300 w-[300px] mt-2">
                  <input type="file" className="file-input file-input-accent" accept=".txt" onChange={handleTXTFileUpload} />
                </div>
              </details>


            </div>

              <button className="btn btn-success" onClick={() => updateManyLocalBem(bensParaAtualizar)} >
                <CheckCircle size={18} />
                Corrigir Divergências
              </button>

          </div>

          {!isLoadingBensParaAtualizar && (
            <span>Exibindo <span className="text-primary font-bold">{bensFiltrados.length}</span> bens</span>
          )}

          <div className="">
            {bensParaAtualizar.length == 0 ? (isLoadingBensParaAtualizar ? (
              <div className="flex justify-center items-center py-10 bg-base-200">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) :
              <div className="flex justify-center items-center py-10 bg-base-200">
                <span className="text-soft">Nenhum bem encontrado.</span>
              </div>)
              : 
              isLoadingBensParaAtualizar ? (
              <div className="flex justify-center items-center py-10 bg-base-200">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) :
              < div className="tabs tabs-lift" >
                <label className="tab gap-2">
                  <input type="radio" name="my_tabs_4" />
                  <TableCellsMerge size={14} />
                  Tabela
                </label>
                <div className="tab-content bg-base-100 border-base-300 p-6 overflow-x-auto">
                  <div className="border border-base-200 rounded-lg">
                    <Table headers={['', '', 'Descrição', 'Local Antigo', 'Novo Local']} data={[
                      ...bensFiltrados.map((bem) => [
                        bem.bem.codigo_patrimonial,
                        bem.bem.identificacao_interna,
                        bem.bem.descricao_bem,
                        bem.bem.Local?.descricao,
                        bem.new_local.descricao
                      ])]} />
                  </div>
                </div>

                <label className="tab gap-2">
                  <input type="radio" name="my_tabs_4" defaultChecked />
                  <LayoutDashboard size={14} />
                  Cards
                </label>
                <div className="tab-content bg-base-100 border-base-300 p-6 flex flex-row flex-wrap gap-3 justify-center">
                  {bensFiltrados.map((log) => (
                    <CardBemSincronizar key={log.bem.id} log={log} />
                  ))}
                </div>
              </div>

            }


          </div>
        </div>
      </div>


    </div >
  );
}
