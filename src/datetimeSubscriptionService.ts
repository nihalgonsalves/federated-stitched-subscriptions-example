import { ApolloServer, PubSub, gql } from 'apollo-server';
import { PORTS } from './config';

const typeDefs = gql`
  type Query {
    dateTime: String!
  }

  type Subscription {
    dateTime: String!
  }
`;

enum Event {
  DATETIME_UPDATED = 'DATETIME_UPDATED',
}

const pubSub = new PubSub();

setInterval(() => {
  pubSub.publish(Event.DATETIME_UPDATED, new Date().toISOString());
}, 1000);

const resolvers = {
  Query: {
    dateTime: () => new Date().toISOString(),
  },
  Subscription: {
    dateTime: {
      subscribe: () => pubSub.asyncIterator(Event.DATETIME_UPDATED),
      resolve: (seconds: number) => seconds,
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  tracing: true,
  cors: true,
  introspection: true,
  playground: true,
  debug: true,
});

server.listen(PORTS.datetime).then(({ url, subscriptionsUrl }) => {
  // eslint-disable-next-line no-console
  console.log(`🚀  Server ready at ${url} & ${subscriptionsUrl}`);
});
