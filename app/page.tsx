"use client";
import { CloudDownload, Filter, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EnumCategoriaBem } from "./generated/prisma/browser";
import { useDataProvider } from "@/Providers/DataProvider";

export default function Home() {
  const [showCategory, setShowCategory] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const { bens, salas, refreshBens, refreshSalas, isLoadingBens, isLoadingSalas } = useDataProvider();

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const bensFiltrados = useMemo(() => {

    let lista = bens;

    if (selectedLocation && showLocation) {
      lista = lista.filter(
        (b) =>
          b.Local?.descricao?.toLowerCase() === selectedLocation.toLowerCase() ||
          String(b.id_local) === selectedLocation
      );
    }

    if (selectedCategory && showCategory) {
      lista = lista.filter((b) => b.categoria === selectedCategory);
    }

    const termo = searchTerm.trim().toLowerCase();
    if (termo) {
      lista = lista.filter((b) => {
        const matchPatrimonio = b.codigo_patrimonial?.toLowerCase().includes(termo);
        const matchDescricao = b.descricao_bem?.toLowerCase().includes(termo);
        const matchInterna = b.identificacao_interna?.toLowerCase().includes(termo);
        return matchPatrimonio || matchDescricao || matchInterna;
      });
    }
    return lista;
  }, [bens, selectedLocation, selectedCategory, searchTerm, showLocation, showCategory]);

  return (
    <div className="p-4">
      <div className="card card-border rounded-box flex flex-col gap-5 mx-auto mt-5 md:mt-10 max-w-[80rem]">
        <div className="card-body">
          <h1 className="card-title text-xl font-semibold text-neutral">Consulta de Bens</h1>
          <p className="text-soft">Pesquise todo o inventário registrado no sistema.</p>

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

            <select
              className={`select ${showCategory ? "" : "hidden"}`}
              value={selectedCategory || "Categoria"}
              onChange={(e) => setSelectedCategory(e.target.value === "Limpar" || e.target.value === "Categoria" ? null : e.target.value)}
            >
              <option value="Categoria" disabled={true}>Categoria</option>
              {Object.values(EnumCategoriaBem).map((categoria) => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
              <option value="Limpar" className="text-error">Limpar Filtros</option>
            </select>



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
              <button className="btn btn-ghost ">
                <CloudDownload size={14} />
                Exportar
              </button>


              <details className="dropdown dropdown-end">
                <summary className="btn btn-accent btn-soft ">
                  <Filter size={14} />
                  Filtros
                </summary>

                <ul className="menu dropdown-content bg-base-100 rounded-box z-1 p-2 shadow-md border border-base-300">
                  <li>
                    <label className="label cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={showCategory}
                        onChange={(e) => setShowCategory(e.target.checked)}
                      />
                      Categoria
                    </label>
                  </li>

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
            </div>

            <button className="btn btn-primary" onClick={() => (document.getElementById('my_modal_2') as HTMLDialogElement).showModal()}>
              <Plus size={14} />
              Adicionar
            </button>

          </div>


          <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 my-4">
            {isLoadingBens ? (
              <div className="flex justify-center items-center py-10 bg-base-200">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : bensFiltrados.length === 0 ? (
              <div className="flex justify-center items-center py-10 bg-base-200">
                <span className="text-soft">Nenhum bem encontrado.</span>
              </div>
            ) : (
              <table className="table">
                {/* head */}
                <thead>
                  <tr className="bg-base-200/40">
                    <th></th>
                    <th></th>
                    <th>Descrição</th>
                    <th>Localização</th>
                    <th>Categoria</th>
                    <th>Status</th>

                  </tr>
                </thead>
                <tbody>


                  {bensFiltrados.map((bem) => (
                    <tr key={bem.id} className="hover:bg-base-300">
                      <th>{bem.codigo_patrimonial}</th>
                      <td>{bem.identificacao_interna}</td>
                      <td>{bem.descricao_bem}</td>
                      <td>{bem.Local?.descricao}</td>
                      <td>{bem.categoria}</td>
                      <td>{bem.status}</td>
                    </tr>
                  ))}

                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <dialog id="my_modal_2" className="modal modal-bottom md:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Registrando Bem Patrimonial</h3>
          <p className="text-soft">Para fechar o formulário, pressione <kbd className="kbd kbd-sm">ESC</kbd> ou clique em 'Cancelar'.</p>
          <div className="divider"></div>

          <h4 className="text-xl font-semibold">Informações Básicas</h4>

          <form id="form_registrar" className="grid grid-cols-2 gap-4 mt-5">
            <fieldset className="fieldset col-span-2">
              <legend className="fieldset-legend">Descreva o bem <span className="text-error">*</span></legend>
              <input type="text" className="input w-full" placeholder="Descreva o bem" />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Número de Patrimônio <span className="text-error">*</span></legend>
              <input type="text" className="input w-full" placeholder="Ex: 224242" />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Identificação Interna</legend>
              <input type="text" className="input w-full" placeholder="Este campo é opcional" />
            </fieldset>

            <fieldset className="fieldset col-span-2">
              <legend className="fieldset-legend">Onde o bem se encontra? <span className="text-error">*</span></legend>
              <select className="select w-full">
                <option disabled={true}>Selecione</option>
                <option>Unisinos | Depósito TI</option>
              </select>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Categoria <span className="text-error">*</span></legend>
              <select className="select w-full">
                <option disabled={true}>Selecione</option>
                <option>Computadores</option>
                <option>Periféricos</option>
                <option>Acessórios</option>
              </select>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Status <span className="text-error">*</span></legend>
              <select className="select w-full">
                <option disabled={true}>Selecione</option>
                <option>Funcional</option>
                <option>Aguardando Manutenção</option>
                <option>Manutenção</option>
              </select>
            </fieldset>
          </form>

          <div className="modal-action">
            <form method="dialog" className="">
              <button className="btn md:hidden btn-ghost">Cancelar</button>
            </form>
            <button className="btn btn-soft" type="reset" form="form_registrar">Limpar Campos</button>
            <button className="btn btn-primary" type="submit" form="form_registrar">Registrar</button>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
