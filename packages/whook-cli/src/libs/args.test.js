import { readArgs } from './args';
import { definition as handlerCommandDefinition } from '../commands/handler';
import YError from 'yerror';

describe('readArgs', () => {
  it('should work with no args', () => {
    const args = {
      _: ['whook'],
    };

    readArgs(
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
      _: ['whook'],
      name: 'getPing',
      parameters: '{}',
    };

    readArgs(handlerCommandDefinition.arguments, args);

    expect({
      args,
    }).toMatchSnapshot();
  });

  it('should work with listed args', () => {
    const args = {
      _: ['whook', 'hey'],
    };

    readArgs(
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          _: {
            type: 'array',
            maxItems: Infinity,
          },
        },
      },
      args,
    );

    expect({
      args,
    }).toMatchSnapshot();
  });

  it('should report named args errors', () => {
    const args = {
      _: ['whook'],
      parameters: '{}',
    };

    try {
      readArgs(handlerCommandDefinition.arguments, args);
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
