const { GoogleGenAI } = require('@google/genai')

// Initialize AI client
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
})

class GeminiChatbot {
    constructor() {
        this.modelName = "gemini-2.5-flash"
        this.conversations = new Map() // Simpan chat history per user
    }

    async generateResponse(userId, userMessage) {
        try {
            // System prompt SUPER SIMPEL tapi efektif
            const systemPrompt = `AI Assistant SPPD Indonesia. Bantu estimasi biaya perjalanan dinas.

HARGA REFERENSI:
Pesawat: JKT-SBY 800rb-1.5jt, JKT-MDN 1.2-2.5jt
Kereta: JKT-BDG 60-200rb
Bus: JKT-SBY 150-400rb
Hotel: Bintang 5 (1-3jt), Bintang 4 (500rb-1.5jt), Bintang 3 (300-800rb), Budget (150-400rb)

Jawab singkat, kasih 2-3 pilihan, tips hemat.`

            // Ambil chat history user ini
            const history = this.conversations.get(userId) || []

            // Build conversation contents
            const contents = [
                ...history,
                {
                    role: "user",
                    parts: [{ text: systemPrompt + "\n\nQ: " + userMessage }]
                }
            ]

            // Generate response
            const response = await ai.models.generateContent({
                model: this.modelName,
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024, // Kurangi dari 2048
                }
            })

            const responseText = response.text || "Maaf, ada masalah dengan AI."

            // Simpan ke history (cuma 4 pesan terakhir biar hemat)
            const newHistory = [
                ...history.slice(-2), // Kurangi dari -4 jadi -2
                {
                    role: "user",
                    parts: [{ text: userMessage }]
                },
                {
                    role: "model",
                    parts: [{ text: responseText }]
                }
            ]

            this.conversations.set(userId, newHistory)

            return {
                success: true,
                response: responseText,
                chatCount: Math.floor(newHistory.length / 2)
            }

        } catch (error) {
            console.error('Gemini Error:', error)

            let fallbackMessage = "AI lagi gangguan. Coba lagi ya! 😅"

            if (error.message?.includes('SAFETY')) {
                fallbackMessage = "Pertanyaan kurang tepat. Tanya tentang perjalanan dinas aja!"
            }

            return {
                success: false,
                response: fallbackMessage
            }
        }
    }

    // Clear chat history
    clearHistory(userId) {
        this.conversations.delete(userId)
        return "Chat history dihapus! Ready untuk chat baru."
    }
}

module.exports = new GeminiChatbot()