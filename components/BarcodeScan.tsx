"use client"

import { Html5Qrcode } from "html5-qrcode";
import { Barcode } from "lucide-react";
import { useEffect, useRef, useState } from "react";



export default function BarcodeScan({setResult}: {setResult: (result: string) => void}) {
    const [isScanning, setIsScanning] = useState<boolean>(false);


    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        // 1. Instancia o leitor apontando para o ID da div ("reader")
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        // 2. Cleanup: Função que roda quando o componente é destruído (usuário sai da tela)
        return () => {
            if (html5QrCode.isScanning) {
                html5QrCode.stop()
                    .then(() => html5QrCode.clear())
                    .catch((err) => console.error("Erro ao parar a câmera no unmount", err));
            }
        };
    }, []);

    const startScanning = async () => {
        setIsScanning(true);
        setResult(''); // Limpa o resultado anterior

        try {
            await scannerRef.current?.start(
                { facingMode: "environment" },
                {
                    fps: 20,
                    qrbox: (viewfinderWidth, viewfinderHeight) => ({
                        width: Math.min(Math.floor(viewfinderWidth * 0.9), 350),
                        height: Math.min(Math.floor(viewfinderHeight * 0.6), 250),
                    }),
                },
                (decodedText) => {
                    // Callback de SUCESSO
                    setResult(decodedText);

                    // Opcional: Faz o celular vibrar ao ler
                    if (navigator.vibrate) navigator.vibrate(200);

                    // Desliga a câmera automaticamente após ler com sucesso
                    stopScanning();
                },
                (errorMessage) => {
                    // Callback de ERRO (ocorre a cada frame que não acha um código)
                    // É normal deixar vazio para não flodar o console
                }
            );
        } catch (err) {
            console.error("Erro ao iniciar a câmera: ", err);
            setIsScanning(false);
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                setIsScanning(false);
            } catch (err) {
                console.error("Erro ao parar a câmera: ", err);
            }
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
            {/* Container obrigatório onde o vídeo será injetado */}
            <div 
                id="reader" 
                className="w-full max-w-md rounded-2xl overflow-hidden shadow-md border border-base-300 bg-black/5"
            ></div>

            {/* Controles da câmera e placeholder */}
            {!isScanning ? (
                <>
                    <div className="w-full max-w-md h-64 bg-base-200 rounded-2xl border border-base-300 flex justify-center items-center shadow-inner">
                        <Barcode size={180} className="text-base-content/40" />
                    </div>

                    <button
                        onClick={startScanning}
                        className="btn btn-success w-full text-base font-semibold"
                    >
                        Ligar Câmera
                    </button>
                </>
            ) : (
                <button
                    onClick={stopScanning}
                    className="btn btn-error w-full text-base font-semibold"
                >
                    Cancelar
                </button>
            )}
        </div>
    )

}