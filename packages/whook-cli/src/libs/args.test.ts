import { readArgs } from './args';
import { definition as handlerCommandDefinition } from '../commands/handler';
import YError from 'yerror';
import { WhookCommandArgs } from '..';

describe('readArgs', () => {
  it('should work with no args', () => {
    const args = {
      _: ['whook'],
    } as any;

    readArgs(
      {
        type: 'object',
      } as any,
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
    } as any;

    readArgs(handlerCommandDefinition.arguments, args);

    expect({
      args,
    }).toMatchSnapshot();
  });

  it('should work with listed args', () => {
    const args = {
      _: ['whook', 'hey'],
    } as any;

    readArgs(
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          _: {
            type: 'array',
            description: 'Rest params',
            items: {
              type: 'string',
            },
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
    } as any;

    try {
      readArgs(handlerCommandDefinition.arguments, args);
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        args,
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
      }).toMatchSnapshot();
    }
  });
});
