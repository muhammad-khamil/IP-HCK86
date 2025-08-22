import { useState, useRef, useEffect } from 'react'
import http from '../libraries/http'

export default function ChatBot({ onClose }) {
    const [isOpen, setIsOpen] = useState(true) // Auto open karena dipanggil dari Dashboard
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'ai',
            content: "Halo! Saya AI Assistant untuk SPPD 😊\n\nSaya bisa bantu:\n• Estimasi biaya perjalanan\n• Rekomendasi transportasi & hotel\n• Tips hemat perjalanan dinas\n\nAda yang bisa saya bantu?",
            timestamp: new Date()
        }
    ])
    const [inputMessage, setInputMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [chatCount, setChatCount] = useState(0)
    const messagesEndRef = useRef(null)

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Kirim pesan
    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return

        if (inputMessage.trim().length > 1000) {
            alert('Pesan terlalu panjang! Maksimal 1000 karakter.')
            return
        }

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputMessage.trim(),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInputMessage('')
        setIsLoading(true)

        try {
            const token = localStorage.getItem("access_token")
            http.defaults.headers.common['Authorization'] = `Bearer ${token}`

            const { data } = await http.post('/ai/chat', {
                message: inputMessage.trim()
            })

            if (data.chatCount) setChatCount(data.chatCount)

            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: data.message,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, aiMessage])

        } catch (error) {
            console.error('Chat error:', error)

            const errorMsg = {
                id: Date.now() + 1,
                type: 'ai',
                content: "Maaf, ada masalah teknis. Coba lagi ya! 😅",
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setIsLoading(false)
        }
    }

    // Clear history
    const clearHistory = async () => {
        try {
            const token = localStorage.getItem("access_token")
            http.defaults.headers.common['Authorization'] = `Bearer ${token}`

            await http.delete('/ai/chat/history')

            setMessages([
                {
                    id: Date.now(),
                    type: 'ai',
                    content: "Chat history sudah dihapus! 🧹\n\nAda yang bisa saya bantu lagi?",
                    timestamp: new Date()
                }
            ])
            setChatCount(0)

        } catch (error) {
            console.error('Clear error:', error)
            alert('Gagal hapus history!')
        }
    }

    // Handle Enter
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    // Handler Close - Updated
    const handleClose = () => {
        setIsOpen(false)
        if (onClose) {
            onClose() // Callback ke parent (Dashboard)
        }
    }

    // Format pesan
    const formatMessage = (content) => {
        return content.split('\n').map((line, index) => (
            <span key={index}>
                {line}
                {index < content.split('\n').length - 1 && <br />}
            </span>
        ))
    }

    // Quick questions
    const quickQuestions = [
        "Biaya tiket pesawat dari Padang Menuju Jakarta?",
        "Hotel murah di Jakarta?",
        "Tips hemat perjalanan dinas?"
    ]

    return (
        <>
            {/* REMOVED: Floating button - Karena sekarang dipanggil dari Dashboard */}

            {/* Window Chat - Only show when isOpen */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-xl border z-50 flex flex-col">
                    {/* Header dengan Close Button */}
                    <div className="bg-purple-500 text-white p-4 rounded-t-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold flex items-center">
                                    🤖 AI Assistant SPPD
                                    <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">ACTIVE</span>
                                </h3>
                                <p className="text-sm opacity-90">Powered by Gemini 2.5 Flash</p>
                                {chatCount > 0 && (
                                    <p className="text-xs opacity-75">💬 {chatCount} conversations</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={clearHistory}
                                    className="hover:bg-white/20 p-2 rounded-full text-sm transition-all hover:scale-110"
                                    title="Clear Chat History"
                                >
                                    🗑️
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="hover:bg-white/20 p-2 rounded-full transition-all hover:scale-110"
                                    title="Close ChatBot"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-purple-50 to-white">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg p-3 ${message.type === 'user'
                                        ? 'bg-purple-500 text-white rounded-br-none shadow-md'
                                        : 'bg-white text-gray-800 border border-purple-100 rounded-bl-none shadow-sm'
                                        }`}
                                >
                                    <div className="text-sm">
                                        {formatMessage(message.content)}
                                    </div>
                                    <div className={`text-xs mt-2 opacity-70 ${message.type === 'user' ? 'text-purple-100' : 'text-gray-500'
                                        }`}>
                                        {message.timestamp.toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading Animation */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-purple-100 rounded-lg p-3 max-w-[80%] shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex space-x-1">
                                            <div className="animate-bounce w-2 h-2 bg-purple-500 rounded-full"></div>
                                            <div className="animate-bounce w-2 h-2 bg-purple-500 rounded-full" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="animate-bounce w-2 h-2 bg-purple-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-sm text-gray-600">🤖 AI sedang berpikir...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions - Enhanced */}
                    {messages.length <= 1 && (
                        <div className="p-4 bg-purple-50 border-t border-purple-100">
                            <p className="text-xs text-purple-700 mb-2 font-medium">💡 Quick Start:</p>
                            <div className="space-y-2">
                                {quickQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setInputMessage(question)}
                                        className="text-xs bg-white hover:bg-purple-50 border border-purple-200 hover:border-purple-300 rounded-lg px-3 py-2 w-full text-left transition-all hover:shadow-sm"
                                    >
                                        <span className="text-purple-600">Q{index + 1}:</span> {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area - Enhanced */}
                    <div className="p-4 bg-white border-t border-purple-100">
                        <div className="flex space-x-2">
                            <textarea
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="💭 Tanya tentang estimasi biaya, hotel, transportasi..."
                                className="flex-1 border border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 rounded-lg px-3 py-2 resize-none text-sm transition-all"
                                rows="2"
                                disabled={isLoading}
                                maxLength={1000}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!inputMessage.trim() || isLoading}
                                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 transition-all hover:shadow-md disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="animate-spin">⚡</div>
                                ) : (
                                    '🚀'
                                )}
                            </button>
                        </div>

                        <div className="flex justify-between items-center mt-2 text-xs">
                            <span className="text-purple-600 flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                                AI Ready
                            </span>
                            <span className={`${inputMessage.length > 800 ? 'text-orange-500' : 'text-gray-500'}`}>
                                {inputMessage.length}/1000
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}