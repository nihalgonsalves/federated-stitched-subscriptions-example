import type { AppProps } from 'next/app';
import { ApolloProvider } from '@apollo/client';

import { apolloClient } from '../apolloClient';

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <ApolloProvider client={apolloClient}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
};

export default MyApp;
