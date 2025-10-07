export async function getToken() {
  try {
      const response = await fetch('https://dev-xmw2ajtl2wpc1npq.us.auth0.com/oauth/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          "client_id":"GRsrGW0mV9e5Cr46sYlzmVP1vkSxAwSC",
          "client_secret":"qQltzNd7CkmaEBLo-mlXDkLHPwgafe_jOrSs_oII-w6y93E2zSppk_KXpCz2Go3H",
          "audience":"https://dev-xmw2ajtl2wpc1npq.us.auth0.com/api/v2/",
          "grant_type":"client_credentials"
        }),
      });

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return data.access_token;
  } catch (error) {
      console.error('Error fetching token:', error);
  }
};