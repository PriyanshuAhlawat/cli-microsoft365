import * as assert from 'assert';
import chalk = require('chalk');
import * as sinon from 'sinon';
import appInsights from '../../../../appInsights';
import auth from '../../../../Auth';
import { Cli } from '../../../../cli/Cli';
import { CommandInfo } from '../../../../cli/CommandInfo';
import { Logger } from '../../../../cli/Logger';
import Command, { CommandError } from '../../../../Command';
import request from '../../../../request';
import { sinonUtil } from '../../../../utils/sinonUtil';
import commands from '../../commands';
const command: Command = require('./team-set');

describe(commands.TEAM_SET, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogToStderrSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(appInsights, 'trackEvent').callsFake(() => { });
    auth.service.connected = true;
    commandInfo = Cli.getCommandInfo(command);
  });

  beforeEach(() => {
    log = [];
    logger = {
      log: (msg: string) => {
        log.push(msg);
      },
      logRaw: (msg: string) => {
        log.push(msg);
      },
      logToStderr: (msg: string) => {
        log.push(msg);
      }
    };
    loggerLogToStderrSpy = sinon.spy(logger, 'logToStderr');
    (command as any).items = [];
  });

  afterEach(() => {
    sinonUtil.restore([
      request.patch
    ]);
  });

  after(() => {
    sinonUtil.restore([
      auth.restoreAuth,
      appInsights.trackEvent
    ]);
    auth.service.connected = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.TEAM_SET), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('validates for a correct input.', async () => {
    const actual = await command.validate({
      options: {
        id: '8231f9f2-701f-4c6e-93ce-ecb563e3c1ee'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('defines correct option sets', () => {
    const optionSets = command.optionSets;
    assert.deepStrictEqual(optionSets, [['id', 'teamId']]);
  });

  it('logs deprecation warning when option teamId is specified', async () => {
    sinon.stub(request, 'patch').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/8231f9f2-701f-4c6e-93ce-ecb563e3c1ee`) {
        return Promise.resolve({});
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, {
      options: { debug: false, teamId: '8231f9f2-701f-4c6e-93ce-ecb563e3c1ee', visibility: 'Public' }
    } as any);
    assert(loggerLogToStderrSpy.calledWith(chalk.yellow(`Option 'teamId' is deprecated. Please use 'id' instead.`)));
  });

  it('logs deprecation warning when option displayName is specified', async () => {
    sinon.stub(request, 'patch').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/8231f9f2-701f-4c6e-93ce-ecb563e3c1ee`) {
        return Promise.resolve({});
      }

      return Promise.reject('Invalid request');
    });
    
    await command.action(logger, {
      options: { debug: false, id: '8231f9f2-701f-4c6e-93ce-ecb563e3c1ee', displayName: 'NewName', visibility: 'Public' }
    } as any);
    assert(loggerLogToStderrSpy.calledWith(chalk.yellow(`Option 'displayName' is deprecated. Please use 'name' instead.`)));
  });

  it('sets the visibility settings correctly', async () => {
    sinon.stub(request, 'patch').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/8231f9f2-701f-4c6e-93ce-ecb563e3c1ee` &&
        JSON.stringify(opts.data) === JSON.stringify({
          visibility: 'Public'
        })) {
        return Promise.resolve({});
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, {
      options: { debug: false, id: '8231f9f2-701f-4c6e-93ce-ecb563e3c1ee', visibility: 'Public' }
    } as any);
  });

  it('sets the mailNickName correctly', async () => {
    sinon.stub(request, 'patch').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/8231f9f2-701f-4c6e-93ce-ecb563e3c1ee` &&
        JSON.stringify(opts.data) === JSON.stringify({
          mailNickName: 'NewNickName'
        })) {
        return Promise.resolve({});
      }

      return Promise.reject('Invalid request');
    });

    await command.action(logger, {
      options: { debug: false, id: '8231f9f2-701f-4c6e-93ce-ecb563e3c1ee', mailNickName: 'NewNickName' }
    } as any);
  });

  it('sets the description settings correctly', async () => {
    sinon.stub(request, 'patch').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/8231f9f2-701f-4c6e-93ce-ecb563e3c1ee` &&
        JSON.stringify(opts.data) === JSON.stringify({
          description: 'desc'
        })) {
        return Promise.resolve({});
      }
      return Promise.reject('Invalid request');
    });

    await command.action(logger, {
      options: { debug: true, id: '8231f9f2-701f-4c6e-93ce-ecb563e3c1ee', description: 'desc' }
    } as any);
  });

  it('sets the classification settings correctly', async () => {
    sinon.stub(request, 'patch').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/8231f9f2-701f-4c6e-93ce-ecb563e3c1ee` &&
        JSON.stringify(opts.data) === JSON.stringify({
          classification: 'MBI'
        })) {
        return Promise.resolve({});
      }
      return Promise.reject('Invalid request');
    });

    await command.action(logger, {
      options: { debug: true, id: '8231f9f2-701f-4c6e-93ce-ecb563e3c1ee', classification: 'MBI' }
    } as any);
  });

  it('should handle Microsoft graph error response', async () => {
    sinon.stub(request, 'patch').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups/8231f9f2-701f-4c6e-93ce-ecb563e3c1ee`) {
        return Promise.reject({
          "error": {
            "code": "ItemNotFound",
            "message": "No team found with Group Id 8231f9f2-701f-4c6e-93ce-ecb563e3c1ee",
            "innerError": {
              "request-id": "27b49647-a335-48f8-9a7c-f1ed9b976aaa",
              "date": "2019-04-05T12:16:48"
            }
          }
        });
      }

      return Promise.reject('Invalid request');
    });

    await assert.rejects(command.action(logger, { options: {
      debug: false, 
      id: '8231f9f2-701f-4c6e-93ce-ecb563e3c1ee', 
      name: 'NewName' } } as any), new CommandError('No team found with Group Id 8231f9f2-701f-4c6e-93ce-ecb563e3c1ee'));
  });

  it('fails validation if the teamId is not a valid GUID', async () => {
    const actual = await command.validate({ options: { teamId: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the id is not a valid GUID', async () => {
    const actual = await command.validate({ options: { id: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the teamId is a valid GUID', async () => {
    const actual = await command.validate({ options: { teamId: '8231f9f2-701f-4c6e-93ce-ecb563e3c1ee' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if the id is a valid GUID', async () => {
    const actual = await command.validate({ options: { id: '8231f9f2-701f-4c6e-93ce-ecb563e3c1ee' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if visibility is not a valid visibility Private|Public', async () => {
    const actual = await command.validate({
      options: {
        id: '8231f9f2-701f-4c6e-93ce-ecb563e3c1ee',
        visibility: 'hidden'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, false);
  });

  it('supports debug mode', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option === '--debug') {
        containsOption = true;
      }
    });
    assert(containsOption);
  });
});