import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react'

interface AppProps {
  widgetId?: string | null
  publicKey?: string | null
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function App({ widgetId, publicKey }: AppProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! How can I help you today?' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !widgetId || !publicKey) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const API_URL = 'http://localhost:3001/api/chat'; 
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Widget-Key': publicKey,
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[2147483647] font-sans antialiased text-slate-800 isolate">
      {isOpen && (
        <div className="mb-4 w-[380px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 origin-bottom-right ring-1 ring-black/5">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center p-1 shadow-lg ring-2 ring-white/10">
                   <Bot size={20} className="text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Assistant</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Sparkles size={10} className="text-blue-400" /> Powered by AI
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-black/5 ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'
                  }`}
                >
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-white text-indigo-600 border border-black/5 flex items-center justify-center shrink-0 shadow-sm">
                   <Bot size={16} />
                 </div>
                 <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                   <Loader2 size={16} className="animate-spin text-indigo-500" />
                   <span className="text-xs text-slate-400 font-medium">Thinking...</span>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 bg-white shrink-0">
            <form onSubmit={handleSubmit} className="relative">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Write a message..." 
                className="w-full pl-4 pr-12 py-3.5 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 border rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-400"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
              >
                <Send size={16} className={inputValue.trim() ? '-ml-0.5' : ''} />
              </button>
            </form>
            <div className="text-center mt-3 flex items-center justify-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
                 <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                 <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Chatterly AI
                 </p>
                 <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative w-14 h-14 bg-slate-900 hover:bg-indigo-600 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 hover:scale-110 flex items-center justify-center ${isOpen ? 'rotate-90 scale-90 bg-slate-800' : ''}`}
      >
        <span className="absolute inset-0 rounded-full border border-white/10"></span>
        {!isOpen ? (
          <MessageCircle size={28} className="drop-shadow-sm group-hover:scale-110 transition-transform" />
        ) : (
          <X size={28} className="drop-shadow-sm" />
        )}
      </button>
    </div>
  )
}

export default App
