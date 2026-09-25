import { Box, List, QrCode, ScanBarcode, ScanQrCode, Search } from "lucide-react";


export function Navbar() {
    return (
        <div className="navbar bg-base-100 shadow-sm">
            <div className="navbar-start">
                <a className="btn btn-primary text-xl">
                    <Box size={24}/>
                    SenacScan
                </a>
            </div>
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li><a href="/">
                        <Search size={14}/>
                        Busca
                    </a></li>
                    <li><a href="/pendencias">
                        <List size={14}/>
                        Pendências
                    </a></li>
                    <li><a href="/leitor">
                        <ScanBarcode size={14}/>
                        Leitor
                    </a></li>
                </ul>
            </div>
            <div className="navbar-end">
                <a className="btn">Button</a>
            </div>
        </div>
    )
}