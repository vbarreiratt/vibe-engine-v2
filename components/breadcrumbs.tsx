import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
    label: string
    href?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    return (
        <nav className="flex items-center text-sm font-medium text-zinc-500">
            {items.map((item, index) => (
                <div key={index} className="flex items-center">
                    {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-zinc-700" />}
                    {item.href ? (
                        <Link href={item.href} className="hover:text-white transition-colors">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-zinc-200">{item.label}</span>
                    )}
                </div>
            ))}
        </nav>
    )
}
