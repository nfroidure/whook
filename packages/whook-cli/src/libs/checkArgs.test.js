import { checkArgs } from './checkArgs';
import { definition as handlerCommandDefinition } from '../commands/handler';
import YError from 'yerror';

describe('checkArgs', () => {
  it('should work with no args', () => {
    const args = {};

    checkArgs(
      {
        type: 'object',
      },
      args,
    );

    expect({
      args,
    }).toMatchSnapshot();
  });

  it('should work with named args', () => {
    const args = {
      name: 'getPing',
      parameters: '{}',
    };

    checkArgs(handlerCommandDefinition.arguments, args);

    expect({
      args,
    }).toMatchSnapshot();
  });

  it('should report named args errors', () => {
    const args = {
      parameters: '{}',
    };

    try {
      checkArgs(handlerCommandDefinition.arguments, args);
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        args,
        errorCode: err.code,
        errorParams: err.params,
      }).toMatchSnapshot();
    }
  });
});
