"use client"


import { List, ScanBarcode, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";



export function Dock() {

    const pathname = usePathname();
    

    return (
        <div className="lg:hidden dock">
            <Link className={pathname === "/busca" || pathname === "/" ? "dock-active" : ""} href="/busca">
                <Search size={14} />
                <span className="dock-label">Busca</span>
            </Link>

            <Link className={pathname === "/leitor" ? "dock-active" : ""} href="/leitor">
                <ScanBarcode size={14} />
                <span className="dock-label">Leitor</span>
            </Link>

            <Link className={pathname === "/pendencias" ? "dock-active" : ""} href="/pendencias">
                <List size={14} />
                <span className="dock-label">Pendências</span>
            </Link>
        </div>
    )
}