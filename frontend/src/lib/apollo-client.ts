import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// URL del servidor GraphQL
const GRAPHQL_URL = 'http://127.0.0.1:4000/graphql';

// Crear el cliente Apollo
export const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: GRAPHQL_URL,
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
