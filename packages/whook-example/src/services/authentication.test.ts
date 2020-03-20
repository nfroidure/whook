import initAuthentication from './authentication';
import YError from 'yerror';

describe('authentication', () => {
  const TOKEN = 'my_secret';

  describe('.check()', () => {
    describe('with bearer type', () => {
      it('should work with a good token', async () => {
        const authentication = await initAuthentication({ TOKEN });
        const result = await authentication.check('bearer', { hash: TOKEN });

        expect({
          result,
        }).toMatchSnapshot();
      });

      it('should fail with a bad token', async () => {
        const authentication = await initAuthentication({ TOKEN });

        try {
          await authentication.check('bearer', { hash: 'lol' });
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect({
            errorCode: err.code,
            errorParams: err.params,
          }).toMatchSnapshot();
        }
      });
    });

    describe('with fake type', () => {
      it('should work with fakedata', async () => {
        const authentication = await initAuthentication({ TOKEN });
        const result = await authentication.check('fake', {
          applicationId: '1',
          userId: '1',
          scope: 'user',
        });

        expect({
          result,
        }).toMatchSnapshot();
      });
    });

    describe('with a bad auth type', () => {
      it('should fail', async () => {
        const authentication = await initAuthentication({ TOKEN });

        try {
          await authentication.check('yolo', { hash: 'lol' });
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect({
            errorCode: err.code,
            errorParams: err.params,
          }).toMatchSnapshot();
        }
      });
    });
  });
});
