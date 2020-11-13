import WebSocket from 'ws';
import { split, HttpLink, ApolloClient, InMemoryCache } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from '@apollo/client/link/ws';

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  headers: {
    'X-Foo': 'Bar',
  },
});

const wsLink = new WebSocketLink({
  uri: `ws://localhost:3000/graphql`,
  options: {
    reconnect: true,
    connectionParams: {
      foo: 'bar',
    },
  },
  webSocketImpl: process.browser ? undefined : WebSocket,
});

export const apolloClient = new ApolloClient({
  link: split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    wsLink,
    httpLink,
  ),
  cache: new InMemoryCache(),
});
