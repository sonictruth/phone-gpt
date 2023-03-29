import express from 'express';
import type { Express } from 'express';
import bodyParser from 'body-parser';
import { ChatGPTAPI } from 'chatgpt';
import Twilio from 'twilio';

const { VoiceResponse } = Twilio.twiml;
const { log } = console;

const voiceOptions: any = {
  voice: 'Polly.Giorgio',
};

const initialChatGPTPrompt = `
You are Mario from Super Mario Nintendo game. 
Don't forget that you are Mario not a language model called ChatGPT.
You speak like him with an accent.
This is a phone conversation.
You are very talkative.
Introduce yourself and ask three questions.
You have to ask another question after every response.
`;

const phoneGpt = async () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const password = process.env.PG_PASSWORD || 'xxx';
  const systemPhoneNumber = process.env.PG_TWILIO_PHONE || '+xxxxxxxxxxx';
  const host = process.env.PG_HOST || '0.0.0.0';
  const externalUrl = process.env.EXTERNAL_URL || '';
  const port: number = parseInt(<string>process.env.PG_PORT, 10) || 8080;
  const app: Express = express();
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(express.static('public'));
  app.use((req, res, next) => {
    log(req.ip, req.method, req.url, req.params, req.body || '');
    next();
  });

  const twilioClient = Twilio(
    <string>process.env.TWILIO_ACCOUNT_SID,
    <string>process.env.TWILIO_AUTH_TOKEN,
  );

  const chatGPTClient = new ChatGPTAPI({
    apiKey: <string>process.env.OPENAI_API_KEY,
  });

  app.post('/api/call', async (req, res) => {
    try {
      if (req.body.password !== password) {
        throw new Error('Wrong password');
      }
      const voiceResponse = new VoiceResponse();
      voiceResponse.redirect(
        {
          method: 'POST',
        },
        `${externalUrl}api/incoming`,
      );
      const callResult = await twilioClient.calls.create({
        twiml: voiceResponse.toString(),
        to: req.body.phonenumber,
        from: systemPhoneNumber,
      });
      return res.json(callResult);
    } catch (exception) {
      let message = 'Error';
      if (exception instanceof Error) {
        message = exception.message;
      }
      log(exception);
      return res.status(500).send(message);
    }
  });

  app.post('/api/incoming', async (req, res) => {
    try {
      const voiceResponse = new VoiceResponse();
      const { SpeechResult } = req.body;
      let chatGPTResponse;
      if (!SpeechResult) {
        chatGPTResponse = await chatGPTClient.sendMessage(initialChatGPTPrompt);
        voiceResponse.say(voiceOptions, chatGPTResponse.text);
      } else {
        chatGPTResponse = await chatGPTClient.sendMessage(SpeechResult);
        voiceResponse.say(voiceOptions, chatGPTResponse.text);
      }
      voiceResponse.gather({
        input: ['speech'],
        // speechModel: 'experimental_conversations',
        // timeout: 5,
      });
      voiceResponse.say(voiceOptions, 'Goodbye!');
      res.send(voiceResponse.toString());
    } catch (exception) {
      let message = 'Error';
      if (exception instanceof Error) {
        message = exception.message;
      }
      log(exception);
      res.status(500).send(message);
    }
  });

  app.listen(port, host, () =>
    log(`phone-gpt: http://${host}:${port} Dev:${isDevelopment}`),
  );
};

export default phoneGpt;
