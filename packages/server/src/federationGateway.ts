import { ApolloServer } from 'apollo-server';
import { PORTS } from './config';
import { getGateway } from './getGateway';

const server = new ApolloServer({
  gateway: getGateway(),
  subscriptions: false,
});

server.listen(PORTS.federationGateway).then(({ url }) => {
  // eslint-disable-next-line no-console
  console.log(`🚀  Server ready at ${url}`);
});
