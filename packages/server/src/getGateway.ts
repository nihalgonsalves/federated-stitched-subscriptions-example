import { ApolloGateway } from '@apollo/gateway';
import { PORTS } from './config';

export const getGateway = (): ApolloGateway =>
  new ApolloGateway({
    // NOTE: Just for local usage. Not required with actual Apollo Graph Manager configuration
    serviceList: [
      { name: 'employee', url: `http://localhost:${PORTS.employee}/graphql` },
      { name: 'vehicle', url: `http://localhost:${PORTS.vehicle}/graphql` },
    ],
    // NOTE: Just for local usage. Not required with actual Apollo Graph Manager configuration
    experimental_pollInterval: 1000,
  });
