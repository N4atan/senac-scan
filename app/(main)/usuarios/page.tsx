"use client";
import { CloudDownload, Filter, Plus, Search } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { EnumCategoriaBem } from "@/app/generated/prisma/enums";
import { useDataProvider } from "@/Providers/DataProvider";
import { postUsuario, UserSemSenha } from "@/actions/usuariosAction";
import toast from "react-hot-toast";
import { Table } from "@/components/Tables/Table";
import { UserSelect } from "@/app/generated/prisma/models";


export default function Home() {

  const { users, isLoadingUsers } = useDataProvider();

  const onHandleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    await postUsuario(formData).then((res) => {
      if (res.status == 201) {
        (document.getElementById('my_modal_usuario') as HTMLDialogElement).close();
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    })
  }


  return (
    <div className="p-4">
      <div className="card card-border rounded-box flex flex-col gap-5 mx-auto mt-5 md:mt-10 max-w-[80rem]">
        <div className="card-body">
          <h1 className="card-title text-xl font-semibold text-neutral">Consulta de Usuários</h1>
          <p className="text-soft">Pesquise os usuários cadastrados no sistema.</p>

          <div className="divider"></div>

          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row gap-2 item-center w-full">

            <button className="btn btn-primary" onClick={() => (document.getElementById('my_modal_usuario') as HTMLDialogElement).showModal()}>
              <Plus size={14} />
              Adicionar
            </button>

          </div>


          
            <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 my-4">
              {isLoadingUsers ? (
                <div className="flex justify-center items-center py-10 bg-base-200">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : <Table headers={['ID', 'Email', 'Nome']} data={[
                ...users.map((user: any) => [
                  user.id,
                  user.email,
                  user.name,
                ])
              ]} />
              }


            </div>
          
        </div>
      </div>

      <dialog id="my_modal_usuario" className="modal modal-bottom md:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Registrando Usuário</h3>
          <p className="text-soft">Para fechar o formulário, pressione <kbd className="kbd kbd-sm">ESC</kbd> ou clique em 'Cancelar'.</p>
          <div className="divider"></div>



          <form id="form_registrar_usuario" className="grid grid-cols-2 gap-4 mt-5" onSubmit={onHandleSubmit}>
            <fieldset className="fieldset col-span-2">
              <legend className="fieldset-legend">Nome Completo <span className="text-error">*</span></legend>
              <input type="text" name="nome" className="input w-full" placeholder="Nome Completo" />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">E-mail <span className="text-error">*</span></legend>
              <input type="text" id="email" name="email" className="input w-full" placeholder="Ex: email@senacrs.com.br" />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Senha <span className="text-error">*</span></legend>
              <input type="text" id="senha" name="senha" className="input w-full" placeholder="Utilizar senha padrão" />
            </fieldset>


          </form>

          <div className="modal-action">
            <form method="dialog" className="">
              <button className="btn md:hidden btn-ghost">Cancelar</button>
            </form>
            <button className="btn btn-soft" type="reset" form="form_registrar_usuario">Limpar Campos</button>
            <button className="btn btn-primary" type="submit" form="form_registrar_usuario">Registrar</button>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
