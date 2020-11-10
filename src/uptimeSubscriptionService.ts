import { ApolloServer, PubSub, gql } from 'apollo-server';
import { PORTS } from './config';

const typeDefs = gql`
  type Query {
    uptimeSeconds: Int!
  }

  type Subscription {
    uptimeSeconds: Int!
  }
`;

enum Event {
  UPTIME_UPDATED = 'UPTIME_UPDATED',
}

const pubSub = new PubSub();

let uptimeSeconds = 0;

setInterval(() => {
  pubSub.publish(Event.UPTIME_UPDATED, uptimeSeconds += 1);
}, 1000);

const resolvers = {
  Query: {
    uptimeSeconds: () => uptimeSeconds,
  },
  Subscription: {
    uptimeSeconds: {
      subscribe: () => pubSub.asyncIterator(Event.UPTIME_UPDATED),
      resolve: (seconds: number) => seconds,
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen(PORTS.uptime).then(({ url, subscriptionsUrl }) => {
  // eslint-disable-next-line no-console
  console.log(`🚀  Server ready at ${url} & ${subscriptionsUrl}`);
});
