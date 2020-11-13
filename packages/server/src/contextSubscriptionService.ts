import { ApolloServer, PubSub, gql } from 'apollo-server';
import { PORTS } from './config';

const typeDefs = gql`
  type Query {
    context: String
  }

  type Subscription {
    context: String
  }
`;

enum Event {
  TICK = 'TICK',
}

const pubSub = new PubSub();

setInterval(() => {
  pubSub.publish(Event.TICK, undefined);
}, 1000);

const server = new ApolloServer({
  typeDefs,
  resolvers: {
    Query: {
      context: (root, args, context, info) => JSON.stringify(context),
    },
    Subscription: {
      context: {
        subscribe: () => pubSub.asyncIterator(Event.TICK),
        resolve: (root, args, context, info) => JSON.stringify(context.connection.context),
      },
    },
  },
  subscriptions: {
    onConnect: (connectionParams) => {
      console.log(connectionParams);
      return connectionParams;
    },
  },
});

server.listen(PORTS.context).then(({ url, subscriptionsUrl }) => {
  // eslint-disable-next-line no-console
  console.log(`🚀  Server ready at ${url} & ${subscriptionsUrl}`);
});
