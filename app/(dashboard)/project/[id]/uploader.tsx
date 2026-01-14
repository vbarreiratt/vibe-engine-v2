'use client'

import { useState, useCallback } from 'react'
import { UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react'
import { getUploadUrl, saveImage } from './actions'
import { useRouter } from 'next/navigation'

export function Uploader({ projectId }: { projectId: string }) {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const router = useRouter()

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        setIsUploading(true)

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]

                // 1. Get Presigned URL
                const { signedUrl, publicUrl, key } = await getUploadUrl(projectId, file.name, file.type)

                // 2. Upload to S3/Spaces
                const uploadRes = await fetch(signedUrl, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type,
                        'x-amz-acl': 'public-read' // Match server command
                    }
                })

                if (!uploadRes.ok) throw new Error('Upload failed')

                // 3. Persist (Mock dimensions for now, or read from file)
                // To get dimensions we need to load image in JS.
                const dimensions = await getImageDimensions(file)

                await saveImage(projectId, publicUrl, key, dimensions.width, dimensions.height, file.size)
            }
            router.refresh()
        } catch (e) {
            console.error(e)
            alert('Erro no upload. Tente novamente.')
        } finally {
            setIsUploading(false)
        }
    }

    const getImageDimensions = (file: File): Promise<{ width: number, height: number }> => {
        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => resolve({ width: img.width, height: img.height })
            img.onerror = () => resolve({ width: 0, height: 0 })
            img.src = URL.createObjectURL(file)
        })
    }

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        handleUpload(e.dataTransfer.files)
    }, [])

    return (
        <div
            className={`
            border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer
            ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50'}
        `}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
        >
            <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
            />

            {isUploading ? (
                <div className="flex flex-col items-center animate-pulse">
                    <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                    <p className="text-zinc-400">Enviando imagens...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <UploadCloud className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">Upload de Referências</h3>
                    <p className="text-zinc-500 max-w-sm mb-4">
                        Arraste imagens ou clique para selecionar.
                    </p>
                    <span className="text-xs text-zinc-600 font-mono bg-zinc-900 px-2 py-1 rounded">
                        JPG, PNG, GIF
                    </span>
                </div>
            )}
        </div>
    )
}
