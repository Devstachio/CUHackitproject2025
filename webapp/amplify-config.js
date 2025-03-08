import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: '5mccls63po202202ah93vc1314',
      userPoolId: 'us-west-2_nkMY70ERE',
      loginWith: { // Optional
        oauth: {
          domain: 'us-west-2nkmy70ere.auth.us-west-2.amazoncognito.com', // Remove https://
          scopes: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'],
          redirectSignIn: 'http://localhost:3000/', // Ensure this matches your Cognito settings
          redirectSignOut: 'http://localhost:3000/', // Ensure this matches your Cognito settings
          responseType: 'code',
        },
        username: 'true',
        email: 'false', // Optional
        phone: 'false', // Optional
      }
    }
  }
});