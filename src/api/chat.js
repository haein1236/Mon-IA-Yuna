import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée"
    });
  }

  try {

    const { messages } = req.body;

    const completion =
      await groq.chat.completions.create({

        model: "llama-3.3-70b-versatile",

        temperature: 0.8,

        messages

      });

    res.status(200).json({
      reply: completion.choices[0].message.content
    });

  } catch (e) {

    console.error(e);

    res.status(500).json({
      error: "Erreur serveur"
    });

  }

}