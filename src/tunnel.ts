import tunnel from 'reverse-tunnel-ssh';

const startTunnel = async () => {
  const {
    PG_PORT,
    SSH_TUNNEL_PORT,
    SSH_TUNNEL_HOST,
    SSH_TUNNEL_USERNAME,
    SSH_TUNNEL_PASSWORD,
  } = process.env;

  if (!SSH_TUNNEL_HOST || !SSH_TUNNEL_PORT) {
    console.error('Forwarding disabled.');
    return;
  }

  const conn = tunnel(
    {
      host: SSH_TUNNEL_HOST,
      port: SSH_TUNNEL_PORT,
      username: SSH_TUNNEL_USERNAME,
      password: SSH_TUNNEL_PASSWORD,
      dstHost: '0.0.0.0',
      dstPort: PG_PORT,
      srcHost: '0.0.0.0',
      srcPort: PG_PORT,
    },
    (error: any) => console.error('Tunnel', error),
  );
  conn.on('forward-in', (port: any) => {
    console.log(`Forwarding from ${SSH_TUNNEL_HOST}:${port}`);
  });
};

export default startTunnel;
