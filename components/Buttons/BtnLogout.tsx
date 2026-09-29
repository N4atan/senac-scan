'use client'
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";


export const BtnLogout = () => (
    <button onClick={() => signOut({ redirect: true, callbackUrl: '/auth' })} className="flex items-center gap-2">
        <LogOut size={14} />
        Sair
    </button>
)