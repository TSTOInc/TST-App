export async function getToken() {
  try {
    const response = await fetch('https://dev-xmw2ajtl2wpc1npq.us.auth0.com/oauth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        "client_id": "1fkxq8ilUkVBt35fYZtkQCXUgvQNy7rA",
        "client_secret": "KFppum5Gfv8dL5zVdIHcARLW7gMOCZXq8OYpVZx-TRPNzJO5SpWX80koU2iaMz_K",
        "audience": "https://dev-xmw2ajtl2wpc1npq.us.auth0.com/api/v2/",
        "grant_type": "client_credentials"
      }),
    });

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Auth0 error:", errorData)
      throw new Error(`Network response was not ok: ${response.status}`)
    }


    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error fetching token:', error);
  }
};