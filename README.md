# voice-synth-helper-bot
Discord helper (slave) bot with voice synth. Uses IBM's watson voice synth API for text-to-speech audio streams, and sentiment analysis for dynamic responses.

Requires:
- auth.json:
{
    "token": "",
    "watsonTTS": {
        "url": "",
        "username": "",
        "password": ""
    }
}

- jokes.json (array of strings)
- responses.json:
{ 
  "p":[],
  "pp":[],
  "pn":[],
  "n":[],
  "nn":[]
}

p: positive
p: positive+
pn: balanced
n: negative
nn: negative+
