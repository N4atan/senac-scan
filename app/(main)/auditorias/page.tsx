"use client";
import { CloudDownload, Filter, Plus, Search } from "lucide-react";


import { useDataProvider } from "@/Providers/DataProvider";

import { CardAuditoria } from "@/components/Cards/cardAuditoria";
import { useState } from "react";


export default function Home() {

  const { createAuditoria, auditorias, isLoadingAuditorias } = useDataProvider();


  

  const onSubmitModal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const success = await createAuditoria(formData);
    if (success) {
      (document.getElementById("modal_new_auditoria") as HTMLDialogElement)?.close();
    }
  };


  return (
    <div className="p-4">
      <div className="card card-border rounded-box flex flex-col gap-5 mx-auto mt-5 md:mt-10 max-w-[80rem]">
        <div className="card-body">
          <h1 className="card-title text-xl font-semibold text-neutral">Gestão de Auditorias</h1>

          <div className="flex flex-row flex-wrap justify-between items-center">
            <p className="text-soft">Visualize e gerencie auditorias passadas, em andamento e prepare novas auditorias.</p>

            <button className="btn btn-primary btn-sm" onClick={() => (document.getElementById('modal_new_auditoria') as HTMLDialogElement).showModal()}>
              <Plus size={14} />
              Adicionar Auditoria
            </button>
          </div>
      
        </div>
      </div>

      <div className="overflow-y-auto bg-base-100 my-4 flex flex-wrap gap-4 justify-center">
            {isLoadingAuditorias ? (
              <div className="flex justify-center items-center py-10 bg-base-200">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              auditorias.length === 0 ? (
                <div className="flex justify-center items-center py-10 bg-base-200">
                  <span className="text-soft">Nenhuma auditoria encontrada</span>
                </div>
              ) : (
                auditorias.map((auditoria) => (
                  <CardAuditoria key={auditoria.id} auditoria={auditoria} />
                ))
              )
            )}
          </div>

      <dialog id="modal_new_auditoria" className="modal modal-bottom md:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Abertura de Nova Auditoria</h3>
          <p className="text-soft">Para fechar o formulário, pressione <kbd className="kbd kbd-sm">ESC</kbd> ou clique em 'Cancelar'.</p>
          <div className="divider"></div>



          <form id="form_registrar_auditoria" onSubmit={onSubmitModal} className="grid grid-cols-2 gap-4 ">
            <fieldset className="fieldset col-span-2">
              <legend className="fieldset-legend">Nome da Auditoria <span className="text-error">*</span></legend>
              <input type="text" name="titulo" className="input w-full" placeholder="Ex: Auditoria 2026/2" required />
            </fieldset>

          </form>

          <div className="modal-action">
            <form method="dialog" className="">
              <button className="btn md:hidden btn-ghost">Cancelar</button>
            </form>
            <button className="btn btn-soft" type="reset" form="form_registrar_auditoria">Limpar Campos</button>
            <button className="btn btn-primary" type="submit" form="form_registrar_auditoria">Registrar</button>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
