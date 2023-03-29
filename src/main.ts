import * as dotenv from 'dotenv';
import phoneGpt from './phoneGpt';
import startTunnel from './tunnel';

dotenv.config();

phoneGpt();

try {
  startTunnel();
} catch (exception) {
  console.error(exception);
}
