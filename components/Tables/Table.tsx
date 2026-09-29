

type Props = {
    headers: string[];
    data: any[][];
}

export function Table({ headers, data }: Props) {
    return (
        <>
            
            {
                data?.length === 0 ? (
                    <div className="flex justify-center items-center py-10 bg-base-200">
                        <span className="text-soft">Nenhum dado para mostrar.</span>
                    </div>
                ) : (
                    <table className="table">
                        {/* head */}
                        <thead>
                            <tr className="bg-base-200/40">
                                {headers.map((header, index) => (
                                    <th key={index}>{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row) => (
                                <tr key={row[0]} className="hover:bg-base-300">
                                    {row.map((cell, index) => (
                                        <td key={index}>{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )
            }
        </>
    )
}