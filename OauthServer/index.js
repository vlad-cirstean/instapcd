const { Provider } = require('oidc-provider');

const PORT = 1234;
const configuration = {
  clients: [ {
    client_id: 'foo',
    client_secret: 'bar',
    redirect_uris: [ 'http://localhost:8000/callback' ],
    response_types: [ 'code' ],
    grant_types: [ 'authorization_code' ]
  } ]
};

const oidc = new Provider('http://localhost:3000', configuration);


const server = oidc.listen(PORT, () => {
  console.log(`oidc-provider listening on port ${PORT}, check http://localhost:${PORT}/.well-known/openid-configuration`);
});
