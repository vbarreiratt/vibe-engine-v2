'use client'

import { DeleteWithConfirmation } from '@/components/delete-with-confirmation'
import { deleteSignalRun } from '@/app/dashboard/project/[id]/scan/actions'
import { useRouter } from 'next/navigation'

export function DeleteRunButton({ runId }: { runId: string }) {
    const router = useRouter()

    const handleDelete = async () => {
        try {
            const res = await deleteSignalRun(runId)
            if (res?.error) {
                return res
            } else {
                router.refresh()
                return { success: true }
            }
        } catch (err) {
            console.error(err)
            return { error: 'Erro ao excluir' }
        }
    }

    return (
        <DeleteWithConfirmation
            title="Excluir Leitura"
            description="Tem certeza que deseja excluir esta leitura de sinais?"
            onDelete={handleDelete}
            triggerClassName="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
        />
    )
}
