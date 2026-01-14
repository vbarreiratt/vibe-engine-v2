'use client'

import { useState, useCallback } from 'react'
import { UploadCloud, Loader2, Image as ImageIcon, Eye, EyeOff } from 'lucide-react'
import { getPresignedUrls, batchSaveImages, createIngestion } from './actions'
import { useRouter } from 'next/navigation'

export function Uploader({ projectId }: { projectId: string }) {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Ingestion Meta
    const [ingestionName, setIngestionName] = useState('')
    const [isPublic, setIsPublic] = useState(false)

    const router = useRouter()

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        setIsUploading(true)

        try {
            // 0. Create Ingestion Record
            const ingestion = await createIngestion(projectId, ingestionName, isPublic)
            console.log('Created Ingestion:', ingestion)

            const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'))

            // 1. Get ALL Presigned URLs in ONE request
            const fileMeta = fileArray.map(f => ({ name: f.name, type: f.type }))
            const signedData = await getPresignedUrls(projectId, fileMeta)

            console.log(`Got ${signedData.length} signed URLs. Starting parallel upload...`)

            const uploadResults: any[] = []

            // 2. Upload to S3 in Parallel
            await Promise.all(signedData.map(async (data, index) => {
                const file = fileArray[index] // Arrays index match strictly

                try {
                    const uploadRes = await fetch(data.signedUrl, {
                        method: 'PUT',
                        body: file,
                        headers: {
                            'Content-Type': file.type,
                            'x-amz-acl': 'public-read'
                        }
                    })

                    if (!uploadRes.ok) throw new Error(`S3 Error: ${uploadRes.statusText}`)

                    // Get Dimensions
                    const dimensions = await getImageDimensions(file)

                    uploadResults.push({
                        publicUrl: data.publicUrl,
                        key: data.key,
                        width: dimensions.width,
                        height: dimensions.height,
                        size: file.size
                    })

                } catch (err) {
                    console.error(`Upload failed for ${file.name}`, err)
                }
            }))

            // 3. Batch Save to DB linked to Ingestion
            if (uploadResults.length > 0) {
                console.log(`Saving ${uploadResults.length} images to Ingestion ${ingestion.id}...`)
                await batchSaveImages(projectId, ingestion.id, uploadResults)
                // Reset form
                setIngestionName('')
                router.refresh()
            }
        } catch (e: any) {
            console.error('Upload Process Error:', e)
            alert(`Erro no upload: ${e.message}`)
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
        <div className="space-y-4">
            {/* Ingestion Controls */}
            <div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                <input
                    type="text"
                    placeholder="Nome da Ingestão (Opcional)"
                    className="bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-600 text-sm flex-1"
                    value={ingestionName}
                    onChange={(e) => setIngestionName(e.target.value)}
                    disabled={isUploading}
                />
                <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${isPublic
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                        }`}
                    title={isPublic ? "Público: Todos do projeto podem ver" : "Privado: Apenas você vê"}
                >
                    {isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {isPublic ? 'Público' : 'Privado'}
                </button>
            </div>

            <div
                className={`
                border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden
                ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50'}
                ${isUploading ? 'pointer-events-none opacity-50' : ''}
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
                    <div className="flex flex-col items-center animate-pulse z-10">
                        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                        <p className="text-zinc-400">Criando Ingestão & Enviando...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <UploadCloud className="w-8 h-8 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">
                            {isDragging ? 'Solte aqui' : 'Upload de Referências'}
                        </h3>
                        <p className="text-zinc-500 max-w-sm mb-4">
                            Arraste imagens para adicionar a esta ingestão.
                        </p>
                        <div className="flex gap-2 text-xs text-zinc-600 font-mono">
                            <span className="bg-zinc-900 px-2 py-1 rounded">JPG</span>
                            <span className="bg-zinc-900 px-2 py-1 rounded">PNG</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
