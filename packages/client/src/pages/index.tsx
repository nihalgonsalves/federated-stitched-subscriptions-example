import { gql, useQuery, useSubscription } from '@apollo/client';
import { NextPage } from 'next';

const IndexPage: NextPage = () => {
  const queryResult = useQuery(gql`
    query Test {
      vehicles {
        id
        label
        vin
        currentlyOpenedBy {
          id
          name
        }
      }
      employees {
        employees {
          id
          name
          currentVehicle {
            id
            label
            vin
          }
        }
        count
      }
    }
  `);

  const subscriptionAResult = useSubscription(
    gql`
      subscription {
        uptimeSeconds
      }
    `,
  );

  const subscriptionBResult = useSubscription(
    gql`
      subscription {
        dateTime
      }
    `,
  );

  const subscriptionCResult = useSubscription(
    gql`
      subscription {
        context
      }
    `,
  );

  return (
    <>
      <pre>
        {JSON.stringify(
          {
            subscriptionAResult,
            subscriptionBResult,
            subscriptionCResult,
            queryResult: { data: queryResult.data, loading: queryResult.loading, error: queryResult.error },
          },
          null,
          2,
        )}
      </pre>
    </>
  );
};

export default IndexPage;
