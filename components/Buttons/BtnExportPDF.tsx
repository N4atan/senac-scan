import { CloudDownload } from "lucide-react";
import { BemComLocal } from "@/actions/bensActions";
import { Document, Page, Text, View, PDFViewer, pdf, render, Image } from "@react-pdf/renderer";
import { Table, TableHeader, TableCell, TableRow } from "@ag-media/react-pdf-table";
import { useState } from "react";

const MyDocument = ({ data }: { data: BemComLocal[] | [] }) => {

    const totalPage = ({ pageNumber, totalPages }: { pageNumber: number, totalPages: number }) => {
        return `Página ${pageNumber} de ${totalPages}`
    }

    return (
        <Document>
            <Page size='A4' style={{
                paddingTop: 35,
                paddingBottom: 50,
                paddingHorizontal: 35,
                fontFamily: 'Helvetica',
                backgroundColor: '#ffffff',
                color: '#262626'
            }}>

                {/* CABEÇALHO FIXO */}
                <View fixed style={{
                    position: 'absolute',
                    top: 35,
                    left: 35,
                    right: 35,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <View>
                        <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Relatório de Bens Patrimoniais</Text>
                        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Gerado pelo Sistema Patrimonial Interno</Text>
                        <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
                            Gerado em 26/10/2026, às 18:24 | Total de Registro(s): {data.length}
                        </Text>
                        <Text
                            style={{ fontSize: 7, color: '#64748b', fontFamily: 'Helvetica-Bold', marginTop: 2 }}
                            render={totalPage}
                        />
                    </View>

                    {/* IMAGEM EXPANDIDA */}
                    <Image
                        src='/logo_80anos.png'
                        style={{
                            width: 160,       // Aumentado
                            height: 70,       // Aumentado
                            objectFit: 'contain'
                        }}
                    />
                </View>

                {/* SPACER AUMENTADO: Subiu para 95px para dar folga à imagem maior em todas as páginas */}
                <View fixed style={{ height: 95, width: '100%' }} />

                {/* TABELA: Agora inicia com o recuo correto em todas as páginas */}
                <Table wrap style={{ fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4 }}>
                    <TableHeader fixed style={{ backgroundColor: '#f1f5f9', borderBottomColor: '#9ca3af' }}>
                        <TableCell weighting={0.15} style={{ fontSize: 12, padding: 8, alignItems: 'center', justifyContent: 'center' }}>
                            <Text>Patrimônio</Text>
                        </TableCell>

                        <TableCell weighting={0.60} style={{ fontSize: 12, padding: 8 }}>
                            <Text>Descrição do Bem</Text>
                        </TableCell>

                        <TableCell weighting={0.25} style={{ fontSize: 12, padding: 8 }}>
                            <Text>Localização</Text>
                        </TableCell>
                    </TableHeader>

                    {data.map((item: BemComLocal, index: number) => (
                        <TableRow key={index} wrap={false}>
                            <TableCell weighting={0.15} style={{ fontSize: 10, padding: 8, alignItems: 'center', justifyContent: 'center' }}>
                                <Text>{item?.codigo_patrimonial}</Text>
                            </TableCell>

                            <TableCell weighting={0.60} style={{ fontSize: 10, padding: 8 }}>
                                <Text>{item?.descricao_bem}</Text>
                            </TableCell>

                            <TableCell weighting={0.25} style={{ fontSize: 10, padding: 8 }}>
                                <Text>{item?.Local?.descricao}</Text>
                            </TableCell>
                        </TableRow>
                    ))}
                </Table>


            </Page>
        </Document>
    )
};

export default function BtnExportPDF({ data }: { data: BemComLocal[] }) {
    const [isLoading, setIsLoading] = useState<boolean>(false);


    const handleOpenPdf = async () => {
        try {
            setIsLoading(true);
            const blob = await pdf(MyDocument({ data })).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <button className="btn btn-ghost" onClick={handleOpenPdf} disabled={isLoading} >
            {isLoading ? (
                <span className="loading loading-spinner"></span>
            ) : (
                <CloudDownload size={14} />
            )}
            Exportar
        </button>
    )
}