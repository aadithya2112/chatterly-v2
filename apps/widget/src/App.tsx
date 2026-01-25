import { useState } from 'react'

interface AppProps {
  widgetId?: string | null
  publicKey?: string | null
}

function App({ widgetId, publicKey }: AppProps) {
  const [isOpen, setIsOpen] = useState(false)
  console.log('Chatterly Widget Initialized', { widgetId, publicKey })

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-sans antialiased">
      {isOpen && (
        <div className="mb-4 w-[350px] h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10">
          <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
            <h3 className="font-semibold">Chat Support</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              &times;
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
             <p className="text-sm text-gray-500 text-center">
               Welcome! <br/>
               Widget ID: {widgetId || 'N/A'}
             </p>
          </div>
          <div className="p-4 border-t border-gray-100 bg-white">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105 flex items-center justify-center w-14 h-14"
      >
        {!isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        )}
      </button>
    </div>
  )
}

export default App
