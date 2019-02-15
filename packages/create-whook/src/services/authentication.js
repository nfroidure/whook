import { autoService } from 'knifecycle';
import YError from 'yerror';

export default autoService(initAuthentication);

// A fake authentication service
async function initAuthentication({ TOKEN }) {
  const authentication = {
    check: async (type, data) => {
      if (type === 'fake') {
        return data;
      }
      if (type === 'bearer') {
        if (data.hash === TOKEN) {
          return {
            userId: 1,
            scopes: ['admin'],
          };
        }
        throw new YError('E_BAD_BEARER_TOKEN', type, data.hash);
      }
      throw new YError('E_UNEXPECTED_AUTH_TYPE', type);
    },
  };

  return authentication;
}
