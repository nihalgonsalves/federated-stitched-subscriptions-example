import { ApolloServer, gql } from 'apollo-server';
import { buildFederatedSchema } from '@apollo/federation';
import { PORTS } from './config';

const employees = [
  {
    id: 'EMPLOYEE_A',
    name: 'John',
  },
  {
    id: 'EMPLOYEE_B',
    name: 'David',
  },
];

const typeDefs = gql`
  schema {
    query: Query
  }

  type Query {
    employees: EmployeesResponse
    employeeById(id: ID): Employee!
  }

  type EmployeesResponse {
    employees: [Employee!]!
    count: Int
  }

  type Employee @key(fields: "id") {
    id: ID!
    name: String!
  }
`;

const schema = buildFederatedSchema([
  {
    typeDefs,
    resolvers: {
      Query: {
        employees: () => ({ employees, count: employees.length }),
        employeeById: (root, { id }) => employees.find((e) => e.id === id),
      },
      Employee: {
        __resolveReference: ({ id }) => employees.find((e) => e.id === id),
      },
    },
  },
]);

const server = new ApolloServer({
  schema,
  tracing: true,
  cors: true,
  introspection: true,
  playground: true,
});

server.listen(PORTS.employee).then(({ url }) => {
  // eslint-disable-next-line no-console
  console.log(`🚀  Server ready at ${url}`);
});
