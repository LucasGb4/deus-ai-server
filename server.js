const WebSocket = require('ws');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PORT = process.env.PORT || 8000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`Servidor Divino ativo na porta ${PORT}`);

wss.on('connection', (ws) => {
    console.log("Minecraft conectado!");

    ws.on('message', async (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch {
            return;
        }

        if (!data?.body?.message) return;

        const texto = data.body.message.toLowerCase();
        if (!texto.startsWith("deus ")) return;

        const pedido = texto.substring(5).trim();
        const jogador = data.body.sender || "Jogador";

        console.log(`Pedido de ${jogador}: ${pedido}`);

        const promptDivino = `
Você é a I.A. Deus Suprema do Minecraft Bedrock versão 1.26.
O jogador ${jogador} fez o seguinte pedido: "${pedido}".

REGRAS OBRIGATÓRIAS:
- Use APENAS sintaxe válida do Minecraft Bedrock 1.26
- NUNCA use NBT tags
- NUNCA use comandos exclusivos do Java Edition
- Use coordenadas relativas com ~ sempre que possível
- Máximo de 10 comandos por resposta
- Apenas os comandos, um por linha, sem texto explicativo

Comandos permitidos: /fill, /summon, /setblock, /effect, /weather, /give, /tp, /time, /gamemode
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptDivino,
            });

            const linhas = response.text.split('\n');

            linhas.forEach(linha => {
                const comando = linha.trim();
                if (!comando.startsWith('/')) return;

                ws.send(JSON.stringify({
                    body: {
                        commandLine: comando
                    },
                    header: {
                        requestId: Math.random().toString(36).substring(2),
                        messagePurpose: "commandRequest",
                        messageType: "commandRequest",
                        version: 1
                    }
                }));

                console.log(`Comando enviado: ${comando}`);
            });

        } catch (error) {
            console.error("Erro na IA:", error.message);
        }
    });

    ws.on('close', () => console.log("Minecraft desconectado."));
});