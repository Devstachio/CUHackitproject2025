// AWS Amplify configuration with updated format
const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-west-2_nkMY70ERE',
      userPoolClientId: 'YOUR_USER_POOL_WEB_CLIENT_ID',
      loginWith: {
        username: true,
        email: true,
        phone: false
      }
    }
  }
};
console.log("[DEBUG] AWS exports loaded with User Pool ID:", awsConfig.Auth.Cognito.userPoolId);
export default awsConfig;