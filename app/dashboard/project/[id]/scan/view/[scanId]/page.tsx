import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getScanWithImages } from '../../actions'
import { ArrowLeft, Globe, Lock, User, Calendar, Images } from 'lucide-react'
import Link from 'next/link'

export default async function ViewScanPage({ params }: { params: Promise<{ id: string, scanId: string }> }) {
    const { id: projectId, scanId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const result = await getScanWithImages(scanId)

    if (result.error) {
        redirect(`/dashboard/project/${projectId}`)
    }

    const { scan, images } = result

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/dashboard/project/${projectId}`} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-light text-white">{scan?.name}</h1>
                        {scan?.visibility === 'public' ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <Globe className="w-3 h-3" />
                                Pública
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                                <Lock className="w-3 h-3" />
                                Privada
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 mt-1">
                        <span className="flex items-center gap-1.5">
                            <Images className="w-4 h-4" />
                            {images?.length || 0} imagens
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {new Date(scan?.created_at).toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                </div>
                <Link
                    href={`/dashboard/project/${projectId}/signals?scan=${scanId}`}
                    className="px-6 py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-400 transition-colors"
                >
                    Usar para Sinais
                </Link>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {images?.map((img: any) => (
                    <div
                        key={img.id}
                        className="aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-white/5"
                    >
                        <img
                            src={img.thumb_url || img.original_url}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {(!images || images.length === 0) && (
                <div className="text-center py-12 text-zinc-500">
                    <p>Nenhuma imagem nesta varredura.</p>
                </div>
            )}
        </div>
    )
}
