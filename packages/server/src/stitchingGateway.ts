import fetch from 'node-fetch';
import WebSocket from 'ws';

import { introspectSchema } from '@graphql-tools/wrap';
import { stitchSchemas } from '@graphql-tools/stitch';
import { observableToAsyncIterable } from '@graphql-tools/utils';
import type { SubschemaConfig, Subscriber, ExecutionParams } from '@graphql-tools/delegate';

import { print } from 'graphql';
import { ApolloServer } from 'apollo-server';
import { SubscriptionClient } from 'subscriptions-transport-ws';

import { PORTS } from './config';

const getSubscriptionSchema = async (uri: string): Promise<SubschemaConfig> => {
  const subscriber: Subscriber = async (params: ExecutionParams) => {
    const { document, variables, context } = params;

    const { context: connectionContext } = context.connection;

    const subscriptionClient = new SubscriptionClient(
      uri.replace(/^http(s?):\/\//, 'ws$1://'),
      {
        lazy: true,
        connectionParams: connectionContext,
        reconnect: true,
        reconnectionAttempts: 5,
        inactivityTimeout: 30,
      },
      WebSocket,
    );

    return observableToAsyncIterable<never>(
      subscriptionClient.request({
        query: print(document),
        variables,
      }),
    );
  };

  const schema = await introspectSchema(({ document, variables }) =>
    fetch(uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: print(document), variables }),
    }).then((response) => response.json()),
  );

  return {
    schema,
    subscriber,
  };
};

const main = async () => {
  const schema = stitchSchemas({
    subschemas: await Promise.all(
      [
        `http://localhost:${PORTS.datetime}/graphql`,
        `http://localhost:${PORTS.uptime}/graphql`,
        `http://localhost:${PORTS.context}/graphql`,
      ].map(getSubscriptionSchema),
    ),
  });

  const server = new ApolloServer({
    schema,
    context: ({ connection }) => ({
      connection,
    }),
    subscriptions: {
      onConnect: (connectionParams) => connectionParams,
    },
  });

  const { url, subscriptionsUrl } = await server.listen(PORTS.stitchingGateway);

  console.log(`🚀  Server ready at ${url} & ${subscriptionsUrl}`);
};

main();
