import { Logger } from '../../../../cli/Logger';
import GlobalOptions from '../../../../GlobalOptions';
import request from '../../../../request';
import { validation } from '../../../../utils/validation';
import GraphCommand from '../../../base/GraphCommand';
import commands from '../../commands';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  allowAddRemoveApps?: string;
  allowCreateUpdateChannels?: string;
  allowCreateUpdateRemoveConnectors?: string;
  allowCreateUpdateRemoveTabs?: string;
  allowDeleteChannels?: string;
  teamId: string;
}

class TeamsMemberSettingsSetCommand extends GraphCommand {
  private static props: string[] = [
    'allowAddRemoveApps',
    'allowCreateUpdateChannels',
    'allowCreateUpdateRemoveConnectors',
    'allowCreateUpdateRemoveTabs',
    'allowDeleteChannels'
  ];

  public get name(): string {
    return commands.MEMBERSETTINGS_SET;
  }

  public get description(): string {
    return 'Updates member settings of a Microsoft Teams team';
  }

  constructor() {
    super();

    this.#initTelemetry();
    this.#initOptions();
    this.#initValidators();
  }

  #initTelemetry(): void {
    this.telemetry.push((args: CommandArgs) => {
      TeamsMemberSettingsSetCommand.props.forEach(p => {
        this.telemetryProperties[p] = (args.options as any)[p];
      });
    });
  }

  #initOptions(): void {
    this.options.unshift(
      {
        option: '-i, --teamId <teamId>'
      },
      {
        option: '--allowAddRemoveApps [allowAddRemoveApps]'
      },
      {
        option: '--allowCreateUpdateChannels [allowCreateUpdateChannels]'
      },
      {
        option: '--allowCreateUpdateRemoveConnectors [allowCreateUpdateRemoveConnectors]'
      },
      {
        option: '--allowCreateUpdateRemoveTabs [allowCreateUpdateRemoveTabs]'
      },
      {
        option: '--allowDeleteChannels [allowDeleteChannels]'
      }
    );
  }

  #initValidators(): void {
    this.validators.push(
      async (args: CommandArgs) => {
        if (!validation.isValidGuid(args.options.teamId)) {
          return `${args.options.teamId} is not a valid GUID`;
        }

        let isValid: boolean = true;
        let value, property: string = '';
        TeamsMemberSettingsSetCommand.props.every(p => {
          property = p;
          value = (args.options as any)[p];
          isValid = typeof value === 'undefined' ||
            value === 'true' ||
            value === 'false';
          return isValid;
        });
        if (!isValid) {
          return `Value ${value} for option ${property} is not a valid boolean`;
        }

        return true;
      }
    );
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    const data: any = {
      memberSettings: {}
    };
    TeamsMemberSettingsSetCommand.props.forEach(p => {
      if (typeof (args.options as any)[p] !== 'undefined') {
        data.memberSettings[p] = (args.options as any)[p] === 'true';
      }
    });

    const requestOptions: any = {
      url: `${this.resource}/v1.0/teams/${encodeURIComponent(args.options.teamId)}`,
      headers: {
        accept: 'application/json;odata.metadata=none'
      },
      data: data,
      responseType: 'json'
    };

    try {
      await request.patch(requestOptions);
    } 
    catch (err: any) {
      this.handleRejectedODataJsonPromise(err);
    }
  }
}

module.exports = new TeamsMemberSettingsSetCommand();