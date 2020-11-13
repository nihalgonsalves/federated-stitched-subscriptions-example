import fetch from 'node-fetch';
import WebSocket from 'ws';

import { introspectSchema } from '@graphql-tools/wrap';
import { stitchSchemas } from '@graphql-tools/stitch';
import { observableToAsyncIterable } from '@graphql-tools/utils';
import type { SubschemaConfig, AsyncExecutor, Subscriber, ExecutionParams } from '@graphql-tools/delegate';

import { print } from 'graphql';
import { ApolloServer } from 'apollo-server';
import { SubscriptionClient } from 'subscriptions-transport-ws';

import { PORTS } from './config';

const getHTTPExecutor = (uri: string): AsyncExecutor => async ({ document, variables }) => {
  const query = print(document);

  const fetchResult = await fetch(uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  return fetchResult.json();
};

const getSubscriptionSchema = async (uriWithoutScheme: string): Promise<SubschemaConfig> => {
  const subscriber: Subscriber = async (params: ExecutionParams) => {
    const { document, variables, context } = params;
    const { context: connectionContext } = context.connection;

    const subscriptionClient = new SubscriptionClient(
      `ws://${uriWithoutScheme}`,
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

  const executor = getHTTPExecutor(`http://${uriWithoutScheme}`);
  const schema = await introspectSchema(executor);

  return {
    schema,
    executor,
    subscriber,
  };
};

const main = async () => {
  const schema = stitchSchemas({
    subschemas: await Promise.all(
      [`localhost:${PORTS.datetime}/graphql`, `localhost:${PORTS.uptime}/graphql`].map(getSubscriptionSchema),
    ),
  });

  const server = new ApolloServer({
    schema,
    context: ({ req, connection }) => ({
      headers: req?.headers,
      connection,
    }),
    subscriptions: {
      onConnect: (connectionParams) => connectionParams,
    },
  });

  server.listen(PORTS.stitchingGateway).then(({ url, subscriptionsUrl }) => {
    // eslint-disable-next-line no-console
    console.log(`🚀  Server ready at ${url} & ${subscriptionsUrl}`);
  });
};

main();
