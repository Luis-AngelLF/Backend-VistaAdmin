import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Users } from 'lucide-react'

interface Voter {
    id: string
    cedula: string
    names: string
    surnames: string
    has_voted: boolean
    is_active: boolean
    created_at: string
}

export function VoterList({ voters }: { voters: Voter[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Padrón Electoral Registrado
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cédula</TableHead>
                            <TableHead>Nombre Completo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Voto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {voters.map((voter) => (
                            <TableRow key={voter.id}>
                                <TableCell className="font-medium">{voter.cedula}</TableCell>
                                <TableCell>{voter.names} {voter.surnames}</TableCell>
                                <TableCell>
                                    <Badge variant={voter.is_active ? "outline" : "destructive"} className={voter.is_active ? "text-emerald-600 border-emerald-200 bg-emerald-50" : ""}>
                                        {voter.is_active ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={voter.has_voted ? "secondary" : "outline"}>
                                        {voter.has_voted ? "Emitido" : "Pendiente"}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        {voters.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    No hay votantes registrados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
