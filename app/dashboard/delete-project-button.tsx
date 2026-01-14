'use client'

import { Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { deleteProject } from './projects/actions'

export function DeleteProjectButton({ projectId, projectName }: { projectId: string, projectName: string }) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!confirm(`Tem certeza que deseja APAGAR o projeto "${projectName}"? \nIsso deletará TODAS as imagens, ingestões e dados permanentemente.`)) {
            return
        }

        setIsDeleting(true)
        try {
            await deleteProject(projectId)
        } catch (error: any) {
            alert('Erro ao apagar projeto: ' + error.message)
            setIsDeleting(false)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
            title="Apagar Projeto"
        >
            {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Trash2 className="w-4 h-4" />
            )}
        </button>
    )
}
