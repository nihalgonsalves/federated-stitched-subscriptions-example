import { ApolloServer, gql } from 'apollo-server';
import { buildFederatedSchema } from '@apollo/federation';
import { PORTS } from './config';

const vehicles = [
  {
    id: 1,
    label: '10',
    vin: 'VW000111112',
    currentlyOpenedBy: { id: 'EMPLOYEE_A' },
  },
  {
    id: 2,
    label: '20',
    vin: 'VW000113331',
    currentlyOpenedBy: { id: 'EMPLOYEE_B' },
  },
];

const typeDefs = gql`
  schema {
    query: Query
  }

  type Query {
    vehicles: [Vehicle!]!
  }

  type Vehicle @key(fields: "id") {
    id: ID!
    label: String!
    vin: String!
    currentlyOpenedBy: Employee
  }

  extend type Employee @key(fields: "id") {
    id: ID! @external
    currentVehicle: Vehicle
  }
`;

const resolvers = {
  Query: {
    vehicles: () => vehicles,
  },
  Employee: {
    currentVehicle: ({ id }: { id: string }) => vehicles.find((v) => v.currentlyOpenedBy?.id === id),
  },
};

const schema = buildFederatedSchema([{ typeDefs, resolvers }]);

const server = new ApolloServer({
  schema,
});

server.listen(PORTS.vehicle).then(({ url }) => {
  // eslint-disable-next-line no-console
  console.log(`🚀  Server ready at ${url}`);
});
