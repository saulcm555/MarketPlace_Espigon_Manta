import { gql } from '@apollo/client';

/**
 * Query para obtener todos los vendedores
 */
export const GET_ALL_SELLERS = gql`
  query GetAllSellers {
    all_sellers {
      id_seller
      seller_name
      seller_email
      phone
      bussines_name
      location
      created_at
    }
  }
`;
