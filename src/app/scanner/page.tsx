import QRScanner from '@/components/scanner/QRScanner'
import { Ticket } from 'lucide-react'

export default function ScannerPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="px-4 py-4 flex items-center gap-2 border-b border-gray-800">
        <Ticket className="w-5 h-5 text-blue-400" />
        <span className="font-bold">EIbTicket · Scanner</span>
      </header>
      <div className="max-w-md mx-auto pt-4">
        <QRScanner />
      </div>
    </main>
  )
}
