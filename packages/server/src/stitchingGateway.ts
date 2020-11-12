import http from 'http';
import fetch from 'node-fetch';
import WebSocket from 'ws';

import express, { Router } from 'express';
import bodyParser from 'body-parser';

import { introspectSchema } from '@graphql-tools/wrap';
import { stitchSchemas } from '@graphql-tools/stitch';
import { observableToAsyncIterable } from '@graphql-tools/utils';
import type { SubschemaConfig, AsyncExecutor, Subscriber, ExecutionParams } from '@graphql-tools/delegate';

import { GraphQLSchema, print } from 'graphql';
import { ApolloServer } from 'apollo-server-express';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import type { ApolloGateway } from '@apollo/gateway';
import expressPlayground from 'graphql-playground-middleware-express';

import { getGateway } from './getGateway';
import { PORTS } from './config';

const PORT = PORTS.stitchingGateway;

const app = express();

const getHTTPExecutor = (uri: string): AsyncExecutor => async ({ document, variables, context }) => {
  const query = print(document);

  const fetchResult = await fetch(uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // @ts-expect-error WIP
      ...context?.headers,
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

const getServer = async (gatewaySchema: GraphQLSchema) => {
  const gatewaySubSchema: SubschemaConfig = {
    schema: gatewaySchema,
    executor: getHTTPExecutor(`http://localhost:${PORTS.federationGateway}/graphql`),
  };

  const subscriptionSchemas: SubschemaConfig[] = await Promise.all(
    [`localhost:${PORTS.datetime}/graphql`, `localhost:${PORTS.uptime}/graphql`].map(getSubscriptionSchema),
  );

  const schema = stitchSchemas({
    subschemas: [gatewaySubSchema, ...subscriptionSchemas],
  });

  return new ApolloServer({
    schema,
    context: ({ req, connection }) => ({
      headers: req?.headers,
      connection,
    }),
    subscriptions: {
      onConnect: (connectionParams) => connectionParams,
    },
  });
};

class SubscriptionGateway {
  private httpServer: http.Server;

  private gateway: ApolloGateway;

  private server: ApolloServer | undefined;

  private apolloMiddleware: Router | undefined;

  constructor() {
    app.use(bodyParser.json());
    app.use(this.requestHandler.bind(this));

    app.get(
      '/playground',
      expressPlayground({
        endpoint: `http://localhost:${PORT}/graphql`,
      }),
    );

    this.httpServer = http.createServer(app);

    this.gateway = getGateway();

    this.gateway.onSchemaChange(async (schema) => {
      console.log('🟡 Received Apollo Gateway schema change notification. Hot-reloading server.');

      const oldServer = this.server;

      this.server = await getServer(schema);
      this.server.installSubscriptionHandlers(this.httpServer);
      this.apolloMiddleware = this.server.getMiddleware();

      if (oldServer) {
        console.log('✅ Schema reloaded');
        await oldServer.stop();
        console.log('🟠 Old server instance stopped');
      } else {
        console.log(
          `🚀 Server ready at http://localhost:${PORT}${this.server?.graphqlPath} & ws://localhost:${PORT}${this.server?.subscriptionsPath}`,
        );

        this.httpServer.listen(PORT, () => {});
      }
    });
  }

  requestHandler(...params: Parameters<Router>) {
    if (this.apolloMiddleware) {
      this.apolloMiddleware(...params);
    } else {
      const [req, res] = params;

      res.status(500).json({ error: 'Uninitialized' });
    }
  }

  async load() {
    await this.gateway.load();
  }
}

new SubscriptionGateway().load();
