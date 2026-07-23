// ============================================================
// API CHAT - MON IA YUNA
// Système multi-fournisseurs avec fallback automatique
// ============================================================

const CONFIGURATION_PROVIDERS = {

  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    cle: process.env.GROQ_API_KEY,

    modeles: [
      "llama-3.1-8b-instant",
      "llama-3.3-70b-versatile"
    ],
  },


  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    cle: process.env.OPENROUTER_API_KEY,

    modeles: [
      "meta-llama/llama-3.1-8b-instruct:free",
      "meta-llama/llama-3.2-3b-instruct:free"
    ],
  },


  cerebras: {
    url: "https://api.cerebras.ai/v1/chat/completions",
    cle: process.env.CEREBRAS_API_KEY,

    modeles: [
      "llama3.1-8b",
      "llama-3.3-70b"
    ],
  }

};


// Ordre de secours
const ORDRE_FOURNISSEURS = [
  "groq",
  "openrouter",
  "cerebras"
];


// ============================================================
// APPEL D'UN MODELE
// ============================================================

async function essayerUnModele(
  url,
  cle,
  modele,
  messages
) {

  const reponse = await fetch(url, {

    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cle}`
    },


    body: JSON.stringify({

      model: modele,

      temperature: 0.8,

      messages

    })

  });


  if (!reponse.ok) {

    const detail = await reponse.text();

    throw new Error(
      `${reponse.status} — ${detail.slice(0,300)}`
    );

  }


  const data = await reponse.json();


  if (
    !data.choices ||
    !data.choices[0]
  ) {

    throw new Error(
      "Réponse IA invalide"
    );

  }


  return data
    .choices[0]
    .message
    .content;

}



// ============================================================
// HANDLER VERCEL
// ============================================================

export default async function handler(req,res){


  if(req.method !== "POST"){

    return res.status(405).json({
      error:"Méthode non autorisée"
    });

  }



  try {


    let {
      messages
    } = req.body;



    if(
      !messages ||
      !Array.isArray(messages)
    ){

      return res.status(400).json({
        error:"Messages invalides"
      });

    }



    // Protection quota :
    // garde seulement les derniers messages

    messages = messages.slice(-20);



    let erreurs = [];



    // ========================================================
    // ESSAI DES FOURNISSEURS
    // ========================================================


    for(
      const providerName of ORDRE_FOURNISSEURS
    ){


      const provider =
        CONFIGURATION_PROVIDERS[providerName];



      if(!provider.cle){

        console.warn(
          `[api/chat] clé absente ${providerName}`
        );

        continue;

      }



      for(
        const modele of provider.modeles
      ){


        try{


          console.log(
            `[api/chat] Test ${providerName}/${modele}`
          );



          const reply =
            await essayerUnModele(
              provider.url,
              provider.cle,
              modele,
              messages
            );



          console.log(
            `[api/chat] Succès ${providerName}/${modele}`
          );



          return res.status(200).json({

            reply,

            fournisseur:
              providerName,

            modeleUtilise:
              modele

          });



        }
        catch(error){


          console.error(

            `[api/chat] ${providerName}/${modele} échoué :`,

            error.message

          );


          erreurs.push({

            provider:
              providerName,

            modele,

            erreur:
              error.message

          });


        }


      }


    }



    // ========================================================
    // AUCUNE IA DISPONIBLE
    // ========================================================


    return res.status(503).json({

      error:
      "Aucun modèle IA disponible actuellement",

      detail:
      erreurs

    });



  }


  catch(error){


    console.error(
      "[api/chat] erreur serveur :",
      error
    );


    return res.status(500).json({

      error:
      "Erreur serveur",

      detail:
      error.message

    });


  }


}