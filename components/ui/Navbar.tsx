

import { Box, CardSim, List, QrCode, ScanBarcode, ScanQrCode, Search, Users } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { signOut } from "next-auth/react";
import { BtnLogout } from "../Buttons/BtnLogout";


export async function Navbar() {
    const session = await getServerSession(authOptions);
    

    return (
        <div className="hidden lg:flex lg:sticky lg:top-0 lg:z-50 navbar bg-base-100 shadow-sm">
            <div className="navbar-start">
                <Link href="/busca" className="btn btn-primary text-xl">
                    <Box size={24} />
                    SenacScan
                </Link>
            </div>
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li><Link href="/busca">
                        <Search size={14} />
                        Busca
                    </Link></li>
                    <li><Link href="/pendencias">
                        <List size={14} />
                        Pendências
                    </Link></li>
                    <li><Link href="/leitor">
                        <ScanBarcode size={14} />
                        Leitor
                    </Link></li>
                    <li><Link href="/usuarios">
                        <Users size={14} />
                        Usuários
                    </Link></li>
                    <li><Link href="/sincronizar">
                        <CardSim size={14} />
                        Sincronizar
                    </Link></li>
                </ul>
            </div>

            <div className="navbar-end">
                <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                        <div className="w-10 rounded-full bg-base-300 flex items-center justify-center">
                            <span className="">{session?.user?.name?.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                    <ul
                        tabIndex={-1}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                        <li className="text-center font-medium">
                            <span className="text-sm opacity-70">{session?.user?.email}</span>
                        </li>
                        <li><div className="divider p-0 m-0"></div></li>
                        <li><BtnLogout /></li>
                    </ul>
                </div>
            </div>
        </div>
    )
}